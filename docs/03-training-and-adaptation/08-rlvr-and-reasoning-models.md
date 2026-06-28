# Training Reasoning Models: RLVR and GRPO

The frontier reasoning models (OpenAI's o-series, DeepSeek-R1, Qwen's thinking models) are trained with a recipe distinct from the RLHF and DPO covered in [RLHF and DPO](04-rlhf-and-dpo.md): **reinforcement learning with verifiable rewards (RLVR)**. Take a capable base model, have it generate long chains of thought on problems with *checkable* answers (math, code, logic), and reward correctness directly with a programmatic verifier instead of a learned reward model. This chapter covers RLVR, the GRPO algorithm DeepSeek made popular, the reward-design failure modes, the live debate over what RL actually adds, and the cheaper distillation path most teams should take first.

## Table of Contents

- [RLVR: Reinforcement Learning with Verifiable Rewards](#rlvr-reinforcement-learning-with-verifiable-rewards)
- [GRPO](#grpo)
- [Reward Design and Failure Modes](#reward-design-and-failure-modes)
- [Does RL Add Capability or Sharpen Sampling?](#does-rl-add-capability-or-sharpen-sampling)
- [Distillation: The Cheaper Path](#distillation-the-cheaper-path)
- [Practical Guidance](#practical-guidance)
- [Interview Questions](#interview-questions)
- [References](#references)

---

## RLVR: Reinforcement Learning with Verifiable Rewards

RLVR replaces RLHF's learned reward model with a deterministic **verifier** that returns a reward from a ground-truth check: did the final answer match (math), did the code pass the unit tests, does the proof check. The policy is the LLM; the environment is a single-turn generation of a long chain of thought followed by an answer; the reward is computed by a numeric/string match or by running the code.

**Why "verifiable" matters: it largely sidesteps reward-model hacking.** In RLHF the reward model is itself a neural net trained on preferences, and the policy learns to exploit its blind spots (the Goodhart / over-optimization problem). A verifier for "does this equal the gold answer" or "do all tests pass" has no soft, learnable surface to game in the same way; the reward is grounded in an external oracle. This is the core reason RLVR scales more stably than RLHF for reasoning. It does not *eliminate* gaming (see [Reward Design](#reward-design-and-failure-modes)), but it removes the easiest exploit.

The loop, per step:
1. Sample prompts with known-checkable answers.
2. For each, sample one or more long-CoT completions from the current policy.
3. Run the verifier on each completion to get a scalar reward (often 1 correct / 0 wrong, sometimes plus a small format reward).
4. Compute advantages and do a policy-gradient update.
5. Repeat. Long chains of thought, self-verification, and backtracking *emerge* from this loop rather than being explicitly supervised.

The canonical open result is **DeepSeek-R1** (arXiv:2501.12948; the peer-reviewed version appeared in Nature in September 2025), which reports that reasoning can be incentivized through *pure RL* with no human-labeled reasoning traces, with emergent self-reflection. A teaching caveat: OpenAI has not published the o-series algorithm, so treat "o-series uses RLVR-style RL" as a reasonable inference from public messaging, not a documented fact, and do not attribute a specific algorithm to it.

---

## GRPO

**Group Relative Policy Optimization** was introduced in DeepSeekMath (arXiv:2402.03300) and used as the RL engine for DeepSeek-R1.

**The PPO problem it removes.** PPO needs a **value/critic network**, typically the same size as the policy, to estimate the baseline for advantage computation. For LLMs that roughly doubles memory and adds a second model to train, and a value estimate for a long sequence with a single terminal reward is hard to learn. GRPO's move: **delete the critic.** Instead of a learned baseline, sample a **group** of completions for the same prompt and use the group's own reward statistics as the baseline.

**Group-relative advantage.** For a prompt, sample completions `o_1..o_G`, get rewards `r_1..r_G`. The advantage for completion `i` is its z-score within the group, broadcast to every token in that completion:

```python
# One GRPO step. policy = the LLM; verify() = a programmatic checker.
for q in sample_prompts(batch):
    group = [policy.generate(q) for _ in range(G)]      # G group, e.g. 8..64
    R = [verify(q, o) for o in group]                    # verifiable reward, e.g. 1.0 / 0.0
    mu, sigma = mean(R), std(R)
    A = [(r - mu) / (sigma + 1e-6) for r in R]           # group-relative advantage (the critic-free baseline)
    for o_i, A_i in zip(group, A):
        ratio = exp(policy.logprob(o_i) - old_policy.logprob(o_i))  # per-token prob ratio
        loss += -mean(min(ratio * A_i, clip(ratio, 1-eps, 1+eps) * A_i))
        loss += beta * KL(policy, ref_policy)            # original GRPO keeps a KL term
update(policy, loss)
```

DeepSeek used it because dropping the critic is the practical memory win at frontier scale, and the group baseline suits single terminal verifiable rewards.

**Known issues, and the variants that fix them:**
- **Length bias.** Because one scalar advantage is broadcast to every token, a longer completion spreads its advantage over more tokens, and the optimization can inflate response length (especially for wrong answers). **Dr.GRPO** (arXiv:2503.20783) removes the length and standard-deviation normalization terms that cause this.
- **Zero-variance collapse.** If all completions in a group get the same reward (all correct on an easy prompt, or all wrong on a hard one), the std goes to zero, every advantage goes to zero, and the group contributes *no gradient*. As the model improves, more prompts become "all correct," so the effective batch shrinks. **DAPO** (arXiv:2503.14476) fixes this with **dynamic sampling**: oversample and filter out any prompt whose group is all-correct or all-wrong, keeping only groups that produce a gradient. DAPO also decouples the clip range ("clip-higher"), uses token-level loss, and drops the KL term.
- **MoE instability.** Token-level importance ratios are noisy for mixture-of-experts models because routing differs between policy versions. **GSPO** (arXiv:2507.18071, used in Qwen3) defines the ratio on whole-sequence likelihood instead, stabilizing RL for MoE.

The practical lesson: curate prompts at the model's difficulty band, and prefer a debiased variant (Dr.GRPO, DAPO, or GSPO) over vanilla GRPO.

---

## Reward Design and Failure Modes

Even with a verifiable reward, the policy optimizes whatever the verifier *actually* measures, not what you meant.

- **Gaming the verifier.** Models can pass a checker without learning the pattern (for example, enumerating instance-level labels), a documented RLVR reward-hacking mode.
- **"Miracle steps."** A chain of thought can reach the right final answer through *unfaithful* intermediate steps (arXiv:2510.07774). A pure outcome verifier rewards the correct answer and the bad reasoning along with it.
- **Format vs correctness rewards.** R1-Zero-style recipes pair a small format reward (put reasoning in a tagged block, give a parseable answer) with the correctness reward. If the format reward is too large relative to correctness, the model optimizes the cheap, gameable signal.
- **Length exploitation**, both the GRPO gradient artifact above and genuine verbosity-correlates-with-passing hacking. Mitigations: token-level loss, overlong-response penalties, length-normalized objectives.

A flagged, important caveat: the **Spurious Rewards** finding (arXiv:2506.10947) reports that on one model family, GRPO with *random* or even *incorrect* rewards produced large gains, by amplifying a behavior already latent in that family's pretraining. Crucially, the paper stresses these gains did **not** transfer to other model families. The lesson is to be deeply suspicious of single-model-family RLVR results and always include a baseline from a different family.

---

## Does RL Add Capability or Sharpen Sampling?

This is the chapter's most nuanced point: a genuine open question with three positions.

- **RL sharpens, it does not add.** One line of work (arXiv:2504.13837) reports that RLVR models beat the base model at pass@1 but the base model matches or exceeds them at large pass@k, suggesting every reasoning path the RL model uses already existed in the base model; RL raises the probability of sampling a correct chain but narrows the explorable set.
- **Prolonged RL expands the boundary.** Counter-results (ProRL, arXiv:2505.24864; and arXiv:2506.14245, which introduces a reasoning-aware CoT-Pass@K metric) report that with enough RL, models solve problems the base model fails at every k, and that RLVR improves *reasoning-correct* answers, not just lucky finals.
- **Both, in two phases (the synthesis to lead with).** A reconciling view (arXiv:2510.04028) finds early RL exploits and sharpens (pass@1 up, pass@k flat) while prolonged RL explores and expands the boundary. The cleanest practical synthesis (arXiv:2512.07783) reports RL produces true gains (measured at high pass@k) **only when pretraining left headroom and the RL data targets the model's edge of competence**, problems it fails at pass@1 but can sometimes hit at pass@k. RL on already-solved or hopeless problems yields little.

That same work highlights **mid-training**: a stage between general pretraining and RL that continues training on a curated, reasoning-dense mixture to consolidate emerging skills. Under a fixed compute budget it often outperforms RL-only, because it raises the base competence that RL then sharpens. The honest read: the field has converged on "RL works best at the competence edge," but whether RL can manufacture *genuinely novel* capability remains contested.

---

## Distillation: The Cheaper Path

For most teams, RL is the wrong first move.

**Off-policy distillation (SFT on a teacher's traces).** DeepSeek-R1 reports fine-tuning dense Qwen and Llama models on roughly 800K reasoning traces generated by R1, and that the distilled 32B model beats running large-scale RL directly on that same 32B base, which the paper notes takes far more compute and still does not match distillation. The lesson: for a small model on a known domain, distilling from a strong reasoner is more effective and far cheaper than doing your own RL.

**On-policy distillation** (Thinking Machines Lab, 2025) trains the student on *its own* sampled completions (on-policy, like RL) but with dense per-token supervision from a teacher's distribution (like SFT) instead of a sparse scalar reward. The reported result is roughly an order of magnitude more sample-efficient than RL for instilling reasoning, combining on-policy relevance with a dense, stable signal. The numbers are largely single-vendor as of 2026, so treat the exact multiple as reported, not established.

| Method | Trajectories | Reward signal | Cost / stability |
|--------|-------------|---------------|------------------|
| SFT / off-policy distillation | Teacher's | Dense token targets | Cheap, stable; some exposure bias |
| RL / RLVR | Student's own | Sparse scalar | Expensive, less stable; on-policy |
| On-policy distillation | Student's own | Dense (teacher per-token) | On-policy relevance plus dense signal |

See [Knowledge Distillation](05-knowledge-distillation.md) for the broader treatment.

---

## Practical Guidance

**Train your own reasoning model vs consume one.** For roughly 95% of teams: consume a strong reasoner or distill from one. Do your own RLVR only when (a) you have a clean programmatic verifier for your domain, (b) the base or teacher genuinely cannot be elicited to your target behavior, (c) you have the RL infrastructure and GPU budget and tolerance for instability, and (d) your tasks sit at the model's edge of competence.

**Rough needs (orders of magnitude, not promises):** distillation wants 10^5 to 10^6 high-quality teacher traces at standard SFT compute; RLVR wants thousands to tens of thousands of *verifiable* prompts curated to the difficulty band, with rollouts (not the gradient step) as the cost bottleneck. DeepSeek-R1's post-training was reported at roughly 147K H800 GPU-hours, well beyond hobbyist scale though less than commonly assumed.

**Evaluation traps:** report pass@1 *and* pass@k (pass@1 alone hides the sampling-vs-capability distinction); use multiple base families (the Spurious Rewards artifact); check reasoning faithfulness, not just final answers; watch response-length drift as a reward-hacking smoke alarm; and guard against benchmark contamination by preferring held-out or fresh competition sets. See [Benchmarks and Leaderboards](../14-evaluation-and-observability/03-benchmarks-and-leaderboards.md).

**Maturity:** distillation and GRPO/DAPO recipes for math and code with clean verifiers are mature and reproducible. On-policy distillation, GSPO for MoE, and mid-training as a deliberate stage are maturing fast. Whether RLVR adds new capability, and how to extend it cleanly beyond verifiable domains without reintroducing reward-model hacking, is genuinely unsettled, so anchor on the mechanisms (group baseline, length normalization, dynamic sampling, dense-vs-sparse supervision, edge-of-competence data) rather than any single leaderboard number.

---

## Interview Questions

### Q: What is RLVR, and why does it scale more stably than RLHF for reasoning?

**Strong answer:**
RLVR is reinforcement learning with verifiable rewards: instead of a learned reward model, you reward the policy with a deterministic verifier, did the math answer match, did the code pass its tests. It scales more stably than RLHF because the reward is grounded in an external oracle rather than a neural net the policy can over-optimize. RLHF's classic failure is reward-model hacking, where the policy finds inputs the reward model scores highly but humans would not; a unit-test pass has no comparable soft surface to exploit. The tradeoff is that RLVR only applies where you can mechanically check correctness, which is why it took off first in math, code, and logic. It does not eliminate gaming, models can still reach right answers through unfaithful steps or game the checker, so you still watch faithfulness and length.

### Q: Explain GRPO and one of its known failure modes.

**Strong answer:**
GRPO drops PPO's value/critic network, which for an LLM roughly doubles memory, and replaces the learned baseline with a group-relative one: sample several completions for the same prompt, score each with the verifier, and use the within-group z-score as the advantage, broadcast to every token. That makes it cheap and well-suited to single terminal verifiable rewards, which is why DeepSeek used it. A key failure mode is zero-variance collapse: when every completion in a group gets the same reward, all correct on an easy prompt or all wrong on a hard one, the standard deviation is zero, the advantages are zero, and the group produces no gradient. As the model improves, more prompts become all-correct, so the effective batch shrinks. DAPO's dynamic sampling fixes this by filtering out all-correct and all-wrong groups and only training on groups that actually produce a gradient. There is also a length bias from broadcasting one advantage over all tokens, which Dr.GRPO addresses by removing the length normalization.

---

## References

- DeepSeek-AI, "DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via RL" arXiv:2501.12948 (Nature, 2025)
- Shao et al., "DeepSeekMath" (GRPO) arXiv:2402.03300
- "Understanding R1-Zero-Like Training" (Dr.GRPO) arXiv:2503.20783
- "DAPO: An Open-Source LLM RL System at Scale" arXiv:2503.14476
- "Group Sequence Policy Optimization" (GSPO) arXiv:2507.18071
- The capability debate: arXiv:2504.13837, "ProRL" arXiv:2505.24864, arXiv:2506.14245, the two-stage synthesis arXiv:2510.04028, and pretraining/mid-training/RL interplay arXiv:2512.07783
- "Spurious Rewards: Rethinking Training Signals in RLVR" arXiv:2506.10947
- Thinking Machines Lab, ["On-Policy Distillation"](https://thinkingmachines.ai/blog/on-policy-distillation/)

---

*Next: [Inference Fundamentals](../04-inference-optimization/01-inference-fundamentals.md)*
