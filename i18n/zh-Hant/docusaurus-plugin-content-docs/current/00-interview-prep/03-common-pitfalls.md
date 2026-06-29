# AI 系統設計面試的常見陷阱

本章涵蓋面試者在 AI 系統設計面試中常犯的錯誤、為何這些錯誤會傷害你的評價，以及如何避免。

## 目錄

- [架構陷阱](#architecture-pitfalls)
- [技術知識陷阱](#technical-knowledge-pitfalls)
- [溝通陷阱](#communication-pitfalls)
- [面試策略陷阱](#interview-strategy-pitfalls)
- [AI 特有陷阱](#ai-specific-pitfalls)
- [自我檢視清單](#checklists-for-self-review)

---

## 架構陷阱 {#architecture-pitfalls}

### 陷阱 1：略過資料管線

**問題出在哪：**
面試者把推論路徑設計得鉅細靡遺，卻幾乎沒提到資料是怎麼進入系統的。

**為什麼重要：**
資料品質決定 AI 系統的品質。如果文件擷取管線產出的是垃圾區塊，再漂亮的 RAG 架構也派不上用場。

**面試官會注意到：**
- 沒提到文件是如何被處理的
- 假設嵌入會憑空出現
- 忽略更新與刪除

**比較好的做法：**
```
"Before discussing retrieval, let me walk through the data pipeline:

1. Document ingestion: File upload, API integration, crawler
2. Preprocessing: Format conversion, cleaning, metadata extraction
3. Chunking: [Strategy] based on document structure
4. Embedding: Batch processing with [model]
5. Indexing: Upsert to vector database with metadata
6. Updates: Incremental re-indexing on document changes"
```

---

### 陷阱 2：一體適用的模型選擇

**問題出在哪：**
面試者說他們會用 GPT-4（或任何單一模型）來處理所有事情。

**為什麼重要：**
不同任務有不同需求。用前沿模型來做分類是浪費；用小模型來做複雜推理則會失敗。

**面試官會注意到：**
- 沒有討論成本影響
- 沒有考量延遲需求
- 沒有模型級聯（cascade）或路由

**比較好的做法：**
```
"Model selection varies by task:

- Intent classification: Fine-tuned BERT or GPT-5.5-mini
- Simple responses: Claude Haiku 4.5, GPT-5.5-mini, or DeepSeek V4 Flash
- Complex reasoning: Claude Sonnet 4.6 or GPT-5.5
- Code generation: Claude Sonnet 4.6 (Opus 4.8 for the hardest cases)

I would implement a router that classifies query complexity 
and routes to the appropriate model. This typically reduces 
costs 60-70% with minimal quality impact."
```

---

### 陷阱 3：忽略評估層

**問題出在哪：**
面試者描述了如何建構系統，卻沒說明要如何知道它是否運作正常。

**為什麼重要：**
AI 系統會以難以察覺的方式失敗。沒有評估，你會把壞掉的系統上線，而且永遠偵測不到品質劣化。

**面試官會注意到：**
- 沒提到測試集
- 沒有定義品質指標
- 沒有對生產環境問題做監控

**比較好的做法：**
```
"Evaluation has three layers:

1. Offline: Golden test set evaluated on every change
   - Retrieval: Precision@5, Recall@5, MRR
   - Generation: Faithfulness, relevance (RAGAS)
   - End-to-end: Answer correctness vs ground truth

2. Online: Sampled evaluation in production
   - LLM-as-judge on 5% of requests
   - User feedback (thumbs up/down)
   - Completion rate for task-oriented queries

3. Alerting: Automated detection
   - Quality score drops below threshold
   - Latency exceeds SLA
   - Error rate spikes"
```

---

### 陷阱 4：低估多租戶的複雜度

**問題出在哪：**
面試者把多租戶 RAG 當成只是加一個「tenant_id」欄位這麼簡單。

**為什麼重要：**
多租戶 AI 系統在資料外洩、隔離與公平的資源分配上，有其獨特的失敗模式。

**面試官會注意到：**
- 在檢索後才做過濾（重大警訊）
- 沒有討論快取隔離
- 沒有考量吵鬧鄰居（noisy neighbor）

**比較好的做法：**
```
"Multi-tenancy for RAG is harder than traditional systems:

1. Retrieval isolation: Filter BEFORE retrieval at the database level
   WRONG: retrieve(query, top_k=100) then filter by tenant
   RIGHT: retrieve(query, top_k=10, filter={tenant_id: X})

2. Context isolation: Never mix tenants in LLM context

3. Cache isolation: Scope all cache keys by tenant
   cache_key = f'{tenant_id}:{query_hash}'

4. Embedding isolation: Consider tenant-specific embedding spaces
   for highest security requirements

5. Audit: Log tenant context for all operations

I would also run regular isolation tests with adversarial 
queries designed to probe for cross-tenant leakage."
```

---

### 陷阱 5：沒有優雅降級

**問題出在哪：**
當 LLM 供應商當機、被限流，或回傳錯誤時，系統沒有任何後備方案。

**為什麼重要：**
LLM 供應商會發生服務中斷，限流額度會被打滿。是否有失敗處理，正是區分「生產就緒」與「原型」的關鍵。

**面試官會注意到：**
- 沒提到後備方案
- 沒有重試策略
- 對單一供應商的依賴

**比較好的做法：**
```
"Reliability layers:

1. Retry with backoff: Transient errors get retried
   - Exponential backoff with jitter
   - Max 3 attempts

2. Fallback providers: If primary fails, try secondary
   - OpenAI → Anthropic → local model
   - Abstract the interface to enable swapping

3. Cached responses: Return cached results for known queries
   - Exact match cache for repeated questions
   - Semantic cache for similar questions

4. Graceful degradation: Partial functionality on failure
   - Retrieval fails → return direct LLM response with disclaimer
   - LLM fails → return relevant chunks without synthesis

5. Circuit breaker: Fail fast when provider is degraded
   - Prevents cascading latency issues"
```

---

## 技術知識陷阱 {#technical-knowledge-pitfalls}

### 陷阱 6：混淆嵌入模型與生成模型

**問題出在哪：**
面試者談到用嵌入模型生成文字，或把生成當成檢索。

**該知道的是：**
- **嵌入模型：** 把文字對應到向量（text → vector）。用於搜尋／檢索。
- **生成模型：** 給定提示後產出文字。用於產生回應。

**它們是如何連接的：**
RAG 用嵌入模型做檢索，再把檢索到的區塊傳給生成模型。

---

### 陷阱 7：誤解上下文視窗

**問題出在哪：**
- 假設 128K 上下文就代表有 128K token 的可用上下文
- 沒有把系統提示、檢索到的區塊與對話歷史一併計入
- 忽略「中間迷失」（lost in the middle）現象

**該知道的是：**
- 上下文視窗是上限，不是目標
- 注意力對於中段內容會劣化
- 實際可用的上下文遠比上限小得多

**比較好的表述方式：**
```
"While current frontier models advertise 1M-token windows, I design for much smaller effective context:

- System prompt: ~500 tokens
- Retrieved context: 3-5 chunks × 500 tokens = 1.5-2.5K
- Conversation history: Last 5 turns × 300 tokens = 1.5K
- Buffer for output: ~2K

Total active context: ~7K tokens, well below limit.

This keeps the model focused on relevant information and 
avoids the lost-in-the-middle problem documented in Liu et al."
```

---

### 陷阱 8：不理解 token 的成本經濟

**問題出在哪：**
面試者在討論功能時，並不理解其成本影響。

**該知道的是：**
- 計價是以 token 為單位，輸入與輸出往往分開計價
- 對多數供應商而言，輸出 token 的成本是輸入 token 的 2 到 4 倍
- 串流（streaming）並不會改變成本

**快速參考（2026 年 6 月，請查核最新數據）：**

| Model | Input/1M | Output/1M |
|-------|----------|-----------|
| Claude Fable 5 | $10 | $50 |
| Claude Opus 4.8 | $5 | $25 |
| GPT-5.5 | $5 | $30 |
| Claude Sonnet 4.6 | $3 | $15 |
| Gemini 3.1 Pro | $2 | $12 |
| Claude Haiku 4.5 | $1 | $5 |
| DeepSeek V4 Flash | $0.14 | $0.28 |

**成本計算範例：**
```
10,000 queries/day
Average: 2K input tokens, 500 output tokens
Model: Claude Sonnet 4.6

Daily cost = 10K × (2K × $3/1M + 500 × $15/1M)
          = 10K × ($0.006 + $0.0075)
          = 10K × $0.0135
          = $135/day = ~$4K/month
```

**快取這個槓桿（往往是面試者之間的差別所在）：**
```
Same workload, but 1.5K of the 2K input is a shared prefix
(system prompt + tool schemas) served from cache at 10% of
the input price:

Daily cost = 10K × (0.5K × $3/1M + 1.5K × $0.30/1M + 500 × $15/1M)
          = 10K × ($0.0015 + $0.00045 + $0.0075)
          = ~$94/day = ~$2.8K/month   (30% saved by prompt shape alone)

Design implication: keep the static content (instructions, schemas)
at the front of the prompt and the dynamic content at the end, so
the prefix stays byte-identical across requests and the cache hits.
```

---

### 陷阱 9：對 RAG 元件的理解流於表面

**問題出在哪：**
面試者能列出各個元件（分塊、嵌入、檢索、生成），卻說不出每個元件內部的取捨。

**對於區塊（chunk），期待的深度：**
- 為什麼要分塊？（上下文限制、檢索精確度）
- 區塊大小的取捨？（越小越精確，越大則上下文越多）
- 重疊（overlap）的目的？（避免在邊界處遺失上下文）
- 何時該用語意分塊？（結構多變的複雜文件）

**對於檢索（retrieval），期待的深度：**
- 為什麼要混合搜尋？（密集向量擅長語意，稀疏向量擅長關鍵字）
- 什麼是重排序？（兩階段：先快速召回，再精準排序）
- 如何處理沒有結果的情況？（後備策略）

---

### 陷阱 10：把提示當成魔法

**問題出在哪：**
面試者用「然後我們就提示模型去……」一語帶過，卻不討論提示工程。

**面試官想看到的：**
- 提示結構（系統、上下文、使用者）
- 指令是否清楚
- 輸出格式的規範
- 在適當時提供少樣本（few-shot）範例
- 對邊界情況的防禦

**比較好的做法：**
```
"The generation prompt has this structure:

SYSTEM:
You are a support assistant for [Product]. Answer questions 
using ONLY the provided context. If the context does not 
contain the answer, say 'I don't have information about that.'
Always cite the source document.

CONTEXT:
[Retrieved chunks with source metadata]

USER:
[User's question]

I specify the output format explicitly and use few-shot 
examples for complex response structures. For this use case, 
I also include negative examples showing when to abstain."
```

**在面試中值得點名的提示失敗模式：**

| 失敗模式 | 它看起來像什麼 | 防禦方式 |
|--------------|--------------------|---------|
| 中間迷失 | 埋在第 40K 個 token 處的關鍵指令被忽略 | 把規則放在開頭與結尾，中間留給資料 |
| 指令階層被破壞 | 檢索到的文件文字蓋過了系統提示 | 用分隔符包住不可信內容，把它當作資料，絕不當成指令 |
| 格式走鐘 | JSON 輸出在長對話或模型更新後逐漸劣化 | 採用引擎層級的結構化輸出（json_schema、tool schemas），而非「請回傳 JSON」 |
| 破壞快取的動態內容 | 提示開頭的時間戳會在每次請求都讓前綴快取失效 | 靜態內容在前，動態內容在後 |
| 提示與模型耦合 | 針對某一供應商調校的提示，在換模型後會默默地表現變差 | 把提示與模型 ID 一起做版本控管，每次換模型都重跑評估 |

在沒被問到的情況下主動點名其中兩三項，能讓一個關於提示的回答從初級晉升到資深，因為每一項都是面試官很可能親身經歷過的生產環境事故。

---

## 溝通陷阱 {#communication-pitfalls}

### 陷阱 11：只顧獨白、缺乏互動

**問題出在哪：**
面試者一口氣講了 10 到 15 分鐘，都沒有跟面試官確認一下。

**為什麼重要：**
面試是對話。一味獨白會錯過面試官在意什麼的訊號。

**比較好的做法：**
每 3 到 5 分鐘確認一次：
- 「我該在檢索上講得更深入，還是進到生成的部分？」
- 「在我深入細節之前，這個架構說得通嗎？」
- 「有沒有哪個特定元件是你希望我聚焦的？」

---

### 陷阱 12：開場沒有先給結構

**問題出在哪：**
面試者一開口就講，卻沒有先示意自己接下來會涵蓋哪些內容。

**為什麼重要：**
面試官心中都有一套心智模型。如果他們無法把你的回答對應到自己的預期，你就會顯得雜亂無章。

**比較好的做法：**
開場先給一份藍圖：
```
"I will structure my answer in four parts:
1. High-level architecture
2. Deep dive on the RAG pipeline
3. Scaling and reliability
4. Evaluation approach

Let me start with the high-level architecture..."
```

---

### 陷阱 13：丟出技術術語卻不解釋

**問題出在哪：**
面試者丟出像「PagedAttention」或「GQA」這類術語，卻不加以解釋。

**為什麼重要：**
如果面試官不認識這個術語，你會顯得像在炫名詞；如果他們認識，他們可能會追問你答不出來的問題。

**比較好的做法：**
在引入術語時附上簡短說明：
```
"I would use vLLM which implements PagedAttention. 
This manages the KV cache like virtual memory, reducing 
fragmentation and enabling higher throughput."
```

---

### 陷阱 14：硬拗錯誤答案

**問題出在哪：**
當面試官暗示某個做法有問題時，面試者不重新思考，反而更堅持己見。

**為什麼重要：**
固執是個警訊；能虛心受教則很有價值。

**比較好的做法：**
```
Interviewer: "What about the case where..."
You: "That is a good point. I had not considered [X]. 
Let me revise my approach..."
```

---

## 面試策略陷阱 {#interview-strategy-pitfalls}

### 陷阱 15：在解一個不同的問題

**問題出在哪：**
面試者對某項特定技術感到興奮，於是針對那項技術去設計，而不是針對題目所述的需求。

**範例：**
題目要求設計一個簡單的問答系統，面試者卻設計了一個具備自主研究能力的複雜多代理系統。

**比較好的做法：**
先針對需求做設計，然後再提出延伸：
```
"This design meets the core requirements. If we wanted to 
extend it to handle more complex multi-step queries, we 
could add an agent layer, but I would not start there."
```

---

### 陷阱 16：沒有管理時間

**問題出在哪：**
面試者在架構上花了 20 分鐘，結果沒有時間談評估、可靠性或擴展。

**比較好的做法：**
明確地分配時間：
- 釐清需求：3 到 5 分鐘
- 高層次設計：5 到 7 分鐘
- 深入探討：10 到 15 分鐘
- 評估／可靠性：5 到 7 分鐘
- 提問／收尾：3 到 5 分鐘

看著時鐘，隨時調整。

---

### 陷阱 17：不畫圖

**問題出在哪：**
面試者只用口頭描述架構，卻不畫圖。

**為什麼重要：**
視覺化的溝通更清楚，也展現出你有能力與利害關係人溝通。

**比較好的做法：**
一邊解釋一邊畫方塊與箭頭。標示清楚。在整個討論過程中，把這張圖當成參照。

---

## AI 特有陷阱 {#ai-specific-pitfalls}

### 陷阱 18：把 AI 元件當成黑盒子

**問題出在哪：**
面試者把「呼叫 LLM」當成一個不可分割的操作，卻不理解它內部發生了什麼。

**對資深職位的期待：**
- 理解預填（prefill）與解碼（decode）兩個階段
- 知道哪些因素影響延遲（TTFT 與 TPS）
- 理解 KV cache 的影響
- 留意批次處理（batching）的效應

---

### 陷阱 19：忽略幻覺風險

**問題出在哪：**
面試者設計的系統盲目地信任 LLM 的輸出。

**為什麼重要：**
幻覺是 LLM 本質上就會有的。生產環境系統必須處理它們。

**比較好的做法：**
```
"Hallucination mitigation has multiple layers:

1. Retrieval grounding: Answer from context only
2. Citation enforcement: Every claim cites a source
3. Abstention: Model says 'I don't know' when appropriate
4. Output validation: Check for impossible claims
5. Confidence display: Show users when to verify"
```

---

### 陷阱 20：把安全當成事後補丁

**問題出在哪：**
安全方面的考量被擺到最後才談，甚至根本沒談。

**為什麼重要：**
AI 系統有新型態的攻擊面（提示注入、資料外洩）。安全必須在設計時就納入。

**比較好的做法：**
把安全織入設計之中：
```
"For the retrieval layer, I use metadata filtering at the 
database level to ensure tenant isolation. The system prompt 
uses instruction hierarchy to resist injection. Output 
passes through a content filter before reaching the user."
```

---

## 自我檢視清單 {#checklists-for-self-review}

### 面試前

- [ ] 複習過 RAG 架構模式
- [ ] 知道目前的模型計價（大略數字）
- [ ] 能夠解釋分塊策略
- [ ] 理解嵌入與生成的差異
- [ ] 知道常見的評估指標
- [ ] 能夠討論至少一種向量資料庫
- [ ] 理解多租戶的挑戰
- [ ] 能夠討論提示工程技巧

### 面試中

- [ ] 問了釐清需求的問題
- [ ] 陳述了優先順序與取捨
- [ ] 畫了一張圖
- [ ] 提到了評估方法
- [ ] 討論了失敗模式
- [ ] 處理了安全／隔離議題
- [ ] 與面試官確認過
- [ ] 在各段落間管理好時間

### 每個段落結束後

- [ ] 我有解釋「為什麼」，而不只是「是什麼」嗎？
- [ ] 我有提到取捨嗎？
- [ ] 我有在適用之處使用具體數字嗎？
- [ ] 我有避免不必要的複雜度嗎？

---

*另見：[題庫](01-question-bank.md) | [答題框架](02-answer-frameworks.md) | [白板演練](04-whiteboard-exercises.md)*
