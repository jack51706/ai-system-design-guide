# Pretraining Basics

Pretraining is the most computationally expensive phase of building an LLM, where a model learns general knowledge and language patterns from massive datasets.

## Table of Contents

- [The Pretraining Objective](#the-pretraining-objective)
- [Data Curriculum and Quality](#data-curriculum-and-quality)
- [Scaling Laws (Inference-Optimal)](#scaling-laws)
- [Computational Requirements](#computational-requirements)
- [Training Stability](#training-stability)
- [Interview Questions](#interview-questions)
- [References](#references)

---

## The Pretraining Objective

Most modern LLMs are **Decoder-only** and use **Causal Language Modeling (CLM)**:

```python
# Objective: Minimize Cross-Entropy Loss
Loss = -sum(log P(token_i | token_1, ..., token_{i-1}))
```

The model predicts the next token given the context. This simple objective, at scale, leads to emergent reasoning capabilities.

---

## Data Curriculum and Quality

The focus has shifted from "More Data" to "Better Curriculum."

### The 100T Token Horizon
Frontier models (Llama 4, GPT-5.5, Claude Opus 4.7, Gemini 3.1 Pro) are trained on 15T to 100T tokens. At this scale, **Deduplication** and **Quality Filtering** are the primary differentiators.

### Data Mixture Standard
| Component | Percentage | Purpose |
|-----------|------------|---------|
| Web (CommonCrawl) | 50-60% | General knowledge, diverse styles |
| Code (Github, StackOverflow)| 15-20% | **Critical for Logic & Reasoning** |
| Books (Project Gutenberg) | 10% | Narrative coherence, long context |
| Academic (ArXiv, PubMed) | 10% | Specialized technical knowledge |
| Synthetic (Model-generated) | 5-10% | Math, Logic, and specific instruction paths |

**Nuance: The "Code Effect":**
Research shows that increasing code in the pretraining mix improves a model's performance on **non-coding** reasoning tasks (e.g., math, logic puzzles) by teaching structured thinking.

---

## Scaling Laws: Training vs. Inference Optimal

### The Chinchilla Paradigm (2022-2024)
`Data Tokens (D) ≈ 20 * Parameters (N)`
For a 70B model, this suggests ~1.4T tokens.

### The Inference-Optimal Paradigm
Modern models (Llama 3, Llama 4) are **heavily overtrained** relative to Chinchilla.
- **Why?**: Training cost is paid once; inference cost is paid billions of times.
- **Result**: Small models (8B) are now trained on 15T+ tokens, making them as capable as older 70B models but much cheaper to serve.

| Strategy | Token/Param Ratio | Best For |
|----------|-------------------|----------|
| Chinchilla | 20:1 | Research / Proof of Concept |
| **Inference-Optimal** | **200:1 to 500:1**| Production deployment |

---

## Training Stability

Training at the "Ultra" scale (100k+ GPUs) faces massive stability issues.

### 1. Loss Spikes
Sudden jumps in loss that can ruin a training run.
- **Standard fix**: **Periodic Checkpointing** and **Automatic Rollbacks**.
- **Architecture fix**: **Residual Scaling** (initializing weights such that the residual branch starts at near-zero).

### 2. Precision: FP8 vs BF16
- **BF16**: The 2023-2024 stability standard.
- **FP8**: The current production standard. Supported natively by H100/B200, it halves memory usage and doubles throughput while maintaining training stability through **Stochastic Rounding**.

---

## Interview Questions

### Q: Why train an 8B model on 15T tokens if Chinchilla says 160B tokens is optimal?

**Strong answer:**
Chinchilla optimality focuses on the best use of a fixed **training** compute budget. However, in production, we care about the **Total Cost of Ownership (TCO)**, which is dominated by inference. By overtraining a small model, we "bake in" more intelligence into fewer parameters. This results in a model that is significantly more efficient to serve (higher TPS, lower VRAM) while maintaining frontier-level quality.

### Q: What is the "curriculum" in LLM pretraining?

**Strong answer:**
Curriculum refers to the order and mixture of data. A common modern pattern is:
1. **General Knowledge Phase:** 80% of tokens (Web, Books).
2. **Reasoning Focus Phase:** 15% tokens (Code, Math, Logic).
3. **High-Quality "Cooling" Phase:** The last 1-5% of tokens are extremely high-quality, human-curated, or textbook data. This "cooling" phase helps the model jitter less and follow instructions better before any fine-tuning starts.

---

## References
- Kaplan et al. "Scaling Laws for Neural Language Models" (2020)
- Hoffmann et al. "Training Compute-Optimal Large Language Models" (Chinchilla, 2022)
- Meta AI. "The Llama 3/4 Herd of Models" (2024/2025)

---

*Next: [Fine-Tuning Strategies](02-fine-tuning-strategies.md)*
