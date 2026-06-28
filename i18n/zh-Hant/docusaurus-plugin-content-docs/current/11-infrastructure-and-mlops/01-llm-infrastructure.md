# LLM 基礎設施

建構生產環境的 LLM 系統，需要了解部署選項、擴展模式與營運考量。本章涵蓋基礎設施層。

## 目錄

- [部署選項](#deployment-options)
- [服務架構](#serving-architecture)
- [擴展模式](#scaling-patterns)
- [成本管理](#cost-management)
- [監控與告警](#monitoring-and-alerting)
- [災難復原](#disaster-recovery)
- [2026 年 5 月 AI 加速器版圖](#may-2026-ai-accelerator-landscape)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 部署選項

### API 與自架（Self-Hosted）

| 因素 | API 供應商 | 自架 |
|--------|---------------|-------------|
| 建置時間 | 數分鐘 | 數天到數週 |
| 營運負擔 | 無 | 顯著 |
| 低用量成本 | 較低 | 較高（固定成本） |
| 高用量成本 | 較高 | 較低（規模經濟） |
| 延遲控制 | 有限 | 完全控制 |
| 資料隱私 | 資料離開你的基礎設施 | 資料留在本地 |
| 模型選擇 | 供應商的模型 | 任何開源模型 |
| 客製化 | 透過 API 進行微調 | 完全控制 |

### 何時使用 API 供應商

```python
# Decision framework
def should_use_api(requirements: dict) -> bool:
    # Strong signals for API
    if requirements["time_to_market"] == "urgent":
        return True
    if requirements["query_volume"] < 100_000_per_month:
        return True
    if requirements["team_ml_expertise"] == "low":
        return True
    
    # Strong signals for self-hosted
    if requirements["data_residency"] == "strict":
        return False
    if requirements["latency_p99_ms"] < 100:
        return False
    if requirements["query_volume"] > 10_000_000_per_month:
        return False
    
    # Default to API for simplicity
    return True
```

### 自架選項

| 選項 | 複雜度 | 效能 | 使用情境 |
|--------|------------|-------------|----------|
| vLLM | 中 | 優異 | 生產環境服務 |
| TGI (HuggingFace) | 中 | 非常好 | HuggingFace 生態系 |
| TensorRT-LLM | 高 | 最佳（NVIDIA） | 最高效能 |
| Ollama | 低 | 好 | 開發、小規模 |
| llama.cpp | 低 | 好 | CPU 推論、邊緣 |

---

## 服務架構

### 單一模型服務

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Gateway   │────▶│  LLM Server │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │    Cache    │
                    └─────────────┘
```

### 多模型服務

```
                    ┌─────────────────────────────── │
                    │         Load Balancer          │
                    └───────────────┬────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
            ▼                       ▼                       ▼
    ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
    │  GPT-4 Pool   │       │  Claude Pool  │       │ Llama 70B Pool│
    │  (API calls)  │       │  (API calls)  │       │ (self-hosted) │
    └───────────────┘       └───────────────┘       └───────────────┘
```

### 模型路由模式

```python
class ModelRouter:
    def __init__(self):
        self.models = {
            "simple": GPT4oMini(),
            "complex": Claude35Sonnet(),
            "code": Claude35Sonnet(),
            "long_context": Gemini15Pro(),
            "vision": GPT4o()
        }
        self.classifier = QueryClassifier()
    
    async def route(self, request: Request) -> Response:
        # Classify request type
        request_type = self.classifier.classify(request)
        
        # Route to appropriate model
        model = self.models[request_type]
        
        # Execute with fallback
        try:
            return await model.generate(request)
        except RateLimitError:
            return await self.fallback(request, request_type)
    
    async def fallback(self, request: Request, original_type: str) -> Response:
        # Define fallback order
        fallbacks = {
            "simple": ["complex", "long_context"],
            "complex": ["simple"],
            "code": ["complex"]
        }
        
        for fallback_type in fallbacks.get(original_type, []):
            try:
                return await self.models[fallback_type].generate(request)
            except Exception:
                continue
        
        raise ServiceUnavailableError("All models unavailable")
```

---

## 擴展模式

### 水平擴展

```python
# Kubernetes HPA config for LLM service
hpa_config = """
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: llm-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: llm-service
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Pods
    pods:
      metric:
        name: requests_per_second
      target:
        type: AverageValue
        averageValue: 100
"""
```

### 自架的 GPU 擴展

| 規模 | GPU | 建議配置 |
|-------|------|-----------------|
| 開發／測試 | 1 | 單張 A10G 或 L4 |
| 小型生產 | 2-4 | 2x A100 搭配張量平行 |
| 中型生產 | 4-8 | 4x H100 搭配張量平行 |
| 大型生產 | 8+ | 多節點搭配管線平行 |

### 佇列式架構

適用於高吞吐量的非同步工作負載：

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Producers  │────▶│    Queue    │────▶│  Consumers  │
└─────────────┘     │  (Redis/    │     │  (LLM       │
                    │   SQS)      │     │   Workers)  │
                    └─────────────┘     └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  Results    │
                                        │  Store      │
                                        └─────────────┘
```

```python
class AsyncLLMProcessor:
    def __init__(self):
        self.queue = RedisQueue("llm_requests")
        self.results = RedisResults("llm_results")
    
    async def submit(self, request: Request) -> str:
        request_id = generate_id()
        await self.queue.enqueue({
            "id": request_id,
            "request": request.to_dict()
        })
        return request_id
    
    async def get_result(self, request_id: str, timeout: int = 300) -> Response:
        return await self.results.wait_for(request_id, timeout)
    
    # Worker process
    async def worker_loop(self):
        while True:
            job = await self.queue.dequeue()
            try:
                result = await self.llm.generate(job["request"])
                await self.results.store(job["id"], result)
            except Exception as e:
                await self.results.store_error(job["id"], str(e))
```

---

## 成本管理

### 成本追蹤

```python
class CostTracker:
    # Pricing as of December 2025 (verify current rates)
    PRICING = {
        "gpt-4o": {"input": 2.50, "output": 10.00},  # per 1M tokens
        "gpt-4o-mini": {"input": 0.15, "output": 0.60},
        "claude-3.5-sonnet": {"input": 3.00, "output": 15.00},
        "claude-3.5-haiku": {"input": 0.25, "output": 1.25},
    }
    
    def calculate_cost(
        self,
        model: str,
        input_tokens: int,
        output_tokens: int
    ) -> float:
        pricing = self.PRICING[model]
        input_cost = (input_tokens / 1_000_000) * pricing["input"]
        output_cost = (output_tokens / 1_000_000) * pricing["output"]
        return input_cost + output_cost
    
    def track(self, request_id: str, model: str, tokens: dict):
        cost = self.calculate_cost(
            model,
            tokens["input"],
            tokens["output"]
        )
        
        self.metrics.record(
            "llm_cost",
            cost,
            tags={"model": model, "request_id": request_id}
        )
        
        return cost
```

### 成本最佳化策略

| 策略 | 節省 | 實作方式 |
|----------|---------|----------------|
| 模型路由 | 50-80% | 將簡單查詢路由到便宜的模型 |
| 快取 | 30-70% | 快取常見查詢 |
| 提示最佳化 | 10-30% | 較短的提示、結構化輸出 |
| Batch API | 50% | 對非同步工作使用批次端點 |
| 自架 | 視情況 | 大規模時可能更便宜 |

### 預算告警

```python
class BudgetManager:
    def __init__(self, daily_budget: float, alert_threshold: float = 0.8):
        self.daily_budget = daily_budget
        self.alert_threshold = alert_threshold
    
    async def check_and_alert(self):
        today_cost = await self.get_today_cost()
        utilization = today_cost / self.daily_budget
        
        if utilization >= 1.0:
            await self.alert("CRITICAL: Daily budget exceeded", today_cost)
            # Consider enabling cost controls
            await self.enable_rate_limiting()
        elif utilization >= self.alert_threshold:
            await self.alert("WARNING: Approaching daily budget", today_cost)
    
    async def enable_rate_limiting(self):
        # Reduce throughput to stay within budget
        self.rate_limiter.set_rate(
            requests_per_minute=self.calculate_safe_rate()
        )
```

---

## 監控與告警

### 關鍵指標

```python
LLM_METRICS = {
    # Latency
    "ttft_seconds": "Time to first token",
    "total_latency_seconds": "Total request time",
    
    # Throughput
    "requests_per_second": "Request rate",
    "tokens_per_second": "Token generation rate",
    
    # Resources
    "gpu_utilization": "GPU compute usage",
    "gpu_memory_utilization": "GPU memory usage",
    "kv_cache_utilization": "KV cache usage",
    
    # Quality (sampled)
    "quality_score": "LLM-as-judge score",
    "faithfulness_score": "RAG faithfulness",
    
    # Errors
    "error_rate": "Failed requests percentage",
    "rate_limit_hits": "Rate limit rejections",
    
    # Cost
    "cost_per_request": "Average cost per request",
    "daily_cost": "Total daily spend"
}
```

### 告警設定

```yaml
alerts:
  - name: high_error_rate
    condition: error_rate > 0.05
    for: 5m
    severity: critical
    
  - name: high_latency
    condition: p99_latency > 10s
    for: 5m
    severity: warning
    
  - name: cost_spike
    condition: hourly_cost > 2 * avg_hourly_cost
    for: 1h
    severity: warning
    
  - name: quality_degradation
    condition: avg_quality_score < 3.5
    for: 30m
    severity: warning
    
  - name: gpu_memory_pressure
    condition: gpu_memory_utilization > 0.95
    for: 5m
    severity: warning
```

---

## 災難復原

### 多供應商故障轉移

```python
class MultiProviderClient:
    def __init__(self):
        self.providers = [
            OpenAIClient(),
            AnthropicClient(),
            GoogleClient()
        ]
        self.primary = 0
    
    async def generate(self, request: Request) -> Response:
        # Try primary provider first
        try:
            return await self.providers[self.primary].generate(request)
        except (RateLimitError, ServiceError) as e:
            return await self.failover(request, e)
    
    async def failover(self, request: Request, original_error: Exception) -> Response:
        for i, provider in enumerate(self.providers):
            if i == self.primary:
                continue
            try:
                response = await provider.generate(request)
                # Log failover for monitoring
                self.log_failover(self.primary, i, original_error)
                return response
            except Exception:
                continue
        
        raise AllProvidersUnavailable("All LLM providers failed")
```

### 優雅降級

```python
class GracefulDegradation:
    def __init__(self):
        self.cache = ResponseCache()
        self.fallback_responses = FallbackResponses()
    
    async def handle_outage(self, request: Request) -> Response:
        # Level 1: Try cache
        cached = await self.cache.get_similar(request.query)
        if cached and cached.similarity > 0.9:
            return Response(
                content=cached.response,
                metadata={"source": "cache", "degraded": True}
            )
        
        # Level 2: Try fallback responses
        fallback = self.fallback_responses.get(request.intent)
        if fallback:
            return Response(
                content=fallback,
                metadata={"source": "fallback", "degraded": True}
            )
        
        # Level 3: Graceful error
        return Response(
            content="I am currently experiencing issues. Please try again later or contact support.",
            metadata={"source": "error", "degraded": True}
        )
```

---

## 2026 年 5 月 AI 加速器版圖

在這波 AI 建置浪潮中，硬體格局在 2026 年 1 月到 5 月之間的變化速度，比過去任何時刻都快。各項產能宣布加總起來，是**超過一兆美元的承諾雲端支出**，而且供應鏈已不再是單一供應商。本節是一位資深架構師在 2026 年 5 月進行產能規劃對話時，應該隨身攜帶的快照。

### NVIDIA Blackwell Ultra（B300 / GB300 NVL72）

旗艦產品是 **B300**（"Blackwell Ultra"），自 2026 年 1 月起量產出貨（[NVIDIA 新聞室公告](https://nvidianews.nvidia.com/news/nvidia-blackwell-ultra-ai-factory-platform-paves-way-for-age-of-ai-reasoning)）。

| 規格 | B300 / GB300 NVL72 |
|------|---------------------|
| 每張 GPU 的 HBM3e | 288 GB |
| 峰值 FP4（稀疏） | 約 15 PFLOPS |
| 外型規格 | NVL72 機架：72 張 Blackwell Ultra GPU + 36 顆 Grace CPU |
| NVL72 中的 NVLink 總頻寬 | 約 130 TB/s |
| 每座 NVL72 的 HBM 總量 | 約 20 TB |
| 2026 年預計出貨機架數 | 約 60,000（Jensen Huang，GTC 2026 主題演講） |

策略訴求是「AI 工廠」：NVL72 被當作一個一致的、NVLink 網域的推論／訓練單元的最小單位來銷售，而非當作個別卡片。對於前沿模型訓練（Anthropic、OpenAI、Google 的對外工作）以及最大型的推理模型推論工作負載而言，這在 2026 年 5 月仍是預設選擇。

權衡取捨維持不變：最高的絕對效能、最高的絕對價格、最深的軟體鎖定。CUDA、NCCL 與 TensorRT-LLM 全都預設使用 NVIDIA。如果你圍繞它們做架構設計，你就已經被綁定了。

### AMD MI400 與 Helios 機架

[AMD 的 MI400](https://ir.amd.com/news-events/press-releases/detail/1252/amd-introduces-fifth-generation-instinct-mi400-series)（2025 年第四季宣布、2026 年第一季送樣、2026 年中正式上市）是可信的第二來源。

| 規格 | MI400 |
|------|-------|
| 記憶體 | HBM4，每張 GPU **432 GB** |
| 記憶體頻寬 | 約 20 TB/s |
| 峰值 FP4 | 約 13 PFLOPS |
| 機架方案 | **Helios**：EPYC Venice CPU、MI400 GPU、Pensando Vulcano 800Gb 網卡 |
| 軟體 | ROCm 7.x，對 PyTorch / vLLM / SGLang 提供一流支援 |

每張 GPU 的 432 GB 是重點：它比 B300 的 288 GB 高出 50% 以上。對於 MoE 服務（限制因素在於讓專家權重常駐）以及 KV cache 吃重的長上下文工作負載而言，每張 GPU 的記憶體優勢是真實的。AMD 也已經填補了大部分的軟體差距；ROCm 7.x 不再是 2023 年那樣的淘汰因素。開源服務框架現在例行性地在兩者上進行測試。

但有個陷阱：**生產環境部署成熟度**。NVIDIA 已連續兩個世代向每一家超大規模雲端業者大規模出貨；AMD 仍在供應鏈量產端爬坡。各超大規模業者（Meta、Microsoft、Oracle Cloud，以及值得注意的是用於非 Trainium 工作負載的 AWS Trainium 機隊）都在運行混合機隊。

### AWS Trainium3 與 Anthropic 的 $100B+ 交易

2025 年 11 月，Anthropic 與 AWS 宣布將運算產能擴充至**高達 5 GW**，期程貫穿整個 2026 年，以 Trainium 晶片為基礎，並被描述為一筆 **"$100B+" 的交易**（[AWS 新聞稿](https://press.aboutamazon.com/2025/11/anthropic-and-aws-announce-100-billion-strategic-partnership-investment-to-expand-trainium-compute-and-collaborate-on-ai-frontier-research)）。

關鍵數字：

| 規格 | Trainium3 |
|------|-----------|
| 製程節點 | 3nm |
| 配置 | **Trn3 UltraServer**，每套系統 **144 顆晶片** |
| 相對 T2 的峰值效能 | 在目標工作負載中 **約 4.4 倍** |
| 記憶體 | HBM3e |
| 網路 | UltraServer 內採用 NeuronLink；叢集之間採用 EFA |

策略上的意涵：AWS 現在擁有一個可信的、垂直整合的 AI 結構（Trainium 矽晶 + Annapurna 網路 + EC2 + Bedrock）。對於在 Anthropic 模型上以推論為主的工作負載，其性價比與 NVIDIA H200 等級硬體相當，並且正朝著在 2026 年底達到 B300 同等水準的方向改善。

限制條件：Trainium 運行的是 **AWS Neuron SDK**，而非 CUDA。移植一套技術堆疊意味著重建核心（kernel）、重新測試數值、並重新調校批次處理。大規模時值得，小規模時痛苦。

### Cerebras 首次公開募股（2026 年 5 月）

Cerebras 於 **2026 年 5 月 14 日**以 **每股 $185** 完成 IPO 定價，募得約 **$5.55B**，開盤高於 $190，首日收盤時估值接近 **約 $100B**（[CNBC 報導](https://www.cnbc.com/2026/05/14/cerebras-ipo-priced.html)；[The Register](https://www.theregister.com/2026/05/15/cerebras_ipo/)）。

它在市場上帶來的改變：

- **AWS 與 Cerebras 結盟**進行高吞吐量推論（[AWS / Cerebras 部落格文章](https://aws.amazon.com/blogs/machine-learning/cerebras-on-aws/)）。其訴求是用 Trainium3 服務 Anthropic 與其他內部工作負載，用 Cerebras 服務超低延遲的 Llama / OSS 工作負載。
- CS-3 晶圓級引擎仍是在 <50ms TTFT 下，對 **70B+ 模型進行單晶片、單副本推論**唯一可信的選項。
- 對於主要技術堆疊以 GPU 為基礎、又想在不移植的情況下取得延遲優勢的團隊而言，Cerebras Cloud API 一直被當作快速的第二來源使用。

這次 IPO 在結構上很重要，因為它改變了融資論述：現在出現了一條面向非 NVIDIA 推論供應商的公開市場路徑，這讓下一批進場者募資的成本更低。

### Tenstorrent Galaxy Blackhole

[Tenstorrent 的 Galaxy](https://tenstorrent.com/hardware/galaxy) 於 **2026 年 4 月 28 日**達到正式上市（[The Register](https://www.theregister.com/2026/04/28/tenstorrent_galaxy_ga/)；[EE Times](https://www.eetimes.com/tenstorrent-launches-blackhole-galaxy/)）。

| 規格 | Galaxy Blackhole |
|------|------------------|
| 每台伺服器 | **32 顆 Blackhole 晶片** |
| 每顆晶片 | RISC-V 核心、Tensix tile、無外部記憶體階層 |
| 峰值 BlockFP8 | 每台伺服器 **約 23 PFLOPS** |
| 記憶體 | LPDDR4X（晶片連接）+ 晶片內 SRAM |
| 標價 | 每台 32 晶片伺服器 **約 $110,000** |
| 架構 | 完全開放的 RISC-V 控制平面、開放韌體、開放編譯器 |

開源 RISC-V 的故事對兩類受眾很重要：

- 想要一套非 CUDA 技術堆疊、並能完整檢視韌體與工具鏈的**超大規模業者與主權雲（sovereign cloud）**。
- 在 CUDA 封閉部分碰壁、正在建構自訂核心的**研究實驗室**。

以每台伺服器 $110K 計算，對於某些工作負載，Galaxy 大約比同等的 NVIDIA 推論機架便宜一個數量級。它不是前沿訓練的競爭者。它是推論與小型微調的競爭者，在這些場景中，每美元的論點壓倒性地占優。

### Stargate 與雲端承諾的規模

產能故事不再只是關於晶片；而是關於圍繞它們的建築物。

- **Stargate**（OpenAI / Oracle / SoftBank 合資企業）已在整個計畫中承諾**約 1.4 兆美元的雲端總支出**（[OpenAI 公告頁面](https://openai.com/index/stargate-update/)）。
- 旗艦廠區位於**德州 Abilene**，截至 2026 年第一季已以 **1.2 GW** 上線，並在**七個已宣布的廠區**陸續興建數 GW 等級的擴充，合計約 **7 GW** 的規劃產能。
- 根據公開申報文件與公告，已有超過 **$400B** 投入或簽約用於這片基礎設施（Oracle FY26 第三季財報、[SoftBank 投資人資料](https://group.softbank/en/ir)）。

對資深工程師的架構意涵：前沿模型供應商的推論邊際成本，下降速度比公開 API 定價所顯示的更快。在 2026 年，由於底層建築物已經存在，現貨（spot）產能、離峰推論批次處理，以及多區域故障轉移全都變得更容易。

### 三層機隊策略

```mermaid
flowchart TD
    A[生產 AI 工作負載] --> B{主要的限制因素是什麼？}
    B -->|前沿訓練、最大 FLOPS、NVLink 一致性| C[第一層：訓練與重度運算]
    B -->|每 token 成本、吞吐量、MoE 服務| D[第二層：高吞吐量推論]
    B -->|邊緣、延遲、主權、開放堆疊| E[第三層：邊緣與特殊用途]

    C --> C1[B300 NVL72 機架]
    C --> C2[用於 MoE 訓練的 MI400 Helios 機架]

    D --> D1[用於 Anthropic 工作負載的 Trainium3 UltraServer]
    D --> D2[用於記憶體受限推論的 MI400]
    D --> D3[用於單副本低延遲的 Cerebras CS-3]

    E --> E1[用於低成本推論的 Tenstorrent Galaxy]
    E --> E2[用於裝置端的 Apple Silicon / 消費級 GPU]
    E --> E3[用於特定低延遲利基的 Groq LPU]
```

| 層級 | 服務對象 | 預設硬體 | 原因 |
|------|----------------|-------------------|-----|
| **第一層：訓練與重度運算** | 前沿模型訓練、推理吃重的推論、數兆參數的 MoE | **B300 NVL72**、**MI400 Helios** | 需要 NVLink 等級的一致性，以及可取得的最大 HBM 池 |
| **第二層：高吞吐量推論** | API 產品、RAG 後端、代理平台 | **Trainium3**、**MI400**、**Cerebras CS-3**、**B300** | 針對每 token 成本與可預測的 P99 進行最佳化，通常具備 MoE 感知能力 |
| **第三層：邊緣與特殊用途** | 延遲關鍵、主權、強制開源韌體、總支出低 | **Tenstorrent Galaxy**、**Apple Silicon**、消費級 GPU、**Groq LPU** | 性價比、開放堆疊、法規在地性 |

2026 年真正重要的框架：**沒有任何資深架構師會再圍繞單一供應商來設計一個正經的 AI 產品**。產能爭奪太激烈、價格變動太快，而且單一供應商技術堆疊內部的失效模式關聯性太高。多供應商是新的預設。

### 產能規劃的重點整理

- 規劃時要把**每個加速器的記憶體**看得跟 FLOPS 一樣重。MoE 服務的瓶頸在於專家常駐。
- 把 **CUDA 鎖定當作一項真實成本**來看待。ROCm 7.x 對大多數生產環境服務已經夠好。Neuron 對 Anthropic、以及任何願意投入移植工作的團隊已經夠好。開放的 RISC-V 對成本敏感的推論已經夠好。
- 現在超大規模業者的選擇驅動晶片選擇的程度，跟反過來一樣大。AWS = Trainium + Cerebras + 一些 NVIDIA。Microsoft = NVIDIA + Maia。Google = TPU + 一些 NVIDIA。Oracle = 大規模的 NVIDIA。
- 貫穿 2025 與 2026 年，**每 token 成本**大約以每年 3-5 倍的速度下降（[a16z State of AI Compute](https://a16z.com/state-of-ai-compute-2026/)）。以 2024 年價格簽訂的長期合約，現在通常比現貨更划不來。

---

## 面試問題

### Q：你會如何為每天 100 萬次 LLM 查詢設計基礎設施？

**優秀答案：**

「每天 100 萬次查詢，平均約是每秒 12 次查詢，尖峰可能高出 3-5 倍。以下是我的做法：

**架構：**
- 負載平衡器，分散到多個 API 端點
- 用於成本最佳化的模型路由（將簡單查詢路由到較便宜的模型）
- 用於常見查詢的 Redis 快取
- 用於非同步工作負載的佇列式處理

**在這個規模下，成本最佳化至關重要：**
- 將 60-70% 的簡單查詢路由到 GPT-4o-mini 或 Claude Haiku
- 實作語意快取（目標 30%+ 的快取命中率）
- 對非緊急請求使用 batch API（5 折優惠）
- 在這個用量下，自架會變得具備成本競爭力

**可靠性：**
- 具備自動故障轉移的多供應商配置
- 針對每位使用者的速率限制，以防止濫用
- 用於處理尖峰的佇列式架構
- 當供應商無法使用時的優雅降級

**監控：**
- 即時成本追蹤搭配預算告警
- 延遲百分位數（p50、p95、p99）
- 持續抽樣的品質指標
- 錯誤率與速率限制命中追蹤

以 100 萬次查詢、平均 2K token 計算，使用 GPT-4o 大約會花費 $25K/天。透過路由與快取，我可以把這降到 $5-8K/天。」

### Q：你何時會自架，何時會使用 API 供應商？

**優秀答案：**

「我的決策框架會考量幾個因素：

**在以下情況使用 API 供應商：**
- 用量低於每月 100 萬次查詢（成本交叉點）
- 上市時間至關重要
- 團隊缺乏 GPU 基礎設施專業
- 你想立即用到最新的模型
- 工作負載多變且難以預測

**在以下情況自架：**
- 資料不能離開你的基礎設施（合規、安全）
- 用量超過每月 1,000 萬次查詢（顯著節省）
- 你需要低於 100ms P99 的延遲
- 你需要自訂模型權重或微調
- 你想完全控制模型行為

**混合做法通常效果最好：**
- 對高用量、可預測的工作負載自架
- 對尖峰與特殊模型使用 API
- 用 API 作為自架失效時的後備

自架的隱藏成本：GPU 採購／租用、營運的工程時間、模型更新、監控基礎設施。至少要把 1-2 名專責基礎設施的工程師算進去。」

---

## 參考資料

- vLLM: https://docs.vllm.ai/
- TensorRT-LLM: https://github.com/NVIDIA/TensorRT-LLM
- Text Generation Inference: https://huggingface.co/docs/text-generation-inference
- OpenAI Pricing: https://openai.com/pricing
- Anthropic Pricing: https://www.anthropic.com/pricing

---

*下一篇：[LLM 應用的 CI/CD](02-cicd.md)*
