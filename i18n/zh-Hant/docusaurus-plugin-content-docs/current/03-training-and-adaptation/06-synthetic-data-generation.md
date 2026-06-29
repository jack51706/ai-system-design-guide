# 合成資料生成

業界已經撞上「資料牆」（Data Wall），也就是網路上高品質人類文本已被耗盡。合成資料如今成為模型改進的主要引擎，位居每一套現代前沿模型訓練配方的核心。

## 目錄

- [資料牆與合成資料的轉向](#synthetic-shift)
- [Evol-Instruct 模式](#evol-instruct)
- [Constitutional AI 與自我修正](#constitutional-ai)
- [可驗證的合成資料（數學／程式碼）](#verifiable-data)
- [去偏見與多樣性](#diversity)
- [面試題](#interview-questions)
- [參考資料](#references)

---

## 越過「資料牆」之後：合成資料的轉向

前沿模型（Llama 4、GPT-5.5、Claude Opus 4.7、Gemini 3.1 Pro）是以 100T 以上的 token 訓練而成。光靠人類文本根本不足以支撐這樣的規模擴展。
**現實狀況：** 前沿微調的訓練資料混合中，已有超過 **50% 是合成資料**（預訓練則約佔 10%）。

| 來源 | 人類資料 | 合成資料 |
|--------|------------|----------------|
| **數量** | 固定（有限） | 無限 |
| **品質** | 不一（含雜訊） | 可控（已純化） |
| **成本** | 高（人工標註者） | 便宜（推論／GPU） |
| **偏見** | 反映整個網路 | 可人工調整平衡 |

---

## Evol-Instruct 模式 {#evol-instruct}

Evol-Instruct 是一個遞迴流程，由 LLM 拿一條簡單的指令，將其演化成更複雜的指令。

**演化方向：**
1. **廣度（Breadth）**：增加任務的數量。
2. **深度（Depth）**：加入限制條件、複雜化因素，或多步驟邏輯。
3. **去雜訊（De-noising）**：整理措辭，去除那些「AI 腔」（AI-isms）。

```python
# Simple Instruction: "Write a function to add two numbers."
# Evolved Instruction: "Write a thread-safe Python class that performs 
# matrix addition with error handling and unit tests, adhering to PEP8."
```

---

## Constitutional AI 與 AI 回饋（RLAIF）

RLAIF 由 Anthropic 開發，並已廣泛被業界採用，它使用一部「憲法」（Constitution，一組規則）來引導模型評估並改進自己產生的資料。

**循環流程：**
1. **提案（Propose）**：模型 A 生成一個回應。
2. **批判（Critique）**：模型 B（憲法評審）依據準則找出缺陷。
3. **修訂（Revise）**：模型 A 根據批判產出更好的版本。
4. **訓練（Train）**：最終的（Prompt, Revise）配對被加入 SFT 資料集。

---

## 可驗證的合成資料

合成資料最大的風險是 **模型崩潰**（Model Collapse，模型學到自己的錯誤）。
**2025 年的解法**：聚焦在那些不需要 LLM 就能驗證「真值」的領域。

- **數學**：使用形式化驗證（Lean／Isabelle）或 Python 執行來驗證答案。
- **程式碼**：拿生成的程式碼跑測試案例（單元測試）。
- **RAG**：使用「黃金上下文」（Gold Context）來生成問題，使答案明確就存在於文本之中。

---

## 去偏見與多樣性 {#diversity}

合成資料被用來「填補」人類資料中的缺口。
- **語言**：透過翻譯概念性範本，為低資源語言（例如 Swahili、Marathi）生成高品質文本。
- **邏輯**：為某個特定的邏輯謬誤建立 1,000,000 種變體，以「強化」（harden）模型抵抗該謬誤的能力。

---

## 面試題 {#interview-questions}

### Q：在合成資料上訓練時，「模型崩潰」的風險是什麼？

**好的回答：**
當模型被拿來在「由自身較早版本所生成的資料」上訓練時，就會發生模型崩潰。由於模型的分布比真實世界更狹窄（它對特定詞彙與模式有偏好／偏見），訓練循環就變成一個由錯誤與平庸構成的「正回饋迴路」。到 2025 年，我們以下列方式緩解這個問題：
1. 混入 5-20% 的「黃金級」人類驗證資料。
2. 使用「可驗證」的獎勵（數學／程式碼），讓錯誤永遠不會被學到。
3. 使用更強大的「教師」（Teacher）模型，為「學生」（Student）模型生成資料。

### Q：你如何確保一個 1,000 萬列合成資料集的*品質*？

**好的回答：**
我們使用一套 **多階段過濾管線**：
1. **語意去重（Semantic Deduplication）**：使用嵌入來移除近乎相同的群集。
2. **LLM-as-Judge**：抽樣 1% 的資料，讓更強的模型（例如 GPT-5.2）針對邏輯與安全性評分。
3. **困惑度過濾（Perplexity Filtering）**：使用一個小模型計算文本的困惑度。若數值過高（胡言亂語）或過低（重複／過於簡單），就予以丟棄。
4. **可驗證執行（Verifiable Execution）**：若資料包含程式碼或數學，它必須通過本地編譯器／直譯器的檢查。

---

## 參考資料 {#references}
- Xu et al. "WizardLM: Empowering Large Language Models to Follow Complex Instructions" (2023)
- Bai et al. "Constitutional AI: Harmlessness from AI Feedback" (2022)
- OpenAI. "Weak-to-Strong Generalization" (2023)

---

*下一篇：[量化深入剖析](07-quantization-deep-dive.md)*
