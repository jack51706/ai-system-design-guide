# KV Cache and Context Caching

The KV Cache is the most significant memory consumer in long-context AI systems. Managing this cache effectively is the difference between a system that scales to 2M tokens and one that crashes at 10k.

## Table of Contents

- [The KV Cache Problem](#kv-cache-problem)
- [GQA: Grouped Query Attention](#gqa)
- [Context Caching (Self-hosted)](#context-caching-self-hosted)
- [API-level Context Caching (Prompt Caching)](#api-prompt-caching)
- [RAD-O: Retrieval Augmented Decoding](#rad-o)
- [Interview Questions](#interview-questions)
- [References](#references)

---

## The KV Cache Problem

During generation, the model needs the Key (K) and Value (V) tensors for all previous tokens. Storing these in memory is expensive.

**VRAM Calculation (Llama 4 70B):**
- **Tokens**: 128,000
- **Precision**: BF16 (2 bytes/param)
- **Memory**: `2 (KV) * layers (80) * context (128k) * heads (8) * head_dim (128) * 2 bytes`
- **Total**: **~42 GB per user** in 128k context.

---

## GQA: Grouped Query Attention

GQA is the modern standard for reducing KV Cache size without losing performance.

| Method | Ratio | KV Cache Reduction | Quality Loss |
|--------|-------|-------------------|--------------|
| **Multi-Head (MHA)** | 1:1 | 1x (Baseline) | 0% |
| **Grouped Query (GQA)** | 8:1 | **8x** | < 0.2% |
| **Multi-Query (MQA)** | All:1 | 64x-128x | 2-3% |

**Nuance**: GQA allows the model to attend to the same KV "memory" from multiple "reasoning" heads, drastically reducing the memory bandwidth needed during the Decode phase.

---

## Context Caching (Self-hosted)

Production systems use **Shared KV Caches** for prompts with common prefixes (e.g., a 100-page knowledge base shared by 1,000 users).

### Disk vs. VRAM Caching
- **VRAM Cache**: Instant access, strictly limited size.
- **Disk/SSD Cache**: Slower access, nearly unlimited. Frameworks like **SGLang** use a tiered system: `Most Recent (VRAM) -> Frequent (HBM) -> Occasional (SSD)`.

---

## API-level Context Caching (Prompt Caching)

Major providers (OpenAI, Anthropic, Google, DeepSeek) now offer **Prompt Caching** discounts.

| Provider | Feature Name | Pricing (Cached input) | Best For |
|----------|--------------|------------------------|----------|
| **Anthropic** | Context Caching | 90% discount (Sonnet 4.6 cached: $0.30/1M) | Long system prompts, tool schemas |
| **OpenAI** | Prompt Caching | ~50% discount on cached input (GPT-5.5 cached: ~$2.50/1M) | Multi-turn chat |
| **Google** | Context Caching | Cache reads $0.20/1M (Gemini 3.1 Pro under 200K); hourly storage fee separate | Long shared corpora |
| **DeepSeek** | Context Caching | **$0.003625/M (V4 Pro) / $0.0028/M (V4 Flash)** | Massive codebase RAG; cheapest cache tier on the market |

**Break-even nuance**: If your cached prefix is reused more than **1.1x to 1.5x**, it is cheaper to use caching than raw tokens. Anthropic charges a 25% premium on cache writes, so for short prefixes the break-even is higher (3-5x reuse). DeepSeek cut the cache-hit price to 1/10 of launch on April 26, 2026. For cache-heavy workloads, V4 Flash now lands roughly 30-50x cheaper per cached token than GPT-5.5.

---

## RAD-O: Retrieval Augmented Decoding

RAD-O is a context-caching technique where the model **compresses** the KV cache of long documents into "Latent tokens."
- **How**: Instead of storing the full KV vectors for 1M tokens, it stores a compressed representation that is 10x smaller.
- **Impact**: Enables 2M+ token contexts on hardware that previously only supported 200k.

---

## Interview Questions

### Q: How does PagedAttention help with KV Cache management? (Simplified)

**Strong answer:**
Standard KV caches require contiguous memory allocation (one giant block of RAM). This leads to **External Fragmentation** (memory exists but is in unusable gaps). PagedAttention (used in vLLM) breaks the KV cache into small, fixed-size "pages" (like OS virtual memory). This allows the cache to be non-contiguous, meaning we can allocate memory exactly when needed and share pages between different requests that have the same prefix. This typically increases memory efficiency from 60% to 96%+.

### Q: Why is Context Caching better than RAG for a 50k token document?

**Strong answer:**
With cheap context caching (DeepSeek, Gemini, Anthropic), RAG is often "overkill" for medium-sized documents.
1. **Recall**: Context caching gives 100% recall (the whole doc is in the window), whereas RAG depends on retrieval accuracy.
2. **Coherence**: The model can see cross-references across the whole document.
3. **Economics**: At 50k tokens, the cost of a cached input is often lower than the complexity of maintaining a vector database and retrieval pipeline.

---

## References
- Kwon et al. "Efficient Memory Management with PagedAttention" (2023)
- Anthropic. "Prompt Caching Documentation" (2024)
- DeepSeek. "Context Caching Technical Report" (2025)

---

*Next: [Speculative Decoding](03-speculative-decoding.md)*
