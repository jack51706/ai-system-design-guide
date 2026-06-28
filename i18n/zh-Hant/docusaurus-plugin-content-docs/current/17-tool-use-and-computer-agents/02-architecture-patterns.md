# 工具使用代理的架構模式

2026 年的每一個工具使用代理，從 OpenClaw 到 Claude Code 再到 Cursor 的 Background Agents，都建立在少數幾種核心架構模式之上。理解這些模式，能讓你從第一性原理出發來設計代理，而不只是複製特定工具。本章會逐一拆解每種模式，搭配詳細的圖解、程式碼範例、取捨分析，以及何時該採用哪一種的指引。

## 目錄

- [模式 1：函式/工具呼叫](#pattern-1-functiontool-calling)
- [模式 2：基於視覺的自動化](#pattern-2-vision-based-automation)
- [模式 3：本地程式碼執行](#pattern-3-local-code-execution)
- [模式 4：多代理工具編排](#pattern-4-multi-agent-tool-orchestration)
- [沙箱化與非沙箱化執行](#sandboxed-vs-unsandboxed-execution)
- [跨工具呼叫的狀態管理](#state-management-across-tool-calls)
- [錯誤處理與重試模式](#error-handling-and-retry-patterns)
- [MCP 整合模式](#mcp-integration-patterns)
- [架構決策樹](#architecture-decision-tree)
- [系統設計面試切角](#system-design-interview-angle)
- [面試題目](#interview-questions)
- [參考資料](#references)

---

## 模式 1：函式/工具呼叫

這是生產環境中部署最廣泛的模式。LLM 決定要呼叫哪個工具以及帶什麼參數，框架負責執行該呼叫，結果再回饋到對話中供下一步推理使用。

### 架構

```
+-------------------------------------------------------------------+
|              Function/Tool Calling Pattern                        |
+-------------------------------------------------------------------+
|                                                                   |
|  +------------------+                                             |
|  |  User Message     |                                            |
|  +--------+---------+                                             |
|           |                                                       |
|           v                                                       |
|  +--------+---------+     +------------------+                    |
|  |  LLM Reasoning   |---->|  Tool Selection  |                   |
|  |                   |     |                  |                    |
|  |  "I need to look  |     |  tool: search_db |                   |
|  |   up the order"  |     |  args: {id: 42}  |                    |
|  +-------------------+     +--------+---------+                   |
|                                     |                             |
|                                     v                             |
|                            +--------+---------+                   |
|                            |  Tool Executor   |                   |
|                            |  (Framework)     |                   |
|                            |                  |                   |
|                            |  Validates args  |                   |
|                            |  Calls function  |                   |
|                            |  Returns result  |                   |
|                            +--------+---------+                   |
|                                     |                             |
|                                     v                             |
|                            +--------+---------+                   |
|                            |  Result Injected |                   |
|                            |  into Context    |                   |
|                            |                  |                   |
|                            |  {status: "shipped",                 |
|                            |   tracking: "1Z..."} |               |
|                            +--------+---------+                   |
|                                     |                             |
|                                     v                             |
|                            +--------+---------+                   |
|                            |  LLM Generates   |                   |
|                            |  Final Response  |                   |
|                            +------------------+                   |
+-------------------------------------------------------------------+
```

### 三個步驟的詳細說明

**步驟 1，Schema 呈現**：模型會收到一份描述可用工具的 JSON schema。在 2026 年，最佳實務是採用 Dynamic Manifests，根據使用者意圖只擷取相關工具，而不是一開始就載入所有工具 schema。

**步驟 2，意圖與擷取**：模型輸出一個結構化的工具呼叫。這不是自由格式的文字，而是一個帶有 `tool_name` 與 `arguments` 的 JSON 物件，框架可以對它做確定性的解析。

**步驟 3，執行與情境化**：框架驗證參數（使用 Pydantic、Zod 或類似工具），呼叫函式，並把結果以角色 `tool` 的新訊息形式注入回對話中。

### 程式碼範例：MCP Server + Client

```python
# MCP Server: defines a tool with strict schema
from mcp.server import Server
from pydantic import BaseModel, Field

server = Server("order-service")

class OrderLookup(BaseModel):
    """Look up an order by ID. DO NOT use for cancelled orders."""
    order_id: str = Field(..., description="The order UUID")

@server.tool()
async def lookup_order(args: OrderLookup) -> dict:
    order = await db.orders.find_one({"id": args.order_id})
    if not order:
        return {"error": "Order not found", "suggestion": "Check order ID format"}
    return {"status": order["status"], "tracking": order.get("tracking_number")}
```

```python
# MCP Client: agent discovers tools dynamically, calls them, feeds results back
tools = await mcp_client.list_tools()
response = client.messages.create(model="claude-sonnet-4-6", tools=tools,
    messages=[{"role": "user", "content": "Where is my order ORD-12345?"}])

if response.stop_reason == "tool_use":
    tool_call = response.content[0]
    result = await mcp_client.call_tool(tool_call.name, tool_call.input)
    # Feed result back as a tool_result message for the next LLM turn
```

### 何時使用此模式

- API 整合（資料庫、SaaS 工具、內部服務）
- 結構化資料的檢索與變更
- 任何你能事先定義工具介面的工作流程
- 需要稽核軌跡與輸入驗證的生產環境系統

### 取捨

| 優點 | 缺點 |
|-----------|--------------|
| 確定性執行 | 需要事先提供工具 schema |
| 易於稽核與記錄 | 無法與任意 UI 互動 |
| 快速（每次工具呼叫 50-200ms） | 模型可能對工具名稱/參數產生幻覺 |
| 適用於任何支援工具使用的 LLM | 工具一多就會造成 schema 過載 |

---

## 模式 2：基於視覺的自動化

模型看著螢幕的截圖，推理該做什麼，然後發出一個底層動作（點擊、輸入、捲動）。環境執行該動作，拍一張新的截圖，然後迴圈重複。這正是 Claude Computer Use 與 Open Interpreter 的 Computer API 的運作方式。

### 架構

```
+-------------------------------------------------------------------+
|              Vision-Based Automation Pattern                      |
+-------------------------------------------------------------------+
|                                                                   |
|  +------------------+                                             |
|  |  Task Goal        |  "Fill out the expense form with           |
|  |  (NL instruction) |   last week's receipts"                    |
|  +--------+---------+                                             |
|           |                                                       |
|           v                                                       |
|  +--------+--------------------------------------------------+    |
|  |                    VISION-ACTION LOOP                      |    |
|  |                                                            |    |
|  |   +------------+    +-------------+    +------------+     |    |
|  |   |  OBSERVE   |    |  REASON     |    |  ACT       |     |    |
|  |   |            |    |             |    |            |     |    |
|  |   | Screenshot |--->| Analyze     |--->| Emit action|     |    |
|  |   | (base64)   |    | screenshot  |    | {type:     |     |    |
|  |   |            |    | + goal      |    |  "click",  |     |    |
|  |   |            |    | + history   |    |  x: 450,   |     |    |
|  |   |            |    | + prev acts |    |  y: 320}   |     |    |
|  |   +-----^------+    +-------------+    +------+-----+     |    |
|  |         |                                      |          |    |
|  |         +--------------------------------------+          |    |
|  |                    (Loop until done)                       |    |
|  +-----------------------------------------------------------+    |
|                            |                                      |
|                            v                                      |
|  +-------------------------+------------------------------+       |
|  |         Sandboxed Environment (VM / Docker + VNC)      |       |
|  |                                                        |       |
|  |   +----------+  +----------+  +----------+            |       |
|  |   | Desktop  |  | Browser  |  | Apps     |            |       |
|  |   | (Xfce)   |  | (Chrome) |  | (any)    |            |       |
|  |   +----------+  +----------+  +----------+            |       |
|  +--------------------------------------------------------+       |
+-------------------------------------------------------------------+
```

### Observe-Reason-Act 循環

**Observe（觀察）**：擷取當前螢幕狀態的截圖。在 Claude Computer Use 中，這是一張以 base64 編碼的 PNG，作為影像內容區塊送出。Zoom Action（2026 年的新功能）可針對密集的 UI 擷取特定區域的高解析度裁切圖。

**Reason（推理）**：多模態 LLM 同時分析截圖、任務目標與動作歷史，決定下一個動作應該是什麼。這一步消耗的 token 最多。

**Act（執行）**：模型發出一個結構化的動作：
- `left_click(x, y)`，在座標處點擊
- `type(text)`，輸入一段字串
- `key(key_combo)`，按下鍵盤快捷鍵
- `scroll(direction, amount)`，捲動頁面
- `screenshot()`，在不做任何動作的情況下拍一張新截圖
- `zoom(x0, y0, x1, y1)`，以高解析度檢視某個區域

### 程式碼範例：Computer Use 迴圈

```python
tools = [
    {"type": "computer_20250124", "name": "computer",
     "display_width_px": 1280, "display_height_px": 800},
    {"type": "bash_20250124", "name": "bash"},
    {"type": "text_editor_20250124", "name": "str_replace_based_edit_tool"}
]
messages = [{"role": "user", "content": "Open the browser and go to GitHub."}]

while True:  # The vision-action loop
    response = client.messages.create(
        model="claude-sonnet-4-6", max_tokens=4096, tools=tools, messages=messages)
    if response.stop_reason == "end_turn":
        break
    for block in response.content:
        if block.type == "tool_use":
            result = sandbox.execute_action(block.name, block.input)
            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": [
                {"type": "tool_result", "tool_use_id": block.id, "content": result}]})
```

### 何時使用此模式

- 自動化沒有 API 的舊有應用程式
- 圖形介面的端到端測試
- 需要與多個應用程式互動的任務
- 以自然語言描述任務的非開發者使用者

### 取捨

| 優點 | 缺點 |
|-----------|--------------|
| 適用於任何 GUI 應用程式 | 速度慢（每個動作步驟 1-3 秒） |
| 不需要 API 或整合 | token 成本高（截圖體積很大） |
| 能處理動態 UI | 在密集介面上有誤點風險 |
| 非技術使用者也能上手 | 為了安全需要沙箱化 VM |

---

## 模式 3：本地程式碼執行

使用者以自然語言描述任務。LLM 產生程式碼。程式碼在本地機器上（或在沙箱中）執行。觀察輸出後，LLM 要嘛產生更多程式碼，要嘛提供最終答案。這正是 Open Interpreter 與 Claude Code 部分功能的運作方式。

### 架構

```
User (NL): "Analyze the CSV and plot the top 10 products"
  |
  v
[LLM Generates Code] --> Python/Bash/JS
  |
  v
[Permission Gate] --> "Run this code? [y/N]" (auto-approve, always-ask, or rules-based)
  |
  v
[Code Executor] --> Execute, capture stdout/stderr/return value
  |
  v
[Output Observer] --> Error? Feed back to LLM for fix. Success? Present to user.
  |
  v
[LLM Decides] --> Done? Return result. Need more? Generate next code block. (Loop)
```

### NL-Code-Execute-Observe 循環

**1. 自然語言轉程式碼**：LLM 把使用者的意圖翻譯成可執行的程式碼。程式碼的語言取決於任務，資料分析用 Python、系統操作用 bash、網頁任務用 JavaScript。

**2. 權限關卡**：執行前會先請使用者核准。這是非沙箱化環境的關鍵安全機制。實作方式各不相同：
- **永遠詢問**（Open Interpreter 預設）：每個程式碼區塊都需要明確核准
- **自動核准**（信任模式）：危險但快速
- **基於規則**（Claude Code 模型）：在設定中以允許/拒絕模式控制。舉例來說，允許 `git` 指令，拒絕 `rm -rf`

**3. 執行與擷取**：程式碼在一個具有完整（或受限）系統存取權的執行環境中運行。Stdout、stderr、回傳值，以及任何產生的檔案都會被擷取。

**4. 觀察與迭代**：LLM 看到執行輸出。如果有錯誤，它會產生修正。如果輸出只是部分結果，它會產生下一步。這形成了一個自我修正的迴圈。

### 程式碼範例：程式碼執行代理

```python
class CodeExecutionAgent:
    def __init__(self, llm_client, sandbox=None):
        self.llm = llm_client
        self.sandbox = sandbox  # None = unsandboxed (host)
        self.history = []

    async def run(self, task: str) -> str:
        self.history.append({"role": "user", "content": task})
        for iteration in range(10):  # Max 10 code-execute cycles
            response = await self.llm.generate(messages=self.history)
            code = extract_code_block(response)
            if not code:
                return response  # No code = final answer
            if not self.sandbox and not await user_approves(code):
                return "Execution cancelled by user."
            result = await (self.sandbox or LocalExecutor()).run(code, timeout=30)
            self.history.append({"role": "assistant", "content": response})
            self.history.append({"role": "user",
                "content": f"stdout: {result.stdout}\nstderr: {result.stderr}"})
        return "Max iterations reached."
```

### 何時使用此模式

- 資料分析與視覺化任務
- 系統管理與 DevOps 自動化
- 檔案處理與轉換
- 任何使用者只描述「要什麼」而由代理想出「怎麼做」的任務

### 取捨

| 優點 | 缺點 |
|-----------|--------------|
| 極為靈活 | 若未沙箱化會有安全風險 |
| 透過觀察迴圈自我修正 | 模型可能產生危險的程式碼 |
| 搭配本地模型可離線運作 | 需要使用者評估程式碼（或選擇信任） |
| 需要時可取得完整系統存取權 | 非確定性（同一提示，不同程式碼） |

---

## 模式 4：多代理工具編排

與其讓一個代理擁有許多工具，不如建立多個各自擁有一部分工具的專責代理。由一個編排器把任務路由給合適的代理。這是代理界的「微服務革命」。

### 架構

```
  [User Request]
       |
       v
  [ORCHESTRATOR] (Frontier model: Claude Opus, GPT-4o)
  Analyzes task, selects agent, routes and waits
       |
  +----+----+----+
  |         |         |
  v         v         v
[Code Agent]  [Data Agent]  [Web Agent]
 bash, edit,   SQL, plot,    fetch, scrape,
 git           csv            browse
  |         |         |
  v         v         v
[Sandbox]  [Sandbox]  [Sandbox]
(Docker)   (Docker)   (Docker)
```

### 編排策略

**1. 基於路由器（最簡單）**：編排器就是一個分類器。它檢視使用者的訊息，挑出合適的專責代理，然後把整個任務轉發過去。代理之間沒有彼此通訊。

**2. Plan-and-Execute**：一個規劃模型（frontier 等級）把任務拆解成子任務，並把每個子任務分派給合適的專責代理。子任務結果由規劃器彙整。基準測試顯示其任務完成率達 92%，相較於循序的 ReAct 有 3.6 倍的加速。

**3. 階層式**：高層代理把工作分派給低層代理，後者可能再進一步委派。這模仿了組織結構，對複雜專案運作得很好。

**4. 協作式（點對點）**：代理之間可以直接彼此通訊，分享觀察結果並請求協助。這是最複雜的模式，但能妥善處理突發性的任務。

### 成本最佳化：Plan-and-Execute 的優勢

```
Traditional: [Frontier Model] handles all steps       Cost: $1.00/task

Plan-and-Execute:
  [Frontier Model] plans (1 call)                     Cost: $0.05
  [Small Model] executes steps 1-3                    Cost: $0.03
  [Frontier Model] aggregates (1 call)                Cost: $0.05
                                                      Total: $0.13/task
                                                      Savings: ~87%
```

2026 年的趨勢是把代理的成本最佳化當成第一級要務來看待，就如同雲端成本最佳化在微服務時代成為不可或缺的一環一樣。

---

## 沙箱化與非沙箱化執行

對任何工具使用代理而言，這是最關鍵的架構決策。

### 比較

```
  UNSANDBOXED (Host Access)              SANDBOXED (Isolated)
  +------------------------+             +------------------------+
  | LLM output executes    |             | LLM output executes    |
  | directly on host OS    |             | inside Docker/VM/E2B   |
  |                        |             |                        |
  | Risk: rm -rf /         |             | Isolated filesystem,   |
  | Risk: data exfiltration|             | network, processes     |
  |                        |             |                        |
  | Used by: OpenClaw,     |             | Used by: OpenHands,    |
  | Open Interpreter,      |             | OpenAI Codex, Jules,   |
  | Claude Code (default)  |             | Cursor Background Agents|
  +------------------------+             +------------------------+
```

### 沙箱實作選項

| 技術 | 隔離層級 | 啟動時間 | 使用情境 |
|------------|----------------|-------------|----------|
| Docker | 行程 + 檔案系統 | 1-5 秒 | 多數代理沙箱（OpenHands） |
| Firecracker | 完整 VM（microVM） | ~125ms | 高安全性、多租戶 |
| gVisor | 核心層級 | ~200ms | Google Cloud Run |
| E2B | 雲端沙箱 | 2-3 秒 | 遠端代理執行 |
| WebAssembly | 語言層級 | <50ms | 瀏覽器內執行 |

### 2026 年的共識

預設沙箱化並保留逃生出口。OpenClaw 的安全危機（135,000 個實例暴露在公開網際網路上）讓整個產業認真看待這件事。新的生產環境代理被預期要預設沙箱化。非沙箱化執行則保留給單一使用者、有人監督的環境。

---

## 跨工具呼叫的狀態管理

代理需要在工具呼叫之間維持狀態。策略取決於代理的生命週期與使用情境。

### 狀態管理模式

| 模式 | 生命週期 | 儲存 | 使用者 |
|---------|-----------|---------|---------|
| **對話狀態** | 短暫（單一對話） | 訊息陣列 | 多數基於 API 的代理 |
| **工作階段狀態** | 每工作階段（工作目錄、開啟的檔案） | Docker 容器/暫存目錄 | OpenHands、Claude Code |
| **持久狀態** | 跨工作階段（數天、數週） | 資料庫、檔案、Markdown | OpenClaw（Memories/）、CLAUDE.md |
| **環境狀態** | 外部（事實來源） | Git repo、資料庫、檔案系統 | Claude Code（git status）、CI/CD |

### 實作：工作階段狀態

```python
class AgentSession:
    """Manages state across tool calls within a single session."""
    def __init__(self):
        self.conversation: list[dict] = []
        self.working_dir: str = tempfile.mkdtemp()
        self.open_files: dict[str, str] = {}  # path -> content cache
        self.tool_call_count: int = 0

    def add_tool_result(self, tool_name: str, args: dict, result: dict):
        self.tool_call_count += 1
        self.conversation.append({"role": "tool", "tool_name": tool_name,
            "args": args, "result": result, "timestamp": time.time()})
        # Update derived state from side effects
        if tool_name == "write_file":
            self.open_files[args["path"]] = args["content"]

    def get_context_for_llm(self, max_tokens: int = 100_000) -> list[dict]:
        """Return conversation history, compressed if over budget."""
        if estimate_tokens(self.conversation) < max_tokens:
            return self.conversation
        return self._compress_history(max_tokens)  # Summarize old results
```

---

## 錯誤處理與重試模式

工具呼叫會失敗。網路會逾時。API 會回傳錯誤。程式碼會拋出例外。生產環境的代理需要有系統化的錯誤處理。

### 錯誤分類

| 錯誤類型 | 範例 | 策略 |
|-----------|----------|----------|
| **暫時性** | 網路逾時、速率限制、503 | 指數退避重試（最多 3 次） |
| **輸入** | 參數無效、格式錯誤 | 把錯誤回饋給 LLM，讓它修正參數 |
| **權限** | 驗證失敗、存取被拒 | 回報給使用者，不要重試 |
| **邏輯** | 工具用錯、操作不可能 | 把錯誤回饋給 LLM，讓它重新規劃 |
| **災難性** | OOM、沙箱崩潰、無窮迴圈 | 中止、回報、清理資源 |

### 重試模式實作

```python
class ToolExecutor:
    MAX_RETRIES = 3

    async def execute_with_retry(self, tool_name: str, args: dict) -> dict:
        for attempt in range(self.MAX_RETRIES):
            try:
                result = await self.call_tool(tool_name, args)
                if not result.get("error"):
                    return result  # Success
                error_type = classify_error(result["error"])
                if error_type == "transient":
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
                    continue
                elif error_type == "input":
                    return {"error": result["error"], "fix_hint": "Adjust args"}
                elif error_type == "permission":
                    return {"error": result["error"], "action": "Report to user"}
                else:  # catastrophic
                    await self.cleanup_sandbox()
                    return {"error": "Fatal error. Task aborted."}
            except TimeoutError:
                if attempt < self.MAX_RETRIES - 1:
                    await asyncio.sleep(2 ** attempt)
                    continue
        return {"error": f"Failed after {self.MAX_RETRIES} retries"}
```

### 自我修正迴圈

這是 2026 年最強大的錯誤處理模式。代理觀察自己的失敗，並自主地修正它們：

```
LLM generates code/tool call
  --> Execute --> Success? -- YES --> Return result
                     |
                     NO
                     |
                     v
              Feed error + stderr to LLM --> LLM generates fix --> Execute again
              (max 5 corrections to prevent infinite loops)
```

Claude Code、OpenHands 與 Cline 正是這樣處理測試失敗的：跑測試、看到失敗、編輯程式碼、重跑測試，重複直到全部通過。

---

## MCP 整合模式

MCP 在 2026 年已成為工具整合的標準協定。以下是把 MCP 整合進代理架構的幾個關鍵模式。

### 模式 A：直接 MCP 連線

```
[Agent (Client)] <-- stdio / HTTP --> [MCP Server]
```
最簡單的模式。一個代理，一個伺服器。用於單一用途的工具（資料庫、檔案系統）。

### 模式 B：多伺服器扇出

```
                  +--> [GitHub MCP]
[Agent (Client)]--+--> [Postgres MCP]
                  +--> [Slack MCP]
```
代理同時連線到多個 MCP 伺服器。工具 schema 會被合併成單一 manifest。Claude Code 與多工具助理採用此模式。

### 模式 C：MCP Gateway（企業級）

```
[Agent 1] --+                          +--> [GitHub MCP]
[Agent 2] --+--> [MCP Gateway]  --+--> [Postgres MCP]
[Agent 3] --+    (Auth, Rate Limit,    +--> [Slack MCP]
                  Audit, Route)
```
中央 gateway 負責處理驗證、速率限制與稽核記錄。代理只需向 gateway 進行驗證。用於企業級與多租戶部署。

### MCP 路線圖的缺口

目前的 MCP 規格（截至 2026 年 5 月）缺少三個關鍵的生產環境原語：

1. **身分傳遞（Identity Propagation）**：沒有標準化的方式把使用者身分從 client 一路傳遞到 server。gateway 模式是一種權宜之計。
2. **自適應工具預算（Adaptive Tool Budgeting）**：協定層級沒有支援限制每次工具呼叫的 token/成本消耗。
3. **結構化錯誤語意（Structured Error Semantics）**：沒有標準的錯誤碼或錯誤類別。每個伺服器各自定義自己的錯誤格式。

這些都在 2026 年的路線圖上，但尚未正式批准。

---

## 架構決策樹

用這棵決策樹來為你的使用情境挑選合適的模式：

```
Does the target system have an API?
 +-- YES --> Pattern 1 (Tool Calling). Wrap as MCP server. Fastest, most reliable.
 +-- NO  --> Does the task require GUI interaction?
              +-- YES --> Pattern 2 (Vision-Based). Sandbox in VM. Accept latency.
              +-- NO  --> Is the task primarily code/data work?
                           +-- YES --> Pattern 3 (Code Exec). Sandbox if multi-tenant.
                           +-- NO  --> Complex enough for multiple specialists?
                                        +-- YES --> Pattern 4 (Multi-Agent Orch.)
                                        +-- NO  --> Pattern 1 with custom tool.
```

### 混合架構

實務上，生產環境系統會結合多種模式。Claude Code 就採用：
- 模式 1（工具呼叫）處理檔案操作與 git
- 模式 2（基於視覺）處理 computer use 功能
- 模式 3（程式碼執行）處理 bash 與跑測試
- 模式 4（多代理）處理子代理的生成

關鍵在於預設使用最簡單的模式（函式呼叫），只有在使用情境有需求時才加入複雜度。

---

## 系統設計面試切角

在面試中討論工具使用架構時，把你的答案環繞這五個面向來組織：

### 1. 模式選擇

先從辨識哪種模式合適開始：「目標系統有 REST API，所以我會採用函式/工具呼叫模式，用一個 MCP 伺服器來包裝這個 API。」這顯示你理解決策樹。

### 2. 沙箱邊界

務必處理安全性：「對於多租戶部署，我會把每位使用者的代理工作階段沙箱化在一個 Docker 容器中，且不允許它對內部服務有網路存取。MCP 伺服器在沙箱外運行，並中介所有對外呼叫。」

### 3. 狀態策略

說明狀態如何管理：「我會在 Docker 容器內使用工作階段狀態來處理工作檔案，並以環境狀態（git repo）作為事實來源。這個使用情境不需要持久的代理記憶。」

### 4. 錯誤預算

討論失敗模式：「工具呼叫可能因暫時性錯誤（以退避方式重試）、輸入錯誤（讓 LLM 自我修正）或權限錯誤（向使用者揭露）而失敗。我會把自我修正設定為最多 5 次嘗試，之後再升級處理。」

### 5. 成本模型

處理經濟面：「對於編排器，我會採用 Plan-and-Execute 模式：由 Opus 規劃任務，由 Haiku 執行每一步。相較於凡事都用 Opus，這能把成本降低大約 87%。」

---

## 面試題目

### 問：設計一個系統，讓客服代理能運用來自 Zendesk、Salesforce 與內部知識庫的資料來回答問題。

**強答案：**
採用模式 1（函式/工具呼叫），搭配三個 MCP 伺服器，每個資料來源一個。使用多伺服器扇出模式並搭配 dynamic manifests，讓每個查詢只載入相關工具。在生產環境中，加入一個 MCP Gateway 來處理各資料來源的 OAuth、速率限制（對 Salesforce API 限制而言至關重要）與稽核記錄。狀態是短暫的，客服不需要跨工作階段的記憶。

### 問：你會如何防止 AI 代理透過工具呼叫造成損害？

**強答案：**
跨五層的縱深防禦：(1) 帶有拒絕模式的 schema 約束（用正規表示式拒絕 `DROP TABLE` 等）。(2) 針對破壞性操作設置權限關卡，Claude Code 的允許/拒絕規則是個好範本。(3) 沙箱隔離（Docker 搭配唯讀掛載、無對外網路）。(4) token 與成本上限，以防止失控的迴圈。(5) 透過 MCP Gateway 模式建立稽核軌跡。沒有任何單一層級是足夠的，模型可能產生通過驗證的幻覺參數（需要沙箱），而沙箱無法阻止透過被允許的路徑進行的資料外洩（需要稽核記錄）。

### 問：說明基於視覺的 computer use 與基於 API 的工具呼叫之間的取捨。

**強答案：**
基於 API 的方式更快（每步 50-200ms 對比 1-3 秒）、更便宜（文字對比影像 token）、更可靠（確定性對比座標點擊），也更容易測試。只要有 API 存在，就永遠優先採用它。基於視覺的方式則是後備選項，用於沒有 API 的應用程式、舊有系統，或多應用程式的工作流程。2026 年的 Zoom Action 緩解了在密集 UI 上的誤點問題。最佳實務：對 80% 有 API 支援的任務使用 API 呼叫，剩下 20% 則用基於視覺的方式。

---

## 參考資料

- Anthropic. "Computer Use Tool Documentation" (2024-2026)
- Anthropic. "Model Context Protocol Specification" (2025-2026)
- MCP 2026 Roadmap. "Transport Evolution, Agent Communication, Governance" (2026)
- IBM Developer. "MCP Architecture Patterns for Multi-Agent AI Systems" (2026)
- Google Cloud. "Choose a Design Pattern for Your Agentic AI System" (2025-2026)
- Microsoft Azure. "AI Agent Orchestration Patterns" (2025-2026)
- OpenHands Documentation. "Runtime Architecture" (2025-2026)
- OpenClaw Documentation. "Architecture and SOUL.md Guide" (2025-2026)
- Open Interpreter GitHub Repository (2024-2026)
- ArXiv 2603.13417. "Design Patterns for Deploying AI Agents with MCP" (2026)

---

*上一篇：[工具使用與電腦代理全景](01-tool-use-landscape.md)*
*下一章：[案例研究](../16-case-studies/)*
