# Framework Selection Guide

The landscape of AI frameworks has consolidated significantly over the past year. Every major AI lab now ships an agent SDK, Microsoft merged AutoGen and Semantic Kernel into a unified Agent Framework, and interoperability protocols (MCP, A2A) are table stakes. This guide provides the **Decision Matrix** for choosing your stack based on production requirements, team expertise, and system scale.

## Table of Contents

- [The Framework Landscape](#landscape)
- [The Decision Matrix](#matrix)
- [Build vs. Buy vs. Framework](#build-vs-buy)
- [Anti-Patterns to Avoid](#anti-patterns)
- [Staff-Level Recommendation](#recommendation)
- [Interview Questions](#interview-questions)

---

## The Framework Landscape

### Orchestration & Agent Frameworks

| Framework | Tier | Primary Value | Key Weakness |
|-----------|------|---------------|--------------|
| **LangGraph** | L1 (Core) | Precise state control, graph-based | Complexity, steep learning curve |
| **DSPy** | L1 (Core) | Reliability & Optimization | Upfront cost (Training) |
| **LlamaIndex**| L2 (Data) | Advanced Retrieval (RAG) | Logic flexibility |
| **CrewAI** | L3 (App) | Business process speed, enterprise RBAC | Hides failures |
| **MS Agent Framework** | L1 (Enterprise) | Unified .NET + Python, replaces AutoGen + SK | RC status (GA Q2 2026) |

### Agent SDKs (Lab-Specific)

| Framework | Tier | Primary Value | Key Weakness |
|-----------|------|---------------|--------------|
| **Claude Agent SDK** | L1 (Agent) | Built-in tools, production agent loop | Requires Anthropic API |
| **OpenAI Agents SDK** | L1 (Agent) | Lightweight handoffs, guardrails | OpenAI-centric |
| **Google ADK** | L1 (Agent) | Multi-language, native A2A + Google Cloud | Google ecosystem bias |

### Coding Agents

| Framework | Tier | Primary Value | Key Weakness |
|-----------|------|---------------|--------------|
| **Claude Code** | L1 (Coding) | Autonomous CLI coding agent | Requires Anthropic API |
| **Cursor / Windsurf** | L2 (IDE) | Tight IDE + agent integration | Closed-source infra |
| **OpenHands** | L2 (Coding) | Open-source autonomous agent | Requires self-hosting |

> **April 2026 note**: Semantic Kernel is no longer listed as a standalone framework. It has been merged into the Microsoft Agent Framework. Existing SK users should plan migration.

---

## The Decision Matrix

**Use this logic to select your stack:**

### Core Orchestration
1. **Is it a pure RAG app?** → **LlamaIndex**.
2. **Does it require long-running state/Human-in-the-loop?** → **LangGraph**.
3. **Is high reliability (99%+) and cross-model portability critical?** → **DSPy**.
4. **Are you a C#/.NET enterprise shop?** → **Microsoft Agent Framework** (replaces Semantic Kernel + AutoGen).
5. **Are you building high-level automations for business users?** → **CrewAI + Flows**.

### Agent SDKs (choose based on your primary model provider)
6. **Building agents on Claude / Anthropic API?** → **Claude Agent SDK** (Python/TS, built-in tools for file/code/command).
7. **Building agents on OpenAI API?** → **OpenAI Agents SDK** (lightweight handoffs, guardrails, MCP support).
8. **Building agents on Google Cloud / Gemini?** → **Google ADK** (native A2A, Vertex AI deployment, multi-language).
9. **Need cross-vendor agent communication?** → Use **A2A protocol** on top of any framework above.

### Coding Agents
10. **Are you doing autonomous file-system level coding tasks?** → **Claude Code** (CLI) or **Cline** (VS Code).
11. **Need open-source coding agent that works with any LLM?** → **OpenHands** (Docker).
12. **Want the best IDE experience with AI?** → **Cursor** (closed) or **Windsurf** (Codeium).

---

## Build vs. Buy vs. Framework

As a Staff Engineer, you must resist **Framework Bloat**.

- **Use a Framework** when it solves a **Non-Trivial Computer Science Problem** (e.g., State persistence, Bayesian prompt optimization, Vector-Graph linking).
- **Build Custom (Thin Wrapper)** when you are just making simple calls to an LLM. Frameworks add latency, update-churn, and debugging overhead that isn't worth it for a single-turn agent.

---

## Anti-Patterns to Avoid

1. **Framework Tunnelling**: Trying to force a complex logic flow into a framework that doesn't support it (e.g., using a pure RAG library for a coding agent).
2. **The Golden Hammer**: Using LangChain just because it's popular, when a 50-line Python script would be faster and cheaper.
3. **Ignoring Observability**: Deploying any framework without an LLOps layer (LangSmith/Phoenix).

---

## Staff-Level Recommendation

For a modern, production-grade agentic system:
- **Orchestration**: LangGraph (for state and loops) or Microsoft Agent Framework (for .NET shops).
- **Agent SDK**: Match to your model provider — Claude Agent SDK (Anthropic), Agents SDK (OpenAI), ADK (Google). All support MCP for tool access.
- **Optimization**: DSPy (to compile prompts for different model tiers).
- **Retrieval**: LlamaIndex (for multi-stage RAG).
- **Observability**: LangSmith (for tracing and evaluation).
- **Cross-vendor agents**: A2A protocol for agent-to-agent coordination across organizational boundaries.
- **Autonomous coding**: Claude Code (CLI) or Cline (VS Code) for file-level editing tasks.
- **Open coding agent**: OpenHands for self-hosted or CI pipeline integration.

**The 2026 insights**:
1. Agentic coding tools (Claude Code, Cursor, OpenHands) are not replacements for orchestration frameworks — they are a **new category** that operates at the file-system level, above the LLM API but below the application logic.
2. The protocol layer has matured: **MCP for agent-to-tool** and **A2A for agent-to-agent** are becoming infrastructure standards, not optional add-ons. Design your architecture to support both.
3. Every lab shipping its own agent SDK creates a **vendor lock-in risk**. Mitigate by using MCP for tool access (portable across SDKs) and A2A for agent coordination (vendor-neutral).

> *Updated May 2026.*

---

## Interview Questions

### Q: Why do we see a trend towards "Programming" (DSPy) instead of "Prompting"?

**Strong answer:**
**Industrialization**. Prompt engineering is "Alchemy": it is inconsistent and does not scale. Programming LLMs via Frameworks like DSPy allows us to treat AI as a **Software Engineering discipline**. We can apply CI/CD, unit testing (metrics), and automated optimization. This moves AI from "Nondeterministic Magic" to a **Predictable Component** of a larger distributed system, which is a requirement for any mission-critical production environment.

### Q: If you had to build a system that works across OpenAI, Anthropic, and local Llama models, how would you architect it?

**Strong answer:**
I would use **DSPy** for the prompt layer and **LangGraph** for the orchestration layer. DSPy's **Signatures** allow me to decouple the task definition from the model's specific behavior. I would then use a **Universal Model Gateway** (like LiteLLM or an internal proxy) to handle the different API formats. For tool access, I would use **MCP** — it is model-agnostic, so the same MCP servers work regardless of which LLM backend is active. If I need cross-team agent coordination, I would use **A2A** at the boundary layer. This stack ensures that if I need to switch from GPT-4o to Claude Sonnet 4 for cost or latency reasons, I do not have to rewrite 50 prompts; I just re-compile or update the config.

### Q: With every AI lab shipping its own agent SDK (Claude Agent SDK, OpenAI Agents SDK, Google ADK), how do you avoid vendor lock-in?

**Strong answer:**
The key is to **separate the orchestration layer from the model layer**. I use a framework-agnostic orchestrator like LangGraph or a thin custom wrapper for the core workflow logic. Model-specific SDKs are useful for prototyping or when you are committed to a single provider, but for production multi-vendor systems, I keep the model interaction behind an abstraction (LiteLLM gateway or DSPy signatures). For tool access, **MCP** provides portability — the same MCP server works with any SDK. For agent coordination, **A2A** provides vendor-neutral agent-to-agent communication. The practical rule: use lab-specific SDKs at the leaf nodes (individual agent implementations) but keep the orchestration graph vendor-neutral.

---

## References
- Google Cloud. "Enterprise Generative AI Reference Architecture" (2025)
- Gartner. "Magic Quadrant for AI Application Frameworks" (2025)
- Gartner. "Predicts 2026: 40% of Enterprise Apps to Feature AI Agents" (2025)
- Thoughtworks. "Technology Radar: The Rise of Agentic Frameworks" (Nov 2024/2025)
- Microsoft. "Agent Framework Overview" (2026)
- Anthropic. "Claude Agent SDK" (2026)
- Google. "Agent Development Kit" (2026)
- OpenAI. "Agents SDK" (2026)

---

*Next: [Navigating Framework Churn](12-navigating-framework-churn.md)*
