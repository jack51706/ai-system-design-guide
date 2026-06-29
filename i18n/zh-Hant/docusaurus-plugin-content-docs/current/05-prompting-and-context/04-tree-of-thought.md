# 思維樹（Tree-of-Thought, ToT）

思維樹（ToT）是一種進階的提示架構，模型會探索多條推理路徑、加以評估，並在某條路徑走進死路時「回溯」。它正是現代自主研究代理背後的藍圖。

## 目錄

- [樹狀 vs 鏈狀](#tree-vs-chain)
- [ToT 迴圈：提議、評估、搜尋](#tot-loop)
- [自我修正與回溯](#self-correction)
- [MCTS 與搜尋即服務](#mcts)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 樹狀 vs 鏈狀 {#tree-vs-chain}

**思維鏈（Chain-of-Thought）** 是線性的（單一路徑），而 **思維樹（Tree-of-Thought）** 則允許分支。

| 特性 | 思維鏈 Chain-of-Thought | 思維樹 Tree-of-Thought |
|---------|------------------|-----------------|
| **拓撲結構** | 線性（1 條路徑） | 分支（多條路徑） |
| **邏輯** | 循序 | 平行 + 評估式 |
| **自我修正**| 低（承諾偏誤） | 高（回溯） |
| **使用情境** | 數學、簡單邏輯 | 解謎、程式架構設計、策略規劃 |

---

## ToT 迴圈：提議、評估、搜尋 {#tot-loop}

一個 ToT 系統由三個模組組成：
1. **思維提議者（Thought Proposer）**：為問題產生 3 至 5 個可能的「下一步」。
2. **狀態評估器（State Evaluator）**：為每一步評分（例如「良好」、「也許」、「不可能」）。
3. **搜尋演算法（Search Algorithm）**：（BFS 或 DFS）用以決定接下來要探索哪一條分支。

```python
# The ToT logic (Simplified):
For each branch:
   Score = Evaluate(branch)
   If Score < Threshold:
      Prune branch (Backtrack)
   Else:
      Continue exploring
```

---

## 自我修正與回溯 {#self-correction}

ToT 是專門為了克服 **幻覺串連（Hallucination Cascades）** 而設計的。
在線性的鏈狀結構中，如果模型在第 1 步犯了錯，後續每一步都很可能跟著錯。在 ToT 中，「評估器」（可以是另一個模型，或是以規則為基礎的檢查）會在第 1 步就抓出錯誤，並迫使模型嘗試不同的起始點。

---

## MCTS 與搜尋即服務 {#mcts}

ToT 已經演進為應用於 LLM 的 **蒙地卡羅樹搜尋（Monte Carlo Tree Search, MCTS）**。
- **搜尋時運算擴展（Search-time Compute Scaling）**：我們不使用單一的大型提示，而是用 100 個小型提示去「搜尋」最佳答案。
- **RAD-T（Reasoning-as-Data-Tree）**：專門的「搜尋者（Searcher）」模型（Gemini 3.1 Pro Deep Think、GPT-5.5 extended thinking、Claude Opus 4.7）原生就經過訓練，能夠管理這些分支。

---

## 面試問題 {#interview-questions}

### Q：在什麼情況下 ToT 會明顯優於單純的 CoT？

**優秀答案：**
當問題擁有「龐大的搜尋空間」且需要「全域一致性」時，ToT 表現更佳。舉例來說，在一次複雜的軟體重構中，單一的思維鏈可能一開始進展順利，卻在 10 步之後撞上某個限制條件的衝突。透過 ToT，模型可以提議 3 種不同的重構模式，評估每一種對程式碼庫的影響，並在動筆寫任何程式碼之前，先捨棄那些會導致循環相依的模式。

### Q：思維樹在面向消費者的應用程式中，主要的缺點是什麼？

**優秀答案：**
最主要的缺點是 **指數級的成本與延遲**。探索 3 條分支到深度 5，可能需要 15 至 20 次個別的 LLM 呼叫。在消費者應用程式中，這可能導致單一查詢就產生 30 秒的延遲與 $0.50 的成本。標準的緩解做法是採用「混合模型」：將 ToT 用於高風險的離線任務（例如產生黃金資料集或安全稽核），再把這些結果蒸餾進一個快速的線性模型，供即時互動使用。

---

## 參考資料 {#references}
- Yao et al. "Tree of Thoughts: Deliberate Problem Solving with Large Language Models" (2023)
- Silver et al. "Mastering the Game of Go without Human Knowledge"（MCTS 的靈感來源）

---

*下一篇：[上下文工程](05-context-engineering.md)*
