# Model Selection Guide

A practical framework for choosing the right LLM for your use case, considering capability, cost, latency, and operational factors.

## Table of Contents

- [Selection Framework](#selection-framework)
- [Capability Comparison](#capability-comparison)
- [Use Case Mapping](#use-case-mapping)
- [Cost Analysis](#cost-analysis)
- [Operational Considerations](#operational-considerations)
- [Multi-Model Strategies](#multi-model-strategies)
- [Interview Questions](#interview-questions)
- [References](#references)

---

## Selection Framework

### Decision Tree (June 2026)

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

### Key Selection Factors

| Factor | Weight | Considerations |
|--------|--------|----------------|
| **Agentic Reliability** | High | Tool-calling accuracy, multi-step planning |
| **Context Recall** | High | Needle-in-a-haystack performance at 1M+ |
| **Rate Limit Ceiling** | High | **(Principal Nuance)**: Can the provider handle your P99 throughput without 429 errors? |
| **Ecosystem Maturity** | High | Production track record, SDK support, and Enterprise SLA |
| **Cost / Output Token** | Medium | Agentic loops consume 5x-10x more tokens |

---

## Capability Comparison

### Frontier Model Comparison (June 2026)

| Model | Strengths | Cons | Context | Best For |
|-------|-----------|------|---------|----------|
| **Claude Fable 5** | Most capable widely released model; Mythos-class capability with safeguards; always-on adaptive thinking; SOTA vision; sustains the longest autonomous runs | 2x Opus 4.8 price ($10/$50); under 5% of sessions fall back to Opus 4.8 on sensitive topics; 30-day data retention | 1M | Capability-ceiling work: hardest reasoning, vision, longest-horizon agents |
| **Claude Opus 4.8** | Long-running agentic coding (SWE-bench 88.6%), Dynamic Workflows with parallel subagents, $10/$50 fast mode | GPT-5.5 narrowly leads single-shot SWE-bench; Fable 5 now sits above it on capability | 1M | Codebase-scale migrations, autonomous coding loops, best price-to-capability at the frontier |
| **GPT-5.5** | SWE-bench Verified leader (88.7%), Terminal-Bench leader (78.2%), native omni multimodal | High cost ($5/$30) | 1M | Multi-agent systems, single-shot coding |
| **Claude Opus 4.7** | Predecessor flagship (SWE-bench 87.6%, SWE-Bench Pro 64.3%) | Superseded by 4.8 at same price | 1M | Existing 4.7 deployments without migration pressure |
| **Claude Sonnet 4.6** | Strong cost/quality balance, full 1M at standard price | No Sonnet 4.8 release yet | 1M | General production workhorse |
| **Gemini 3.1 Pro** | GPQA Diamond leader (94.3%), 1M multimodal, Deep Think mode | Latency spikes on Deep Think | 1M | Scientific reasoning, multimodal |
| **DeepSeek-R1** | Open-source reasoning, competitive math | Reasoning only; non-frontier general use | 128K | Math, complex debug, open-weight reasoning |

### Budget Model Comparison

| Model | Cost (per 1M input/output) | Quality | Context | Best For |
|-------|----------------------------|---------|---------|----------|
| **Gemini 3 Flash** | $0.05 / $0.20 | Frontier-tier | 1M | High-volume RAG |
| **o4-mini** | $0.10 / $0.40 | Excellent | 128K | Fast reasoning tasks |
| **Llama 4 8B** | Self-hosted (H100/L40) | Strong | 128K | On-device, private |

### Open Source Models

| Model | Parameters | Quality | Best For |
|-------|------------|---------|----------|
| **Llama 4 70B** | 70B | Frontier-competitive | Universal open choice |
| **Nemotron 3 Ultra** | 500B MoE | Agentic mastery | Scalable open agents |
| **DeepSeek V3.2** | 671B MoE | Ultra performance | Lowest TCO for frontier quality |

---

## Use Case Mapping

### By Application Type (June 2026)

| Use Case | Recommended Models | Rationale |
|----------|-------------------|-----------|
| **Capability-ceiling research / hardest problems** | Claude Fable 5 | Mythos-class capability, generally available; route only ceiling-bound work to it at $10/$50 |
| **Autonomous Dev** | Claude Opus 4.8 with Dynamic Workflows, Claude Sonnet 4.6 | Parallel-subagent runs in Claude Code; top SWE-Bench Pro at 69.2% |
| **Enterprise RAG** | Gemini 3.1 Pro, Gemini 3.1 Flash, DeepSeek V4 Flash | 1M context and aggressive cache discounts remove retrieval complexity |
| **Customer Support** | Gemini 3.1 Flash, GPT-5.5-mini, Claude Haiku 4.5 | Near-zero latency with strong reasoning |
| **Reasoning / Debug** | GPT-5.5 reasoning, Claude Opus 4.8 (thinking), DeepSeek-R1 | Best at hidden-CoT for code and logic |
| **Video / Multimodal** | Gemini 3.1 Pro, GPT-5.5, Claude Opus 4.8 | Native interleaved multimodal processing |
| **Private Agent** | Llama 4 Maverick, DeepSeek V4 Pro (open weights) | Strongest open-weight agentic planning |

### By Constraint

| Constraint | Approach |
|------------|----------|
| **Max latency < 100ms** | Gemini 3.1 Flash, GPT-5.5-mini, Claude Haiku 4.5, or self-hosted Nano models |
| **Context > 1M tokens** | Claude Fable 5 / Opus 4.8 / Opus 4.7 / Sonnet 4.6, Gemini 3.1 Pro, GPT-5.5, Llama 4 Scout (10M) |
| **Zero-data Leakage** | Llama 4 70B, DeepSeek V4 Pro on internal VPC |
| **Complex Tool Use** | Claude Opus 4.8 or GPT-5.5 (best planning accuracy) |

---

## Cost Analysis

### Cost Modeling (June 2026)

| Model | Input / 1M | Output / 1M | Notes |
|-------|------------|-------------|-------|
| **Claude Fable 5** | $10.00 | $50.00 | Capability ceiling; 2x Opus 4.8; reserve for ceiling-bound work |
| **Claude Opus 4.8** | $5.00 | $25.00 | Frontier coding and agentic; optional fast mode $10 / $50 |
| **Claude Opus 4.7** | $5.00 | $25.00 | Same standard price; fast mode is the more expensive $30 / $150 |
| **GPT-5.5** | $5.00 | $30.00 | Single-shot SWE-bench leader |
| **Claude Sonnet 4.6** | $3.00 | $15.00 | Balanced choice; no Sonnet 4.8 release yet |
| **Gemini 3.1 Pro** | $2.00 | $12.00 | Best value frontier; multimodal |
| **DeepSeek V4 Pro** | $0.435 | $0.87 | 75% discount made permanent May 22 |
| **Gemini 3.1 Flash** | $0.10 | $3.00 | RAG-at-scale; cache discount |
| **DeepSeek V4 Flash** | $0.14 | $0.28 | Cheapest frontier-class 1M context |

### Cost Comparison Example

Assume 1M queries/month, 1K input tokens + 500 output tokens per query:

| Volume | GPT-5.5 | Claude Sonnet | Gemini 3 Pro | Gemini 3 Flash |
|--------|---------|---------------|--------------|----------------|
| 10K queries/mo | $150 | $105 | $37.50 | $1.50 |
| 1M queries/mo | $15,000 | $10,500 | $3,750 | $150 |

*Insight: DeepSeek V4 Flash ($0.14 / $0.28) and Gemini 3.1 Flash ($0.10 / $3.00) have effectively commoditized RAG, making long-context processing cheaper than traditional vector search infra at scale.*

---

## Operational Considerations

### Rate Limits and Quotas

| Provider | Tier | RPM | TPM |
|----------|------|-----|-----|
| OpenAI (Tier 1) | Basic | 500 | 30K |
| OpenAI (Tier 5) | Enterprise | 10K | 10M |
| Anthropic (Tier 1) | Basic | 50 | 40K |
| Anthropic (Tier 4) | Enterprise | 4K | 400K |

### Reliability Patterns

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

### Abstraction Layer

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

## Multi-Model Strategies

### Model Routing

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

### Cascade Pattern (2025 Refinement)

**The Logic**: Never use a 70B model for a task a 1B model can do. Use a "Router" to score confidence.

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

**Principal-level Tip:** Implement "Semantic Fallback" where you don't just retry the same model on error, but immediately jump to a larger model or a different provider (OpenAI -> Anthropic) to avoid correlated failures.

---

## Interview Questions

### Q: How do you choose between GPT-4o, Claude, and Gemini for a production application?

**Strong answer:**

"My selection depends on specific requirements:

**For most production workloads**, I default to Claude 3.5 Sonnet or GPT-4o. Both are excellent general-purpose models. Sonnet has a slight edge on coding, GPT-4o has better ecosystem integration.

**For long-context applications**, Gemini 1.5 Pro is the clear winner with 1-2 million token context. If I need to process entire codebases or very long documents, Gemini is my choice.

**For cost-sensitive high-volume**, GPT-4o-mini or Claude Haiku. These are 10-20x cheaper and handle straightforward tasks well.

**My practical approach:**
1. Prototype with Sonnet or GPT-4o to validate the use case
2. Evaluate on MY specific task, not just benchmarks
3. Build abstraction layer so I can switch easily
4. Optimize costs by routing simpler requests to cheaper models

I never rely solely on benchmark scores. A model that ranks lower on MMLU might excel on my domain."

### Q: When would you self-host vs use API providers?

**Strong answer:**

"It is a tradeoff of control vs operational burden.

**Use APIs when:**
- Volume under 1M queries/month (cost crossover)
- Need latest models immediately
- Team lacks GPU infrastructure expertise
- Variable workload hard to capacity plan
- Time-to-market is critical

**Self-host when:**
- Data cannot leave infrastructure (compliance)
- Volume exceeds 10M queries/month (cost savings)
- Need latency under 100ms P99
- Need custom model weights or fine-tuning
- Full control over model behavior

**Hybrid often works best:**
- Self-host for high-volume predictable workloads
- API for spikes and specialized models
- API as fallback when self-hosted fails

Hidden costs of self-hosting: GPU procurement, engineering time, model updates, monitoring. Factor in 1-2 dedicated engineers for infrastructure."

---

## References

- OpenAI API: https://platform.openai.com/
- Anthropic API: https://docs.anthropic.com/
- Google AI: https://ai.google.dev/
- LMSys Leaderboard: https://chat.lmsys.org/

---

*Next: [Fine-Tuning Guide](../03-training-and-adaptation/02-fine-tuning-strategies.md)*
