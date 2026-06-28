# 嵌入模型

嵌入模型把文字轉換成高維度向量。技術前沿已經跨越了靜態的單一向量表示，邁向**多解析度、後期互動（late-interaction）與多模態**的嵌入。

## 目錄

- [嵌入技術前沿（Matryoshka）]( #matryoshka)
- [後期互動（ColBERT v2）]( #late-interaction)
- [Binary 與 Int8 量化]( #quantization)
- [模型選型準則]( #selection)
- [多模態嵌入（視覺 + 文字）]( #multimodal)
- [面試問題]( #interview-questions)
- [參考資料]( #references)

---

## 嵌入技術前沿：Matryoshka 嵌入

傳統上，如果你把文字嵌入成 1,536 維，你就被迫得用上全部 1,536 維來做搜尋。

**Matryoshka Representation Learning（MRL）**
- 模型被訓練成把最重要的資訊「儲存」在前面少數幾個維度裡。
- **效益**：你可以嵌入成 1,536 維，但只索引前 **64 維**來做一次「快速搜尋」，再用完整的 1,536 維對排名最前的結果做精修。
- **效率**：記憶體與索引大小減少 20 倍，而準確度下降不到 2%。

---

## 後期互動：ColBERT v2

標準嵌入屬於「雙編碼器（Bi-Encoder）」（每個區塊一個向量）。**ColBERT**（Contextualized Late Interaction over BERT）採用「token 層級」的做法。

- **做法**：ColBERT 不是每個區塊存 1 個向量，而是**每個 token** 存 1 個向量。
- **互動**：在查詢時，模型會把你查詢中的每個 token 跟文件中的每個 token 做比較（也就是「MaxSim」運算）。
- **現況**：ColBERT v2（以及後繼者，例如針對文件與「頁面即圖像」的 ColPali、ColQwen2.5、ColNomic）透過 PLAID 索引大幅壓縮，使其在生產環境中變得可行。對於「大海撈針」式的技術查詢，它能達到高出許多的精準度。

---

## Binary 與 Int8 量化

儲存 `float32` 向量很昂貴。生產環境的索引非常依賴**模型內量化（in-model quantization）**。

- **Binary 嵌入**：把向量轉換成 1 與 0。
  - **記憶體**：減少 32 倍。
  - **速度**：在現代 CPU 上，Hamming 距離（XOR 運算）比 Cosine 相似度快 10 倍。
- **Int8/Int4**：由 `text-embedding-3-small` 之類的模型原生支援。

---

## 模型選型準則

| 模型 | 供應商 | 特性 | 上下文 |
|-------|----------|----------|---------|
| **Gemini Embedding 001** | Google | 多模態（文字、影像、影片、音訊、PDF）、共享 3072 維空間、MTEB-English 領先者 | 8k |
| **Qwen3-Embedding-8B** | 開源 | MTEB-Multilingual 領先者、指令微調、長文件表現強 | 32k |
| **Llama-Embed-Nemotron-8B** | NVIDIA | 頂尖多語言分數、開放權重 | 8k |
| **Cohere Embed v4** | Cohere | 多模態（文字 + 影像）、Matryoshka、binary 量化 | 128k |
| **Voyage-Multimodal-3.5** | Voyage AI | 統一的文字/影像、針對檢索調校 | 32k |
| **OpenAI text-embedding-3-large** | OpenAI | Matryoshka、原生 Int8、廣泛支援 | 8k |
| **BGE-M3** | 開源 | 多語言、多粒度（dense + sparse + 後期互動） | 8k |
| **Jina-Embeddings-v3** | Jina AI | 支援後期互動、長上下文 | 128k |

開放權重模型（Qwen3、Llama-Embed-Nemotron、BGE）在純 MTEB 分數上現在已經追平甚至擊敗商業 API。當你想要受管理的基礎設施與 SLA 時，選商業方案；當高流量下的每次查詢成本比延遲下限更重要時，選開放權重。

---

## 多模態嵌入

純文字的 RAG 會悄悄丟掉圖表、表格、示意圖以及版面配置訊號，而答案往往就藏在這些地方。現代技術堆疊把頁面、螢幕截圖與圖示都當成一等公民的檢索物件：

- **統一的視覺-文字嵌入**：Cohere Embed v4、Voyage-Multimodal-3.5、Gemini Embedding 001 全都共享單一向量空間，因此你可以拿「緊急關閉閥在哪裡？」這種查詢去比對示意圖。
- **頁面即圖像搭配後期互動**：ColPali、ColQwen2.5 與 ColNomic 直接嵌入每一頁的算繪結果，略過脆弱的 OCR，並保留視覺層級。
- **CLIP 系列模型**：在以文字-影像對齊為核心訊號、且影像量大的目錄（電商、媒體）中仍然好用。

---

## 面試問題

### Q：嵌入中的「詞彙不匹配（Vocabulary Mismatch）」問題是什麼？

**強力解答：**
嵌入仰賴訓練過程中所學到的語意空間。如果使用者查詢用了一個較新的詞（例如某個在嵌入模型知識截止之後才發布的模型名稱），而這個詞並不在嵌入模型的訓練集裡，模型可能會給它指派一個泛泛的「AI」向量，因而錯過特定的細微差異。標準的解法是**混合搜尋（Hybrid Search）**（用 BM25 來捕捉特定關鍵字）外加**交叉編碼器重排序（Cross-Encoder Reranking）**，後者藉由同時檢視查詢與文件的 token，能更好地處理分布外（out-of-distribution）的詞彙。

### Q：為什麼你會為一個 10 億向量的索引選擇 Matryoshka 模型？

**強力解答：**
若要用標準的 `float32` 1536 維嵌入擴展到 10 億向量，HNSW 索引大約需要約 6TB 的高速 RAM，成本高得令人卻步。有了 Matryoshka 模型，我可以用前 128 維（經 Binary 量化）來做初步檢索。這能把記憶體佔用減少超過 90%，讓「Top 1,000」候選結果可以在便宜許多的硬體上被找出來。接著我只需為這 1,000 個候選取出全解析度的向量，來進行最終的重排序。

---

## 參考資料
- Kusupati et al. 〈Matryoshka Representation Learning〉（2022／2024 更新）
- Khattab et al. 〈ColBERT v1 & v2: Efficient Late Interaction〉（2021／2023）
- OpenAI. 〈Introducing New Embedding Models with Matryoshka Support〉（2024）

---

*下一篇：[向量資料庫](04-vector-databases.md)*
