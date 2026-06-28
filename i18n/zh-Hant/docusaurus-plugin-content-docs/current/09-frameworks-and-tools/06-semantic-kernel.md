# Semantic Kernel

**Semantic Kernel (SK)** 是微軟用於企業級 AI 編排的引擎。對於投入 **Azure/Microsoft 生態系**與 **C#/.NET** 架構的組織而言，它仍是主要的橋樑，儘管它如今大部分的前進動能都已併入 **Microsoft Agent Framework**（AutoGen 與 SK 整併後的後繼者，RC 1.0 於 2026 年 2 月推出，GA 預定於 2026 年第二季）。

## 目錄

- [企業 DNA](#dna)
- [Plugins 與 Planners](#plugins)
- [記憶體與 Connectors](#memory)
- [多語言支援（C# vs. Python）](#multi-language)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 企業 DNA

LangChain 受到新創公司的青睞，而 Semantic Kernel 則受到**銀行與 Fortune 500 企業**的青睞。
- **Dependency Injection（依賴注入）**：SK 遵循標準的企業設計模式。
- **Strong Typing（強型別）**：對 C# 型別的第一級支援，使其在大規模關鍵任務系統中具有高度可靠性。
- **安全性**：與 Azure Active Directory（Microsoft Entra ID）及 Managed Identities 深度整合。

---

## Plugins 與 Planners

1. **Kernel Functions**：邏輯的基本單位（原生程式碼或 LLM 提示）。
2. **Plugins**：一組函式的集合（例如「GitHub Plugin」或「SQL Plugin」）。
3. **Planners**：SK 的 planners 已從簡單的 ReAct 演進為**階層式 Planners（Hierarchical Planners）**，能夠協調跨越多天的長時間執行業務流程。

---

## 記憶體與 Connectors

Semantic Kernel 使用 **Connectors** 來抽象化底層基礎設施。
- **通用 Connectors**：以單一介面對接 OpenAI、Mistral 與本地端的 Onyx 模型。
- **向量儲存抽象化**：在 Azure AI Search、Pinecone 與 Qdrant 之間無縫切換，而無需更動核心業務邏輯。

---

## 多語言支援

SK 是少數將 C# 與 Python 視為對等地位的主流框架之一。
- **模式**：在 Python 中開發與製作原型；在 C# 中部署核心編排，以兼顧效能與型別安全。
- **邏輯共享**：共用的提示範本（.yaml）可在兩種語言之間通用。

---

## 面試問題

### Q：為什麼 Staff Engineer 會選擇 Semantic Kernel 而非 LangChain？

**有力的回答：**
**架構契合度**。如果一個組織已經建立在 .NET/Azure 技術堆疊之上，Semantic Kernel 便能融入他們既有的 CI/CD、監控（App Insights）與安全性（Entra ID）管線之中。LangChain 往往給人一種「外部」技術的感覺。此外，SK 的 **Strong Typing（強型別）**與 **Dependency Injection（依賴注入）**模式，能避免大型 LangChain 專案中經常出現的「義大利麵式程式碼（spaghetti code）」。對於處理敏感金融資料的企業而言，安全性與稽核的 **Native Azure 整合**正是決定性的關鍵因素。

### Q：Semantic Kernel 中的「Function Calling」抽象是什麼？

**有力的回答：**
SK 採用**以 Plugin 為基礎的模型**。每個函式（原生 C# 或基於 LLM 的函式）都會註冊到 Kernel 中。當 LLM 判斷它需要某個工具時，Kernel 會在 Plugin 註冊表中查找該函式、驗證參數，並執行它。SK 現在支援**自動意圖偵測（Automatic Intent Detection）**：Kernel 能根據當前的上下文視窗，在使用者尚未提出需求之前，就主動建議他們可能需要哪個 Plugin。

---

## 參考資料
- Microsoft Learn. "Semantic Kernel Documentation" (2025)
- Azure Architecture Center. "AI Design Patterns with Semantic Kernel" (2025)
- Build 2025. "The Future of Copilots with SK" (2025 Conference Recap)

---

*下一篇：[AutoGen 與 CrewAI](07-autogen-crewai.md)*
