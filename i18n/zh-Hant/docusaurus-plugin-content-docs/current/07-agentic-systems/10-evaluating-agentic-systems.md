# 評估代理式系統

評估代理與評估 RAG 有著根本上的差異。RAG 著重於「準確度」，而代理著重於 **「可靠性」、「效率」與「安全性」**。生產環境的代理評估仰賴 **軌跡基準測試（Trajectory Benchmarks）** 與 **LLM-as-Judge** 來處理多步驟推理，並搭配 Langfuse、LangWatch、Braintrust 與 Arize Phoenix 等工具，這些工具皆提供原生的追蹤層級評分能力。

> [!NOTE]
> 關於標準 RAG 評估（檢索 vs. 生成指標），請參閱 [06-retrieval-systems/09-advanced-retrieval-patterns.md](../06-retrieval-systems/09-advanced-retrieval-patterns.md) 與第 14 節。本章專注於代理的 *執行路徑（Execution Path）*。

## 目錄

- [評估的轉變](#shift)
- [軌跡基準測試（黃金標準）](#benchmarks)
- [關鍵指標：成功率、成本與時長](#metrics)
- [用於步驟品質的 LLM-as-Judge](#judge)
- [生產環境評估（代理的 A/B 測試）](#production)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 評估的轉變

| 指標 | RAG 應用 | 代理式應用 |
|--------|---------|-------------|
| **評估單位** | 單一回應 | **軌跡**（所有步驟） |
| **成功標準**| 接地性／忠實度 | 任務完成度／邏輯健全性 |
| **複雜度** | 低（文字相似度） | 高（工具狀態驗證） |

---

## 軌跡基準測試

現代評估會為 **「通往結果的路徑」** 評分。
1. **最佳路徑（Optimal Path）**：解決任務所需最短的工具序列。
2. **代理路徑（Agent Path）**：實際採取的步驟。
3. **分數（The Score）**：`Efficiency = (Optimal Steps / Agent Steps)`。分數為 `0.2` 代表代理過度繞路或反覆迴圈。

**常見基準測試**：
- **SWE-bench**：修復 GitHub issue（程式碼代理能力）。
- **WebArena**：操作選單與表單（瀏覽器代理能力）。
- **GAIA**：通用工具使用任務（助理代理能力）。

---

## 關鍵指標

### 1. 任務成功率（TSR）
最終狀態正確的任務所佔的百分比。
> [!IMPORTANT]
> 在資深的生產環境設定中，透過「錯誤路徑」得到「正確答案」的分數為 0。

### 2. 動作成功率（ASR）
回傳有效資料（而非錯誤或幻覺）的個別工具呼叫所佔的百分比。

### 3. 每任務單位成本
每完成一個目標所耗用的總 token 數加上基礎設施成本（沙箱、API 呼叫）。

---

## 用於步驟品質的 LLM-as-Judge

我們使用較強的模型（Claude Opus 4.7、GPT-5.5 reasoning）來審查較小型代理的 **推理日誌（Reasoning Log）**。
- **思考品質（Thought Quality）**：代理使用工具 X 的邏輯，是否確實由觀察 Y 推導而來？
- **冗餘檢查（Redundancy Check）**：代理是否重複了它剛剛執行過的搜尋？
- **回饋迴圈（Feedback Loop）**：這個「Judge」的輸出接著會用於 **DPO（Direct Preference Optimization，直接偏好優化）**，以校準代理未來的行為。

---

## 生產環境評估

生產團隊會使用 **影子執行（Shadow Execution）**。
1. **V1 代理** 回應使用者。
2. **V2（實驗版）代理** 在「隱藏沙箱」中執行相同的查詢。
3. **比較（The Comparison）**：我們比較這兩條軌跡。如果 V2 能持續以更少的步驟解決任務，且沒有安全違規，我們就將其提升至生產環境。

---

## 面試問題

### 問：當環境具有非確定性時（例如網路），你如何評估代理？

**有力的回答：**
我們使用 **模擬環境（Mock Environments）** 或 **快照狀態（Snapshotted States）**。為了進行高擬真度測試，我們會使用一個容器化的瀏覽器，並在每次測試執行時將其重置為乾淨狀態。接著我們將代理的軌跡與一條 **參考軌跡（Reference Trace）** 進行比較。如果環境是真正即時的，我們則使用 **基於狀態的驗證（State-Based Verification）**，也就是不去比較文字，而是檢查外部世界的狀態（例如：「資料庫中是否新增了一列、且值正確的資料？」）。

### 問：為什麼「繞路」（採取過多步驟）在 Staff 等級的代理設計中是嚴重的失敗？

**有力的回答：**
繞路會導致三種失敗：1）**成本**：每一個步驟都是一次 LLM 呼叫；2）**延遲**：每一個步驟都會增加 2 到 5 秒；3）**熵（Entropy）**：軌跡越長，代理遇到觸發幻覺的詭異邊界案例的機率就越高。標準的解法是 **步驟預算（Step Budgets）**：如果代理在 10 個步驟內未能解決任務，我們就終止它並升級交由人類處理，以防止「Token 洩漏（Token Leak）」。

---

## 參考資料
- Jimenez et al. 〈SWE-bench: Can Language Models Resolve Real-World GitHub Issues?〉（2024/2025 更新版）
- Microsoft Research. 〈AgentBench: A Comprehensive Benchmark for AI Agents〉（2024）
- RAGAS. 〈Agentic Evaluation Module〉（2025）

---

*下一篇：[長時間執行代理的持久化執行](11-durable-execution.md)*
