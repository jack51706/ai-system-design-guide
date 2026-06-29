# 代理式 RAG

代理式 RAG 從「線性管線」轉向**「推理迴圈」**。代理不再只檢索一次，而是自行決定*何時*以及*要檢索什麼*來解答查詢。主流的生產環境模式包括 Self-RAG（模型發出反思 token）、Corrective RAG（搭配修正路由的檢索評估器）、Adaptive RAG（由分類器挑選管線深度）、針對文件的 ReAct，以及多跳查詢分解。在處理具狀態的迴圈時，LangGraph 是最常見的控制流執行環境；而 LlamaIndex Workflows 則常用於單一管線、檢索密集的變體。

## 目錄

- [線性 RAG 與代理式 RAG 的比較](#comparison)
- [Self-RAG（自我反思）](#self-rag)
- [Corrective RAG（CRAG）](#crag)
- [多跳推理迴圈](#multi-hop)
- [代理式過濾與計畫修訂](#planning)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 線性 RAG 與代理式 RAG 的比較 {#comparison}

| 模型 | 線性 RAG | 代理式 RAG |
|-------|------------|-------------|
| **結構** | 預先決定的序列 | 動態迴圈 |
| **自我修正** | 無 | 高（可重新檢索） |
| **查詢複雜度**| 簡單（單步） | 困難（多步） |
| **延遲** | 低（固定） | 變動（多輪） |

**原則**：當查詢需要的是「綜合佐證」而不只是「文件比對」時，才採用代理式 RAG。要為它預留預算：一個 3 至 4 次迭代的迴圈端到端通常需要 8 至 12 秒，因此若你的使用者體驗需要 3 秒以內的回應，請把簡單查詢導向快速路徑（Adaptive RAG）。

---

## Self-RAG（自我反思） {#self-rag}

在 2024 / 2025 年廣為流行，**Self-RAG** 利用「批判 token（Critic Tokens）」來評估自己的成果。

1. **檢索**：模型拉取 Top-K 區塊。
2. **評估**：這些資訊相關嗎？（批判：`Relevant`）
3. **生成**：答案有獲得支持嗎？（批判：`Supported`）
4. **迭代**：如果答案沒有獲得支持，模型會*自動*觸發一次更廣泛的搜尋。

---

## Corrective RAG（CRAG） {#crag}

CRAG 在檢索與生成之間加入了一層「可靠性層」。

- **邏輯**： 
  - 如果檢索結果**正確**：直接生成。
  - 如果檢索結果**模稜兩可**：使用網路搜尋工具來補充。
  - 如果檢索結果**錯誤**：捨棄上下文，改用外部搜尋或後備邏輯。

---

## 多跳推理迴圈 {#multi-hop}

對於像「收購 Figma 的那家公司的 CEO 是誰？」這類問題，系統必須：
1. **第 1 跳**：搜尋「是誰收購了 Figma？」（結果：Adobe）。
2. **第 2 跳**：搜尋「Adobe 的 CEO」（結果：Shantanu Narayen）。

**代理式模式**：代理會維護一個「狀態物件（State Object）」，並在每次檢索後更新其「子目標（Sub-goal）」，直到整條推理鏈完成為止。

---

## 代理式過濾與計畫修訂 {#planning}

現代代理會使用**子步驟計畫（Sub-Step Plans）**。
- 代理不會做一次大規模檢索，而是先寫下一份計畫：「我會先在內部資料庫中查 X，接著再查公開 API 上的 Y。」
- **修訂式規劃**：如果步驟 1 失敗，代理會*重寫*步驟 2。

---

## 面試問題 {#interview-questions}

### 問：代理式 RAG 中的「推理與檢索平衡（Reasoning-Retrieval Balance）」是什麼？

**優秀的回答：**
代理式迴圈中的每一次「推理輪次」都會增加 token 成本與使用者延遲。生產環境工程師的目標是找出「檢索門檻（Retrieval Threshold）」。我們會運用 **Token 預算分配（Token-Budgeting）**，只允許代理進行 3 至 5 次「輪次」，之後就強制給出最終答案。我們也會運用**推測式檢索（Speculative Retrieval）**，也就是讓代理預測它接下來要採取的 2 個步驟，並同時為兩者進行檢索，以降低來回往返的延遲。

### 問：為什麼代理式 RAG 往往帶來更高品質，卻有更低的「可靠性（確定性）」？

**優秀的回答：**
代理式 RAG 是非確定性的，因為模型會在每一步「決定」自己的路徑。使用者查詢上的微小改變，可能導致代理挑選不同的工具或搜尋策略，進而產生不同格式的答案。標準的緩解做法是採用**受約束的代理框架（Constrained Agent Frameworks）**（例如 LangGraph 或 DSPy），其中「可能路徑的圖（Graph of possible paths）」被嚴格定義，即使這些路徑*之間*的選擇仍是隨機的。

---

## 參考資料 {#references}
- Asai et al. "Self-RAG: Learning to Retrieve, Generate, and Critique" (2024/2025)
- Yan et al. "Corrective Retrieval Augmented Generation (CRAG)" (2024)
- LangChain. "Agentic RAG with LangGraph" (2025)

---

*下一篇：[進階檢索模式](09-advanced-retrieval-patterns.md)*
