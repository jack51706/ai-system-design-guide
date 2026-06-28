# 模型選擇指南

一套實用的框架，協助你為自身使用情境選擇合適的 LLM，並同時考量能力、成本、延遲與營運因素。

## 目錄

- [選擇框架](#selection-framework)
- [能力比較](#capability-comparison)
- [使用情境對應](#use-case-mapping)
- [成本分析](#cost-analysis)
- [營運考量](#operational-considerations)
- [多模型策略](#multi-model-strategies)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 選擇框架

### 決策樹（2026 年 6 月）

```
Start Here
    │
    ├── Need the absolute capability ceiling?
    │   └── Yes ─────────────────────────────────────────┐
    │   └── No ──┐                                       │
    │            │                                       ▼
    │            │                              ┌─────────────────┐
    │            │                              │ Claude Fable 5  │
    │            │                              │ ($10/$50, 1M)   │
    │            │                              └─────────────────┘
    │            │
    ├── Need autonomous agents / long-horizon planning?
    │   └── Yes ─────────────────────────────────────────┐
    │   └── No ──┐                                       │
    │            │                                       ▼
    │            │                              ┌─────────────────┐
    │            │                              │ Claude Opus 4.8 │
    │            │                              │ GPT-5.5 reason. │
    │            │                              └─────────────────┘
    │            │
    ├── Need best software engineering / coding?
    │   └── Yes ─────────────────────────────────────────┐
    │   └── No ──┐                                       │
    │            │                                       ▼
    │            │                              ┌─────────────────┐
    │            │                              │ Fable 5 ceiling /│
    │            │                              │ GPT-5.5 88.7%   │
    │            │                              │ Opus 4.8 88.6%  │
    │            │                              │ Sonnet 4.6 cheap│
    │            │                              └─────────────────┘
    │            │
    ├── Need to process massive context (>1M)?
    │   └── Yes ─────────────────────────────────────────┐
    │   └── No ──┐                                       │
    │            │                                       ▼
    │            │                              ┌─────────────────┐
    │            │                              │ Gemini 3.0 Pro  │
    │            │                              │ (2.5M context)  │
    │            │                              └─────────────────┘
    │            │
    ├── Cost-sensitive high volume?
    │   └── Yes ─────────────────────────────────────────┐
    │   └── No ──┐                                       │
    │            │                                       ▼
    │            │                              ┌─────────────────┐
    │            │                              │ Gemini 3 Flash /│
    │            │                              │ o4-mini         │
    │            │                              └─────────────────┘
    │            │
    └── Default: Production Choice
                 ▼
        ┌─────────────────┐
        │ Claude Sonnet 4.6│
        │ GPT-5.5-mini    │
        └─────────────────┘
```

### 關鍵選擇因素

| 因素 | 權重 | 考量點 |
|--------|--------|----------------|
| **代理式可靠度** | 高 | 工具呼叫準確度、多步驟規劃 |
| **上下文召回** | 高 | 在 1M 以上的大海撈針（needle-in-a-haystack）表現 |
| **速率上限** | 高 | **（資深專家的細微觀點）**：供應商是否能在不出現 429 錯誤的情況下，承受你的 P99 吞吐量？ |
| **生態系成熟度** | 高 | 生產環境實戰紀錄、SDK 支援，以及企業級 SLA |
| **成本／輸出 Token** | 中 | 代理式迴圈會消耗 5 倍至 10 倍以上的 token |

---

## 能力比較

### 前沿模型比較（2026 年 6 月）

| 模型 | 優勢 | 缺點 | 上下文 | 最適合 |
|-------|-----------|------|---------|----------|
| **Claude Fable 5** | 目前廣泛釋出的最強模型；具備防護措施的 Mythos 等級能力；恆常開啟的自適應思考；SOTA 視覺能力；可維持最長的自主執行時間 | 價格為 Opus 4.8 的 2 倍（$10/$50）；在敏感主題上，少於 5% 的工作階段會退回 Opus 4.8；30 天資料保留 | 1M | 能力上限工作：最艱難的推理、視覺，以及最長時程的代理 |
| **Claude Opus 4.8** | 長時間運行的代理式編碼（SWE-bench 88.6%）、具備平行子代理的 Dynamic Workflows、$10/$50 快速模式 | GPT-5.5 在單次（single-shot）SWE-bench 上以些微差距領先；Fable 5 在能力上已超越它 | 1M | 程式庫規模的遷移、自主編碼迴圈、前沿層級中最佳的性價比 |
| **GPT-5.5** | SWE-bench Verified 領先者（88.7%）、Terminal-Bench 領先者（78.2%）、原生 omni 多模態 | 成本高（$5/$30） | 1M | 多代理系統、單次編碼 |
| **Claude Opus 4.7** | 前一代旗艦（SWE-bench 87.6%、SWE-Bench Pro 64.3%） | 在相同價格下已被 4.8 取代 | 1M | 既有的 4.7 部署，且無遷移壓力 |
| **Claude Sonnet 4.6** | 強勁的成本／品質平衡、以標準價格提供完整 1M | 尚未釋出 Sonnet 4.8 | 1M | 通用生產環境主力 |
| **Gemini 3.1 Pro** | GPQA Diamond 領先者（94.3%）、1M 多模態、Deep Think 模式 | Deep Think 會出現延遲尖峰 | 1M | 科學推理、多模態 |
| **DeepSeek-R1** | 開源推理、具競爭力的數學能力 | 僅限推理；通用使用上非前沿等級 | 128K | 數學、複雜除錯、開放權重推理 |

### 預算型模型比較

| 模型 | 成本（每 1M 輸入／輸出） | 品質 | 上下文 | 最適合 |
|-------|----------------------------|---------|---------|----------|
| **Gemini 3 Flash** | $0.05 / $0.20 | 前沿等級 | 1M | 高流量 RAG |
| **o4-mini** | $0.10 / $0.40 | 優異 | 128K | 快速推理任務 |
| **Llama 4 8B** | 自架（H100/L40） | 強勁 | 128K | 裝置端、私有 |

### 開源模型

| 模型 | 參數量 | 品質 | 最適合 |
|-------|------------|---------|----------|
| **Llama 4 70B** | 70B | 具前沿競爭力 | 通用開源首選 |
| **Nemotron 3 Ultra** | 500B MoE | 代理式精熟 | 可擴展的開源代理 |
| **DeepSeek V3.2** | 671B MoE | 極致效能 | 在前沿品質下擁有最低 TCO |

---

## 使用情境對應

### 依應用類型（2026 年 6 月）

| 使用情境 | 推薦模型 | 理由 |
|----------|-------------------|-----------|
| **能力上限研究／最艱難問題** | Claude Fable 5 | Mythos 等級能力，普遍可用；僅將受能力上限約束的工作以 $10/$50 路由給它 |
| **自主開發** | 搭配 Dynamic Workflows 的 Claude Opus 4.8、Claude Sonnet 4.6 | 在 Claude Code 中執行平行子代理；SWE-Bench Pro 居冠，達 69.2% |
| **企業級 RAG** | Gemini 3.1 Pro、Gemini 3.1 Flash、DeepSeek V4 Flash | 1M 上下文與積極的快取折扣，消除了檢索的複雜度 |
| **客戶支援** | Gemini 3.1 Flash、GPT-5.5-mini、Claude Haiku 4.5 | 近乎零延遲，且推理能力強勁 |
| **推理／除錯** | GPT-5.5 reasoning、Claude Opus 4.8（thinking）、DeepSeek-R1 | 在程式碼與邏輯的隱藏式 CoT 上表現最佳 |
| **影片／多模態** | Gemini 3.1 Pro、GPT-5.5、Claude Opus 4.8 | 原生交錯式多模態處理 |
| **私有代理** | Llama 4 Maverick、DeepSeek V4 Pro（開放權重） | 最強的開放權重代理式規劃 |

### 依限制條件

| 限制條件 | 做法 |
|------------|----------|
| **最大延遲 < 100ms** | Gemini 3.1 Flash、GPT-5.5-mini、Claude Haiku 4.5，或自架的 Nano 系列模型 |
| **上下文 > 1M tokens** | Claude Fable 5 / Opus 4.8 / Opus 4.7 / Sonnet 4.6、Gemini 3.1 Pro、GPT-5.5、Llama 4 Scout（10M） |
| **零資料外洩** | 在內部 VPC 上運行的 Llama 4 70B、DeepSeek V4 Pro |
| **複雜工具使用** | Claude Opus 4.8 或 GPT-5.5（最佳規劃準確度） |

---

## 成本分析

### 成本建模（2026 年 6 月）

| 模型 | 輸入 / 1M | 輸出 / 1M | 備註 |
|-------|------------|-------------|-------|
| **Claude Fable 5** | $10.00 | $50.00 | 能力上限；為 Opus 4.8 的 2 倍；保留給受能力上限約束的工作 |
| **Claude Opus 4.8** | $5.00 | $25.00 | 前沿編碼與代理式；可選快速模式 $10 / $50 |
| **Claude Opus 4.7** | $5.00 | $25.00 | 相同標準價格；快速模式則較貴，為 $30 / $150 |
| **GPT-5.5** | $5.00 | $30.00 | 單次 SWE-bench 領先者 |
| **Claude Sonnet 4.6** | $3.00 | $15.00 | 均衡選擇；尚未釋出 Sonnet 4.8 |
| **Gemini 3.1 Pro** | $2.00 | $12.00 | 最佳性價比前沿；多模態 |
| **DeepSeek V4 Pro** | $0.435 | $0.87 | 5 月 22 日將 75% 折扣永久化 |
| **Gemini 3.1 Flash** | $0.10 | $3.00 | 規模化 RAG；快取折扣 |
| **DeepSeek V4 Flash** | $0.14 | $0.28 | 最便宜的前沿等級 1M 上下文 |

### 成本比較範例

假設每月 1M 次查詢，每次查詢 1K 輸入 token + 500 輸出 token：

| 用量 | GPT-5.5 | Claude Sonnet | Gemini 3 Pro | Gemini 3 Flash |
|--------|---------|---------------|--------------|----------------|
| 每月 10K 次查詢 | $150 | $105 | $37.50 | $1.50 |
| 每月 1M 次查詢 | $15,000 | $10,500 | $3,750 | $150 |

*洞察：DeepSeek V4 Flash（$0.14 / $0.28）與 Gemini 3.1 Flash（$0.10 / $3.00）實質上已將 RAG 商品化，使得在規模化下，長上下文處理比傳統向量搜尋基礎設施更為便宜。*

---

## 營運考量

### 速率限制與配額

| 供應商 | 層級 | RPM | TPM |
|----------|------|-----|-----|
| OpenAI (Tier 1) | Basic | 500 | 30K |
| OpenAI (Tier 5) | Enterprise | 10K | 10M |
| Anthropic (Tier 1) | Basic | 50 | 40K |
| Anthropic (Tier 4) | Enterprise | 4K | 400K |

### 可靠度模式

```python
class ReliableModelClient:
    def __init__(self):
        self.providers = {
            "primary": OpenAIClient(),
            "fallback1": AnthropicClient(),
            "fallback2": GoogleClient()
        }
    
    async def generate(self, prompt: str) -> str:
        for name, client in self.providers.items():
            try:
                return await client.generate(prompt)
            except RateLimitError:
                continue
            except ServiceError:
                continue
        
        raise AllProvidersUnavailable()
```

### 抽象層

```python
class LLMClient:
    """Unified interface for multiple providers."""
    
    def __init__(self, config: dict):
        self.default_model = config["default_model"]
        self.clients = self._init_clients(config)
    
    async def generate(
        self,
        messages: list[dict],
        model: str = None,
        **kwargs
    ) -> str:
        model = model or self.default_model
        client = self._get_client(model)
        
        # Normalize request format
        normalized = self._normalize_request(messages, kwargs)
        
        # Call provider
        response = await client.generate(**normalized)
        
        # Normalize response
        return self._normalize_response(response)
    
    def _normalize_request(self, messages: list[dict], kwargs: dict) -> dict:
        # Handle differences between providers
        # OpenAI uses 'messages', Anthropic uses 'messages' with different format
        pass
```

---

## 多模型策略

### 模型路由

```python
class ModelRouter:
    def __init__(self):
        self.classifier = QueryClassifier()
        self.models = {
            "simple": "gpt-4o-mini",
            "complex": "claude-3.5-sonnet",
            "code": "claude-3.5-sonnet",
            "long_context": "gemini-1.5-pro",
            "reasoning": "o1-mini"
        }
    
    async def route(self, query: str, context_length: int) -> str:
        # Classify query complexity
        query_type = await self.classifier.classify(query)
        
        # Override for long context
        if context_length > 100_000:
            return self.models["long_context"]
        
        return self.models[query_type]
```

### 級聯模式（2025 年改良版）

**核心邏輯**：絕不用 70B 模型去做 1B 模型就能完成的任務。使用「Router」來為信心程度評分。

```python
class ModelCascade:
    """The 'Efficiency First' Pattern."""
    
    async def generate_optimized(self, query: str):
        # 1. Draft check (SLM / Classifier)
        if is_simple_intent(query):
            return await gpt4o_mini.generate(query)
            
        # 2. Main Generation (Efficient model)
        response = await claude_sonnet.generate(query)
        
        # 3. Validation / Escalate
        if needs_verification(response):
            return await o3.generate(f"Verify this: {response}")
            
        return response
```

**資深專家級提示：** 實作「語意化回退（Semantic Fallback）」，也就是在發生錯誤時不只是對同一個模型重試，而是立即跳轉到更大的模型或不同的供應商（OpenAI -> Anthropic），以避免相關聯的連帶故障。

---

## 面試問題

### 問：在生產環境應用中，你會如何在 GPT-4o、Claude 與 Gemini 之間做選擇？

**優秀的回答：**

「我的選擇取決於具體需求：

**對於多數生產環境工作負載**，我預設使用 Claude 3.5 Sonnet 或 GPT-4o。兩者都是優異的通用型模型。Sonnet 在編碼上略勝一籌，GPT-4o 則有更好的生態系整合。

**對於長上下文應用**，Gemini 1.5 Pro 以 1 至 2 百萬 token 的上下文成為明顯贏家。如果我需要處理整個程式庫或非常長的文件，Gemini 就是我的選擇。

**對於成本敏感的高流量場景**，使用 GPT-4o-mini 或 Claude Haiku。它們便宜 10 至 20 倍，且能妥善處理直觀的任務。

**我的實務做法：**
1. 先用 Sonnet 或 GPT-4o 製作原型，以驗證使用情境
2. 在「我自己的」具體任務上評估，而不只是看基準測試
3. 建立抽象層，讓我能輕鬆切換
4. 透過將較簡單的請求路由到較便宜的模型來最佳化成本

我從不單純依賴基準測試分數。一個在 MMLU 上排名較低的模型，可能在我的領域中表現出色。」

### 問：你會在什麼情況下選擇自架，而非使用 API 供應商？

**優秀的回答：**

「這是掌控權與營運負擔之間的取捨。

**在以下情況使用 API：**
- 用量低於每月 1M 次查詢（成本交叉點）
- 需要立即使用最新模型
- 團隊缺乏 GPU 基礎設施專業
- 變動的工作負載難以做容量規劃
- 上市時間至關重要

**在以下情況自架：**
- 資料不能離開基礎設施（合規）
- 用量超過每月 10M 次查詢（成本節省）
- 需要 P99 延遲低於 100ms
- 需要自訂模型權重或微調
- 需要對模型行為的完全掌控

**混合式做法往往最佳：**
- 自架用於高流量且可預測的工作負載
- API 用於流量尖峰與特殊化模型
- 在自架失敗時，以 API 作為回退

自架的隱藏成本：GPU 採購、工程時間、模型更新、監控。請納入 1 至 2 位專責基礎設施的工程師。」

---

## 參考資料

- OpenAI API: https://platform.openai.com/
- Anthropic API: https://docs.anthropic.com/
- Google AI: https://ai.google.dev/
- LMSys Leaderboard: https://chat.lmsys.org/

---

*下一篇：[微調指南](../03-training-and-adaptation/02-fine-tuning-strategies.md)*
