# 知識蒸餾

知識蒸餾（Knowledge Distillation）是把智慧從一個龐大、複雜的模型（「教師」，Teacher）轉移到一個更小、更高效的模型（「學生」，Student）的過程。這正是當今小型開放權重模型能展現遠超其參數規模表現的祕訣所在。

## 目錄

- [教師-學生範式](#teacher-student-paradigm)
- [蒸餾如何運作](#how-distillation-works)
- [特徵蒸餾 vs. 輸出蒸餾](#feature-vs-output)
- [從證明進行自我蒸餾（SDP）](#self-distillation-proof)
- [量化感知蒸餾](#quantization-aware-distillation)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 教師-學生範式

小型模型（例如 Llama 4 8B、Gemini 3.1 Flash、Claude Haiku 4.5）並不是單純用原始網路資料訓練出來的。它們是用一個遠遠更大的模型（例如 GPT-5.5、Claude Opus 4.7 或 Llama 4 405B）所生成或篩選的**合成資料**（Synthetic Data）來訓練的。

| 模型 | 角色 | 智慧來源 |
|-------|------|---------------------|
| **教師** | 大型（100B+ 參數） | 在 50T+ tokens 上進行預訓練 |
| **學生** | 小型（1B - 8B 參數） | 教師過濾後的邏輯／輸出 |

---

## 蒸餾如何運作

### 1. 硬標籤蒸餾（Hard Label Distillation）
學生從教師的最終預測中學習（例如某個問題的答案）。

### 2. 軟標籤蒸餾（溫度縮放，Temperature Scaling）
學生從教師的**機率分布**（Logits）中學習。這樣的資訊豐富得多，因為它不只告訴學生正確答案是什麼，還告訴它哪些錯誤答案其實「差一點就對了」。

```python
# Distillation Loss (KL Divergence):
Loss = KL_Div(Teacher_Logits / T, Student_Logits / T)
```
*其中 T 是溫度（Temperature，通常為 2.0 - 5.0）。*

---

## 特徵蒸餾 vs. 輸出蒸餾

### 輸出蒸餾（標準作法）
學生去匹配教師的文字回應。
- **優點**：透過 API 即可輕鬆實作。
- **缺點**：只學到行為的表層模式。

### 特徵／隱藏狀態蒸餾（Feature/Hidden State Distillation）
學生去匹配教師內部的**隱藏狀態**（向量表示）。
- **前提**：你必須能存取教師的權重（開放權重，Open Weights）。
- **優點**：學生學到的是教師的「內部概念地圖」，因此推理深度高出許多。

---

## 從證明進行自我蒸餾（SDP）

**推理能力的突破。**
像 o1、DeepSeek-R1 和 Claude Opus 4.7 這類模型，利用 SDP 在沒有新的人類資料下持續進步。

1. **生成**：模型針對一道困難的數學／程式題目，生成 100 個可能的解法。
2. **驗證**：一套以規則為基礎的系統（編譯器／計算機）找出其中那 1 個正確的解法。
3. **蒸餾**：模型在通往該正確解法的「思維鏈」（Chain of Thought，CoT）上進行微調。

**結果**：模型只保留高品質的推理路徑，藉此「對自己進行蒸餾」。

---

## 量化感知蒸餾

標準的量化（例如 16-bit 轉 4-bit）會造成準確率小幅下降。
**解法**：在量化過程*當中*運用知識蒸餾。讓 16-bit 模型擔任教師，引導 4-bit 模型把誤差降到最低。這正是現代 4-bit 模型能達到 16-bit 表現水準的方法。

---

## 面試問題

### 問：為什麼一個經過蒸餾的 8B 模型，會比一個用相同 tokens 從零開始訓練的 8B 模型更好？

**有力的回答：**
在原始網路資料上從零開始訓練（預訓練）是充滿雜訊的；模型會耗費大量的容量去學習如何在這些雜訊中找方向。然而，經過蒸餾的模型是用一份「純化過」的課程來訓練的。教師模型扮演高品質過濾器的角色，提供結構化的邏輯、清晰的解釋，以及更乾淨的語言分布。本質上，教師透過它的 logit 分布提供「提示」，明確告訴學生：語言中哪些特徵才是最重要、最該學的。

### 問：用 GPT-4o 當教師來蒸餾一個 Llama 學生，有哪些風險？

**有力的回答：**
1. **模型崩潰（Model Collapse）**：如果學生只看到教師的輸出，它可能會失去那條由創意或多元知識構成的「長尾」，只學到教師那套狹隘的偏好。
2. **授權違規（License Violations）**：大多數專有模型（OpenAI、Anthropic）都有條款，禁止用其輸出去訓練「競爭」模型。對於想用 API 輸出來蒸餾自家模型的企業而言，這是一大法律風險。
3. **語言上的模仿（Linguistic Mimicry）**：學生可能學會了把話*說*得很有自信（像教師一樣），實際上卻不具備同等的邏輯深度，導致出現有自信但卻錯誤的幻覺。

---

## 參考資料
- Hinton et al. "Distilling the Knowledge in a Neural Network" (2015)
- Gou et al. "Knowledge Distillation: A Survey" (2021)
- DeepSeek. "DeepSeek-R1: Incentivizing Reasoning Capability" (2025)

---

*下一篇：[合成資料生成](06-synthetic-data-generation.md)*
