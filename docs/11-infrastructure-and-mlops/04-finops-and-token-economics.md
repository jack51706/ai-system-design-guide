# FinOps and Token Economics

This chapter is about the **economics and discipline** of running LLMs at scale: how to model, attribute, budget, and structurally reduce AI spend. It is not a rehash of inference internals; for the tactical levers (quantization, batching, speculative decoding, KV cache) see [Cost Optimization Playbook](../04-inference-optimization/07-cost-optimization-playbook.md) and the [inference chapters](../04-inference-optimization/01-inference-fundamentals.md).

The anchor finding that frames the whole chapter, from Datadog's 2026 State of AI Engineering: **system prompts are about 69% of input tokens, yet only about 28% of calls use prompt caching.** The single largest, lowest-effort cost lever in most production stacks is sitting unused. AI products also run as a cost-of-goods business, not zero-marginal-cost SaaS, so margin thinking is now an engineering concern.

## Table of Contents

- [The Cost Model](#the-cost-model)
- [Caching: The Top Cost Lever](#caching-the-top-cost-lever)
- [Batch and Async Economics](#batch-and-async-economics)
- [The FinOps Discipline](#the-finops-discipline)
- [Structural Cost Decisions](#structural-cost-decisions)
- [Cost Anti-Patterns](#cost-anti-patterns)
- [Interview Questions](#interview-questions)
- [References](#references)

---

## The Cost Model

Pricing is quoted per million tokens, split input versus output, and **output costs materially more than input**, commonly 3-5x and sometimes more, because generation is autoregressive and compute-bound while input is a parallel prefill pass. (Current per-model prices live in [Pricing and Costs](../02-model-landscape/03-pricing-and-costs.md); they deflate fast, so model the *structure*, not the cents.)

Every request decomposes into stacked spend layers. Modeling each separately is what makes cost predictable and attributable:

| Layer | Driven by | Behavior | Primary lever |
|-------|-----------|----------|---------------|
| System prompt / instructions | Fixed scaffolding, tool defs, few-shot | ~69% of input tokens; paid every call if uncached | Prompt caching |
| Retrieved / context tokens | RAG chunks, injected docs, long context | Scales with k and chunk size; can dwarf everything | RAG vs long context; chunk budgeting |
| Conversation / memory | Chat history, agent scratchpad | Grows unbounded without summarization | Windowing, summarization, compaction |
| Model tier | Frontier vs mid vs small/self-host | 10-100x spread across tiers | Right-sizing, cascades, routing |
| Output length | Verbosity, format, max_tokens | Billed at the higher output rate | `max_tokens` caps, terse output contracts |
| Reasoning / thinking tokens | Extended-thinking modes | Billed at output rate, invisible in the response | Gate thinking by task complexity |
| Retry / overhead | Transient errors, guardrail re-runs | Multiplies on failure | Bounded retries, circuit breakers |
| Agent multi-step | Plan-act-observe loops, sub-agents | Multiplies the whole stack per step | Step ceilings, per-run budgets |

**Reasoning models and agents are cost multipliers, and the two worst because they are invisible.** Extended-thinking tokens are billed at the output rate but do not appear in the response, so a "short" call can cost an order of magnitude more than its visible output suggests; reported analyses put the multiplier anywhere from ~3x to ~15x depending on the task. Agents multiply the *entire* token stack on every step, so the right unit of measurement is **cost per task, not cost per call**. Reported bands: a chat turn is cents, while an agentic multi-step task can run from tens of cents to several dollars.

A teachable cost-per-request formula:

```
cost = Σ(layer_input_tokens × in_rate) + (output_tokens + reasoning_tokens) × out_rate
cost_per_task = cost_per_request × expected_steps × (1 + retry_rate)
```

with caching applied as a discount on the cacheable input fraction.

---

## Caching: The Top Cost Lever

This is the headline lever precisely because of the anchor stat: the layer that is ~69% of input tokens (the system prompt) is static and ideal for caching, yet only ~28% of calls cache it. The gap between potential and actual is the biggest, cheapest saving available.

**Provider prefix caching** lets you pay a steep discount on a repeated prompt prefix. The discounts are reported in the range of roughly 50% (OpenAI, automatic above a threshold, no write fee) to ~90% (Anthropic, explicit `cache_control` breakpoints with a small write premium that breaks even after a couple of reads) to ~75% (Google). The crucial caveat to state plainly when teaching: the headline "50-95% savings" applies to the **cached prefix only**, not the whole bill.

How to actually capture it (the discipline):
- **Order prompts static to dynamic.** Put system instructions, tool definitions, and few-shot examples first (the stable prefix), and the user query last. Exact-prefix matching means any change near the front invalidates the entire downstream cache.
- **Stabilize the prefix.** No timestamps, request IDs, or per-call nonces in the cached region; pin tool-definition ordering.
- **Watch the TTL economics.** Where there is a write premium, caching only pays once you clear a break-even number of reads, so bursty low-reuse traffic may not benefit.
- **Instrument cache-hit rate per call** as a first-class metric. Prompt rewrites, model version bumps, and reordering silently drop hit rate.

Distinct from prefix caching, **exact-match and semantic caching** serve whole responses for repeated *queries*. Exact-match keys on the literal request (cheap, zero false positives); semantic caching embeds the query and serves cached responses for similar hits (higher hit rate on natural-language traffic, but a false-hit risk worth guarding). Layer them: exact-match, then semantic, then prefix, and measure hit rate per layer. Conceptually this is the billing-layer monetization of the same KV reuse described in [KV Cache and Context Caching](../04-inference-optimization/02-kv-cache-and-context-caching.md).

---

## Batch and Async Economics

Both OpenAI and Anthropic offer a roughly **50% discount on batch processing** (input and output), asynchronous, with a completion ceiling around 24 hours. The decision rule is simple: **use batch whenever no human or system is waiting on the token.** High-value batch workloads include evaluation and regression suites, bulk classification and labeling, corpus-scale summarization and document processing, backfills after a prompt or model change, and A/B testing prompt variants. For the entire offline tier of a product, not batching leaves about half the money on the table.

The third lane is **provisioned/reserved throughput** (AWS Bedrock Provisioned Throughput, Azure OpenAI PTUs): reserved capacity at an hourly rate regardless of usage, reported to save on the order of 15-70% on sustained workloads, economical only at high, predictable utilization. The mental model mirrors cloud compute: pay-per-token (including batch) for spiky or uncertain demand, and reserved capacity once utilization is high and steady.

---

## The FinOps Discipline

The FinOps Foundation's framing: **inference is 80-90% of total GenAI spend** in many deployments, so the discipline centers on per-request inference economics, not training. The operational core:

- **Attribution.** Tag every call by team, feature, customer/tenant, model, route, and environment. The technical enabler is a token proxy or [gateway](03-ai-gateways-and-model-routing.md) in front of the API that identifies the source of each call. Without attribution there is no way to compute unit economics or see which use cases earn their cost.
- **Showback before chargeback.** Start with visibility dashboards (per-provider, per-model, per-team, per-tenant, with daily forecasts and spike alerts), then graduate to billing teams once the tags are trustworthy.
- **Unit economics.** Track cost per user, per conversation, per resolved ticket or case, and AI cost as a percentage of revenue and of gross margin. Teach an AI product like a cost-of-goods business.
- **Margin reality.** Reported snapshots put AI-product gross margins roughly 25-30 points below the 80-90% of traditional SaaS, because every request has a variable token cost. This is why **outcome-based pricing** (per resolved ticket, per completed task) is rising, with reported anchors like a fixed price per resolved support ticket. The imperative: know your cost per resolution before you price per resolution.
- **Tooling.** Gateways give real-time per-request control and spend caps; FinOps platforms (Helicone, Vantage, Finout, Amnic, and cloud cost tools) give cross-cloud allocation and chargeback. Mature stacks run both. Verify a tool's current status before standardizing on it; this category churns.

---

## Structural Cost Decisions

These architecture-level choices move cost by 2-50x, beyond per-call tuning:

- **Right-sizing, cascades, and routing.** Route to the cheapest model that clears a quality bar, and escalate only on low confidence. Reported savings of 45-85% at ~95% quality retention (FrugalGPT is the canonical reference), with the escalation rate as the live cost variable. See [AI Gateways and Model Routing](03-ai-gateways-and-model-routing.md).
- **Self-host vs API break-even.** The reported break-even against a frontier API sits in the high tens to hundreds of millions of tokens per month, but the load-bearing warning is hidden cost: raw GPU rental is only 30-40% of true cost, so apply a ~2.5-3x multiplier, and engineering labor often exceeds infrastructure. For most teams in 2026, managed APIs are cheaper once the full stack is counted; self-host wins at high, predictable, well-utilized volume or for data-residency reasons. See [LLM Infrastructure](01-llm-infrastructure.md).
- **RAG vs long context.** Retrieval is dramatically cheaper per query than stuffing a long context, since you pay for a few relevant chunks instead of a giant prompt. Long context wins for small static document sets; RAG wins for large or frequently changing corpora and high query volume. See [RAG Fundamentals](../06-retrieval-systems/01-rag-fundamentals.md).
- **Distillation.** Fine-tuning a small model to within a couple of accuracy points of a frontier model on a locked eval is reported to cut per-token cost by 5-40x, with payback in weeks to months at high volume; it wins on narrow, high-volume tasks and fails on open-ended long-tail work. See [Knowledge Distillation](../03-training-and-adaptation/05-knowledge-distillation.md) and the [distillation case study](../16-case-studies/19-customer-distillation-pipeline.md).
- **Output and prompt engineering.** Terse output contracts, `max_tokens` caps, structured outputs, and trimming few-shot examples once a model is reliable are reported to cut tokens 20-40% at minimal quality loss.

---

## Cost Anti-Patterns

| Anti-pattern | Mechanism | Fix |
|--------------|-----------|-----|
| No caching | Re-paying for the static system prompt (~69% of input) every call | Stable prefix plus provider prefix caching |
| Oversized model | Frontier model on tasks a small model handles | Right-size, cascade, route |
| Unbounded output | No `max_tokens`, verbose formats | Caps and terse output contracts |
| Reasoning on by default | Extended thinking for trivial tasks | Gate thinking by task complexity |
| Retry storms | Transient error triggers unbounded retries | Bounded retries and circuit breakers |
| Runaway agent loops | A plan-act loop never terminates; tool errors read as "retry" | Hard step, token, and retry ceilings inside the loop |
| Unbounded memory | History accrues without summarization | Windowing and summarization |
| Long-context stuffing | A giant context as the default retrieval | RAG for large or changing corpora |
| No attribution | Untagged shared spend | Gateway token proxy plus tags |
| Real-time for offline work | Sync API for evals, backfills, labeling | Batch API |

Reported real incidents make the agent-loop row concrete: runaway agents have burned tens of thousands of dollars over a single weekend before anyone noticed. Hard ceilings inside the loop, not after-the-fact alerts, are the defense.

---

## Interview Questions

### Q: Your LLM bill doubled month over month with flat traffic. How do you find and fix it?

**Strong answer:**
First, attribution: if every call is not tagged by feature, team, model, and route through a gateway or proxy, that is the first fix, because you cannot debug what you cannot see. With attribution I would break spend into the token-spend layers and look for the usual culprits: a prompt change that broke cache-hit rate (the system prompt is ~69% of input tokens, so a cache regression is huge), extended thinking switched on for simple tasks (billed at the output rate and invisible in the response), an agent loop whose step count crept up, unbounded output or conversation history, or a retry storm. The highest-ROI fix is almost always restoring prompt caching, then right-sizing the model and capping output. I would also move any offline work (evals, backfills) to the batch API for roughly half off, and set per-feature budgets with spike alerts so the next doubling pages someone on day one.

### Q: Why do AI products have worse gross margins than SaaS, and what do engineers do about it?

**Strong answer:**
Because every request carries a variable token cost, so an AI product behaves like a cost-of-goods business rather than zero-marginal-cost software; reported margins run roughly 25-30 points below typical SaaS. Engineers attack it on two fronts. Structurally: cache the static prompt prefix, right-size and cascade models, prefer RAG to long-context stuffing, distill high-volume narrow tasks onto a small model, and batch the offline tier. Operationally: instrument unit economics (cost per conversation, per resolved outcome) so pricing can move toward outcome-based models, which only works if you know your cost per resolution. The cost levers are an engineering responsibility, not just a finance one.

---

## References

- Datadog, [State of AI Engineering 2026](https://www.datadoghq.com/state-of-ai-engineering/)
- FinOps Foundation, [Optimizing GenAI Usage](https://www.finops.org/wg/optimizing-genai-usage/) and [FinOps for AI](https://www.finops.org/wg/finops-for-ai-overview/)
- Anthropic, [prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching); OpenAI, [prompt caching](https://platform.openai.com/docs/guides/prompt-caching)
- Anthropic, [Message Batches API](https://docs.anthropic.com/en/docs/build-with-claude/batch-processing); OpenAI, [Batch API](https://platform.openai.com/docs/guides/batch)
- Chen et al., "FrugalGPT" arXiv:2305.05176
- Bessemer, [the AI pricing and monetization playbook](https://www.bvp.com/atlas/the-ai-pricing-and-monetization-playbook)

---

*Previous: [AI Gateways and Model Routing](03-ai-gateways-and-model-routing.md)*
