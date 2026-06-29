# 成本優化實戰手冊

AI 成本不再是「玄學」。它們是可衡量、可預測，而且高度可優化的。隨著 API 價格在過去一年下降了 30-60%，成本控制的著力點現在主要在於「路由（routing）」與「快取（caching）」，而不只是挑選比較便宜的供應商。本章將介紹在不犧牲品質的前提下，把推論成本降低 10 倍的各種策略。

## 目錄

- [AI 的單位經濟學](#unit-economics)
- [模型階梯（效率分層）](#model-cascading)
- [小型語言模型（SLMs）](#slms)
- [Spot 執行個體策略](#spot-instances)
- [「Token 稅」優化](#token-tax)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## AI 的單位經濟學 {#unit-economics}

我們以**每美元可得的 Token 數（Tokens per Dollar，$）**來衡量成效。

| 元件 | 成本驅動因素 | 優化方式 |
|-----------|-------------|--------------|
| **運算（Compute）** | GPU 時間（$/hr） | 提升使用率（批次處理 Batching）。 |
| **VRAM** | KV cache 大小 | GQA、量化。 |
| **網路（Network）** | 傳輸負載大小 | 壓縮、本地服務化。 |
| **API** | 按 token 計價 | 快取、模型選擇。 |

---

## 模型階梯（效率分層） {#model-cascading}

最有效的省錢策略，就是使用**能勝任該任務的最便宜模型。**

**階梯模式（cascade pattern）：**
1. **分類器（Classifier）**：一個極小的模型（0.5B）判斷查詢的複雜度（$0.00）。
2. **第 1 層（SLM）**：90% 的查詢（問候、簡單問答）交給一個 8B 模型處理（$）。
3. **第 2 層（前沿模型 Frontier）**：9% 的查詢（複雜推理）交給 405B / Claude Sonnet 4.6 / GPT-5.5 / Gemini 3.1 Pro 等級的模型處理（$$$）。
4. **第 3 層（推理 Reasoning）**：1% 的查詢（專家級）交給思考型模型處理，例如 Claude Opus 4.7 或啟用延伸思考（extended thinking）的 GPT-5.5（$$$$$）。

**最終結果**：相較於把所有流量都送進第 2 層，可降低 80% 的成本。

---

## 用於生產環境的小型語言模型（SLMs）

3B-8B 的模型（Llama 4 8B、Gemini 3.1 Flash、Claude Haiku 4.5）現在在多數基準測試上，已經能匹敵甚至擊敗 2023 年最初版本的 GPT-4。
- **使用情境**：實體擷取、情感分析、簡單的 RAG。
- **成本**：執行成本比前沿模型便宜 100 倍。
- **延遲**：回應時間 < 100ms。

### DeepSeek V4 的價格底線

DeepSeek V4 Flash（2026 年 4 月 24 日發布）以**每 1M tokens $0.14 / $0.28** 的價格、1M 上下文視窗，以及每 M $0.0028 的快取命中（cache-hit）輸入價，重新設定了便宜的前沿等級推論的價格底線。在 2026 年 5 月 22 日 75% 折扣轉為永久之後，DeepSeek V4 Pro 大約比 Claude Opus 4.7 便宜 10 倍（每 1M $0.435 / $0.87，對比 $5 / $25）。對於前綴經常被重複使用、快取需求高且高流量的工作負載（使用共享知識庫的 RAG、批次分類、程式碼庫代理），在你甚至還沒開始做階梯之前，V4 Flash 或 V4 Pro 現在就已經是主導性的成本優化著力點。在做出決定之前，請先到 [DeepSeek 定價頁面](https://api-docs.deepseek.com/quick_start/pricing) 上確認。

---

## Spot 執行個體策略 {#spot-instances}

對於非即時的工作負載（批次處理、資料擷取），請使用 **GPU Spot 執行個體**（AWS Spot、Azure Spot、Lambda Labs）。

- **風險**：GPU 可能在 30 秒通知後被回收。
- **緩解措施**：**即時 KV-Cache 遷移（Live KV-Cache Migration）**。服務框架可以在收到「回收訊號（Reclamation Signal）」的當下，立即把進行中請求的 KV cache 串流到另一個節點，確保不會有任何工作成果遺失。

---

## 「Token 稅」優化 {#token-tax}

- **系統提示快取（System Prompt Caching）**：把常用的前綴寫死（hard-code），以取得 90% 的折扣。
- **輸出截斷（Output Truncation）**：嚴格限制 `max_tokens`。
- **負向提示（Negative Prompting）**：「別太囉嗦」可節省約 15% 的輸出 token（因此也省下成本）。

---

## 面試問題 {#interview-questions}

### Q：你如何向 CFO 證明一套 AI 系統的成本是合理的？

**強有力的回答：**
我聚焦於**效率的 ROI（投資報酬率）。**首先，我導入「模型階梯（Model Cascading）」，確保我們 90% 的流量都由每百萬 token 不到一美分的模型來處理。其次，我導入「語意快取（Semantic Caching）」，避免為同一個答案付兩次錢。第三，我建立「推論配額（Inference Quotas）」與「成本回收模型（Chargeback Models）」，讓每個事業單位都要為自己的用量負責。透過把 AI 當成具有分層計價的「商品化資源（Commodity Resource）」來看待，我們就能從「無上限的實驗」轉型為「可預測的營運支出（OpEx）」模式。

### Q：什麼情況下，自架的單一 GPU 叢集會比 API 更便宜？

**強有力的回答：**
「交叉點（Crossover Point）」通常出現在**持續的高吞吐量**時。如果你的應用程式有著 24 小時全天候每秒 5-10 個請求的基線，那麼預留一張 H100 的固定成本，就會比 API 的變動 token 成本更便宜。然而，如果你的流量是「尖峰型」或大幅集中在上班時間，API 供應商通常比較便宜，因為它們讓你能在離峰時段「為靜默付費（pay for the silence）」。對多數企業而言，以 70B 等級的模型來說，損益平衡點大約落在每月 5 億個 token。

---

## 參考資料 {#references}
- Google Cloud. "Cost Optimization for Generative AI" (2024)
- Anyscale. "LLM Inference: API vs. Self-Hosted Costs" (2024)

---

*下一篇：[擴散語言模型](08-diffusion-llms.md)*
