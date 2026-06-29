# LangGraph 編排

LangGraph 是建構具狀態、多代理系統的**事實標準**。它在 2025 年底達到 v1.0，並在 2026 年初因企業採用其圖形化執行環境（graph-based runtime），在 GitHub 星數上超越了 CrewAI。與單純的鏈（chains）不同，LangGraph 允許**循環（Cycles）**、**狀態持久化（State Persistence）**以及**人類介入（Human-in-the-Loop）**的干預。

## 目錄

- [圖形哲學](#philosophy)
- [循環式與非循環式工作流程](#cyclic)
- [LangGraph 中的狀態管理](#state)
- [持久化與檢查點](#persistence)
- [多代理編排模式](#multi-agent)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 圖形哲學 {#philosophy}

在 2023 年，代理是「黑盒子」。
今天，代理是**圖形（Graphs）**。
一張圖由以下部分組成：
- **節點（Nodes）**：Python 函式（LLM、工具，或資料處理）。
- **邊（Edges）**：節點之間的路徑。
- **條件邊（Conditional Edges）**：根據**狀態（State）**決定路徑的邏輯。

---

## 循環式與非循環式

標準的 LangChain 是**非循環的（Acyclic）**（循序執行）。
LangGraph 是**循環的（Cyclic）**。
- **循環的威力**：代理可以嘗試使用某個工具、看到錯誤，然後**循環回到**「思考」節點再試一次。這是 **ReAct** 模式的基礎。

---

## 狀態管理

**狀態結構（State Schema）**是圖形的「心智」。
```python
class GraphState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
    plan: list[str]
    is_secure: bool
```
**細微之處**：搭配 `add_messages` 使用 `Annotated`，可以讓圖形**附加（Append）**到歷史記錄，而非覆寫它，藉此保留完整的推理軌跡。

---

## 持久化與檢查點 {#persistence}

目前的 LangGraph 使用**以執行緒為基礎的持久化（Thread-based Persistence）**。
- **概念**：每個工作階段都有一個 `thread_id`。
- **優勢**：如果使用者在 2 天後回來，代理會記得它在多步驟工作流程中所處的確切位置。
- **時光旅行（Time-Travel）**：開發者可以從先前的某個狀態「重新執行」特定執行緒，以便對失敗進行除錯。

---

## 多代理模式

| 模式 | 說明 | 案例研究 |
|---------|-------------|------------|
| **Supervisor（監督者）** | 一位「管理者」指揮專門的工作者。 | 研究團隊 |
| **Peer-to-Peer（點對點）**| 代理彼此之間直接交接任務。 | 客戶支援 |
| **Hierarchical（階層式）**| 圖中有圖（巢狀圖形）。 | 企業工程 |

---

## 面試問題 {#interview-questions}

### Q：為什麼要使用 LangGraph，而不是 OpenAI 的「Assistant API」？

**強而有力的回答：**
**控制權與可攜性**。Assistant API 是個黑盒子：你看不到確切的提示，也無法控制邏輯閘。LangGraph 則是**白盒框架（White Box framework）**。我可以使用任何模型（OpenAI、Claude、Llama 3.3）、精確控制工具何時被呼叫，並在各步驟之間注入我自己的自訂驗證邏輯。更重要的是，LangGraph 是**開源（Open Source）**的，可以在本機或地端（on-prem）執行，這對許多企業的安全需求來說至關重要。

### Q：在一個有 20 個以上節點的圖形中，你如何處理「狀態超載（State Overload）」？

**強而有力的回答：**
我們使用**狀態收斂（State Narrowing）**。我們不會把整個全域狀態傳遞給每個節點，而是為子圖（sub-graphs）定義專門的子狀態。我們也會使用 **Trim Runnables** 在訊息歷史進入 LLM 之前進行修剪，確保不浪費 token，同時把「真相」保留在持久化層中。

---

## 參考資料 {#references}
- LangChain Team. "LangGraph: Multi-Agent Workflows at Scale" (2025)
- Anthropic. "Building Resilient Agents with State Machines" (2025)
- OpenSource AI. "Cycles and the Future of Agency" (2024 Tech Report)

---

*下一篇：[LangSmith 可觀測性](03-langsmith-observability.md)*
