# 大規模生產環境 RAG

生產環境 RAG 已不再是週末的小專案。它是一套分散式系統，包含檢索管線、快取層、路由邏輯、自我修正迴圈、多租戶隔離與成本控制，全部都在嚴格的延遲 SLA 之下運作。當 RAG 在生產環境出問題時，大約有 73% 的失敗發生在檢索階段，而非生成階段，因此成功的企業部署會把知識來源（而非模型）當成首要的投資對象。

## 目錄

- [RAG 與長上下文的取捨](#rag-vs-long-context)
- [查詢路由與分類](#query-routing)
- [RAG 的語意快取](#semantic-caching)
- [多索引策略](#multi-index)
- [RAG 管線最佳化](#pipeline-optimization)
- [Corrective RAG：自我檢查的檢索](#corrective-rag)
- [自適應檢索](#adaptive-retrieval)
- [成本最佳化模式](#cost-optimization)
- [失效模式與除錯](#failure-modes)
- [監控與告警](#monitoring)
- [擴展到數百萬份文件](#scaling)
- [多租戶 RAG 隔離](#multi-tenant)
- [真實世界架構範例](#architectures)
- [系統設計面試切角](#interview)
- [參考資料](#references)

---

## RAG 與長上下文的取捨

如今每個主要的前沿模型家族都已支援 1M+ token 的上下文視窗（Claude Opus 4.7、Claude Sonnet 4.6、GPT-5.5、Gemini 3.1 Pro、Qwen 3.6 Plus、Llama 4 Maverick），問題已經不再是「該用 RAG 還是長上下文？」，而是「各自在什麼情況下勝出？」。

### 決策矩陣

```
                    Small Corpus           Large Corpus
                    (<100K tokens)         (>1M tokens)
                 +---------------------+---------------------+
  Static Data    |  Long Context Wins  |  RAG Required       |
  (rarely        |  - Stuff it all in  |  - Can't fit in     |
   changes)      |  - Simpler arch     |    context window   |
                 |  - No index needed  |  - Index + retrieve |
                 +---------------------+---------------------+
  Dynamic Data   |  Hybrid Approach    |  RAG Required       |
  (updates       |  - Cache context    |  - Incremental      |
   frequently)   |  - Invalidate on    |    indexing          |
                 |    change           |  - Real-time updates |
                 +---------------------+---------------------+
  Multi-User     |  RAG Preferred      |  RAG Required       |
  (per-user      |  - Personalized     |  - Tenant isolation  |
   data)         |    retrieval        |  - Access control    |
                 +---------------------+---------------------+
```

### 正面對決比較

| 面向 | RAG | 長上下文（1M tokens） |
|-----------|-----|--------------------------|
| **平均查詢成本** | ~$0.0001 | ~$0.10 |
| **平均延遲（p50）** | ~1s | ~30-45s |
| **特定事實的精確度** | 高（鎖定式檢索） | 在中段會下降 |
| **跨文件綜合** | 弱（上下文有限） | 強（看得到全部內容） |
| **語料庫大小上限** | 無上限 | ~1M tokens |
| **資料新鮮度** | 數分鐘（增量索引） | 需要完整重新載入 |
| **1000 QPS 下的成本** | ~$100/天 | ~$100,000/天 |

### 「迷失在中段」（Lost in the Middle）問題

LLM 對上下文視窗的注意力並非均勻分布。位於長上下文中段的資訊，相較於開頭或結尾的資訊，準確度會下降 30% 以上。RAG 完全繞開了這個問題，因為它只把最相關的區塊放進一段簡短、聚焦的上下文裡。

### 最佳實務：混合模式

致勝的架構是兩者兼用：先用 RAG 從大型語料庫中檢索出前段候選，再把這些候選載入長上下文視窗，進行跨文件推理。

```
  User Query
      |
      v
+------------------+     +-------------------+
|  RAG Retrieval   |---->|  Long Context     |
|  (Find top 20    |     |  Synthesis        |
|   from 10M docs) |     |  (Reason across   |
+------------------+     |   20 docs deeply) |
                          +-------------------+
                                  |
                                  v
                          Final Answer with
                          Cross-Doc Citations
```

**經驗法則**：如果你的語料庫塞得進上下文，而且你負擔得起延遲，也負擔得起成本，那就用長上下文。否則就用 RAG。對大多數有成本與延遲限制的生產系統來說，RAG 仍然是正確的預設選項。

---

## 查詢路由與分類

並非每個查詢都需要檢索。生產系統會對進來的查詢做分類，並把它們路由到最佳的處理路徑。

### 四路由器（Four-Path Router）

```
                         User Query
                             |
                             v
                    +------------------+
                    |  Query Classifier |
                    |  (LLM or trained  |
                    |   classifier)     |
                    +--------+---------+
                             |
            +--------+-------+-------+--------+
            |        |               |        |
            v        v               v        v
        +------+ +--------+    +--------+ +--------+
        |Direct| |Simple  |    |Complex | |Agentic |
        | LLM  | |  RAG   |    |  RAG   | |  RAG   |
        +------+ +--------+    +--------+ +--------+
        "What    "What is      "Compare   "Analyze
        is 2+2?" our refund    Q3 vs Q4   all legal
                  policy?"     revenue    risks in
                               trends"    these 50
                                          contracts"
```

### 分類訊號

| 訊號 | Direct LLM | Simple RAG | Complex RAG | Agentic RAG |
|--------|-----------|------------|-------------|-------------|
| **需要私有資料** | 否 | 是 | 是 | 是 |
| **單跳即可回答** | 是 | 是 | 否 | 否 |
| **需要多個來源** | 否 | 否 | 是 | 是 |
| **需要推理鏈** | 否 | 否 | 也許 | 是 |
| **時效性資料** | 否 | 也許 | 也許 | 是 |

### 實作：輕量級路由器

```python
class QueryRouter:
    """Routes queries to the optimal retrieval strategy."""

    def __init__(self, classifier_model: str = "gpt-4o-mini"):
        self.classifier = classifier_model
        self.route_counts = Counter()  # for monitoring

    async def classify(self, query: str, user_context: dict) -> str:
        # Step 1: Rule-based fast path
        if self._is_trivial(query):
            return "direct_llm"

        # Step 2: Check if query references private/org data
        if not self._needs_retrieval(query, user_context):
            return "direct_llm"

        # Step 3: LLM-based complexity classification
        complexity = await self._assess_complexity(query)

        if complexity == "simple":
            return "simple_rag"
        elif complexity == "multi_hop":
            return "complex_rag"
        else:
            return "agentic_rag"

    def _is_trivial(self, query: str) -> bool:
        """Fast regex/keyword check for trivial queries."""
        trivial_patterns = [
            r"^(what is|define|explain)\s+\w+$",
            r"^(hi|hello|thanks|bye)",
        ]
        return any(re.match(p, query.lower()) for p in trivial_patterns)

    async def _assess_complexity(self, query: str) -> str:
        """Use a small, fast model to classify complexity."""
        prompt = f"""Classify this query's retrieval complexity:
        - "simple": needs one document lookup
        - "multi_hop": needs 2-3 lookups, comparison, or synthesis
        - "agentic": needs planning, tool use, or iterative search

        Query: {query}
        Classification:"""

        result = await llm_call(self.classifier, prompt, max_tokens=10)
        return result.strip().lower()
```

### 領域專屬路由

對於擁有多個知識領域的系統，在檢索之前先把查詢路由到正確的索引。

```python
# Rule-based domain routing
DOMAIN_RULES = {
    "revenue|sales|quota|ARR":     "financial_index",
    "policy|handbook|PTO|benefits": "hr_index",
    "API|endpoint|SDK|integration": "engineering_index",
    "compliance|GDPR|SOC2|audit":   "legal_index",
}

# Embedding-based domain routing (for ambiguous queries)
class DomainRouter:
    def __init__(self):
        self.domain_centroids = {}  # pre-computed per domain

    def route(self, query_embedding: list[float]) -> str:
        similarities = {
            domain: cosine_sim(query_embedding, centroid)
            for domain, centroid in self.domain_centroids.items()
        }
        return max(similarities, key=similarities.get)
```

---

## RAG 的語意快取

語意快取能辨識出一個新查詢在意義上本質與先前某個查詢相同，並重複使用先前快取的結果。生產系統回報，在妥善調校的語意快取下，成本最高可降低 68%、延遲最高可改善 65 倍。

### 三層快取架構

```
  User Query
      |
      v
+---------------------+
| Layer 1: Exact Cache |  Hash(query) -> response
| (Redis/Memcached)    |  TTL: 1 hour
| Hit rate: ~15-25%    |  Latency: <5ms
+----------+----------+
           | miss
           v
+---------------------+
| Layer 2: Semantic    |  Embed(query) -> nearest neighbor
| Cache (Vector DB)    |  Threshold: cosine > 0.95
| Hit rate: ~20-35%    |  Latency: <50ms
+----------+----------+
           | miss
           v
+---------------------+
| Layer 3: Document    |  Cache retrieved chunks
| Cache               |  Skip re-embedding
| (saves embedding $) |  TTL: until doc changes
+----------+----------+
           | miss
           v
    Full RAG Pipeline
```

### 語意快取實作

```python
class SemanticCache:
    """Cache RAG responses by query semantic similarity."""

    def __init__(self, vector_store, similarity_threshold: float = 0.95):
        self.vector_store = vector_store
        self.threshold = similarity_threshold
        self.response_store = {}  # query_id -> cached response

    async def get(self, query: str) -> Optional[CachedResponse]:
        # Step 1: Exact match (fast path)
        exact_key = hashlib.sha256(query.encode()).hexdigest()
        if exact_key in self.response_store:
            return self.response_store[exact_key]

        # Step 2: Semantic match
        query_embedding = await embed(query)
        results = self.vector_store.search(
            query_embedding, top_k=1
        )

        if results and results[0].score >= self.threshold:
            cached_id = results[0].metadata["response_id"]
            cached = self.response_store.get(cached_id)
            if cached and not cached.is_expired():
                return cached

        return None

    async def put(
        self, query: str, response: str,
        sources: list[str], ttl_seconds: int = 3600
    ):
        query_embedding = await embed(query)
        response_id = str(uuid4())

        # Store the embedding for future similarity lookups
        self.vector_store.upsert(
            id=response_id,
            embedding=query_embedding,
            metadata={"response_id": response_id}
        )

        # Store the actual response
        self.response_store[response_id] = CachedResponse(
            response=response,
            sources=sources,
            created_at=time.time(),
            ttl=ttl_seconds,
        )
```

### 快取失效策略

| 策略 | 觸發條件 | 使用情境 |
|----------|---------|----------|
| **以 TTL 為基礎** | 固定時間到期 | 一般查詢、新聞 |
| **事件驅動** | 文件更新 webhook | 知識庫 |
| **版本標記** | 文件版本不符 | 合規關鍵場景 |
| **信心度把關** | 檢索分數偏低 | 變動頻繁的領域 |

**關鍵規則**：永遠要把來源文件的 ID 跟回應一起快取。當任一來源文件被更新時，就讓所有引用到它的快取項目失效。

```python
# Webhook-based cache invalidation
@app.post("/webhook/document-updated")
async def on_document_updated(doc_id: str):
    # Find all cache entries that used this document
    affected = cache_index.find_by_source(doc_id)
    for entry in affected:
        semantic_cache.invalidate(entry.response_id)
    logger.info(f"Invalidated {len(affected)} cache entries for doc {doc_id}")
```

---

## 多索引策略

單一的整體式索引無法擴展。生產系統會依領域、租戶或文件類型來切分向量索引，以提升檢索精確度並達成運維上的隔離。

### 索引切分模式

```
Pattern 1: Per-Domain Indexes
+--------+  +--------+  +--------+  +--------+
|  Legal |  |   HR   |  |Finance |  |  Eng   |
| Index  |  | Index  |  | Index  |  | Index  |
+--------+  +--------+  +--------+  +--------+
    |            |            |           |
    +----------- +-----+------+-----------+
                       |
                 Query Router
                       |
                  User Query


Pattern 2: Per-Tenant Indexes (Silo Model)
+----------+  +----------+  +----------+
| Tenant A |  | Tenant B |  | Tenant C |
|  Index   |  |  Index   |  |  Index   |
| (Acme)   |  | (Globex) |  | (Wayne)  |
+----------+  +----------+  +----------+


Pattern 3: Shared Index with Metadata Filtering (Pool Model)
+-------------------------------------------+
|           Shared Vector Index              |
|  +-------+  +-------+  +-------+          |
|  | doc_1 |  | doc_2 |  | doc_3 |  ...     |
|  | t:A   |  | t:B   |  | t:A   |          |
|  +-------+  +-------+  +-------+          |
|                                            |
|  WHERE tenant_id = "A"  <-- filter         |
+-------------------------------------------+
```

### 各模式的適用時機

| 模式 | 隔離程度 | 成本 | 運維複雜度 | 最適合 |
|---------|-----------|------|----------------------|----------|
| **依領域切分** | 中等 | 中等 | 中等 | 具有不同知識領域的內部工具 |
| **依租戶獨立（Silo）** | 最強 | 高 | 高 | 企業級 SaaS、受監管的產業 |
| **共享池（Shared Pool）** | 最弱 | 低 | 低 | 中小企業 SaaS、成本敏感的產品 |
| **混合橋接** | 可設定 | 中等 | 高 | 客群混合（企業 + 中小企業） |

### 階層式索引策略

對於非常龐大的語料庫，採用兩層索引：一個粗粒度的「摘要索引」用於路由，以及細粒度的「區塊索引」用於精確查找。

```
  Query: "What is the refund policy for enterprise plans?"
      |
      v
+--------------------+
| Summary Index      |  Contains doc-level summaries
| (10K entries)      |  Fast, broad search
+--------+-----------+
         |
         | Top 3 matching docs identified
         v
+--------------------+
| Chunk Index        |  Contains 500-token chunks
| (2M entries)       |  Precise, targeted search
| Filtered to 3 docs |
+--------+-----------+
         |
         v
   Top 5 chunks -> LLM
```

---

## RAG 管線最佳化

一條天真的循序式 RAG 管線會在每一步都增加延遲。生產級管線會運用平行處理、批次化與非同步處理，以滿足次秒級的 SLA。

### 循序式與最佳化管線的比較

```
SEQUENTIAL (Naive):
Query -> Embed(200ms) -> Search(150ms) -> Rerank(300ms) -> Generate(800ms)
Total: ~1450ms

OPTIMIZED (Parallel + Cached):
Query ----+---> Embed(200ms) ---> Vector Search(150ms) ---+
          |                                                |--> RRF Merge -> Rerank(300ms) -> Generate(800ms)
          +---> BM25 Keyword Search(100ms) ---------------+
          |
          +---> Cache Check(5ms) -- HIT --> Return cached (5ms total)

With cache miss: ~1050ms (embedding + keyword in parallel)
With cache hit:  ~5ms
```

### 平行檢索

```python
async def parallel_retrieve(
    query: str,
    query_embedding: list[float],
    indexes: list[str],
) -> list[Chunk]:
    """Run vector search, keyword search, and graph traversal in parallel."""

    tasks = [
        vector_search(query_embedding, index="main", top_k=20),
        bm25_search(query, index="main", top_k=20),
        # Optionally, graph-based retrieval for entity queries
        graph_search(query, max_hops=2, top_k=10),
    ]

    # All retrieval strategies execute concurrently
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Filter out failures (graceful degradation)
    valid_results = [r for r in results if not isinstance(r, Exception)]

    # Merge with Reciprocal Rank Fusion
    merged = reciprocal_rank_fusion(valid_results, k=60)

    return merged[:20]  # top 20 after fusion
```

### 批次化嵌入

當同時處理資料匯入或多個查詢時，把嵌入呼叫批次化，以最大化 GPU 使用率。

```python
class EmbeddingBatcher:
    """Batch embedding requests to reduce per-call overhead."""

    def __init__(self, model: str, batch_size: int = 64, max_wait_ms: int = 50):
        self.model = model
        self.batch_size = batch_size
        self.max_wait = max_wait_ms / 1000
        self.queue: asyncio.Queue = asyncio.Queue()
        self._running = True

    async def embed(self, text: str) -> list[float]:
        """Submit a single text and wait for its embedding."""
        future = asyncio.Future()
        await self.queue.put((text, future))
        return await future

    async def _batch_loop(self):
        """Background loop that collects and processes batches."""
        while self._running:
            batch = []
            try:
                # Wait for at least one item
                item = await asyncio.wait_for(
                    self.queue.get(), timeout=1.0
                )
                batch.append(item)

                # Collect more items up to batch_size or max_wait
                deadline = time.time() + self.max_wait
                while len(batch) < self.batch_size and time.time() < deadline:
                    try:
                        item = await asyncio.wait_for(
                            self.queue.get(),
                            timeout=max(0, deadline - time.time())
                        )
                        batch.append(item)
                    except asyncio.TimeoutError:
                        break

                # Process the batch
                texts = [t for t, _ in batch]
                embeddings = await embed_batch(self.model, texts)

                for (_, future), emb in zip(batch, embeddings):
                    future.set_result(emb)

            except asyncio.TimeoutError:
                continue
```

### 串流生成搭配提前檢索

在使用者還沒打完字之前就開始檢索（偵測到停頓時），並在生成 token 產生的同時把它們串流出去。

```
Timeline:
0ms     User starts typing...
300ms   Pause detected -> trigger retrieval speculatively
500ms   User submits query
        Retrieval already 200ms in -> finishes at 650ms
650ms   Reranking begins
950ms   First generation token streams to user
1800ms  Full response complete

vs. without speculation:
0ms     User submits query
200ms   Embedding
350ms   Retrieval
650ms   Reranking
1500ms  First token
2300ms  Full response complete
```

---

## Corrective RAG：自我檢查的檢索

Corrective RAG（CRAG）在檢索與生成之間加入了一層驗證。系統會在生成回應之前，先評估檢索到的文件是否真的能回答該查詢。

### CRAG 決策迴圈

```
  User Query
      |
      v
  Retrieve Top-K
      |
      v
+------------------+
| Relevance Grader  |  "Are these docs relevant to the query?"
| (LLM or trained   |
|  classifier)      |
+--------+---------+
         |
    +----+----+--------+
    |         |        |
    v         v        v
 CORRECT   AMBIGUOUS  WRONG
    |         |        |
    v         v        v
 Generate  Supplement  Discard &
 directly  with web    re-retrieve
           search      with reformulated
                       query
```

### 實作

```python
class CorrectiveRAG:
    """Self-correcting RAG pipeline with retrieval quality checks."""

    def __init__(self, max_corrections: int = 2):
        self.max_corrections = max_corrections

    async def answer(self, query: str) -> RAGResponse:
        attempts = 0
        current_query = query
        all_sources = []

        while attempts <= self.max_corrections:
            # Step 1: Retrieve
            chunks = await retrieve(current_query, top_k=10)

            # Step 2: Grade relevance
            grade = await self._grade_relevance(query, chunks)

            if grade.verdict == "correct":
                # High-confidence retrieval, generate directly
                return await self._generate(query, chunks, all_sources)

            elif grade.verdict == "ambiguous":
                # Supplement with additional search
                web_results = await web_search(current_query)
                chunks = self._merge_and_dedupe(chunks, web_results)
                return await self._generate(query, chunks, all_sources)

            else:  # "wrong"
                # Reformulate query and retry
                current_query = await self._reformulate(
                    original_query=query,
                    failed_query=current_query,
                    reason=grade.reason,
                )
                all_sources.extend(chunks)
                attempts += 1

        # Exhausted retries: generate best-effort with disclaimer
        return await self._generate_with_caveat(query, all_sources)

    async def _grade_relevance(
        self, query: str, chunks: list[Chunk]
    ) -> RelevanceGrade:
        """Use LLM to grade whether chunks answer the query."""
        prompt = f"""Given this query and retrieved documents, assess relevance.

Query: {query}

Documents:
{self._format_chunks(chunks)}

Respond with:
- verdict: "correct" (docs clearly answer the query)
- verdict: "ambiguous" (docs partially relevant, need supplementing)
- verdict: "wrong" (docs are irrelevant to the query)
- reason: brief explanation

JSON response:"""

        result = await llm_call(prompt, response_format="json")
        return RelevanceGrade(**json.loads(result))
```

### Self-RAG：評論 token（Critic Tokens）

Self-RAG 用內嵌的評論 token 擴展了這個模式。模型會在每一步評估自己的輸出：

1. **[Retrieve]**：我應該檢索嗎？（是／否）
2. **[Relevant]**：檢索到的資訊相關嗎？（是／否）
3. **[Supported]**：我的答案有受到證據支持嗎？（完全／部分／否）
4. **[Useful]**：這個答案實際上有用嗎？（1-5 分）

只要任一項評論檢查未通過，模型就會迴圈回到較早的步驟。

---
## 自適應檢索

並非每個查詢都能從檢索中獲益。自適應檢索會動態決定是否要檢索、檢索多少，以及從哪些來源檢索。

### 檢索決策樹

```
  User Query
      |
      v
  "Does this query need external knowledge?"
      |
  +---+---+
  |       |
  No      Yes
  |       |
  v       v
Direct   "How complex is the retrieval need?"
 LLM      |
answer  +-+--+---------+
        |    |         |
        v    v         v
     Single Multi    Agentic
      hop   hop      (planning
        |    |       required)
        v    v         |
     1 index 2-3       v
     top-5  indexes  Full agent
             top-10  loop
```

### 查詢複雜度估算器

```python
class AdaptiveRetriever:
    """Decides retrieval strategy based on query characteristics."""

    async def retrieve(self, query: str) -> RetrievalPlan:
        # Fast heuristics first
        if self._is_general_knowledge(query):
            return RetrievalPlan(strategy="none", reason="general knowledge")

        if self._is_simple_lookup(query):
            return RetrievalPlan(
                strategy="single_hop",
                indexes=["primary"],
                top_k=5,
            )

        # LLM-based assessment for ambiguous cases
        plan = await self._plan_retrieval(query)
        return plan

    def _is_general_knowledge(self, query: str) -> bool:
        """Check if query is about widely known facts."""
        general_indicators = [
            "what is", "who is", "define", "explain the concept",
        ]
        has_org_refs = bool(re.search(
            r"(our|my|the company|internal|proprietary)", query.lower()
        ))
        is_general = any(
            query.lower().startswith(g) for g in general_indicators
        )
        return is_general and not has_org_refs

    def _is_simple_lookup(self, query: str) -> bool:
        """Check if query can be answered with a single document."""
        single_hop_patterns = [
            r"what is (the|our) .+ policy",
            r"how (do I|to) .+",
            r"where (can I|do I) find",
        ]
        return any(re.search(p, query.lower()) for p in single_hop_patterns)
```

### 具 Token 預算意識的檢索

依據可用的 token 預算與預期的回應複雜度，來調整檢索投入的力度。

```python
def plan_retrieval_budget(query: str, max_budget_tokens: int = 4000):
    """Allocate token budget across retrieval and generation."""

    complexity = estimate_complexity(query)  # 1-5 scale

    if complexity <= 2:
        # Simple query: small context, save tokens for generation
        return {"context_tokens": 1000, "generation_tokens": 3000, "top_k": 3}
    elif complexity <= 4:
        # Medium: balanced
        return {"context_tokens": 2500, "generation_tokens": 1500, "top_k": 8}
    else:
        # Complex: heavy retrieval, concise generation
        return {"context_tokens": 3500, "generation_tokens": 500, "top_k": 15}
```

---

## 成本最佳化模式

在大規模情境下，RAG 的成本會在嵌入、檢索、重排序與生成各環節層層疊加。未經最佳化的系統，花費可能比實際所需高出 10 到 50 倍。

### 典型 RAG 查詢的成本拆解

```
Component         Cost per Query    % of Total    Optimization
-----------------------------------------------------------------
Embedding         $0.000005         ~1%           Batch + cache
Vector Search     $0.00001          ~2%           Index optimization
Reranking         $0.0001           ~15%          Skip for simple queries
LLM Generation    $0.0005-0.005     ~80%          Model tiering, caching
-----------------------------------------------------------------
Total (naive)     ~$0.001-0.006
Total (optimized) ~$0.0001-0.001    (5-10x reduction)
```

### 分層模型策略

```
                Query Complexity
                Low         Medium        High
             +----------+----------+----------+
 Generation  |  Small   |  Mid     |  Large   |
 Model       |  Model   |  Model   |  Model   |
             | (4o-mini)| (Claude  | (Claude  |
             |          |  Sonnet) |  Opus)   |
             | ~$0.0002 | ~$0.002  | ~$0.02   |
             +----------+----------+----------+

 Reranking   |  Skip    | Lightweight| Cross-  |
             |          | reranker   | encoder |
             +----------+----------+----------+
```

### 漸進式詳細度模式

先以最少的檢索給出答案。只有在使用者提出後續追問，或信心度偏低時，才升級處理力度。

```python
class ProgressiveRAG:
    """Start cheap, escalate only when needed."""

    async def answer(self, query: str, session: Session) -> str:
        # Level 1: Try semantic cache
        cached = await self.cache.get(query)
        if cached:
            return cached.response  # Cost: ~$0

        # Level 2: Fast retrieval + small model
        chunks = await retrieve(query, top_k=3)
        response = await generate(
            query, chunks, model="gpt-4o-mini"
        )

        # Check confidence
        if response.confidence > 0.85:
            await self.cache.put(query, response)
            return response.text  # Cost: ~$0.0003

        # Level 3: Deep retrieval + reranking + larger model
        chunks = await retrieve(query, top_k=15)
        reranked = await rerank(query, chunks, top_k=5)
        response = await generate(
            query, reranked, model="claude-sonnet-4-5"
        )

        if response.confidence > 0.7:
            await self.cache.put(query, response)
            return response.text  # Cost: ~$0.003

        # Level 4: Full agentic pipeline (expensive but thorough)
        return await self.agentic_pipeline.run(query)  # Cost: ~$0.05
```

### 成本防護機制

```python
class CostGuard:
    """Prevent runaway costs in production RAG."""

    def __init__(self):
        self.daily_budget = 500.0  # $500/day
        self.per_query_limit = 0.10  # $0.10 max per query
        self.per_user_hourly = 1.0  # $1/user/hour

    async def check(self, user_id: str, estimated_cost: float) -> bool:
        daily_spent = await self.get_daily_spend()
        if daily_spent + estimated_cost > self.daily_budget:
            raise BudgetExceededError("Daily budget exhausted")

        user_spent = await self.get_user_hourly_spend(user_id)
        if user_spent + estimated_cost > self.per_user_hourly:
            raise RateLimitError("User hourly budget exceeded")

        if estimated_cost > self.per_query_limit:
            # Downgrade to cheaper strategy
            return False  # signals caller to use cheaper path

        return True
```

---

## 失效模式與除錯

生產環境的 RAG 系統具有層層疊加的失效機率。若三個階段各自有 95% 的可靠度，整體可靠度會降至 0.95 x 0.95 x 0.95 = 0.86。理解各種失效模式至關重要。

### RAG 失效模式分類

```
+------------------------------------------------------------------+
|                    RAG Failure Modes                               |
+------------------------------------------------------------------+
|                                                                    |
|  RETRIEVAL FAILURES          GENERATION FAILURES                   |
|  +---------------------+    +-------------------------+           |
|  | Missing documents   |    | Hallucination despite   |           |
|  | (not indexed)       |    | good context            |           |
|  +---------------------+    +-------------------------+           |
|  | Wrong chunks        |    | Ignoring retrieved      |           |
|  | (low precision)     |    | context                 |           |
|  +---------------------+    +-------------------------+           |
|  | Missed chunks       |    | Over-reliance on one    |           |
|  | (low recall)        |    | source                  |           |
|  +---------------------+    +-------------------------+           |
|  | Stale embeddings    |    | Citation fabrication    |           |
|  | (drift)             |    |                         |           |
|  +---------------------+    +-------------------------+           |
|                                                                    |
|  SYSTEM FAILURES             QUALITY FAILURES                      |
|  +---------------------+    +-------------------------+           |
|  | Index unavailable   |    | Chunking artifacts      |           |
|  +---------------------+    +-------------------------+           |
|  | Embedding service   |    | Context window overflow |           |
|  | timeout             |    +-------------------------+           |
|  +---------------------+    | Answer too vague        |           |
|  | Reranker OOM        |    | (over-hedging)          |           |
|  +---------------------+    +-------------------------+           |
|                                                                    |
+------------------------------------------------------------------+
```

### 分塊的 80% 法則

據估計，RAG 的品質問題有 80% 可追溯到分塊決策，而非檢索或生成。常見的分塊失效包括：

- **區塊過小**：流失上下文。「它要價 $200」，到底什麼要價 $200？
- **區塊過大**：稀釋相關性。一個 2000-token 的區塊裡，只有 1 句話是相關的。
- **邊界切割**：一個表格或列表被拆分到兩個區塊裡。
- **缺少中繼資料**：區塊缺乏標頭、文件標題或章節脈絡。

### 除錯檢查清單

```
When RAG quality drops, investigate in this order:

1. RETRIEVAL QUALITY (check first -- most common root cause)
   [ ] Log the query and retrieved chunks side by side
   [ ] Compute retrieval precision@K manually for 20 failing queries
   [ ] Check if relevant documents exist in the index at all
   [ ] Compare BM25 vs vector results -- if BM25 wins, embeddings are stale

2. CHUNKING QUALITY (check second)
   [ ] Sample 50 random chunks -- do they make sense in isolation?
   [ ] Check chunk boundaries for tables, lists, code blocks
   [ ] Verify metadata (title, section, doc_id) is present

3. RERANKING QUALITY (check third)
   [ ] Compare pre-rerank vs post-rerank orderings
   [ ] Check if reranker is pushing relevant results down

4. GENERATION QUALITY (check last)
   [ ] Test with perfect context (manually curated) -- does LLM still fail?
   [ ] Check for context window overflow (truncated chunks)
   [ ] Verify system prompt is not conflicting with retrieved context
```

### 代理式 RAG 的失效模式

代理式 RAG 又引入了三種額外的失效樣態：

1. **檢索抖動（Retrieval Thrash）**：代理反覆檢索，卻無法收斂到一個答案。追蹤紀錄會顯示出幾近重複的查詢與來回擺盪的搜尋詞。修正方式：限制檢索迭代為 3 到 5 次，並追蹤每個工作階段內查詢的唯一性。

2. **工具風暴（Tool Storms）**：代理在單一回合內過度呼叫工具。修正方式：設定每次查詢的工具呼叫上限與成本上限。

3. **上下文膨脹（Context Bloat）**：代理累積過多檢索而來的區塊，導致上下文視窗溢位。修正方式：實作滑動視窗，在上下文超過閾值時捨棄最舊的區塊。

---

## 監控與告警

生產環境的 RAG 需要專屬的監控，而不僅止於標準的應用程式指標。如今約有 60% 的新 RAG 部署從第一天起就納入系統化的評估（相較於早期 RAG 世代「先上線、後評估」的模式，此比例已大幅上升）。

### RAG 監控堆疊

```
+--------------------------------------------------------------------+
|                    RAG Observability Layers                          |
+--------------------------------------------------------------------+
|                                                                      |
|  L1: INFRASTRUCTURE          L2: PIPELINE                           |
|  +----------------------+   +-----------------------------+         |
|  | Latency (p50/p95/p99)|   | Retrieval precision@K      |         |
|  | Error rates          |   | Retrieval recall@K         |         |
|  | Throughput (QPS)     |   | Reranker effectiveness     |         |
|  | Cache hit rate       |   | Chunk utilization rate     |         |
|  | Index size/growth    |   | Context window fill rate   |         |
|  +----------------------+   +-----------------------------+         |
|                                                                      |
|  L3: QUALITY                 L4: BUSINESS                           |
|  +----------------------+   +-----------------------------+         |
|  | Faithfulness score   |   | User satisfaction (thumbs) |         |
|  | Answer relevancy     |   | Task completion rate       |         |
|  | Hallucination rate   |   | Escalation to human rate   |         |
|  | Citation accuracy    |   | Cost per successful query  |         |
|  +----------------------+   +-----------------------------+         |
|                                                                      |
+--------------------------------------------------------------------+
```

### 關鍵指標與告警

| 指標 | 目標 | 告警閾值 | 行動 |
|--------|--------|-----------------|--------|
| **p95 延遲** | <2s | >5s | 擴充檢索基礎設施 |
| **快取命中率** | >40% | <20% | 調校相似度閾值 |
| **檢索 Precision@5** | >0.7 | <0.5 | 重新評估分塊 |
| **忠實度** | >0.9 | <0.8 | 稽核生成提示 |
| **幻覺率** | <5% | >10% | 收緊接地（grounding）提示 |
| **空檢索率** | <2% | >5% | 檢查索引覆蓋範圍 |
| **每次查詢成本** | <$0.005 | >$0.02 | 檢視模型分層 |

### 端到端追蹤記錄

每次查詢都應產生一筆追蹤紀錄，以單一請求 ID 串接起所有管線階段。

```python
@dataclass
class RAGTrace:
    request_id: str
    timestamp: datetime
    query: str
    route: str                    # "simple_rag", "complex_rag", etc.
    cache_hit: bool
    retrieval_latency_ms: float
    chunks_retrieved: int
    chunks_after_rerank: int
    rerank_latency_ms: float
    generation_model: str
    generation_latency_ms: float
    total_latency_ms: float
    input_tokens: int
    output_tokens: int
    estimated_cost: float
    faithfulness_score: float     # 0-1, computed async
    user_feedback: Optional[str]  # thumbs up/down

    def to_dict(self) -> dict:
        return asdict(self)
```

### 自動化品質抽樣

對生產環境查詢的樣本執行離線評估，以便在使用者察覺之前就偵測到品質漂移。

```python
async def nightly_quality_check(sample_size: int = 200):
    """Sample production queries and evaluate RAG quality."""
    traces = await get_recent_traces(limit=sample_size)

    scores = []
    for trace in traces:
        # Re-run the query with evaluation
        eval_result = await evaluate_rag_response(
            query=trace.query,
            response=trace.response,
            retrieved_chunks=trace.chunks,
            metrics=["faithfulness", "relevancy", "context_precision"],
        )
        scores.append(eval_result)

    avg_faithfulness = mean([s.faithfulness for s in scores])
    avg_relevancy = mean([s.relevancy for s in scores])

    if avg_faithfulness < 0.85:
        alert("RAG faithfulness degraded", severity="high")
    if avg_relevancy < 0.70:
        alert("RAG relevancy degraded", severity="medium")

    publish_metrics("rag.nightly.faithfulness", avg_faithfulness)
    publish_metrics("rag.nightly.relevancy", avg_relevancy)
```

---

## 擴展至數百萬份文件

從數千份文件擴展到數百萬份文件，會在索引吞吐量、檢索延遲與索引管理上帶來新的挑戰。

### 擴展維度

```
Documents:   1K  -->  100K  -->  1M  -->  100M
             |        |         |         |
Chunks:      10K      1M        10M       1B
             |        |         |         |
Index Size:  50MB     5GB       50GB      5TB
             |        |         |         |
Strategy:    Single   Single    Sharded   Distributed
             Node     Node +    Index     Cluster +
                      Replicas             Tiered
```

### 大規模的擷取管線

```
  Document Sources
  (S3, DBs, APIs, File Shares)
         |
         v
+-------------------+
| Ingestion Queue   |  (Kafka / SQS)
| - Deduplication   |
| - Priority queue  |
+--------+----------+
         |
    +----+----+----+----+
    |    |    |    |    |     Parallel workers
    v    v    v    v    v
  +--+ +--+ +--+ +--+ +--+
  |W1| |W2| |W3| |W4| |W5|  Parse + Chunk + Embed
  +--+ +--+ +--+ +--+ +--+
    |    |    |    |    |
    +----+----+----+----+
         |
         v
+-------------------+
| Vector DB Cluster |
| (Sharded by       |
|  doc_type or      |
|  tenant_id)       |
+-------------------+
```

### 分片策略

| 策略 | 運作方式 | 優點 | 缺點 |
|----------|-------------|------|------|
| **雜湊式（Hash-based）** | shard = hash(doc_id) % N | 分布均勻 | 需要跨分片查詢 |
| **範圍式（Range-based）** | 依日期範圍分片 | 以時間為基礎的查詢快速 | 分片大小不均 |
| **領域式（Domain-based）** | 依文件類型分片 | 無需跨分片查詢 | 領域之間不平衡 |
| **租戶式（Tenant-based）** | 依 tenant_id 分片 | 完美隔離 | 產生大量小分片 |

### 索引維護

在數百萬份文件的規模下，索引維護會成為攸關營運的關鍵課題。

```python
class IndexMaintenanceScheduler:
    """Scheduled tasks for index health at scale."""

    async def run_daily(self):
        # 1. Detect and re-embed stale documents
        stale_docs = await find_docs_with_old_embeddings(
            older_than_days=90,
            embedding_model_version="v2"  # current is v3
        )
        if stale_docs:
            await enqueue_reembedding(stale_docs)

        # 2. Remove orphaned vectors (doc deleted but vector remains)
        orphans = await find_orphaned_vectors()
        if orphans:
            await delete_vectors(orphans)

        # 3. Compact and optimize indexes
        for shard in await list_shards():
            if shard.fragmentation_pct > 20:
                await compact_shard(shard.id)

        # 4. Verify index health
        for shard in await list_shards():
            health = await check_shard_health(shard.id)
            if not health.ok:
                alert(f"Shard {shard.id} unhealthy: {health.reason}")
```

### 用於檢索的唯讀複本

將讀取與寫入路徑分離，使得擷取作業永遠不會拖累查詢延遲。

```
  Ingestion Pipeline              Query Pipeline
        |                              |
        v                              v
  +-----------+     Replication   +-----------+
  |  Primary  | ----------------> |  Replica  |
  |  (Write)  |                   |  (Read)   |
  +-----------+                   +-----------+
                                  |  Replica  |
                                  |  (Read)   |
                                  +-----------+
                                  |  Replica  |
                                  |  (Read)   |
                                  +-----------+
```

---

## 多租戶 RAG 隔離

多租戶 RAG 是 SaaS 產品最常見的生產環境模式。隔離一旦做錯，就意味著資料會在租戶之間外洩，這是一種嚴重的安全失效。

### 三種隔離模型

```
SILO MODEL (Strongest Isolation)
+----------+  +----------+  +----------+
| Tenant A |  | Tenant B |  | Tenant C |
| +------+ |  | +------+ |  | +------+ |
| |Index | |  | |Index | |  | |Index | |
| +------+ |  | +------+ |  | +------+ |
| |Cache | |  | |Cache | |  | |Cache | |
| +------+ |  | +------+ |  | +------+ |
+----------+  +----------+  +----------+
Cost: $$$$    Best for: Enterprise, Regulated Industries


POOL MODEL (Cost-Efficient)
+-------------------------------------------+
|              Shared Index                  |
|  [A] [B] [A] [C] [B] [A] [C] [B] [C]    |
|                                            |
|  Every query includes:                     |
|  WHERE tenant_id = ? (MANDATORY)           |
+-------------------------------------------+
Cost: $       Best for: SMB SaaS


BRIDGE MODEL (Hybrid)
+----------+  +----------------------------+
| Tenant A |  |     Shared Pool            |
| (Enterprise) | [B] [C] [D] [E] [F] [G]  |
| +------+ |  |                            |
| |Dedicated|  | WHERE tenant_id = ?       |
| |Index | |  +----------------------------+
| +------+ |
+----------+
Cost: $$      Best for: Mixed customer base
```

### 安全性：縱深防禦

```python
class TenantIsolatedRetriever:
    """Enforces tenant isolation at every retrieval layer."""

    async def retrieve(
        self, query: str, tenant_id: str, user_id: str
    ) -> list[Chunk]:
        # Layer 1: Tenant ID is MANDATORY in every query
        if not tenant_id:
            raise SecurityError("tenant_id required for retrieval")

        # Layer 2: Validate user belongs to tenant
        if not await self.authz.user_in_tenant(user_id, tenant_id):
            raise AuthorizationError("User not in tenant")

        # Layer 3: Apply tenant filter at the database level
        chunks = await self.vector_db.search(
            query_embedding=await embed(query),
            filter={"tenant_id": {"$eq": tenant_id}},  # ALWAYS filtered
            top_k=10,
        )

        # Layer 4: Post-retrieval verification
        for chunk in chunks:
            assert chunk.metadata["tenant_id"] == tenant_id, \
                f"Cross-tenant leak detected: {chunk.id}"

        # Layer 5: Audit log
        await self.audit_log.record(
            action="retrieve",
            tenant_id=tenant_id,
            user_id=user_id,
            chunk_ids=[c.id for c in chunks],
        )

        return chunks
```

### 具租戶意識的擷取

租戶脈絡必須在管線的每一個階段都被注入，從擷取一路貫穿到生成。

```
Document Upload (Tenant A)
        |
        v
  +---------------------+
  | Validate Ownership  |  Does this doc belong to Tenant A?
  +---------------------+
        |
        v
  +---------------------+
  | Chunk + Embed       |  Attach tenant_id to every chunk
  +---------------------+
        |
        v
  +---------------------+
  | Index with Metadata |  {"tenant_id": "A", "doc_id": "...", ...}
  +---------------------+
        |
        v
  +---------------------+
  | Invalidate Cache    |  Clear Tenant A's cache entries
  +---------------------+             for affected documents
```

### 防止吵鬧鄰居（Noisy Neighbor）

在 pool 模型中，單一租戶的高用量可能拖累所有租戶的效能。

```python
class TenantRateLimiter:
    """Per-tenant rate limiting and resource quotas."""

    def __init__(self):
        self.tenant_limits = {
            "free":       {"qps": 5,   "daily_queries": 500},
            "pro":        {"qps": 50,  "daily_queries": 10_000},
            "enterprise": {"qps": 200, "daily_queries": 100_000},
        }

    async def check(self, tenant_id: str, tier: str) -> bool:
        limits = self.tenant_limits[tier]

        current_qps = await self.redis.get(f"qps:{tenant_id}")
        if current_qps and int(current_qps) >= limits["qps"]:
            raise RateLimitError(f"QPS limit ({limits['qps']}) exceeded")

        daily_count = await self.redis.get(f"daily:{tenant_id}")
        if daily_count and int(daily_count) >= limits["daily_queries"]:
            raise RateLimitError("Daily query limit exceeded")

        # Increment counters
        pipe = self.redis.pipeline()
        pipe.incr(f"qps:{tenant_id}")
        pipe.expire(f"qps:{tenant_id}", 1)  # 1-second window
        pipe.incr(f"daily:{tenant_id}")
        pipe.expire(f"daily:{tenant_id}", 86400)
        await pipe.execute()

        return True
```

---

## 真實世界架構範例

### 範例 1：客戶支援 RAG

```
+------------------------------------------------------------------+
|                   Customer Support RAG System                     |
+------------------------------------------------------------------+
|                                                                    |
|  Customer Query                                                    |
|       |                                                            |
|       v                                                            |
|  +------------+    +---------+    +------------------+             |
|  | Query      |--->| Semantic|--->| Intent           |             |
|  | Normalizer |    | Cache   |    | Classifier       |             |
|  +------------+    +---------+    +--------+---------+             |
|                     (hit->skip)            |                       |
|                                   +--------+---------+             |
|                                   |                  |             |
|                                   v                  v             |
|                             +-----------+    +-------------+      |
|                             | Knowledge |    | Order/Acct  |      |
|                             | Base RAG  |    | Database    |      |
|                             | (articles,|    | (SQL lookup)|      |
|                             |  FAQs)    |    +-------------+      |
|                             +-----------+           |              |
|                                   |                 |              |
|                                   +--------+--------+              |
|                                            |                       |
|                                            v                       |
|                                   +------------------+             |
|                                   | Response Gen     |             |
|                                   | (with citations  |             |
|                                   |  + confidence)   |             |
|                                   +--------+---------+             |
|                                            |                       |
|                                   +--------+---------+             |
|                                   |                  |             |
|                                   v                  v             |
|                            confidence > 0.8    confidence < 0.8   |
|                            Auto-respond        Route to human      |
|                                                                    |
+------------------------------------------------------------------+

Scale: 50K articles, 2M customer interactions/month
Latency SLA: p95 < 3s
Cache hit rate: ~45%
Auto-resolution rate: ~60%
```

### 範例 2：企業知識平台

```
+------------------------------------------------------------------+
|              Enterprise Multi-Tenant Knowledge Platform            |
+------------------------------------------------------------------+
|                                                                    |
|  +------------------+                                              |
|  | Auth + Tenant    |                                              |
|  | Resolution       |                                              |
|  +--------+---------+                                              |
|           |                                                        |
|           v                                                        |
|  +------------------+                                              |
|  | Query Router     |                                              |
|  +--+----+----+-----+                                              |
|     |    |    |                                                     |
|     v    v    v                                                     |
|  +----+ +----+ +--------+                                          |
|  |Docs| |Wiki| |Tickets |  Per-domain indexes                     |
|  |Idx | |Idx | |Idx     |  (all tenant-filtered)                   |
|  +----+ +----+ +--------+                                          |
|     |    |    |                                                     |
|     +----+----+                                                     |
|          |                                                          |
|          v                                                          |
|  +------------------+                                              |
|  | Cross-Encoder    |                                              |
|  | Reranker         |                                              |
|  +--------+---------+                                              |
|           |                                                        |
|           v                                                        |
|  +------------------+     +-------------------+                    |
|  | Tiered LLM       |<--->| Permission Filter |                    |
|  | Generation        |     | (doc-level ACLs)  |                    |
|  +------------------+     +-------------------+                    |
|           |                                                        |
|           v                                                        |
|  +------------------+                                              |
|  | Response + Audit |                                              |
|  | Trail            |                                              |
|  +------------------+                                              |
|                                                                    |
+------------------------------------------------------------------+

Scale: 200 tenants, 10M documents total, 500K queries/day
Isolation: Bridge model (5 enterprise silos + shared pool)
Ingestion: Async via Kafka, ~50K docs/day
```

### 範例 3：法律文件分析

```
  User: "Summarize indemnification clauses across all vendor contracts"
      |
      v
  +---------------------+
  | Agentic RAG Planner |
  +---------------------+
      |
      | Plan: 1. Find all vendor contracts
      |        2. Extract indemnification clauses
      |        3. Synthesize comparison
      |
      v
  +---------------------+    +-------------------+
  | Step 1: Metadata    |--->| Filter: doc_type  |
  | Search              |    | = "vendor_contract"|
  +---------------------+    +-------------------+
      |                            |
      | 47 contracts found         |
      v                            v
  +---------------------+    +-------------------+
  | Step 2: Section     |--->| Filter: section   |
  | Retrieval           |    | = "indemnification"|
  +---------------------+    +-------------------+
      |                            |
      | 43 relevant sections       |
      v                            |
  +---------------------+         |
  | Step 3: Long Context|<--------+
  | Synthesis           |
  | (load 43 sections   |
  |  into 1M context)   |
  +---------------------+
      |
      v
  Comparative summary with
  per-contract citations
```

---

## 系統設計面試切入點

### 問：設計一個 RAG 系統，能在 500 個租戶之間每秒服務 10,000 筆查詢，且 p99 延遲為 2 秒。

**強力答案：**

我會把它設計成四層。

**第 1 層：路由與快取。** 由查詢路由器對每筆進來的查詢進行分類（直接 LLM、簡單 RAG、複雜 RAG）。三層快取（精確比對、語意快取、文件快取）大約能處理 40-50% 的流量。這意味著實際打進檢索管線的只有 5,000-6,000 QPS。

**第 2 層：檢索。** 我會採用橋接隔離模型，前 20 大企業租戶取得各自專屬的索引（silo），其餘 480 個則共用一個池化索引，並強制以 tenant_id 過濾。檢索以並行方式執行混合搜尋（vector + BM25），再用 Reciprocal Rank Fusion 合併結果。向量資料庫叢集依租戶層級分片（sharded），並進行複本（replicated）以提升讀取吞吐量。

**第 3 層：生成。** 採用分層模型策略，把簡單查詢導向小型模型、複雜查詢導向較大型模型。這能在維持困難查詢品質的同時，壓低平均成本。每租戶的速率限制可避免吵雜鄰居（noisy neighbors）問題。

**第 4 層：可觀測性。** 每筆查詢都會產生一條 trace，內含延遲分解、檢索分數與成本。每晚的品質檢查會抽樣 500 筆查詢，評估忠實度（faithfulness）與相關性（relevancy）。若 p95 延遲超過 3 秒，或忠實度跌破 0.85，就會觸發警報。

**成本估算**：在 10K QPS 下，假設有 50% 的快取命中率，且小型/大型模型為 70/30 的比例分配，每日生成成本大約落在 $2,000-5,000，再加上 $500-1,000 的基礎設施成本。

### 問：當 RAG 系統檢索到不相關的文件，但 LLM 仍然生成出聽起來很合理的答案，你要如何處理這種情況？

**強力答案：**

這是最危險的 RAG 失效模式，因為它會產生那種聽起來很有自信、卻是建立在真實（但不相關）文件上的幻覺。我會從三個環節著手處理：

第一，在檢索階段實作一個相關性評分器（relevance grader），也就是一個分類器（或一次 LLM 呼叫），針對查詢替每個檢索到的區塊評分。如果所有區塊的分數都低於門檻，系統應該要嘛升級為網路搜尋（Corrective RAG 模式），要嘛回覆「我沒有足夠的資訊」，而不是從薄弱的上下文硬生成。

第二，在生成階段使用受約束的提示（constrained prompting），指示模型在證據不足時明確說明。在輸出中納入一個信心分數，並把低信心的答案導向人工審查。

第三，在監控方面，追蹤檢索分數與使用者回饋之間的相關性。如果使用者在檢索分數很高的查詢上卻給了倒讚，那麼重排序器或分塊策略很可能就是根本原因。記錄完整的 trace（查詢、檢索到的區塊、生成的答案、使用者回饋），這樣你才能除錯特定的失效案例。

### 問：你的 RAG 系統成本在上個月翻了三倍，但查詢量並沒有增加。你要如何診斷並修復？

**強力答案：**

我會依以下順序調查：

第一，檢查**快取命中率**。如果它下降了，就代表有更多查詢打進了完整管線。常見原因包括：語意快取門檻被改動、資料更新後快取失效（invalidation）執行得過於激進，或是查詢分布出現變化、與已快取的查詢不再相符。

第二，檢查**模型路由分布**。如果查詢分類器把更多查詢導向昂貴的大型模型，光是這一點就足以讓成本翻三倍。看看是查詢複雜度發生了變化，還是分類器的行為已經漂移（drifted）。

第三，檢查代理式 RAG 路徑中的**檢索抖動（retrieval thrash）**。如果 Corrective RAG 迴圈重試得更頻繁（可能是因為嵌入過時，或檢索品質劣化），每筆查詢就會發出多次檢索與生成呼叫。trace 日誌會顯示每筆查詢的平均迭代次數。

第四，檢查**嵌入管線**。如果文件被不必要地重新嵌入（重複攝取、沒有去重），嵌入成本就會飆升。

修復方式取決於根本原因，但常見的處置手段有：調整語意快取門檻、對每筆查詢實作成本上限以強制走較便宜的後備路徑、修正嵌入過時問題以減少校正性檢索迴圈，以及在攝取管線中加入去重機制。

---

## 參考資料

- Asai et al. "Self-RAG: Learning to Retrieve, Generate, and Critique" (2024)
- Yan et al. "Corrective Retrieval Augmented Generation (CRAG)" (2024)
- Shi et al. "RAGRouter: Learning to Route Queries to Multiple RAL Models" (2025)
- Redis. "RAG at Scale: How to Build Production AI Systems in 2026"
- Anthropic. "1M Token Context Window General Availability" (March 2026)
- RAGAS Framework. "Context Precision, Recall, Faithfulness, and Relevancy Metrics"
- AWS. "Multi-Tenant RAG with Amazon Bedrock Knowledge Bases" (2025)
- Microsoft. "Design a Secure Multitenant RAG Inferencing Solution" (2025)

---

*下一篇：[Data Engineering for AI](15-data-engineering-for-ai.md)*
