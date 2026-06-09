# AI System Design Glossary

Quick reference for key terms used throughout this guide.

---

## A

**Agentic Coding** — LLM autonomously editing files, running shell commands, writing tests and iterating until a coding task is complete. Exemplified by Claude Code, OpenHands, and Cline.

**Agentic System** — LLM application that autonomously plans and executes multi-step tasks using tools.

**Attention Mechanism** — Neural network component that allows models to focus on relevant parts of input. Self-attention compares each token to all others.

**ABAC (Attribute-Based Access Control)** — Access control based on attributes of user, resource, and environment rather than fixed roles.

---

## B

**Batching** — Processing multiple requests together to improve GPU utilization. Continuous batching adds new requests while others generate.

**BM25** — Traditional keyword-based ranking algorithm. Often combined with vector search for hybrid retrieval.

**Budget Tokens** — The configurable compute budget for Extended Thinking (Claude) or reasoning (o3). Higher budget → more internal reasoning steps → higher accuracy and cost.

---

## C

**Chain-of-Thought (CoT)** — Prompting technique that elicits step-by-step reasoning before final answer.

**Chunking** — Splitting documents into smaller pieces for embedding and retrieval. Strategies include fixed-size, semantic, and hierarchical.

**Claude Code** — Anthropic's terminal-native autonomous coding agent. Uses bash, text_editor, and computer tools to read, edit, and run code across a full project. Controlled via CLAUDE.md manifest files.

**Claude Fable 5** - Anthropic's most capable widely released model (June 9, 2026, `claude-fable-5`). A Mythos-class model made safe for general availability: $10/$50 per 1M, 1M context, adaptive thinking always on. Sensitive queries fall back to Claude Opus 4.8 in under 5% of sessions. The unrestricted variant, Claude Mythos 5, is limited to Project Glasswing partners.

**Cline** — Open-source VS Code extension providing autonomous AI coding with tool use (file editing, terminal, browser). MCP-native.

**Computer-Use** — A model capability (native to Claude 3.5+) to control a GUI by simulating mouse clicks, keyboard input, and screenshots. Enables browser and desktop automation.

**Context7** — MCP server that fetches up-to-date library documentation at runtime, solving the "stale training data" problem for coding agents.

**Context Window** — Maximum number of tokens an LLM can process in a single request. Ranges from 4K to 1M+ tokens.

**Cosine Similarity** — Measure of similarity between two vectors. Standard metric for comparing embeddings.

**Cursor** — AI-native IDE (fork of VS Code) with deep model integration for code completion, agentic editing, and multi-file context awareness.

---

## D

**DPO (Direct Preference Optimization)** — Fine-tuning method that optimizes directly on preference data without a separate reward model.

**DSPy** — Framework for programming LLMs through optimizable modules rather than manual prompts.

---

## E

**Embedding** — Dense vector representation of text. Used for semantic search and similarity comparison.

**Ensemble** — Combining multiple model outputs to improve reliability. Includes voting, debate, and mixture-of-agents.

**Extended Thinking** — Claude's (3.7+) internal reasoning mode where the model performs a scratchpad reasoning pass before producing a response. Configurable via `thinking.budget_tokens`. Not shown to end users by default.

---

## F

**Few-Shot Prompting** — Including examples in the prompt to guide model behavior.

**Fine-Tuning** — Training a pre-trained model on task-specific data to improve performance.

**Function Calling** — LLM capability to output structured tool invocations rather than plain text.

---

## G

**Guardrails** — Input/output validation to prevent harmful or off-topic responses.

**Grounding** — Connecting LLM responses to factual sources to reduce hallucination.

**Grok 4.3** - xAI's frontier reasoning model. Competitive with GPT-5.5, Claude Opus 4.7, and Gemini 3.1 Pro on reasoning benchmarks. Available via xAI API and inside X.

---

## H

**Hallucination** — Model generating plausible but factually incorrect information.

**HNSW (Hierarchical Navigable Small World)** — Graph-based algorithm for approximate nearest neighbor search in vector databases.

**Human-in-the-Loop (HITL)** — Patterns for human oversight, approval, or correction of AI outputs.

---

## I

**In-Context Learning** — Model adapting to task based on examples in the prompt without weight updates.

**Inference** — Running a trained model to generate predictions/outputs.

---

## J

**JSON Mode** — LLM output mode that guarantees valid JSON structure (legacy). Superseded by **Structured Outputs** in newer APIs.

---

## K

**KV Cache** — Cached key-value pairs from attention computation. Enables efficient autoregressive generation.

---

## L

**LangChain** — Framework for building LLM applications with chains, agents, and integrations.

**LlamaIndex** — Data framework focused on document processing and retrieval for LLM applications.

**LiveCodeBench** — Benchmark evaluating coding models on real-world problems from competitive programming platforms. More reliable than HumanEval for production coding tasks.

**LoRA (Low-Rank Adaptation)** — Parameter-efficient fine-tuning that trains small adapter matrices instead of full model weights.

**LLM-as-Judge** — Using an LLM to evaluate outputs from another LLM.

---

## M

**MCP (Model Context Protocol)** - Open protocol for standardized tool/resource integration with LLMs. Launched by Anthropic November 2024; governance moved to the Linux Foundation's Agentic AI Foundation December 2025; adopted by Anthropic, OpenAI, Google, Microsoft, AWS. Version 2.0 (ratified March 2026) adds Streamable HTTP transport and OAuth 2.1 auth.

**Mixture of Agents (MoA)** — Ensemble pattern where multiple agents contribute to a synthesized response.

**Multi-Tenancy** — Serving multiple customers from shared infrastructure with data isolation.

---

## O

**o3** — OpenAI's high-compute reasoning model (released Jan 2025). Uses internal chain-of-thought to allocate test-time compute. Available in standard and "mini" variants. Excels at math, code, and science.

**OCR (Optical Character Recognition)** — Extracting text from images or scanned documents.

**OpenHands** — Open-source autonomous software engineering agent (formerly OpenDevin). Supports multiple backend LLMs, runs in a Docker sandbox.

---

## P

**Prompt Caching** — Reusing the KV cache for repeated prompt prefixes. Available natively in Anthropic (cache_control), Google (implicit), and some OpenAI endpoints. Reduces cost by 60-90% for long fixed prefixes.

**Prompt Injection** — Attack where malicious input manipulates LLM behavior.

**Prefix Caching** — Reusing KV cache for common prompt prefixes across requests.

---

## Q

**QLoRA** — LoRA combined with 4-bit quantization for memory-efficient fine-tuning.

**Quantization** — Reducing model precision (e.g., FP16 to INT4) to decrease memory and improve speed.

---

## R

**RAG (Retrieval-Augmented Generation)** — Pattern that retrieves relevant documents to provide context for LLM generation.

**RBAC (Role-Based Access Control)** — Access control based on user roles with predefined permissions.

**ReAct** — Agent pattern alternating between Reasoning and Acting steps.

**Reranking** — Second-stage scoring to improve retrieval precision. Cross-encoders provide higher accuracy than bi-encoders.

**RLHF (Reinforcement Learning from Human Feedback)** — Training method using human preferences to align model behavior.

---

## S

**Self-Consistency** — Sampling multiple reasoning paths and selecting most common answer.

**Semantic Search** — Finding documents by meaning rather than keywords, using embeddings.

**Speculative Decoding** — Using small draft model to propose tokens, verified by large model.

**Structured Outputs** — OpenAI's (and Anthropic's tool-mode) capability to guarantee model output conforms to a provided JSON Schema. Stricter than legacy JSON mode.

**SWE-bench Verified** — Industry standard benchmark for autonomous software engineering. Measures ability to resolve real GitHub issues. Top models (Claude 3.7, o3) score 50–70%+.

**System Prompt** — Instructions that set context and behavior for an LLM conversation.

---

## T

**Temperature** — Parameter controlling randomness of LLM outputs. Lower = more deterministic.

**Token** — Basic unit of text processing. Roughly 0.75 words or 4 characters in English.

**Tool Use** — LLM capability to invoke external functions/APIs.

**Transformer** — Neural network architecture based on self-attention. Foundation of modern LLMs.

---

## V

**Vector Database** — Database optimized for storing and searching high-dimensional vectors (embeddings).

---

## W

**Windsurf** — AI-native IDE (by Codeium) with tight agentic integration. Uses "Flows" — deterministic agentic sequences. Alternative to Cursor.

---

## Z

**Zero-Shot** — Prompting without examples, relying on model's pre-existing knowledge.

---

*See also: [PATTERNS.md](PATTERNS.md) for design pattern quick reference*
