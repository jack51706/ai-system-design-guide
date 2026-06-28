# AI 系統設計白板練習

本章提供 AI 相關面試中常見系統設計練習的詳細演練。每個練習都包含完整的問題描述、結構化的解題方法，以及能區分出優秀候選人的討論要點。

## 目錄

- [練習 1：企業級 RAG 系統](#exercise-1-enterprise-rag-system)
- [練習 2：客戶支援聊天機器人](#exercise-2-customer-support-chatbot)
- [練習 3：程式碼審查助手](#exercise-3-code-review-assistant)
- [練習 4：文件處理管線](#exercise-4-document-processing-pipeline)
- [練習 5：即時內容審核](#exercise-5-real-time-content-moderation)
- [練習 6：多租戶 AI 平台](#exercise-6-multi-tenant-ai-platform)
- [練習 7：大規模語意搜尋](#exercise-7-semantic-search-at-scale)
- [練習 8：生產環境 LLM 產品的評估管線](#exercise-8-evaluation-pipeline-for-a-production-llm-product) ⭐ *NEW*
- [練習 9：長時間運行代理的記憶與狀態](#exercise-9-memory-and-state-for-a-long-running-agent) ⭐ *NEW*
- [白板練習小技巧](#tips-for-whiteboard-exercises)

---

## 練習 1：企業級 RAG 系統

### 問題描述

為一家大型企業設計一套基於 RAG 的知識助手，需求如下：

- 來自多個來源的 1,000 萬份文件（SharePoint、Confluence、Google Drive、內部 wiki）
- 50,000 名員工，採用角色式存取控制
- 文件持續更新
- 必須在查詢時遵守文件權限
- 95% 的查詢回應時間低於 3 秒
- 支援多種語言（英文、西班牙文、中文）

### 時間分配（35 分鐘）

| 階段 | 時間 | 重點 |
|-------|------|-------|
| 釐清需求 | 3 分鐘 | 範圍、優先順序、限制 |
| 高階架構 | 7 分鐘 | 元件與資料流 |
| 資料管線 | 8 分鐘 | 攝取、分塊、建立索引 |
| 查詢管線 | 8 分鐘 | 檢索、生成、權限 |
| 可靠性與擴展 | 5 分鐘 | 故障處理、擴展 |
| 評估 | 4 分鐘 | 指標與監控 |

### 解題演練

#### 釐清問題

```
1. What is the document size distribution? (PDFs, wikis, code?)
2. How often do permissions change? (Impacts caching strategy)
3. Is conversation history required or single-turn Q&A?
4. What is the accuracy bar? (Can we say "I don't know"?)
5. Are there compliance requirements? (Audit, data residency)
```

#### 高階架構

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATA PLANE                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────────┐│
│  │   Connectors │───▶│   Processor  │───▶│       Vector Database        ││
│  │ (SP,GD,Conf) │    │ (chunk,embed)│    │  (Pinecone/Qdrant/Weaviate)  ││
│  └──────────────┘    └──────────────┘    └──────────────────────────────┘│
│                                                      ▲                   │
│                                                      │ sync              │
│  ┌──────────────────────────────────────────────────┼───────────────────┐│
│  │                    Permission Service            │                   ││
│  └──────────────────────────────────────────────────┼───────────────────┘│
└─────────────────────────────────────────────────────┼───────────────────┘
                                                      │
┌─────────────────────────────────────────────────────┼───────────────────┐
│                          QUERY PLANE                │                   │
│  ┌──────────────┐    ┌──────────────┐    ┌─────────┴──────┐             │
│  │    User      │───▶│  Query API   │───▶│   Retriever    │             │
│  │  Interface   │    │              │    │ (+ perm filter)│             │
│  └──────────────┘    └──────────────┘    └────────┬───────┘             │
│                             │                      │                     │
│                             ▼                      ▼                     │
│                      ┌──────────────┐    ┌──────────────┐               │
│                      │   Reranker   │◀───│   Chunks     │               │
│                      └──────┬───────┘    └──────────────┘               │
│                             │                                            │
│                             ▼                                            │
│                      ┌──────────────┐    ┌──────────────┐               │
│                      │  Generator   │───▶│   Response   │               │
│                      │    (LLM)     │    │  + Citations │               │
│                      └──────────────┘    └──────────────┘               │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 資料管線深入剖析

**1. 連接器（Connectors）：**
```
Each source has a dedicated connector:
- SharePoint: Graph API with delta sync
- Confluence: REST API with webhooks
- Google Drive: Drive API with push notifications

Connector responsibilities:
- Fetch document content and metadata
- Track change events (create, update, delete)
- Extract permissions from source system
- Normalize to common document schema
```

**2. 文件結構描述（Document Schema）：**
```json
{
  "doc_id": "uuid",
  "source": "sharepoint|confluence|gdrive",
  "source_id": "original_id_in_source",
  "title": "string",
  "content": "string",
  "content_type": "pdf|html|docx|md",
  "language": "en|es|zh",
  "permissions": {
    "users": ["user_id_1", "user_id_2"],
    "groups": ["group_id_1"],
    "visibility": "private|internal|public"
  },
  "metadata": {
    "author": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "path": "folder/path"
  }
}
```

**3. 分塊策略：**
```
Given mixed document types, use adaptive chunking:

- Markdown/HTML: Semantic chunking by headers
- PDFs: Layout-aware chunking using document AI
- Wiki pages: Section-based chunking

Chunk parameters:
- Target size: 512 tokens
- Overlap: 50 tokens
- Preserve: headers, tables, code blocks

Each chunk inherits parent document permissions.
```

**4. 嵌入（Embedding）：**
```
Multilingual requirement suggests:
- Model: Cohere embed-v3 (multilingual, good quality)
- Alternative: OpenAI text-embedding-3-large

Batch embedding:
- Process in batches of 100 chunks
- Rate limit handling with exponential backoff
- Store embedding with chunk in vector DB
```

**5. 向量資料庫選擇：**
```
Pinecone or Qdrant for this scale.

Selection criteria:
- Metadata filtering: Critical for permissions
- Scale: 10M docs × 5 chunks = 50M vectors
- Hybrid search: Needed for keyword queries

Schema:
- Vector: embedding
- Metadata: doc_id, chunk_id, language, permissions, source
```

#### 查詢管線深入剖析

**1. 權限解析：**
```python
def get_user_permissions(user_id: str) -> PermissionSet:
    """
    Resolve all documents user can access.
    Returns set of:
    - Direct user grants
    - Group memberships expanded
    - Public document access
    
    CACHED with 5-minute TTL since permissions change infrequently.
    """
    cache_key = f"permissions:{user_id}"
    if cached := cache.get(cache_key):
        return cached
    
    perms = permission_service.resolve(user_id)
    cache.set(cache_key, perms, ttl=300)
    return perms
```

**2. 帶過濾的檢索：**
```python
def retrieve(query: str, user_id: str, top_k: int = 20) -> List[Chunk]:
    perms = get_user_permissions(user_id)
    
    # Detect language for query
    lang = detect_language(query)
    
    # Build permission filter
    # User can see: public docs, their own, or groups they belong to
    filter = {
        "$or": [
            {"visibility": "public"},
            {"users": {"$in": [user_id]}},
            {"groups": {"$in": perms.groups}}
        ]
    }
    
    # Optional: boost same-language content
    if lang != "en":
        filter["language"] = lang
    
    results = vector_db.search(
        query_embedding=embed(query),
        top_k=top_k,
        filter=filter
    )
    return results
```

**3. 重排序（Reranking）：**
```
Rerank top-20 to get top-5 with cross-encoder.
Model: bge-reranker-v2-m3 (multilingual)
Latency budget: ~100ms
```

**4. 生成：**
```python
def generate(query: str, chunks: List[Chunk], user_id: str) -> Response:
    context = format_chunks_with_citations(chunks)
    
    prompt = f"""You are a knowledge assistant for [Company].
Answer the question using ONLY the provided context.
If the context does not contain the answer, say "I could not find information about that in our knowledge base."
Always cite sources using [1], [2] format.

CONTEXT:
{context}

QUESTION: {query}
"""
    
    response = llm.generate(
        prompt=prompt,
        model="gpt-4o",
        temperature=0.1
    )
    
    return format_with_source_links(response, chunks)
```

#### 擴展與可靠性

**延遲預算（p95 < 3 秒）：**
```
Permission resolution:   50ms  (cached)
Embedding:              100ms
Vector search:          100ms
Reranking:              150ms
LLM generation:        1500ms
Network/overhead:       100ms
─────────────────────────────
Total:                 2000ms (buffer for P95)
```

**擴展考量：**
```
- Vector DB: Sharded by source or hash
- Embedding service: Horizontal scale, stateless
- LLM calls: Multiple providers for redundancy
- Cache: Redis cluster for permissions and responses
```

**故障處理：**
```
- Vector DB down: Return cached results + degraded warning
- LLM down: Fallback to secondary provider
- Rate limiting: Queue with backpressure
- Embedding service: Batch retries with circuit breaker
```

#### 評估方法

**離線指標：**
```
- Retrieval: Precision@5, Recall@5, MRR
- Generation: RAGAS (faithfulness, relevance)
- End-to-end: Answer correctness on test set
```

**線上指標：**
```
- User feedback: Thumbs up/down
- Query reformulation rate: User rephrasing indicates failure
- Citation click-through: Are sources useful?
```

**監控：**
```
- Latency dashboards by percentile
- Permission filter hit rate
- Empty result rate by source
- Cost per query
```

---

## 練習 2：客戶支援聊天機器人

### 問題描述

為一家電商公司設計一套 AI 驅動的客戶支援系統：

- 每天處理 10,000 次對話
- 可存取產品目錄（100 萬項產品）、訂單歷史、FAQ
- 目標：70% 的工單在不需轉接人工的情況下解決
- 支援訂單查詢、退貨、產品問題
- 多語言支援（3 種語言）
- 與既有的 Zendesk 工單系統整合

### 解決方案重點

**關鍵架構決策：**

1. **帶流程控制的代理架構：**
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   ┌─────────┐     ┌─────────────┐     ┌─────────────┐   │
│   │ Intake  │────▶│  Classify   │────▶│   Router    │   │
│   └─────────┘     └─────────────┘     └──────┬──────┘   │
│                                              │           │
│         ┌────────────────┬──────────────────┼───────┐   │
│         ▼                ▼                  ▼       ▼   │
│   ┌───────────┐   ┌───────────┐   ┌───────────┐ ┌─────┐ │
│   │Order Flow │   │Product Q&A│   │ Returns   │ │Human│ │
│   └─────┬─────┘   └─────┬─────┘   └─────┬─────┘ └─────┘ │
│         │               │               │               │
│         └───────────────┴───────────────┘               │
│                         │                               │
│                   ┌─────▼─────┐                         │
│                   │  Response │                         │
│                   │ Generator │                         │
│                   └───────────┘                         │
└─────────────────────────────────────────────────────────┘
```

2. **工具設計：**
```python
tools = [
    {
        "name": "lookup_order",
        "description": "Look up order details by order ID or customer email",
        "parameters": {
            "order_id": "optional string",
            "email": "optional string"
        }
    },
    {
        "name": "search_products",
        "description": "Search product catalog",
        "parameters": {
            "query": "string",
            "category": "optional string",
            "price_range": "optional tuple"
        }
    },
    {
        "name": "create_return",
        "description": "Initiate a return for an order",
        "parameters": {
            "order_id": "string",
            "reason": "string",
            "items": "list of item IDs"
        }
    },
    {
        "name": "escalate_to_human",
        "description": "Transfer to human agent",
        "parameters": {
            "reason": "string",
            "priority": "low|medium|high"
        }
    }
]
```

3. **升級條件：**
```
Escalate to human when:
- Customer explicitly requests human
- Sentiment is highly negative (detected by classifier)
- Issue involves payment disputes
- Agent confidence is low after 2 attempts
- Complex multi-order issues
- Refund above threshold amount
```

4. **整合模式：**
```
Zendesk integration:
- Webhook receives new tickets
- AI handles via API
- Resolution → close ticket
- Escalation → assign to queue with context summary
- All interactions logged to ticket timeline
```

---

## 練習 3：程式碼審查助手

### 問題描述

為一個開發平台設計一套程式碼審查助手：

- 自動審查 pull request
- 提供具體、可執行的回饋
- 遵守儲存庫的風格指南與慣例
- 能建議程式碼修正
- 與 GitHub/GitLab 整合
- 每天處理 50,000 個 PR

### 解決方案重點

**關鍵技術選擇：**

1. **上下文組裝：**
```
For each changed file, assemble context:
- The diff (changed lines)
- Full file content (for understanding)
- Related files (imports, tests, types)
- Repository conventions (.eslintrc, .editorconfig)
- Previous review comments (learn from feedback)
```

2. **審查類別：**
```python
review_types = [
    "bug_risk",           # Potential bugs
    "security",           # Security issues
    "performance",        # Performance concerns
    "maintainability",    # Code quality
    "style",              # Style guide violations
    "test_coverage"       # Missing tests
]
```

3. **模型選擇：**
```
Primary: Claude Sonnet 4.6 (best price-to-quality for code understanding; Opus 4.8 for the hardest reviews)
Fallback: GPT-5.5

Specialized models:
- Security scanning: CodeQL + LLM review
- Style: Linters + LLM explanation
```

4. **輸出格式：**
```markdown
## Review Summary

### Critical Issues (must fix)
- **Line 45**: SQL injection vulnerability in user query
  ```python
  # Instead of:
  query = f"SELECT * FROM users WHERE id = {user_id}"
  # Use:
  query = "SELECT * FROM users WHERE id = ?"
  cursor.execute(query, (user_id,))
  ```

### Suggestions (consider fixing)
- **Line 78-82**: This loop could be simplified using list comprehension
...
```

5. **延遲策略：**
```
Target: Review ready within 2 minutes of PR creation

Strategy:
- Queue PR for processing
- Parallel processing of files
- Stream results as available
- Cache repository conventions
```

---

## 練習 4：文件處理管線

### 問題描述

為金融服務業設計一套文件處理管線：

- 每天處理 100,000 份文件（發票、合約、表單）
- 以 99% 的準確率擷取結構化資料
- 處理 PDF、掃描文件、手寫筆記
- 符合 HIPAA/SOC2 規範
- 對低信心的擷取結果進行人工審查

### 解決方案重點

**管線架構：**

```
┌────────┐   ┌───────────┐   ┌────────────┐   ┌────────────┐
│ Ingest │──▶│ Classify  │──▶│  Extract   │──▶│  Validate  │
└────────┘   └───────────┘   └────────────┘   └────────────┘
                                                     │
                                     ┌───────────────┼───────────────┐
                                     ▼               ▼               ▼
                              ┌──────────┐   ┌──────────┐   ┌──────────┐
                              │ Auto-pass│   │  Review  │   │  Reject  │
                              └──────────┘   └──────────┘   └──────────┘
```

**關鍵元件：**

1. **文件分類：**
```
Fine-tuned classifier on document types:
- Invoice, Contract, Receipt, Form, ID, Other

Model: LayoutLMv3 or fine-tuned ViT
Confidence threshold: 0.95 for auto-routing
```

2. **擷取策略：**
```
Tiered extraction based on document type:

Tier 1: Document AI (Textract/Azure)
- Good for structured forms
- Fast and cheap
- Returns confidence scores

Tier 2: Vision LLM (Claude Opus 4.8, GPT-5.5, Gemini 3.1 Pro)
- Fallback for complex layouts
- Better for unstructured text
- More expensive

Combine outputs and cross-validate.
```

3. **驗證規則：**
```python
validation_rules = {
    "invoice": [
        ("total", lambda x: x > 0, "Total must be positive"),
        ("date", lambda x: parse_date(x), "Invalid date format"),
        ("vendor_id", lambda x: regex_match(x, TAX_ID_PATTERN), "Invalid tax ID"),
        ("line_items", lambda x: sum(i.amount for i in x) == total, "Line items must sum to total")
    ],
    "contract": [
        ("parties", lambda x: len(x) >= 2, "Contract must have at least 2 parties"),
        ("effective_date", lambda x: parse_date(x), "Invalid date"),
        ("signature_present", lambda x: x == True, "Signature required")
    ]
}
```

4. **人工審查介面：**
```
Reviewer sees:
- Original document image
- Extracted fields with confidence scores
- Validation errors highlighted
- Suggested corrections from LLM
- One-click approval or field-level corrections
```

5. **合規措施：**
```
HIPAA/SOC2 requirements:
- All documents encrypted at rest (AES-256)
- TLS 1.3 in transit
- Audit log for all access and changes
- PHI detection and masking
- Retention policies enforced
- Access controls with MFA
```

---

## 練習 5：即時內容審核

### 問題描述

為一個社交平台設計一套內容審核系統：

- 每天 100 萬則貼文（文字、圖片、影片）
- 延遲需求：貼文在 500ms 內必須變為可見
- 偵測：仇恨言論、暴力、成人內容、垃圾訊息
- 針對誤判的申訴流程
- 支援 10 種語言

### 解決方案重點

**架構模式：多階段串接（Multi-Stage Cascade）**

```
         ┌───────────────────────────────────────────┐
         │              Fast Filters                 │
         │   (regex, blocklist, hash matching)       │
         └─────────────────┬─────────────────────────┘
                           │ Pass 95%
                           ▼
         ┌───────────────────────────────────────────┐
         │            ML Classifiers                 │
         │   (text: BERT, image: CLIP, video: X3D)   │
         └─────────────────┬─────────────────────────┘
                           │ Uncertain 5%
                           ▼
         ┌───────────────────────────────────────────┐
         │            LLM Analysis                   │
         │   (context-aware, nuanced decisions)      │
         └─────────────────┬─────────────────────────┘
                           │ Still uncertain 0.5%
                           ▼
         ┌───────────────────────────────────────────┐
         │            Human Review                   │
         └───────────────────────────────────────────┘
```

**關鍵設計決策：**

1. **延遲優化：**
```
Target: 500ms total

Stage 1 (Fast): 20ms
- Regex patterns
- Known hash matching (PhotoDNA)
- Blocklist lookup

Stage 2 (ML): 80ms
- Batched inference on GPU
- Small specialized models
- Parallel text/image processing

Stage 3 (LLM): 400ms (async for borderline)
- Only 5% of content reaches here
- Used for nuanced decisions
```

2. **閾值策略：**
```python
class ModerationDecision:
    BLOCK = "block"          # High confidence violation
    ALLOW = "allow"          # High confidence safe
    LIMIT = "limit"          # Reduce distribution
    REVIEW = "human_review"  # Queue for human

thresholds = {
    "hate_speech": {
        "block": 0.95,
        "limit": 0.80,
        "review": 0.60
    },
    "adult_content": {
        "block": 0.98,  # Higher threshold, legal implications
        "limit": 0.90,
        "review": 0.70
    }
}
```

3. **申訴流程：**
```
1. User submits appeal
2. Content queued for human review
3. Different reviewer than original (blind review)
4. Decision logged with reasoning
5. If overturned:
   - Content restored
   - Original decision added to training data as negative
   - Model retrained periodically
```

---

## 練習 6：多租戶 AI 平台

### 問題描述

設計一套多租戶 AI 平台（AI 即服務）：

- 服務 500 家以上的企業客戶
- 每位客戶都有自己的文件與模型
- 租戶之間完全的資料隔離
- 各租戶的用量追蹤與計費
- 不同的定價層級對應不同的功能
- 必須符合 SOC2 規範

### 解決方案重點

**租戶隔離架構：**

```
┌─────────────────────────────────────────────────────────────────┐
│                         API Gateway                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │   Auth → Tenant Context → Rate Limit → Route             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Tenant-Aware Service Layer                    │
│                                                                  │
│  All operations scoped to tenant_id from context                │
│  - Retrieval filters by tenant                                  │
│  - Cache keys prefixed by tenant                                │
│  - Audit logs include tenant                                    │
└─────────────────────────────────────────────────────────────────┘
                               │
           ┌───────────────────┼───────────────────┐
           ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Shared Vector  │ │  Shared LLM     │ │  Shared Object  │
│  DB (filtered)  │ │  (no tenant     │ │  Storage        │
│                 │ │   data in prompt│ │  (tenant paths) │
│  tenant_id in   │ │   history)      │ │                 │
│  all metadata   │ │                 │ │  s3://bucket/   │
└─────────────────┘ └─────────────────┘ │  {tenant_id}/   │
                                        └─────────────────┘
```

**關鍵隔離點：**

```python
class TenantContext:
    tenant_id: str
    user_id: str
    tier: str  # "starter" | "pro" | "enterprise"
    
    def __enter__(self):
        # Set tenant context for all downstream calls
        _tenant_context.set(self)
        
    def __exit__(self, *args):
        _tenant_context.set(None)

# Middleware ensures tenant context on every request
@middleware
def enforce_tenant_context(request, call_next):
    tenant_id = extract_tenant_from_token(request.headers["Authorization"])
    with TenantContext(tenant_id=tenant_id, ...):
        verify_tenant_access(tenant_id, request.path)
        response = call_next(request)
        add_tenant_to_audit_log(tenant_id, request, response)
    return response
```

**計費與用量追蹤：**

```python
usage_schema = {
    "tenant_id": "string",
    "timestamp": "datetime",
    "operation": "embed|retrieve|generate",
    "model": "string",
    "tokens_in": "int",
    "tokens_out": "int",
    "latency_ms": "int",
    "cost_cents": "decimal"
}

# Real-time usage aggregation
async def track_usage(tenant_id: str, operation: Usage):
    # Append to time-series DB
    await timeseries.write("usage", {
        "tenant_id": tenant_id,
        **operation.dict()
    })
    
    # Update real-time counter for rate limiting
    await redis.incr(f"usage:{tenant_id}:{today()}", operation.tokens)
```

---

## 練習 7：大規模語意搜尋

### 問題描述

為一個電商網站設計一套語意搜尋系統：

- 5,000 萬項產品
- 每天 1 億次查詢
- P99 延遲低於 100ms
- 支援篩選條件（價格、類別、品牌、評分）
- 根據使用者歷史進行個人化
- 即時庫存更新

### 解決方案重點

**關鍵挑戰：在每天 1 億次查詢下達到 100ms**

```
100M queries/day = 1,157 QPS average
Peak: 5,000-10,000 QPS

At 100ms latency, need:
- Edge caching
- Pre-computed embeddings
- Optimized retrieval
- Minimal LLM involvement
```

**架構：**

```
┌────────────────────────────────────────────────────────────┐
│                         CDN/Edge                            │
│              (Cache popular queries: ~30% hit)              │
└─────────────────────────────┬──────────────────────────────┘
                              │
┌─────────────────────────────▼──────────────────────────────┐
│                      Query Service                          │
│  1. Embed query (cached embeddings for common queries)      │
│  2. Retrieve candidates (ANN search)                        │
│  3. Apply filters (post-filter or hybrid)                   │
│  4. Personalize ranking                                     │
│  5. Return results                                          │
└─────────────────────────────┬──────────────────────────────┘
                              │
┌─────────────────────────────▼──────────────────────────────┐
│                    Vector Database Cluster                  │
│  - Sharded by category (reduce search space)                │
│  - HNSW index with ef_search tuned for speed                │
│  - Metadata filtering with roaring bitmaps                  │
└────────────────────────────────────────────────────────────┘
```

**延遲預算：**

```
Edge cache check:    5ms
Embedding lookup:   10ms (cached) or 30ms (compute)
Vector search:      30ms
Filtering:          10ms
Personalization:    10ms
Serialization:      10ms
Network overhead:   25ms
─────────────────────
Total:              100ms target (with cache hit)
```

**混合搜尋策略：**

```python
def search(query: str, filters: dict, user_id: str) -> List[Product]:
    # Determine search strategy based on query
    if is_keyword_heavy(query):
        # "nike air max 90 size 10"
        sparse_weight = 0.7
        dense_weight = 0.3
    else:
        # "comfortable running shoes for flat feet"
        sparse_weight = 0.3
        dense_weight = 0.7
    
    # Parallel retrieval
    dense_results = vector_db.search(embed(query), top_k=100, filter=filters)
    sparse_results = elastic.search(query, top_k=100, filter=filters)
    
    # Reciprocal rank fusion
    combined = rrf_merge(
        [dense_results, sparse_results],
        weights=[dense_weight, sparse_weight]
    )
    
    # Personalization boost
    personalized = apply_user_preferences(combined, user_id)
    
    return personalized[:20]
```

**即時更新：**

```
Product updates (price, inventory) flow:
1. Change event published to Kafka
2. Consumer updates vector DB metadata
3. Search reflects change within seconds

Reindexing (description changes):
1. Full re-embed required
2. Run as async job
3. Swap index when complete
```

---

## 練習 8：生產環境 LLM 產品的評估管線

### 問題描述

「你的公司推出一款 AI 助手，每天有 50,000 名使用者使用。管理層希望每週都能推出模型與提示的變更，同時不造成品質衰退。請設計這套評估管線：離線評估、CI 把關、評審校準，以及生產環境監控。預算限制：評估系統本身的成本應低於推論花費的 2%。」

### 應該詢問的釐清問題

- 對這款產品而言「品質」代表什麼？（任務成功、忠實度、語氣、安全性？）
- 我們今天有任何已標註的資料嗎，還是要從零開始？
- 變更的速度有多快？（提示每天改、模型每月改？）
- 一次已上線的衰退代價是多少？（支援工單、客戶流失、法規風險？）
- 誰會使用評估結果？（工程師用來把關 PR、PM 用來追蹤品質、主管用來追蹤趨勢線？）

### 解題演練

**高階架構：**

```
                    ┌────────────────────────────────────────────┐
                    │              EVAL PIPELINE                  │
                    │                                             │
  Prompt/model PR ──► CI runner ── dev set (visible, ~200 cases) │
                    │     │                                       │
                    │     ├── held-out set (CI-only, ~300 cases,  │
                    │     │    rotated quarterly)                  │
                    │     │                                       │
                    │     └── gate: pass/fail vs baseline ──► merge│
                    │                                             │
  Production ──────► sampler (1-5% of traffic)                   │
                    │     │                                       │
                    │     ├── LLM-judge scoring (async, cheap)    │
                    │     ├── human-graded slice (weekly, ~100)   │
                    │     └── outcome metrics (thumbs, escalation)│
                    │                                             │
                    └──── dashboards + regression alerts ─────────┘
```

**1. 資料集策略（多數候選人會跳過的部分）：**

```
Golden dataset composition:
- 40% sampled from real production traces (stratified by intent cluster)
- 30% known-hard cases from past incidents and complaints
- 20% adversarial cases (injection attempts, edge formats)
- 10% canary cases that must never change behavior

Split: dev (iterate freely) / held-out (CI-only, never inspected)
Refresh: quarterly, sampled from recent traffic; archive old sets
```

**2. 評分設計：**

- 每個維度（忠實度、完整性、語氣、安全性）採用二元的 pass/fail，而非 1 至 5 分的量表。二元決策可重現；Likert 量表會漂移。
- 用 LLM-as-judge 來達到規模化：使用一個便宜的模型（Claude Haiku 4.5、GPT-5.5-mini），搭配每個維度的評分準則與少量範例錨點。
- 評審校準：每月對照人工評分的子集進行一致性檢查。評審與人工的一致性本身就是儀表板上的一項指標；當一致性低於 85% 時，必須先修正評審的提示，才能對產品做出任何結論。

**3. CI 把關：**

```python
def eval_gate(pr_results, baseline_results):
    # Hard gates: any safety regression blocks merge
    if pr_results.safety_pass_rate < baseline_results.safety_pass_rate:
        return Block(reason="safety regression")
    # Soft gates: quality within noise band
    delta = pr_results.task_success - baseline_results.task_success
    if delta < -0.02:                  # 2pt regression threshold
        return Block(reason=f"quality drop {delta:.1%}")
    if pr_results.held_out_success < pr_results.dev_success - 0.05:
        return Warn(reason="possible dev-set overfitting")
    return Pass()
```

**4. 生產環境監控：**

- 對線上流量進行抽樣評審評分（1 至 5%），每日繪製趨勢。
- 結果連結：將抱怨率、負評率與升級率，與評估分數繪製在同一個儀表板上。當評估趨勢與結果趨勢出現背離時，便觸發一次評估審查。
- 漂移警報：輸入分布的偏移（意圖叢集組成）、各區隔的分數下滑，以及評審一致性的衰退。

**5. 成本控制：**

```
50K DAU, ~3 requests each = 150K requests/day
Sample 2% = 3K judged requests/day
Judge cost: ~1K tokens per judgment on a $1/1M model = ~$3/day
Weekly human slice: 100 cases x 3 min reviewer time
CI runs: 500 cases x ~2K tokens per PR = under $2 per PR
Total: well under the 2% budget; the human slice is the
dominant cost and it is what keeps the judge honest.
```

### 優秀候選人的區別

- 他們會在設計評分器之前先設計資料集；在過時的資料集上跑一個再好的評審，也測不出任何東西。
- 他們把評審當成一個有自己評估（對照人工校準）的系統元件，而非當成基準真相（ground truth）。
- 他們會在未被提示的情況下主動指出評估被操弄的風險：dev-set 過度擬合、評審諂媚、指標窄化、悄悄排除困難案例。
- 他們會把離線分數連結到生產環境的結果，而不是只慶祝儀表板一片綠。
- 他們會量化評估預算，並把昂貴的人工評分放在最有槓桿效益的地方。

---

## 練習 9：長時間運行代理的記憶與狀態

### 問題描述

「為一個與使用者相處數個月的個人 AI 助手設計記憶系統：它應記住偏好與事實、從過去的會話中學習、在恰當的時機回想相關歷史，並忘掉不該保留的內容。會話可能持續數小時。需支援 100 萬名使用者。」

### 應該詢問的釐清問題

- 哪一種記憶失敗最傷害使用體驗：忘記某件重要的事，還是回想起錯誤或過時的內容？
- 有隱私限制嗎？（GDPR 刪除、各使用者隔離、受監管的資料？）
- 記憶是僅限各使用者的，還是也包含共享的組織知識？
- 每一輪回想的延遲預算是多少？
- 單一會話會運行多久？（這決定了會話內與跨會話的設計。）

### 解題演練

**記憶階層：**

```
┌──────────────────────────────────────────────────────────┐
│ L1 Working memory: the context window                     │
│   Current session, tool results, scratchpad               │
│   Managed by compaction + just-in-time loading            │
├──────────────────────────────────────────────────────────┤
│ L2 Episodic memory: what happened                         │
│   Past session summaries, trajectories, outcomes          │
│   Store: vector DB, retrieved by similarity + recency     │
├──────────────────────────────────────────────────────────┤
│ L3 Semantic memory: what is true                          │
│   Extracted facts and preferences with provenance         │
│   Store: structured records or knowledge graph            │
├──────────────────────────────────────────────────────────┤
│ L4 Procedural memory: how to do things                    │
│   Learned workflows, per-user playbooks (skills)          │
│   Store: versioned files, loaded on demand                │
└──────────────────────────────────────────────────────────┘
```

**1. 會話內（L1）：這是上下文工程，不是儲存。**
在達到視窗閾值時進行壓縮（摘要歷史、保留最近的產物）、透過引用對大型內容進行即時載入（just-in-time loading），以及代理在壓縮後會重新讀取的一份結構化暫存筆記。一個運行數小時的會話，絕不會把整份逐字記錄都保留在上下文中。

**2. 寫入路徑（困難的部分）：**

```
Session ends (or hits checkpoint)
    │
    ├── Summarize episode → L2 (embedding + metadata:
    │     timestamp, topics, outcome, sentiment)
    │
    └── Fact extraction pass → candidate facts
          │
          ├── Deduplicate against existing L3
          ├── Conflict check: contradicts a stored fact?
          │     ├── Newer + higher confidence → supersede (keep old
          │     │     version with valid_to timestamp)
          │     └── Ambiguous → store as candidate, confirm with
          │           user at next natural opportunity
          └── Importance filter: discard chit-chat, keep
                preferences, commitments, corrections
```

衝突路徑最為重要：「使用者從 Madrid 搬到 Lisbon」必須取代舊資料，而非與其並存。雙時間（bitemporal）記錄（valid_from、valid_to）讓取代過程可稽核且可還原。

**3. 讀取路徑：**

- 每一輪都會從當前意圖建構一個回想查詢，從 L2 取出 top-k（依相似度 + 近期性 + 重要性加權），並從 L3 取出相符的事實。
- 一道相關性閘門會丟棄弱匹配，而不是把它們硬塞進去；錯誤的記憶對回應的毒害，比缺漏的記憶更嚴重。
- 回想預算：每一輪僅用數百個 token 的記憶，絕不傾倒整份逐字記錄。

**4. 遺忘與隱私：**

- 衰減：情節式條目的檢索權重會隨時間下降，除非因被存取而獲得強化。
- 整併：一個定期任務會把相關的情節合併為摘要（許多「帳單問題」情節會變成一條模式筆記）。
- GDPR 刪除：到處都採用各使用者的分區鍵；刪除會移除 L2/L3/L4 的列並使快取失效。各使用者之間採硬隔離；記憶絕不會因相似度而跨租戶共享。

**5. 規模草圖（100 萬名使用者）：**

```
Storage: ~thousands of L2 entries + hundreds of L3 facts per
  active user; vector DB partitioned by user_id (metadata
  filter or namespace per tenant tier)
Write path: async after session close; queue + worker pool
Read path: p95 < 150ms recall (ANN on a per-user slice is small)
Cost: extraction pass on session close is the main LLM cost;
  use a cheap model (Haiku 4.5 / V4 Flash) with a strict schema
```

### 優秀候選人的區別

- 他們會把會話內的上下文管理與跨會話的記憶分開，而不是把兩者混為一談。
- 他們會把時間花在寫入路徑（擷取、去重、衝突取代）上，而不是只專注於檢索。
- 他們把錯誤的回想視為比沒有回想更糟，並據此設計相關性閘門。
- 他們會把記憶毒化（memory poisoning）點名為一個安全面向：今天寫入的不受信任內容、明天卻被信任，這需要來源標記與審查閘門。
- 他們會提到生產環境框架（Mem0、Zep、Letta）作為自建還是採購（build-vs-buy）的選項，同時仍能從基本原語出發進行設計。

---

## 白板練習小技巧

### 繪圖技巧

1. **先畫方框與標籤**，再用箭頭連接
2. **使用一致的標記法**：矩形代表服務、圓柱代表資料庫、箭頭代表資料流
3. **在箭頭上標註資料**：元件之間流動的是什麼
4. **留出空間**，以便在討論時加上新內容

### 應該掌握的常見模式

| 模式 | 何時使用 | 如何繪製 |
|---------|-------------|---------|
| 負載平衡器 + 服務群 | 任何需擴展的服務 | LB → 多個方框 |
| 佇列 + 工作者 | 非同步處理 | Queue → worker pool |
| 快取層 | 讀取密集、對延遲敏感 | 服務前放一個菱形 |
| CDC/串流 | 即時更新 | Kafka/串流圖示 |
| Sidecar | 橫切關注點 | 附在服務上的小方框 |

### 能彰顯優秀候選人的措辭

- 「在我設計這個之前，先讓我了解一下規模……」
- 「這裡的取捨在於……」
- 「在生產環境中，我們還會需要……」
- 「有一個需要考慮的故障模式是……」
- 「讓我帶你走過一遍延遲預算……」
- 「在評估方面，我會去衡量……」

### 時間管理

- 釐清需求不要花超過 5 分鐘
- 在深入細節之前，先畫出完整的高階全貌
- 為可靠性與評估保留時間
- 與面試官確認重點關注的領域

---

*另請參閱：[題庫](01-question-bank.md) | [答題框架](02-answer-frameworks.md) | [常見陷阱](03-common-pitfalls.md)*
