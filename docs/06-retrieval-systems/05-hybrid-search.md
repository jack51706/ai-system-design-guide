# Hybrid Search

Hybrid search combines dense (semantic) and sparse (keyword) retrieval to get the benefits of both. It is the baseline for production RAG: Elasticsearch's `rrf` retriever, OpenSearch hybrid search, Weaviate, Qdrant, and Azure AI Search all ship native hybrid pipelines out of the box.

## Table of Contents

- [Why Hybrid Search](#why-hybrid-search)
- [Dense vs Sparse Retrieval](#dense-vs-sparse-retrieval)
- [Hybrid Search Architectures](#hybrid-search-architectures)
- [Fusion Methods](#fusion-methods)
- [Learned Sparse Embeddings (SPLADE)](#learned-sparse-embeddings-splade)
- [Implementation Patterns](#implementation-patterns)
- [Tuning and Optimization](#tuning-and-optimization)
- [Production Considerations](#production-considerations)
- [Interview Questions](#interview-questions)
- [References](#references)

---

## Why Hybrid Search

Neither dense nor sparse retrieval is universally better. Each excels at different query types.

### Query Type Analysis

| Query Type | Example | Better Retrieval |
|------------|---------|------------------|
| Conceptual | "How do transformers learn?" | Dense |
| Keyword-specific | "GPT-4 API rate limits" | Sparse |
| Named entities | "John Smith's research on BERT" | Sparse |
| Acronyms/codes | "What does HTTP 429 mean?" | Sparse |
| Paraphrased | "How to make AI faster" vs "LLM optimization" | Dense |
| Mixed | "What is the cost of GPT-4o API?" | Hybrid |

**Nuance**: Dense-only retrieval fails on technical documentation where specific version numbers and function names carry 90% of the information value.

### The Gap Problem

Dense retrieval can miss exact matches:

```
Query: "Configure NVIDIA_VISIBLE_DEVICES"
Document: "Set the NVIDIA_VISIBLE_DEVICES environment variable..."

Dense search may miss this because:
- "NVIDIA_VISIBLE_DEVICES" might tokenize poorly
- Semantic embedding does not capture exact string matching
- Training data may not have this specific term
```

Sparse search (BM25) finds this immediately because of exact token match.

---

## Dense vs Sparse Retrieval

### Dense (Semantic) Retrieval

Uses neural embeddings to match meaning.

```python
def dense_search(query: str, top_k: int = 10) -> list[Result]:
    query_embedding = embedding_model.encode(query)
    results = vector_db.search(query_embedding, top_k=top_k)
    return results
```

**Strengths:**
- Understands paraphrases and synonyms
- Captures conceptual similarity
- Works across languages (with multilingual models)

**Weaknesses:**
- May miss exact keyword matches
- Struggles with entities, codes, acronyms
- Requires embedding model

### Sparse (Keyword) Retrieval

Uses term frequency and statistics (BM25, TF-IDF).

```python
def sparse_search(query: str, top_k: int = 10) -> list[Result]:
    tokens = tokenize(query)
    results = bm25_index.search(tokens, top_k=top_k)
    return results
```

**Strengths:**
- Excellent for exact matches
- Handles rare terms, codes, entities
- Fast and interpretable
- No training required

**Weaknesses:**
- Misses semantic similarity
- No synonym understanding
- Sensitive to vocabulary mismatch

### Head-to-Head Comparison

| Aspect | Dense | Sparse | Hybrid |
|--------|-------|--------|--------|
| Semantic matching | Best | Poor | Best |
| Exact matching | Poor | Best | Best |
| Rare terms | Poor | Best | Very Good |
| Zero-shot domains | Very Good | Best | Best |
| Latency | Medium | Fast | Medium |
| Implementation | Medium | Simple | Complex |

---

## Hybrid Search Architectures

### Architecture 1: Parallel Retrieval with Fusion

```
                    +------------------+
                    |      Query       |
                    +--------+---------+
                             |
              +--------------+--------------+
              v                             v
    +-------------------+         +-------------------+
    |  Dense Retrieval  |         |  Sparse Retrieval |
    |   (Vector DB)     |         |    (BM25/ES)      |
    +---------+---------+         +---------+---------+
              |                             |
              +--------------+--------------+
                             v
                    +-------------------+
                    |      Fusion       |
                    |  (RRF, weighted)  |
                    +---------+---------+
                              |
                              v
                    +-------------------+
                    |  Final Results    |
                    +-------------------+
```

**Pros:** Clear separation, can use best-in-class for each (e.g., Pinecone + Algolia), tune independently
**Cons:** Two separate systems to maintain, higher latency (must wait for the slower engine)

### Architecture 2: Native Hybrid (Single System)

Some vector databases support hybrid natively:

```python
# Weaviate
results = client.query.get("Document", ["text"]).with_hybrid(
    query="Configure NVIDIA_VISIBLE_DEVICES",
    alpha=0.5  # 0 = sparse only, 1 = dense only
).do()

# Qdrant (with sparse vectors)
results = client.search(
    collection_name="docs",
    query_vector=NamedVector(name="dense", vector=dense_embedding),
    query_sparse_vector=NamedSparseVector(name="sparse", vector=sparse_vector),
)
```

**Pros:** Single system, simpler ops, lower latency
**Cons:** Limited fusion customization, less flexibility in scaling keyword vs. vector infra

### Architecture 3: Staged Retrieval

```
Query --> Sparse (fast, broad) --> Top 1000
                    |
                    v
          Dense reranking --> Top 100
                    |
                    v
           Cross-encoder --> Top 10
```

**Pros:** Efficient, each stage refines
**Cons:** More complex, risk of early-stage errors

---

## Fusion Methods

### Reciprocal Rank Fusion (RRF)

RRF is the gold standard for combining results from two different search engines. It does not look at the *score* (which is incomparable across engines). It looks at the **rank**.

```python
def reciprocal_rank_fusion(
    rankings: list[list[str]],  # List of doc_id lists
    k: int = 60
) -> list[tuple[str, float]]:
    scores = defaultdict(float)

    for ranking in rankings:
        for rank, doc_id in enumerate(ranking):
            scores[doc_id] += 1 / (k + rank + 1)

    sorted_docs = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return sorted_docs
```

**Properties:**
- Position-based, ignores raw scores
- Robust to score scale differences -- prevents a single engine from "dominating" just because it has high numerical scores
- k parameter controls rank sensitivity (higher k = less sensitive to position)
- Simple to implement, no tuning beyond k

**Typical k values:** 60 (original paper), 10-100 in practice

### Weighted Score Fusion

Combine normalized scores:

```python
def weighted_fusion(
    dense_results: list[Result],
    sparse_results: list[Result],
    alpha: float = 0.5  # Weight for dense
) -> list[Result]:
    # Normalize scores to [0, 1]
    dense_normalized = normalize_scores(dense_results)
    sparse_normalized = normalize_scores(sparse_results)

    # Combine
    combined = {}
    for r in dense_normalized:
        combined[r.id] = alpha * r.score
    for r in sparse_normalized:
        combined[r.id] = combined.get(r.id, 0) + (1 - alpha) * r.score

    sorted_docs = sorted(combined.items(), key=lambda x: x[1], reverse=True)
    return sorted_docs

def normalize_scores(results: list[Result]) -> list[Result]:
    if not results:
        return []
    min_score = min(r.score for r in results)
    max_score = max(r.score for r in results)
    range_score = max_score - min_score + 1e-6

    return [
        Result(id=r.id, score=(r.score - min_score) / range_score)
        for r in results
    ]
```

**Properties:**
- Uses actual scores (more information than rank)
- Requires score normalization
- Alpha controls dense vs sparse balance

### Relative Score Fusion

Account for score distribution:

```python
def relative_score_fusion(
    dense_results: list[Result],
    sparse_results: list[Result]
) -> list[Result]:
    # Use z-score normalization
    dense_normalized = z_score_normalize(dense_results)
    sparse_normalized = z_score_normalize(sparse_results)

    # Combine
    combined = {}
    for r in dense_normalized:
        combined[r.id] = r.score
    for r in sparse_normalized:
        combined[r.id] = combined.get(r.id, 0) + r.score

    return sorted(combined.items(), key=lambda x: x[1], reverse=True)

def z_score_normalize(results: list[Result]) -> list[Result]:
    scores = [r.score for r in results]
    mean = sum(scores) / len(scores)
    std = (sum((s - mean) ** 2 for s in scores) / len(scores)) ** 0.5 + 1e-6

    return [Result(id=r.id, score=(r.score - mean) / std) for r in results]
```

### Fusion Method Comparison

| Method | Uses Scores | Query Adaptive | Complexity |
|--------|-------------|----------------|------------|
| RRF | No (ranks only) | No | Low |
| Weighted | Yes | No | Low |
| Relative Score | Yes | Partially | Medium |
| Learned | Yes | Yes | High |

---

## Learned Sparse Embeddings (SPLADE)

Production stacks have moved beyond BM25 (simple word frequency) to **Learned Sparse Embeddings** for the sparse arm of hybrid search.

**Technique**: Models like **SPLADE v3** predict "importance weights" for every word in the dictionary.

**Why?**: SPLADE can "expand" queries. If you search for "CPU," it might automatically add a small weight to the term "processor," even if "processor" is not in your query. It combines the exact-match power of sparse search with the conceptual power of dense search in a single storage format.

### SPLADE Implementation

```python
from transformers import AutoModelForMaskedLM, AutoTokenizer

class SpladeEncoder:
    def __init__(self, model_name="naver/splade-cocondenser-ensembledistil"):
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForMaskedLM.from_pretrained(model_name)

    def encode(self, text: str) -> dict[str, float]:
        inputs = self.tokenizer(text, return_tensors="pt", truncation=True)
        outputs = self.model(**inputs)

        # Get sparse weights
        weights = torch.max(
            torch.log(1 + torch.relu(outputs.logits)) * inputs["attention_mask"].unsqueeze(-1),
            dim=1
        ).values.squeeze()

        # Convert to sparse dict
        non_zero = weights.nonzero().squeeze().tolist()
        sparse_vec = {
            self.tokenizer.decode([idx]): weights[idx].item()
            for idx in non_zero
            if weights[idx] > 0
        }

        return sparse_vec
```

**When to use SPLADE over BM25 + Dense Hybrid:** SPLADE produces a sparse vector that can be stored in modern vector databases (like Milvus or Qdrant) alongside the dense vector, enabling hybrid search in a single pass without a separate Elasticsearch or BM25 index. Stick to BM25 if your dataset has extremely rare, non-linguistic tokens (like unique serial numbers) that a neural model might not have seen during training.

---

## Implementation Patterns

### Pattern 1: Elasticsearch + Vector DB

```python
class HybridSearcher:
    def __init__(self, es_client, vector_db, embedding_model):
        self.es = es_client
        self.vector_db = vector_db
        self.embedding_model = embedding_model

    def search(self, query: str, top_k: int = 10, alpha: float = 0.5) -> list[Result]:
        # Parallel retrieval
        dense_future = self.dense_search(query, top_k * 3)
        sparse_future = self.sparse_search(query, top_k * 3)

        dense_results = dense_future.result()
        sparse_results = sparse_future.result()

        # Fusion
        combined = reciprocal_rank_fusion([
            [r.id for r in dense_results],
            [r.id for r in sparse_results]
        ])

        return combined[:top_k]

    async def dense_search(self, query: str, top_k: int) -> list[Result]:
        embedding = self.embedding_model.encode(query)
        return self.vector_db.search(embedding, top_k=top_k)

    async def sparse_search(self, query: str, top_k: int) -> list[Result]:
        response = self.es.search(
            index="documents",
            body={
                "query": {"match": {"content": query}},
                "size": top_k
            }
        )
        return [
            Result(id=hit["_id"], score=hit["_score"])
            for hit in response["hits"]["hits"]
        ]
```

### Pattern 2: Native Hybrid with Weaviate

```python
import weaviate

def hybrid_search_weaviate(
    client: weaviate.Client,
    query: str,
    alpha: float = 0.5,
    top_k: int = 10
) -> list[dict]:
    result = client.query.get(
        "Document",
        ["text", "title", "source"]
    ).with_hybrid(
        query=query,
        alpha=alpha,  # 0 = BM25 only, 1 = vector only
        fusion_type=weaviate.HybridFusion.RELATIVE_SCORE
    ).with_limit(top_k).do()

    return result["data"]["Get"]["Document"]
```

---

## Tuning and Optimization

### Alpha Tuning

The alpha parameter balances dense vs sparse:

```python
def find_optimal_alpha(
    test_queries: list[tuple[str, list[str]]],  # (query, relevant_doc_ids)
    alpha_range: list[float] = [0.0, 0.3, 0.5, 0.7, 1.0]
) -> float:
    best_alpha = 0.5
    best_ndcg = 0

    for alpha in alpha_range:
        ndcg_scores = []
        for query, relevant in test_queries:
            results = hybrid_search(query, alpha=alpha)
            ndcg = compute_ndcg(results, relevant)
            ndcg_scores.append(ndcg)

        avg_ndcg = sum(ndcg_scores) / len(ndcg_scores)
        if avg_ndcg > best_ndcg:
            best_ndcg = avg_ndcg
            best_alpha = alpha

    return best_alpha
```

**Best practice / typical findings:**
- Technical documentation and code: alpha 0.3-0.4 (keyword heavy)
- General text: alpha 0.5 (balanced)
- Chat and creative exploration: alpha 0.7-0.9 (semantic heavy)

### Query-Adaptive Alpha

Predict optimal alpha per query:

```python
def predict_alpha(query: str) -> float:
    # Heuristics-based
    has_quotes = '"' in query
    has_code = any(c in query for c in ['_', '()', '{}', '[]'])
    has_numbers = any(c.isdigit() for c in query)

    # More sparse for exact match queries
    if has_quotes or has_code:
        return 0.3
    if has_numbers:
        return 0.4

    # More semantic for natural language
    if len(query.split()) > 5:
        return 0.7

    return 0.5  # Default balanced
```

### Retrieval Depth

How many results to fetch before fusion:

```python
# Rule of thumb: fetch 3-5x more from each source
def hybrid_search(query: str, final_k: int = 10):
    fetch_k = final_k * 4

    dense_results = dense_search(query, top_k=fetch_k)
    sparse_results = sparse_search(query, top_k=fetch_k)

    fused = rrf([dense_results, sparse_results])
    return fused[:final_k]
```

---

## Production Considerations

### Latency Budget

```
Typical hybrid search latency breakdown:

Dense embedding:           30-50ms
Dense retrieval:          30-50ms
Sparse retrieval:         20-40ms  (parallel with dense)
Fusion:                    1-5ms
Total:                   60-100ms
```

**Optimizations:**
- Run dense and sparse in parallel
- Pre-compute embeddings for common queries
- Use approximate search for both
- Cache fusion results for repeated queries

### Caching Strategy

```python
class HybridSearchCache:
    def __init__(self, ttl_seconds: int = 300):
        self.cache = TTLCache(ttl=ttl_seconds)

    def search(self, query: str, **kwargs) -> list[Result]:
        cache_key = self._make_key(query, kwargs)

        if cache_key in self.cache:
            return self.cache[cache_key]

        results = self._do_search(query, **kwargs)
        self.cache[cache_key] = results
        return results

    def _make_key(self, query: str, kwargs: dict) -> str:
        return hashlib.sha256(
            f"{query}:{sorted(kwargs.items())}".encode()
        ).hexdigest()
```

### Fallback Strategy

```python
def hybrid_search_with_fallback(query: str, top_k: int = 10) -> list[Result]:
    try:
        return hybrid_search(query, top_k=top_k)
    except DenseSearchError:
        # Fallback to sparse only
        return sparse_search(query, top_k=top_k)
    except SparseSearchError:
        # Fallback to dense only
        return dense_search(query, top_k=top_k)
```

---

## Interview Questions

### Q: When would you use hybrid search over pure dense search?

**Strong answer:**
I would use hybrid search when:

1. **Queries contain specific terms:** Product codes, API names, error codes. Dense search may miss exact matches.

2. **Domain has specialized vocabulary:** Technical documentation, legal, medical. Sparse captures specific terms.

3. **Zero-shot retrieval:** New domain without fine-tuned embeddings. Sparse provides robust baseline.

4. **Quality is critical:** Hybrid rarely performs worse than either alone, at cost of complexity.

**I would stick with pure dense when:**
- Queries are purely conceptual/semantic
- Latency budget is very tight
- Simpler architecture is priority
- Embedding model is well-tuned for domain

The decision is empirical. I would A/B test hybrid vs dense on my actual query distribution.

### Q: Why is Reciprocal Rank Fusion (RRF) safer than "Simple Score Addition"?

**Strong answer:**
Simple score addition is dangerous because vector scores (e.g., Cosine Similarity: 0.0 to 1.0) and keyword scores (e.g., BM25: 0 to infinity) use completely different scales. An extremely high BM25 score for a lucky keyword match could "drown out" 10 highly relevant semantic matches. RRF ignores the absolute scores and only cares about the relative order (rank). This makes it mathematically robust to outliers and "score-drift" in different retrieval engines.

### Q: When would you choose SPLADE over the standard BM25 + Dense Hybrid approach?

**Strong answer:**
I would choose SPLADE when I want to simplify my infrastructure. SPLADE produces a sparse vector that can be stored in many modern vector databases (like Milvus or Qdrant) alongside the dense vector. This allows the database to perform "Hybrid search" in a single pass without needing a separate Elasticsearch or BM25 index. However, I would stick to BM25 if my dataset has extremely rare, non-linguistic tokens (like unique serial numbers) that a neural model might not have seen during training.

### Q: How do you balance dense vs sparse in hybrid search?

**Strong answer:**
The alpha parameter controls the balance (typically alpha for dense weight):

**Tuning approach:**
1. Start with alpha=0.5 (equal weight)
2. Create evaluation set with queries and relevance labels
3. Grid search alpha in [0.1, 0.3, 0.5, 0.7, 0.9]
4. Measure NDCG or MRR at each setting
5. Pick alpha that maximizes evaluation metric

**Query-adaptive tuning:**
- Detect query type (keyword-heavy, conceptual, mixed)
- Adjust alpha per query
- Can use simple heuristics or learned classifier

**Rule of thumb:**
- Technical/code queries: alpha 0.3-0.4
- General text: alpha 0.5
- Conversational: alpha 0.7-0.8

---

## References

- Cormack et al. "Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods" (2009)
- Formal et al. "SPLADE: Sparse Lexical and Expansion Model for First Stage Ranking" (2021/2025)
- Weaviate Hybrid Search: https://weaviate.io/developers/weaviate/search/hybrid
- Qdrant Hybrid Search: https://qdrant.tech/documentation/concepts/hybrid-queries/

---

*Previous: [Vector Databases](04-vector-databases.md) | Next: [Reranking Strategies](06-reranking-strategies.md)*
