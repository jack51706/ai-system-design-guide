# LLM 可靠性的集成方法

集成方法對於生產環境的可靠性至關重要。本章涵蓋可提升準確度並減少幻覺的多模型協調模式。

## 目錄

- [為何集成方法重要](#why-ensembles-matter)
- [評估集成](#evaluation-ensembles)
- [生成集成](#generation-ensembles)
- [多代理模式](#multi-agent-patterns)
- [集成與仲裁](#ensemble-vs-arbitration)
- [成本與準確度的取捨](#cost-accuracy-tradeoffs)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 為何集成方法重要

對於高風險應用而言，單一模型的輸出並不可靠：
- 模型會捏造事實
- 推理可能有瑕疵
- 輸出會隨溫度而變化
- 單一評審的評估會有偏差

集成方法透過冗餘與多樣性來提升可靠性。

### 集成方法分類

| 類別 | 目的 | 方法 |
|----------|---------|---------|
| 評估 | 降低評審偏差 | Panel of Judges、Pairwise Comparison |
| 生成 | 提升輸出品質 | Self-Consistency、Best-of-N |
| 驗證 | 減少幻覺 | Multi-Agent Debate、Fact Checking |
| 綜合 | 結合多種觀點 | Mixture of Agents |

---

## 評估集成

### LLM 評審團（Panel of LLM Judges, PoLL）

多個多樣化的模型對同一個輸出評分：

```python
class PanelOfJudges:
    """
    Production implementation of PoLL pattern.
    Key insight: Diversity of judges matters more than individual judge quality.
    """
    def __init__(self, judges: list, aggregation: str = "mean"):
        # Use diverse model families, not just different sizes
        # Good: [Claude, GPT-4, Gemini, Llama-70B]
        # Bad: [GPT-4, GPT-4-turbo, GPT-3.5] - same family bias
        self.judges = judges
        self.aggregation = aggregation
    
    async def evaluate(self, question: str, answer: str, rubric: str) -> dict:
        # Parallel evaluation for latency
        judgments = await asyncio.gather(*[
            judge.score(question, answer, rubric) 
            for judge in self.judges
        ])
        
        scores = [j["score"] for j in judgments]
        
        # Track inter-judge agreement for confidence
        agreement = 1 - (np.std(scores) / max(np.mean(scores), 0.01))
        
        if self.aggregation == "mean":
            final_score = np.mean(scores)
        elif self.aggregation == "median":  # More robust to outliers
            final_score = np.median(scores)
        elif self.aggregation == "trimmed_mean":  # Drop highest and lowest
            final_score = np.mean(sorted(scores)[1:-1])
        
        return {
            "score": final_score,
            "confidence": agreement,
            "individual_scores": scores,
            "needs_review": agreement < 0.7  # Flag for human review
        }
```

**何時使用：** 高風險的評估、基準測試的建立，以及無法接受單一評審偏差的場合。

### 帶位置去偏的成對比較（Pairwise Comparison with Positional Debiasing）

模型有 60-70% 的機率偏好第一個選項。務必同時跑兩種排序：

```python
async def pairwise_compare_debiased(model, response_a: str, response_b: str, criteria: str) -> dict:
    """
    Critical: Models have significant positional bias.
    Always run both orderings and aggregate.
    """
    # Run both orderings in parallel
    result_ab, result_ba = await asyncio.gather(
        model.compare(first=response_a, second=response_b, criteria=criteria),
        model.compare(first=response_b, second=response_a, criteria=criteria)
    )
    
    # If A wins in both positions -> Strong signal for A
    if result_ab["winner"] == "first" and result_ba["winner"] == "second":
        return {"winner": "A", "confidence": "high"}
    
    # If B wins in both positions -> Strong signal for B
    elif result_ab["winner"] == "second" and result_ba["winner"] == "first":
        return {"winner": "B", "confidence": "high"}
    
    # Winner depends on position -> Positional bias detected
    else:
        return {
            "winner": "tie",
            "confidence": "low",
            "note": "Positional bias detected"
        }
```

---

## 生成集成

### 自一致性（Self-Consistency，多數投票）

生成多條推理路徑，再對最終答案投票：

```python
class SelfConsistencyDecoder:
    """
    Key parameters:
    - k (sample count): 5-10 for most tasks, 15-20 for hard math
    - temperature: 0.5-0.8 for reasoning tasks
    
    Too low temperature = not enough diversity
    Too high temperature = too much noise
    """
    
    def __init__(self, model, k: int = 7, temperature: float = 0.7):
        self.model = model
        self.k = k
        self.temperature = temperature
    
    async def generate_with_consistency(self, prompt: str) -> dict:
        # Generate k reasoning paths in parallel
        responses = await asyncio.gather(*[
            self.model.generate(prompt, temperature=self.temperature)
            for _ in range(self.k)
        ])
        
        # Extract final answers (task-specific)
        answers = [self.extract_answer(r) for r in responses]
        
        # Majority voting
        answer_counts = Counter(answers)
        majority_answer, majority_count = answer_counts.most_common(1)[0]
        
        # Confidence = proportion of votes for winner
        confidence = majority_count / self.k
        
        # Get best reasoning path that led to majority answer
        best_reasoning = self.select_best_reasoning(
            responses, answers, majority_answer
        )
        
        return {
            "answer": majority_answer,
            "confidence": confidence,
            "num_paths": self.k,
            "reasoning": best_reasoning,
            "vote_distribution": dict(answer_counts)
        }
    
    def extract_answer(self, response: str) -> str:
        # Task-specific answer extraction
        # For math: extract the final number
        # For code: extract the function
        # Implement based on your task
        pass
```

**最適合：** 具有可驗證答案的數學、邏輯與程式設計任務。準確度提升：5-15%。

### 帶獎勵模型的 Best-of-N

生成 N 個候選，用獎勵模型評分，回傳最佳者：

```python
class BestOfNSampler:
    """
    Key considerations:
    1. N selection: N=4-8 for interactive, N=16-64 for batch
    2. Reward model ensemble prevents reward hacking
    3. Monitor sample diversity - if too similar, BoN is wasted compute
    """
    
    def __init__(self, generator, reward_models: list, n: int = 8):
        self.generator = generator
        self.reward_models = reward_models  # Ensemble for robustness
        self.n = n
    
    async def generate_best(self, prompt: str) -> dict:
        # Generate N candidates in parallel
        candidates = await asyncio.gather(*[
            self.generator.generate(prompt, temperature=0.8)
            for _ in range(self.n)
        ])
        
        # Score with reward model ensemble
        scored_candidates = []
        for candidate in candidates:
            rm_scores = await asyncio.gather(*[
                rm.score(prompt, candidate) for rm in self.reward_models
            ])
            
            # Conservative aggregation prevents reward hacking
            # Use 25th percentile instead of mean
            conservative_score = np.percentile(rm_scores, 25)
            
            scored_candidates.append({
                "response": candidate,
                "score": conservative_score,
                "rm_agreement": 1 - np.std(rm_scores) / np.mean(rm_scores)
            })
        
        # Select best by conservative score
        best = max(scored_candidates, key=lambda x: x["score"])
        
        # Compute diversity metric
        diversity = self.compute_diversity(candidates)
        
        return {
            "response": best["response"],
            "score": best["score"],
            "n_sampled": self.n,
            "diversity_score": diversity,
            "low_diversity_warning": diversity < 0.3
        }
    
    def compute_diversity(self, candidates: list) -> float:
        # Embed candidates and compute average pairwise distance
        embeddings = [embed(c) for c in candidates]
        similarities = []
        for i in range(len(embeddings)):
            for j in range(i + 1, len(embeddings)):
                similarities.append(cosine_similarity(embeddings[i], embeddings[j]))
        return 1 - np.mean(similarities)  # Higher = more diverse
```

**最適合：** 開放式生成與創意任務。準確度提升：10-30%。

---

## 多代理模式

### 多代理辯論（Multi-Agent Debate）

多個模型反覆互相批判：

```python
class MultiAgentDebate:
    """
    Pattern: Multiple models debate to reduce hallucinations.
    
    Most effective when:
    1. Models have different biases (diverse model families)
    2. 2-3 rounds is optimal (more = diminishing returns)
    3. Explicit "devil's advocate" prompting improves results
    """
    
    def __init__(self, debaters: list, rounds: int = 2):
        self.debaters = debaters
        self.rounds = rounds
    
    async def debate(self, question: str) -> dict:
        # Round 0: Initial positions
        positions = await asyncio.gather(*[
            debater.generate(f"Answer this question with reasoning: {question}")
            for debater in self.debaters
        ])
        
        debate_history = [{"round": 0, "positions": positions}]
        
        # Debate rounds
        for round_num in range(1, self.rounds + 1):
            new_positions = []
            
            for i, debater in enumerate(self.debaters):
                other_positions = [p for j, p in enumerate(positions) if j != i]
                
                critique_prompt = f"""
Question: {question}

Your previous answer: {positions[i]}

Other perspectives:
{self.format_positions(other_positions)}

Consider the other perspectives. If they raise valid points, update your answer.
If you still disagree, explain why with specific reasoning.
Provide your final answer.
"""
                new_position = await debater.generate(critique_prompt)
                new_positions.append(new_position)
            
            positions = new_positions
            debate_history.append({"round": round_num, "positions": positions})
        
        # Final synthesis
        final_answer = await self.synthesize(question, debate_history)
        
        return {
            "answer": final_answer,
            "rounds": self.rounds,
            "consensus_reached": self.check_consensus(positions),
            "debate_history": debate_history
        }
```

**最適合：** 事實驗證，以及減少複雜答案中的幻覺。

### 代理混合（Mixture of Agents, MoA）

分層架構，由多個模型饋入聚合器：

```
┌─────────────────────────────────────────────────────────────────┐
│                    MIXTURE OF AGENTS (MoA)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Layer 1 (Proposers):                                           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │ Claude  │  │  GPT-4  │  │ Gemini  │  │ Llama   │            │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘            │
│       │            │            │            │                   │
│       └────────────┴─────┬──────┴────────────┘                  │
│                          │                                       │
│  Layer 2 (Aggregator):   ▼                                      │
│  ┌──────────────────────────────────────────────────┐           │
│  │  "Given these perspectives: [R1, R2, R3, R4]    │           │
│  │   Synthesize the best answer..."                │           │
│  └────────────────────────┬─────────────────────────┘           │
│                           │                                      │
│                           ▼                                      │
│                    [Final Output]                                │
└─────────────────────────────────────────────────────────────────┘
```

```python
class MixtureOfAgents:
    def __init__(self, proposers: list, aggregator):
        self.proposers = proposers
        self.aggregator = aggregator
    
    async def generate(self, prompt: str) -> str:
        # Layer 1: Get diverse proposals
        proposals = await asyncio.gather(*[
            proposer.generate(prompt) for proposer in self.proposers
        ])
        
        # Layer 2: Aggregate
        aggregation_prompt = f"""
Given the following question and multiple expert responses, 
synthesize the best possible answer.

Question: {prompt}

Expert responses:
{self.format_proposals(proposals)}

Synthesize the best answer, combining the strongest elements from each response.
"""
        
        final_answer = await self.aggregator.generate(aggregation_prompt)
        return final_answer
```

**最適合：** 複雜的綜合、報告生成，以及跨領域問題。

---

## 集成與仲裁

### 概念上的區別

| 面向 | 集成學習（Ensemble Learning） | 模型仲裁（Model Arbitration） |
|--------|------------------|-------------------|
| **目標** | 結合所有輸出 | 選出單一最佳輸出 |
| **機制** | 聚合（投票、平均） | 選擇（評分、排名） |
| **關係** | 協作式 | 競爭式 |
| **最終輸出** | 由所有模型構成的複合結果 | 單一勝出者的輸出 |
| **何時使用** | 想要穩健性、降低變異 | 想要最佳品質 |

### 決策框架

```
Is there a single "correct" answer format?
├── Yes (classification, math)
│   └── Use Ensemble (voting/averaging)
│
└── No (creative writing, open QA)
    └── Use Arbitration (best-of-N)
        └── Do you have reliable scoring?
            ├── Yes → Reward model selection
            └── No → LLM-as-judge or human
```

---

## 成本與準確度的取捨

### 集成成本矩陣

| 方法 | 成本倍數 | 延遲 | 準確度提升 | 何時使用 |
|--------|-----------------|---------|---------------|-------------|
| 單一模型 | 1x | 1x | 基線 | 低風險、高流量 |
| Self-Consistency k=3 | 3x | 1x（平行） | +5-8% | 推理、對延遲敏感 |
| Self-Consistency k=10 | 10x | 1x（平行） | +10-15% | 數學、對準確度要求高 |
| Best-of-N (N=8) | 8x + 評分 | 1x（平行） | +15-25% | 創意生成 |
| Panel of Judges (3) | 3x 評估 | 1x（平行） | 降低偏差 | 評估任務 |
| Multi-Agent Debate | 6x | 3x | 幻覺 ↓ | 對事實要求高 |
| Mixture of Agents | 5-8x | 2x | 更佳的綜合 | 複雜報告 |

### 何時「不該」使用集成

| 情境 | 為何不該 | 替代方案 |
|-----------|---------|-------------|
| 簡單的事實查詢 | 沒有多樣性的好處 | 單一 RAG 呼叫 |
| 要求延遲 < 500ms | 集成會增加延遲 | 單一模型加上快取 |
| 成本是主要限制 | 集成會使成本倍增 | 模型蒸餾 |
| 模型高度相關 | 沒有多樣性等於沒有好處 | 先取得多樣化的模型 |

---

## 面試問題

### 問：你何時會使用 Self-Consistency，何時會使用 Best-of-N？

**理想回答：**

「這兩者服務於不同目的：

**Self-Consistency** 適用於具有可擷取、可驗證答案的任務：
- 數學題：擷取最終數字，進行多數投票
- 分類：對標籤投票
- 短答型問答：對答案投票

關鍵在於你可以比較答案是否相等。溫度 0.5-0.8 能在維持連貫性的同時提供多樣性。我在大多數任務上使用 k=5-10。

**Best-of-N** 適用於沒有單一正確答案的開放式生成：
- 創意寫作
- 解釋說明
- 可以有多種寫法的程式碼

在這裡我需要一個獎勵模型或評審來為候選評分，因為我無法只靠比較是否相等。通常 N=8-16。挑戰在於避免 reward hacking，所以我會使用獎勵模型集成搭配保守的聚合方式。

我不會把 Self-Consistency 用於創意寫作（沒有可擷取的答案），也不會把 Best-of-N 用於數學（直接投票即可，更簡單）。」

### 問：你如何在 Best-of-N 中防止 reward hacking？

**理想回答：**

「Reward hacking 是指模型利用獎勵模型的弱點，而非真正提升品質。

**我的緩解措施：**

1. **獎勵模型集成**：使用 3 個以上多樣化的獎勵模型。能騙過一個 RM 的樣本，不太可能騙過全部。

2. **保守的聚合**：不使用平均分數，而是使用第 25 百分位數或最小值。這會選出在所有 RM 上都得分良好的樣本，而非只在某一個上。

3. **多樣性監控**：追蹤樣本多樣性。如果多樣性下降得太低，模型可能正在利用某個狹隘的 reward hack。我會調整溫度或使用不同的提示。

4. **人工校準**：定期驗證 RM 選出的樣本是否真的符合人類偏好。

5. **多個維度**：在多項標準上評分（品質、安全性、相關性），並要求在所有項目上都得到好分數，而非只看綜合分數。

關鍵洞見在於：任何單一的獎勵訊號都可能被鑽漏洞。集成讓鑽漏洞變得困難許多。」

---

## 參考資料

- Verga et al. "Replacing Judges with Juries: Evaluating LLM Generations with a Panel of Diverse Models" (2024)
- Wang et al. "Self-Consistency Improves Chain of Thought Reasoning" (2023)
- Du et al. "Improving Factuality and Reasoning in Language Models through Multiagent Debate" (2023)

---

*下一篇：[可靠性模式（延伸）](03-reliability-patterns.md)*
