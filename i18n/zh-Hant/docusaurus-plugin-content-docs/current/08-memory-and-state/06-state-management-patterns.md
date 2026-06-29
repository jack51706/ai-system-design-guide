# 狀態管理模式

AI 系統中的狀態管理已經從單純的「sessions」演進為**有狀態的代理圖（Stateful Agent Graphs）**。管理代理「心智」的流動與持久化，與 LLM 本身同樣關鍵，這也是 LangGraph 成為 LangChain 所建構代理之預設控制流程執行環境的主要原因之一。

## 目錄

- [狀態物件](#state-object)
- [狀態機 vs. DAG 編排](#orchestration)
- [檢查點與續跑](#checkpointing)
- [平行狀態與 Fork/Join](#parallel)
- [時光回溯（狀態改寫）](#time-travel)
- [面試題](#interview-questions)
- [參考資料](#references)

---

## 狀態物件 {#state-object}

「狀態（State）」是一個代理 session 的**單一事實來源（Single Source of Truth）**。
```python
class AgentState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
    plan: list[str]
    current_task: str
    tool_results: dict[str, Any]
    user_context: dict[str, Any]
    iteration_count: int
```
**最佳實務**：狀態應盡可能採用**嚴格型別（Strictly Typed）**且**僅可附加（Append-Only）**，以防在長時間執行迴圈中發生資料遺失。

---

## 狀態機（LangGraph）

業界已收斂到**循環圖（Cyclic Graphs）**（即狀態機）。
- **節點（Nodes）**：接收狀態並回傳更新的函式。
- **邊（Edges）**：根據狀態值決定下一個節點的條件邏輯（例如 `if state['error'] -> goto 'recovery_node'`）。

---

## 檢查點與續跑 {#checkpointing}

在生產環境中，代理可能會執行數分鐘甚至數小時。
- **持久化層（Persistence Layer）**：每一次狀態更新都會儲存到資料庫（Postgres/Redis）。
- **韌性（Resiliency）**：若伺服器當機，編排器會取回最後的 `checkpoint_id`，並從中斷的確切位置續跑。
- **使用者體驗（UX）**：這讓**非同步代理（Asynchronous Agents）**成為可能，使用者會先收到一則「我正在處理」的訊息，並在 10 分鐘後當狀態變為「完成」時收到通知。

---

## 平行狀態（Fork/Join）

對於複雜的任務，我們會將狀態進行 **Fork**。
1. **扇出（Fan-out）**：把狀態送往 3 個子代理（例如研究員 A、B、C）。
2. **扇入（Fan-in / Join）**：一個「Manager」代理接收這三者的輸出，並將其合併回主狀態物件。

---

## 時光回溯（狀態改寫） {#time-travel}

如同 HITL 章節所述，狀態管理讓**人為介入（Human Intervention）**成為可能。
- 開發者可以瀏覽 session 歷史，找出某個「壞掉的回合」，在該特定時間戳記編輯狀態物件，並從該點**重新執行（Re-run）**整張圖。

---

## 面試題 {#interview-questions}

### Q：為什麼代理要用「基於圖（Graph-based）」的狀態機（LangGraph），而不是單純的「While 迴圈」？

**強力回答：**
While 迴圈是**不透明且脆弱的（Opaque and Brittle）**。你無法輕易地把邏輯視覺化，而錯誤處理會淪為一團巢狀的 if 判斷。基於圖的做法則是**可觀測且模組化的（Observable and Modular）**。你可以把整個流程視覺化（成一張 Mermaid 圖）、對個別節點做單元測試，並且只要新增幾條邊，就能實作「回溯（Backtracking）」或「平行執行（Parallel execution）」等複雜功能。它也讓**狀態持久化（State Persistence）**變得輕而易舉，因為框架會處理節點之間的儲存／載入。

### Q：在長時間執行的代理 session 中，你如何防止「狀態膨脹（State Bloat）」？

**強力回答：**
我們會採用**狀態修剪（State Pruning）**與**訊息摘要（Message Summarization）**。與其把整個 `tool_results` 字典帶著走遍整張圖，我們會在某個子任務完成後就將其修剪掉。對於 `messages` 列表，我們會使用一個專門的「摘要節點（Summarizer Node）」，每 10 個回合執行一次，把歷史壓縮成簡潔的上下文區塊，確保我們不會撞到 token 上限，同時維持狀態物件的輕量與反應速度。

---

## 參考資料 {#references}
- LangChain. "LangGraph: Multi-Agent Workflows" (2024/2025)
- Temporal.io. "Stateful AI Agents at Scale" (2025)
- AWS Bedrock. "Managing Long-Running Agent Sessions" (2025)

---

*下一篇：[第 09 章：框架與工具](../09-frameworks-and-tools/01-langchain-deep-dive.md)*
