# RLHF 與 DPO（對齊）

對齊（Alignment）是確保 LLM 的行為符合人類價值觀與指令的過程。這個領域已經從傳統的 RLHF 轉向更高效、更可擴展的方法，例如 DPO 與線上 RL（Online RL）。

## 目錄

- [對齊問題](#the-alignment-problem)
- [RLHF：基礎](#rlhf-foundation)
- [DPO：直接偏好最佳化](#dpo)
- [線上對齊](#online-alignment)
- [推理模型的對齊](#alignment-for-reasoning)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 對齊問題 {#the-alignment-problem}

預訓練模型「知識豐富但不受控制」。它們可能會：
1. 產生有害內容（安全性）。
2. 無法遵循指令（指令遵循）。
3. 產生嚴重幻覺（事實性）。

對齊會建立「獎勵模型（Reward Model）」與「策略更新（Policy Update）」來引導模型。

---

## RLHF：基礎 {#rlhf-foundation}

基於人類回饋的強化學習（Reinforcement Learning from Human Feedback, RLHF）包含三個步驟：
1. **SFT**：監督式微調（Supervised Fine-Tuning）。
2. **獎勵模型（RM）**：在 `(Prompt, Winning_Response, Losing_Response)` 上訓練一個模型，用來預測人類給出的分數。
3. **PPO（Proximal Policy Optimization，近端策略最佳化）**：透過強化學習，利用 RM 為 LLM 提供「獎勵訊號」。

**細節**：由於需要額外訓練一個獨立的獎勵模型所帶來的開銷，加上 PPO 本身的不穩定性，傳統 RLHF 現在被認為對多數團隊而言過於複雜且不穩定。

---

## DPO：直接偏好最佳化 {#dpo}

DPO 是業界標準。它消除了對獎勵模型的需求。

### 運作方式：
DPO 透過數學推導，直接從偏好資料中導出最佳策略，把 LLM 本身當作獎勵模型來使用。
- **目標**：相對於一個固定的「參考模型（reference model）」，最大化「勝出」回應的機率，同時最小化「落敗」回應的機率。

### 多階段對齊模式：
1. **基礎 SFT**：5k 至 10k 筆高品質樣本。
2. **DPO 步驟一**：針對指令遵循進行對齊。
3. **DPO 步驟二**：針對安全性與特定語氣進行對齊。

---

## 線上對齊 {#online-alignment}

**離線 DPO 的問題**：它只能從靜態資料中學習。如果模型的能力進步到超越那些資料，就會碰到天花板。

**解決方案：線上 DPO（或 RLOO）**：
1. 模型針對一個提示產生 4 至 8 個回應。
2. 一個**評審模型（Judge Model）**（例如 GPT-5.5、Claude Opus 4.7）或一個**基於規則的獎勵（Rule-based Reward）**（例如程式碼執行）即時對這些回應進行排序。
3. 模型根據這個「線上（Online）」回饋立即更新其策略。

---

## 推理模型的對齊（o1／DeepSeek-R1 風格）

對齊「思考型」模型需要從**回應偏好（Response Preference）**轉向**過程偏好（Process Preference）**。

| 特性 | 標準對齊 | 推理對齊 |
|---------|-------------------|---------------------|
| 獎勵目標 | 最終答案 | **思維鏈（Chain of Thought, CoT）** |
| 獎勵訊號 | 有幫助／安全 | **正確性 + 簡潔性** |
| 方法 | 人類排序 | 基於規則（例如「程式碼是否能執行？」） |

**首席工程師等級的細節**：「基於驗證的 RL（Verification-based RL）」是當今前沿模型的秘訣。我們不再由人類來判斷哪個比較好，而是使用可硬性驗證的結果（數學答案、程式碼測試案例）作為獎勵訊號。

---

## 面試問題 {#interview-questions}

### Q：為什麼 DPO 經常比 RLHF／PPO 更受青睞？

**理想答案：**
DPO 之所以更受青睞，主要是因為它的簡單與穩定。PPO 需要在記憶體中同時維護四個模型（Policy、Reference、Value 與 Reward），這對 VRAM 的消耗極大。此外，PPO 對超參數出了名地敏感，經常會出現「獎勵作弊（reward hacking）」或突然崩潰的情況。DPO 把對齊視為一個在偏好配對上進行的簡單分類問題，使其更為穩健、更容易調校，而且執行成本顯著更低。

### Q：「對齊稅（Alignment Tax）」的風險是什麼？

**理想答案：**
「對齊稅」指的是模型在針對安全性或特定人格進行對齊後，其原始能力（例如程式設計、創意寫作或邏輯推理）出現的下降。由於模型被迫優先考量安全性或對特定風格的遵循，它可能變得「過於謹慎」，或失去它在預訓練期間所學到的細膩之處。**可引導對齊（Steerable Alignment）**與**帶 KL 懲罰的 DPO（DPO-with-KL-penalty）**等現代技術，目標就是透過確保模型策略不會偏離原始預訓練分布太遠，來把這種影響降到最低。

---

## 參考資料 {#references}
- Rafailov et al. "Direct Preference Optimization: Your Language Model is Secretly a Reward Model" (2023)
- Schulman et al. "Proximal Policy Optimization Algorithms" (2017)
- OpenAI. "Learning to Reason with LLMs" (2024)

---

*下一篇：[知識蒸餾](05-knowledge-distillation.md)*
