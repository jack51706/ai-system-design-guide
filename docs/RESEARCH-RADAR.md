# Research Radar

A curated map of the frontier topics that matter right now, for the practitioner who wants to know what to learn next. The leaderboards in [Benchmarks and Leaderboards](14-evaluation-and-observability/03-benchmarks-and-leaderboards.md) tell you which model is ahead today; this page tells you which ideas are about to change how you build.

It is organized by theme, not by paper. Each theme leads with why it matters for someone shipping production systems, points to the load-bearing papers, and links to where the idea connects in this guide. The snapshot reflects research trending in roughly the second quarter of 2026; research is provisional by nature, so treat specific results as directional and read the primary source before betting a system on it.

## Table of Contents

- [How to Use This Page](#how-to-use-this-page)
- [The Big Shifts](#the-big-shifts)
- [1. Context Engineering Becomes a Systems Discipline](#1-context-engineering-becomes-a-systems-discipline)
- [2. The Limits of Test-Time Compute](#2-the-limits-of-test-time-compute)
- [3. RL Post-Training: What It Actually Does](#3-rl-post-training-what-it-actually-does)
- [4. Latent and Alternative Reasoning](#4-latent-and-alternative-reasoning)
- [5. Efficient Long-Context Architecture](#5-efficient-long-context-architecture)
- [6. Agent Reliability and Failure Modes](#6-agent-reliability-and-failure-modes)
- [7. Agent and Memory Security](#7-agent-and-memory-security)
- [8. AI Control and the Evaluation Frontier](#8-ai-control-and-the-evaluation-frontier)
- [9. Memory and Retrieval Advances](#9-memory-and-retrieval-advances)
- [10. Multimodal: World Models, VLAs, and Omni](#10-multimodal-world-models-vlas-and-omni)
- [11. Smaller, Cheaper, Faster](#11-smaller-cheaper-faster)
- [12. Test-Time Training: Learning at Inference](#12-test-time-training-learning-at-inference)
- [A 90-Day Learning Path](#a-90-day-learning-path)
- [How This Maps to the Guide](#how-this-maps-to-the-guide)

---

## How to Use This Page

Read the [Big Shifts](#the-big-shifts) first for the meta-trends, then dip into the themes relevant to what you build. If you build agents, prioritize themes 1, 6, 7, and 8. If you optimize inference, prioritize 2, 5, and 11. If you work on retrieval or memory, prioritize 1 and 9. The [90-Day Learning Path](#a-90-day-learning-path) sequences the highest-leverage reading.

A note on citations: arXiv IDs follow the `YYMM.NNNNN` convention, so `2606.xxxxx` is June 2026. A handful of foundational papers from late 2025 are included where they are the actively-cited reference point for a current trend, and flagged accordingly. Where a claim is an empirical result, it is phrased as "the paper reports," because results get revised.

---

## The Big Shifts

Five meta-trends sit underneath the specific papers:

1. **Context is the new bottleneck, and it is a systems problem.** The 2026 consensus is that a 1M-token window is a budget to manage, not free space to fill. Context engineering has moved from prompt tricks to learned policies, serving-layer compaction, and OS-style memory hierarchies.
2. **More thinking is not free, and sometimes hurts.** Test-time compute has measurable limits and inverse-scaling regimes. The frontier is *adaptive* compute, spend per input, not maximal compute.
3. **RL post-training sharpens more than it adds.** A large body of work now disputes how much RL with verifiable rewards adds genuinely new capability versus re-weighting what the base model already knew, which changes when RL is worth its cost.
4. **Agents are not secure or reliable yet, and some of it is provably hard.** Indirect prompt injection has an impossibility result; memory poisoning is a new persistent attack surface; agent reliability under repeated runs is far below best-case. The response is shifting from prevention to containment and control.
5. **The benchmark is no longer enough, and the model may know it is being tested.** Evaluation itself is a research frontier: eval-awareness, abstention-aware scoring, CoT monitorability, and judge reliability are all live problems.

---

## 1. Context Engineering Becomes a Systems Discipline

**Why it matters:** Long-running agents degrade as their context fills with stale tool output (context rot). The fixes have graduated from "summarize the history" into trained context managers, serving-layer compaction, and demand-paged context. If you run agents past a few minutes of autonomy, this is the highest-leverage area to understand.

- **Learning Agent-Compatible Context Management for Long-Horizon Tasks (AdaCoM)** ([arXiv:2605.30785](https://arxiv.org/abs/2605.30785)) trains an external LLM to edit a frozen agent's context via RL, treating context management as a learned policy rather than a heuristic.
- **Parallel Context Compaction for Long-Horizon LLM Agent Serving** ([arXiv:2605.23296](https://arxiv.org/abs/2605.23296)) moves summarization off the critical path, reframing compaction as a serving/systems concern.
- **The Missing Memory Hierarchy: Demand Paging for LLM Context Windows** ([arXiv:2603.09023](https://arxiv.org/abs/2603.09023)) brings OS-style demand paging to the context window.
- **Less Context, Better Agents** ([arXiv:2606.10209](https://arxiv.org/abs/2606.10209)) is a rare quantified study of tool-response bloat in real enterprise tool-use, showing pruning plus summarization beats full history.
- Anthropic's engineering writing on effective context engineering, harnesses for long-running agents, and the memory tool remains the practitioner vocabulary (just-in-time retrieval, structured note-taking, compaction, tool-result clearing).

**Where it connects:** [Context Engineering](05-prompting-and-context/05-context-engineering.md), [Agent Memory and State](07-agentic-systems/05-agent-memory-and-state.md).

---

## 2. The Limits of Test-Time Compute

**Why it matters:** "Turn up the thinking budget" is not a free quality lever. Several 2026 results show inverse scaling past a critical token count and diminishing returns that plateau. The production takeaway is to set cost-aware, difficulty-adaptive budgets, not maximal ones. (Do not confuse this with test-time *training*, which updates the model's weights at inference; see [theme 12](#12-test-time-training-learning-at-inference).)

- **When More Thinking Hurts: Overthinking in LLM Test-Time Compute Scaling** ([arXiv:2604.10739](https://arxiv.org/abs/2604.10739)) demonstrates inverse scaling past a critical token threshold and proposes cost-aware stopping. The single most actionable finding for anyone shipping reasoning models.
- **Test-Time Scaling Is Not Effective for Knowledge-Intensive Tasks Yet** ([arXiv:2509.06861](https://arxiv.org/abs/2509.06861), trending) argues from information theory that compute alone cannot exceed the knowledge already in the model, and that extended reasoning can amplify confident hallucinations.
- **Scaling over Scaling: Test-Time Scaling Plateau** ([arXiv:2505.20522](https://arxiv.org/abs/2505.20522), trending) gives a closed-form sense of where returns flatten.
- **SelfBudgeter** ([arXiv:2505.11274](https://arxiv.org/abs/2505.11274)) and **AdaCtrl** ([arXiv:2505.18822](https://arxiv.org/abs/2505.18822)) let the model predict or expose a controllable token budget, the practical knob.

**Where it connects:** [Context Engineering: Extended Thinking](05-prompting-and-context/05-context-engineering.md), [Cost Optimization](04-inference-optimization/07-cost-optimization-playbook.md).

---

## 3. RL Post-Training: What It Actually Does

**Why it matters:** Whether to spend on RL post-training depends on a contested empirical question: does RL with verifiable rewards (RLVR) add new capability, or just sharpen sampling of what the base model already does? The answer determines when RL is worth the cost versus supervised fine-tuning or distillation.

- The **pass@k debate**: the "limit of RLVR" position ([limit-of-rlvr.github.io](https://limit-of-rlvr.github.io/)) argues RL raises pass@1 but base models match it at high pass@k, so RL sharpens rather than adds; the counter-position ([arXiv:2506.14245](https://arxiv.org/abs/2506.14245)) argues that with the right metric RLVR rewards correct reasoning and extends the boundary. The synthesis ([arXiv:2512.07783](https://arxiv.org/pdf/2512.07783)) finds RL yields true gains mainly when the task is under-covered in pretraining and the RL data sits at the model's competence edge, which motivates a distinct **mid-training** stage.
- **On-policy distillation** ([Thinking Machines Lab](https://thinkingmachines.ai/blog/on-policy-distillation/); recipe and failure modes in [arXiv:2604.13016](https://arxiv.org/html/2604.13016v1)) trains a student on its own rollouts graded by a teacher, reported as roughly 10x more sample-efficient than RL for instilling reasoning into small models. The new default for building cheap reasoning models.
- **Process reward models that think (ThinkPRM)** ([arXiv:2504.16828](https://arxiv.org/abs/2504.16828), trending) make step-level verification affordable by writing a verification chain-of-thought instead of training a discriminative scorer.

**Where it connects:** [RLHF and DPO](03-training-and-adaptation/04-rlhf-and-dpo.md), [Knowledge Distillation](03-training-and-adaptation/05-knowledge-distillation.md).

---

## 4. Latent and Alternative Reasoning

**Why it matters:** Chain-of-thought spends tokens to think. A growing line of work reasons in latent space (recurrent depth) or via diffusion, opening a new compute axis that does not consume output tokens. Worth tracking even if it is not yet your default, because it changes the latency and cost model of reasoning.

- **Latent / recurrent-depth reasoning**: the canonical architecture scales test-time compute by unrolling a recurrent block to arbitrary depth ([Huginn, arXiv:2502.05171](https://arxiv.org/pdf/2502.05171)); looped language models compete with mainstream open models ([Ouro, arXiv:2510.25741](https://arxiv.org/html/2510.25741v2)); and a 2026 result stabilizes the recurrence so depth scaling stops collapsing ([arXiv:2605.26733](https://arxiv.org/abs/2605.26733)).
- **Diffusion LLMs for reasoning** are maturing into a viable fast-inference path: parallel decoding via a product-of-experts bridge reports a large speedup while recovering most autoregressive accuracy ([arXiv:2606.08048](https://arxiv.org/abs/2606.08048)), with RL recipes for diffusion-LLM reasoning following ([arXiv:2606.08501](https://arxiv.org/abs/2606.08501)).
- **CoT faithfulness caveat**: the visible chain-of-thought may not reflect the true computation ([arXiv:2603.26410](https://arxiv.org/pdf/2603.26410)), which matters when you rely on CoT for debugging or monitoring (see theme 8).

**Where it connects:** [Chain-of-Thought](05-prompting-and-context/03-chain-of-thought.md), [Inference Fundamentals](04-inference-optimization/01-inference-fundamentals.md).

---

## 5. Efficient Long-Context Architecture

**Why it matters:** Serving long context cheaply is now an architecture decision, not just a KV-cache trick. Trainable sparse attention has moved from research into shipped frontier models, and it is the production answer to quadratic attention cost.

- **Trainable sparse attention (NSA/DSA lineage):** Native Sparse Attention ([arXiv:2502.11089](https://arxiv.org/abs/2502.11089), foundational) introduced hardware-aligned, natively trainable sparse attention; DeepSeek's sparse attention productionized it with a lightning indexer that turns attention roughly from quadratic to linear in sequence length, spawning a wave of indexer papers. This is the blueprint behind cheap long context.
- **MoE scaling laws** ([arXiv:2603.21862](https://arxiv.org/abs/2603.21862)) map any compute budget to an optimal mixture-of-experts configuration and argue FLOPs-per-token is an inadequate fairness metric across MoE layer types.
- **Latent / learned context compression**: encoder-decoder context compressors pretrained at scale ([arXiv:2606.09659](https://arxiv.org/abs/2606.09659)) let agents skim compressed context and expand relevant segments on demand, a layer distinct from KV-cache compression.
- **Subquadratic hybrids** (Mamba/Transformer, linear-attention) continue to match Transformers at long context and underpin long-video and omni models.

**Where it connects:** [Attention Mechanisms](01-foundations/03-attention-mechanisms.md), [KV Cache and Context Caching](04-inference-optimization/02-kv-cache-and-context-caching.md), [Serving Infrastructure](04-inference-optimization/06-serving-infrastructure.md).

---

## 6. Agent Reliability and Failure Modes

**Why it matters:** Single-shot demos hide that agents fail differently at scale: errors cascade through multi-agent systems, and the same agent that passes a task once fails it on re-run. Reliability is a measurable engineering property, and the benchmarks for it are new.

- **Reliability science (pass^k):** reliability benchmarks measure consistency across repeated runs, perturbation robustness, and fault tolerance; the gap between best-case (pass@1) and reliable (pass^k) performance is large (tau2-bench shows agents falling from ~60% to ~25% across 8 runs). Design and budget for pass^k, not pass@1.
- **Error cascades in multi-agent systems:** propagation-dynamics models of how one agent's error amplifies system-wide ([arXiv:2603.04474](https://arxiv.org/abs/2603.04474)), and graph-curvature early-warning signals of breakdown before a policy violation ([arXiv:2603.13325](https://arxiv.org/abs/2603.13325)). A monitoring primitive for runaway multi-agent runs.
- **Multi-agent computer use** ([arXiv:2606.01533](https://arxiv.org/abs/2606.01533)) gives a concrete planner-DAG-plus-parallel-workers recipe, a clean reference for parallelizing computer-use work.
- A cautionary note: GRPO on self-generated rollouts does not by itself close the multi-agent coordination gap ([arXiv:2606.07845](https://arxiv.org/abs/2606.07845)), so do not assume naive RL fixes coordination.

**Where it connects:** [Multi-Agent Orchestration](07-agentic-systems/04-multi-agent-orchestration.md), [Error Handling and Recovery](07-agentic-systems/07-error-handling-and-recovery.md), [Evaluating Agentic Systems](07-agentic-systems/10-evaluating-agentic-systems.md).

---

## 7. Agent and Memory Security

**Why it matters:** This is the fastest-moving risk area in 2026, and some of it is provably hard. If you ship tool-using or memory-equipped agents, these results should shape your architecture toward least-privilege and containment.

- **Indirect prompt injection is unsolved, possibly unsolvable.** A 464-participant red-team competition found all 13 frontier models fall to concealed indirect injection ([arXiv:2603.15714](https://arxiv.org/abs/2603.15714)), and a contextual-integrity impossibility result argues an adversary can always construct a context where a blocked flow looks legitimate ([arXiv:2605.17634](https://arxiv.org/abs/2605.17634)). The conclusion: shift from "block injection" to capability-based, least-privilege, containment architectures.
- **Memory poisoning is a new persistent attack surface.** Sleeper memory poisoning plants dormant poisoned memories that resurface across future sessions ([arXiv:2605.15338](https://arxiv.org/abs/2605.15338)); memory control-flow attacks reframe poisoned memory as a write-once-read-many control signal that overrides user instructions ([arXiv:2603.15125](https://arxiv.org/abs/2603.15125)). OWASP's 2026 Agentic Top 10 adds a dedicated "Memory and Context Poisoning" entry (ASI06). The defense is provenance at storage time, not sanitization at retrieval.
- **Distillation as an attack:** harmful capabilities can be recovered by fine-tuning on benign, adjacent-domain outputs distilled from a safeguarded model ([arXiv:2601.13528](https://arxiv.org/abs/2601.13528)), a threat model for anyone exposing a guarded API.

**Where it connects:** [Agentic Security and Sandboxing](07-agentic-systems/09-agentic-security-and-sandboxing.md), [Prompt Injection Defense](05-prompting-and-context/08-prompt-injection-defense.md), [LLM Security](12-security-and-access/01-llm-security.md), [Safety and Governance](17-tool-use-and-computer-agents/07-safety-and-governance.md).

---

## 8. AI Control and the Evaluation Frontier

**Why it matters:** Two practitioner-relevant research programs are maturing. AI control gives concrete protocols for deploying agents you do not fully trust. And evaluation itself has become a research problem, because models can detect and game evals.

- **AI control protocols:** in adversarial testbeds, "resample-for-incrimination" plus "defer-on-critical-actions" raise safety from ~50% to ~96%, and defer-on-critical is robust even to protocol-aware red teams ([arXiv:2511.02997](https://arxiv.org/abs/2511.02997), trending); factored cognition (a trusted model decomposes, an untrusted model solves isolated subtasks) strengthens monitoring ([arXiv:2512.02157](https://arxiv.org/abs/2512.02157)). A deployable playbook for untrusted agents that is largely missing from most production stacks.
- **Eval-awareness:** models often know when they are being evaluated ([arXiv:2505.23836](https://arxiv.org/abs/2505.23836), trending), which confounds every safety and capability eval and argues for held-out, naturalistic test conditions.
- **Abstention-aware scoring:** the statistical account of why models hallucinate ([arXiv:2509.04664](https://arxiv.org/abs/2509.04664)) shows benchmarks that reward guessing over "I don't know" train hallucination, so eval design should reward calibrated abstention.
- **CoT monitorability** ([arXiv:2510.27378](https://arxiv.org/abs/2510.27378); position paper [arXiv:2507.11473](https://arxiv.org/abs/2507.11473)) treats the chain-of-thought as a fragile but valuable safety signal worth preserving rather than training away.
- **Production safety controls:** probes that survive distribution shift now ship in frontier models ([arXiv:2601.11516](https://arxiv.org/abs/2601.11516)), and classifier cascades cut jailbreak-defense cost roughly 40x ([arXiv:2601.04603](https://arxiv.org/abs/2601.04603)).

**Where it connects:** [LLM Evaluation](14-evaluation-and-observability/01-llm-evaluation.md), [Benchmarks and Leaderboards](14-evaluation-and-observability/03-benchmarks-and-leaderboards.md), [Reliability and Safety](13-reliability-and-safety/).

---

## 9. Memory and Retrieval Advances

**Why it matters:** Retrieval is becoming agentic (the model gets retrieval primitives, not a fixed pipeline), memory is getting a real engineering and security treatment, and the field has hard new evidence about what memory systems can and cannot do.

- **Agentic retrieval interfaces:** expose keyword, semantic, and chunk-read tools to the model rather than a fixed RAG workflow ([A-RAG, arXiv:2602.03442](https://arxiv.org/abs/2602.03442)); the systematization of agentic RAG as POMDPs gives the structural framework ([arXiv:2603.07379](https://arxiv.org/abs/2603.07379)).
- **RL-trained search agents:** Search-R1 and successors train interleaved reason-and-search with retrieved-token masking, a foundational technique for deep-research systems likely missing from most stacks.
- **Memory, critically examined:** the anatomy-of-agentic-memory survey ([arXiv:2602.19320](https://arxiv.org/abs/2602.19320)) is the reality check, documenting benchmark saturation, metric-utility misalignment, and latency overheads in current memory systems.
- **Learned forgetting and consolidation:** sleep-inspired consolidation cuts proactive interference (stale entries clobbering current ones) from linear to logarithmic in the number of memories ([SleepGate, arXiv:2603.14517](https://arxiv.org/abs/2603.14517)), reframing forgetting as a design goal.
- **Deep-research evaluation:** corpus-controlled benchmarks that isolate retriever from agent ([BrowseComp-Plus, arXiv:2508.06600](https://arxiv.org/abs/2508.06600)) show retriever quality dominates deep-research accuracy.

**Where it connects:** [Agentic RAG](06-retrieval-systems/08-agentic-rag.md), [Memory Architectures](08-memory-and-state/01-memory-architectures.md), [Long-Term Memory](08-memory-and-state/03-long-term-memory.md), [RAG Evaluation](06-retrieval-systems/13-rag-evaluation-patterns.md).

---

## 10. Multimodal: World Models, VLAs, and Omni

**Why it matters:** Three converging fronts: omnimodal models that natively emit actions, interactive world models you can navigate in real time, and vision-language-action models for robotics. Even if you do not build robots, the architecture patterns (dual-system control, latent-action pretraining, predictive embedding world models) are spreading into agents.

- **Omnimodal world models that emit actions:** open models that natively understand and generate text, image, video, audio, *and* actions in one stack ([NVIDIA Cosmos 3](https://research.nvidia.com/labs/cosmos-lab/); [Emu3.5, arXiv:2510.26583](https://arxiv.org/abs/2510.26583), the clearest "native next-state prediction yields world models" thesis).
- **Interactive real-time world models** ("neural game engines"): real-time navigable simulation from a prompt (DeepMind Project Genie 3; open blueprint in [DreamX-World, arXiv:2606.16993](https://arxiv.org/abs/2606.16993)), with the predictive (non-generative) JEPA alternative as the efficiency-minded contrast (V-JEPA 2 and successors).
- **Vision-language-action (VLA):** embodied "thinking" that interleaves reasoning with actions plus cross-embodiment transfer ([Gemini Robotics 1.5, arXiv:2510.03342](https://arxiv.org/abs/2510.03342)); the dual-system (fast control inside slow reasoning) pattern; and latent-action pretraining from unlabeled video, which unlocks internet-scale data for robot pretraining.
- **Reasoning by generation:** "thinking with video" uses video generation as a reasoning substrate ([arXiv:2511.04570](https://arxiv.org/abs/2511.04570)), a genuinely new reasoning modality.

**Where it connects:** [Multimodal RAG](06-retrieval-systems/12-multimodal-rag.md), [Model Taxonomy](02-model-landscape/01-model-taxonomy.md), [Computer-Use Agents](17-tool-use-and-computer-agents/04-computer-use-agents.md).

---

## 11. Smaller, Cheaper, Faster

**Why it matters:** The cost frontier is moving as fast as the capability frontier. Frontier-class reasoning is appearing in small models, low-bit inference is getting reasoning-aware, and speculative decoding keeps improving.

- **Small reasoning models:** a 3B dense model reportedly reaches frontier verifiable-reasoning scores via a diversity-then-RL-then-distill recipe ([VibeThinker-3B, arXiv:2606.16140](https://arxiv.org/abs/2606.16140)), deployable on-device.
- **Reasoning-aware quantization:** 4-bit is near-lossless, but 3-bit and 2-bit degrade reasoning far more than non-reasoning, and quantization-aware training helps ([arXiv:2601.14888](https://arxiv.org/html/2601.14888v1)). FP4 *training* (not just inference) is becoming real on Blackwell-class hardware ([NVFP4 pretraining, arXiv:2509.25149](https://arxiv.org/html/2509.25149v2)).
- **Speculative decoding** keeps advancing: pipelined drafting-and-verification ([arXiv:2603.03251](https://arxiv.org/abs/2603.03251)) and drafters that adapt online from free verification feedback ([arXiv:2603.12617](https://arxiv.org/abs/2603.12617)).
- **Multimodal token compression** is the dominant serving-cost lever for vision models, with compression during encoding rather than after.

**Where it connects:** [Quantization Deep Dive](03-training-and-adaptation/07-quantization-deep-dive.md), [Speculative Decoding](04-inference-optimization/03-speculative-decoding.md), [Cost Optimization](04-inference-optimization/07-cost-optimization-playbook.md).

---

## 12. Test-Time Training: Learning at Inference

**Why it matters:** This is the most-confused term on the page, so it earns its own section. Test-time *training* updates the model's **weights** at inference; test-time *compute* (theme 2) keeps weights frozen and just spends more forward-pass tokens. Different lever, different cost. TTT is research-stage in 2026, but it is the cleanest lens on a real question: when a frozen model plateaus on a genuinely novel task, the fix might not be to think longer or retrieve more, but to briefly *learn*.

**One name, three ideas.** All three run gradient descent at inference on data available only at inference; they differ in what gets updated:

- **TTT as an architecture** ([Sun et al., arXiv:2407.04620](https://arxiv.org/abs/2407.04620)): a sequence layer whose hidden state is itself a small model, updated by one self-supervised gradient step per token. A linear-cost alternative to attention that reduces to linear attention when the inner learner is linear. The paper reports it keeps improving as context grows where Mamba plateaus (at sub-1.3B scale). Extended to minute-long video generation ([arXiv:2504.05298](https://arxiv.org/abs/2504.05298)) and made compute-optimal per token by MesaNet ([arXiv:2506.05233](https://arxiv.org/abs/2506.05233)).
- **TTT as per-task adaptation** ([Akyürek et al., arXiv:2411.07279](https://arxiv.org/abs/2411.07279)): temporarily fine-tune the model (usually a per-task LoRA) on the test input and its augmentations, predict, then discard the update. The headline result is an 8B Llama-3 reaching 53.0% on the ARC-AGI-1 public set (61.9% ensembled with program synthesis, which the paper says matches average human performance) where in-context learning alone plateaus. Lineage: the original vision TTT ([arXiv:1909.13231](https://arxiv.org/abs/1909.13231)) and test-time training on retrieved neighbors ([Hardt and Sun, arXiv:2305.18466](https://arxiv.org/abs/2305.18466)). A related RL variant, TTRL ([arXiv:2504.16084](https://arxiv.org/abs/2504.16084)), updates weights at test time from majority-vote pseudo-rewards.
- **TTT as memory** ([TTT-E2E, arXiv:2512.23675](https://arxiv.org/abs/2512.23675), a Stanford/Berkeley/UCSD/NVIDIA/Astera effort): train the model on the long context as it streams so the context lives in the weights instead of a KV cache, giving constant latency regardless of length. The honest caveat: the paper reports it fails needle-in-a-haystack beyond its attention window (about 6% versus 99% for full attention at 128K), so context-in-weights buys gist, not verbatim recall. The memory-governance failure mode is covered in [Agent Memory and State](07-agentic-systems/05-agent-memory-and-state.md).

**TTT versus test-time compute, in one table:**

| | Test-Time Training | Test-Time Compute (theme 2) |
|---|---|---|
| What changes | weights (often an ephemeral LoRA) | nothing; weights stay frozen |
| What you spend | backward passes at inference | extra forward passes / tokens |
| Looks like | the model studies for this one question, then forgets | the model thinks longer and tries more drafts |
| State | stateful; a request can mutate weights | stateless; pure function of input |

They stack: the ARC result pairs a TTT weight update with augmentation voting, which is a test-time-compute trick.

**When it helps versus hurts.** Helps on distribution shift, genuinely novel tasks where in-context learning plateaus (ARC is the poster child), and long-context efficiency. Hurts on cost (gradient steps at serve time; practitioner reports cite roughly 1.7-2.5x latency), per-instance overfitting, statefulness that breaks caching and reproducibility, and serving complexity, since every request mutating weights cuts against the frozen-weights assumption behind vLLM-style batching. There is also a real security angle: because the adaptation loss is self-supervised on attacker-influenceable input, crafted inputs can poison the test-time update (the test-time-data-poisoning literature, mostly vision so far).

**Maturity (2026):** mostly research and competition, not live serving. Its most battle-tested home is offline ARC-Prize pipelines; the architecture and memory variants are validated at 3-5B params with no public evidence of a frontier model shipping TTT layers in its serving path. Contrast with test-time *compute*, which is in production everywhere. The practical takeaway: reach for prompting, retrieval, or plain fine-tuning first, and watch TTT as the frontier for novel-task adaptation and long-context efficiency.

**Where it connects:** [The Limits of Test-Time Compute](#2-the-limits-of-test-time-compute) (its frozen-weights sibling), [Agent Memory and State](07-agentic-systems/05-agent-memory-and-state.md) (the memory variant), [Fine-Tuning Strategies](03-training-and-adaptation/02-fine-tuning-strategies.md) and [Knowledge Distillation](03-training-and-adaptation/05-knowledge-distillation.md) (the adaptation it temporarily borrows).

---

## A 90-Day Learning Path

If you read in this order, you cover the highest-leverage ideas first:

1. **Week 1-2, context engineering.** Anthropic's effective-context-engineering writing, then AdaCoM and the "Less Context, Better Agents" study. This pays off immediately on any agent you run.
2. **Week 3-4, test-time compute limits.** "When More Thinking Hurts" and the adaptive-budget papers. Changes how you set thinking budgets and price reasoning.
3. **Week 5-6, agent security.** The indirect-injection competition and impossibility result, then the memory-poisoning papers and OWASP ASI06. Reshapes your agent architecture toward least privilege.
4. **Week 7-8, AI control and eval frontier.** The control-protocols paper, eval-awareness, and abstention-aware scoring. Changes how you deploy untrusted agents and how you trust your own evals.
5. **Week 9-10, the RL post-training debate.** The pass@k papers and on-policy distillation. Decides when RL is worth its cost for you.
6. **Week 11-12, efficient architecture.** Trainable sparse attention and MoE scaling laws, plus reasoning-aware quantization. The cost frontier of long context and inference.

Pair every theme with the relevant guide chapter so the research lands on a concrete foundation rather than in the abstract.

---

## How This Maps to the Guide

Most of these themes deepen existing chapters rather than replacing them. The cleanest new-section candidates, if you are extending the guide, are **AI control protocols** (largely absent and production-relevant for agent deployers), **memory security and OWASP ASI06** (a fast-moving cluster with a dedicated risk entry), and the **effective-context gap** as a first-class concept. The rest are best added as "Frontier (2026)" callouts inside their home chapters, linked back here so this page stays the single radar and the chapters stay teachable.

---

*See also: [Benchmarks and Leaderboards](14-evaluation-and-observability/03-benchmarks-and-leaderboards.md) for how to read the leaderboards, and [PATTERNS.md](PATTERNS.md) for the production patterns these ideas feed into.*
