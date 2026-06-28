# Knowledge Distillation

Knowledge distillation is the process of transferring the intelligence from a large, complex model ("Teacher") to a smaller, more efficient one ("Student"). This is the secret to the high performance of today's small open-weight models that punch well above their parameter count.

## Table of Contents

- [The Teacher-Student Paradigm](#teacher-student-paradigm)
- [How Distillation Works](#how-distillation-works)
- [Feature vs. Output Distillation](#feature-vs-output)
- [Self-Distillation from Proof (SDP)](#self-distillation-proof)
- [Quantization-Aware Distillation](#quantization-aware-distillation)
- [Interview Questions](#interview-questions)
- [References](#references)

---

## The Teacher-Student Paradigm

Small models (e.g., Llama 4 8B, Gemini 3.1 Flash, Claude Haiku 4.5) are not trained on raw web data alone. They are trained on **Synthetic Data** generated or curated by a much larger model (e.g., GPT-5.5, Claude Opus 4.7, or Llama 4 405B).

| Model | Role | Intelligence Source |
|-------|------|---------------------|
| **Teacher** | Large (100B+ Params) | Pretraining on 50T+ tokens |
| **Student** | Small (1B - 8B Params) | Teacher's filtered logic/output |

---

## How Distillation Works

### 1. Hard Label Distillation
The student learns from the teacher's final predictions (e.g., the answer to a question).

### 2. Soft Label Distillation (Temperature Scaling)
The student learns from the teacher's **probability distribution** (Logits). This is much richer because it tells the student not just the right answer, but which wrong answers were "almost" right.

```python
# Distillation Loss (KL Divergence):
Loss = KL_Div(Teacher_Logits / T, Student_Logits / T)
```
*Where T is the Temperature (typically 2.0 - 5.0).*

---

## Feature vs. Output Distillation

### Output Distillation (Standard)
Student matches the teacher's text responses.
- **Pros**: Easy to implement via API.
- **Cons**: Only learns behavioral surface patterns.

### Feature/Hidden State Distillation
Student matches the inner **Hidden States** (vector representations) of the teacher.
- **Requirement**: You need access to the teacher's weights (Open Weights).
- **Pro**: The student learns the teacher's "internal conceptual map," leading to much higher reasoning depth.

---

## Self-Distillation from Proof (SDP)

**The reasoning breakthrough.**
Models like o1, DeepSeek-R1, and Claude Opus 4.7 use SDP to improve without new human data.

1. **Generation**: The model generates 100 possible solutions to a hard math/code problem.
2. **Verification**: A rule-based system (compiler/calculator) identifies the 1 correct solution.
3. **Distillation**: The model is fine-tuned on the "Chain of Thought" (CoT) that led to that correct solution.

**Result**: The model "distills itself" by keeping only the high-quality reasoning paths.

---

## Quantization-Aware Distillation

Standard quantization (e.g., 16-bit to 4-bit) causes a small drop in accuracy.
**The Fix**: Use Knowledge Distillation *during* the quantization process. The 16-bit model acts as the teacher, guiding the 4-bit model to minimize its error. This is how modern 4-bit models match 16-bit performance.

---

## Interview Questions

### Q: Why is a distilled 8B model better than an 8B model trained from scratch on the same tokens?

**Strong answer:**
Training from scratch (Pretraining) on raw web data is noisy; the model spends a lot of capacity learning to navigate that noise. A distilled model, however, is trained on a "purified" curriculum. The teacher model acts as a high-quality filter, providing structured logic, clear explanations, and a cleaner distribution of language. Essentially, the teacher provides "hints" through its logit distribution that tell the student exactly which features of the language are most important to learn.

### Q: What are the risks of using GPT-4o as a teacher to distill a Llama student?

**Strong answer:**
1. **Model Collapse**: If the student only sees the teacher's output, it may lose the "long tail" of creative or diverse knowledge and only learn the teacher's narrow biases.
2. **License Violations**: Most proprietary models (OpenAI, Anthropic) have clauses forbidding the use of their outputs to train "competing" models. This is a major legal risk for enterprises distilling their own models from API outputs.
3. **Linguistic Mimicry**: The student might learn to *sound* confident (like the teacher) without actually having the same level of logical depth, leading to confident but incorrect hallucinations.

---

## References
- Hinton et al. "Distilling the Knowledge in a Neural Network" (2015)
- Gou et al. "Knowledge Distillation: A Survey" (2021)
- DeepSeek. "DeepSeek-R1: Incentivizing Reasoning Capability" (2025)

---

*Next: [Synthetic Data Generation](06-synthetic-data-generation.md)*
