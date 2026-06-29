# 提示最佳化（DSPy）

提示工程已經從「手動調校」時代邁向「程式化」時代。**DSPy（Declarative Self-improving Language Programs）** 是建構穩健 LLM 管線的事實標準，在這套框架中，提示是由演算法自動最佳化的。3.x 系列（DSPy 3.1.3 於 2026 年 2 月 5 日發布，後續修補版本一路推出到 2026 年 5 月）帶來了與原生推理模型更緊密的整合，以及更乾淨的非同步執行環境。

## 目錄

- [DSPy 哲學：程式化 vs. 提示](#philosophy)
- [Signatures 與 Modules](#signatures-modules)
- [Teleprompters（最佳化器）](#optimizers)
- [「提示即權重」的類比](#prompt-as-weight)
- [指標驅動的最佳化](#metrics)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## DSPy 哲學：程式化 vs. 提示 {#philosophy}

在傳統提示中，更換模型（例如從 GPT-5.5 換成 Claude Sonnet 4.6 或 Llama 4）需要重寫你所有的提示。
**DSPy 把邏輯與格式分離開來。**

- **邏輯**：由 **Modules** 定義（例如 ChainOfThought、ReAct）。
- **最佳化**：系統會自動為某個*特定*模型找出最佳的提示與範例，以實現該邏輯。

---

## Signatures 與 Modules {#signatures-modules}

你不用撰寫提示，而是定義一個 **Signature**：輸入是什麼，以及輸出應該是什麼。

```python
# Signature pattern
class MultiHopQA(dspy.Signature):
    """Answer questions that require multiple context retrievals."""
    context = dspy.InputField()
    question = dspy.InputField()
    answer = dspy.OutputField(desc="A concise 1-sentence answer")

# Logic is handled by a Module
qa_system = dspy.ChainOfThought(MultiHopQA)
```

---

## Teleprompters（最佳化器） {#optimizers}

Teleprompters 是會反覆迭代你的程式以提升準確度的演算法。
1. **BootstrapFewShot**：自動為你的提示找出高品質的範例。
2. **MIPROv2**：一種貝氏最佳化器，會嘗試不同的指令措辭，並選出能讓你的分數最大化的那一個。在 3.x 系列中，它依然是旗艦級的最佳化器。

**為什麼這很重要**：你不再需要猜測「Be helpful」還是「Think carefully」哪個比較好。最佳化器會用資料證明給你看。

---

## 「提示即權重」的類比 {#prompt-as-weight}

在 DSPy 中，你的提示就像神經網路中的一個權重。你不會「寫死」權重，而是去訓練它們。
- 如果你更換了模型，你只要**重新編譯**（重新訓練）你的程式即可。最佳化器會找出新模型更能理解的新 few-shot 範例。

---

## 指標驅動的最佳化 {#metrics}

最佳化需要一個**指標**（一個會回傳分數的函式）。
- **Exact Match（完全比對）**：`prediction.answer == target.answer`
- **LLM-as-Judge（以 LLM 當評審）**：用一個較大的模型（Claude Opus 4.7、GPT-5.5 reasoning）來為一個較小模型（Llama 4 8B、Claude Haiku 4.5）的輸出評分。

---

## 面試問題 {#interview-questions}

### Q：DSPy 如何解決提示工程的「脆弱性」？

**理想答案：**
DSPy 把「格式化」與「接地」的複雜度從人類身上移開，交給編譯器處理。當我們手寫提示時，我們實際上是在「寫死」一套只適用於某個特定模型、某個特定時間點的行為（即時點調校）。如果那個模型被更新或被替換，提示就會壞掉。DSPy 把提示視為一個可學習的參數。藉由定義清楚的 **Signature** 與**指標**，我們讓系統能透過數千次模擬迭代去「搜尋」出最有效的提示，使最終系統對模型變動更具韌性。

### Q：在 DSPy 的脈絡下，什麼是「Teleprompter」？

**理想答案：**
Teleprompter 是一個程式化的最佳化器。它的工作是接收一個 DSPy 程式（可能是一條由多個模組組成的複雜鏈）以及一小組訓練範例，然後把它們「編譯」成一個最佳化過的版本。它的做法是產生可能的「思考模式」與範例，拿這些去對照指標進行測試，再選出最有效的那些。簡而言之，Teleprompter 就是提示工程世界裡的「梯度下降」。

---

## 參考資料 {#references}
- Khattab et al. "DSPy: Compiling Declarative Language Models" (2023/2024)
- Stanford NLP. "DSPy Documentation and Tutorials" (2025)

---

*下一篇：[提示注入與防禦](08-prompt-injection-defense.md)*
