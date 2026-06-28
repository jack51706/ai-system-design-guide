# 短期上下文管理

短期上下文（L1 Memory）是進行推理的高速介面。要妥善管理它，已經不再是關於「訊息列表」，而是關於 **KV Cache 最佳化** 與 **動態上下文配置（Dynamic Context Allocation）**。

## 目錄

- [上下文生命週期](#lifecycle)
- [KV Cache 分塊與 PagedAttention](#paged-attention)
- [前綴快取（系統提示保留）](#prefix-caching)
- [滑動視窗 vs. 摘要](#sliding-vs-summary)
- [上下文壓縮（選擇性丟棄）](#compression)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 上下文生命週期

上下文會經歷三個階段：
1. **接收（Intake）**：使用者查詢 + 近期歷史 + 系統指令。
2. **處理（Processing）**：GPU 為新的 token 計算 KV cache。
3. **逐出（Eviction）**：一旦達到上限，就移除舊的 token 以騰出空間給新的 token。

---

## KV Cache 分塊

現代推論引擎（vLLM、TensorRT-LLM）使用 **PagedAttention**。
- **核心概念**：與其為上下文配置一塊連續的 GPU 記憶體，記憶體會被切分成多個 **Blocks**（分頁）。
- **效率**：將記憶體碎片減少 **60-80%**，讓相同硬體能支援大幅更大的批次大小與更長的上下文視窗。

---

## 前綴快取

對任何生產環境的 LLM 技術堆疊而言，這是 **延遲的聖杯（Holy Grail of Latency）**。
- **問題所在**：每次代理呼叫 LLM 時，都會送出相同的 2,000-token 系統提示 + 50 個工具 Schema。這會浪費運算資源。
- **解決方案**：**持久化前綴快取（Persistent Prefix Caching）**。伺服器會將提示中「靜態」部分（前綴）的 KV cache 保留在記憶體中。
- **結果**：你只需為訊息中 *新增* 的部分付費（並等待其運算）。

---

## 滑動視窗 vs. 摘要

| 方法 | 運作機制 | 優點 | 缺點 |
|--------|-----------|-----|-----|
| **滑動視窗** | 完整保留最後 N 個 token。 | 對近期內容有高保真度。 | 「金魚腦」效應（會忘記開頭）。 |
| **摘要** | 將舊的對話輪次壓縮成文字。 | 保留「關鍵事實」。 | 喪失細微差異與格式。 |
| **混合式** | 保留最後 10 輪 + 1 份摘要。 | 兼具兩者優點。 | 複雜度略為提高。 |

---

## 上下文壓縮

目前的前沿模型支援 **提示強化（Prompt Hardening）**。
- **選擇性丟棄（Selective Dropping）**：自動剝除先前輪次中無關的「Thought」區塊，以節省空間。
- **Token 修剪（Token Pruning）**：使用較小的模型，將冗長的使用者訊息改寫成短 50% 但語意等價的提示，再送給「Reasoning」模型。

---

## 面試問題

### Q：「模型上下文視窗（Model Context Window）」與「應用程式上下文視窗（Application Context Window）」有什麼差別？

**優秀的回答：**
**模型上下文視窗** 是由架構定義的硬性上限（例如 GPT-4o 為 128K）。**應用程式上下文視窗** 則是由工程師設定的配置（例如 16K 上限），用來管理 **延遲與成本**。在生產環境中，我們很少每一輪都用滿整個模型視窗，因為注意力（attention）的額外開銷會隨著上下文大小增加，導致生成速度變慢。我們會使用一個 **緩衝區（Buffer Zone）**，為模型的新回應預留空間。

### Q：「前綴快取（Prefix Caching）」如何改變你設計系統提示的方式？

**優秀的回答：**
它迫使我把 **靜態內容移到最前面**，把 **動態內容移到最後面**。早期 LLM 的常見做法經常把使用者的名字或日期放在最頂端，那會破壞前綴快取。我會把「不可變規則（Immutable Rules）」和「工具 Schema」放在開頭，把每一輪都會變動的「使用者上下文（User Context）」放在結尾。這能確保前 5,000 個 token 在所有使用者之間都完全相同，讓推論伺服器上的快取命中率最大化。

---

## 參考資料
- vLLM Team. "PagedAttention: Software-Defined Memory for LLM Serving" (2024/2025)
- NVIDIA. "Optimizing Inference with TensorRT-LLM" (2025)
- Anthropic. "Prompt Caching: Scale while reducing costs" (2024/2025)

---

*下一篇：[長期記憶](03-long-term-memory.md)*
