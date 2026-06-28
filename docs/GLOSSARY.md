# AI System Design Glossary

Quick reference for key terms used throughout this guide.

---

## A

**Agentic Coding** - LLM autonomously editing files, running shell commands, writing tests and iterating until a coding task is complete. Exemplified by Claude Code, OpenHands, and Cline.

**Agentic System** - LLM application that autonomously plans and executes multi-step tasks using tools.

**AI Control** - Safety approach that assumes a model may be misaligned and designs deployment protocols (monitoring, defer-on-critical-action, resampling, factored cognition) to stay safe even then. Distinct from alignment, which aims to make the model trustworthy in the first place. See [Research Radar](RESEARCH-RADAR.md).

**AI Gateway** - A control-plane proxy between your apps and model providers (LiteLLM, OpenRouter, Portkey, Kong). Exposes one OpenAI-compatible API and centralizes routing, fallback, load balancing, rate-limit handling, virtual keys and budgets, caching, and observability. See [AI Gateways and Model Routing](11-infrastructure-and-mlops/03-ai-gateways-and-model-routing.md).

**Attention Mechanism** - Neural network component that allows models to focus on relevant parts of input. Self-attention compares each token to all others.

**ABAC (Attribute-Based Access Control)** - Access control based on attributes of user, resource, and environment rather than fixed roles.

---

## B

**Batching** - Processing multiple requests together to improve GPU utilization. Continuous batching adds new requests while others generate.

**Benchmark Saturation** - When frontier models cluster so near a benchmark's ceiling that score differences fall within noise (prompt phrasing, run variance), so the benchmark no longer separates models. MMLU, HumanEval, and GSM8K are saturated. See [Benchmarks and Leaderboards](14-evaluation-and-observability/03-benchmarks-and-leaderboards.md).

**BM25** - Traditional keyword-based ranking algorithm. Often combined with vector search for hybrid retrieval.

**Budget Tokens** - The configurable compute budget for Extended Thinking (Claude) or reasoning (o3). Higher budget → more internal reasoning steps → higher accuracy and cost.

---

## C

**C2PA (Content Credentials)** - An open standard that cryptographically binds provenance metadata (who made this, whether AI was involved, what edits) to a media asset, with tamper-evident hard bindings and watermark-based soft bindings that survive re-encoding. The provenance layer behind AI-content labeling laws; removable, so layer it with watermarking and detection. See [Multimodal Generation](19-multimodal-generation/01-multimodal-generation.md).

**Capability Index (Composite Benchmark)** - A weighted aggregate of many benchmarks (e.g. Artificial Analysis Intelligence Index, Epoch Capability Index, HAL for agents) used to rank frontier models so the ranking keeps discriminating as individual benchmarks saturate.

**Chain-of-Thought (CoT)** - Prompting technique that elicits step-by-step reasoning before final answer.

**Chunking** - Splitting documents into smaller pieces for embedding and retrieval. Strategies include fixed-size, semantic, and hierarchical.

**Claude Code** - Anthropic's terminal-native autonomous coding agent. Uses bash, text_editor, and computer tools to read, edit, and run code across a full project. Controlled via CLAUDE.md manifest files.

**Claude Fable 5** - Anthropic's most capable widely released model (June 9, 2026, `claude-fable-5`). A Mythos-class model made safe for general availability: $10/$50 per 1M, 1M context, adaptive thinking always on. Sensitive queries fall back to Claude Opus 4.8 in under 5% of sessions. The unrestricted variant, Claude Mythos 5, is limited to Project Glasswing partners.

**Cline** - Open-source VS Code extension providing autonomous AI coding with tool use (file editing, terminal, browser). MCP-native.

**Computer-Use** - A model capability (native to Claude 3.5+) to control a GUI by simulating mouse clicks, keyboard input, and screenshots. Enables browser and desktop automation.

**Context7** - MCP server that fetches up-to-date library documentation at runtime, solving the "stale training data" problem for coding agents.

**Context Window** - Maximum number of tokens an LLM can process in a single request. Ranges from 4K to 1M+ tokens.

**Context Rot** - Degradation in output quality as irrelevant or stale tokens accumulate in the context window, often well before the advertised limit. Motivates compaction and just-in-time retrieval. See [Context Engineering](05-prompting-and-context/05-context-engineering.md).

**Cosine Similarity** - Measure of similarity between two vectors. Standard metric for comparing embeddings.

**Cursor** - AI-native IDE (fork of VS Code) with deep model integration for code completion, agentic editing, and multi-file context awareness.

---

## D

**Data Contamination** - When benchmark questions or their answers leak into a model's training data, inflating scores through memorization rather than capability. Countered with time-gated, private, or held-out test sets. See [Benchmarks and Leaderboards](14-evaluation-and-observability/03-benchmarks-and-leaderboards.md).

**Diffusion Language Model** - A non-autoregressive LLM that generates text by iteratively denoising a masked sequence in parallel rather than left to right, trading some quality for much higher throughput (reported 1,000+ tokens/sec). Strong on code and infilling; early-stage in 2026. See [Diffusion Language Models](04-inference-optimization/08-diffusion-llms.md).

**DPO (Direct Preference Optimization)** - Fine-tuning method that optimizes directly on preference data without a separate reward model.

**DSPy** - Framework for programming LLMs through optimizable modules rather than manual prompts.

**Durable Execution** - An execution model (Temporal, Restate, DBOS) that makes long-running agents survive crashes and restarts via an append-only event history and deterministic replay, giving exactly-once side effects, durable timers, and pauses that outlive deploys. See [Durable Execution](07-agentic-systems/11-durable-execution.md).

---

## E

**Effective Context Length** - The context length at which a model still maintains quality, routinely shorter than the advertised window. On RULER, many models claiming 128K hold quality only to ~32-64K. Design for effective, not advertised, context.

**Embedding** - Dense vector representation of text. Used for semantic search and similarity comparison.

**Endpointing (Turn Detection)** - In voice agents, deciding when the user has finished speaking so the agent can respond. Learned turn-detection models fire on a semantically complete thought, beating fixed silence timeouts that tax every turn. See [Real-Time Voice Agents](18-voice-and-audio-agents/01-realtime-voice-agents.md).

**Ensemble** - Combining multiple model outputs to improve reliability. Includes voting, debate, and mixture-of-agents.

**Eval Awareness** - A model's tendency to detect when it is being evaluated and alter behavior accordingly, which confounds safety and capability benchmarks and argues for naturalistic, held-out test conditions.

**Extended Thinking** - Claude's (3.7+) internal reasoning mode where the model performs a scratchpad reasoning pass before producing a response. Configurable via `thinking.budget_tokens`. Not shown to end users by default.

**EU AI Act** - Regulation (EU) 2024/1689, the first comprehensive AI law, structured by risk tier (prohibited, high-risk, limited, minimal) with separate GPAI obligations and fines up to 7% of global turnover. Prohibitions and GPAI rules are enforceable as of 2026; high-risk obligations are provisionally pushed to around 2027. See [AI Governance and Compliance](13-reliability-and-safety/04-ai-governance-and-compliance.md).

---

## F

**Few-Shot Prompting** - Including examples in the prompt to guide model behavior.

**Fine-Tuning** - Training a pre-trained model on task-specific data to improve performance.

**FinOps for AI** - The discipline of measuring, attributing, and optimizing AI spend: cost per token/request/task, prompt caching, batch economics, showback and chargeback, and unit economics. See [FinOps and Token Economics](11-infrastructure-and-mlops/04-finops-and-token-economics.md).

**Framework Churn** - The rapid, breaking evolution of AI orchestration frameworks (LlamaIndex, LangChain), which reshuffle package layouts and remove abstractions roughly yearly, breaking older tutorials and courses on a fresh install. Survive it by pinning/locking versions and learning primitives over APIs. See [Navigating Framework Churn](09-frameworks-and-tools/12-navigating-framework-churn.md).

**Function Calling** - LLM capability to output structured tool invocations rather than plain text.

---

## G

**GGUF** - The quantized model file format used by llama.cpp, Ollama, and LM Studio for local inference. Quant levels trade quality for size; Q4_K_M is the practical sweet spot. See [On-Device and Edge Deployment](04-inference-optimization/09-on-device-and-edge-deployment.md).

**Guardrails** - Input/output validation to prevent harmful or off-topic responses.

**Grounding** - Connecting LLM responses to factual sources to reduce hallucination.

**Grok 4.3** - xAI's frontier reasoning model. Competitive with GPT-5.5, Claude Opus 4.7, and Gemini 3.1 Pro on reasoning benchmarks. Available via xAI API and inside X.

**GRPO (Group Relative Policy Optimization)** - The RL algorithm behind DeepSeek-R1: drops PPO's value/critic network and computes advantage from the reward spread within a sampled group of completions. Cheaper than PPO; variants (Dr.GRPO, DAPO, GSPO) fix its length bias and zero-variance collapse. See [Training Reasoning Models](03-training-and-adaptation/08-rlvr-and-reasoning-models.md).

---

## H

**Hallucination** - Model generating plausible but factually incorrect information.

**Harness (Scaffold) Variance** - The 10-20 point swing in benchmark scores produced by the same model weights under different prompts, tool access, reasoning effort, or agent scaffolds. Why provider self-reports are not comparable across labs, and only same-harness numbers can be compared. See [Benchmarks and Leaderboards](14-evaluation-and-observability/03-benchmarks-and-leaderboards.md).

**Harness Engineering** - Designing the deterministic driver code around an agent (context assembly, tool execution, budgets, stop conditions, durable state, observability) rather than tuning the model itself. The harness is the kernel; the model is the policy. See [Loop Engineering](07-agentic-systems/12-loop-engineering.md).

**HNSW (Hierarchical Navigable Small World)** - Graph-based algorithm for approximate nearest neighbor search in vector databases.

**Human-in-the-Loop (HITL)** - Patterns for human oversight, approval, or correction of AI outputs.

---

## I

**In-Context Learning** - Model adapting to task based on examples in the prompt without weight updates.

**Indirect Prompt Injection** - A prompt-injection attack delivered through content the agent reads (a web page, document, tool result) rather than the user's direct input. Red-team studies and an impossibility result suggest it cannot be fully prevented, shifting defense toward least-privilege and containment. See [Agentic Security and Sandboxing](07-agentic-systems/09-agentic-security-and-sandboxing.md).

**Inference** - Running a trained model to generate predictions/outputs.

---

## J

**JSON Mode** - LLM output mode that guarantees valid JSON structure (legacy). Superseded by **Structured Outputs** in newer APIs.

---

## K

**KV Cache** - Cached key-value pairs from attention computation. Enables efficient autoregressive generation.

---

## L

**LangChain** - Framework for building LLM applications with chains, agents, and integrations.

**Leaderboard Illusion** - The critique (Cohere et al., arXiv:2504.20879) that crowd-preference leaderboards like LMArena are distorted by private best-of-N testing, unequal data access, and silent model deprecation. Contested in magnitude by LMArena; the practical takeaway is to read style-controlled Elo with confidence intervals and treat Arena as preference, not correctness.

**LlamaIndex** - Data framework focused on document processing and retrieval for LLM applications.

**LiveCodeBench** - Benchmark evaluating coding models on real-world problems from competitive programming platforms. More reliable than HumanEval for production coding tasks.

**LoRA (Low-Rank Adaptation)** - Parameter-efficient fine-tuning that trains small adapter matrices instead of full model weights.

**LLM-as-Judge** - Using an LLM to evaluate outputs from another LLM.

**Loop Engineering** - The discipline of designing and continuously improving the control loops that wrap an agent (the trigger, the inner reason-act-observe loop, a verification loop, event-driven invocation, and an eval-driven improvement loop) instead of hand-prompting the model each turn. See [Loop Engineering](07-agentic-systems/12-loop-engineering.md).

**Loopmaxxing** - The anti-pattern of assuming that more iterations automatically solve a task. It fails on goals with no verifiable exit condition, so the loop never converges and spend runs away. The multi-step descendant of token-maxxing. See [Loop Engineering](07-agentic-systems/12-loop-engineering.md).

---

## M

**MCP (Model Context Protocol)** - Open protocol for standardized tool/resource integration with LLMs. Launched by Anthropic November 2024; governance moved to the Linux Foundation's Agentic AI Foundation December 2025; adopted by Anthropic, OpenAI, Google, Microsoft, AWS. Version 2.0 (ratified March 2026) adds Streamable HTTP transport and OAuth 2.1 auth.

**Memory Poisoning** - An attack that plants malicious or false entries into an agent's long-term memory so they resurface and influence future sessions. Added to the OWASP 2026 Agentic Top 10 as ASI06. Defense favors provenance at write time over sanitization at read time. See [Research Radar](RESEARCH-RADAR.md).

**Mixture of Agents (MoA)** - Ensemble pattern where multiple agents contribute to a synthesized response.

**Model Routing** - Choosing which model serves each request by task, cost, latency, capability, or semantics, often with a cascade (cheap model first, escalate on low confidence) and cross-provider fallback. See [AI Gateways and Model Routing](11-infrastructure-and-mlops/03-ai-gateways-and-model-routing.md).

**Multi-Tenancy** - Serving multiple customers from shared infrastructure with data isolation.

---

## O

**o3** - OpenAI's high-compute reasoning model (released Jan 2025). Uses internal chain-of-thought to allocate test-time compute. Available in standard and "mini" variants. Excels at math, code, and science.

**OCR (Optical Character Recognition)** - Extracting text from images or scanned documents.

**OpenHands** - Open-source autonomous software engineering agent (formerly OpenDevin). Supports multiple backend LLMs, runs in a Docker sandbox.

---

## P

**pass^k** - Agent reliability metric: the fraction of tasks solved on all k independent attempts (versus pass@k, solved on at least one). Exposes the reliability cliff where an agent at ~60% pass@1 can drop to ~25% pass^8. The production-relevant consistency signal.

**Prompt Caching** - Reusing the KV cache for repeated prompt prefixes. Available natively in Anthropic (cache_control), Google (implicit), and some OpenAI endpoints. Reduces cost by 60-90% for long fixed prefixes.

**Prompt Injection** - Attack where malicious input manipulates LLM behavior.

**Prefix Caching** - Reusing KV cache for common prompt prefixes across requests.

---

## Q

**QLoRA** - LoRA combined with 4-bit quantization for memory-efficient fine-tuning.

**Quantization** - Reducing model precision (e.g., FP16 to INT4) to decrease memory and improve speed.

---

## R

**RAG (Retrieval-Augmented Generation)** - Pattern that retrieves relevant documents to provide context for LLM generation.

**RBAC (Role-Based Access Control)** - Access control based on user roles with predefined permissions.

**ReAct** - Agent pattern alternating between Reasoning and Acting steps.

**Reranking** - Second-stage scoring to improve retrieval precision. Cross-encoders provide higher accuracy than bi-encoders.

**RLHF (Reinforcement Learning from Human Feedback)** - Training method using human preferences to align model behavior.

**RLVR (RL with Verifiable Rewards)** - The dominant post-training recipe for reasoning models: reward the policy with a programmatic verifier (math, code, or logic with a checkable answer) instead of a learned reward model, which largely sidesteps reward-model hacking. See [Training Reasoning Models](03-training-and-adaptation/08-rlvr-and-reasoning-models.md).

---

## S

**Self-Consistency** - Sampling multiple reasoning paths and selecting most common answer.

**Semantic Search** - Finding documents by meaning rather than keywords, using embeddings.

**Speculative Decoding** - Using small draft model to propose tokens, verified by large model.

**Speech-to-Speech (S2S)** - A voice-agent architecture where one multimodal model takes audio in and emits audio out directly, versus a cascaded STT to LLM to TTS pipeline. More natural and lower-latency, but less debuggable and controllable. See [Real-Time Voice Agents](18-voice-and-audio-agents/01-realtime-voice-agents.md).

**Structured Outputs** - OpenAI's (and Anthropic's tool-mode) capability to guarantee model output conforms to a provided JSON Schema. Stricter than legacy JSON mode.

**SWE-bench Verified** - Human-validated 500-issue subset of SWE-bench measuring resolution of real GitHub issues; the canonical coding benchmark of 2024-2026. Now near-saturated and partly contaminated, so the field is shifting to SWE-bench Pro and contamination-resistant live variants. Read the harness before trusting a score. See [Benchmarks and Leaderboards](14-evaluation-and-observability/03-benchmarks-and-leaderboards.md).

**System Prompt** - Instructions that set context and behavior for an LLM conversation.

---

## T

**Temperature** - Parameter controlling randomness of LLM outputs. Lower = more deterministic.

**Test-Time Compute (Inference-Time Scaling)** - Spending more compute at inference with the weights **frozen**: long chain-of-thought, best-of-N, self-consistency, search. Ubiquitous in production by 2026, with diminishing (sometimes negative) returns past a point. Contrast with Test-Time Training.

**Test-Time Training (TTT)** - Updating a model's **weights** at inference (often an ephemeral LoRA) on the test input, its augmentations, or retrieved neighbors, then predicting and discarding the update. Distinct from test-time compute, which leaves weights frozen. Research-stage in 2026; strongest on novel tasks like ARC and on long-context efficiency. See [Research Radar](RESEARCH-RADAR.md#12-test-time-training-learning-at-inference).

**Token** - Basic unit of text processing. Roughly 0.75 words or 4 characters in English.

**Tool Use** - LLM capability to invoke external functions/APIs.

**Transformer** - Neural network architecture based on self-attention. Foundation of modern LLMs.

---

## V

**Vector Database** - Database optimized for storing and searching high-dimensional vectors (embeddings).

---

## W

**Windsurf** - AI-native IDE (by Codeium) with tight agentic integration. Uses "Flows" (deterministic agentic sequences). Alternative to Cursor.

---

## Z

**Zero-Shot** - Prompting without examples, relying on model's pre-existing knowledge.

---

*See also: [PATTERNS.md](PATTERNS.md) for design pattern quick reference*
