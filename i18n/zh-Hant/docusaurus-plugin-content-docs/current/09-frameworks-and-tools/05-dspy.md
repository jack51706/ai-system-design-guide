# DSPy：為語言模型寫程式

**DSPy** 已成為高可靠度 AI 系統的業界參考標準。它代表了一種典範轉移，從「提示工程」（不斷試誤）轉向 **Prompt Compilation（提示編譯）**（自動化最佳化），而基準測試也一致顯示，相較於手工調整的提示，品質可提升 10 到 40%。

## 目錄

- [程式設計典範](#paradigm)
- [Signatures：描述任務](#signatures)
- [最佳化器與 MIPROv2](#optimizers)
- [斷言與約束](#assertions)
- [管理模型漂移](#model-drift)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 程式設計典範 {#paradigm}

DSPy 把 LLM 應用程式當成一個**神經網路**來看待。
- **Module（模組）**：可重複使用的邏輯區塊（例如 `ChainOfThought`）。
- **Signature（簽章）**：對模組功能的宣告式規格描述（輸入 -> 輸出）。
- **Optimizer（最佳化器）**：根據某個指標，為模組找出最佳「權重」（提示）的過程。

---

## Signatures：描述任務 {#signatures}

你不必再寫出一段 100 行的提示，而是寫一個 **Signature**：
```python
class ResearchAssistant(dspy.Signature):
    """Answer the question by synthesizing the provided web context."""
    context = dspy.InputField(desc="Scraped web content")
    question = dspy.InputField()
    answer = dspy.OutputField(desc="A technical summary with citations")
```
**致勝細節**：Signatures 是**與模型無關（Model-Agnostic）**的。你可以為 Claude Opus 4.7、Claude Sonnet 4.6、GPT-5.5、Gemini 3.1 Pro 或 Llama 4 8B 編譯它們，而完全不必更動任何一行程式碼。

---

## 最佳化器與 MIPROv2 {#optimizers}

**MIPROv2（Multi-stage Instruction PRoposal Optimizer，多階段指令提案最佳化器）**是 DSPy 的旗艦級最佳化器。
1. **指令提案（Instruction Proposal）**：由一個「助理模型」針對該任務，提出 10 到 20 種不同的系統提示寫法。
2. **貝氏最佳化（Bayesian Optimization）**：DSPy 拿這些提出的提示，在一個小型訓練集上執行，並用某個指標為它們評分。
3. **挑選（Selection）**：它會挑出能讓你的指標最大化的那個提示（例如 Factuality 分數）。

---

## 斷言與約束 {#assertions}

DSPy 同時支援**硬斷言與軟斷言（Hard and Soft Assertions）**。
- `dspy.Suggest(...)`：如果模型未通過某項檢查（例如「答案必須少於 50 個字」），DSPy 會**自動重新提示**該模型，並附上失敗原因，讓它自我修正。
- `dspy.Assert(...)`：如果違反了某項硬性約束（例如「不得包含 PII」），執行就會停止，並進入復原狀態。

---

## 管理模型漂移 {#model-drift}

當 OpenAI 或 Anthropic 釋出權重更新時，手工打造的提示往往會失效。
- **2025 年的解法**：有了 DSPy，你只需要**重新編譯（Re-compile）**。最佳化器會為更新後的模型架構找出新的「最佳」token，在不需人力投入的情況下維持一致性。

---

## 面試問題 {#interview-questions}

### Q：為什麼 DSPy 被視為「反提示工程（Anti-Prompt Engineering）」？

**優秀答案：**
因為它用一個**最佳化迴圈（Optimization Loop）**取代了**人工試誤迴圈（Manual trial-and-error loop）**。在提示工程中，人類就是那個最佳化器；而在 DSPy 中，人類則是**老師（Teacher）**。你定義*目標*（Signature）與*評估方式*（指標），並提供少數幾個*範例*。接著框架就會運用數學最佳化（例如貝氏搜尋）來找出統計上表現最好的 token。這使得整個系統遠比一堆寫死的字串庫更具**可攜性（Portable）**與**可擴展性（Scalable）**。

### Q：在生產環境中使用 DSPy 最大的缺點是什麼？

**優秀答案：**
**編譯延遲與成本（Compilation Latency and Cost）**。要編譯一條複雜的 DSPy 管線，你可能需要執行 100 到 500 次 LLM 呼叫，以測試不同的提示變體。這是一筆可觀的前期成本。不過，對一位 Staff 等級的工程師而言，這是一種**取捨（Tradeoff）**：你在開發或編譯時間上付出更多，以換取**有保障的可靠度（Guaranteed Reliability）**與更低的**執行期失敗率（Run-time Failure Rates）**。另一個挑戰是學習曲線；它要求你像一位 ML 研究員那樣思考，而不是像一位傳統開發者。

---

## 參考資料 {#references}
- Khattab et al. "DSPy: Compiling Declarative Language Model Calls" (2024/2025)
- Stanford NLP. "The MIPROv2 Technical Report" (2025)
- Databricks. "Productionizing Programmed Prompts" (2025)

---

*下一篇：[Semantic Kernel：企業級 AI](06-semantic-kernel.md)*
