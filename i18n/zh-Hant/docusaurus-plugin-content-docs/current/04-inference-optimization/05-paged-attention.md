# PagedAttention

PagedAttention 是高吞吐量服務引擎（vLLM、SGLang、TensorRT-LLM）背後的基礎演算法。它解決了先前限制 LLM 可擴展性的「記憶體碎片化」問題。

## 目錄

- [連續記憶體的問題](#contiguous-memory)
- [PagedAttention 如何運作](#how-it-works)
- [管理虛擬記憶體（Block Manager）](#block-manager)
- [KV cache 共享（Copy-on-Write）](#sharing)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 連續記憶體的問題 {#contiguous-memory}

標準的深度學習框架會以大型、連續的區塊來配置記憶體。
對於一個 LLM 請求，你可能會為 8192 個 token 的 `max_sequence_length` 預先配置記憶體。

**浪費之處：**
1. **內部碎片化（Internal Fragmentation）**：如果使用者只產生 10 個 token，那塊保留區塊中有 99.9% 都被浪費掉了。
2. **外部碎片化（External Fragmentation）**：記憶體被切割成一個個太小的空隙，即使總體可用記憶體很高，也無法容納一個新的「大區塊」。

---

## PagedAttention 如何運作（vLLM）

PagedAttention 的靈感來自作業系統中的虛擬記憶體。

1. **Token 對應到區塊**：一個請求的 KV cache 會被切分成小而固定大小的**區塊（Blocks）**（例如每個區塊 16 個 token）。
2. **邏輯 vs. 實體**：模型以為自己關注的是一段連續的序列（邏輯記憶體），但這些區塊其實散落在整個 VRAM 中（實體記憶體）。
3. **查找表**：一張**區塊表（Block Table）**會把邏輯索引對應到實體位址。

**主要好處**：記憶體浪費從約 60-80% 降到**少於 4%**。

---

## 管理虛擬記憶體（Block Manager） {#block-manager}

服務框架（vLLM、SGLang）對 GPU 而言就像是「迷你作業系統」。

- **配置（Allocation）**：當一個新請求開始時，Block Manager 會分配給它一組空的實體區塊。
- **驅逐（Eviction）**：如果 VRAM 滿了，管理器可以把不活躍的 KV 區塊「換出（swap）」到 CPU RAM，並在需要時再把它們換回來（Paged Swap）。

---

## KV cache 共享（Copy-on-Write） {#sharing}

PagedAttention 讓「共同前綴（Common Prefixes）」的共享變得毫不費力。

**情境**：100 位使用者正在使用同一個 5,000 個 token 的系統提示進行對話。
- **傳統做法**：把那份 5,000 個 token 的 KV cache 儲存 100 次（VRAM 中共 **500k 個 token**）。
- **PagedAttention**：透過區塊表只儲存**一次**，並讓全部 100 位使用者都指向同一組實體區塊。
- **Copy-on-Write**：如果某位使用者產生了一個獨有的 token，就會專為他建立一個新區塊，而共享的區塊則維持不變。

---

## 面試問題 {#interview-questions}

### Q：為什麼 PagedAttention 能大幅提升吞吐量？

**有力的回答：**
PagedAttention 透過容許使用更大的**批次大小（batch sizes）**來提升吞吐量。因為它消除了內部與外部的記憶體碎片化，我們可以把更多的請求塞進同一塊 GPU VRAM 中。在傳統的服務方式下，我們可能只能容納 4 個請求，因為必須「保留」最大長度的區塊；有了 PagedAttention，我們可以容納 20-30 個請求，因為我們只為實際存在的 token 使用記憶體。更大的批次帶來更好的 GPU 使用率，以及顯著更高的整體每秒 token 數。

### Q：請以 vLLM 的脈絡解釋「區塊表（Block Table）」。

**有力的回答：**
區塊表是一種對應結構，用來橋接模型對連續資料的預期與記憶體實際散落的現實之間的落差。表中的每一筆項目對應到一個 token 的「邏輯區塊（Logical Block）」。它儲存了該區塊的 key 與 value 張量所在的 GPU 記憶體實體位址。這讓框架能以小單位動態地配置與釋放記憶體，並支援諸如前綴共享與高效多執行緒等進階功能。

---

## 參考資料 {#references}
- Kwon et al. "Efficient Memory Management for Large Language Model Serving with PagedAttention" (SOSP 2023)
- vLLM Documentation. "PagedAttention Logic" (2024)

---

*下一篇：[Serving Infrastructure](06-serving-infrastructure.md)*
