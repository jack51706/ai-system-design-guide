# 案例研究：企業級 RAG 系統

本案例研究將完整走過如何為企業文件搜尋設計一套生產環境的 RAG 系統。內容涵蓋需求蒐集、架構決策與實作細節。

## 目錄

- [問題陳述](#problem-statement)
- [需求分析](#requirements-analysis)
- [系統架構](#system-architecture)
- [元件深入剖析](#component-deep-dives)
- [擴展考量](#scaling-considerations)
- [成本分析](#cost-analysis)
- [經驗教訓](#lessons-learned)
- [面試演練](#interview-walkthrough)

---

## 問題陳述

### 情境

一家金融服務公司想為其內部文件打造一套 AI 驅動的搜尋系統：
- 500,000 份文件（政策、流程、研究報告）
- 跨多個部門的 5,000 名員工
- 文件每日更新
- 嚴格的合規與稽核要求
- 需要以附帶引用來源的方式回答問題

### 目前的痛點

- 員工每天花 2 小時以上搜尋資訊
- 關鍵字搜尋回傳太多不相關的結果
- 知識被各部門各自孤立
- 新進員工要花上數個月才能上手產出成果

---

## 需求分析

### 功能性需求

| 需求 | 優先級 | 備註 |
|-------------|----------|-------|
| 自然語言問答 | P0 | 核心功能 |
| 來源引用 | P0 | 合規要求 |
| 多文件推理 | P1 | 跨文件串接資訊 |
| 後續追問 | P1 | 對話式上下文 |
| 文件摘要 | P2 | 快速概覽長篇文件 |

### 非功能性需求

| 需求 | 目標 | 理由 |
|-------------|--------|-----------|
| 延遲（P95） | < 5 秒 | 使用者體驗 |
| 準確度 | > 90% | 信任與採用度 |
| 可用性 | 99.9% | 業務關鍵 |
| 同時上線使用者 | 500 | 尖峰使用量 |
| 文件新鮮度 | < 1 小時 | 政策更新 |

### 安全性需求

- 角色式存取控制（RBAC）
- 所有查詢的稽核紀錄
- 資料不離開公司網路
- PII 偵測與處理

---

## 系統架構

### 高階架構

```mermaid
flowchart TD
    UI["使用者介面<br/>(Web App, Slack Bot, API)"]
    GW["API Gateway<br/>驗證 / 速率限制 / 請求路由"]
    QS["查詢服務<br/>查詢理解 / 權限檢查 / 編排"]

    UI --> GW --> QS

    QS --> RS["檢索服務<br/>混合搜尋 / 過濾"]
    QS --> RR["重排序服務<br/>Cross-encoder / 評分"]
    QS --> GS["生成服務<br/>LLM / 提示組裝"]

    subgraph DATA["資料層"]
        VDB["Vector DB<br/>(Qdrant)"]
        ES["搜尋索引<br/>(Elastic)"]
        DOC["文件儲存<br/>(S3)"]
        META["中繼資料<br/>(Postgres)"]
    end

    RS --> DATA

    subgraph INGEST["匯入管線"]
        ING["文件上傳 --> 解析 --> 分塊 --> 嵌入 --> 索引 --> 儲存中繼資料"]
    end
```

以流程圖呈現（分層的系統先在查詢管線中扇出，再經由資料層匯聚）：

```mermaid
flowchart TD
    UI[使用者介面<br/>Web / Slack / API]
    GW[API Gateway<br/>驗證 + 速率限制]
    QS[查詢服務<br/>權限 + 編排]

    UI --> GW --> QS

    subgraph PIPELINE[查詢管線]
        RS[檢索<br/>混合搜尋]
        RR[重排序器<br/>Cross-encoder]
        GS[生成<br/>Gemini 3 Pro]
        RS --> RR --> GS
    end

    QS --> PIPELINE

    subgraph DATA[資料層]
        VDB[(向量資料庫)]
        ES[(搜尋索引)]
        DOC[(文件儲存)]
        META[(中繼資料)]
    end

    RS -.語意.-> VDB
    RS -.關鍵字.-> ES
    GS -.全文.-> DOC
    QS -.acl.-> META

    GS --> UI
```

### 技術選型（2025 年 12 月更新）

| 元件 | 選擇 | 理由 |
|-----------|--------|-----------|
| **主要 LLM** | Gemini 3.0 Pro | **2.5M 上下文** 可原生處理 100 份以上文件而不需切碎 |
| **代理式 LLM** | GPT-5.2 | 業界領先的工具使用準確度，適合複雜的跨文件分析 |
| **檢索器** | Gemini 3 Flash | 在龐大上下文視窗上進行低成本檢索 |
| **嵌入** | text-embedding-3-large | 品質經過驗證且成本效益高 |
| **向量資料庫** | Qdrant（自架） | 效能、過濾能力，以及地端合規 |
| **重排序器** | BGE-Reranker-v2-X | 開源 SoTA，適合地端隔離 |

> [!NOTE]
> **轉變：** 生產團隊已從「小區塊 RAG」轉向 **「平衡上下文 RAG」**。在每個主要前沿模型都具備 1M 至 2M token 上下文的情況下，我們不再需要找出「完美的 512-token 區塊」。我們改為檢索整段文件片段（10k 至 50k token），讓模型原生的注意力機制去處理那根針。

---

## 元件深入剖析

### 文件匯入管線

```python
class IngestionPipeline:
    def __init__(self):
        self.parser = DocumentParser()
        self.chunker = SemanticChunker(
            chunk_size=512,
            chunk_overlap=50
        )
        self.embedder = OpenAIEmbedder(model="text-embedding-3-large")
        self.vector_db = QdrantClient()
        self.metadata_db = PostgresClient()
    
    async def ingest(self, document: Document, user_context: UserContext):
        # 1. Parse document
        parsed = self.parser.parse(document)
        
        # 2. Extract metadata
        metadata = self.extract_metadata(parsed, document)
        
        # 3. Chunk
        chunks = self.chunker.chunk(parsed.text)
        
        # 4. Generate embeddings (batch)
        embeddings = await self.embedder.embed_batch([c.text for c in chunks])
        
        # 5. Store in vector DB with metadata
        points = [
            {
                "id": f"{document.id}_{i}",
                "vector": embedding,
                "payload": {
                    "document_id": document.id,
                    "chunk_index": i,
                    "text": chunk.text,
                    "department": metadata.department,
                    "access_level": metadata.access_level,
                    "created_at": metadata.created_at.isoformat()
                }
            }
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings))
        ]
        
        await self.vector_db.upsert(collection="documents", points=points)
        
        # 6. Store full document
        await self.doc_store.put(document.id, parsed.text)
        
        # 7. Store metadata
        await self.metadata_db.insert_document(document.id, metadata)
        
        # 8. Index in Elasticsearch for keyword search
        await self.es_client.index(
            index="documents",
            id=document.id,
            body={"text": parsed.text, **metadata.to_dict()}
        )
```

這段程式碼讀起來像是線性的順序，但其中四個寫入是平行進行的。用一張時序圖能讓這個扇出變得明確，這對於理解部分失敗的情況很重要：

```mermaid
sequenceDiagram
    participant U as 上傳事件
    participant P as 解析器
    participant C as 分塊器
    participant E as 嵌入器
    participant V as 向量資料庫
    participant S as 搜尋索引
    participant D as 文件儲存
    participant M as 中繼資料資料庫

    U->>P: 文件
    P->>C: 解析後文字 + 中繼資料
    C->>E: 區塊
    par 平行寫入
        E->>V: 區塊向量 + payload
        P->>S: 全文 + 中繼資料
        P->>D: 完整文件 blob
        P->>M: 文件中繼資料 + ACL
    end
    Note over V,M: 文件只有在四個寫入<br/>全部提交後才可被查詢
```

### 查詢處理

```python
class QueryService:
    def __init__(self):
        self.retriever = HybridRetriever()
        self.reranker = CohereReranker()
        self.generator = LLMGenerator()
        self.guardrails = GuardrailPipeline()
    
    async def process_query(
        self,
        query: str,
        user_context: UserContext,
        conversation_history: list[Message] = None
    ) -> QueryResponse:
        
        # 1. Input guardrails
        guardrail_result = self.guardrails.check_input(query)
        if not guardrail_result.passed:
            return QueryResponse(
                answer="I cannot help with that request.",
                blocked=True,
                reason=guardrail_result.reason
            )
        
        # 2. Query understanding (optional: rewrite query)
        processed_query = await self.understand_query(query, conversation_history)
        
        # 3. Retrieve candidates with permission filtering
        candidates = await self.retriever.search(
            query=processed_query,
            filters=self.build_permission_filter(user_context),
            top_k=50
        )
        
        # 4. Rerank
        reranked = await self.reranker.rerank(
            query=processed_query,
            documents=candidates,
            top_k=10
        )
        
        # 5. Build context
        context = self.build_context(reranked)
        
        # 6. Generate answer
        answer = await self.generator.generate(
            query=query,
            context=context,
            conversation_history=conversation_history
        )
        
        # 7. Output guardrails
        guardrail_result = self.guardrails.check_output(answer, context)
        if not guardrail_result.passed:
            answer = self.fallback_response()
        
        # 8. Build response with citations
        return QueryResponse(
            answer=answer,
            sources=[self.format_source(doc) for doc in reranked[:5]],
            confidence=self.calculate_confidence(reranked)
        )
    
    def build_permission_filter(self, user_context: UserContext) -> dict:
        return {
            "should": [
                {"key": "access_level", "match": {"value": "public"}},
                {"key": "department", "match": {"value": user_context.department}},
                {"key": "access_list", "match": {"any": [user_context.user_id]}}
            ]
        }
```

### 混合檢索

```python
class HybridRetriever:
    def __init__(self, vector_weight: float = 0.7, keyword_weight: float = 0.3):
        self.vector_db = QdrantClient()
        self.es_client = ElasticsearchClient()
        self.embedder = OpenAIEmbedder()
        self.vector_weight = vector_weight
        self.keyword_weight = keyword_weight
    
    async def search(
        self,
        query: str,
        filters: dict,
        top_k: int = 50
    ) -> list[Document]:
        
        # Parallel retrieval
        vector_results, keyword_results = await asyncio.gather(
            self.vector_search(query, filters, top_k * 2),
            self.keyword_search(query, filters, top_k * 2)
        )
        
        # Reciprocal Rank Fusion
        fused = self.rrf_fusion(
            [vector_results, keyword_results],
            weights=[self.vector_weight, self.keyword_weight],
            k=60
        )
        
        return fused[:top_k]
    
    async def vector_search(self, query: str, filters: dict, top_k: int):
        query_embedding = await self.embedder.embed(query)
        
        results = await self.vector_db.search(
            collection="documents",
            query_vector=query_embedding,
            query_filter=filters,
            limit=top_k
        )
        
        return [
            Document(
                id=r.payload["document_id"],
                chunk_id=r.id,
                text=r.payload["text"],
                score=r.score,
                metadata=r.payload
            )
            for r in results
        ]
    
    def rrf_fusion(self, result_lists: list, weights: list, k: int = 60) -> list:
        scores = defaultdict(float)
        docs = {}
        
        for results, weight in zip(result_lists, weights):
            for rank, doc in enumerate(results):
                rrf_score = weight / (k + rank + 1)
                scores[doc.chunk_id] += rrf_score
                docs[doc.chunk_id] = doc
        
        sorted_ids = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)
        return [docs[id] for id in sorted_ids]
```

一眼看懂混合檢索流程。兩個平行的檢索器，接著由 RRF 以加權排名將它們融合，然後一個 cross-encoder 在格式化上下文前對最頂端的候選項目進行重排序：

```mermaid
flowchart LR
    Q[使用者查詢] --> EMB[嵌入查詢]
    Q --> KW[擷取關鍵字]

    EMB --> VS[向量搜尋<br/>top 100]
    KW --> KS[關鍵字搜尋<br/>BM25 top 100]

    VS --> RRF[Reciprocal Rank Fusion<br/>0.7 語意 / 0.3 關鍵字]
    KS --> RRF

    RRF --> RR[Cross-Encoder 重排序<br/>top 50 至 top 10]
    RR --> CTX[上下文格式化<br/>附引用]
    CTX --> LLM[生成<br/>Gemini 3 Pro 2.5M ctx]
```

### 以龐大上下文進行生成（2025 年 12 月）

```python
class GeminiGenerator:
    def __init__(self):
        self.client = genai.GenerativeModel("gemini-3.0-pro")
    
    async def generate(
        self,
        query: str,
        context_docs: list[Document],
        conversation_history: list[Message] = None
    ) -> str:
        # 2.5M context allows passing ENTIRE documents, not just snippets
        system_instruction = """
        You are an enterprise knowledge assistant. 
        Analyze the provided documents to answer the query accurately.
        Cite every claim using [[DocName:PageNumber]] format.
        """
        
        contents = [{"text": doc.text} for doc in context_docs]
        contents.append({"text": f"User Query: {query}"})
        
        response = await self.client.generate_content_async(
            contents,
            generation_config=genai.types.GenerationConfig(temperature=0.0)
        )
        return response.text
```

> [!TIP]
> **生產環境的選擇 vs. 最前沿技術**
> 雖然 Gemini 3.1 Pro 提供 1M-token 視窗，許多生產系統仍以 **Claude Sonnet 4.6** 或 **GPT-5.5** 作為其主要生成器的預設選項。
> 
> **為什麼？**
> - **成熟度**：12 個月以上的生產實戰紀錄。
> - **可預測性**：已知的延遲模式，以及在長尾請求上較少出現「幻覺尖峰」。
> - **SDK 穩定度**：與 LangGraph 和 LlamaIndex 等框架深度整合。
> - **成本**：針對高流量的標準 RAG 進行了價格最佳化。

---

## 擴展考量

### 處理 500K 份文件

```python
# Sharding strategy for Qdrant
qdrant_config = {
    "collection": "documents",
    "vectors": {
        "size": 3072,  # text-embedding-3-large
        "distance": "Cosine"
    },
    "optimizers": {
        "indexing_threshold": 20000  # Build index after 20K points
    },
    "replication_factor": 2,  # High availability
    "shard_number": 4  # Distribute across nodes
}
```

### 處理 500 名同時上線使用者

```mermaid
flowchart TD
    LB["負載平衡器"]
    R1["查詢服務（replica 1）"]
    R2["查詢服務（replica 2）"]
    R3["查詢服務（replica 3）"]
    R4["查詢服務（replica 4）"]

    LB --> R1
    LB --> R2
    LB --> R3
    LB --> R4

    VDB["Vector DB（3 節點叢集）"]
    LLM["LLM API（含重試/備援）"]
    ES["Elasticsearch（3 節點叢集）"]

    R1 --> VDB
    R2 --> VDB
    R3 --> VDB
    R4 --> VDB
    R1 --> LLM
    R2 --> LLM
    R3 --> LLM
    R4 --> LLM
    R1 --> ES
    R2 --> ES
    R3 --> ES
    R4 --> ES
```

### 快取策略

```python
class QueryCache:
    def __init__(self):
        self.exact_cache = Redis(ttl=3600)  # 1 hour
        self.semantic_cache = SemanticCache(threshold=0.95, ttl=1800)
    
    async def get_or_compute(self, query: str, user_context: UserContext) -> QueryResponse:
        # Check exact cache
        cache_key = self.make_key(query, user_context.permissions)
        cached = await self.exact_cache.get(cache_key)
        if cached:
            return cached
        
        # Check semantic cache
        similar = await self.semantic_cache.find_similar(query, user_context.permissions)
        if similar:
            return similar
        
        # Compute
        response = await self.query_service.process_query(query, user_context)
        
        # Cache result
        await self.exact_cache.set(cache_key, response)
        await self.semantic_cache.add(query, user_context.permissions, response)
        
        return response
```

---

## 成本分析

### 每月成本估算（500 名使用者，每名使用者每天 100 次查詢）

| 元件 | 計算方式 | 每月成本 |
|-----------|-------------|--------------|
| LLM（Claude Sonnet） | 1.5M 次查詢 × 2K token × $3/1M 輸入 + 500 token × $15/1M 輸出 | ~$20,250 |
| 嵌入 | 1.5M 次查詢 × $0.13/1M | ~$200 |
| 重排序（Cohere） | 1.5M × 50 份文件 × $0.001/1K | ~$75 |
| 向量資料庫（Qdrant Cloud） | 3 節點叢集 | ~$1,500 |
| Elasticsearch | 3 節點叢集 | ~$2,000 |
| 運算（查詢服務） | 4 個執行個體 | ~$1,000 |
| **總計** | | **~$25,000/月** |

### 成本最佳化機會

1. **快取**：30% 快取命中率 → 在 LLM 上節省 $6K
2. **模型路由**：將簡單查詢導向較便宜的模型 → 節省 40%
3. **批次嵌入**：使用非同步批次處理 → 節省 20%
4. **自架重排序器**：以開源方案取代 Cohere → 省下 $75

---

## 經驗教訓

### 哪些做得好

1. **混合搜尋**：結合語意 + 關鍵字大幅提升了召回率
2. **重排序**：top-5 精確度提升了 15%
3. **清楚的引用**：建立了使用者的信任
4. **在檢索階段就做權限過濾**：不需要事後再過濾

### 遇到的挑戰

1. **表格擷取**：含有複雜表格的 PDF 需要客製化的解析
2. **縮寫**：領域專屬的縮寫需要展開
3. **新鮮度**：1 小時的新鮮度要求需要串流式匯入
4. **長篇文件**：100 頁以上的文件需要階層式分塊

### 如果重來會有哪些不同做法

1. 更早就從更好的文件解析開始著手
2. 在擴展之前先建好評估管線
3. 從第一天就實作查詢紀錄
4. 更早與使用者建立回饋循環

---

## 面試演練

### 如何在面試中呈現這套設計

**開場（2 分鐘）：**
「我將設計一套用於內部文件搜尋的企業級 RAG 系統。讓我先釐清幾項需求……」

**需求（3 分鐘）：**
- 詢問規模、延遲、準確度目標
- 釐清安全性需求
- 了解文件類型與更新頻率

**高階設計（5 分鐘）：**
- 畫出架構圖
- 解釋關鍵元件
- 為技術選型提出理由

**深入剖析（10 分鐘）：**
- 檢索策略（混合搜尋，以及為什麼）
- 安全性（在查詢時進行權限過濾）
- 生成（提示工程、引用）
- 擴展（分片、快取、副本）

**取捨（5 分鐘）：**
- 成本 vs 延遲（模型選擇）
- 準確度 vs 延遲（重排序會增加時間）
- 新鮮度 vs 成本（串流 vs 批次）

**監控（2 分鐘）：**
- 關鍵指標（延遲、準確度、使用者回饋）
- 如何偵測問題
- 持續改善循環

---

*下一篇：[案例研究：對話式 AI 代理](02-conversational-agent.md)*
