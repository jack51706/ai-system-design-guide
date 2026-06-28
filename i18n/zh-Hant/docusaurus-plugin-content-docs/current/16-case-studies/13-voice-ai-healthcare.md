# 案例研究：醫療照護領域的語音 AI 助理

## 問題

某醫院集團希望打造一套**語音型 AI 助理**，協助護理師記錄病患的看診過程。護理師以自然語言說話，AI 即時產生結構化的臨床記錄。

**面試中給定的限制條件：**
- 符合 HIPAA 規範（處理 PHI）
- 能在吵雜的醫院環境中運作
- 即時轉錄（延遲低於 500ms）
- 必須正確使用醫療術語
- 與既有的 EHR（Epic/Cerner）整合

---

## 面試題目

> 「設計一套語音助理，讓護理師可以在病患看診過程中對它說話，並在 EHR 中產生一份結構化的臨床記錄。」

---

## 解決方案架構

```mermaid
flowchart TB
    subgraph Capture["音訊擷取"]
        MIC[護理師的裝置] --> VAD[語音活動偵測]
        VAD --> STREAM[音訊串流]
    end

    subgraph Transcription["即時轉錄"]
        STREAM --> ASR[Whisper Large v3<br/>地端部署]
        ASR --> RAW[原始逐字稿]
    end

    subgraph Processing["臨床處理"]
        RAW --> DIARIZE[語者分離<br/>護理師 vs 病患]
        DIARIZE --> NER[醫療 NER<br/>症狀、藥物、生命徵象]
        NER --> STRUCTURE[記錄結構化<br/>GPT-4o]
    end

    subgraph Output["EHR 整合"]
        STRUCTURE --> REVIEW[護理師審閱畫面]
        REVIEW --> APPROVE{是否核可？}
        APPROVE -->|是| EHR[(Epic/Cerner<br/>透過 FHIR)]
        APPROVE -->|編輯| EDIT[護理師編輯]
        EDIT --> EHR
    end
```

---

## 關鍵設計決策

### 1. 為符合 HIPAA 採用地端 ASR

**解答：** PHI 在未經加密與 BAA 的情況下不得離開醫院網路。我們把 Whisper Large v3 部署在本地的 GPU 伺服器上，而非使用雲端 API：

| 選項 | 延遲 | HIPAA | 成本 |
|--------|---------|-------|------|
| 雲端 ASR（OpenAI） | 200ms | 需要 BAA，資料會離開網路 | $0.006/min |
| 地端 Whisper | 150ms | 完全掌控，資料不外流 | $0.002/min（GPU 攤提後） |

地端方案在延遲與合規性兩方面都勝出。

### 2. 語者分離：誰說了什麼

**解答：** 記錄必須區分「病患主訴頭痛」與「護理師觀察到病患面露痛苦」。我們採用：

```python
# Pyannote for speaker diarization
diarization = pipeline("audio.wav")
# Output: [(0.0, 1.5, "SPEAKER_0"), (1.5, 4.2, "SPEAKER_1"), ...]

# Map speakers based on voice profile
roles = identify_roles(diarization, known_nurse_voiceprint)
# Output: {"SPEAKER_0": "nurse", "SPEAKER_1": "patient"}
```

護理師的裝置會在設定時擷取其聲紋，以利角色辨識。

### 3. 用醫療 NER 進行結構化擷取

**解答：** 我們需要的是結構化資料，而不只是文字敘述。醫療 NER 會擷取出：

```mermaid
flowchart LR
    TRANSCRIPT["病患說她已經<br/>頭痛 3 天，<br/>服用了 Tylenol 500mg 兩次"]
    
    TRANSCRIPT --> NER[醫療 NER]
    
    NER --> SYMPTOMS[症狀：<br/>頭痛，持續 3 天]
    NER --> MEDS[藥物：<br/>Tylenol 500mg, BID]
    NER --> VITALS[生命徵象：未提及]
```

我們採用經過微調的 BioBERT 模型來做 NER，而不是用 LLM，因為 NER 必須快速且具確定性。

---

## 處理吵雜的環境

醫院很吵。我們採用多種策略：

1. 護理師裝置上的**指向性麥克風**聚焦於附近的語音
2. **抗噪 ASR 模型**（Whisper 是用含噪資料訓練的）
3. **信心門檻**：若 ASR 信心分數低於 0.7，我們會標記交由護理師審閱，而不是用猜的
4. **關鍵字偵測**：醫療術語有客製化的發音模型

---

## 結構化記錄格式

LLM 會產生 SOAP 格式的記錄：

```python
note_prompt = f"""
Generate a clinical SOAP note from this encounter transcript.

Transcript:
{transcript_with_speakers}

Extracted entities:
- Symptoms: {symptoms}
- Medications: {medications}
- Vitals: {vitals}

Output format:
S (Subjective): Patient's reported symptoms
O (Objective): Nurse's observations and measurements
A (Assessment): Clinical impression
P (Plan): Next steps, orders
"""
```

---

## EHR 整合（FHIR）

輸出必須是 EHR 可機器讀取的格式：

```json
{
  "resourceType": "DocumentReference",
  "status": "current",
  "type": {
    "coding": [{"system": "http://loinc.org", "code": "34117-2", "display": "History and physical note"}]
  },
  "subject": {"reference": "Patient/12345"},
  "author": [{"reference": "Practitioner/nurse789"}],
  "content": [{
    "attachment": {
      "contentType": "text/plain",
      "data": "base64-encoded-soap-note"
    }
  }],
  "context": {
    "encounter": {"reference": "Encounter/visit456"}
  }
}
```

---

## 延遲預算

| 階段 | 目標 | 實際 |
|-------|--------|--------|
| 音訊擷取到 VAD | 50ms | 30ms |
| ASR 轉錄 | 200ms | 150ms |
| 語者分離 | 100ms | 80ms |
| NER 擷取 | 50ms | 40ms |
| LLM 結構化 | 500ms | 450ms |
| **總計（端對端）** | **900ms** | **750ms** |

為了營造即時感，我們在串流部分逐字稿的同時，讓 NER 與 LLM 針對已完成的句子進行處理。

---

## 面試延伸問題

**問：你如何處理醫療縮寫與行話？**

答：我們維護一份客製化的詞彙清單，把縮寫（PRN、BID、SOB）對應到完整術語。這份清單會同時注入 ASR 模型（以提升辨識率）以及 LLM 提示（以在記錄中正確展開）。

**問：如果護理師在句子中途做了更正怎麼辦？**

答：我們會偵測更正模式（「其實，我是說……」、「不對，等等，應該是……」），並只採用更正後的版本。我們會指示 LLM 在出現衝突時優先採用較後面的陳述。

**問：你如何確保 AI 不會漏掉關鍵資訊？**

答：我們有一個「完整性檢查」，會驗證記錄是否包含所有擷取到的實體。如果 NER 找到了「胸痛」但 SOAP 記錄中沒有提到，我們就會標記交由護理師審閱。我們也會執行一個「安全關鍵」偵測器，針對自殺意念、虐待，或其他依法須通報的觸發情況，將其提報升級處理。

---

## 面試重點整理

1. **醫療照護採地端**：HIPAA 往往要求在本地進行處理
2. **語者分離不可或缺**：誰說了什麼在臨床上很重要
3. **混合式擷取**：用快速的 NER 做結構化，用 LLM 做文字敘述生成
4. **務必保留人工審閱**：尤其是在臨床文件記錄上

---

*相關章節：[模型分類](../02-model-landscape/01-model-taxonomy.md)、[可靠性模式](../13-reliability-and-safety/03-reliability-patterns.md)*
