# Microsoft Agent Framework, CrewAI, and the Agent SDK Landscape

The multi-agent framework landscape consolidated significantly over the past year. Microsoft **retired AutoGen** and merged it with Semantic Kernel into the unified **Microsoft Agent Framework** (RC 1.0, February 2026; GA targeted Q2 2026). CrewAI matured to v1.13 with enterprise-grade features and reported use by 60%+ of Fortune 500 companies. Meanwhile, every major AI lab shipped its own agent SDK: Anthropic's Claude Agent SDK, OpenAI's Agents SDK, and Google's ADK.

## Table of Contents

- [CrewAI: The Manager Perspective](#crewai)
- [Microsoft Agent Framework (AutoGen's Successor)](#microsoft-agent-framework)
- [The Agent SDK Landscape](#agent-sdk-landscape)
- [Swarms and Peer-to-Peer Communication](#swarms)
- [Framework Comparison Matrix](#comparison)
- [Interview Questions](#interview-questions)
- [References](#references)

---

## CrewAI: The Manager Perspective

CrewAI is built around the concept of a **Process**.
- **Role-Based Agents**: You define a "Researcher," a "Writer," and a "Manager."
- **Tasks**: Explicit goals with specific outputs.
- **Process Orchestration**: Sequential, Hierarchical, or Consensual (Consensus-based).

### CrewAI Flows

CrewAI **Flows** add a **state-machine layer** on top of the classic Crew pattern:

```python
from crewai.flow.flow import Flow, listen, start

class ContentFlow(Flow):
    @start()
    def research_topic(self):
        # Returns research output
        return research_crew.kickoff({"topic": self.state["topic"]})
    
    @listen(research_topic)
    def write_article(self, research):
        # Triggered after research completes
        return writing_crew.kickoff({"research": research})
    
    @listen(write_article)
    def publish(self, article):
        # Final step
        return publisher.publish(article)
```

### CrewAI v1.13 highlights

CrewAI v1.13 marks a turning point toward enterprise production readiness:

- **Enterprise SSO**: Single Sign-On fully documented for enterprise deployments
- **RBAC Improvements**: Role-Based Access Control with a full permissions reference matrix
- **GPT-5 Compatibility**: Fixes for OpenAI's GPT-5 and newer o-series models that dropped support for the `stop` parameter
- **A2A Task Execution**: Agent-to-Agent dynamic task delegation in a structured, deterministic manner
- **NVIDIA NemoClaw Integration**: Infrastructure-level policy enforcement for secure enterprise deployment
- **RuntimeState RootModel**: Unified state serialization for complex workflows

**Use cases**: CrewAI + Flows is the best framework for **business process automation** (content pipelines, data analysis workflows) where the structure is well-defined. CrewAI reports powering roughly 2 billion agentic executions.

> *Verified May 2026. Source: docs.crewai.com/en/changelog*

---

## Microsoft Agent Framework (AutoGen's Successor)

### The Merger: AutoGen + Semantic Kernel = Agent Framework

Microsoft retired AutoGen as a standalone product in late 2025 and merged it with Semantic Kernel into the unified **Microsoft Agent Framework**. Release Candidate 1.0 shipped in February 2026, with GA targeted for Q2 2026.

**What the merger combines:**
- **From AutoGen**: Simple abstractions for single- and multi-agent conversation patterns (group chat, round-robin, handoffs)
- **From Semantic Kernel**: Enterprise-grade session management, type safety, filters, telemetry, and extensive model/embedding support

### Migration Path

AutoGen continues to receive bug fixes and security patches, but **new features go exclusively into the Agent Framework**. Microsoft provides an official migration guide. If starting a new project, use the Agent Framework directly.

### Key Capabilities

```python
# Microsoft Agent Framework: Graph-based workflow
from agent_framework import Agent, Workflow, HandoffStep

planner = Agent("Planner", model="gpt-5.5", system_message="Decompose tasks.")
executor = Agent("Executor", model="gpt-5.5-mini", system_message="Execute sub-tasks.")

workflow = Workflow(
    steps=[
        HandoffStep(from_agent=planner, to_agent=executor),
    ],
    state_management="session",  # Built-in session persistence
)
```

**Framework highlights:**
- **Unified .NET and Python**: Same programming model across both languages
- **Graph-based Workflows**: Sequential, concurrent, handoff, and group chat patterns with explicit control
- **State Management**: Robust session-based persistence for long-running and human-in-the-loop scenarios
- **MCP Support**: Native Model Context Protocol integration for tool access
- **Multi-provider**: Supports OpenAI, Azure OpenAI, Anthropic, Google, and local models

> *Verified May 2026. Source: learn.microsoft.com/en-us/agent-framework*

---

## The Agent SDK Landscape

Every major AI lab now ships its own agent framework. The landscape as of May 2026:

### Claude Agent SDK (Anthropic)

The Claude Agent SDK (renamed from Claude Code SDK) provides the same tools, agent loop, and context management that power Claude Code, available as a library in Python and TypeScript.

- **Built-in tools**: File reading, command execution, code editing — agents work immediately without custom tool implementation
- **Supervisor pattern**: Hierarchical agent trees with delegation
- **Deployment**: Supports AWS Bedrock, Google Vertex AI, and Azure
- **As of May 2026**: Python v0.1.48+, TypeScript v0.2.71+

### OpenAI Agents SDK

OpenAI's lightweight framework for multi-agent workflows using native Python/TypeScript constructs:

- **Handoff-based**: Agents delegate to each other using `Handoff(TargetAgent)`, no central supervisor needed
- **Guardrails**: Built-in input validation and safety checks
- **MCP integration**: Native MCP server tool support
- **Realtime agents**: Voice agent support with gpt-realtime-1.5

### OpenAI AgentKit

AgentKit is OpenAI's higher-level toolset that sits on top of the Responses API and Agents SDK. Where the Agents SDK is code-first, AgentKit targets teams who want to assemble and ship agents with less plumbing:

- **Agent Builder**: A visual canvas for composing and versioning multi-agent workflows (nodes, branches, loops), then exporting to Agents SDK code.
- **ChatKit**: An embeddable, themeable chat UI for dropping an agent experience into your product without building the front end.
- **Connector Registry**: A central admin surface for managing how data sources and tools connect across OpenAI products, with governance and access control.
- **Evals and guardrails**: Built-in trace grading, datasets, and prompt-optimization hooks so the build-to-eval loop stays in one place.

**When to use it**: AgentKit suits teams who want a managed build-and-ship loop and are comfortable on OpenAI infrastructure. Drop to the raw Agents SDK when you need full control over the loop, or to LangGraph / Microsoft Agent Framework when you need a framework-neutral or self-hosted runtime.

### OpenAI Apps SDK

The Apps SDK extends the **Model Context Protocol** so an MCP server can ship a UI alongside its tools. A developer defines both the logic and an interactive interface, and the app renders inside a client like ChatGPT. This is the same idea the MCP spec is standardizing as "MCP Apps" (server-rendered UIs), and it turns MCP servers from headless tool endpoints into interactive surfaces. See [Tool Use and MCP](../07-agentic-systems/03-tool-use-and-mcp.md).

### Google Agent Development Kit (ADK)

Google's framework optimized for the Google ecosystem but model-agnostic:

- **Multi-language**: Python, TypeScript, Java, Go (all at 1.0+ as of May 2026)
- **A2A native**: Built-in Agent-to-Agent protocol support for cross-vendor orchestration
- **Vertex AI integration**: Deploy to Agent Engine Runtime for managed hosting
- **Graph-based**: Agent workflows modeled as directed graphs

> *Verified May 2026.*

---

## Swarms and P2P

Both frameworks (and the broader SDK landscape) have adopted **Swarm Patterns**.
- **The Handoff**: Instead of a central supervisor, agents "Hand off" the conversation to the most relevant expert.
- **Example**: A "Sales Agent" realizes the user is asking a technical question and hands off the thread to the "Support Agent."

---

## Framework Comparison Matrix

| Feature | CrewAI | MS Agent Framework | LangGraph | Claude Agent SDK | OpenAI Agents SDK | Google ADK |
|---------|--------|-------------------|-----------|-----------------|-------------------|------------|
| **Core Abstraction** | Task/Process/Flow | Workflow/Agent | State/Graph | Supervisor/Tools | Handoff/Agent | Agent Graph |
| **Architecture** | Declarative + State Machine | Graph Workflows | Imperative DAG | Hierarchical Tree | Swarm Handoffs | Directed Graph |
| **Ease of Use** | High | Medium | Low | Medium | High | Medium |
| **Control** | Low-Medium | Medium-High | High | Medium | Low-Medium | Medium-High |
| **Best For** | Business Automations | Enterprise .NET/Python | Complex Orchestration | Coding/Tool Agents | Quick Multi-Agent | Google Cloud AI |
| **Multi-Language** | Python | .NET + Python | Python | Python + TS | Python + TS | Python, TS, Java, Go |
| **MCP Support** | Yes | Yes | Via tools | Native | Yes | Yes |
| **A2A Support** | Via extension | Planned | Via tools | No (direct) | No (direct) | Native |

---

## Interview Questions

### Q: When would you use CrewAI instead of LangGraph?

**Strong answer:**
**Speed vs. Precision**. I use **CrewAI** when I need to stand up a team of agents for a standard process (like content generation or data analysis) very quickly. It provides high-level abstractions for "Planning" and "Cooperation" out of the box. I switch to **LangGraph** when I need **Granular Control** over every state transition, multi-turn human-in-the-loop triggers, or complex error-recovery logic that doesn't fit into the "Role-playing team" metaphor.

### Q: Microsoft retired AutoGen in favor of the Agent Framework. How does this affect existing AutoGen deployments?

**Strong answer:**
AutoGen continues to receive bug fixes and security patches, so existing deployments are not immediately broken. However, **all new feature development** is in the Agent Framework. The migration path is well-documented: AutoGen's `AssistantAgent` maps to the Agent Framework's `Agent` class, `GroupChat` maps to the new `Workflow` patterns, and Semantic Kernel's enterprise features (session management, telemetry, filters) are now available natively. The key benefit of migrating is **unified .NET and Python support** and **graph-based workflows** that give explicit control over multi-agent execution paths. For new projects, start with the Agent Framework directly.

### Q: How do you prevent "Infinite Loops" where agents keep talking to each other without solving the task?

**Strong answer:**
We use **Termination Conditions** and **Max Conversational Turns**. We also implement a "Critic Agent" whose only job is to detect if the conversation is stagnant. If the Critic detects circularity, it triggers a user proxy to interrupt or force-switches the group chat manager to a different reasoning path. We also monitor **Token Velocity**: if an agent pair uses 100K tokens in 2 minutes without progress, we kill the session automatically. In 2026, frameworks like the Microsoft Agent Framework and LangGraph provide built-in workflow timeouts and state checkpointing that make loop detection more systematic.

---

## References
- CrewAI. "The Multi-Agent Process Engine" (2025/2026, v1.13)
- Microsoft. "Agent Framework Overview" (2026) — learn.microsoft.com/en-us/agent-framework
- Microsoft. "AutoGen to Agent Framework Migration Guide" (2026)
- Anthropic. "Claude Agent SDK" (2026) — platform.claude.com/docs/en/agent-sdk
- OpenAI. "Agents SDK Documentation" (2026)
- [OpenAI. "Introducing AgentKit" (2025)](https://openai.com/index/introducing-agentkit/)
- [OpenAI. "Apps SDK" (2025)](https://developers.openai.com/apps-sdk)
- Google. "Agent Development Kit" (2026) — google.github.io/adk-docs
- OpenAI Swarm. "Lightweight Multi-Agent Orchestration" (2024 tech report)

---

*Next: [Framework Selection Guide](08-framework-selection-guide.md)*
