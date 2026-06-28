# 框架選型指南

AI 框架的生態在過去一年大幅整合。每一家主要的 AI 實驗室現在都推出了 agent SDK，Microsoft 將 AutoGen 與 Semantic Kernel 合併為統一的 Agent Framework，而互通協定（MCP、A2A）已成為基本門檻。本指南提供**決策矩陣**，協助你根據生產環境需求、團隊專長與系統規模選擇技術堆疊。

## 目錄

- [框架生態全景](#landscape)
- [決策矩陣](#matrix)
- [自建 vs. 採購 vs. 框架](#build-vs-buy)
- [應避免的反模式](#anti-patterns)
- [Staff 等級的建議](#recommendation)
- [面試問題](#interview-questions)

---

## 框架生態全景

### 編排與代理框架

| 框架 | 層級 | 核心價值 | 主要弱點 |
|-----------|------|---------------|--------------|
| **LangGraph** | L1（核心） | 精確的狀態控制、基於圖 | 複雜度高、學習曲線陡峭 |
| **DSPy** | L1（核心） | 可靠性與最佳化 | 前期成本（訓練） |
| **LlamaIndex**| L2（資料） | 進階檢索（RAG） | 邏輯彈性 |
| **CrewAI** | L3（應用） | 商業流程速度、企業級 RBAC | 隱藏失敗 |
| **MS Agent Framework** | L1（企業） | 統一 .NET + Python，取代 AutoGen + SK | RC 狀態（GA 於 2026 Q2） |

### Agent SDK（特定實驗室）

| 框架 | 層級 | 核心價值 | 主要弱點 |
|-----------|------|---------------|--------------|
| **Claude Agent SDK** | L1（代理） | 內建工具、生產環境代理迴圈 | 需要 Anthropic API |
| **OpenAI Agents SDK** | L1（代理） | 輕量交接、防護機制 | 以 OpenAI 為中心 |
| **Google ADK** | L1（代理） | 多語言、原生 A2A + Google Cloud | 偏向 Google 生態系 |

### 程式碼代理

| 框架 | 層級 | 核心價值 | 主要弱點 |
|-----------|------|---------------|--------------|
| **Claude Code** | L1（程式碼） | 自主式 CLI 程式碼代理 | 需要 Anthropic API |
| **Cursor / Windsurf** | L2（IDE） | 緊密的 IDE + 代理整合 | 閉源基礎設施 |
| **OpenHands** | L2（程式碼） | 開源自主代理 | 需要自行託管 |

> **2026 年 4 月備註**：Semantic Kernel 已不再列為獨立框架，它已併入 Microsoft Agent Framework。現有的 SK 使用者應規劃遷移。

---

## 決策矩陣

**運用以下邏輯來選擇你的技術堆疊：**

### 核心編排
1. **這是純 RAG 應用嗎？** → **LlamaIndex**。
2. **是否需要長時間執行的狀態／human-in-the-loop？** → **LangGraph**。
3. **高可靠性（99%+）與跨模型可攜性是否至關重要？** → **DSPy**。
4. **你是 C#/.NET 的企業團隊嗎？** → **Microsoft Agent Framework**（取代 Semantic Kernel + AutoGen）。
5. **你正在為商業使用者建立高階自動化嗎？** → **CrewAI + Flows**。

### Agent SDK（根據你的主要模型供應商來選擇）
6. **在 Claude / Anthropic API 上建立代理嗎？** → **Claude Agent SDK**（Python/TS，內建檔案／程式碼／指令工具）。
7. **在 OpenAI API 上建立代理嗎？** → **OpenAI Agents SDK**（輕量交接、防護機制、MCP 支援）。
8. **在 Google Cloud / Gemini 上建立代理嗎？** → **Google ADK**（原生 A2A、Vertex AI 部署、多語言）。
9. **需要跨供應商的代理通訊嗎？** → 在上述任一框架之上使用 **A2A 協定**。

### 程式碼代理
10. **你正在執行自主式檔案系統層級的程式碼任務嗎？** → **Claude Code**（CLI）或 **Cline**（VS Code）。
11. **需要可搭配任何 LLM 的開源程式碼代理嗎？** → **OpenHands**（Docker）。
12. **想要最佳的 AI IDE 體驗嗎？** → **Cursor**（閉源）或 **Windsurf**（Codeium）。

---

## 自建 vs. 採購 vs. 框架

身為 Staff 工程師，你必須抵抗**框架膨脹**。

- 當框架能解決一個**非瑣碎的電腦科學問題**時（例如狀態持久化、貝氏提示最佳化、向量與圖的連結），就**使用框架**。
- 當你只是對 LLM 做簡單呼叫時，就**自建（薄包裝）**。框架會增加延遲、版本更新的變動，以及除錯的負擔，對於單輪代理而言並不值得。

---

## 應避免的反模式

1. **框架隧道效應（Framework Tunnelling）**：試圖把複雜的邏輯流程硬塞進一個並不支援它的框架（例如用純 RAG 函式庫來做程式碼代理）。
2. **黃金鎚（The Golden Hammer）**：只因為 LangChain 很熱門就使用它，但其實一個 50 行的 Python 腳本會更快、更便宜。
3. **忽視可觀測性**：在沒有 LLOps 層（LangSmith/Phoenix）的情況下部署任何框架。

---

## Staff 等級的建議

對於現代、生產等級的代理式系統：
- **編排**：LangGraph（用於狀態與迴圈）或 Microsoft Agent Framework（適用於 .NET 團隊）。
- **Agent SDK**：對應你的模型供應商，Claude Agent SDK（Anthropic）、Agents SDK（OpenAI）、ADK（Google）。三者皆支援 MCP 以存取工具。
- **最佳化**：DSPy（用於為不同模型層級編譯提示）。
- **檢索**：LlamaIndex（用於多階段 RAG）。
- **可觀測性**：LangSmith（用於追蹤與評估）。
- **跨供應商代理**：A2A 協定，用於跨組織邊界的代理對代理協調。
- **自主程式碼撰寫**：Claude Code（CLI）或 Cline（VS Code），用於檔案層級的編輯任務。
- **開源程式碼代理**：OpenHands，用於自行託管或 CI 管線整合。

**2026 年的洞見**：
1. 代理式程式碼工具（Claude Code、Cursor、OpenHands）並不是編排框架的替代品，它們是一個**全新的類別**，運作於檔案系統層級，位於 LLM API 之上、應用邏輯之下。
2. 協定層已趨成熟：**MCP 用於代理對工具**，**A2A 用於代理對代理**，正在成為基礎設施標準，而非可選的附加元件。請將你的架構設計為同時支援這兩者。
3. 每家實驗室推出自己的 agent SDK 會帶來**供應商鎖定風險**。可透過使用 MCP 來存取工具（可在不同 SDK 間移植）以及使用 A2A 來進行代理協調（供應商中立）來緩解。

> *更新於 2026 年 5 月。*

---

## 面試問題

### Q：為什麼我們看到一種從「提示（Prompting）」轉向「程式化（Programming）」（DSPy）的趨勢？

**有力的回答：**
**工業化**。提示工程是一門「煉金術」：它不一致，且無法規模化。透過像 DSPy 這樣的框架來程式化 LLM，讓我們能把 AI 當成一門**軟體工程學科**來對待。我們可以套用 CI/CD、單元測試（指標）以及自動化最佳化。這把 AI 從「不確定的魔法」推向更大型分散式系統中的**可預測元件**，而這正是任何關鍵任務生產環境的要求。

### Q：如果你必須建立一個能跨 OpenAI、Anthropic 與本機 Llama 模型運作的系統，你會如何設計其架構？

**有力的回答：**
我會用 **DSPy** 作為提示層，並用 **LangGraph** 作為編排層。DSPy 的 **Signatures** 讓我能把任務定義與模型的特定行為解耦。接著我會用一個**通用模型閘道**（例如 LiteLLM 或內部代理）來處理不同的 API 格式。對於工具存取，我會使用 **MCP**，它與模型無關，因此無論作用中的 LLM 後端是哪一個，同一批 MCP 伺服器都能運作。如果我需要跨團隊的代理協調，我會在邊界層使用 **A2A**。這套堆疊確保了：如果我因成本或延遲因素需要從 GPT-4o 切換到 Claude Sonnet 4，我不必重寫 50 條提示，只要重新編譯或更新設定即可。

### Q：在每家 AI 實驗室都推出自己的 agent SDK（Claude Agent SDK、OpenAI Agents SDK、Google ADK）的情況下，你如何避免供應商鎖定？

**有力的回答：**
關鍵在於**把編排層與模型層分離**。我會用一個與框架無關的編排器（例如 LangGraph）或一個薄的自建包裝，來處理核心的工作流程邏輯。特定模型的 SDK 在原型開發時，或是當你已決定採用單一供應商時，相當有用；但對於生產環境的多供應商系統，我會把模型互動藏在一層抽象之後（LiteLLM 閘道或 DSPy signatures）。對於工具存取，**MCP** 提供了可攜性，同一個 MCP 伺服器可搭配任何 SDK 運作。對於代理協調，**A2A** 提供了供應商中立的代理對代理通訊。實務上的原則是：在葉節點（個別代理的實作）使用特定實驗室的 SDK，但讓編排圖保持供應商中立。

---

## 參考資料
- Google Cloud. "Enterprise Generative AI Reference Architecture" (2025)
- Gartner. "Magic Quadrant for AI Application Frameworks" (2025)
- Gartner. "Predicts 2026: 40% of Enterprise Apps to Feature AI Agents" (2025)
- Thoughtworks. "Technology Radar: The Rise of Agentic Frameworks" (Nov 2024/2025)
- Microsoft. "Agent Framework Overview" (2026)
- Anthropic. "Claude Agent SDK" (2026)
- Google. "Agent Development Kit" (2026)
- OpenAI. "Agents SDK" (2026)

---

*下一篇：[駕馭框架變動](12-navigating-framework-churn.md)*
