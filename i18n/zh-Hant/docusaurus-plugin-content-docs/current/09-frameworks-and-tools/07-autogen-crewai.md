# Microsoft Agent Framework、CrewAI 與 Agent SDK 全景

過去一年，多代理框架的版圖出現顯著整併。Microsoft **讓 AutoGen 退役**，並將其與 Semantic Kernel 合併成統一的 **Microsoft Agent Framework**（RC 1.0，2026 年 2 月；GA 目標訂在 2026 年第二季）。CrewAI 演進到 v1.13，具備企業級功能，據報已有超過 60% 的 Fortune 500 企業採用。與此同時，每一家主要的 AI 實驗室都推出了自家的 agent SDK：Anthropic 的 Claude Agent SDK、OpenAI 的 Agents SDK，以及 Google 的 ADK。

## 目錄

- [CrewAI：管理者視角](#crewai)
- [Microsoft Agent Framework（AutoGen 的繼任者）](#microsoft-agent-framework)
- [Agent SDK 全景](#agent-sdk-landscape)
- [Swarm 與點對點通訊](#swarms)
- [框架比較表](#comparison)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## CrewAI：管理者視角

CrewAI 是圍繞 **Process（流程）** 這個概念所建構的。
- **角色導向代理**：你定義一個「Researcher（研究員）」、一個「Writer（撰稿者）」和一個「Manager（管理者）」。
- **任務（Tasks）**：具有明確產出的具體目標。
- **流程編排**：循序式（Sequential）、階層式（Hierarchical）或共識式（Consensual，基於共識）。

### CrewAI Flows

CrewAI 的 **Flows** 在經典的 Crew 模式之上，加入了一層 **狀態機（state-machine）**：

```python
from crewai.flow.flow import Flow, listen, start

class ContentFlow(Flow):
    @start()
    def research_topic(self):
        # Returns research output
        return research_crew.kickoff({"topic": self.state["topic"]})
    
    @listen(research_topic)
    def write_article(self, research):
        # Triggered after research completes
        return writing_crew.kickoff({"research": research})
    
    @listen(write_article)
    def publish(self, article):
        # Final step
        return publisher.publish(article)
```

### CrewAI v1.13 重點

CrewAI v1.13 標誌著邁向企業級生產環境就緒的轉捩點：

- **企業 SSO**：為企業部署完整記載的單一登入（Single Sign-On）。
- **RBAC 改進**：角色導向存取控制（Role-Based Access Control），並附有完整的權限參考表。
- **GPT-5 相容性**：針對 OpenAI 的 GPT-5 及更新的 o 系列模型進行修正，這些模型已不再支援 `stop` 參數。
- **A2A 任務執行**：以結構化、確定性的方式進行 Agent-to-Agent 動態任務委派。
- **NVIDIA NemoClaw 整合**：為安全的企業部署提供基礎設施層級的政策強制執行。
- **RuntimeState RootModel**：為複雜工作流程提供統一的狀態序列化。

**使用情境**：在結構定義明確的情況下，CrewAI + Flows 是 **業務流程自動化**（內容管線、資料分析工作流程）的最佳框架。CrewAI 據報已驅動約 20 億次代理式執行。

> *2026 年 5 月驗證。來源：docs.crewai.com/en/changelog*

---

## Microsoft Agent Framework（AutoGen 的繼任者）

### 合併：AutoGen + Semantic Kernel = Agent Framework

Microsoft 於 2025 年底讓 AutoGen 作為獨立產品退役，並將其與 Semantic Kernel 合併成統一的 **Microsoft Agent Framework**。Release Candidate 1.0 於 2026 年 2 月推出，GA 目標訂在 2026 年第二季。

**這次合併整合了哪些東西：**
- **來自 AutoGen**：針對單一與多代理對話模式的簡單抽象（group chat、round-robin、handoffs）。
- **來自 Semantic Kernel**：企業級的工作階段管理、型別安全、過濾器、遙測，以及廣泛的模型／嵌入支援。

### 遷移路徑

AutoGen 仍會持續收到錯誤修正與安全性修補，但 **新功能會獨家進入 Agent Framework**。Microsoft 提供了官方的遷移指南。如果要啟動新專案，請直接使用 Agent Framework。

### 核心能力

```python
# Microsoft Agent Framework: Graph-based workflow
from agent_framework import Agent, Workflow, HandoffStep

planner = Agent("Planner", model="gpt-5.5", system_message="Decompose tasks.")
executor = Agent("Executor", model="gpt-5.5-mini", system_message="Execute sub-tasks.")

workflow = Workflow(
    steps=[
        HandoffStep(from_agent=planner, to_agent=executor),
    ],
    state_management="session",  # Built-in session persistence
)
```

**框架重點：**
- **統一的 .NET 與 Python**：跨兩種語言採用相同的程式設計模型。
- **圖式工作流程**：循序、並行、handoff 與 group chat 等模式，皆具明確的控制權。
- **狀態管理**：為長時間執行與 human-in-the-loop 情境提供穩健的、基於工作階段的持久化。
- **MCP 支援**：原生的 Model Context Protocol 整合，用於工具存取。
- **多供應商**：支援 OpenAI、Azure OpenAI、Anthropic、Google 及本地模型。

> *2026 年 5 月驗證。來源：learn.microsoft.com/en-us/agent-framework*

---

## Agent SDK 全景

如今每一家主要的 AI 實驗室都推出了自家的 agent 框架。截至 2026 年 5 月的版圖如下：

### Claude Agent SDK（Anthropic）

Claude Agent SDK（由 Claude Code SDK 改名而來）提供了與驅動 Claude Code 相同的工具、agent loop 與上下文管理，並以 Python 和 TypeScript 函式庫的形式提供。

- **內建工具**：檔案讀取、命令執行、程式碼編輯，代理無需自訂工具實作即可立即運作。
- **Supervisor 模式**：具備委派能力的階層式代理樹。
- **部署**：支援 AWS Bedrock、Google Vertex AI 與 Azure。
- **截至 2026 年 5 月**：Python v0.1.48+、TypeScript v0.2.71+。

### OpenAI Agents SDK

OpenAI 為多代理工作流程打造的輕量框架，使用原生的 Python／TypeScript 結構：

- **以 Handoff 為基礎**：代理之間使用 `Handoff(TargetAgent)` 互相委派，無需中央 supervisor。
- **防護機制**：內建輸入驗證與安全性檢查。
- **MCP 整合**：原生支援 MCP 伺服器工具。
- **即時代理**：以 gpt-realtime-1.5 提供語音代理支援。

### OpenAI AgentKit

AgentKit 是 OpenAI 較高層級的工具組，建構於 Responses API 與 Agents SDK 之上。Agents SDK 屬於程式碼優先（code-first），而 AgentKit 則鎖定那些想以更少的繁瑣工作來組裝並出貨代理的團隊：

- **Agent Builder**：用於組合並對多代理工作流程（節點、分支、迴圈）進行版本控管的視覺化畫布，並可匯出成 Agents SDK 程式碼。
- **ChatKit**：可嵌入、可套用主題的聊天 UI，讓你不必自行打造前端，就能把代理體驗放進你的產品。
- **Connector Registry**：用於管理資料來源與工具如何跨 OpenAI 產品連接的中央管理介面，並具備治理與存取控制。
- **Evals 與防護機制**：內建追蹤評分、資料集與提示最佳化掛鉤，讓「建構到評估」的循環維持在同一處。

**何時使用它**：AgentKit 適合想要受管理的「建構並出貨」循環，且樂於使用 OpenAI 基礎設施的團隊。當你需要對 loop 有完整控制權時，降到原生的 Agents SDK；當你需要框架中立或自架的執行環境時，則改用 LangGraph／Microsoft Agent Framework。

### OpenAI Apps SDK

Apps SDK 擴展了 **Model Context Protocol**，讓 MCP 伺服器能在工具旁一併提供 UI。開發者同時定義邏輯與互動式介面，而該 app 會在像 ChatGPT 這樣的客戶端內渲染。這正是 MCP 規格正在標準化為「MCP Apps」（伺服器渲染 UI）的同一個概念，它把 MCP 伺服器從無介面（headless）的工具端點轉變成互動式的介面。請參閱 [工具使用與 MCP](../07-agentic-systems/03-tool-use-and-mcp.md)。

### Google Agent Development Kit（ADK）

Google 針對 Google 生態系最佳化、但與模型無關的框架：

- **多語言**：Python、TypeScript、Java、Go（截至 2026 年 5 月皆達 1.0+）。
- **A2A 原生**：內建 Agent-to-Agent 協定支援，用於跨供應商編排。
- **Vertex AI 整合**：部署到 Agent Engine Runtime 以取得受管理的託管。
- **以圖為基礎**：代理工作流程被建模為有向圖。

> *2026 年 5 月驗證。*

---

## Swarm 與 P2P

兩個框架（以及更廣的 SDK 全景）都採用了 **Swarm 模式（Swarm Patterns）**。
- **Handoff（交接）**：不採用中央 supervisor，而是讓代理把對話「交接」給最相關的專家。
- **範例**：一個「Sales Agent（業務代理）」察覺到使用者正在問技術問題，便把該對話串交接給「Support Agent（支援代理）」。

---

## 框架比較表

| 功能 | CrewAI | MS Agent Framework | LangGraph | Claude Agent SDK | OpenAI Agents SDK | Google ADK |
|---------|--------|-------------------|-----------|-----------------|-------------------|------------|
| **核心抽象** | Task/Process/Flow | Workflow/Agent | State/Graph | Supervisor/Tools | Handoff/Agent | Agent Graph |
| **架構** | 宣告式 + 狀態機 | 圖式工作流程 | 命令式 DAG | 階層式樹 | Swarm Handoffs | 有向圖 |
| **易用性** | 高 | 中 | 低 | 中 | 高 | 中 |
| **控制度** | 低至中 | 中至高 | 高 | 中 | 低至中 | 中至高 |
| **最適合** | 業務自動化 | 企業 .NET/Python | 複雜編排 | 程式碼／工具代理 | 快速多代理 | Google Cloud AI |
| **多語言** | Python | .NET + Python | Python | Python + TS | Python + TS | Python, TS, Java, Go |
| **MCP 支援** | 是 | 是 | 透過工具 | 原生 | 是 | 是 |
| **A2A 支援** | 透過擴充 | 規劃中 | 透過工具 | 否（直接） | 否（直接） | 原生 |

---

## 面試問題

### 問：你在什麼情況下會用 CrewAI 而不是 LangGraph？

**優秀回答：**
**速度 vs. 精準**。當我需要為一個標準流程（例如內容生成或資料分析）非常快速地搭起一支代理團隊時，我會用 **CrewAI**。它開箱即用地提供了「規劃」與「協作」的高階抽象。當我需要對每一次狀態轉換、多輪 human-in-the-loop 觸發，或是無法套進「角色扮演團隊」這套比喻的複雜錯誤復原邏輯，擁有 **細緻的控制權** 時，我就會切換到 **LangGraph**。

### 問：Microsoft 讓 AutoGen 退役、轉而推 Agent Framework。這對既有的 AutoGen 部署有什麼影響？

**優秀回答：**
AutoGen 仍會持續收到錯誤修正與安全性修補，所以既有的部署不會立即失效。不過，**所有的新功能開發** 都在 Agent Framework。遷移路徑記載得很完整：AutoGen 的 `AssistantAgent` 對應到 Agent Framework 的 `Agent` 類別，`GroupChat` 對應到新的 `Workflow` 模式，而 Semantic Kernel 的企業功能（工作階段管理、遙測、過濾器）現在皆可原生使用。遷移的關鍵好處是 **統一的 .NET 與 Python 支援**，以及對多代理執行路徑提供明確控制權的 **圖式工作流程**。對於新專案，請直接從 Agent Framework 開始。

### 問：你如何防止代理彼此不停對話卻沒解決任務的「無限迴圈」？

**優秀回答：**
我們會使用 **終止條件（Termination Conditions）** 與 **最大對話輪數（Max Conversational Turns）**。我們也會實作一個「Critic Agent（評論代理）」，它唯一的任務就是偵測對話是否停滯。如果 Critic 偵測到循環，它會觸發一個 user proxy 去中斷，或強制把 group chat 管理者切換到不同的推理路徑。我們也會監控 **Token 速度（Token Velocity）**：如果一對代理在 2 分鐘內用掉 100K tokens 卻毫無進展，我們就會自動終止該工作階段。在 2026 年，像 Microsoft Agent Framework 與 LangGraph 這樣的框架提供了內建的工作流程逾時與狀態檢查點（state checkpointing），讓迴圈偵測更具系統性。

---

## 參考資料
- CrewAI. "The Multi-Agent Process Engine" (2025/2026, v1.13)
- Microsoft. "Agent Framework Overview" (2026) — learn.microsoft.com/en-us/agent-framework
- Microsoft. "AutoGen to Agent Framework Migration Guide" (2026)
- Anthropic. "Claude Agent SDK" (2026) — platform.claude.com/docs/en/agent-sdk
- OpenAI. "Agents SDK Documentation" (2026)
- [OpenAI. "Introducing AgentKit" (2025)](https://openai.com/index/introducing-agentkit/)
- [OpenAI. "Apps SDK" (2025)](https://developers.openai.com/apps-sdk)
- Google. "Agent Development Kit" (2026) — google.github.io/adk-docs
- OpenAI Swarm. "Lightweight Multi-Agent Orchestration" (2024 tech report)

---

*下一篇：[框架選型指南](08-framework-selection-guide.md)*
