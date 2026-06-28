# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

A **living reference book on AI system design**, published as plain Markdown to [aidaddy.tech](https://www.aidaddy.tech). There is **no application code, no build system, no tests, no CI, and no package manager** — the 143 `.md` files *are* the product. "Developing" here means writing, correcting, and cross-linking prose, diagrams, and tables. Treat it like editing a book, not shipping software.

Scope: RAG, LLM engineering, agentic systems, MCP/A2A, inference, evaluation, and staff-level interview prep.

## The in-world timeline (read this first)

The guide is written as if **the present is June 2026**. It treats the following as **real, shipped models** and references their prices and benchmarks as fact:

> Claude Fable 5, Claude Opus 4.8, GPT-5.6 / GPT-5.5, Gemini 3.1 Pro, DeepSeek V4 (Flash/Pro), Llama 4, Kimi K2.x, Qwen 3.x, GLM-5.2, Mistral Medium 3.5, Gemma 4 — plus MCP 2.0, A2A v1.0, OpenClaw, Computer Use.

**Do not "correct" these as hallucinations or future/fictional models, and do not down-level them to 2024-era models.** Maintain the June 2026 frame in any edit. `CONTRIBUTING.md`'s "confirmed-real models only" rule is relative to this in-world timeline: invent nothing *new*, but the models above are canon here. When adding a model/price/benchmark claim, cite a source link.

## Writing conventions (enforced)

These come from `CONTRIBUTING.md` and the existing corpus. Match them exactly:

- **No em dashes (`—`).** Use commas, parentheses, or a rewrite. Applies to prose, commit messages, and comments. (~20 legacy files still contain them; do not replicate, and fix when you touch a file.)
- **Voice:** opinionated, concrete, tradeoff-aware. Prefer specific numbers and named tools over vendor-neutral hedging. No filler.
- **Links are relative** (e.g. `../06-retrieval-systems/04-vector-databases.md`) and must resolve. The root `README.md` "Quick Navigation" table is the master index.
- **Conventional commits, scoped to one logical change:** `docs: fix broken links in case studies`, `feat(retrieval): add ColBERT reranking notes`. Scope = the section being edited.

## Chapter anatomy (the template to match)

Files follow a consistent shape. When creating or editing, preserve it:

1. `# H1 Title`
2. A 1–2 sentence summary paragraph, usually with inline links to related chapters.
3. `## Table of Contents` with anchor links.
4. Body sections separated by `---`, using comparison **tables** and **```mermaid``` diagrams** (39 chapters have diagrams).
5. `## Interview Questions` — `**Q:**` followed by `**Strong answer:**` (present in ~99 files; near-universal).
6. `## Key Takeaways` — bulleted, one line each.
7. `## References` — sourced, linked where possible.
8. Footer: `*Next: [Next Chapter Title](NN-next-file.md)*`

> Gotcha: in-page TOC anchors are sometimes hand-shortened (e.g. `[The Core Philosophy...](#philosophy)`) and do not match GitHub's auto-generated heading slugs. If you fix anchors, regenerate them from the actual heading text.

## Structure & naming

- Sections are zero-padded folders `00-interview-prep/` … `19-multimodal-generation/`; chapters inside are `NN-topic-name.md` (the `NN` sets reading order).
- Only `00-interview-prep/` and `07-agentic-systems/` have a section `README.md`; the rest are indexed solely from the root `README.md`.
- Standalone root docs: `GLOSSARY.md`, `PATTERNS.md`, `COURSES.md`, `TRANSITION_GUIDE.md`, `RESEARCH-RADAR.md`, and two deep-dives `ai_evals_comprehensive_study_guide.md` (Phoenix+Langfuse) and `ai_evals_complete_guide_langwatch_langfuse.md` (LangWatch+Langfuse).

## When adding or renaming a chapter, update all of these

A new/renamed chapter is not done until its inbound and outbound links are wired:

1. The root `README.md` — "Quick Navigation" table **and** the "Guide Structure" tree.
2. The `*Next:*` footer of the **previous** chapter, and the new chapter's own `*Next:*`.
3. `GLOSSARY.md` for any new term introduced.
4. The relevant section `README.md` if one exists (00 or 07).
5. `RESEARCH-RADAR.md` if it relates to a tracked frontier topic.

## Integrity checks (run after edits — there is no linter)

```bash
# Find em dashes you may have introduced
grep -rn "—" --include=*.md .

# List every relative .md link target to eyeball for broken paths
grep -rnoE "\]\(([^)]+\.md)[^)]*\)" --include=*.md .

# List any chapter missing its Next footer (empty output = all present)
grep -rL "Next:" --include=*.md 01-foundations 06-retrieval-systems   # adjust dirs
```
