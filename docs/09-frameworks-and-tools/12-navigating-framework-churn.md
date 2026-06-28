# Navigating Framework Churn

AI orchestration frameworks change faster than the content teaching them can keep up. LlamaIndex and LangChain each re-architected their entire package layout in 2024 and removed their original headline abstractions within a year. The result: a course recorded twelve months ago often fails on the first `import`. This page is about that problem, why it happens, and how to learn and build so your knowledge and your code survive the churn.

The one-line version: **frameworks are how you ship this quarter; primitives are what you keep. Pin the former, learn the latter.**

## Table of Contents

- [The Trigger: Why a Course Breaks on a Fresh Install](#the-trigger-why-a-course-breaks-on-a-fresh-install)
- [What Actually Changed](#what-actually-changed)
- [Why Courses and Tutorials Go Stale](#why-courses-and-tutorials-go-stale)
- [Is This Tutorial Current? A 30-Second Check](#is-this-tutorial-current-a-30-second-check)
- [Surviving Churn: Pin, Lock, Isolate](#surviving-churn-pin-lock-isolate)
- [Framework vs Raw SDK vs Thin Layer](#framework-vs-raw-sdk-vs-thin-layer)
- [What Transfers Across Versions](#what-transfers-across-versions)
- [Migrating When You Must Upgrade](#migrating-when-you-must-upgrade)
- [A Durable-Learning Playbook](#a-durable-learning-playbook)
- [Interview Questions](#interview-questions)
- [References](#references)

---

## The Trigger: Why a Course Breaks on a Fresh Install

A common, real example: a learner starts a well-regarded LlamaIndex video course, copies the first cell, and hits

```
ImportError: cannot import name 'SimpleDirectoryReader' from 'llama_index'
```

or, a little later,

```
TypeError: Can't instantiate abstract class OpenAI with abstract method _prepare_chat_with_tools
```

Nothing is wrong with the learner or the course as recorded. The course's notebook environment pins old versions (one popular LlamaIndex course ships a `requirements.txt` with `llama-index==0.10.30` and `llama-index-llms-openai==0.1.26`), and the video was recorded against them. On a fresh `pip install llama-index` today you get a version several minor releases newer, where the import paths and class hierarchy have changed. The first error is a moved import; the second is a *partial* version mismatch, where the core package and an integration package were upgraded out of lockstep and a new abstract method exists on the base class that the older integration package never implemented.

This is not a LlamaIndex problem or a course-quality problem. It is the default outcome of fast-moving frameworks plus pinned, recorded teaching content. Understanding the mechanism is what lets you fix it in seconds instead of giving up.

---

## What Actually Changed

Two re-architectures define the modern churn. Version numbers below are accurate as of June 2026; treat them as a snapshot, since they will keep moving.

### LlamaIndex

- **v0.10 (Feb 2024): the great split.** The monolithic `llama-index` package was broken into `llama-index-core` (abstractions only) plus hundreds of independently versioned integration packages (`llama-index-llms-openai`, `llama-index-embeddings-*`, `llama-index-vector-stores-*`, `llama-index-readers-*`). The separate `llama-hub` was folded in. Imports changed in two ways at once, which is why old notebooks fail immediately:
  - top-level to core: `from llama_index import VectorStoreIndex` becomes `from llama_index.core import VectorStoreIndex`
  - integrations into their own packages: `from llama_index.llms import OpenAI` becomes `from llama_index.llms.openai import OpenAI`
- **v0.11 (Aug 2024): the flagship abstraction removed.** `ServiceContext` (the object every pre-0.10 tutorial used to wire up the LLM, embeddings, and parser) was deprecated in 0.10 and *removed* in 0.11. Its replacement is the global `Settings` object. The same release moved the codebase to Pydantic v2.
  ```python
  # OLD (pre-0.10, removed in 0.11)
  from llama_index import ServiceContext, set_global_service_context
  service_context = ServiceContext.from_defaults(llm=llm, embed_model=embed)
  set_global_service_context(service_context)

  # CURRENT
  from llama_index.core import Settings
  Settings.llm = llm
  Settings.embed_model = embed
  ```
- **Workflows (1.0 in June 2025, now 2.x): the new application surface.** Event-driven, typed-state agentic orchestration, extracted into its own `llama-index-workflows` package. Note the correction many summaries get wrong: it is *Workflows* that hit 1.0 and then 2.x; the core framework itself is still on the 0.x line (`llama-index` around 0.14.x in mid-2026), not a "1.x" line.
- **Codemod:** `llamaindex-cli upgrade <dir>` rewrites old imports automatically.

### LangChain

- **The package split.** `langchain-core` (Runnables, messages, base interfaces, the only package with a backwards-compatibility guarantee), `langchain-community` (third-party integrations), `langchain` (chains and agents), and per-vendor partner packages (`langchain-openai`, `langchain-anthropic`, ...). LCEL, the `|`-pipe composition model, replaced the old `Chain` subclasses.
- **v0.3 (Sep 2024): Pydantic v1 to v2.** User code passing Pydantic v1 models broke.
- **v1.0 (Oct 2025): agents on LangGraph.** The blessed way to build an agent became `create_agent`, running on the LangGraph runtime with a middleware system. Legacy chains (`LLMChain`, `RetrievalQA`, `AgentExecutor`, `initialize_agent`) were moved to `langchain-classic`, deprecated but not deleted. Current `langchain` is around 1.3.x in mid-2026 and requires Python 3.10+.
- **Deprecation map:** `LLMChain` to an LCEL pipe (`prompt | llm | parser`); `RetrievalQA` to `create_retrieval_chain`; `AgentExecutor` / `initialize_agent` to `create_agent`; legacy `Memory` classes to LangGraph checkpointers.

The deeper detail in each is in the [LangChain deep dive](01-langchain-deep-dive.md) and [LlamaIndex chapter](04-llamaindex.md). The point here is the *pattern*: a monolith splits into core plus plugins, the original convenience abstraction is removed, and the agent layer moves onto a graph runtime. Both major frameworks followed it, roughly a year apart.

---

## Why Courses and Tutorials Go Stale

Recorded courses and blog posts capture a *snapshot*: the video, and usually a pinned `requirements.txt` or hosted notebook environment, are fixed at recording time. The live package index is not. When a learner installs fresh, the resolver pulls current versions that have moved past the pin, and the recorded code no longer matches the installed API.

The failure modes are predictable:

- **Moved imports** (`cannot import name ... from 'llama_index'`): the symbol relocated to `.core` or a partner package.
- **Removed symbols** (`ImportError: ServiceContext`, references to `LLMChain` / `RetrievalQA`): the abstraction was deleted, not just moved.
- **Partial-upgrade mismatches** (`Can't instantiate abstract class ...`): core and an integration package drifted out of lockstep; the usual fix is to upgrade the *set* together (`pip install -U llama-index llama-index-llms-openai`).
- **Model-name deprecations** (`gpt-3.5-turbo-0301` no longer available): the tutorial pinned a model ID the provider has since retired. This is the same churn, one layer down.

Most teaching platforms encode their version contract only as a bundled lockfile or a frozen hosted environment, not as a visible "this course was recorded against version X" banner. So the staleness is invisible until the code breaks.

---

## Is This Tutorial Current? A 30-Second Check

Before investing hours in any course, post, or notebook:

1. **Check the date against the framework's release cadence.** A 2024 LlamaIndex or LangChain tutorial predates at least one full re-architecture by construction.
2. **Open the bundled `requirements.txt` or lockfile and compare the pin to the current release.** A `llama-index==0.10.x` pin against a current `0.14.x`, or any `langchain<1.0`, means expect breakage.
3. **Grep the code for known-removed symbols.** Their presence dates the material instantly:
   - LlamaIndex: `ServiceContext`, `LLMPredictor`, `set_global_service_context`, or `from llama_index import` without `.core`.
   - LangChain: `LLMChain`, `RetrievalQA`, `initialize_agent`, `AgentExecutor`.
4. **Prefer the project's own current quickstart as the source of truth**, and use the third-party course for *concepts* rather than copy-paste code.

---

## Surviving Churn: Pin, Lock, Isolate

The discipline that prevents "worked yesterday, broken today":

- **Pin exact versions.** A loose, unversioned `llama-index` is the single biggest cause of surprise breakage. At minimum, `==`-pin your direct dependencies.
- **Use a real lockfile** that captures transitive dependencies too. [`uv`](https://docs.astral.sh/uv/) (`uv.lock`, `uv sync`) is the fast-moving 2026 favorite; Poetry (`poetry.lock`) and pip-tools (`pip-compile`) are established. The emerging standard is the tool-agnostic `pylock.toml` (PEP 751). Treat `pyproject.toml` as intent and the lockfile as reality, and commit the lockfile.
- **Pin split packages as a set.** For LlamaIndex and LangChain, `core` and every integration package must move together. The "abstract class" error is precisely a partial upgrade. Upgrade the set, not one package.
- **Isolate every project** in its own virtualenv or container. Never install into system Python. A container that pins the Python base image plus the lockfile is what hosted course notebooks effectively do, and what a local learner usually skips.
- **Treat deprecation warnings as a clock, not noise.** Run with warnings visible; each one names the replacement and often the removal version. Silenced warnings are how a working app becomes a broken one on the next routine upgrade.

---

## Framework vs Raw SDK vs Thin Layer

A live 2026 question, because the original reason frameworks existed has partly evaporated. When LangChain and LlamaIndex appeared, provider APIs were inconsistent and a unifying layer paid for itself. Since then, tool/function calling and structured outputs have converged into native, similar features across the major provider SDKs, so the framework's abstraction value has shrunk while its churn cost has not.

| Altitude | Use when | Cost |
|----------|----------|------|
| **Raw provider SDK** (`anthropic`, `openai`) | You make a handful of model calls, want the most stable surface and the clearest stack traces, or are writing library code | You build retrieval, the agent loop, and retries yourself |
| **Framework** (LangChain, LlamaIndex) | You need breadth of integrations (dozens of vector stores, loaders) or batteries-included RAG/agent scaffolding to move fast | Dependency sprawl, deep stack traces, version churn |
| **Thin layer** (your own interface over the SDK) | Production systems that want to swap models or frameworks without touching call sites | A little upfront design |

For production, the thin layer is often the sweet spot: depend on the provider SDK (or only `langchain-core`), wrap it behind a small interface of your own, and keep framework specifics in one replaceable module. The rule of thumb on abstraction leakage: the more a layer hides things you must understand to debug (retrieval ranking, token budgeting, the tool-call loop), the riskier it is. Leaky agent abstractions are exactly what pushed LangChain to build LangGraph. See the [Framework Selection Guide](08-framework-selection-guide.md) for the choice in depth.

---

## What Transfers Across Versions

This is the core of learning durably. The half-life of a framework *API* is roughly a year. The half-life of the *concepts under it* is the field itself. Invest accordingly.

**Transfers (learn deeply):**
- **RAG mechanics:** chunking and splitting strategy, embedding plus similarity search, retrieval, re-ranking, and the context-relevance / groundedness / answer-relevance evaluation triad. These survive every rename of `VectorStoreIndex`.
- **The agent loop:** model call, tool selection, tool execution, observation, repeat, plus state, memory, and human-in-the-loop. Whether it is `AgentExecutor`, `create_agent`, or a hand-rolled `while` loop, the loop is the same.
- **Provider-native primitives:** tool/function calling, structured outputs, streaming, token and context budgeting. Now standardized across vendors, so this is the most durable layer of all.
- **Engineering discipline:** lockfiles, reproducible environments, changelog reading, eval harnesses. Pure transfer value.

**Does not transfer (do not over-invest):** exact import paths, class names, constructor signatures, the global-config object of the month (`ServiceContext` versus `Settings`), and which chain helper is blessed this quarter (`LLMChain` versus LCEL versus `create_agent`). Memorizing these is memorizing a depreciating asset.

---

## Migrating When You Must Upgrade

When you do have to move a real codebase forward:

1. **Upgrade in a branch, lockfile first**, one major step at a time (0.10 to 0.11 to 0.12), not many at once.
2. **Run the official codemod** where one exists (`llamaindex-cli upgrade`), then let deprecation warnings and import errors drive the worklist.
3. **Lean on bridge packages** (`langchain-classic`, `llama-index-legacy`) to keep the app running while you migrate incrementally instead of big-bang.
4. **Confirm behavior with an eval harness**, not just that imports resolve. A migration that compiles but quietly changes retrieval quality or agent success rate is a regression you want caught before production. See [LLM Evaluation](../14-evaluation-and-observability/01-llm-evaluation.md).

---

## A Durable-Learning Playbook

1. **Build the loop once from the raw SDK**, no framework, so you understand what the framework automates. You will debug framework failures far faster afterward.
2. **Then adopt a framework** for breadth and speed, but treat its API as replaceable, behind a thin interface.
3. **Pin everything, commit the lockfile, keep deprecation warnings visible.**
4. **Re-derive, do not re-memorize.** When a framework renames things, map the new API back to the primitive it implements ("`create_agent` is just the agent loop on LangGraph") instead of relearning from scratch.
5. **Vet course currency before investing** with the 30-second check above. Use stale courses for concepts, the project's current docs for code.

For curated, currency-checked courses, see [COURSES.md](../COURSES.md). The reason that file is dated and re-verified is exactly the churn this page describes.

---

## Interview Questions

### Q: A teammate followed a six-month-old LlamaIndex tutorial and it fails on import. Walk me through what happened and how you would fix it.

**Strong answer:**
The tutorial was recorded against an older pinned version, and a fresh install pulled a newer one where the package layout changed. Since v0.10, LlamaIndex is `llama-index-core` plus separate integration packages, so a top-level import like `from llama_index import SimpleDirectoryReader` now has to be `from llama_index.core import SimpleDirectoryReader`, and `ServiceContext` was removed in v0.11 in favor of the global `Settings` object. If the error is instead "can't instantiate abstract class OpenAI," that is a partial upgrade where core and the OpenAI integration package drifted apart; the fix is to upgrade them together. The durable fix is a pinned lockfile so the environment is reproducible, and reading the migration guide rather than guessing. Longer term I would point the teammate at the project's current quickstart for code and use the tutorial only for the concepts.

### Q: Given how fast these frameworks churn, how do you decide whether to use one at all?

**Strong answer:**
I look at what the framework is actually buying me. Its original job was smoothing over inconsistent provider APIs, but tool calling and structured outputs have converged across the major SDKs, so that value has shrunk. If I need breadth of integrations or batteries-included scaffolding to move fast, the framework earns its keep. If I am making a handful of model calls or writing library code, the raw provider SDK is more stable and easier to debug. For production I usually wrap the SDK behind a thin interface of my own, so a framework or model swap touches one module. Whatever I choose, I pin and lock it and keep the framework-specific code isolated, because I am assuming this quarter's blessed API will be deprecated.

---

## References

- LlamaIndex v0.10 migration guide: https://developers.llamaindex.ai/python/framework/getting_started/v0_10_0_migration/
- LlamaIndex ServiceContext to Settings guide: https://developers.llamaindex.ai/python/framework/module_guides/supporting_modules/service_context_migration/
- LlamaIndex Workflows 1.0 announcement (June 2025): https://www.llamaindex.ai/blog/announcing-workflows-1-0-a-lightweight-framework-for-agentic-systems
- LangChain and LangGraph 1.0 (Oct 2025): https://www.langchain.com/blog/langchain-langgraph-1dot0
- LangChain v0.3 migration (Pydantic v2): https://docs.langchain.com
- `uv` (lockfiles and reproducible environments): https://docs.astral.sh/uv/
- PEP 751 (`pylock.toml`, standard lockfile format): https://peps.python.org/pep-0751/

---

*Next: [Document Processing](../10-document-processing/01-ocr-and-layout.md)*
