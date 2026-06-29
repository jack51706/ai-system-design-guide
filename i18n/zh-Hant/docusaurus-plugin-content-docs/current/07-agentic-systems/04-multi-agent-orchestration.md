# 多代理編排

複雜系統很少只靠單一代理。它們是由多個專精代理組成的團隊。編排技術已經從「盲目管理者（Blind Managers）」成熟發展為**階層式監督者（Hierarchical Supervisors）**、**動態群集（Dynamic Swarms）**，以及由 A2A 這類互通協定所支援的**跨廠商代理網路（Cross-Vendor Agent Networks）**。Gartner 預測，到 2026 年底，將有 40% 的企業應用程式具備任務專屬的 AI 代理，而 2025 年初這個比例還不到 5%。

## 目錄

- [為什麼需要多代理？](#why)
- [監督者模式](#supervisor)
- [管線模式](#pipeline)
- [群集與點對點（P2P）](#swarms)
- [圖形式編排（2026 年主流模式）](#graph-orchestration)
- [透過 A2A 進行跨廠商代理編排](#cross-vendor)
- [2026 年多代理框架版圖](#framework-landscape)
- [代理團隊中的狀態管理](#state)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 為什麼需要多代理？ {#why}

一個擁有 50 個工具的單一代理會承受**認知負荷（Cognitive Load）**。
1. **專精化**：一個「程式碼代理」可以使用針對 Python 最佳化的模型，而一個「搜尋代理」則使用針對 RAG 最佳化的模型。
2. **平行化**：多個代理可以同時處理彼此獨立的子任務。
3. **解耦評估**：你可以把「寫作代理」與「研究代理」分開評估。

---

## 監督者模式（階層式）

截至 2026 年，這是最常見的企業模式。

- **監督者（The Supervisor）**：一個高推理能力的模型（Claude Opus 4.7、GPT-5.5 reasoning、Gemini 3.1 Pro Deep Think），負責拆解使用者提示並委派給工作者。
- **工作者（Workers）**：快速且具成本效益的模型（Claude Haiku 4.5、Gemini 3.1 Flash、GPT-5.5-mini），負責執行實際工作。
- **審查者（Reviewer）**：一個獨立的代理，依照監督者最初的計畫來驗證彙整後的輸出。

**架構**：LangGraph 仍是實作這類具狀態感知的階層式迴圈的主流框架。截至 2026 年，Claude Agent SDK、Google ADK 與 Microsoft Agent Framework 全都原生支援此模式。

---

## 群集（OpenAI 模式）

群集（Swarms）在 2024 年底開始流行，其核心聚焦於「交接（Handoffs）」。

- 一個代理把對話「交接」給另一個代理。
- **核心概念**：`Handoff(TargetAgent)`。
- **好處**：沒有中央「管理者」造成的瓶頸。對話可以在各個專精實體之間自然流動。

---

## 圖形式編排（2026 年主流模式） {#graph-orchestration}

2026 年的架構動能已明確轉向**圖形式編排（graph-based orchestration）**，也就是把代理工作流程建模為帶有型別狀態的有向圖。

### 為什麼圖形勝出

- **明確的控制流程**：節點是代理或函式；邊則定義轉換，包括條件分支與迴圈
- **可視覺化**：團隊可以把工作流程當成圖表來檢視與除錯
- **狀態感知**：型別化的狀態物件會通過整張圖傳遞，因而支援檢查點（checkpointing）與續行

### 框架支援

| 框架 | 圖形模型 | 關鍵差異化 |
|-----------|-------------|-------------------|
| **LangGraph**（24k stars） | 帶型別狀態的命令式 DAG | 最成熟，社群最廣 |
| **Google ADK**（17k stars） | 內建 A2A 的代理圖 | 原生整合 Google Cloud |
| **Microsoft Agent Framework** | 工作流程圖（循序、並行、交接） | 統一 .NET 與 Python，企業級治理 |
| **Claude Agent SDK** | 監督者導向的階層式樹狀結構 | 內建工具（bash、editor），可直接用於生產環境 |

### Paperclip 模式（大規模階層式代理）

2026 年一個值得注意的發展是 **Paperclip**（在 2026 年 3 月推出後三週內便獲得 44,900 個 GitHub stars）。它採用階層式模型：一個 CEO 代理接收最上層的目標，將其拆解，並委派給管理者代理，再由這些管理者代理產生並協調工作者代理。此模式展示了高度階層化的多代理樹狀結構如何處理複雜的真實世界任務。

> *已於 2026 年 5 月驗證。*

---

## 透過 A2A 進行跨廠商代理編排 {#cross-vendor}

**Agent-to-Agent（A2A）協定**（參見 [工具使用與 MCP](03-tool-use-and-mcp.md#a2a)）開啟了一種全新的多代理模式：**跨廠商編排（cross-vendor orchestration）**。在 A2A 之前，多代理系統要求所有代理共用同一套框架與執行環境。如今則是：

1. **代理探索（Agent Discovery）**：編排器透過各代理的**代理卡片（Agent Cards）**（描述能力的 JSON 中繼資料）來尋找專精代理
2. **任務委派（Task Delegation）**：編排器透過 HTTP/SSE 把結構化的任務送給遠端代理
3. **非同步進度（Async Progress）**：遠端代理把狀態更新串流回來；同時編排器可以平行委派工作給其他代理
4. **結果收集（Result Collection）**：最終產出物會被回傳並整合進編排器的狀態中

**生產環境範例**：一套採購系統，其中編排器（LangGraph）把法規遵循檢查委派給一個專精代理（Google ADK），把庫存查詢委派給一個 MCP 連接的工具，並把合約產生委派給一組 CrewAI crew，全部分別透過 A2A 與 MCP 通訊。

> *已於 2026 年 5 月驗證。來源：a2a-protocol.org*

---

## 2026 年多代理框架版圖 {#framework-landscape}

如今每個主要的 AI 實驗室都推出了自己的代理框架。截至 2026 年 5 月的多代理編排版圖如下：

| 框架 | 提供者 | 多代理模型 | 狀態 |
|-----------|----------|-------------------|--------|
| **LangGraph** | LangChain | 圖形式，最具彈性 | 生產環境（126k stars） |
| **Claude Agent SDK** | Anthropic | 內建工具的監督者樹狀結構 | GA（Python 與 TypeScript） |
| **Google ADK** | Google | 圖形式並原生支援 A2A | GA（Python、TS、Java、Go） |
| **Microsoft Agent Framework** | Microsoft | 工作流程加上群組聊天模式 | RC 1.0（2026 年 2 月），GA 預計 2026 年第二季 |
| **OpenAI Agents SDK** | OpenAI | 帶防護機制的交接式群集 | GA（Python 與 TypeScript） |
| **CrewAI** | CrewAI Inc. | 帶 Flows 的角色導向 crew | v1.13（60% 以上的 Fortune 500） |
| **Smolagents** | HuggingFace | 輕量、開源 | 積極開發中 |

**關鍵趨勢**：沒有任何單一框架能在四種多代理模式（監督者、群集、管線、辯論）上全部表現出色。各團隊越來越常組合多個框架，例如以 LangGraph 處理複雜編排，再以 CrewAI 處理面向業務使用者的自動化。

> *已於 2026 年 5 月驗證。*

---

## 狀態管理

多代理系統最大的挑戰是**共享黑板（Shared Blackboard）**。

1. **區域狀態（Local State）**：只有特定代理才看得到的上下文。
2. **全域狀態（Global State）**：所有代理都看得到的共享記憶體（例如最終草稿）。
3. **寫入衝突（Write Conflicts）**：當兩個代理試圖修改同一份全域狀態時。
   - **最佳實務**：使用**交易式交接（Transactional Handoffs）**。只有在某個代理「擁有」鎖時，它才能寫入全域狀態。

---

## 點對點（P2P）辯論

對於高準確度的任務（例如法律或醫療），我們會採用**代理式辯論（Agentic Debate）**。
- **代理 A**：提出一個答案。
- **代理 B**：試圖找出代理 A 答案中的缺陷。
- **代理 A**：根據 B 的批評來修正答案。
- **結果**：收斂到比任何單一代理所能產生的更高品質的結果。

---

## 面試問題 {#interview-questions}

### 問：「監督者」多代理架構的主要失效模式有哪些？

**有力的回答：**
最主要的失效模式是**拆解失效（Decomposition Failure）**。如果監督者代理把一項任務拆成在邏輯上彼此不一致、或帶有隱藏相依性的子任務，工作者就會對著*錯誤的問題*產生正確的答案。標準的修正方式是**迭代式規劃（Iterative Planning）**：監督者必須在工作者開始執行之前，先取得「子任務可行性的確認」。另一種失效是**上下文稀釋（Context Dilution）**，也就是全域狀態被工作者的日誌塞得過於臃腫，導致監督者失去「整體大局」。

### 問：你如何在「鏈式序列（Sequence of Chains）」與「多代理圖（Multi-Agent Graph）」之間做選擇？

**有力的回答：**
當任務是線性且確定性的（例如 Extract -> Translate -> Summarize），我會使用**鏈式序列（Sequence of Chains）**。當任務是**非線性的**或需要**條件式迴圈**時，我會使用**多代理圖（Multi-Agent Graph）**（例如 LangGraph）。舉例來說，如果「Translate」步驟可能失敗、需要回到「Extract」取得更多上下文，靜態的鏈就會中斷，但圖可以藉由把流程繞回到較早的節點來自我修正。

### 問：什麼情況下你會用 A2A 來做多代理編排，而不是把所有代理留在單一框架裡？

**有力的回答：**
當團隊擁有所有代理、它們共用同一套執行環境、且代理呼叫之間的低延遲至關重要時，我會把代理留在單一框架裡。當需要跨越**組織或廠商邊界**時，我才會引入 A2A，例如當我的編排器需要委派給由另一個團隊維護的法規遵循代理時，或是在整合第三方專精代理（例如法律審查服務）時。A2A 會增加 HTTP 開銷，但能提供**廠商中立性**、**獨立擴展**，以及透過代理卡片進行的**能力探索**。原則是：同一團隊就用同一框架；不同團隊或廠商就用 A2A。

---

## 參考資料 {#references}
- Wu et al. "AutoGPT: An Autonomous GPT-4 Experiment"（歷史文獻／2025 年更新）
- Li et al. "Camel: Communicative Agents for 'Mind' Exploration"（2023／2025）
- OpenAI. "Swarms Framework"（2024／2025）
- Google. "Agent2Agent Protocol"（2025／2026）
- Gartner. "Predicts 2026: AI Agent Market"（2025）
- Andrew Ng. "Agentic Design Patterns"（2025／2026）

---

*下一篇：[代理記憶與狀態](05-agent-memory-and-state.md)*
