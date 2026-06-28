# 思維鏈（Chain-of-Thought, CoT）

思維鏈（CoT）是一種引導 LLM 在給出最終答案前先生成中間推理步驟的技術。它已經從一句簡單的提示語，演變成推理模型的核心架構特性（o1、DeepSeek-R2、具備延伸思考的 Claude Opus 4.7、具備延伸思考的 GPT-5.5）。

## 目錄

- [思維鏈革命](#cot-revolution)
- [Zero-Shot 與程式化 CoT 的比較](#zero-vs-programmatic)
- [「思考型」模型的崛起（o1、DeepSeek-R1）](#thinking-models)
- [自我修正與驗證](#self-correction)
- [CoT 何時會失效（過度思考）](#over-thinking)
- [面試題](#interview-questions)
- [參考資料](#references)

---

## 思維鏈革命

標準的 LLM 是「下一個 token 的預測器」。對於複雜的數學或邏輯問題，單次推論往往不夠。CoT 為模型提供了一塊「草稿板」（工作記憶），讓它能逐步解決子問題。

**公式**：`Input -> Reasoning (Chain) -> Output`

---

## Zero-Shot 與程式化 CoT 的比較

| 技術 | 觸發語 | 效率 | 使用情境 |
|-----------|----------------|------------|----------|
| **Zero-Shot CoT** | 「Let's think step by step.」 | 高 | 臨時性的查詢。 |
| **Few-Shot CoT** | （提供帶有邏輯的範例） | 穩定性更高 | 生產環境的管線。 |
| **程式化 CoT** | 「1. 分析 X。2. 驗證 Y。3. 解決 Z。」 | **最適合代理使用** | 複雜的多工具任務。 |

---

## 「思考型」模型的崛起

像是 **OpenAI o1／GPT-5.5 延伸思考**、**DeepSeek-R2** 與 **Claude Opus 4.7** 這類模型，已經透過強化學習（RL）把 CoT「內建」進模型之中。

1. **系統層級的 CoT**：模型不只是把推理「印出來」，它擁有一個專屬的「思考視窗」。
2. **隱藏式 CoT**：在許多企業版本中，推理鏈對使用者是隱藏的，但系統可以加以驗證，以防止提示注入或「思路外洩」。
3. **擴展定律**：這些模型遵循 **推論擴展定律**，它們「思考」得越久，就越能解決困難的問題（只要時間充足，$o1$ 能解出金牌等級的 IMO 數學題）。

---

## 自我修正與驗證

生產環境的管線不再只信任單一條思維鏈。它們會疊加 **自我驗證** 機制。

```markdown
# Process
1. Generate Answer A via CoT.
2. Critique: "Are there any errors in the logic above?"
3. If errors: "Correct the logic and provide Answer B."
```

**細節**：這項做法如今已整合進用於程式撰寫的 **執行驗證式 CoT（Execution-Verified CoT）**，模型會先寫出邏輯、執行程式碼，並在程式碼失敗時自我修正。

---

## CoT 何時會失效（過度思考）

CoT 並非萬靈丹。對於簡單的任務，它會帶來：
1. **延遲**：token 越多 = 回應越慢。
2. **成本**：你要為每一個「思考」token 付費。
3. **過度思考**：模型可能會在根本不存在複雜度的地方臆造出複雜度（例如用三段文字解釋為什麼 2+2=4）。

---

## 面試題

### Q：為什麼 CoT 能提升數學文字題的表現？

**優秀的回答：**
CoT 之所以能提升表現，是因為它讓模型的運算複雜度與任務的邏輯複雜度相互對齊。在標準的單次生成中，模型必須僅依據有限的局部資訊，去預測最終答案的 token。有了 CoT，模型會把問題「拆解」成更小的、自回歸式的步驟。每個步驟都以前一個步驟的輸出作為上下文，讓模型的注意力機制能一次只專注在一個子問題上（例如先把蘋果加起來，再把柳橙減掉），藉此降低單次預測時的「認知負荷」。

### Q：在延遲至關重要的生產環境中，你會如何處理 CoT？

**優秀的回答：**
我們會採用 **混合推理架構（Hybrid Reasoning Architecture）**：
1. **第一層（快速）**：用一個分類器判斷該查詢是否需要深度推理。
2. **第二層（精簡 CoT）**：我們會用「推理時請保持精簡」這類提示來引導模型，或者運用「知識蒸餾」，訓練一個較小的模型，讓它在受益於教師模型 CoT 風格預訓練的同時，*只* 輸出最終答案。
3. **第三層（串流）**：我們會把 CoT 串流給使用者（若採透明做法），或串流給背景程序，讓系統能在最終結果逐步浮現時就開始進行「預先處理」。

---

## 參考資料
- Wei et al. "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models" (2022)
- Wang et al. "Self-Consistency Improves Chain of Thought Reasoning in Language Models" (2023)
- OpenAI. "Learning to Reason with LLMs" (2024)

---

*下一篇：[Tree-of-Thought](04-tree-of-thought.md)*
