# 預訓練基礎

預訓練是建構 LLM 過程中運算成本最高的階段，模型會在這個階段從大規模資料集學習通用知識與語言模式。

## 目錄

- [預訓練目標](#the-pretraining-objective)
- [資料課程與品質](#data-curriculum-and-quality)
- [擴展法則（推論最佳化）](#scaling-laws)
- [運算需求](#computational-requirements)
- [訓練穩定性](#training-stability)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 預訓練目標 {#the-pretraining-objective}

大多數現代 LLM 都是 **Decoder-only**，並使用 **因果語言建模（Causal Language Modeling, CLM）**：

```python
# Objective: Minimize Cross-Entropy Loss
Loss = -sum(log P(token_i | token_1, ..., token_{i-1}))
```

模型會根據上下文預測下一個 token。這個簡單的目標在足夠大的規模下，會帶來湧現出來的推理能力。

---

## 資料課程與品質 {#data-curriculum-and-quality}

關注重點已經從「更多資料」轉向「更好的課程」。

### 100T Token 的視野
前沿模型（Llama 4、GPT-5.5、Claude Opus 4.7、Gemini 3.1 Pro）的訓練資料量介於 15T 到 100T tokens。在這個規模下，**去重複（Deduplication）** 與 **品質過濾（Quality Filtering）** 是最主要的差異化因素。

### 資料配比標準
| 組成 | 百分比 | 用途 |
|-----------|------------|---------|
| 網頁（CommonCrawl） | 50-60% | 通用知識、多樣化的文體 |
| 程式碼（Github、StackOverflow）| 15-20% | **對邏輯與推理至關重要** |
| 書籍（Project Gutenberg） | 10% | 敘事連貫性、長上下文 |
| 學術（ArXiv、PubMed） | 10% | 專業技術知識 |
| 合成資料（模型生成） | 5-10% | 數學、邏輯與特定的指令路徑 |

**細節：「程式碼效應（Code Effect）」：**
研究顯示，在預訓練配比中提高程式碼的比例，可以透過教導結構化思考，提升模型在 **非程式** 推理任務（例如數學、邏輯謎題）上的表現。

---

## 擴展法則：訓練最佳化 vs. 推論最佳化

### Chinchilla 範式（2022-2024）
`Data Tokens (D) ≈ 20 * Parameters (N)`
以一個 70B 模型來說，這代表約需 1.4T tokens。

### 推論最佳化範式
現代模型（Llama 3、Llama 4）相對於 Chinchilla 是 **大幅過度訓練（heavily overtrained）** 的。
- **為什麼？**：訓練成本只付一次；推論成本卻要付數十億次。
- **結果**：小模型（8B）現在會用 15T 以上的 tokens 訓練，使它們的能力達到舊款 70B 模型的水準，但提供服務的成本卻便宜得多。

| 策略 | Token/參數比 | 最適合 |
|----------|-------------------|----------|
| Chinchilla | 20:1 | 研究／概念驗證 |
| **推論最佳化** | **200:1 到 500:1**| 生產環境部署 |

---

## 訓練穩定性 {#training-stability}

在「超大（Ultra）」規模（10 萬顆以上 GPU）下進行訓練，會面臨巨大的穩定性問題。

### 1. 損失尖峰（Loss Spikes）
損失突然飆升，可能毀掉整次訓練。
- **標準解法**：**定期檢查點（Periodic Checkpointing）** 與 **自動回滾（Automatic Rollbacks）**。
- **架構解法**：**殘差縮放（Residual Scaling）**（透過初始化權重，讓殘差分支從接近零的位置起步）。

### 2. 精度：FP8 vs BF16
- **BF16**：2023-2024 年的穩定性標準。
- **FP8**：目前的生產環境標準。由 H100/B200 原生支援，它能將記憶體用量減半、吞吐量加倍，同時透過 **隨機捨入（Stochastic Rounding）** 維持訓練穩定性。

---

## 面試問題 {#interview-questions}

### Q：如果 Chinchilla 說 160B tokens 才是最佳，為什麼還要用 15T tokens 去訓練一個 8B 模型？

**理想答案：**
Chinchilla 最佳化關注的是如何最有效運用一筆固定的 **訓練** 運算預算。然而在生產環境中，我們在意的是 **總體擁有成本（Total Cost of Ownership, TCO）**，而這主要由推論成本所主導。透過過度訓練一個小模型，我們把更多智慧「烘焙」進更少的參數裡。其結果是一個提供服務時效率明顯更高（更高的 TPS、更低的 VRAM）、卻仍維持前沿水準品質的模型。

### Q：LLM 預訓練中的「課程（curriculum）」是什麼？

**理想答案：**
課程指的是資料的順序與配比。一種常見的現代模式是：
1. **通用知識階段：** 占 80% 的 tokens（網頁、書籍）。
2. **推理聚焦階段：** 占 15% 的 tokens（程式碼、數學、邏輯）。
3. **高品質「降溫（Cooling）」階段：** 最後 1-5% 的 tokens 是品質極高、由人工精選或教科書等級的資料。這個「降溫」階段能幫助模型抖動更小，並在任何微調開始之前就更善於遵循指令。

---

## 參考資料 {#references}
- Kaplan et al. "Scaling Laws for Neural Language Models" (2020)
- Hoffmann et al. "Training Compute-Optimal Large Language Models" (Chinchilla, 2022)
- Meta AI. "The Llama 3/4 Herd of Models" (2024/2025)

---

*下一篇：[微調策略](02-fine-tuning-strategies.md)*
