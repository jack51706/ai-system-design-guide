# 人在迴路中（Human-in-the-Loop）模式

沒有任何代理是 100% 可靠的。**人在迴路中（Human-in-the-Loop, HITL）**是在高風險環境中確保安全性與準確性的橋樑。生產環境的技術堆疊已經超越了「核准按鈕」，邁向**協同推理（Co-Reasoning）**與**基於中斷的引導（Interrupt-Based Steering）**，並在 LangGraph（interrupt+resume）與 Microsoft Agent Framework 等框架中原生提供。

## 目錄

- [HITL 光譜](#spectrum)
- [中斷與斷點](#interrupts)
- [時光旅行除錯（狀態編輯）](#time-travel)
- [協同推理（共享暫存區）](#co-reasoning)
- [基於信心的升級](#escalation)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## HITL 光譜 {#spectrum}

| 模式 | 代理自主性 | 人類角色 | 最適用於 |
|---------|---------------|------------|----------|
| **人類指揮（Human-in-command）** | 低 | 主導每一個步驟 | 高風險的法律／醫療 |
| **人類作為過濾器（Human-as-filter）** | 中 | 核准／編輯最終輸出 | 內容生成 |
| **人類作為後備（Human-as-backup）** | 高 | 只在出錯時介入 | 客戶支援 |
| **人類在迴路上（Human-on-the-loop）** | 最高 | 在完成後稽核日誌 | 大量分析 |

---

## 中斷與斷點 {#interrupts}

現代架構（LangGraph、Microsoft Agent Framework）使用**確定性斷點（Deterministic Breakpoints）**。

- **此模式**：系統被硬編碼為在呼叫特定敏感工具之前「暫停」（例如 `execute_purchase` 或 `delete_user`）。
- **此決策**：環境會等待使用者送出 `approve` 或 `reject` 訊號。
- **狀態保存**：代理的推理狀態會在資料庫中被「凍結」，直到人類採取行動為止。

---

## 時光旅行除錯（狀態編輯） {#time-travel}

標準代理是「單向的」。如果它們在步驟 3 出錯，這個工作階段通常就毀了。
- **創新之處**：**狀態注入（State Injection）**。人類審查者可以「回到」步驟 3 的狀態，編輯代理的觀察或想法，然後「恢復」執行。
- **影響**：它讓人類能夠把代理從錯誤的路徑上「引導」開來，而不必從零開始。

---

## 協同推理（共享暫存區） {#co-reasoning}

人類不再是「裁判」，而是成為**「夥伴」**。
- 代理會把它的**暫存區（Scratchpad）**（內部思考）展示給人類看。
- 其特徵為：*「我打算使用工具 A，因為事實 B。你覺得這樣對嗎？」*
- **好處**：在推理錯誤轉化為行動*之前*就將其攔截。

---

## 基於信心的升級 {#escalation}

利用支援「Logprobs」或內建推理步驟的模型，我們計算出一個**不確定性分數（Uncertainty Score）**。

- 如果分數超過閾值，代理會**自動暫停**並發送通知給人類操作員。
- **範例**：一個試圖解決複雜帳單爭議的代理意識到使用者的意圖含糊不清。它停下來並說：*「我不是 100% 確定該如何處理這個特定的退款案例。請稍候，我去請一位人類專家來看看這個問題。」*

---

## 面試問題 {#interview-questions}

### Q：你如何設計一個不會讓人類操作員「疲乏」的 HITL 系統？

**優秀答案：**
我們使用**閾值調校（Threshold Tuning）**。我們不會在每一個動作上都要求核准。我們只在以下情況觸發 HITL：1) 高風險的「寫入」工具、2) 低信心的推理步驟，或 3) 違反業務所設定「政策」的動作。此外，我們會提供人類一份**情境摘要**，不是給他們看整份日誌，而是給他們看一句話的「Diff」，說明代理想要做什麼。這把「審查的認知負荷」從數分鐘降到數秒。

### Q：HITL 中的「過度依賴（Over-Reliance）」風險是什麼，你如何緩解它？

**優秀答案：**
過度依賴發生在人類開始不讀日誌就一直點「核准」的時候。我們透過**強制審查檢查點（Forced Review Checkpoints）**（例如，人類必須在提議的計畫中至少編輯一個字）或**合成錯誤注入（Synthetic Error Injections）**（刻意在 1% 的時間給人類看一個「錯誤」的計畫，看他們是否能抓出來）來緩解這個問題。如果他們通過了「陷阱」，就繼續進行；如果他們失敗了，就會被標記去接受額外的訓練。

---

## 參考資料 {#references}
- Wu et al. "Co-reasoning: Human-AI Collaboration Patterns" (2025)
- LangChain. "Human-in-the-loop in LangGraph" (2024/2025)
- Anthropic. "Designing for Safety and Human Oversight" (2024)

---

*下一篇：[代理式安全與沙箱化](09-agentic-security-and-sandboxing.md)*
