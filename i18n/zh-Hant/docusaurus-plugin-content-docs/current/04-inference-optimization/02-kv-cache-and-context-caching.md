# KV Cache 與上下文快取

KV Cache 是長上下文 AI 系統中最主要的記憶體消耗來源。能否有效管理這份快取，是一套系統能擴展到 2M tokens、還是在 10k 就崩潰的關鍵差異。

## 目錄

- [KV Cache 的問題](#kv-cache-problem)
- [GQA：分組查詢注意力](#gqa)
- [上下文快取（自架）](#context-caching-self-hosted)
- [API 層級的上下文快取（Prompt Caching）](#api-prompt-caching)
- [RAD-O：檢索增強解碼](#rad-o)
- [面試題](#interview-questions)
- [參考資料](#references)

---

## KV Cache 的問題

在生成過程中，模型需要先前所有 tokens 的 Key (K) 與 Value (V) 張量。把這些存進記憶體所費不貲。

**VRAM 計算（Llama 4 70B）：**
- **Tokens**：128,000
- **精度**：BF16（每個參數 2 bytes）
- **記憶體**：`2 (KV) * layers (80) * context (128k) * heads (8) * head_dim (128) * 2 bytes`
- **總計**：在 128k 上下文下，**每位使用者約 42 GB**。

---

## GQA：分組查詢注意力

GQA 是現代降低 KV Cache 大小、同時不損失效能的標準做法。

| 方法 | 比例 | KV Cache 縮減幅度 | 品質損失 |
|--------|-------|-------------------|--------------|
| **多頭注意力 (MHA)** | 1:1 | 1x（基準） | 0% |
| **分組查詢 (GQA)** | 8:1 | **8x** | < 0.2% |
| **多查詢 (MQA)** | All:1 | 64x-128x | 2-3% |

**細節**：GQA 讓模型能從多個「推理」頭存取同一份 KV「記憶」，大幅降低 Decode 階段所需的記憶體頻寬。

---

## 上下文快取（自架）

生產環境系統會對具有共同前綴的提示使用 **Shared KV Caches**（例如一份由 1,000 位使用者共用的 100 頁知識庫）。

### Disk 與 VRAM 快取的取捨
- **VRAM Cache**：即時存取，但大小嚴格受限。
- **Disk/SSD Cache**：存取較慢，但容量幾乎無上限。像 **SGLang** 這類框架採用分層系統：`Most Recent (VRAM) -> Frequent (HBM) -> Occasional (SSD)`。

---

## API 層級的上下文快取（Prompt Caching）

主要供應商（OpenAI、Anthropic、Google、DeepSeek）現在都提供 **Prompt Caching** 折扣。

| 供應商 | 功能名稱 | 定價（快取輸入） | 最適用情境 |
|----------|--------------|------------------------|----------|
| **Anthropic** | Context Caching | 9 折優惠（Sonnet 4.6 快取：$0.30/1M） | 長系統提示、工具 schema |
| **OpenAI** | Prompt Caching | 快取輸入約 5 折優惠（GPT-5.5 快取：約 $2.50/1M） | 多輪對話 |
| **Google** | Context Caching | 快取讀取 $0.20/1M（Gemini 3.1 Pro 在 200K 以下）；每小時儲存費另計 | 長篇共用語料 |
| **DeepSeek** | Context Caching | **$0.003625/M (V4 Pro) / $0.0028/M (V4 Flash)** | 大型程式碼庫 RAG；市場上最便宜的快取級距 |

**損益平衡細節**：如果你的快取前綴被重複使用超過 **1.1x 到 1.5x**，使用快取會比直接用原始 tokens 更便宜。Anthropic 對快取寫入收取 25% 的額外費用，因此對於短前綴，損益平衡點會更高（需重複使用 3-5x）。DeepSeek 在 2026 年 4 月 26 日把快取命中價格砍到上線時的 1/10。對於大量使用快取的工作負載，V4 Flash 現在每個快取 token 的成本大約比 GPT-5.5 便宜 30-50x。

---

## RAD-O：檢索增強解碼

RAD-O 是一種上下文快取技術，模型會把長文件的 KV cache **壓縮**成「Latent tokens」。
- **做法**：不再為 1M tokens 儲存完整的 KV 向量，而是儲存一份小 10x 的壓縮表示。
- **影響**：讓原本只支援 200k 的硬體，能跑到 2M+ token 的上下文。

---

## 面試題

### Q：PagedAttention 如何協助 KV Cache 管理？（簡化版）

**理想回答：**
標準的 KV cache 需要連續的記憶體配置（一整塊巨大的 RAM）。這會導致 **External Fragmentation**（外部碎片化，記憶體存在但分散在無法使用的空隙中）。PagedAttention（vLLM 採用）把 KV cache 拆成固定大小的小「頁」（就像作業系統的虛擬記憶體）。這讓快取得以非連續存放，意味著我們能在真正需要時才精準配置記憶體，並在具有相同前綴的不同請求之間共用頁面。這通常能把記憶體效率從 60% 提升到 96%+。

### Q：對於一份 50k token 的文件，為什麼上下文快取會比 RAG 更好？

**理想回答：**
有了便宜的上下文快取（DeepSeek、Gemini、Anthropic），對於中等大小的文件，RAG 往往是「殺雞用牛刀」。
1. **召回率**：上下文快取提供 100% 的召回率（整份文件都在視窗內），而 RAG 取決於檢索的準確度。
2. **連貫性**：模型能看到整份文件中的交叉引用。
3. **經濟效益**：在 50k tokens 的規模下，快取輸入的成本往往低於維護一套向量資料庫與檢索管線的複雜度。

---

## 參考資料
- Kwon et al. "Efficient Memory Management with PagedAttention" (2023)
- Anthropic. "Prompt Caching Documentation" (2024)
- DeepSeek. "Context Caching Technical Report" (2025)

---

*下一篇：[Speculative Decoding](03-speculative-decoding.md)*
