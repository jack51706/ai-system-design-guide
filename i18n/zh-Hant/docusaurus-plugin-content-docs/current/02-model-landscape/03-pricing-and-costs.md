# 定價與成本

了解 LLM 系統的成本結構，對於生產環境的規劃至關重要。本章涵蓋定價模式、成本最佳化策略，以及總體擁有成本分析。

## 目錄

- [定價模式](#pricing-models)
- [當前 API 定價](#current-api-pricing)
- [成本計算](#cost-calculation)
- [成本最佳化策略](#cost-optimization-strategies)
- [上下文快取的經濟效益](#context-caching-economics)
- [自架與 GPU 雲端套利](#self-hosting-economics)
- [總體擁有成本](#total-cost-of-ownership)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 定價模式 {#pricing-models}

### 以 Token 計費的定價

大多數 LLM API 都以 token 計費：

```
Cost = (input_tokens × input_rate) + (output_tokens × output_rate)
```

**重點觀察：**
- 輸出 token 的費用比輸入 token 貴 2 至 5 倍
- 定價會因模型等級而有顯著差異
- 部分供應商提供批次折扣

### 分級定價

部分供應商提供用量折扣：

| 等級 | 每月支出 | 折扣 |
|------|---------------|----------|
| Standard | $0 - $5K | 0% |
| Growth | $5K - $50K | 10-20% |
| Enterprise | $50K+ | 客製化議價 |

### 以承諾用量為基礎的定價

以折扣價預先購買 token：

```
Standard: $2.50 / 1M input tokens
Committed (1-year): $2.00 / 1M input tokens (20% savings)
```

---

## 當前 API 定價 {#current-api-pricing}

### 2026 年 5 月定價

> **最後查核日期：2026 年 6 月 28 日。** 價格經常變動。請務必重新查核：[OpenAI](https://developers.openai.com/api/docs/pricing)、[Anthropic](https://platform.claude.com/docs/en/about-claude/pricing)、[Google](https://ai.google.dev/gemini-api/docs/pricing)、[xAI](https://docs.x.ai/developers/models)、[DeepSeek](https://api-docs.deepseek.com/quick_start/pricing)
>
> **2026 年生效的淘汰項目：** OpenAI 於 2026 年 2 月 13 日從 ChatGPT 下架 GPT-4o、GPT-4.1、GPT-4.1-mini、o4-mini；gpt-5.2-chat-latest 與 gpt-5.3-chat-latest 於 2026 年 5 月 8 日淘汰；Realtime API Beta 於 2026 年 5 月 12 日移除；Sora app 於 2026 年 4 月 26 日關閉（API 將於 2026 年 9 月 24 日終止支援）。Anthropic 於 2026 年 6 月 15 日淘汰 Claude Sonnet 4 與 Claude Opus 4，並於 2026 年 8 月 5 日淘汰 Claude Opus 4.1。Google Vertex 於 2026 年 3 月 26 日下架 `gemini-3-pro-preview`；Project Mariner 於 2026 年 5 月 4 日關閉。Gemini 2.5 Pro/Flash 於 2026 年 6 月 17 日淘汰。
>
> **價格變動：** Anthropic 於 2026 年 6 月 9 日推出 **Claude Fable 5**，定價為每 1M $10 / $50：這是其能力最強且廣泛釋出的模型（Mythos 等級並具備防護措施），定價為 Opus 4.8 的 2 倍，但不到 Claude Mythos Preview 的一半。**Claude Mythos 5**（同一模型，移除防護措施，僅限 Glasswing）採用相同的 $10 / $50 定價。Anthropic 於 2026 年 5 月 28 日推出 **Claude Opus 4.8**，定價與 Opus 4.7 相同，為每 1M $5 / $25，並提供可選的快速模式，定價為每 1M $10 / $50（比 Opus 4.7 的快速模式快約 2.5 倍且便宜 3 倍，後者為 $30 / $150）。DeepSeek 於 2026 年 5 月 22 日將其 75% 的 V4 Pro 折扣轉為**永久性**：自 2026 年 6 月 1 日起，新的標價降至原價的 25%（每 1M 輸入/輸出 $0.435 / $0.87），且所有 DeepSeek 模型的快取命中輸入價格已於 2026 年 4 月 26 日調降至發布價的 1/10。DeepSeek V4 Flash（每 1M $0.14 / $0.28，1M 上下文）是目前最便宜的前沿等級 API，且優勢相當明顯。

#### OpenAI（GPT-5.x 世代）
| 模型 | 輸入 / 1M | 輸出 / 1M | 備註 |
|-------|------------|-------------|-------|
| **GPT-5.5** ⭐ NEW | $5.00 | $30.00 | 2026 年 4 月 23 日發布。1M 上下文。全新等級的多模態旗艦。 |
| **GPT-5.5 Instant** ⭐ NEW | 查核最新 | 查核最新 | 自 2026 年 5 月 5 日起成為 ChatGPT 與 `chat-latest` 的預設模型。在高風險提示上的幻覺減少 52.5%。 |
| **GPT-Realtime-2** ⭐ NEW | $32.00（音訊） | $64.00（音訊） | 2026 年 5 月 7 日發布。GPT-5 等級的即時語音。 |
| **GPT-Realtime-Translate** ⭐ NEW | （音訊定價） | （音訊定價） | 70 種以上輸入語言 → 13 種輸出語言。 |
| **GPT-5.4 Pro** | $30.00 | $180.00 | 最高階推論；長上下文加倍至 $60/$270 |
| **GPT-5.4** | $2.50 | $15.00 | 旗艦；原生工具使用；快取輸入 $1.25 |
| **GPT-5.4-mini** | $0.75 | $4.50 | GPT-5 等級中最佳的成本/效能比 |
| **GPT-5.4-nano** | 查核最新 | 查核最新 | 最小的 GPT-5.4 變體；2026 年 3 月發布 |
| **GPT-4o** | $2.50 | $10.00 | 於 2026 年 2 月 13 日從 ChatGPT 下架；API 存取狀況不一 |
| **GPT-4o-mini** | $0.15 | $0.60 | 舊版；請查核 API 可用性 |

#### Anthropic（Claude Fable + 4.x 世代）
| 模型 | 輸入 / 1M | 輸出 / 1M | 上下文 | 備註 |
|-------|------------|-------------|---------|-------|
| **Claude Fable 5** ⭐ NEW | $10.00 | $50.00 | 1M | 2026 年 6 月 9 日發布（`claude-fable-5`），可於 Claude API、AWS 上的 Claude Platform、Bedrock、Vertex AI、Microsoft Foundry 使用。Anthropic 能力最強且廣泛釋出的模型（Mythos 等級並具備防護措施；敏感查詢在不到 5% 的工作階段中會回退至 Opus 4.8）。自適應思考永遠開啟；最大輸出 128K；適用 30 天資料保留。 |
| **Claude Mythos 5** ⭐ NEW | $10.00 | $50.00 | 1M | 與 Fable 5 相同的底層模型，但在部分領域移除了防護措施。供應有限：僅限 Project Glasswing 夥伴與部分生物學研究人員。接替 Mythos Preview，價格不到其一半。 |
| **Claude Opus 4.8** | $5.00 | $25.00 | 1M | 2026 年 5 月 28 日於 API、Bedrock、Vertex AI 發布。Dynamic Workflows 研究預覽，具備平行子代理。可選快速模式為每 1M $10 / $50（比 Opus 4.7 的快速模式快約 2.5 倍、便宜 3 倍）。SWE-bench Verified 88.6%；SWE-Bench Pro 69.2%；OSWorld-Verified 82.3%。 |
| **Claude Opus 4.7** | $5.00 | $25.00 | 1M | 2026 年 4 月 16 日於 API、Bedrock、Vertex、Microsoft Foundry 發布。更高解析度視覺，改進的 SWE。快速模式：每 1M $30 / $150。 |
| **Claude Opus 4.6** | $5.00 | $25.00 | 1M | 最大輸出 128K；自適應思考採標準費率。 |
| **Claude Sonnet 4.6** | $3.00 | $15.00 | 1M | 以更低成本涵蓋大多數 Opus 等級的任務。**截至 2026 年 6 月 28 日仍無 Sonnet 4.8。** |
| **Claude Haiku 4.5** | $1.00 | $5.00 | 200K | 最快的 Anthropic 模型；快取命中輸入每 1M $0.10。 |
| **Claude Mythos Preview** | n/a | n/a | - | 受限的研究預覽（約 11 家 Glasswing 夥伴）；於 2026 年 6 月 9 日由 Claude Mythos 5 接替。 |

> [!NOTE]
> **Claude 1M 上下文採標準定價**：Fable 5、Opus 4.8、Opus 4.7、Opus 4.6 與 Sonnet 4.6 均以標準費率提供完整的 1M token 上下文視窗，長上下文不另設高價等級。Batch API 提供 50% 折扣。快取命中費用為標準輸入價格的 10%。Opus 4.8（每 1M $10 / $50）與 Opus 4.7 / 4.6（每 1M $30 / $150）的快速模式定價可與快取乘數疊加，但無法於 Batch API 或 AWS 上的 Claude Platform 使用。發布時並無 Fable 等級的快速模式。

#### Google（Gemini 3.x 世代）
| 模型 | 輸入 / 1M | 輸出 / 1M | 上下文 | 備註 |
|-------|------------|-------------|---------|-------|
| **Gemini 3.1 Pro** | $2.00 | $12.00 | 1M | 200K 以上上下文：$4.00/$18.00 |
| **Gemini 3.1 Flash** | $0.10 | $3.00 | 1M | 最佳價格/效能比；高用量 |
| **Gemini 2.5 Flash-Lite** | $0.10 | $0.40 | 1M | 2026 年 6 月淘汰 |

> [!WARNING]
> **Gemini 2.5 淘汰**：Gemini 2.5 Pro 與 2.5 Flash 預定於 2026 年 6 月 17 日淘汰。請遷移至 Gemini 3.x 模型。

#### xAI（Grok）
| 模型 | 輸入 / 1M | 輸出 / 1M | 上下文 | 備註 |
|-------|------------|-------------|---------|-------|
| **Grok 4** | $3.00 | $15.00 | 256K | 原生工具使用；即時搜尋 |
| **Grok 4.1 Fast** | $0.20 | $0.50 | 2M | 高用量、低成本 |
| **Grok 3 mini** | 查核最新 | 查核最新 | - | 更快、較不準確 |

#### 透過 API 提供的開放權重模型（2026 年 5 月）
| 模型 | 輸入 / 1M | 輸出 / 1M | 上下文 | 供應商範例 |
|-------|------------|-------------|---------|-------------------|
| **DeepSeek-V3.2** | $0.28 | $0.42 | 128K | DeepSeek API。98% 快取命中折扣。透過路由，有效費率可降低 10–30 倍。 |
| **DeepSeek V4 Pro** ⭐ NEW | $0.435 | $0.87 | 1M | DeepSeek API。75% 促銷折扣已轉為**永久性**：自 2026 年 6 月 1 日起，新標價為原價的 25%（$1.74 / $3.48）。快取命中輸入：$0.003625/M。在 1M token 下約為 V3.2 的 27% 運算量 / 10% 記憶體。 |
| **DeepSeek V4 Flash** ⭐ NEW | $0.14 | $0.28 | 1M | DeepSeek API。快取命中輸入：$0.0028/M（98% 折扣）。13B 啟用參數的 MoE。目前最便宜的前沿等級 1M 上下文 API。 |
| **Mistral Medium 3.5** ⭐ NEW | $1.50 | 查核最新 | 256K | Mistral API。統一的對話/推論/編碼/視覺；SWE-Bench Verified 77.6%。 |
| **Kimi K2.6** ⭐ NEW | 查核最新 | 查核最新 | - | Moonshot API。1T MoE / 32B 啟用參數；代理群可達 300 個子代理。 |
| **Qwen 3.6-35B-A3B** ⭐ NEW | 查核最新 | 查核最新 | - | Apache 2.0 權重；自架或透過 API 供應商使用。 |
| **Llama 4 Scout** | $0.11 | $0.34 | 10M | Together AI、Groq、Fireworks。注意：有效上下文超過 32K 後會迅速劣化。 |
| **Llama 4 Maverick** | $0.27 | $0.85 | 1M | Together AI、Groq、Fireworks。需具備 MoE 感知的服務。 |
| **DeepSeek-V3** | $0.25 | $1.10 | 128K | DeepSeek API、Together AI |
| **DeepSeek-R1** | $0.55 | $2.19 | 128K | DeepSeek API |
| **Mistral Large 3** | $0.50 | $1.50 | 256K | Mistral API、AWS Bedrock |
| **Llama 3.3 70B** | ~$0.10–0.20 | ~$0.30–0.60 | 128K | Groq、Together AI |
| **Qwen2.5-Coder-32B** | ~$0.50 | ~$1.00 | 32K | Together AI |
| **Gemma 4（31B / 26B-A4B MoE / E4B / E2B）** ⭐ NEW | 自架 | 自架 | 256K | Apache 2.0。支援 140 種以上語言；原生視覺/音訊；函式呼叫。 |

#### 嵌入模型（2026 年 5 月）
| 模型 | 每 1M token 成本 | 維度 |
|-------|------------------|-----------|
| **Cohere Embed 4** ⭐ NEW | $0.10 | 256 / 512 / 1024 / 1536（Matryoshka） |
| **text-embedding-3-large** | $0.13 | 3072 |
| **text-embedding-3-small** | $0.02 | 1536 |
| **Voyage-3** | $0.06 | 1024 |
| **Cohere embed-v3** | $0.10 | 1024 |

> [!IMPORTANT]
> **推論時的運算成本：** 對於具備「延伸思考」或推論模式的模型（GPT-5.4 Pro、Claude Opus 4.6），即使**內部思考 token** 未顯示給使用者，你仍會被收費。對於邏輯密集的任務，這可能使單次請求的總成本增加 2 至 10 倍。在生產環境中請務必設定 `budget_tokens` 上限。

---

## 成本計算 {#cost-calculation}

### 基本成本公式

```python
def calculate_request_cost(
    input_tokens: int,
    output_tokens: int,
    model: str
) -> float:
    pricing = {
        "gpt-5.4": {"input": 2.50, "output": 15.00},
        "gpt-5.4-mini": {"input": 0.75, "output": 4.50},
        "claude-sonnet-4.6": {"input": 3.00, "output": 15.00},
        "claude-opus-4.6": {"input": 5.00, "output": 25.00},
        "gemini-3.1-flash": {"input": 0.10, "output": 3.00},
    }
    
    rates = pricing[model]
    cost = (
        (input_tokens / 1_000_000) * rates["input"] +
        (output_tokens / 1_000_000) * rates["output"]
    )
    return cost
```

### 成本計算範例

**情境 1：RAG 聊天機器人**
```
Per request:
- System prompt: 500 tokens
- Retrieved context: 2,000 tokens
- User message: 100 tokens
- Response: 300 tokens

Input: 2,600 tokens, Output: 300 tokens

GPT-5.4 cost: (2600 × $2.50 + 300 × $15) / 1M = $0.0110 per request

At 10,000 requests/day:
Daily: $95
Monthly: $2,850
```

**情境 2：文件摘要**
```
Per document:
- Document: 8,000 tokens
- Summary: 500 tokens

GPT-5.4 cost: (8000 × $2.50 + 500 × $15) / 1M = $0.0275

1,000 documents: $27.50
10,000 documents: $275
```

### 每月成本預估

```python
def project_monthly_cost(
    requests_per_day: int,
    avg_input_tokens: int,
    avg_output_tokens: int,
    model: str
) -> dict:
    per_request = calculate_request_cost(
        avg_input_tokens, avg_output_tokens, model
    )
    
    daily = per_request * requests_per_day
    monthly = daily * 30
    yearly = monthly * 12
    
    return {
        "per_request": per_request,
        "daily": daily,
        "monthly": monthly,
        "yearly": yearly
    }

# Example
costs = project_monthly_cost(
    requests_per_day=50000,
    avg_input_tokens=2000,
    avg_output_tokens=400,
    model="gpt-5.4"
)
# Output: ~$18,750/month
```

---

## 成本最佳化策略 {#cost-optimization-strategies}

### 策略 1：模型路由

將請求路由至適當的模型等級：

```python
class ModelRouter:
    def __init__(self):
        self.classifier = load_complexity_classifier()
    
    def route(self, query: str, context: str) -> str:
        complexity = self.classifier.predict(query)
        
        if complexity < 0.3:
            return "gpt-5.4-mini"  # Simple queries
        elif complexity < 0.7:
            return "gpt-5.4-mini"  # Medium, try cheap first
        else:
            return "gpt-5.4"  # Complex queries

    def route_with_fallback(self, query: str, context: str) -> str:
        # Try cheap model first
        response = self.try_model("gpt-5.4-mini", query, context)

        if self.is_quality_sufficient(response):
            return response

        # Fallback to expensive model
        return self.try_model("gpt-5.4", query, context)
```

**潛在節省：** 50-70%，且對品質的影響極小

### 策略 2：提示最佳化

在不損失品質的前提下減少 token 數量：

```python
# Before: 2,500 tokens
system_prompt = """
You are a helpful customer support assistant for Acme Corp. 
You have access to our product documentation and should answer 
questions accurately and helpfully. Always be polite and professional.
If you don't know something, say so rather than making things up.
Format your responses clearly with bullet points when listing items.
[... more verbose instructions ...]
"""

# After: 800 tokens
system_prompt = """
You are Acme Corp's support assistant.
Rules:
- Answer from provided context only
- Admit uncertainty
- Use bullet points for lists
- Be concise
"""

# Savings: 1,700 tokens × $2.50/1M = $0.00425 per request
# At 10K requests/day: $42.50/day = $1,275/month
```

### 策略 3：快取

針對重複或相似的查詢快取回應：

```python
class ResponseCache:
    def __init__(self, ttl_seconds: int = 3600):
        self.exact_cache = TTLCache(maxsize=10000, ttl=ttl_seconds)
        self.semantic_cache = SemanticCache(threshold=0.95)
    
    def get_or_generate(self, query: str, context: str) -> tuple[str, bool]:
        # Check exact cache
        cache_key = self.make_key(query, context)
        if cache_key in self.exact_cache:
            return self.exact_cache[cache_key], True  # Cache hit
        
        # Check semantic cache
        similar = self.semantic_cache.find_similar(query)
        if similar:
            return similar.response, True  # Semantic hit
        
        # Generate new response
        response = self.generate(query, context)
        self.exact_cache[cache_key] = response
        self.semantic_cache.add(query, response)
        
        return response, False  # Cache miss

# With 30% cache hit rate:
# Baseline: $3,000/month
# With caching: $2,100/month
# Savings: $900/month
```

### 策略 4：批次處理

將多個請求一起處理以提升效率：

```python
# Real-time: pay full price
for query in queries:
    response = model.generate(query)

# Batch API (OpenAI offers 50% discount):
batch_responses = model.batch_generate(queries)
# Cost: 50% of real-time pricing
```

### 策略 5：輸出長度控制

適當限制回應長度：

```python
# Reduce unnecessary output
response = model.generate(
    prompt=prompt,
    max_tokens=300,  # Limit output
    stop=["\n\n"]    # Stop at natural break
)

# Cost impact:
# Before: avg 500 output tokens = $0.0075 per request (GPT-5.4)
# After: avg 250 output tokens = $0.00375 per request
# Savings: 50% on output costs
```

### 成本最佳化摘要

| 策略 | 投入心力 | 潛在節省 |
|----------|--------|-------------------|
| 模型路由 | 中等 | 50-70% |
| **上下文快取** | 低 | **60-90%（輸入）** |
| 提示最佳化 | 低 | 20-40% |
| 回應快取 | 中等 | 20-40% |
| 批次處理 | 低 | 50%（OpenAI/Anthropic） |

---

## 上下文快取的經濟效益 {#context-caching-economics}

**RAG 的「黃金法則」（在 2026 年依然成立）。**
如果你有固定的 system prompt，或共用的知識庫（前綴）大於 10,000 個 token，那麼**上下文快取**是必備的。

**損益兩平分析（Claude Sonnet 4.6）：**
- **標準輸入**：每 1M token $3.00
- **快取輸入**：每 1M token $0.30（90% 折扣）
- **快取寫入費用**：每 1M token $3.75（5 分鐘 TTL，1.25 倍）；$6.00（1 小時 TTL，2 倍）

`Break-even = (Write Fee) / (Standard Rate - Cached Rate) ≈ 1.4 requests (5-min) or 2.2 requests (1-hour)`

如果你的長前綴被**超過 2 位使用者**使用，那麼快取它一定比每次原樣傳送更便宜。OpenAI 與 Anthropic 現在都提供可與快取疊加的 batch API 折扣（5 折）。

---

## 自架與 GPU 雲端套利 {#self-hosting-economics}

**保留型 vs. 無伺服器的取捨：**

| 模型規模 | 無伺服器（RunPod/Together） | 保留型（Lambda/AWS） |
|------------|-----------------------------|-----------------------|
| **突發容量** | 無限（有冷啟動） | 固定 |
| **使用率** | 僅為運算時間付費 | 24/7 固定成本 |
| **TCO 損益兩平**| **使用率 < 40% 時較划算** | **使用率 > 40% 時較划算** |

**首席工程師等級的細節：**
「GPU 雲端套利」是指根據**競價型執行個體的可用性**，在不同供應商之間搬移生產工作負載。像 **Skypilot** 這類工具可自動化此流程，透過跟著全球「低需求」區域走，最多可節省 60% 的自架成本。MoE 模型的興起（Llama 4 Scout 可塞進單張 H100，Maverick 約需 2 張 H100，DeepSeek V4 Flash 需 4 張 H100），相較於稠密模型進一步降低了自架的 GPU 需求。

### 何時適合自架

```
Break-even analysis:

API cost at scale:
- 1M requests/month
- 2,500 tokens average
- GPT-5.4: ~$37,500/month
- Claude Sonnet 4.6: ~$30,000/month

Self-hosted equivalent (Llama 4 Maverick via MoE):
- 2x H100 80GB: ~$6/hour × 730 = $4,380/month
- Engineering time: $5,000/month (0.5 FTE)
- Ops overhead: $2,000/month
- Total: ~$11,380/month

Savings vs GPT-5.4: $26,120/month = 70%
Savings vs Claude Sonnet 4.6: $18,620/month = 62%
```

### 自架的成本組成

| 組成項目 | 每月成本 | 備註 |
|-----------|--------------|-------|
| GPU 運算 | $5K-20K | 視模型規模而定 |
| 儲存 | $200-500 | 模型權重、日誌 |
| 網路 | $100-500 | 流出流量、負載平衡 |
| 工程 | $5K-15K | 部分 FTE 負責維運 |
| 監控 | $100-500 | 可觀測性工具 |

### 各模型規模的 GPU 需求

| 模型規模 | GPU 配置 | 預估每月成本 |
|------------|------------|---------------------|
| 7B (INT4) | 1x A10G | $500-800 |
| 7B (FP16) | 1x A100 40GB | $1,500-2,500 |
| 70B (INT4) | 2x A100 80GB | $5,000-8,000 |
| 70B (FP16) | 4x A100 80GB | $10,000-15,000 |
| 405B (INT4) | 8x H100 | $20,000-30,000 |

### 決策框架

```
Choose API when:
- Volume < 100K requests/month
- No ML ops expertise
- Need highest quality (frontier models)
- Fast iteration needed

Choose self-hosting when:
- Volume > 500K requests/month
- Have ML infrastructure team
- Data privacy requirements
- Predictable, stable workload
- Custom fine-tuning needed
```

---

## 總體擁有成本 {#total-cost-of-ownership}

### TCO 組成

```python
def calculate_tco(scenario: dict) -> dict:
    # Direct costs
    api_or_compute = scenario["monthly_api_cost"]
    
    # Engineering costs
    development = scenario["dev_hours"] * scenario["engineer_rate"]
    maintenance = scenario["maintenance_hours"] * scenario["engineer_rate"]
    
    # Infrastructure
    vector_db = scenario["vector_db_cost"]
    monitoring = scenario["monitoring_cost"]
    
    # Indirect costs
    downtime_risk = scenario["expected_downtime_hours"] * scenario["revenue_per_hour"]
    
    monthly_tco = (
        api_or_compute +
        development / 12 +  # Amortized over year
        maintenance +
        vector_db +
        monitoring +
        downtime_risk
    )
    
    return {
        "monthly_tco": monthly_tco,
        "yearly_tco": monthly_tco * 12,
        "breakdown": {
            "llm": api_or_compute,
            "engineering": development / 12 + maintenance,
            "infrastructure": vector_db + monitoring,
            "risk": downtime_risk
        }
    }
```

### TCO 比較範例

**情境：客服機器人（每月 50K 次請求）**

| 成本組成 | 採用 API | 自架 |
|----------------|-----------|-------------|
| LLM 成本 | $5,000 | $3,000 |
| 向量資料庫 | $70 | $200 |
| 工程（每月） | $500 | $3,000 |
| 監控 | $100 | $200 |
| **每月總計** | **$5,670** | **$6,400** |

*在此規模下，由於工程開銷較高，採用 API 較便宜。*

**情境：大規模 RAG（每月 2M 次請求）**

| 成本組成 | 採用 API | 自架 |
|----------------|-----------|-------------|
| LLM 成本 | $50,000 | $15,000 |
| 向量資料庫 | $500 | $1,000 |
| 工程（每月） | $1,000 | $8,000 |
| 監控 | $200 | $500 |
| **每月總計** | **$51,700** | **$24,500** |

*在此規模下，自架明顯較便宜。*

---

## 面試問題 {#interview-questions}

### Q：你會如何為高用量的 RAG 應用最佳化成本？

**理想回答：**
我會分層處理成本最佳化：

**1. 架構最佳化：**
- 模型路由：對簡單查詢使用便宜的模型
- 快取：30-40% 的查詢可能可以快取
- 提示壓縮：盡量減少 system prompt 的 token

**2. 模型選擇：**
```
Simple queries (60%): GPT-5.4-mini at $0.003/request
Complex queries (40%): GPT-5.4 at $0.011/request
Weighted avg: $0.0062/request (vs $0.011 all GPT-5.4)
Savings: 44%
```

**3. 基礎設施：**
- 批次更新嵌入（便宜 50%）
- 為向量資料庫選擇適當規模
- 盡可能使用競價型執行個體

**4. 監控：**
- 追蹤各查詢類型的成本
- 對異常發出警示
- 定期檢視成本

### Q：你會在什麼情況下建議自架，而非使用 API？

**理想回答：**
決策取決於多項因素：

**用量門檻：**
- 每月低於 100K：幾乎一律使用 API
- 100K-500K：個案評估
- 每月超過 500K：通常自架較有利

**團隊能力：**
- 無 ML 維運能力：無論規模一律使用 API
- 具備強大的基礎設施團隊：可更早考慮自架

**品質需求：**
- 需要絕對最佳：API（前沿模型）
- 夠用即可：自架的開放模型

**其他因素：**
- 資料隱私：可能迫使你自架
- 延遲控制：自架可提供更多掌控
- 微調需求：自架可實現更多客製化

**我的建議流程：**
1. 先從 API 開始，以求最快的迭代
2. 建立抽象層以便切換模型
3. 當支出超過每月 $10K 時評估自架
4. 在正式投入前，先以影子部署進行試行

---

## 參考資料 {#references}

- OpenAI Pricing: https://developers.openai.com/api/docs/pricing
- Anthropic Pricing: https://platform.claude.com/docs/en/about-claude/pricing
- Google AI Pricing: https://ai.google.dev/gemini-api/docs/pricing
- xAI Pricing: https://docs.x.ai/developers/models
- Mistral Pricing: https://docs.mistral.ai/getting-started/changelog
- Lambda Labs GPU Pricing: https://lambdalabs.com/service/gpu-cloud
- RunPod Pricing: https://www.runpod.io/pricing
- LLM Pricing Comparison: https://pricepertoken.com/

---

*上一篇：[能力評估](02-capability-assessment.md) | 下一篇：[模型選擇指南](04-model-selection-guide.md)*
