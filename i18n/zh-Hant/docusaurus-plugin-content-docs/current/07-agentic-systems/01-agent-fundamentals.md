# 代理基礎

代理是由 LLM 驅動的系統，從「聊天」進化到「自主問題解決」。其定義已從簡單的 ReAct 迴圈，轉變為運用內建「System 2」思考的**閉迴圈推理系統（Closed-Loop Reasoning Systems）**（Claude Opus 4.7 延伸思考、GPT-5.5 推理、DeepSeek-R2、Gemini 3.1 Pro Deep Think）。

## 目錄

- [代理公式](#formula)
- [System 1（LLM）對 System 2（推理模型）](#systems)
- [代理層級（自主光譜）](#levels)
- [核心元件](#components)
- [代理生命週期](#lifecycle)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 代理公式

現代的代理能力通常被描述為：
`Agent = Reasoning Model + Tool Use + Persistent Memory + Environment Feedback`

**細微之處**：在 2023 年，代理只是聊天模型的「包裝層（wrappers）」。如今，代理愈來愈趨向**整合化（Integrated）**。前沿模型（Claude Opus 4.7、具推理能力的 GPT-5.5、DeepSeek-R2）已將「思考」過程內建於預訓練之中，使代理迴圈更穩定，也較不容易「卡住（stalling）」。

---

## System 1 對 System 2 思考

設計代理架構需要選擇正確的「思考模式」：

| 模式 | 認知類型 | 類比 | 目前技術堆疊 |
|------|----------------|---------|---------------|
| **System 1** | 快速、直覺、反應式 | 反射動作 | Claude Haiku 4.5 / Sonnet 4.6 / GPT-5.5-mini / Gemini 3.1 Flash |
| **System 2** | 緩慢、邏輯、規劃 | 深思熟慮 | Claude Opus 4.7 / GPT-5.5 推理 / DeepSeek-R2 / Gemini 3.1 Pro Deep Think |

**設計模式**：將 System 1 模型用於「快速 UI」與「路由」。將 System 2 模型用於「決策關卡（Decision Gates）」與「複雜規劃」。

---

## 代理層級

並非每個自主系統都是「代理」。我們依**代理程度（Level of Agency）**將它們分類：

1. **L0：腳本化串接（Scripted Chains）**：固定順序（例如標準的 LangChain）。
2. **L1：工具啟用（Tool-Enabled）**：模型挑選工具，但不做規劃。
3. **L2：ReAct 代理**：簡單的「思考 -> 行動 -> 觀察」迴圈。
4. **L3：自主規劃者（Autonomous Planner）**：將目標分解為子任務的圖。
5. **L4：環境代理（Ambient Agent）**：在背景執行，僅在必要時才介入。

---

## 核心元件

### 1. 推理模型（決策核心）
代理的 CPU。它決定「通往成功的路徑」。

### 2. 工具（肢體）
讓代理能夠影響世界的介面（API、瀏覽器、資料庫）。
> [!Note]
> **Model Context Protocol（MCP）** 現已成為工具互通性的業界標準，獲得 Anthropic、OpenAI、Google、Microsoft 與 AWS 採用。其治理權已於 2025 年 12 月移交給 Linux Foundation 旗下的 Agentic AI Foundation。

### 3. 記憶（經驗）
- **短期**：上下文視窗（KV Cache）。
- **長期**：向量資料庫或持久狀態（例如 Mem0）。

---

## 代理生命週期

1. **接收（Intake）**：接收使用者目標。
2. **分解（Decomposition）**：將目標拆解為子步驟。
3. **執行（Execution）**：呼叫工具並處理結果。
4. **反思（Reflection）**：評估該觀察結果是否讓代理更接近目標。
5. **完成（Completion）**：為使用者綜整出最終證明。

---

## 面試問題

### Q：為什麼「推理模型」（例如具延伸思考能力的 Claude Opus 4.7 或 GPT-5.5）在代理能力上優於標準 LLM？

**理想回答：**
標準 LLM（System 1）是依據模式比對來預測*下一個 token*。當它們在工具呼叫中遇到錯誤時，往往會幻覺出一個修正方案，而不是承認失敗。推理模型則在推論期間運用**思維鏈（Chain-of-Thought, CoT）**。它們會在輸出回應之前，透過多個隱藏回合進行「思考」。對代理而言，這意味著更高的**路徑可靠度（Path Reliability）**，因為模型已在內部模擬過失敗，所以明顯較不容易進入無限迴圈，或重複嘗試同一個失敗的動作兩次。

### Q：你如何在長時間執行的任務中防止「代理漂移（Agentic Drift）」？

**理想回答：**
當子步驟讓代理偏離原始目標太遠，以致失去上下文時，就會發生代理漂移。標準解法是**目標錨定（Goal Anchoring）**：將「原始目標」以釘選的系統訊息形式納入，並使用**次要觀察者模型（Secondary Observer Model）**（一個較小、較便宜的模型）針對原始目標為每個代理動作評分。一旦分數低於門檻，就強制代理從根節點重新「重新規劃（re-plan）」。

---

## 參考資料
- Kahneman, D. "Thinking, Fast and Slow"（應用於 AI，2025）
- OpenAI. "Learning to Reason with LLMs"（2024）
- DeepSeek. "R1: Cold-Start Data for Reasoning"（2025）

---

*下一篇：[推理迴圈：ReAct 與其延伸](02-reasoning-loops-react-and-beyond.md)*
