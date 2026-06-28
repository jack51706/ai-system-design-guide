# 推論管線

本章涵蓋 LLM 在推論時如何生成文字、過程中牽涉的運算階段，以及生產環境服務的關鍵指標。

## 目錄

- [生成基礎](#generation-basics)
- [Prefill 與 Decode 階段](#prefill-and-decode-phases)
- [採樣策略](#sampling-strategies)
- [停止條件](#stopping-conditions)
- [潛在最佳化：推測解碼](#speculative-decoding)
- [延遲指標與 TTFT vs. TPS](#latency-metrics)
- [記憶體與運算需求](#memory-and-compute-requirements)
- [連續批次處理與前綴快取](#continuous-batching-and-prefix-caching)
- [Multi-LoRA 服務](#multi-lora-serving)
- [串流](#streaming)
- [生產環境考量](#production-considerations)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 生成基礎

LLM 以自迴歸方式生成文字：一次一個 token，使用所有先前的 token 作為上下文。

```
Input: "The quick brown"
Step 1: Generate "fox" -> "The quick brown fox"
Step 2: Generate "jumps" -> "The quick brown fox jumps"
Step 3: Generate "over" -> "The quick brown fox jumps over"
...
```

### 生成迴圈

```python
def generate(prompt: str, max_tokens: int, model) -> str:
    tokens = tokenize(prompt)
    
    for _ in range(max_tokens):
        # Forward pass: get logits for next token
        logits = model.forward(tokens)
        
        # Sample next token from probability distribution
        next_token = sample(logits[-1])
        
        # Check for stop condition
        if next_token == EOS_TOKEN:
            break
        
        tokens.append(next_token)
    
    return detokenize(tokens)
```

---

## Prefill 與 Decode 階段

推論有兩個特性各異的明確階段：

### Prefill 階段

以平行方式處理整個輸入提示。

```
Input: "The quick brown fox" (4 tokens)

Prefill:
- Process all 4 tokens simultaneously
- Compute attention across all pairs
- Populate KV cache for all positions
- Output: logits for next token
```

**特性：**
- 運算受限（大量矩陣運算）
- 可跨 token 平行化
- 時間隨提示長度而擴展
- 每次生成只發生一次

### Decode 階段

一次生成一個 token。

```
Decode step 1:
- Input: new token position only
- Attend to all KV cache (prompt + previously generated)
- Generate one token

Decode step 2:
- Append new K, V to cache
- Input: newest token position
- Generate next token

...repeat until done
```

**特性：**
- 記憶體受限（從 HBM 載入 KV cache）
- 循序（必須完成每一步才能開始下一步）
- 每個 token 的時間大致固定
- 重複直到滿足停止條件

### 為何這很重要

| 階段 | 瓶頸 | 最佳化 |
|-------|------------|--------------|
| Prefill | 運算（GPU 核心） | Flash Attention、更好的 GPU |
| Decode | 記憶體頻寬 | GQA、批次處理、量化 |

**對服務的影響：**
- 長提示會增加 prefill 時間（影響 TTFT）
- 長生成會增加 decode 時間（影響總延遲）
- 批次處理對 decode 效率的幫助大於 prefill

---

## 採樣策略

計算出 logits 之後，我們需要選擇下一個 token。不同策略會產生不同的輸出。

### 貪婪解碼（Greedy Decoding）

永遠挑選機率最高的 token：

```python
def greedy_sample(logits):
    return torch.argmax(logits)
```

**特性：**
- 確定性
- 長生成時常常重複
- 適合事實性／結構化輸出

### 溫度採樣（Temperature Sampling）

在 softmax 之前縮放 logits，以控制隨機性：

```python
def temperature_sample(logits, temperature=1.0):
    scaled_logits = logits / temperature
    probs = torch.softmax(scaled_logits, dim=-1)
    return torch.multinomial(probs, num_samples=1)
```

**溫度的影響：**

| 溫度 | 行為 | 使用情境 |
|-------------|----------|----------|
| 0 | 貪婪（確定性） | 事實性問答、程式碼 |
| 0.3-0.7 | 低隨機性 | 一般任務 |
| 1.0 | 基準線 | 創意寫作 |
| 1.5+ | 高隨機性 | 腦力激盪 |

### Top-K 採樣

只考慮機率最高的 K 個 token：

```python
def top_k_sample(logits, k=50):
    values, indices = torch.topk(logits, k)
    probs = torch.softmax(values, dim=-1)
    sampled_idx = torch.multinomial(probs, num_samples=1)
    return indices[sampled_idx]
```

**效果：** 過濾掉可能毫無意義的低機率 token。

### Top-P（Nucleus）採樣

納入 token 直到累積機率超過 P：

```python
def top_p_sample(logits, p=0.9):
    sorted_probs, sorted_indices = torch.sort(
        torch.softmax(logits, dim=-1), descending=True
    )
    cumulative_probs = torch.cumsum(sorted_probs, dim=-1)
    
    # Find cutoff
    cutoff_idx = torch.searchsorted(cumulative_probs, p)
    
    # Sample from truncated distribution
    selected_probs = sorted_probs[:cutoff_idx + 1]
    selected_probs = selected_probs / selected_probs.sum()
    sampled_idx = torch.multinomial(selected_probs, num_samples=1)
    
    return sorted_indices[sampled_idx]
```

**相較於 Top-K 的優勢：** 根據機率分布動態調整。高信心的預測納入較少的 token；不確定的預測納入較多的 token。

### 常見配置

| 使用情境 | 溫度 | Top-P | Top-K |
|----------|-------------|-------|-------|
| 程式碼生成 | 0-0.2 | 0.95 | - |
| 事實性問答 | 0.1-0.3 | 1.0 | - |
| 一般聊天 | 0.7 | 0.9 | - |
| 創意寫作 | 1.0 | 0.95 | - |
| 腦力激盪 | 1.2 | 1.0 | - |

### 重複懲罰（Repetition Penalties）

降低近期生成 token 的機率：

```python
def apply_repetition_penalty(logits, generated_tokens, penalty=1.2):
    for token_id in set(generated_tokens):
        logits[token_id] /= penalty
    return logits
```

**變體：**
- 存在懲罰（Presence penalty）：懲罰所有出現過的 token
- 頻率懲罰（Frequency penalty）：依出現次數成比例懲罰

---

## 停止條件

生成會持續進行，直到滿足某個停止條件：

### EOS Token

模型生成序列結束（end-of-sequence）token：

```python
if next_token == tokenizer.eos_token_id:
    break
```

### 最大 token 數

對生成長度的硬性限制：

```python
for i in range(max_tokens):
    # generate...
```

### 停止序列（Stop Sequences）

用來終止生成的自訂字串：

```python
stop_sequences = ["###", "\n\n", "Human:"]

for seq in stop_sequences:
    if output.endswith(seq):
        output = output[:-len(seq)]
        break
```

## 潛在最佳化：推測解碼（Speculative Decoding）

**目前高頻寬服務的標準做法。**

推測解碼使用較小的「草稿模型（draft model）」在單一步驟中預測多個未來 token，接著由較大的「目標模型（target model）」以平行方式驗證。

```
Draft Model (Small): Predicts 5 tokens -> "The", "quick", "brown", "fox", "jumps"
Target Model (Large): Verifies all 5 tokens in ONE forward pass.
Result: If target agrees on 4 tokens, we've generated 4 tokens for the cost of 1 large forward pass.
```

| 方法 | 做法 | 加速 | 範例 |
|--------|----------|---------|---------|
| 草稿模型 | 小模型（例如 1B）+ 大模型（70B） | 2x-3x | vLLM、TGI |
| **Medusa Heads** | 同一模型上的多個 LM head | 1.5x-2x | Medusa、Eagle |
| Prompt Lookup | 使用提示中的子字串作為推測 | 1.2x | RAG／程式碼補全 |

---

## 延遲指標

### 首 token 時間（Time to First Token, TTFT）

從請求到第一個生成 token 的時間。

```
TTFT = network_latency + queue_time + prefill_time
```

**哪些因素影響 TTFT：**
- 提示長度（prefill 為 O(n)）
- 模型大小
- GPU 速度
- 佇列深度

**目標值：**
- 互動式聊天：< 500ms
- 即時：< 200ms
- 批次：較不關鍵

### 每秒 token 數（Tokens Per Second, TPS）

第一個 token 之後的 token 生成速率。

```
TPS = (total_tokens - 1) / (total_time - TTFT)
```

**哪些因素影響 TPS：**
- 模型大小
- 批次大小
- GPU 記憶體頻寬
- KV cache 大小

**典型值：**
- Llama 70B 在 H100 上：每個請求 30-50 tokens/sec
- 透過 API 的 GPT-4：20-80 tokens/sec（不一定）
- 小模型（7B）：100+ tokens/sec

### 總延遲

```
Total = TTFT + (output_tokens / TPS)
```

**範例：**
- TTFT：200ms
- TPS：50 tokens/sec
- 輸出：100 tokens
- 總計：200ms + 2000ms = 2.2s

### 吞吐量

每單位時間完成的請求數：

```
Throughput = concurrent_requests * TPS / average_output_tokens
```

較大的批次大小會增加吞吐量，但可能增加每個請求的延遲。

---

## 記憶體與運算需求

### 模型權重

```
Memory = parameters * bytes_per_parameter

70B model in FP16:
= 70B * 2 bytes
= 140 GB

70B model in INT4:
= 70B * 0.5 bytes
= 35 GB
```

### KV Cache

```
Per token: 2 * layers * heads * head_dim * bytes
Per request: per_token * sequence_length

Llama 70B (80 layers, 64 heads, 128 dim, FP16):
= 2 * 80 * 64 * 128 * 2 bytes
= 2.6 MB per token

At 4K context: 10.5 GB per request
At 8K context: 21 GB per request
```

### GPU 總記憶體

```
Total = model_weights + kv_cache * batch_size + activations

Example: Llama 70B serving
- Weights (INT4): 35 GB
- KV cache (8K, batch 4): 84 GB
- Activations: ~5 GB
- Total: ~124 GB (fits on 2x H100 80GB)
```

### 每 token 的 FLOPs

```
Forward pass FLOPs ≈ 2 * parameters

70B model:
≈ 140 TFLOPs per token

At 40 tokens/sec:
≈ 5.6 PFLOPs sustained
```

---

## 串流

對於互動式應用，隨著 token 生成即時串流：

### 伺服器端事件（Server-Side Events, SSE）

```python
# Server
async def generate_stream(prompt: str):
    for token in model.generate_iter(prompt):
        yield f"data: {json.dumps({'token': token})}\n\n"
    yield "data: [DONE]\n\n"

# Client
async for event in sse_client.stream("/generate"):
    token = json.loads(event.data)["token"]
    display(token)
```

### 好處

| 面向 | 串流 | 非串流 |
|--------|-----------|---------------|
| 感知延遲 | 僅 TTFT | 完整生成時間 |
| 使用者體驗 | 漸進式 | 等待，然後一次完成 |
| 提早終止 | 使用者可停止 | 必須等待 |
| 記憶體 | 較低 | 較高（緩衝回應） |

### 實作細節

- 每個 token 之後立即 flush
- 妥善處理連線中斷
- 對於非常快速的生成，考慮加入緩衝
- 有些框架預設會緩衝；串流時請停用

---

## 生產環境考量

### 為吞吐量而批次處理

合併多個請求以最大化 GPU 使用率：

```python
# Without batching: GPU underutilized
for request in requests:
    response = model.generate(request)

# With batching: parallel processing
batch = collect_requests(timeout=10ms, max_batch=32)
responses = model.generate_batch(batch)
```

### 連續批次處理與前綴快取

**連續批次處理（迭代層級排程，Iteration-level Scheduling）：**
與靜態批次處理不同，連續批次處理會在批次中任一請求遇到 EOS token 時立即注入新請求。這可將吞吐量提升最多 20 倍。

**前綴快取（Prefix Caching，RAD-O）：**
快取常見前綴（例如系統提示、few-shot 範例）的 KV 張量。
- **TTFT 降低**：90%
- **機制**：使用前綴的雜湊值，在 GPU 記憶體的 LRU 快取中查找 KV 張量。

### Multi-LoRA 服務

**情境：** 在單一基礎模型上服務 1000 個不同的微調模型（adapter）。
**挑戰：** 載入 1000 個獨立模型會佔用數 TB 的 VRAM。

**解決方案（LoRAX／S-LoRA）：**
1. 在 VRAM 中載入一個基礎模型。
2. 將 LoRA adapter（數 MB）存放在主機 RAM 或 SSD 中。
3. 在 forward pass 期間，依請求 ID 動態切換 adapter。
4. **實作**：使用專用核心（S-LoRA），在同一批次中為多個不同的 adapter 執行矩陣與向量乘法。

### 請求優先排序

```python
class RequestQueue:
    def __init__(self):
        self.high_priority = asyncio.Queue()
        self.low_priority = asyncio.Queue()
    
    async def get_next(self):
        if not self.high_priority.empty():
            return await self.high_priority.get()
        return await self.low_priority.get()
```

**優先順序標準：**
- 客戶層級
- 請求類型
- 等待時間
- 預估運算成本

### 逾時處理

```python
async def generate_with_timeout(prompt: str, timeout: float):
    try:
        result = await asyncio.wait_for(
            model.generate(prompt),
            timeout=timeout
        )
        return result
    except asyncio.TimeoutError:
        return {"error": "timeout", "partial": partial_output}
```

### 優雅降級（Graceful Degradation）

```python
async def generate_with_fallback(prompt: str):
    try:
        return await primary_model.generate(prompt)
    except RateLimitError:
        return await fallback_model.generate(prompt)
    except TimeoutError:
        return await small_fast_model.generate(prompt)
```

### 成本追蹤

```python
@dataclass
class RequestMetrics:
    input_tokens: int
    output_tokens: int
    model: str
    latency_ms: float
    cost_usd: float

def calculate_cost(metrics: RequestMetrics) -> float:
    pricing = {
        "gpt-4o": {"input": 2.50, "output": 10.00},
        "gpt-4o-mini": {"input": 0.15, "output": 0.60},
    }
    rates = pricing[metrics.model]
    return (
        (metrics.input_tokens / 1_000_000) * rates["input"] +
        (metrics.output_tokens / 1_000_000) * rates["output"]
    )
```

---

## 面試問題

### Q：說明 prefill 與 decode 階段的差異。

**有力的回答：**
LLM 推論有兩個明確的階段：

**Prefill：**
- 一次處理整個輸入提示
- 所有 token 以平行方式互相 attend
- 為所有提示位置填充 KV cache
- 運算受限：能有效利用 GPU 核心
- 時間隨提示長度而擴展

**Decode：**
- 一次生成一個 token
- 新 token 對所有 KV cache 條目進行 attend
- 將新的 K、V 附加到 cache
- 記憶體受限：受載入 KV cache 的瓶頸限制
- 每個 token 的時間大致固定

這對系統設計很重要，因為：
- 長提示會增加 TTFT（prefill 密集）
- 批次處理對 decode 的幫助大於 prefill
- 每個階段有不同的最佳化策略

### Q：溫度與 top-p 如何影響生成？

**有力的回答：**
兩者都控制 token 選擇的隨機性：

**溫度（Temperature）：**
- 在 softmax 之前縮放 logits
- 低（0-0.3）：較確定，挑選高機率 token
- 高（1.0+）：較隨機，使機率分布變得平坦
- 零：貪婪解碼

**Top-p（nucleus 採樣）：**
- 過濾出累積機率 > p 的最小 token 集合
- 根據分布動態調整截斷點
- 高信心：考慮較少 token
- 低信心：考慮較多 token

典型的生產環境設定：
- 事實性問答：溫度 0.1、top-p 0.95
- 一般聊天：溫度 0.7、top-p 0.9
- 創意：溫度 1.0+、top-p 0.95

關鍵洞見是這兩者相輔相成。溫度重塑分布；top-p 截斷分布。

### Q：什麼決定了 TTFT 與 TPS？

**有力的回答：**
**TTFT（首 token 時間）：**
- 到達伺服器的網路延遲
- 佇列等待時間
- Prefill 運算時間
- 主導因素：提示長度、GPU 運算速度

**TPS（每秒 token 數）：**
- Decode 階段效率
- 載入 KV cache 的記憶體頻寬
- 主導因素：記憶體頻寬、批次大小、模型大小

最佳化策略各不相同：
- TTFT：盡可能縮減提示、使用更快的網路、減少佇列
- TPS：增加批次大小、使用 GQA／MQA 模型、最佳化記憶體存取

權衡取捨：批次處理能改善 TPS（吞吐量），但如果請求需要等待批次組成，可能會增加 TTFT（延遲）。

### Q：你會如何估算服務一個模型所需的 GPU？

**有力的回答：**
三大記憶體消耗來源：

1. **模型權重：**
   - FP16：parameters * 2 bytes
   - INT8：parameters * 1 byte
   - INT4：parameters * 0.5 bytes

2. **KV cache：**
   - 每 token：2 * layers * kv_heads * head_dim * 2 bytes（FP16）
   - 每請求：per_token * sequence_length
   - 總計：per_request * batch_size

3. **激活值（Activations）：** 通常為 5-10% 的額外負擔

Llama 70B 服務的範例：
- 權重（INT4）：35 GB
- KV cache（8K 上下文、batch 8）：168 GB
- 需求：總計約 200 GB

硬體選項：
- 3x A100 80GB，搭配張量平行
- 2x H100 80GB，搭配張量平行
- 8x A100 40GB，搭配更多平行

接著透過基準測試驗證吞吐量是否符合需求。

---

## 參考資料

- Holtzman et al. "The Curious Case of Neural Text Degeneration"（nucleus 採樣，2020）
- Kwon et al. "Efficient Memory Management for Large Language Model Serving with PagedAttention"（vLLM，2023）
- [vLLM Documentation](https://docs.vllm.ai/)
- [TensorRT-LLM](https://github.com/NVIDIA/TensorRT-LLM)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)

---

*上一篇：[嵌入與向量空間](05-embeddings-and-vector-spaces.md) | 下一篇：[模型分類](../02-model-landscape/01-model-taxonomy.md)*
