# AI System Design Glossary

Quick reference for key terms used throughout this guide.

---

## A

**A2A (Agent-to-Agent Protocol)** - Open protocol for communication and task delegation between agents (agent cards, a task lifecycle, streaming updates), complementary to MCP: A2A is the agent-to-agent boundary, MCP is the agent-to-tool boundary. Reached v1.0 in 2026. See [Multi-Agent Orchestration](07-agentic-systems/04-multi-agent-orchestration.md).

**Agentic Coding** - LLM autonomously editing files, running shell commands, writing tests and iterating until a coding task is complete. Exemplified by Claude Code, OpenHands, and Cline.

**Agentic System** - LLM application that autonomously plans and executes multi-step tasks using tools.

**AI Control** - Safety approach that assumes a model may be misaligned and designs deployment protocols (monitoring, defer-on-critical-action, resampling, factored cognition) to stay safe even then. Distinct from alignment, which aims to make the model trustworthy in the first place. See [Research Radar](RESEARCH-RADAR.md).

**AI Gateway** - A control-plane proxy between your apps and model providers (LiteLLM, OpenRouter, Portkey, Kong). Exposes one OpenAI-compatible API and centralizes routing, fallback, load balancing, rate-limit handling, virtual keys and budgets, caching, and observability. See [AI Gateways and Model Routing](11-infrastructure-and-mlops/03-ai-gateways-and-model-routing.md).

**Alert Fatigue** - When an assistant raises so many low-value alerts (flags, warnings, suggestions) that users start ignoring all of them, including the critical ones. The reason precision matters more than recall for clinical decision support, code review, and observability alerting. See [Case Study: Clinical Decision Support](16-case-studies/35-clinical-decision-support.md).

**Attention Mechanism** - Neural network component that allows models to focus on relevant parts of input. Self-attention compares each token to all others.

**ABAC (Attribute-Based Access Control)** - Access control based on attributes of user, resource, and environment rather than fixed roles.

**Action-item grounding** - The requirement that every extracted action item, decision, or risk cite the exact transcript span (speaker plus timestamp) that supports it, so unsupported items are dropped rather than shipped to a system of record. See [Case Study: Async Meeting Intelligence Platform](16-case-studies/41-meeting-intelligence-platform.md).

**Adaptive keyframe sampling** - Varying the frame-extraction rate by scene and motion activity (dense on busy footage, sparse on static shots) instead of a fixed frame rate, to cut visual indexing cost. See [Case Study: Long-Form Video Understanding](16-case-studies/49-long-form-video-understanding.md).

**Adverse Impact (Four-Fifths Rule)** - The EEOC test flagging discrimination when a protected group's selection rate falls below 80 percent of the highest group's rate. See [Case Study: AI Recruiting and Resume Screening](16-case-studies/44-ai-recruiting-resume-screening.md).

**Adverse-action notice** - The regulatory disclosure an insurer or employer must send on a denial, stating the specific cited reasons, which forces every denial rationale to be grounded and explainable. See [Case Study: Insurance Claims Adjudication](16-case-studies/43-insurance-claims-adjudication.md).

**Age assurance** - Probabilistic placement of a user into an adult or suspected-minor tier from declared age plus behavioral and age-estimation signals, used to gate content for minors. See [Case Study: AI Companion Platform](16-case-studies/47-ai-companion-character-platform.md).

**AI-slop** - Low-quality, machine-generated web content (mass-produced SEO filler) that a research agent must detect and down-rank before it cites it. See [Case Study: Deep Research Agent](16-case-studies/42-deep-research-agent.md).

**Attack Success Rate (ASR)** - The fraction of adversarial probes that elicit an actual policy violation from a target LLM, tracked per harm category and expected to trend down as defenses improve. See [Case Study: Automated LLM Red-Teaming](16-case-studies/50-automated-llm-red-teaming.md).

**Audio Overview** - A NotebookLM-style two-host audio "podcast" generated from a user's source documents, discussing the content conversationally rather than reading it aloud. See [Case Study: Doc-to-Podcast Audio Generation](16-case-studies/52-doc-to-podcast-audio-generation.md).

**Automated Employment Decision Tool (AEDT)** - NYC Local Law 144's term for an algorithmic hiring tool, which must pass an independent bias audit whose results are posted publicly. See [Case Study: AI Recruiting and Resume Screening](16-case-studies/44-ai-recruiting-resume-screening.md).

**Automated red-teaming** - Using models to generate, mutate, and search over adversarial prompts at scale so safety coverage evolves with the threat instead of relying on a static test set. See [Case Study: Automated LLM Red-Teaming](16-case-studies/50-automated-llm-red-teaming.md).

---

## B

**Barge-in** - In a voice agent, letting the caller interrupt the agent mid-utterance so the agent stops talking and listens. Essential for natural turn-taking; needs echo cancellation and fast VAD so the agent does not talk over the user. See [Real-Time Voice Agents](18-voice-and-audio-agents/01-realtime-voice-agents.md).

**Batching** - Processing multiple requests together to improve GPU utilization. Continuous batching adds new requests while others generate.

**Benchmark Saturation** - When frontier models cluster so near a benchmark's ceiling that score differences fall within noise (prompt phrasing, run variance), so the benchmark no longer separates models. MMLU, HumanEval, and GSM8K are saturated. See [Benchmarks and Leaderboards](14-evaluation-and-observability/03-benchmarks-and-leaderboards.md).

**BM25** - Traditional keyword-based ranking algorithm. Often combined with vector search for hybrid retrieval.

**Budget Tokens** - The configurable compute budget for Extended Thinking (Claude) or reasoning (o3). Higher budget → more internal reasoning steps → higher accuracy and cost.

**Blast-radius estimate** - A pre-execution computation, derived from service topology, of how many pods and downstream services a proposed remediation would affect, shown to the approver alongside a dry-run diff before any production action runs. See [Case Study: SRE Incident-Response Copilot](16-case-studies/48-sre-incident-response-copilot.md).

**Blind-first review** - A human-in-the-loop labeling mode where the annotator commits a label before the LLM's suggested label is revealed, defeating automation bias on subjective or safety-sensitive classes. See [Case Study: Data Annotation Platform](16-case-studies/56-data-annotation-platform.md).

---

## C

**C2PA (Content Credentials)** - An open standard that cryptographically binds provenance metadata (who made this, whether AI was involved, what edits) to a media asset, with tamper-evident hard bindings and watermark-based soft bindings that survive re-encoding. The provenance layer behind AI-content labeling laws; removable, so layer it with watermarking and detection. See [Multimodal Generation](19-multimodal-generation/01-multimodal-generation.md).

**CaMeL (Capabilities for Machine Learning)** - A prompt-injection defense (Google DeepMind, 2025) that runs untrusted data through a privileged planner which emits a capability-gated plan, so instructions hidden in tool results cannot trigger sensitive actions. The reference pattern for capability gating. See [Agentic Security and Sandboxing](07-agentic-systems/09-agentic-security-and-sandboxing.md).

**Capability Gating** - Restricting which tools an agent may invoke based on the trust level of the content currently in context, so state-changing tools (refunds, writes, sends) cannot be fired from untrusted tool results. A core indirect-prompt-injection defense. See [Agentic Security and Sandboxing](07-agentic-systems/09-agentic-security-and-sandboxing.md).

**Capability Index (Composite Benchmark)** - A weighted aggregate of many benchmarks (e.g. Artificial Analysis Intelligence Index, Epoch Capability Index, HAL for agents) used to rank frontier models so the ranking keeps discriminating as individual benchmarks saturate.

**Chain-of-Thought (CoT)** - Prompting technique that elicits step-by-step reasoning before final answer.

**Change Data Capture (CDC)** - Streaming only the inserts, updates, and deletes from a source system (via a log or a delta query) instead of re-crawling everything. The basis for keeping a RAG index fresh and cheap; missing deletes is the classic CDC bug that leaves removed documents retrievable. See [Data Engineering for AI](06-retrieval-systems/15-data-engineering-for-ai.md).

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

**Canary true-positive** - A synthetic but realistic malicious alert injected into a live triage pipeline to continuously measure the system's recall on real threats. See [Case Study: SOC Alert-Triage Copilot](16-case-studies/40-soc-security-operations-copilot.md).

**Citation-support rate** - The fraction of a report's cited claims whose cited source actually entails the claim, the core factuality metric for a cited-report agent. See [Case Study: Deep Research Agent](16-case-studies/42-deep-research-agent.md).

**Composed image retrieval** - Retrieval where the query is an image plus a text modifier ("this jacket but in green"), fused into one query embedding or resolved with structured attribute filters. See [Case Study: E-commerce Visual Search](16-case-studies/51-ecommerce-visual-search.md).

**Confidence gating** - Restricting an autonomous action such as auto-closing an alert to cases where a calibrated model confidence clears a high bar and independent verified signals agree, defaulting to human escalation otherwise. See [Case Study: SOC Alert-Triage Copilot](16-case-studies/40-soc-security-operations-copilot.md).

**Contract playbook** - A company's per-clause set of standard, fallback, and walk-away (red line) negotiation positions, used as the machine-readable ground truth a redlining copilot compares clauses against instead of the model's general legal knowledge. See [Case Study: Contract Drafting and Redlining](16-case-studies/45-contract-drafting-redlining.md).

**Coverage-plateau stop** - A loop-termination rule that halts an agent's search cycle when the marginal new claims per additional search fall below a threshold. See [Case Study: Deep Research Agent](16-case-studies/42-deep-research-agent.md).

**Crescendo attack** - A multi-turn jailbreak that escalates over a sequence of benign-looking turns until the model agrees to something it would refuse in a single prompt. See [Case Study: Automated LLM Red-Teaming](16-case-studies/50-automated-llm-red-teaming.md).

**Claims Allowlist** - An enumerated set of assertions an outbound generator is permitted to make (approved value props, real customer references, published stats), blocking invented case studies, fabricated metrics, and fake urgency. See [Case Study: AI SDR Outbound Sales](16-case-studies/54-ai-sdr-outbound-sales.md).

**Crisis routing** - Detecting a self-harm or suicidal-ideation disclosure and breaking character to surface real crisis resources (988, Crisis Text Line) with a logged handoff, instead of answering in-persona. See [Case Study: AI Companion Platform](16-case-studies/47-ai-companion-character-platform.md).

---

## D

**Data Contamination** - When benchmark questions or their answers leak into a model's training data, inflating scores through memorization rather than capability. Countered with time-gated, private, or held-out test sets. See [Benchmarks and Leaderboards](14-evaluation-and-observability/03-benchmarks-and-leaderboards.md).

**Diffusion Language Model** - A non-autoregressive LLM that generates text by iteratively denoising a masked sequence in parallel rather than left to right, trading some quality for much higher throughput (reported 1,000+ tokens/sec). Strong on code and infilling; early-stage in 2026. See [Diffusion Language Models](04-inference-optimization/08-diffusion-llms.md).

**DPO (Direct Preference Optimization)** - Fine-tuning method that optimizes directly on preference data without a separate reward model.

**Drift Detection** - Monitoring for a statistically significant shift in inputs (input or embedding distribution drift) or outputs (quality drift) of a deployed model, so degradation is caught before users complain. Distinct from APM: a model can return 200 OK while quietly getting worse. See [LLM Evaluation](14-evaluation-and-observability/01-llm-evaluation.md).

**DSPy** - Framework for programming LLMs through optimizable modules rather than manual prompts.

**Dual-LLM Pattern** - A prompt-injection containment design (Simon Willison) that splits work between a privileged LLM which can call tools but never sees raw untrusted text, and a quarantined LLM which processes untrusted content with no tool access, passing only structured, validated data between them. See [LLM Security](12-security-and-access/01-llm-security.md).

**Durable Execution** - An execution model (Temporal, Restate, DBOS) that makes long-running agents survive crashes and restarts via an append-only event history and deterministic replay, giving exactly-once side effects, durable timers, and pauses that outlive deploys. See [Durable Execution](07-agentic-systems/11-durable-execution.md).

**Diarization Error Rate (DER)** - The standard speaker-diarization quality metric: the fraction of audio time where the attributed speaker is wrong (missed speech, false speech, or speaker confusion), with overlapped speech the dominant error source. See [Case Study: Async Meeting Intelligence Platform](16-case-studies/41-meeting-intelligence-platform.md).

---

## E

**Effective Context Length** - The context length at which a model still maintains quality, routinely shorter than the advertised window. On RULER, many models claiming 128K hold quality only to ~32-64K. Design for effective, not advertised, context.

**Embedding** - Dense vector representation of text. Used for semantic search and similarity comparison.

**Endpointing (Turn Detection)** - In voice agents, deciding when the user has finished speaking so the agent can respond. Learned turn-detection models fire on a semantically complete thought, beating fixed silence timeouts that tax every turn. See [Real-Time Voice Agents](18-voice-and-audio-agents/01-realtime-voice-agents.md).

**Ensemble** - Combining multiple model outputs to improve reliability. Includes voting, debate, and mixture-of-agents.

**Entity Resolution** - Normalizing the many surface forms of one real-world entity (a gene, protein, or company can have dozens of names) to a single canonical identifier, often against an ontology (UMLS, ChEMBL, UniProt). The make-or-break step in knowledge-graph construction for GraphRAG. See [GraphRAG](06-retrieval-systems/07-graph-rag.md).

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

**Faithfulness gate** - A separate fact-check pass that decomposes a generated script into atomic claims and verifies each against the source documents, blocking or regenerating any unsupported claim before audio is rendered. See [Case Study: Doc-to-Podcast Audio Generation](16-case-studies/52-doc-to-podcast-audio-generation.md).

**Formula correctness gate** - The deterministic validation (parse to AST, reference and range check, type and unit sanity, sandbox recalculation and reconciliation) a generated spreadsheet formula must pass before it is written back, the spreadsheet analog of a SQL correctness gate. See [Case Study: Spreadsheet Modeling Agent](16-case-studies/55-spreadsheet-financial-modeling-agent.md).

---

## G

**GGUF** - The quantized model file format used by llama.cpp, Ollama, and LM Studio for local inference. Quant levels trade quality for size; Q4_K_M is the practical sweet spot. See [On-Device and Edge Deployment](04-inference-optimization/09-on-device-and-edge-deployment.md).

**GraphRAG** - Retrieval-augmented generation over a knowledge graph rather than (or alongside) a flat vector index, enabling multi-hop, relationship-typed queries and global summaries via community detection. Popularized by Microsoft Research. Worth it when answers require traversing relationships no single chunk contains. See [GraphRAG](06-retrieval-systems/07-graph-rag.md).

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

**Honeypot item (labeling)** - A seeded review item whose displayed pre-label is deliberately wrong, used to catch annotators (or a model) who rubber-stamp suggestions instead of judging independently. See [Case Study: Data Annotation Platform](16-case-studies/56-data-annotation-platform.md).

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

**Knowledge Tracing** - Modeling a learner's mastery of each skill over time from their answer history (Bayesian Knowledge Tracing, Deep Knowledge Tracing) to drive adaptive difficulty in an AI tutor. See [Case Study: Adaptive AI Tutor](16-case-studies/27-adaptive-ai-tutor.md).

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

**Leakage** - In claims adjudication, the dollars lost to overpayment plus paid fraud on auto-decided claims; the budget that bounds how high the straight-through-processing rate can safely go. See [Case Study: Insurance Claims Adjudication](16-case-studies/43-insurance-claims-adjudication.md).

---

## M

**MCP (Model Context Protocol)** - Open protocol for standardized tool/resource integration with LLMs. Launched by Anthropic November 2024; governance moved to the Linux Foundation's Agentic AI Foundation December 2025; adopted by Anthropic, OpenAI, Google, Microsoft, AWS. Version 2.0 (ratified March 2026) adds Streamable HTTP transport and OAuth 2.1 auth.

**Mem0** - An open-source agentic memory layer that extracts, stores, and updates salient facts across sessions (add, update, delete over a vector or graph store), giving agents long-term memory without replaying full history into context. See [Agentic Memory with Mem0](08-memory-and-state/04-agentic-memory-mem0.md).

**Memory Poisoning** - An attack that plants malicious or false entries into an agent's long-term memory so they resurface and influence future sessions. Added to the OWASP 2026 Agentic Top 10 as ASI06. Defense favors provenance at write time over sanitization at read time. See [Research Radar](RESEARCH-RADAR.md).

**Mixture of Agents (MoA)** - Ensemble pattern where multiple agents contribute to a synthesized response.

**Model Collapse** - The degradation that happens when a model is trained repeatedly on AI-generated output: tails of the distribution vanish, diversity shrinks, and quality decays over generations. The core risk of naive synthetic-data pipelines; mitigated by keeping real data in the mix and filtering hard. See [Case Study: Synthetic Data Generation](16-case-studies/37-synthetic-data-generation.md).

**Model Routing** - Choosing which model serves each request by task, cost, latency, capability, or semantics, often with a cascade (cheap model first, escalate on low confidence) and cross-provider fallback. See [AI Gateways and Model Routing](11-infrastructure-and-mlops/03-ai-gateways-and-model-routing.md).

**Multi-Tenancy** - Serving multiple customers from shared infrastructure with data isolation.

**Machine Translation Post-Editing (MTPE)** - A workflow where humans edit machine-translated drafts rather than translating from scratch, reserved for medium-risk content. See [Case Study: Translation and Localization Pipeline](16-case-studies/46-translation-localization-pipeline.md).

**Mailbox Warmup** - Gradually ramping send volume on a new email domain or mailbox to build sender reputation before it carries production outbound. See [Case Study: AI SDR Outbound Sales](16-case-studies/54-ai-sdr-outbound-sales.md).

---

## N

**NCCI edits** - CMS National Correct Coding Initiative rule tables (procedure-to-procedure pairs and Medically Unlikely Edits) that deterministically block unbundling and impossible unit counts in medical coding. See [Case Study: Medical Coding and RCM](16-case-studies/53-medical-coding-rcm.md).

---

## O

**o3** - OpenAI's high-compute reasoning model (released Jan 2025). Uses internal chain-of-thought to allocate test-time compute. Available in standard and "mini" variants. Excels at math, code, and science.

**OCR (Optical Character Recognition)** - Extracting text from images or scanned documents.

**OpenHands** - Open-source autonomous software engineering agent (formerly OpenDevin). Supports multiple backend LLMs, runs in a Docker sandbox.

**OpenTelemetry GenAI (Semantic Conventions)** - The vendor-neutral standard for tracing LLM calls (spans for prompts, responses, tool calls, tokens, cost, model version), so observability is not locked to one platform. Langfuse, LangSmith, Phoenix, and Helicone all emit or ingest it. See [LLM Evaluation](14-evaluation-and-observability/01-llm-evaluation.md).

---

## P

**PagedAttention** - The KV-cache memory manager behind vLLM that stores attention keys and values in non-contiguous fixed-size blocks (like OS virtual-memory paging), eliminating fragmentation and enabling far larger batches and higher throughput. See [Serving Infrastructure](04-inference-optimization/06-serving-infrastructure.md).

**pass^k** - Agent reliability metric: the fraction of tasks solved on all k independent attempts (versus pass@k, solved on at least one). Exposes the reliability cliff where an agent at ~60% pass@1 can drop to ~25% pass^8. The production-relevant consistency signal.

**Prompt Caching** - Reusing the KV cache for repeated prompt prefixes. Available natively in Anthropic (cache_control), Google (implicit), and some OpenAI endpoints. Reduces cost by 60-90% for long fixed prefixes.

**Prompt Injection** - Attack where malicious input manipulates LLM behavior.

**Prefix Caching** - Reusing KV cache for common prompt prefixes across requests.

**Persona card** - A versioned, prefix-cached system prompt that fixes an AI character's identity, voice, backstory, and hard boundaries so it stays consistent across months. See [Case Study: AI Companion Platform](16-case-studies/47-ai-companion-character-platform.md).

**Physician query** - A compliant, non-leading clarification sent to the provider when clinical documentation is ambiguous, used to recover legitimate coding specificity instead of inferring it. See [Case Study: Medical Coding and RCM](16-case-studies/53-medical-coding-rcm.md).

---

## Q

**QLoRA** - LoRA combined with 4-bit quantization for memory-efficient fine-tuning.

**Quantization** - Reducing model precision (e.g., FP16 to INT4) to decrease memory and improve speed.

**Quality Estimation (QE)** - Reference-free scoring of a machine translation's quality from source and hypothesis alone, used to route only risky segments to human review. See [Case Study: Translation and Localization Pipeline](16-case-studies/46-translation-localization-pipeline.md).

**Query bank** - A curated set of validated question-to-SQL pairs used as few-shot exemplars so text-to-SQL generation is grounded in queries known to be correct. See [Case Study: Conversational Analytics (Text-to-SQL)](16-case-studies/39-conversational-analytics-text-to-sql.md).

---

## R

**RAG (Retrieval-Augmented Generation)** - Pattern that retrieves relevant documents to provide context for LLM generation.

**RBAC (Role-Based Access Control)** - Access control based on user roles with predefined permissions.

**ReAct** - Agent pattern alternating between Reasoning and Acting steps.

**Reranking** - Second-stage scoring to improve retrieval precision. Cross-encoders provide higher accuracy than bi-encoders.

**RLHF (Reinforcement Learning from Human Feedback)** - Training method using human preferences to align model behavior.

**RLVR (RL with Verifiable Rewards)** - The dominant post-training recipe for reasoning models: reward the policy with a programmatic verifier (math, code, or logic with a checkable answer) instead of a learned reward model, which largely sidesteps reward-model hacking. See [Training Reasoning Models](03-training-and-adaptation/08-rlvr-and-reasoning-models.md).

**Read/act boundary** - The design rule that an infrastructure copilot may run read-only diagnostic tools autonomously but every state-changing action (rollback, scale, restart, failover) must be a human-approved proposal, enforced at the tool boundary rather than in the prompt. See [Case Study: SRE Incident-Response Copilot](16-case-studies/48-sre-incident-response-copilot.md).

**Recalc reconciliation** - Executing a generated or edited formula in a real spreadsheet engine on a sandboxed copy and comparing the result within a floating-point epsilon against an independent derivation before the number is trusted or shown. See [Case Study: Spreadsheet Modeling Agent](16-case-studies/55-spreadsheet-financial-modeling-agent.md).

**Red line (clause position)** - A counterparty contract term the company will never accept (uncapped indemnity, broad IP assignment, auto-renewal trap); missing one is the asymmetric, costly false negative a redlining copilot tunes recall to catch, distinct from a "redline" tracked-changes edit. See [Case Study: Contract Drafting and Redlining](16-case-studies/45-contract-drafting-redlining.md).

---

## S

**Saga Pattern** - A distributed-transaction pattern that breaks a multi-step workflow into local steps each with a compensating action, so a partial failure rolls back cleanly without a global lock. Used for multi-leg agent workflows (e.g. cross-org booking) where one participant can fail mid-transaction. See [Case Study: Cross-Organization Agent Federation](16-case-studies/38-cross-org-a2a-federation.md).

**SaMD (Software as a Medical Device)** - Software intended for a medical purpose that is itself a regulated medical device. The FDA Clinical Decision Support criteria carve out an exemption when a clinician can independently review the basis of a recommendation, which is why clinical copilots are built to explain and cite rather than to autonomously decide. See [Case Study: Clinical Decision Support](16-case-studies/35-clinical-decision-support.md).

**Self-Consistency** - Sampling multiple reasoning paths and selecting most common answer.

**Semantic Search** - Finding documents by meaning rather than keywords, using embeddings.

**Speculative Decoding** - Using small draft model to propose tokens, verified by large model.

**Speech-to-Speech (S2S)** - A voice-agent architecture where one multimodal model takes audio in and emits audio out directly, versus a cascaded STT to LLM to TTS pipeline. More natural and lower-latency, but less debuggable and controllable. See [Real-Time Voice Agents](18-voice-and-audio-agents/01-realtime-voice-agents.md).

**Structured Outputs** - OpenAI's (and Anthropic's tool-mode) capability to guarantee model output conforms to a provided JSON Schema. Stricter than legacy JSON mode.

**SWE-bench Verified** - Human-validated 500-issue subset of SWE-bench measuring resolution of real GitHub issues; the canonical coding benchmark of 2024-2026. Now near-saturated and partly contaminated, so the field is shifting to SWE-bench Pro and contamination-resistant live variants. Read the harness before trusting a score. See [Benchmarks and Leaderboards](14-evaluation-and-observability/03-benchmarks-and-leaderboards.md).

**SynthID** - Google DeepMind's invisible watermarking for AI-generated images, audio, video, and text that survives common transforms (recompression, cropping). Used as the survivability layer alongside removable C2PA manifests. See [Multimodal Generation](19-multimodal-generation/01-multimodal-generation.md).

**System Prompt** - Instructions that set context and behavior for an LLM conversation.

**Schema linking** - The retrieval step in text-to-SQL that selects only the tables and columns relevant to a question rather than pasting the full warehouse DDL into the prompt, and which dominates text-to-SQL accuracy. See [Case Study: Conversational Analytics (Text-to-SQL)](16-case-studies/39-conversational-analytics-text-to-sql.md).

**Semantic layer** - A governed registry (dbt Semantic Layer, Cube, or LookML) that defines each business metric exactly once so a text-to-SQL copilot compiles the blessed definition instead of guessing SQL over raw columns. See [Case Study: Conversational Analytics (Text-to-SQL)](16-case-studies/39-conversational-analytics-text-to-sql.md).

**Shop the Look** - A visual-search mode that runs object detection over a full lifestyle photo, then searches each detected region separately so one image returns multiple shoppable products. See [Case Study: E-commerce Visual Search](16-case-studies/51-ecommerce-visual-search.md).

**Spam Trap** - An email address (pristine or recycled) that mailbox providers and blocklists use to catch senders with poor list hygiene; hitting one sharply damages domain reputation. See [Case Study: AI SDR Outbound Sales](16-case-studies/54-ai-sdr-outbound-sales.md).

**Straight-through processing (STP)** - Auto-deciding a case (an insurance claim, a loan) end to end with no human touch, gated to low-severity, high-confidence, low-fraud cases; the primary ROI lever in claims automation. See [Case Study: Insurance Claims Adjudication](16-case-studies/43-insurance-claims-adjudication.md).

---

## T

**Temperature** - Parameter controlling randomness of LLM outputs. Lower = more deterministic.

**Test-Time Compute (Inference-Time Scaling)** - Spending more compute at inference with the weights **frozen**: long chain-of-thought, best-of-N, self-consistency, search. Ubiquitous in production by 2026, with diminishing (sometimes negative) returns past a point. Contrast with Test-Time Training.

**Test-Time Training (TTT)** - Updating a model's **weights** at inference (often an ephemeral LoRA) on the test input, its augmentations, or retrieved neighbors, then predicting and discarding the update. Distinct from test-time compute, which leaves weights frozen. Research-stage in 2026; strongest on novel tasks like ARC and on long-context efficiency. See [Research Radar](RESEARCH-RADAR.md#12-test-time-training-learning-at-inference).

**Token** - Basic unit of text processing. Roughly 0.75 words or 4 characters in English.

**Tool Use** - LLM capability to invoke external functions/APIs.

**Transformer** - Neural network architecture based on self-attention. Foundation of modern LLMs.

**Trust-Tagging** - Marking spans of retrieved or tool-result content with a trust level (for example wrapping untrusted text in explicit tags) so the agent and its capability gate refuse to act on instructions embedded in low-trust content. An indirect-prompt-injection defense at the read layer. See [Agentic Security and Sandboxing](07-agentic-systems/09-agentic-security-and-sandboxing.md).

**Temporal grounding** - Returning the exact timestamped span in a video that answers a query, scored by temporal IoU (for example R@1 at IoU >= 0.5) rather than a yes/no. See [Case Study: Long-Form Video Understanding](16-case-studies/49-long-form-video-understanding.md).

**Translation Memory (TM)** - A database of approved source-to-target segment pairs reused for free when new content matches, the localization ground truth a machine-translation model must respect. See [Case Study: Translation and Localization Pipeline](16-case-studies/46-translation-localization-pipeline.md).

---

## U

**Upcoding** - Billing a higher-level or more-specific code than the clinical documentation supports, a False Claims Act violation carrying treble damages; the failure a documentation-grounded coding pipeline is built to prevent. See [Case Study: Medical Coding and RCM](16-case-studies/53-medical-coding-rcm.md).

---

## V

**VAD (Voice Activity Detection)** - Detecting whether a chunk of audio contains speech, the first stage of a voice agent's turn-taking. Paired with endpointing to decide when the user has finished; fast VAD also enables barge-in. Silero VAD is a common choice. See [Real-Time Voice Agents](18-voice-and-audio-agents/01-realtime-voice-agents.md).

**Vector Database** - Database optimized for storing and searching high-dimensional vectors (embeddings).

**Video RAG** - Retrieving relevant time-coded segments from a pre-built multimodal index, then having a vision-language model reason over only those segments to answer with timestamp citations. See [Case Study: Long-Form Video Understanding](16-case-studies/49-long-form-video-understanding.md).

---

## W

**Windsurf** - AI-native IDE (by Codeium) with tight agentic integration. Uses "Flows" (deterministic agentic sequences). Alternative to Cursor.

---

## Z

**Zero-Shot** - Prompting without examples, relying on model's pre-existing knowledge.

---

*See also: [PATTERNS.md](PATTERNS.md) for design pattern quick reference*
