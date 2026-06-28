# 規劃與分解

規劃是讓代理能夠解決多階段問題而不會「漫無目的」的「System 2」元件。生產環境的代理已經從簡單的「Chain-of-Thought」進化到 **遞迴分解（Recursive Decomposition）** 與 **樹搜尋（Tree Search）**，並由推理原生模型（Claude Opus 4.7、GPT-5.5 extended thinking、DeepSeek-R2）在內部完成繁重的規劃工作。

## 目錄

- [規劃光譜](#spectrum)
- [靜態規劃與動態規劃](#static-vs-dynamic)
- [Chain-of-Thought（CoT）與 o1 推理](#cot)
- [遞迴式任務分解](#decomposition)
- [代理路徑的樹搜尋（MCTS）](#mcts)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 規劃光譜

| 方法 | 策略 | 複雜度 | 最適用於 |
|--------|----------|------------|----------|
| **線性（Linear）** | 一次一個步驟 | 低 | 簡單工具 |
| **分支（Branching）** | If-Then-Else 邏輯 | 中 | 條件式流程 |
| **階層式（Hierarchical）** | 主計畫 -> 子計畫 | 高 | 軟體工程 |
| **搜尋式（Search-Based）** | 在內部嘗試多條路徑 | 最高 | 科學研究 |

---

## 靜態規劃與動態規劃

### 靜態（Plan-and-Solve）
代理寫出一份 10 步驟的計畫並嚴格依照執行。
- **優點**：效能高，容易平行化。
- **缺點**：脆弱。如果第 2 步失敗，第 3 到 10 步就都沒用了。

### 動態（自適應）
代理寫出一份計畫，但在 **每次工具呼叫之後重新評估（Re-evaluates）**。
- **最佳實務**：採用 **檢查點規劃（Checkpointed Planning）**。代理被強制在每個主要子目標完成後，將進度「提交（Commit）」到狀態儲存區，以便在計畫失敗時能夠復原並「回溯（Backtracking）」。

---

## CoT 與 o1 推理

模型內部的「思考（Thinking）」視窗（推論擴展，Inference scaling）扮演著 **隱藏規劃者（Hidden Planner）** 的角色。
- 我們不使用獨立的「Planner LLM」，而是使用推理模型（Claude Opus 4.7、GPT-5.5 extended thinking、DeepSeek-R2）來產生一份「心智草稿（Mental Draft）」。
- 這份草稿會被轉譯成一個 **任務 DAG（有向無環圖，Directed Acyclic Graph）**，交由編排器執行。

---

## 遞迴式任務分解

對於龐大的任務（例如「建構一個全端應用程式」），我們會使用 **子代理衍生（Sub-Agent Spawning）**。
1. **主代理（Master Agent）**：將「專案」分解成「前端」、「後端」與「資料庫」。
2. **子代理（Sub-Agents）**：每個子代理接收一個「子目標」，並執行自己的分解。
3. **整合（Consolidation）**：主代理合併所有結果。

**關鍵細節**：每個子代理只會被賦予 **最小上下文（Minimal Context）**（僅提供其所需的內容），以防止 token 膨脹與幻覺。

---

## 樹搜尋（MCTS）

對於高風險的決策，我們會在代理迴圈中採用 **蒙地卡羅樹搜尋（Monte Carlo Tree Search, MCTS）**。
- 代理「模擬（Simulates）」10 種可能的工具呼叫。
- 一個 **獎勵模型（Reward Model）**（或一個獨立的 LLM 提示）為每個模擬評分。
- 代理依循獎勵最高的那條路徑。

---

## 面試問題

### Q：你如何防止代理在任務分解過程中發生「無限遞迴（Infinite Recursion）」？

**優秀答案：**
我們會實作 **分解深度限制（Decomposition Depth Limits）**（通常是 3 層）以及 **粒度檢查（Granularity Checks）**。在衍生子代理之前，我們會詢問 Supervisor 模型：「這個任務是否小到可以用單一工具呼叫解決？」如果是，就直接執行；如果不是，就進行分解。我們也會使用一個 **全域控制器（Global Controller）** 來追蹤總「代理數量（Agent Count）」，以防止可能耗盡 API 預算的遞迴炸彈（fork bomb）。

### Q：為什麼「計畫修訂（Plan Revision）」通常比「計畫產生（Plan Generation）」更昂貴？

**優秀答案：**
計畫產生是一次「全新開始」。計畫修訂則需要 **上下文重新評估（Context Re-evaluation）**，模型必須理解 *已經完成* 了什麼、*前一個步驟為何失敗*，以及如何在不破壞先前成果的前提下修正它。這需要高得多的「推理密度（Reasoning Density）」。在生產環境中，我們通常會在 **修訂** 步驟使用較大的模型（例如 Sonnet 3.7 或 o1），而在初始的計畫產生階段使用較小的模型。

---

## 參考資料
- Silver et al. "Mastering the game of Go with deep neural networks and tree search"（應用於 LLM，2024/2025）
- Wang et al. "Self-Consistency Improves Chain of Thought Reasoning"（2022 年，2025 年更新）
- LangGraph. "Multi-Agent Planning Patterns"（2025）

---

*下一篇：[錯誤處理與復原](07-error-handling-and-recovery.md)*
