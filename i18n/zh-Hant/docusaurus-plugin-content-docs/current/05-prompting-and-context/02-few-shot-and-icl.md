# Few-Shot 與上下文學習（ICL）

上下文學習（In-Context Learning，ICL）是指 LLM 只要在提示中看到範例，就能學會一項新任務，而完全不需要更新權重的能力。把 ICL 的效率最大化，是維持提示穩定性的關鍵槓桿。

## 目錄

- [Few-Shot 範例的剖析](#anatomy)
- [需要幾個範例？](#how-many)
- [動態範例選擇](#dynamic-selection)
- [標註細緻度的重要性](#labelling)
- [進階 ICL：類比與「輕量再訓練」](#advanced-icl)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## Few-Shot 範例的剖析 {#anatomy}

一個高品質的範例由三個部分組成：
1. **輸入（Input）**：一份貼近真實的潛在使用者資料樣本。
2. **推理（Reasoning，選用）**：簡短說明輸出為什麼會是這個結果。
3. **輸出（Output）**：「黃金標準（Gold Standard）」的結果。

```markdown
User: "The weather is okay, but the flight was late."
Reasoning: The user is neutral about the weather but negative about the service.
Sentiment: Mixed
```

---

## 需要幾個範例？ {#how-many}

| 模型規模 | 最佳區間 | 擴展行為 |
|------------|------------|------------------|
| **小型（8B）** | 5 - 10 | 增益會持續到約 20 個範例。 |
| **中型（70B）**| 3 - 5 | 很早就進入高原期；範例越多，延遲越高。 |
| **前沿（405B）**| 1 - 2 | 能力極強；通常靠「遵循指令（Instruction Following）」就足夠。 |

**經驗法則**：如果你需要超過 20 個範例才能得到穩定的輸出，那麼這項任務對模型來說很可能太過複雜，或者你應該考慮改用**微調**。

---

## 動態範例選擇 {#dynamic-selection}

在生產環境的 RAG 或分類任務中，不要對每位使用者都套用同一組靜態範例。
**動態模式：**
1. 使用者提供一段查詢。
2. 在「黃金範例的向量資料庫（Vector DB of Gold Examples）」中搜尋出 3 個**語意上最相似**的案例。
3. 把這 3 個特定案例注入提示中。

**結果**：準確度會大幅提升，因為模型看到的是與當前使用者相關的「在地」模式。

---

## 標註細緻度的重要性 {#labelling}

前沿模型對範例中的**分布偏差（Distribution Bias）**非常敏感。
- 如果你提供 5 個「正面」範例和 1 個「負面」範例，模型就會偏向「正面」。
- **修正方式**：永遠採用**標籤平衡（Label Balancing）**。確保你的 few-shot 範例大致反映預期的輸出分布，或者達到完美平衡（1:1）。

---

## 進階 ICL：類比與「Few-Shot CoT」

**類比提示（Analogy Prompting）**：與其說「做 X」，不如提供一個類比。
「翻譯這段程式碼，就像譯者把一首詩從法文搬到英文那樣，保留靈魂（邏輯）但改變語法。」

**Few-Shot CoT**：提供 2 個推理過程明確寫出來的範例。這會「引導（prime）」模型的注意力去聚焦在邏輯上，而不是只去模仿輸出的字串。

---

## 面試問題 {#interview-questions}

### Q：為什麼不乾脆把我們手上全部 50 個範例都放進提示裡？

**強而有力的回答：**
主要有三個原因：
1. **上下文視窗延遲**：每個範例都會增加 token，拉長「預填（Prefill）」時間，也提高每次請求的成本。
2. **注意力稀釋**：即使有 128k 上下文，當特定限制被埋在過多無關資料底下時，模型仍可能「弄丟」這些限制（也就是「中間迷失（lost-in-the-middle）」效應）。
3. **過度擬合（Overfitting）**：提供太多狹隘的範例，可能導致模型過度嚴格地模仿範例的*格式*，反而喪失了處理該範例集以外邊緣案例的通用能力。

### Q：上下文學習中的「標籤偏差（Label Bias）」是什麼？

**強而有力的回答：**
標籤偏差是指：模型之所以更頻繁地預測某個特定標籤，純粹是因為這個標籤在 few-shot 範例中出現得比較多，或者因為它出現在清單的最後面。標準的緩解做法有：
1. 針對不同請求打亂範例的順序。
2. 確保正面／負面／中性樣本的數量相等。
3. 在提示開發階段使用「排列測試（Permutation Testing）」，以確保模型回應的是內容，而不是順序。

---

## 參考資料 {#references}
- Brown et al. "Language Models are Few-Shot Learners" (2020)
- Min et al. "Rethinking the Role of Demonstrations: What Makes In-Context Learning Work?" (2022)

---

*下一篇：[Chain-of-Thought](03-chain-of-thought.md)*
