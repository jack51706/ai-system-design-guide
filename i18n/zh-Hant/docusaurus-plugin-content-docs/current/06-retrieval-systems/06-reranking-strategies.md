# 重排序策略

重排序是檢索的第二階段，它使用高精度模型對一小組候選結果（前 50 到 100 筆）重新計分。它是「高效搜尋」與「完美接地」之間的橋樑：第一階段檢索以召回率為優化目標，重排序則以精確率為優化目標。如今生產環境中有三個重排序器佔據主導地位（BGE-Reranker-v2-m3、Cohere Rerank 3、Voyage rerank-2），選擇取決於成本模型、延遲尾端、語言涵蓋範圍，以及你是否需要可自行託管的權重。

## 目錄

- [為什麼需要重排序](#why-reranking)
- [重排序架構](#reranking-architectures)
- [重排序模型](#reranking-models)
- [實作模式](#implementation-patterns)
- [何時該重排序](#when-to-rerank)
- [以 LLM 為基礎的重排序](#llm-based-reranking)
- [SLM 蒸餾](#slm-distillation)
- [生產環境考量](#production-considerations)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 為什麼需要重排序

### 品質落差

| 階段 | 模型 | 速度 | 品質 |
|-------|-------|-------|---------|
| 嵌入檢索 | Bi-encoder | 快（毫秒級） | 好 |
| 重排序 | Cross-encoder | 慢（10 到 100 毫秒） | 更好 |

**為什麼會有這個落差：**
- Bi-encoder 會獨立地嵌入查詢與文件
- Cross-encoder 則會聯合處理查詢與文件
- 聯合處理能捕捉到 bi-encoder 會錯過的互動關係

### 範例

```
Query: "How to configure CUDA memory"

Document 1: "Configure GPU memory using CUDA_VISIBLE_DEVICES..."
Document 2: "Memory management in CUDA applications..."
Document 3: "Configure RAM allocation for machine learning..."

Bi-encoder scores (cosine similarity):
- Doc 1: 0.72
- Doc 2: 0.75  <-- Ranked first (wrong)
- Doc 3: 0.71

Cross-encoder scores (relevance):
- Doc 1: 0.91  <-- Ranked first (correct)
- Doc 2: 0.67
- Doc 3: 0.42
```

Cross-encoder 看得出查詢中的「CUDA memory」與 Doc 1 中的「GPU memory...CUDA」彼此相關。

---

## 重排序架構

### Bi-Encoder 與 Cross-Encoder 的比較

**Bi-Encoder（第一階段）：**
```
Query --> Encoder --> Query Embedding -+
                                      +-> Similarity
Document --> Encoder --> Doc Embedding +
```
- 每份文件為 O(1)（嵌入是預先計算好的）
- 看不到查詢與文件之間的互動關係

**Cross-Encoder（重排序）：**
```
[Query, Document] --> Encoder --> Relevance Score
```
- 每次查詢為 O(n)（需處理每一筆候選）
- 看得到完整的查詢與文件上下文
- 使用 **注意力機制（Attention Mechanism）** 來比較查詢中特定字詞如何改變文件中字詞的含義（late interaction）

### 兩階段管線

生產環境的檢索使用一個兩階段漏斗：

```
+----------------------------------------------------------------+
|  STAGE 1: Retrieval (Bi-Encoder)                                |
|                                                                 |
|  Query --> Embed --> Top-K candidates (K=100)                   |
|  Scale: Search 1 Billion docs. Cost: Low (ms).                 |
+----------------------------+-----------------------------------+
                             |
                             v
+----------------------------------------------------------------+
|  STAGE 2: Reranking (Cross-Encoder)                             |
|                                                                 |
|  For each candidate:                                            |
|    score = reranker([query, candidate])                         |
|  Scale: Search Top 100 docs. Cost: High (10-100ms).            |
|                                                                 |
|  Return Top-N by reranker score (N=5-10)                        |
+----------------------------------------------------------------+
```

### 多階段管線

對於非常大型的語料庫：

```
Stage 1: Sparse (BM25)      -> Top 1000
Stage 2: Dense (Bi-encoder) -> Top 100
Stage 3: Cross-encoder      -> Top 10
```

每個階段都是以速度換取準確度。

---

## 重排序模型

### Cross-Encoder 模型

| 模型 | 大小 | 語言 | 品質 |
|-------|------|-----------|---------|
| ms-marco-MiniLM-L-6 | 22M | 英文 | 好 |
| bge-reranker-base | 278M | 英文 | 非常好 |
| **bge-reranker-v2-m3** | 568M | 多語言 | 卓越 |
| Cohere Rerank v3 | API | 多語言 | 卓越 |
| Jina Reranker v2 | 多種 | 多語言（8k+ tokens） | 非常好 |

**「Lost in the Middle」的修正方法**：重排序器經過訓練，會優先處理相關資訊，無論該資訊位於區塊中的哪個位置，確保「中間」的資料在送入最終 LLM 之前能被正確計分。

### 使用 Cross-Encoder

```python
from sentence_transformers import CrossEncoder

# Load model
reranker = CrossEncoder('BAAI/bge-reranker-base')

def rerank(query: str, documents: list[str], top_k: int = 5) -> list[tuple[str, float]]:
    # Create pairs
    pairs = [[query, doc] for doc in documents]

    # Score all pairs
    scores = reranker.predict(pairs)

    # Sort by score
    scored_docs = sorted(
        zip(documents, scores),
        key=lambda x: x[1],
        reverse=True
    )

    return scored_docs[:top_k]
```

### Cohere Rerank

```python
import cohere

co = cohere.Client(api_key="...")

def cohere_rerank(
    query: str,
    documents: list[str],
    top_k: int = 5
) -> list[dict]:
    response = co.rerank(
        model="rerank-english-v3.0",
        query=query,
        documents=documents,
        top_n=top_k,
        return_documents=True
    )

    return [
        {
            "text": result.document.text,
            "score": result.relevance_score,
            "index": result.index
        }
        for result in response.results
    ]
```

### 模型選擇指南

| 使用情境 | 推薦模型 | 備註 |
|----------|-------------------|-------|
| 英文、自行託管 | bge-reranker-base | 良好的平衡 |
| 多語言 | bge-reranker-v2-m3 | 最佳開源選擇 |
| 低延遲 | MiniLM-L-6 | 快 4 倍 |
| 最高品質 | Cohere Rerank v3 | API，大規模時成本高 |
| 大批次 | Jina Reranker | 吞吐量良好 |
| 長查詢（8k+） | Jina Reranker v2 | 能處理長上下文 |

---

## 實作模式

### 模式 1：基本重排序

```python
class RerankedRetriever:
    def __init__(
        self,
        vector_db,
        embedding_model,
        reranker,
        retrieval_k: int = 50,
        rerank_k: int = 5
    ):
        self.vector_db = vector_db
        self.embedding_model = embedding_model
        self.reranker = reranker
        self.retrieval_k = retrieval_k
        self.rerank_k = rerank_k

    def search(self, query: str) -> list[Document]:
        # Stage 1: Retrieve candidates
        query_embedding = self.embedding_model.encode(query)
        candidates = self.vector_db.search(
            query_embedding,
            top_k=self.retrieval_k
        )

        # Stage 2: Rerank
        pairs = [[query, c.text] for c in candidates]
        scores = self.reranker.predict(pairs)

        # Combine and sort
        for candidate, score in zip(candidates, scores):
            candidate.rerank_score = score

        reranked = sorted(candidates, key=lambda x: x.rerank_score, reverse=True)
        return reranked[:self.rerank_k]
```

### 模式 2：批次重排序

```python
def batch_rerank(
    queries: list[str],
    candidates_per_query: list[list[str]],
    reranker,
    batch_size: int = 32
) -> list[list[tuple[str, float]]]:
    # Flatten all pairs
    all_pairs = []
    pair_mapping = []  # (query_idx, doc_idx)

    for q_idx, (query, candidates) in enumerate(zip(queries, candidates_per_query)):
        for d_idx, doc in enumerate(candidates):
            all_pairs.append([query, doc])
            pair_mapping.append((q_idx, d_idx))

    # Batch score
    all_scores = []
    for i in range(0, len(all_pairs), batch_size):
        batch = all_pairs[i:i + batch_size]
        scores = reranker.predict(batch)
        all_scores.extend(scores)

    # Reconstruct per-query results
    results = [[] for _ in queries]
    for (q_idx, d_idx), score in zip(pair_mapping, all_scores):
        results[q_idx].append((candidates_per_query[q_idx][d_idx], score))

    # Sort each query's results
    for i in range(len(results)):
        results[i].sort(key=lambda x: x[1], reverse=True)

    return results
```

### 模式 3：非同步重排序

```python
import asyncio

class AsyncReranker:
    def __init__(self, reranker, max_concurrent: int = 5):
        self.reranker = reranker
        self.semaphore = asyncio.Semaphore(max_concurrent)

    async def rerank_async(
        self,
        query: str,
        documents: list[str]
    ) -> list[tuple[str, float]]:
        async with self.semaphore:
            # Run reranking in thread pool
            loop = asyncio.get_event_loop()
            scores = await loop.run_in_executor(
                None,
                lambda: self.reranker.predict([[query, doc] for doc in documents])
            )
            return sorted(zip(documents, scores), key=lambda x: x[1], reverse=True)
```

---

## 何時該重排序

### 成本效益分析

| 因素 | 不使用重排序 | 使用重排序 |
|--------|-------------------|----------------|
| 延遲 | 50 到 100 毫秒 | 150 到 300 毫秒 |
| 品質（NDCG） | 0.65 | 0.78 |
| 複雜度 | 簡單 | 中等 |
| 成本 | 基準 | 增加 API 成本或增加運算 |

### 決策框架

**一定要重排序的情況：**
- 品質至關重要（面向客戶、高風險）
- 檢索到的候選結果分數相近
- 查詢複雜或包含多個部分
- 預算允許延遲增加

**可略過重排序的情況：**
- 延遲預算非常緊（總計小於 100 毫秒）
- 檢索到的候選結果排名明確
- 簡單查詢（單一詞彙查找）
- 在大規模時受成本限制

### 推論時間的取捨

| 階段 | 檢索（K） | 重排序（N） | 延遲 | 品質 |
|-------|---------------|------------|---------|---------|
| **粗略（Naive）** | 5 | 0 | 50 毫秒 | 低 |
| **標準（Standard）** | 50 | 5 | 150 毫秒 | 高 |
| **企業級（Enterprise）**| 200 | 20 | 500 毫秒 | 最高 |

**關鍵原則**：如果你有 200 毫秒的預算，就花 50 毫秒在檢索、150 毫秒在重排序。對前 50 筆結果做重排序所帶來的投資報酬，遠高於從向量資料庫檢索更多區塊。

### 最佳候選數量

在重排序之前要檢索多少筆候選：

```python
def optimize_candidate_count(test_set, retriever, reranker):
    """Find optimal retrieval_k for reranking."""
    results = {}

    for retrieval_k in [10, 20, 50, 100, 200]:
        ndcg_scores = []
        latencies = []

        for query, relevant_docs in test_set:
            start = time.time()

            # Retrieve
            candidates = retriever.search(query, top_k=retrieval_k)

            # Rerank to top 5
            reranked = reranker.rerank(query, candidates, top_k=5)

            latency = time.time() - start
            latencies.append(latency)

            ndcg = compute_ndcg(reranked, relevant_docs)
            ndcg_scores.append(ndcg)

        results[retrieval_k] = {
            "ndcg": mean(ndcg_scores),
            "latency_p99": percentile(latencies, 99)
        }

    return results

# Typical findings:
# K=20:  NDCG 0.72, latency 120ms
# K=50:  NDCG 0.76, latency 180ms  <-- Often sweet spot
# K=100: NDCG 0.77, latency 280ms  <-- Diminishing returns
```

---

## 以 LLM 為基礎的重排序

### 把 LLM 當作重排序器使用

LLM 可以為相關性計分，但成本昂貴：

```python
def llm_rerank(
    query: str,
    documents: list[str],
    model: str = "gpt-4o-mini"
) -> list[tuple[str, float]]:
    prompt = f"""Rate the relevance of each document to the query.
Query: {query}

Documents:
{format_documents(documents)}

For each document, output a relevance score from 0-10.
Format: DOC_NUM: SCORE
"""

    response = llm.generate(prompt)
    scores = parse_scores(response)

    return sorted(zip(documents, scores), key=lambda x: x[1], reverse=True)
```

**優點：**
- 能處理複雜的相關性判斷
- 理解細微差異與上下文
- 不需要維護額外的模型

**缺點：**
- 在大規模時成本昂貴（為 cross-encoder 的 10 到 100 倍）
- 較慢（1 到 3 秒，相較於 100 毫秒）
- 非確定性

### Listwise 與 Pointwise 的 LLM 重排序

**Pointwise：** 獨立地為每份文件計分
```
For document: [doc text]
Query: [query]
Rate relevance 0-10: _
```

**Listwise：** 把所有文件放在一起排序
```
Query: [query]
Rank these documents by relevance:
A: [doc1]
B: [doc2]
C: [doc3]
Output order: _
```

**Listwise 通常更好**，因為 LLM 可以直接比較各份文件。前沿模型（例如 o1-mini 或 Sonnet 3.7）非常擅長這件事，但它會增加 1 到 2 秒的延遲。只有在高風險的企業搜尋（法律、醫療）中才會使用。

### 處理大量文件的滑動視窗

```python
def sliding_window_rerank(
    query: str,
    documents: list[str],
    window_size: int = 10,
    step: int = 5
) -> list[str]:
    """Rerank many documents with LLM using sliding window."""
    ranked = list(range(len(documents)))

    for start in range(0, len(documents), step):
        window = ranked[start:start + window_size]

        # LLM ranks this window
        window_docs = [documents[i] for i in window]
        window_order = llm_listwise_rank(query, window_docs)

        # Update rankings
        for new_pos, old_idx in enumerate(window_order):
            ranked[start + new_pos] = window[old_idx]

    return [documents[i] for i in ranked]
```

---

## SLM 蒸餾

為了解決以 LLM 為基礎的重排序的延遲問題，我們現在會使用 **經過蒸餾的小型語言模型（Distilled Small Language Models，SLMs）**。

- **流程**：取一個巨型模型（例如 GPT-5.2），讓它對 100 萬組配對做重排序，再用這些標籤去「蒸餾」出一個只有 0.1B 參數的微型模型。
- **結果**：你能以一次標準 CPU 查找的延遲（小於 10 毫秒）取得巨型模型 95% 的重排序品質。
- **生產環境模式：** 平常使用 cross-encoder，當重排序分數信心不足時改用 LLM 作為後援。

---

## 生產環境考量

### 延遲優化

```python
class OptimizedReranker:
    def __init__(self, model_name: str, device: str = "cuda"):
        self.model = CrossEncoder(model_name, device=device)
        # Enable optimizations
        self.model.model.half()  # FP16

    def rerank(self, query: str, documents: list[str]) -> list[tuple[str, float]]:
        with torch.inference_mode():
            pairs = [[query, doc] for doc in documents]
            scores = self.model.predict(
                pairs,
                batch_size=32,
                show_progress_bar=False
            )
        return sorted(zip(documents, scores), key=lambda x: x[1], reverse=True)
```

**優化技巧：**
- FP16 推論：加速 2 倍
- 批次處理：分攤額外開銷
- ONNX 匯出：加速 1.5 到 2 倍
- TensorRT：加速 2 到 3 倍（NVIDIA）
- 模型蒸餾：加速 4 倍，但需在品質上取捨

### 快取重排序器結果

```python
class CachedReranker:
    def __init__(self, reranker, cache_ttl: int = 3600):
        self.reranker = reranker
        self.cache = TTLCache(maxsize=10000, ttl=cache_ttl)

    def rerank(self, query: str, documents: list[str]) -> list[tuple[str, float]]:
        # Cache key includes query and doc hashes
        key = self._make_key(query, documents)

        if key in self.cache:
            return self.cache[key]

        result = self.reranker.rerank(query, documents)
        self.cache[key] = result
        return result

    def _make_key(self, query: str, documents: list[str]) -> str:
        doc_hash = hashlib.sha256(
            "".join(sorted(documents)).encode()
        ).hexdigest()[:16]
        query_hash = hashlib.sha256(query.encode()).hexdigest()[:16]
        return f"{query_hash}:{doc_hash}"
```

### 後援策略

```python
def rerank_with_fallback(
    query: str,
    candidates: list[Document],
    primary_reranker,
    timeout: float = 2.0
) -> list[Document]:
    try:
        # Try reranking with timeout
        result = timeout_call(
            primary_reranker.rerank,
            args=(query, candidates),
            timeout=timeout
        )
        return result
    except TimeoutError:
        # Fallback: return original order
        logger.warning("Reranker timeout, using original order")
        return candidates
    except Exception as e:
        logger.error(f"Reranker error: {e}")
        return candidates
```

---

## 面試問題

### Q：為什麼 Cross-Encoder 本質上比 Bi-Encoder 更準確？

**有力的回答：**
Bi-Encoder 會在任何查詢出現*之前*，就為一份文件建立單一、靜態的向量表示。這會遺失文字中不同部分之間的特定關係。Cross-Encoder 則把查詢與文件當成單一輸入配對，並使用 **注意力機制（Attention Mechanism）** 來比較兩者。它能看出查詢中特定字詞如何改變文件中字詞的含義（late interaction），因此能進行比「兩個固定向量的單純數學相似度」更細膩許多的相關性計分。

**實務上：** 第一階段檢索使用 bi-encoder（重速度），重排序使用 cross-encoder（重品質）。這樣能兼顧兩者的優點。

### Q：你如何決定要重排序多少筆候選？

**有力的回答：**
這是在品質與延遲之間的取捨：

**因素：**
- 每份文件的重排序器延遲
- 總延遲預算
- 品質提升曲線（通常呈現邊際遞減）
- 第一階段檢索的品質

**流程：**
1. 對每份文件的重排序器延遲做基準測試
2. 計算在延遲預算內的最大候選數量
3. 在不同的 K 值下測試品質
4. 找出轉折點（品質對延遲）

**常見的發現：**
- K=20 到 50 通常是最佳值
- 超過 K=100 之後，品質提升微乎其微
- 依第一階段檢索的品質進行調整

對於 200 毫秒的重排序預算、每份文件 4 毫秒的情況，我會重排序約 50 筆候選。

### Q：你會在什麼情況下使用以 LLM 為基礎的重排序？

**有力的回答：**
LLM 重排序在以下情況下是合理的：

1. **複雜的相關性判斷：** 查詢需要理解細微差異、上下文，或多跳推理
2. **低流量：** 無法為了訓練或託管一個 cross-encoder 而提出充分理由
3. **要求最高品質：** 法律、醫療、安全攸關
4. **管線中已經在使用 LLM：** 邊際成本較低

**注意事項：**
- 在大規模時成本昂貴（為 cross-encoder 的 10 到 100 倍）
- 較慢（1 到 3 秒，相較於 100 毫秒）
- 非確定性
- 可能需要謹慎的提示工程

**生產環境模式：** 平常使用 cross-encoder，當重排序分數信心不足時改用 LLM 作為後援。

### Q：對於極長的查詢（例如一整段文字），你如何處理重排序？

**有力的回答：**
長查詢會為 cross-encoder 帶來「Token 預算」問題，因為它們往往有 512 或 1024 個 token 的限制。常見的解法是 **滑動視窗重排序（Sliding Window Reranking）** 或 **查詢摘要（Query Summarization）**。或者，使用像 **Jina-Reranker-v2** 這類能處理 8k+ tokens 的專用模型。先用一個快速、短上下文的模型做「第一輪重排序」，接著對前 5 筆候選用一個高上下文的 LLM 做「第二輪重排序」，這種做法也很常見。

---

## 參考資料

- Nogueira and Cho. "Passage Re-ranking with BERT" (2019)
- Nogueira et al. "Multi-Stage Document Ranking with BERT" (2019/2025 update)
- BAAI BGE Reranker: https://huggingface.co/BAAI/bge-reranker-base
- Cohere Rerank: https://docs.cohere.com/docs/rerank
- Sun et al. "Is ChatGPT Good at Search? Investigating Large Language Models as Re-Ranking Agents" (2023)

---

*上一篇：[混合搜尋](05-hybrid-search.md) | 下一篇：[GraphRAG](07-graph-rag.md)*
