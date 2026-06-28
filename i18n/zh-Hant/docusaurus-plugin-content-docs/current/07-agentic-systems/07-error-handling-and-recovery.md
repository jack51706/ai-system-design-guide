# 錯誤處理與復原

代理會以非確定性的方式失敗。錯誤處理已經從「Try-Catch 區塊」演進為**代理式自我修正（Agentic Self-Correction）**與**具狀態的回滾（Stateful Rollbacks）**，而像 LangGraph 與 Microsoft Agent Framework 這類框架，已原生提供 checkpoint/resume 的基本元件。

## 目錄

- [代理失敗的分類](#fail-types)
- [自我修正迴圈](#correction)
- [具狀態的回滾（Checkpointing）](#rollbacks)
- [「卡在迴圈裡」的修復方法](#stuck)
- [優雅降級](#degradation)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 代理失敗的分類

1. **幻覺工具（Hallucinated Tools）**：呼叫一個根本不存在的工具。
2. **schema 違規（Schema Violation）**：傳遞錯誤的引數給一個真實存在的工具。
3. **環境錯誤（Environment Error）**：工具存在，但外部 API 掛掉了。
4. **邏輯停滯（Logical Stall）**：代理重複執行同一個會失敗的動作（即 ReAct 的死亡迴圈，The ReAct Loop of Death）。

---

## 自我修正迴圈

現在錯誤被視為**資訊的 token（Tokens of Information）**。

- **模式（Pattern）**：當一個工具失敗時，錯誤訊息「不會」只是被記錄下來；它會被當成提示回饋給模型：*「動作失敗，錯誤為：X。請反思為什麼會發生這種情況，並提供一個替代策略。」*
- **推理模型（Reasoning Models）**（Claude Opus 4.7 extended thinking、GPT-5.5 reasoning、DeepSeek-R2）：這些模型在這方面表現出色，因為它們會在隱藏的 Chain-of-Thought 過程中「內化」錯誤，進而帶來高得多的一次性復原率（one-shot recovery rate）。

---

## 具狀態的回滾（Checkpointing）

對於長時間運行的代理而言，第 9 步發生的錯誤不應該讓整個專案崩潰。

- **檢查點（Checkpoints）**：高可靠度的系統（使用 LangGraph 或類似框架）會在每次成功的工具呼叫之後，把「狀態快照（State Snapshot）」存進資料庫。
- **回滾（The Rollback）**：如果代理進入邏輯停滯，監督代理（supervisor agent）可以把**共享狀態（common-state）重設**回第 5 步，也就是上一個「安全（Safe）」狀態，並強制走一條不同的路徑。

---

## 「卡在迴圈裡」的修復方法

無限迴圈是代理式系統中第一大的成本黑洞。

**解法**：**基於計數器的介入（Counter-Based Intervention）**。
1. 如果在同一個 session 中看到相同的 `(Tool, Args)` tuple 出現 3 次，編排器就會中斷模型。
2. 它會注入一個強制性的**「轉向指令（Pivot Instruction）」**：*「你已經嘗試搜尋『X』三次了。這條路是死路。你『必須』改用不同的工具，或者承認你卡住了。」*

---

## 優雅降級

如果高推理能力的代理（Claude Opus 4.7、GPT-5.5 reasoning）一直失敗，我們會退而求其次，採用：
- **簡化代理（Simplified Agent）**：一個較小的模型，搭配數量更少、更可靠的工具。
- **僅 RAG 模式（RAG-only Mode）**：停用所有動作，僅根據知識庫提供概念性的回答。
- **升級給真人（Human Escalation）**：（請見下一章）。

---

## 面試問題

### Q：為什麼傳統的「例外處理（Exception Handling，Try/Catch）」對代理式系統來說並不足夠？

**強答案：**
在傳統軟體中，例外是一個「停止」指令。但在代理式系統中，模型才是「駕駛員（Driver）」。如果系統只是停下來，使用者的任務就失敗了。我們改用**錯誤注入（Error Injection）**，而不是例外處理。我們在平台層級捕捉例外，並把它轉換成給模型的**合成觀察（Synthesized Observation）**。這讓模型能夠「推理」並繞過這次失敗。Try/Catch 只能修復程式碼；而錯誤注入則讓模型能夠修復**計畫（Plan）**。

### Q：你如何處理「靜默失敗（Silent Failures）」（也就是工具回傳 200 OK，但資料其實是錯的）？

**強答案：**
靜默失敗是最危險的。我們會實作**輸出驗證代理（Output Validation Agents）**。對於關鍵步驟，我們不會單純接受工具的輸出。我們會把輸出導向一個「驗證代理（Verifier Agent）」（通常是一個較小、較快的模型），它唯一的工作就是檢查：*「這個工具的輸出，是否真的回答了所提供的查詢？」* 如果驗證代理說「沒有」，它就會觸發一個自我修正迴圈，就好像這是一個硬性錯誤一樣。

---

## 參考資料
- LangGraph. "Persistence and Checkpointing" (2025)
- Shinn et al. "Reflexion: Learning from Errors" (2024 update)
- Microsoft. "Managing Hallucinations in Agentic Systems" (2025)

---

*下一篇：[Human-in-the-Loop 模式](08-human-in-the-loop-patterns.md)*
