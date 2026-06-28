# On-Device and Edge Deployment

Not every model has to run in someone else's cloud. Running LLMs **locally**, on a laptop, a workstation GPU, a phone, or an edge box, is a real deployment target in 2026, driven by privacy, offline operation, latency, and cost at steady volume. The catch is that the tool that makes local models easy to *try* (Ollama) is not the tool that serves them in *production* (vLLM), and the two get conflated constantly. This chapter sorts out the runtime stack, the prototype-to-production path, the hardware limits, and when local actually beats an API.

## Table of Contents

- [The Runtime Stack](#the-runtime-stack)
- [Why Ollama Is Not a Production Server](#why-ollama-is-not-a-production-server)
- [When Local Beats Cloud (and When It Does Not)](#when-local-beats-cloud-and-when-it-does-not)
- [Quantization for Local Serving](#quantization-for-local-serving)
- [Hardware](#hardware)
- [Prototype to Production](#prototype-to-production)
- [Interview Questions](#interview-questions)
- [References](#references)

---

## The Runtime Stack

The key mental model: these tools are **not substitutes**. They occupy different layers.

| Tool | Layer | What it is for |
|------|-------|----------------|
| **Ollama** | Experience layer / local daemon | One-command model pull and run, OpenAI-ish API, single-user dev. Builds on llama.cpp, and uses Apple MLX on Apple Silicon in recent versions. |
| **LM Studio** | Experience layer / GUI | A desktop GUI for browsing and running local models. Single-user focused. |
| **llama.cpp** | Inference engine | Portable C/C++ CPU/GPU inference (the GGUF format); runs almost anywhere; powers the experience-layer tools. |
| **MLX** | Inference engine | Apple's array framework; the fastest Apple Silicon path; research and fine-tuning. |
| **vLLM** | Serving system | High-throughput concurrent serving with PagedAttention and continuous batching; OpenAI-compatible. The production answer. |
| **TGI / TensorRT-LLM** | Serving system | Hugging Face's and NVIDIA's high-throughput servers; production. |
| **ExecuTorch** | Embedded/mobile runtime | PyTorch-native on-device inference (phone to microcontroller); reached 1.0 in late 2025 and ships in apps for billions of users. |
| **Core ML / ONNX Runtime / MLC LLM** | Embedded/mobile runtime | Apple on-device, cross-platform, and compile-to-many-targets (including browser/WebGPU) respectively. |

---

## Why Ollama Is Not a Production Server

Ollama and LM Studio are excellent for prototyping and wrong for a shared production endpoint, for an architectural reason worth teaching.

Ollama defaults to serving requests with very limited parallelism and queues excess requests first-in-first-out; a full queue returns an error. Each parallel slot also statically multiplies the context memory allocation. LM Studio is built for single-user scenarios without rate limiting or auth. Neither is designed to turn concurrent demand into throughput.

**vLLM** is, via two mechanisms: **PagedAttention** (the KV cache stored in non-contiguous blocks like OS paging, cutting the 60-80% KV memory waste of naive serving to under ~4%) and **continuous batching** (swap a finished request out and a queued one in mid-batch). The clearest first-party benchmark, from Red Hat: on a single datacenter GPU running an 8B model, vLLM reached roughly **793 tokens/sec versus Ollama's ~41**, about 19x, with far lower tail latency, and even a tuned Ollama trailed across all concurrency levels.

The takeaway is not "vLLM is tuned better." It is structural: Ollama and LM Studio serialize, vLLM batches continuously and pages the KV cache. For one user the difference is small; under concurrency it becomes roughly 16-20x. One caveat for honesty: most public head-to-head numbers run on a datacenter GPU to isolate the *software* difference, so do not read "vLLM beats Ollama" as "GPU beats Mac."

---

## When Local Beats Cloud (and When It Does Not)

**Lean local or edge when:**
- **Privacy or regulated data** that cannot leave the box (HIPAA, GDPR, contractual residency). A caveat to teach: the major API providers now offer zero-data-retention enterprise tiers, so "privacy" alone no longer automatically decides for local.
- **Offline or air-gapped** operation (field devices, critical infrastructure).
- **A latency floor**: on-device removes the network round trip (often 50-200ms), which matters for tight interactive loops; total response latency still depends on the model and hardware.
- **Cost at steady, high volume**: a reserved GPU is reported to break even against frontier APIs somewhere around a few million tokens per day, above which owning hardware wins because you stop paying per token. The exact break-even is workload-dependent.

**Stay on cloud APIs when** you need frontier quality, have spiky or unpredictable demand (you would pay for idle GPUs; batch endpoints at ~50% off often beat local at medium volume), run low-to-moderate volume (below break-even, total cost favors APIs), or lack the ops capacity to run vLLM with autoscaling and monitoring. The 2026 consensus is usually a **hybrid**: small, private, offline, or cost-sensitive paths local, heavy or frontier or spiky paths to the cloud, within one product.

---

## Quantization for Local Serving

Quantization is what makes local serving viable; the [Quantization Deep Dive](../03-training-and-adaptation/07-quantization-deep-dive.md) covers the math, so here is just the deployment layer.

**GGUF** is the local-model format used by llama.cpp, Ollama, and LM Studio. Common quant levels trade quality for size: Q4_K_M is the practical sweet spot (roughly 1-3% quality loss versus FP16 at about a quarter of the size), Q5_K_M is noticeably better for code and reasoning at under ~1% loss, Q8_0 is effectively lossless at about half FP16, and Q2/Q3 save the most memory but degrade math and reasoning by 5-10% or more.

The **VRAM rule of thumb**:

```
VRAM (GB) ≈ (params in billions × bits per weight) / 8   # model weights only
```

then add the KV cache (it grows with context length times concurrent requests) plus roughly 10-20% runtime overhead. So a 7B model's weights are roughly 14GB at FP16, ~7.7GB at Q8_0, and ~4.5GB at Q4_K_M, before that overhead. The operating rule everyone repeats: **use the highest-quality quant that fits with 10-20% headroom** for KV cache, activations, and context.

---

## Hardware

A model-size-to-hardware guide (Q4 quant assumed; planning guidance, not guarantees):

| Model size (Q4) | Min VRAM/RAM | Realistic hardware |
|-----------------|--------------|--------------------|
| 1-3B | 4-6 GB | Any modern GPU; high-end phones (NPU); AI PCs |
| 7-8B | 8 GB | Mainstream GPU; 16 GB Mac |
| 13-14B | 12 GB | Upper-mainstream GPU; 16-24 GB Mac |
| 32-35B | 24 GB | A 24 GB consumer GPU; 36-48 GB Mac |
| 70B | ~40 GB+ | High-end or dual GPU; 64 GB+ Mac; or a datacenter card |
| 200B+ | 48 GB+, often multi-GPU / 128 GB+ unified | Multi-GPU rigs; large-unified-memory workstations |

Notes:
- **Consumer GPUs** top out at 24-32 GB of VRAM, which is the binding constraint on local model size.
- **Apple Silicon** shares one memory pool between CPU and GPU, so system RAM doubles as VRAM, letting a large-RAM Mac hold models a same-priced discrete GPU cannot. Apple's MLX path keeps improving: Ollama's MLX backend (preview) reports sizable prefill and decode gains on Apple Silicon from exploiting unified memory, and a separate update adds NVFP4, NVIDIA's 4-bit floating-point format (not Apple's), reported around 20% faster than Q4_K_M.
- **NPUs** in phones and AI PCs advertise high TOPS, but a teaching nuance: TOPS alone does not predict LLM speed, because limited operator support and memory bandwidth gate real performance. NPUs suit lightweight, battery-efficient tasks; discrete GPUs still win for heavy local inference.
- **Mobile** is bandwidth-bound and memory-constrained: realistic on-phone models are sub-1B to about 3B, available app RAM is often under 4 GB even on flagships, and mobile memory bandwidth is 30-50x below a datacenter GPU. The on-device standard is 4-bit quantization.

---

## Prototype to Production

1. **Prototype** with Ollama (CLI) or LM Studio (GUI) on a GGUF Q4_K_M model; validate quality and prompts on the smallest model that passes.
2. **Pick the largest model and best quant** that fits the target hardware with KV-cache headroom.
3. **Switch the serving engine** for any concurrent endpoint: vLLM (NVIDIA or AMD), TensorRT-LLM (max NVIDIA), or TGI. Keep the OpenAI-compatible API so application code barely changes.
4. **For mobile or edge**, export to ExecuTorch, Core ML, or ONNX Runtime / MLC LLM, quantize to 4-bit, and budget for under 4 GB of RAM and the bandwidth limit.

Common pitfalls: treating Ollama or LM Studio as a server (it serializes under load); forgetting the KV cache when sizing memory (long context times parallel slots can dominate); over-quantizing (Q2/Q3 hurts reasoning); conflating "vLLM beats Ollama" with "GPU beats Mac"; assuming NPU TOPS equals LLM speed; and mismatching engine to hardware (vLLM is GPU-centric, MLX is Apple-only, llama.cpp is the portability fallback).

**Maturity:** server-side local serving is production-mature (vLLM is widely deployed with an OpenAI-compatible API). On-device and mobile is production-ready for *small* models (sub-1B to 3B) and not for frontier ones. NPU-as-LLM-engine is still early; a discrete GPU and a large-unified-memory Mac remain the serious local paths in 2026.

---

## Interview Questions

### Q: A team prototyped on Ollama and wants to ship it as a shared API. What changes and why?

**Strong answer:**
Ollama is the wrong tool for a shared endpoint. It serves with limited parallelism and queues excess requests first-in-first-out, so under concurrency latency spikes and requests start failing. The fix is to switch the serving engine to vLLM (or TensorRT-LLM or TGI), keeping the same OpenAI-compatible API so the app barely changes. vLLM wins structurally, not by tuning: PagedAttention stores the KV cache in non-contiguous blocks to eliminate most of the memory waste, and continuous batching swaps finished requests out and queued ones in mid-batch, so concurrent demand becomes throughput. First-party benchmarks show roughly an order-of-magnitude higher throughput and far lower tail latency under load. I would also right-size the model and quant to the target GPU with KV-cache headroom, and add autoscaling and monitoring, which Ollama does not provide.

### Q: When would you choose local or on-device inference over a cloud API?

**Strong answer:**
When data cannot leave the box for privacy or residency reasons, when the system must work offline or air-gapped, when I need the lowest possible latency by cutting the network round trip, or when I have steady high volume where a reserved GPU beats per-token pricing, which is reported to break even around a few million tokens a day. I would stay on an API for frontier quality, spiky demand where idle GPUs waste money, low volume below break-even, or when the team lacks the ops capacity to run a serving stack. In practice it is usually a hybrid: small, private, or offline paths run local on quantized models, and heavy or frontier or bursty paths go to the cloud. On phones specifically, I would plan for sub-1B-to-3B models, since mobile is memory and bandwidth constrained.

---

## References

- Red Hat Developer, ["Ollama vs vLLM: a deep dive into performance benchmarking"](https://developers.redhat.com/articles/2025/08/08/ollama-vs-vllm-deep-dive-performance-benchmarking)
- vLLM, [docs](https://docs.vllm.ai/) and the [PagedAttention blog](https://blog.vllm.ai/2023/06/20/vllm.html)
- Ollama, [now powered by MLX on Apple Silicon](https://ollama.com/blog/mlx) and the [concurrency FAQ](https://docs.ollama.com/faq)
- PyTorch, [Introducing ExecuTorch 1.0](https://pytorch.org/blog/introducing-executorch-1-0/)
- Chandra and Krishnamoorthi (Meta), ["On-Device LLMs: State of the Union, 2026"](https://v-chandra.github.io/on-device-llms/)

---

*Next: [Prompt Engineering Fundamentals](../05-prompting-and-context/01-prompt-engineering-fundamentals.md)*
