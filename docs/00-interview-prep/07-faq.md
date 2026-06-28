# Frequently Asked Questions: AI Engineering, RAG, and Agents

Short, direct answers to the questions people ask most about modern AI system design. Each answer points to the chapter where the topic is covered in depth.

## Table of Contents

- [General: AI Engineering Role](#general)
- [RAG and Retrieval](#rag)
- [Agents and Tool Use](#agents)
- [Models and Selection](#models)
- [Evaluation and Observability](#evaluation)
- [Inference and Cost](#inference)
- [Memory and State](#memory)
- [Security and Safety](#security)

---

## General

### What is an AI engineer?

An AI engineer builds production systems on top of large language models. The role sits between traditional software engineering and machine learning research: less model training, more system design around models that already exist. Day-to-day work covers prompt and context engineering, retrieval pipelines, agent loops, evaluation harnesses, and the infrastructure that keeps it all online. See [AI Job Market Trends](06-job-market-trends-2026.md).

### What is the difference between an AI engineer and an ML engineer?

ML engineers train, fine-tune, and ship models. AI engineers compose existing models (usually via APIs) into products. ML engineers spend their time on datasets and training loops. AI engineers spend their time on prompts, RAG, agents, evals, and latency. The boundary blurs at large companies that do both. See [Transition Guide](../TRANSITION_GUIDE.md).

### How do I become an AI engineer?

If you already write production code, the gap is small: learn how LLMs behave, learn RAG and agent patterns, learn evaluation, and learn one inference stack. The [Transition Guide](../TRANSITION_GUIDE.md) maps your current role (backend, frontend, QA, PM, data, DevOps) to the AI roles that fit and the specific skills to close.

### What programming language should I learn for AI engineering?

Python is the default for AI work. TypeScript is the most common second language because frontend and edge agent stacks live there. C# and Go show up in enterprise infrastructure roles. Most production AI code reads as ordinary application code: HTTP clients, queue consumers, database calls, plus calls to a model provider.

### Is AI engineering a good career?

Demand is strong and pay tracks senior software engineering, often higher at frontier labs. The risk is that the stack changes fast: a framework that mattered last year may be deprecated today. The skills that compound across releases are evaluation, system design, and grounded debugging. See [Job Market Trends](06-job-market-trends-2026.md).

---

## RAG

### What is RAG?

Retrieval-Augmented Generation is the pattern of fetching external context (documents, rows, code, images) at query time and putting it in the LLM's prompt so the model can ground its answer instead of hallucinating from training data. It is the most common production pattern for any LLM that needs to know things outside its training cutoff. See [RAG Fundamentals](../06-retrieval-systems/01-rag-fundamentals.md).

### How does RAG work?

A user query is converted into a search request, the system retrieves the most relevant chunks from a knowledge store (vector DB, keyword index, graph, or a mix), reranks them, and passes the top results to the LLM as context for generation. The two failure points are retrieval (the right chunk was not returned) and generation (the model ignored or misused the chunk). Most RAG failures are retrieval failures.

### Is RAG dead because of long context windows?

No. Even with 1M-2M token context windows on Claude Opus 4.7, Claude Sonnet 4.6, GPT-5.5, and Gemini 3.1 Pro, RAG wins on cost, latency, freshness, and corpus scale. Enterprise datasets (SharePoint, log archives, code monorepos) exceed any context window. RAG acts as the filter that finds the 0.01% of data worth putting into that high-value window. See [RAG vs Long Context](../06-retrieval-systems/14-production-rag-at-scale.md).

### What is the difference between RAG and fine-tuning?

RAG injects knowledge at query time through context. Fine-tuning bakes behavior into the weights. The rule of thumb: **RAG for facts, fine-tuning for form**. Use RAG when the knowledge changes, when you need citations, or when data must stay outside the model. Use fine-tuning when you want a consistent tone, a strict output format, or lower latency on repeated tasks. See [Fine-Tuning Strategies](../03-training-and-adaptation/02-fine-tuning-strategies.md).

### What is the best vector database?

There is no single best. Pinecone wins on managed scale and SLAs. Qdrant leads open-source speed (roughly 12ms p99 at 10M vectors). Weaviate has the strongest native hybrid (BM25 + dense + metadata in one query). Milvus is the choice once you need distributed scale beyond 50M vectors. pgvector is the right answer if you are already on Postgres and your index is under 10M vectors. See [Vector Databases](../06-retrieval-systems/04-vector-databases.md).

### What is contextual retrieval?

Contextual retrieval is an Anthropic technique that prepends a short LLM-generated context summary to each chunk before embedding and indexing it, so the chunk carries its place in the document with it. Anthropic reports a 49% reduction in retrieval failures with hybrid search, and 67% when combined with a reranker. See [Contextual Retrieval](../06-retrieval-systems/10-contextual-retrieval.md).

### What is hybrid search?

Hybrid search combines sparse keyword retrieval (typically BM25) with dense vector retrieval and fuses the two ranked lists into one, usually with Reciprocal Rank Fusion. The sparse arm catches exact tokens (product codes, function names, rare nouns); the dense arm catches synonyms and intent. Every modern vector DB ships hybrid out of the box. See [Hybrid Search](../06-retrieval-systems/05-hybrid-search.md).

### What is GraphRAG?

GraphRAG extracts entities and relationships from a corpus, builds a knowledge graph, and queries by traversal instead of (or alongside) vector similarity. It is the right pattern for **aggregative questions** ("summarize all legal risks across these 50 contracts") where vector RAG returns related-but-disconnected chunks. Microsoft's LazyGraphRAG defers expensive community summarization to query time, cutting ingestion cost. See [GraphRAG](../06-retrieval-systems/07-graph-rag.md).

### What is the best chunk size for RAG?

There is no universal answer. 300-500 token chunks with 50-token overlap is a reasonable default for prose. Code and structured data want larger chunks (1000-2000 tokens). The bigger wins come from **structure-aware chunking** (split at headers, paragraphs, code blocks), **contextual chunking** (prepend a summary), and **hierarchical chunking** (index small chunks, return the parent context). See [Chunking Strategies](../06-retrieval-systems/02-chunking-strategies.md).

---

## Agents

### What is an AI agent?

An AI agent is a system where an LLM decides what to do next, runs a tool, observes the result, and decides again, all in a loop. The simplest agent is the ReAct pattern: Thought → Action → Observation → repeat. Modern agents (Claude Opus 4.7, GPT-5.5 reasoning, DeepSeek-R2) bake the reasoning step into the model itself. See [Agent Fundamentals](../07-agentic-systems/01-agent-fundamentals.md).

### What is the difference between an agent and a chatbot?

A chatbot responds to a message. An agent **takes actions** in the world: runs code, calls APIs, reads files, sends messages, books appointments. That distinction matters because actions are hard to roll back, so agents need very different guardrails, sandboxing, and human-in-the-loop patterns. See [Agentic Security](../07-agentic-systems/09-agentic-security-and-sandboxing.md).

### What is MCP (Model Context Protocol)?

MCP is an open protocol that lets LLM applications connect to tools and data sources through a standard interface. Anthropic launched it in November 2024. Governance moved to the Linux Foundation's Agentic AI Foundation in December 2025. Adoption is universal: Anthropic, OpenAI, Google, Microsoft, AWS all support it. As of May 2026 there are over 2,300 public MCP servers. See [Tool Use and MCP](../07-agentic-systems/03-tool-use-and-mcp.md).

### What is the best agent framework?

The big three cover most production needs. **LangGraph** (graph-based, surpassed CrewAI in stars in early 2026) is the default for stateful multi-agent control flow with checkpointing. **CrewAI** (now v1.13, used in 60%+ of the Fortune 500) is the choice for role-based business automation. **Microsoft Agent Framework** (RC 1.0 February 2026, GA Q2 2026) is the consolidated successor to AutoGen and Semantic Kernel for enterprise .NET and Python. See [Framework Selection Guide](../09-frameworks-and-tools/08-framework-selection-guide.md).

### What is agentic RAG?

Agentic RAG replaces the linear retrieve-then-generate pipeline with a loop where the agent decides what to retrieve, evaluates whether the results are good enough, and re-queries if not. Patterns include Self-RAG (model emits reflection tokens), Corrective RAG (separate grader), Adaptive RAG (classifier picks the depth), and multi-hop decomposition. Budget for 8-12 seconds per query at three to four iterations. See [Agentic RAG](../06-retrieval-systems/08-agentic-rag.md).

### How do computer-use agents work?

A computer-use agent takes screenshots of a desktop or browser, decides on a mouse and keyboard action, executes it, and takes another screenshot. The three production options are Claude Computer Use (OS-portable via screenshots), Google Gemini Computer Use (browser-optimized via DOM awareness), and OpenAI Operator (web-task focused). Claude Sonnet 4.6 reaches 72.5% on OSWorld-Verified, up from 14.9% at the October 2024 launch. See [Computer-Use Agents](../17-tool-use-and-computer-agents/04-computer-use-agents.md).

### What is context engineering?

Context engineering is curating the full set of tokens an agent sees on every inference turn (system prompt, tools, retrieved data, prior tool results, message history), as opposed to prompt engineering, which writes one good instruction once. It matters because long-running agents suffer **context rot**: accuracy drops as the window fills with stale tool output. The core techniques are compaction (summarize and restart the loop), just-in-time loading (hold references, fetch on demand), structured note-taking (write progress outside the window), and sub-agent isolation (delegate detail-heavy sub-tasks to a clean window that returns a short summary). The goal is the smallest high-signal token set per turn. See [Context Engineering](../05-prompting-and-context/05-context-engineering.md).

### What are Agent Skills?

Agent Skills are folders of instructions, scripts, and resources that an agent loads on demand to specialize at a task. Each skill is a `SKILL.md` file with YAML metadata plus optional bundled files. They use **progressive disclosure**: the name and description sit in the system prompt, the full `SKILL.md` loads only when the agent judges it relevant, and referenced files load only as needed, which keeps context small. Skills complement MCP: MCP connects an agent to tools and data, Skills teach it the workflow for using them. See [Building Tool-Use Agents](../17-tool-use-and-computer-agents/05-building-tool-agents.md).

---

## Models

### What is the best LLM right now?

There is no single best model in June 2026, but the capability ceiling moved: **Claude Fable 5** (June 9) is Anthropic's most capable widely released model, a Mythos-class model with safeguards at $10/$50 per 1M. Below the ceiling, the leaderboard is fractured by task. **Claude Opus 4.8** leads SWE-Bench Pro at 69.2% for long-horizon coding at half Fable's price. **GPT-5.5** holds SWE-bench Verified (88.7%) and Terminal-Bench. **Gemini 3.1 Pro** leads GPQA Diamond at 94.3% for scientific reasoning. **Claude Sonnet 4.6** remains the price-to-quality workhorse at $3/$15. See [Model Taxonomy](../02-model-landscape/01-model-taxonomy.md).

### How much does Claude / GPT / Gemini / DeepSeek cost?

Pricing changes monthly. As of June 2026, frontier-tier closed models run roughly $3-15 per million input tokens and $15-75 per million output tokens, with caching cutting that 75-90% on repeated prefixes. Mid-tier models (Claude Sonnet 4.6, GPT-5.5-mini, Gemini 3.1 Flash) run roughly $0.30-3 / $1-15 per million. **DeepSeek reset the floor**: V4 Pro is $0.435 / $0.87 per 1M (75% discount made permanent May 22, 2026), and V4 Flash is $0.14 / $0.28 per 1M with a 1M context window, roughly 10x cheaper than the closed frontier for many tasks. Always cross-check the provider pricing pages for current rates. See [Pricing and Costs](../02-model-landscape/03-pricing-and-costs.md).

### What is the difference between Claude Opus and Claude Sonnet?

Opus is Anthropic's frontier tier (Opus 4.8: smartest of the 4.x line, $5/$25). Sonnet is the production workhorse: roughly 90% of Opus quality at 60% of the price. Haiku is the fast tier: cheap, low-latency, good for routing and classification. Above all three sits Claude Fable 5 ($10/$50), the capability ceiling for work that justifies 2x Opus pricing. The right pattern is to route easy queries to Haiku, mid queries to Sonnet, hard ones to Opus, and only ceiling-bound work to Fable. See [Model Selection](../02-model-landscape/04-model-selection-guide.md).

### Should I use an open-source model?

Yes for cost-per-query at high volume, data residency, or fine-tuning needs. Open-weight quality has closed to within 5-15 points of the closed frontier (Qwen3-Embedding-8B leads MTEB Multilingual, Llama 4 Maverick and DeepSeek V4 Pro are competitive frontier picks). The tradeoff is operational: you own the inference stack, the GPU bill, and the security patches. See [Model Landscape](../02-model-landscape/01-model-taxonomy.md).

### What is prompt caching?

Prompt caching keeps the KV cache for a fixed prompt prefix warm on the inference server so subsequent calls only pay for the new tokens. All major providers support it. Cache reads are 75-90% cheaper than fresh tokens. The catch: cache writes typically cost 25% more, so caching only pays off if you reuse the same prefix at least 3-5 times within the TTL (usually 5 minutes). See [KV Cache and Context Caching](../04-inference-optimization/02-kv-cache-and-context-caching.md).

---

## Evaluation

### How do you evaluate an LLM?

LLM evaluation is layered: **reference-free metrics** (faithfulness, relevance, coherence via LLM-as-judge) for rapid iteration, **golden test sets** for regression, and **task-specific metrics** (exact match for QA, BLEU for translation, pass@k for code). For RAG specifically, use the RAG Triad: context relevance, faithfulness, answer relevance. See [LLM Evaluation](../14-evaluation-and-observability/01-llm-evaluation.md).

### What is LLM-as-judge?

LLM-as-judge uses one LLM to score the output of another against a rubric (correctness, helpfulness, safety). It scales where human evaluation cannot, but has known biases: position bias, verbosity bias, self-preference bias. The standard practice is to use a stronger model as judge (Claude Opus 4.8 or GPT-5.5 reasoning), randomize positions, and validate against a small human-labeled sample.

### What is the best LLM observability tool?

The leading platforms are **Langfuse** (best self-hosted open-source, acquired by ClickHouse in January 2026), **Braintrust** (best for eval-driven CI/CD with quality gates), **LangWatch** (best for agent simulation), **LangSmith** (LangChain-native), and **Arize Phoenix** (OTel-native). Pick based on deployment model (SaaS vs self-hosted), whether you need CI/CD gating, and how heavily you use a specific framework. See [Observability](../14-evaluation-and-observability/02-observability.md).

### What is RAGAS?

RAGAS (Retrieval Augmented Generation Assessment) is a Python library for RAG evaluation. It provides reference-free metrics (faithfulness, answer relevance, context relevance) and reference-based metrics (context recall, context precision) computed with LLM-as-judge. It is the de facto starting point for any RAG eval pipeline. See [RAG Evaluation](../06-retrieval-systems/13-rag-evaluation-patterns.md).

### How do you detect and handle model drift in production?

Drift comes from two sides: the **provider** silently updates a model (or you migrate versions), and your **traffic** shifts away from what your prompts and evals were tuned on. Detection: pin model versions explicitly, run a canary eval suite daily against the pinned and latest versions, track output-distribution stats (length, refusal rate, format validity) and judge-scored quality on a sampled live slice, and alert on deltas. Response: a frozen golden set tells you whether the model changed or your traffic did; re-run prompt evals before adopting a new version, and keep the previous version warm for instant rollback. Treat an unexplained quality drop like an incident with an on-call path, not a curiosity.

---

## Inference

### What is vLLM?

vLLM is an open-source LLM inference engine that pioneered PagedAttention (virtual-memory-style allocation of the KV cache). It is the default open inference engine when the workload is "Llama, Mistral, Qwen, or DeepSeek under continuous batching." It is the easiest to operate and best-patched of the major engines. Multimodal deployments must run v0.18.2+ due to a February 2026 CVE. See [Serving Infrastructure](../04-inference-optimization/06-serving-infrastructure.md).

### What is the difference between vLLM and SGLang?

Both are open-source inference engines. vLLM has broader model coverage and operational maturity. SGLang has roughly 29% higher throughput on structured-output and function-calling workloads thanks to async constrained decoding, and best-in-class prefix-cache reuse via RadixAttention. Important caveat: SGLang's multimodal path has unpatched CVEs as of May 2026, so multimodal traffic should run on vLLM v0.18.2+ instead.

### What is TensorRT-LLM?

NVIDIA's inference engine. Delivers 2-4x higher throughput than vLLM and TGI on H100/H200/B200, but at the cost of 1-2 weeks of setup and a hard NVIDIA lock-in. The right choice when you have committed NVIDIA capacity and the throughput delta pays for the operational tax.

### How do you optimize LLM inference cost?

Five high-leverage moves: **model cascading** (route easy queries to small models, hard ones to frontier), **prompt caching** (75-90% off repeated prefixes), **semantic caching** (skip the LLM call entirely for similar queries), **quantization** (FP8 or 4-bit weights to fit more on a GPU), and **continuous batching** (vLLM/SGLang batch at the iteration level). Together they routinely cut inference cost by 10x without losing quality. See [Cost Optimization](../04-inference-optimization/07-cost-optimization-playbook.md).

### What is speculative decoding?

Speculative decoding lets an LLM generate multiple tokens per forward pass by having a cheaper "draft" model (or extra heads on the main model, like Medusa) predict the next few tokens, then verifying them all in a single parallel pass on the target model. The win is 2-3x faster wall-clock generation with zero quality loss. Built into vLLM and TensorRT-LLM. See [Speculative Decoding](../04-inference-optimization/03-speculative-decoding.md).

### What is a token budget and how do you enforce it?

A token budget is a hard ceiling on token consumption at a chosen scope: per request (max input plus `max_tokens` output), per user or tenant per day, per agent task (step budgets so a runaway loop cannot burn the month's spend), and per team per month for expensive tiers. Enforcement lives in the gateway, not in prompts: count tokens before dispatch, reject or downgrade requests over the per-request cap, decrement tenant quotas atomically, and terminate agent runs that exceed their step budget with a clean escalation. The practical pairing is budget plus routing: when a tenant nears quota, the router degrades them to a cheaper tier instead of cutting them off.

### How do you design fallbacks across multiple LLM providers?

Treat providers as unreliable dependencies with policy differences, not just uptime differences. The pattern: a primary with one or two fallbacks per task type, circuit breakers per provider on error rate, p95 latency, and rate-limit headroom, with pre-emptive traffic shifting before hard limits. Three details separate production designs from whiteboard ones: **provider-paired prompts** (a prompt tuned for Claude underperforms on GPT-5.5, so prompt variants version with the provider), **cache economics** (failing over resets your prefix cache, so a warm primary can beat a nominally cheaper cold fallback), and **policy-aware fallback** (a provider can decline a content category your product needs, which is a failure class your health checks will not catch). Verify the whole chain monthly with a game-day drill.

---

## Memory

### What is the best AI agent memory framework?

The four mature options as of May 2026 are **Mem0** (broadest standalone memory layer, scores 92.5 on LoCoMo and 94.4 on LongMemEval), **Zep** (temporal-aware production pipelines with native conversation summarization), **Letta** (OS-style paging for long-running agents with unbounded memory), and **Cognee** (knowledge-graph-first for RAG-heavy workflows). Pick by use case: chatbot personalization → Mem0; production agent at scale → Zep; long-horizon task agent → Letta; KG-grounded RAG → Cognee. See [Agentic Memory](../08-memory-and-state/04-agentic-memory-mem0.md).

### What is the difference between short-term and long-term memory in agents?

Short-term memory lives in the LLM's context window (the current turn, tool outputs, scratchpad). Long-term memory persists across sessions in a vector DB, graph, or relational store. Memory architectures split further: **episodic** (past trajectories), **semantic** (extracted facts about the user/world), **procedural** (learned skills, playbooks). Picking the right tier for a given fact matters: a session preference promoted to long-term memory leaks across sessions. See [Memory Architectures](../08-memory-and-state/01-memory-architectures.md).

### How does a knowledge graph help an AI agent?

A knowledge graph stores entities and relationships explicitly (User → OWNER_OF → Project_A). It gives the agent **deterministic** retrieval over structured relationships, which vector search cannot. The strongest pattern is hybrid: vector search finds the entry node by similarity, graph traversal expands relevant context. Used for compliance, multi-hop reasoning, and any domain where relationships are first-class (legal, biomedical, finance). See [Long-Term Memory](../08-memory-and-state/03-long-term-memory.md).

---

## Security

### What is prompt injection?

Prompt injection is the LLM-era version of SQL injection: malicious content in a user input or a retrieved document overrides the system instructions and makes the model do something it should not. **Direct injection** is in the user prompt. **Indirect injection** is hidden in a document the model reads (a webpage, an email, a PDF). The OWASP LLM Top 10 lists it as the #1 LLM risk. See [Prompt Injection Defense](../05-prompting-and-context/08-prompt-injection-defense.md).

### How do you prevent prompt injection?

There is no silver bullet: prompt injection cannot be fully "escaped" the way SQL can. The production defense stack combines: **input isolation** (XML tags marking untrusted content), **dual-LLM patterns** (small guard model classifies intent before the main model sees the input), **canary tokens** (detect if the model leaked its system prompt), **least-privilege tool scopes**, and **human-in-the-loop** on destructive tool calls. See [Agentic Security](../07-agentic-systems/09-agentic-security-and-sandboxing.md).

### What is OWASP LLM Top 10?

The OWASP Top 10 for LLM Applications (v2.0, released 2025) is the canonical list of LLM security risks. Top entries: prompt injection, insecure output handling, training data poisoning, model denial of service, supply chain vulnerabilities, sensitive information disclosure, insecure plugin design, excessive agency, overreliance, and model theft. The 2026 update for agentic apps adds goal hijacking, identity abuse, and cascading failures as top risks. See [LLM Security](../12-security-and-access/01-llm-security.md).

### What is sandboxing in AI agents?

Sandboxing isolates the code an agent generates and runs from the host system. The standard pattern uses ephemeral micro-VMs (E2B, Docker, Firecracker) that spin up in under 10ms, run the code, and get destroyed. Without sandboxing, a prompt-injected agent can `rm -rf /` or exfiltrate secrets. With sandboxing, the worst case is a destroyed throwaway container.

---

## Related Reading

- [Question Bank (110 senior interview questions)](01-question-bank.md)
- [Answer Frameworks](02-answer-frameworks.md)
- [Common Pitfalls](03-common-pitfalls.md)
- [Whiteboard Exercises](04-whiteboard-exercises.md)
- [AI Job Market Trends](06-job-market-trends-2026.md)

---

*Have a question that should be here? Open an issue or PR on the repo.*
