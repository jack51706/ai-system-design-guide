# 嵌入與向量空間

嵌入是文字的稠密向量表示，能夠捕捉語意。它是 RAG 系統、語意搜尋以及眾多 AI 應用的基礎。

## 目錄

- [什麼是嵌入](#what-are-embeddings)
- [嵌入模型架構](#embedding-model-architectures)
- [訓練目標](#training-objectives)
- [距離度量](#distance-metrics)
- [嵌入模型比較](#embedding-model-comparison)
- [Matryoshka 與自適應維度](#matryoshka-and-adaptive-dimensions)
- [Late Interaction 與 Late Chunking](#late-chunking-and-interaction)
- [二元與純量量化](#quantization-for-scale)
- [實務考量（批次處理、快取）](#practical-considerations)
- [嵌入漂移與版本管理](#embedding-drift-and-versioning)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 什麼是嵌入

嵌入把離散的文字（詞、句子、文件）對應到連續的向量空間，在這個空間中，語意相似度對應到幾何上的鄰近程度。

**關鍵特性：**
- 意義相近者彼此靠近
- 關係可以用向量運算編碼（king - man + woman = queen）
- 透過近似最近鄰演算法實現高效的相似度搜尋

**心智模型：**
可以把嵌入想像成一個非常高維空間中的座標。維度（512 到 4096）提供了表達能力。每個維度捕捉某種意義面向，不過個別維度本身並不具可解讀性。

---

## 嵌入模型架構

### 詞嵌入（歷史回顧）

早期的方法針對個別的詞做嵌入：

| 模型 | 年份 | 方法 | 限制 |
|-------|------|----------|------------|
| Word2Vec | 2013 | Skip-gram, CBOW | 靜態：「bank」在所有上下文中都相同 |
| GloVe | 2014 | 共現矩陣 | 靜態 |
| FastText | 2017 | 子詞嵌入 | 靜態，但能處理 OOV |

**關鍵限制：** 同一個詞無論在什麼上下文中都會得到相同的嵌入。

### 上下文嵌入

以 Transformer 為基礎的模型會產生隨上下文而變化的嵌入：

```python
# Static embedding (Word2Vec)
embed("bank") = [0.1, 0.3, ...]  # Same vector always

# Contextual embedding (BERT)
embed("river bank") = [0.1, 0.3, ...]   # Geography sense
embed("bank account") = [0.5, 0.2, ...]  # Finance sense
```

### 句子／文件嵌入

對於檢索而言，我們需要對整段文字做嵌入：

| 方法 | 作法 | 優點 | 缺點 |
|----------|--------|------|------|
| 平均池化 | 對 token 嵌入取平均 | 簡單 | 會遺失資訊 |
| CLS token | 使用 [CLS] token 的嵌入 | BERT 的標準作法 | 可能無法涵蓋完整文字 |
| 最後一個 token | 使用最後一個 token | 適用於解碼器模型 | 有位置偏差 |
| 訓練式池化 | 學習池化權重 | 品質較佳 | 需要訓練 |

現代的嵌入模型是專門為句子／文件嵌入而訓練的，而非僅僅從語言模型改造而來。

### Bi-Encoder 架構

標準的檢索嵌入架構：

```
Document -> Encoder -> Document Embedding
Query    -> Encoder -> Query Embedding

Similarity = cosine(doc_embedding, query_embedding)
```

**特性：**
- 文件可以預先計算並建立索引
- 查詢嵌入在查詢時才計算
- 每份文件的相似度計算為 O(1)（搭配 ANN）

### Cross-Encoder 架構

另一種同時處理查詢與文件的作法：

```
[Query, Document] -> Encoder -> Relevance Score
```

**特性：**
- 更為準確（同時看到兩者）
- 無法預先計算：對 n 份文件需要 O(n) 推論
- 用於重排序，而非檢索

---

## 訓練目標

### 對比學習

大多數現代嵌入模型採用對比學習：

```python
# Simplified contrastive loss
def contrastive_loss(anchor, positive, negatives):
    pos_sim = cosine_similarity(anchor, positive)
    neg_sims = [cosine_similarity(anchor, neg) for neg in negatives]
    
    # Push positive close, negatives far
    loss = -log(exp(pos_sim / tau) / 
                (exp(pos_sim / tau) + sum(exp(neg_sim / tau) for neg_sim in neg_sims)))
    return loss
```

**關鍵因素：**
- **正樣本對：** 語意相似的文字（平行句子、查詢與文件配對）
- **困難負樣本：** 相似但不匹配的文字（BM25 檢索出的非相關內容）
- **批次內負樣本：** 以同批次的其他項目作為負樣本（高效）

### 訓練資料來源

| 來源 | 正樣本對 | 品質 | 規模 |
|--------|---------------|---------|-------|
| 平行句子 | 翻譯配對 | 高 | 中 |
| 查詢與文件 | 搜尋紀錄 | 高 | 中 |
| 標題與內文 | 文件結構 | 中 | 大 |
| 改述 | NLI 資料集 | 高 | 小 |
| 生成 | 由 LLM 建立配對 | 不一 | 大 |

### 指令微調嵌入

近期的模型可接受任務指令：

```python
# Instruction-tuned (e.g., E5, BGE)
query_embedding = embed("Represent this query for retrieval: What is RAG?")
doc_embedding = embed("Represent this document for retrieval: RAG combines...")
```

透過明確指定預期用途，可以提升效能。

---

## 距離度量

### 餘弦相似度

文字嵌入最常用的度量：

```python
def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
```

**特性：**
- 範圍：[-1, 1]（對正規化向量而言；若皆為正值則為 [0, 1]）
- 衡量角度，而非大小
- 不受向量長度影響

**何時使用：** 文字嵌入的預設選擇。

### 內積

```python
def dot_product(a, b):
    return np.dot(a, b)
```

**特性：**
- 大小有影響
- 範圍無上下界
- 對正規化向量而言等同於餘弦相似度

**何時使用：** 當嵌入已經正規化，或大小本身具有意義時。

### 歐幾里得距離

```python
def euclidean_distance(a, b):
    return np.linalg.norm(a - b)
```

**特性：**
- 衡量絕對差異
- 受大小影響
- 對正規化向量而言：sqrt(2 - 2 * cosine)

**何時使用：** 文字較少使用；在影像嵌入中較為常見。

### 度量選擇

| 度量 | 向量資料庫 | 常見用途 |
|--------|------------------|------------|
| 餘弦 | Pinecone, Qdrant, Weaviate | 文字嵌入 |
| 內積 | 所有主流資料庫 | 正規化嵌入 |
| 歐幾里得 | 所有主流資料庫 | 影像、多模態 |

---

## 嵌入模型比較

### 目前頂尖模型（2025 年 12 月）

| 模型 | 維度 | 最大 Token 數 | MTEB Retrieval | 每 1M token 成本 |
|-------|------------|------------|----------------|------------------|
| OpenAI text-embedding-4 | 3072 | 16k | 68.2 | $0.10 |
| Voyage-4 | 1024 | 128k | 70.1 | $0.05 |
| Cohere embed-v3.5 | 1024 | 512 | 67.5 | $0.10 |
| Google text-embedding-005 | 768 | 8k | 67.2 | $0.02 |

*MTEB 分數為近似值，會隨基準測試的子集而有所不同。請務必核對當下的數值。英文排行榜目前由 Gemini Embedding 001（68.32）領先；多語言排行榜則由 Qwen3-Embedding-8B（70.58）與 Llama-Embed-Nemotron-8B 領先。*

### 開源模型

| 模型 | 維度 | 最大 Token 數 | MTEB Retrieval | 備註 |
|-------|------------|------------|----------------|-------|
| BGE-large-en-v1.5 | 1024 | 512 | 63.9 | 強大的開源模型 |
| E5-large-v2 | 1024 | 512 | 62.4 | 指令微調 |
| GTE-large | 1024 | 512 | 63.1 | Alibaba |
| Nomic-embed-text-v1.5 | 768 | 8192 | 62.3 | 長上下文，開源 |

### 選擇準則

| 因素 | 考量 |
|--------|----------------|
| 品質（MTEB） | 越高越好，但針對任務的評估更為重要 |
| 維度 | 越高 = 表達力越強，但儲存／運算成本也越高 |
| 最大 Token 數 | 必須能容納你的文件大小 |
| 成本 | API 與自行託管之間的取捨 |
| 延遲 | 嵌入生成時間 |
| 多語言 | 若需服務非英文內容 |

---

## Matryoshka 與自適應維度

### 核心概念

Matryoshka Representation Learning（MRL）以這樣的方式訓練嵌入：完整嵌入的前綴本身也是有意義的：

```python
full_embedding = model.encode(text)  # 1024 dimensions

# All these are valid embeddings with decreasing quality
dim_512 = full_embedding[:512]  
dim_256 = full_embedding[:256]
dim_128 = full_embedding[:128]
dim_64 = full_embedding[:64]
```

### 為何重要

| 使用情境 | 維度 | 取捨 |
|----------|-----------|----------|
| 完整檢索 | 1024-3072 | 最高準確度 |
| **兩階段檢索**| 128 -> 1024 | **生產環境標準作法**：以 128 維檢索出 1000 筆，再以 1024 維精修前 100 筆。 |
| 成本敏感 | 256 | 節省 12 倍儲存空間，MRR 損失 <2% |
| 邊緣／行動裝置 | 64 | 速度最大化，可處理簡單意圖 |

### 支援 Matryoshka 的模型

- OpenAI text-embedding-3-*（原生支援）
- Nomic-embed-text-v1.5
- 數個微調過的模型

### 使用 Matryoshka 嵌入

```python
from openai import OpenAI
client = OpenAI()

# Request smaller dimensions
response = client.embeddings.create(
    model="text-embedding-3-large",
    input="Your text here",
    dimensions=256  # Request 256 instead of full 3072
)
```

---

### Late Chunking（2025 年的轉變）

**傳統分塊：**
`Document -> Split into chunks -> Embed chunks individually`
- **問題**：區塊 2 失去了來自區塊 1 的上下文。

**Late Chunking（由 Jina AI／Voyage 提出）：**
`Full Document -> Model Encoder -> Token-level Embeddings -> Pool into chunk boundaries`
- **優點**：每個區塊的嵌入都包含來自**整份文件**的資訊，因為在池化之前，Transformer 的自注意力已套用於完整序列。
- **要求**：需要支援長上下文的模型（至少 8k 以上 token）。

---

## 量化以因應規模

為了處理數十億個向量，**二元（Binary）**與**純量（Int8）**量化現已成為標準作法。

| 類型 | 資料大小 | 記憶體節省 | 品質損失 | 支援者 |
|------|-----------|----------------|--------------|--------------|
| Float32 | 4 bytes/dim | 基準 | 0% | 全部 |
| Int8 | 1 byte/dim | 4x | <1% | Cohere, BGE |
| **Binary** | **1 bit/dim** | **32x** | ~5-10% | Cohere v3, v4 |

**二元量化模式：**
1. 使用二元嵌入檢索出前 1000 筆（極快速度）。
2. 使用 Float32 或 Cross-Encoder 對前 50 筆重排序（最高準確度）。

### 何時使用 ColBERT

- 檢索精確度至關重要
- 能夠承擔儲存開銷
- 查詢延遲預算 > 50ms

### 實作

```python
# Using RAGatouille
from ragatouille import RAGPretrainedModel

model = RAGPretrainedModel.from_pretrained("colbert-ir/colbertv2.0")

# Index documents
model.index(
    collection=documents,
    index_name="my_index"
)

# Search
results = model.search(query="What is RAG?", k=10)
```

---

## 實務考量

### 批次處理

```python
# Inefficient: one API call per document
embeddings = [embed(doc) for doc in documents]

# Efficient: batch API calls
batch_size = 100
embeddings = []
for i in range(0, len(documents), batch_size):
    batch = documents[i:i + batch_size]
    batch_embeddings = embed_batch(batch)
    embeddings.extend(batch_embeddings)
```

### 為嵌入進行分塊

長文件在嵌入之前必須先分塊：

```python
def embed_document(document: str, max_tokens: int = 512) -> list[np.array]:
    chunks = chunk_document(document, max_tokens=max_tokens)
    embeddings = []
    for chunk in chunks:
        embedding = embed(chunk)
        embeddings.append(embedding)
    return embeddings
```

**考量：**
- 區塊大小應小於模型的最大 token 數
- 重疊有助於在區塊邊界之間保留上下文
- 儲存區塊與文件的對應關係以供檢索使用

### 正規化

許多系統預期使用正規化的嵌入：

```python
def normalize(embedding):
    norm = np.linalg.norm(embedding)
    return embedding / norm

# Cosine similarity of normalized vectors = dot product
similarity = np.dot(normalize(a), normalize(b))
```

大多數向量資料庫與嵌入 API 都會處理正規化，但仍應加以核實。

### 快取

嵌入運算的成本高昂。應積極使用快取：

```python
import hashlib

def get_embedding(text: str, cache: dict) -> np.array:
    key = hashlib.sha256(text.encode()).hexdigest()
    
    if key in cache:
        return cache[key]
    
    embedding = compute_embedding(text)
    cache[key] = embedding
    return embedding
```

---

## 嵌入漂移與版本管理

### 問題所在

嵌入在以下情況之間無法相互比較：
- 不同的模型
- 同一模型的不同版本
- 有時甚至不同的 API 呼叫之間（某些 API 具有非確定性）

### 後果

如果你更新了嵌入模型：
- 所有既有的嵌入都會變得不相容
- 必須重新嵌入整個語料庫
- 在遷移期間，搜尋結果會不一致

### 緩解策略

**1. 為你的嵌入加上版本：**
```python
embedding_metadata = {
    "model": "text-embedding-3-large",
    "model_version": "2024-01",
    "dimensions": 3072,
    "created_at": "2025-12-16"
}
```

**2. 為重新嵌入做好規劃：**
- 估算完整重新嵌入所需的成本與時間
- 建立可在背景執行的管線
- 在切換之前先測試新的嵌入

**3. 藍綠部署：**
```
Index A: Current embeddings
Index B: New embeddings (building)

Query -> Both indexes -> Merge or switch
```

**4. 追蹤嵌入品質：**
- 持續監控檢索指標
- 偵測嵌入分布的漂移
- 在品質劣化時發出警報

---

## 面試問題

### Q：嵌入模型如何學習語意相似度？

**有力的回答：**
嵌入模型透過對比學習進行訓練。其目標是讓語意相似文字的嵌入彼此靠近，並讓不相似文字的嵌入彼此遠離。

訓練流程：
1. 正樣本對：應當相似的文字（查詢與文件配對、改述、翻譯）
2. 負樣本對：應當不相似的文字（通常來自同一批次，或是 BM25 產生的困難負樣本）
3. 損失函數：促使正樣本對靠近、負樣本對遠離

模型學會把文字放置在一個高維空間中，使距離與語意相似度相關。這便實現了檢索：對查詢做嵌入，並在文件嵌入空間中找出最近鄰。

像 E5 與 BGE 這類現代模型也經過指令微調，你可以在前面加上任務指令來讓嵌入專門化。

### Q：什麼時候會選擇 ColBERT 而非 bi-encoder？

**有力的回答：**
ColBERT 採用 late interaction：它不是每份文件只有一個嵌入，而是保留每個 token 的嵌入。在查詢時，它會計算 token 層級的相似度。

在以下情況選擇 ColBERT：
- 檢索精確度至關重要（法律、醫療、高風險場景）
- 你能承擔每份文件 10 到 100 倍的儲存開銷
- 查詢延遲預算為 50ms 以上（比 bi-encoder 稍慢）
- 你的查詢可受益於詞彙匹配（技術術語）

在以下情況選擇 bi-encoder：
- 儲存空間有限
- 需要低於 20ms 的延遲
- bi-encoder 的檢索精確度已足夠
- 需要頻繁重新建立索引（ColBERT 重建索引成本高昂）

實務上，一種常見模式是：以 bi-encoder 進行第一階段檢索（前 100 筆），再以 cross-encoder 或 ColBERT 進行重排序。

### Q：更新模型時，你如何處理嵌入漂移？

**有力的回答：**
嵌入模型所產生的向量，只有相對於同一個模型時才有意義。如果你更新模型，所有舊的嵌入都會變得不相容。

我的作法：
1. **絕不原地更新。** 建立一個使用新嵌入的平行索引。
2. **切換前先測試。** 在一個測試集上比較新舊嵌入的檢索品質。
3. **背景重建。** 在背景以新模型重新嵌入整個語料庫。
4. **原子性切換。** 一旦新索引完成並通過驗證，便以原子方式切換流量。
5. **回滾計畫。** 保留舊索引以便快速回滾。

成本估算方面：如果你有 1000 萬份文件、平均 500 個 token，而 text-embedding-3-large 的成本為每 1M token $0.13，那麼重新嵌入的成本約為 $650。在考慮更新模型時，請為這筆成本做好規劃。

### Q：你如何為嵌入選擇維度？

**有力的回答：**
較高的維度能捕捉更多資訊，但會耗費更多儲存與運算成本。

考量：
- **儲存：** 1024 維 float32 = 每個嵌入 4 KB。在 1000 萬份文件下 = 光是嵌入就要 40 GB。
- **搜尋速度：** 維度越高 = 最近鄰搜尋越慢。
- **品質：** 對大多數任務而言，超過某個維度後便呈現邊際效益遞減。

實務作法：
1. 從模型建議的維度開始。
2. 若使用 Matryoshka 模型（如 text-embedding-3），在你的任務上試驗較低的維度。
3. 在不同維度下對品質做基準測試：通常 256 到 512 維就能達到完整品質的 95%。
4. 對於兩階段檢索：第一階段使用低維度，重排序時使用完整維度。

對於大多數應用而言，768 到 1024 維能提供良好的平衡。例外是對極高精確度有要求的情況，此時 2048 到 4096 維可能有所助益。

---

## 參考資料

- Reimers and Gurevych. "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks" (2019)
- Khattab and Zaharia. "ColBERT: Efficient and Effective Passage Search via Contextualized Late Interaction over BERT" (2020)
- Wang et al. "Text Embeddings by Weakly-Supervised Contrastive Pre-training" (E5, 2022)
- Xiao et al. "C-Pack: Packaged Resources To Advance General Chinese Embedding" (BGE, 2023)
- Kusupati et al. "Matryoshka Representation Learning" (MRL, 2022)
- MTEB Leaderboard: https://huggingface.co/spaces/mteb/leaderboard
- OpenAI Embeddings Guide: https://platform.openai.com/docs/guides/embeddings

---

*上一篇：[Transformer 架構](04-transformer-architecture.md) | 下一篇：[推論管線](06-inference-pipeline.md)*
