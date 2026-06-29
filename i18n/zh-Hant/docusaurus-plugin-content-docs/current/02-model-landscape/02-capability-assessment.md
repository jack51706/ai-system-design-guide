# 能力評估

本章說明如何針對你的特定使用情境評估與比較模型能力。通用的基準測試很少能呈現全貌，本指南協助你進行有意義的評估。

## 目錄

- [為什麼基準測試還不夠](#why-benchmarks-are-not-enough)
- [評估維度](#evaluation-dimensions)
- [建立自訂評估](#building-custom-evaluations)
- [常見的評估陷阱](#common-evaluation-pitfalls)
- [實務評估流程](#practical-assessment-process)
- [內部基於 Elo 的評估](#internal-elo-based-evaluation)
- [推理校準與效率](#reasoning-calibration)
- [模型 A/B 測試](#ab-testing-models)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 為什麼基準測試還不夠 {#why-benchmarks-are-not-enough}

### 基準測試的問題

公開基準測試（MMLU、HumanEval、GSM8K）有以下限制：

| 問題 | 影響 |
|-------|--------|
| 訓練資料汙染 | 模型可能已經看過測試題目 |
| 任務不匹配 | 基準測試可能無法反映你的使用情境 |
| 彙總分數掩蓋變異 | 模型 A 整體上可能勝過 B，但在你的領域中落敗 |
| 刷分 | 模型為了基準測試而最佳化，而非為了真實任務 |
| 過時 | 基準測試落後於模型能力 |

### 基準測試告訴你什麼

```
Benchmark results tell you: "Model X scored 88% on MMLU"

What you need to know: "Will Model X correctly answer my 
customers' questions about our product documentation?"
```

**經驗法則：** 用基準測試做初步篩選，然後進行你自己的評估。

---

## 評估維度 {#evaluation-dimensions}

### 維度 1：任務表現

| 任務類型 | 評估方法 | 關鍵指標 |
|-----------|---------------------|------------|
| **自主程式撰寫** | CWE/SWE-bench（Verified） | 自主解決議題的百分比 |
| **長程規劃** | 代理式迴圈（Agentic Loop）測試 | 10 步以上計畫的成功率 |
| **推理深度** | 思考模式分析 | 跨 CoT 步驟的邏輯一致性 |
| **長上下文 RAG** | 大海撈針（Needle-in-a-Haystack，2M+） | 大規模下的召回效率 |
| **原生多模態** | 交錯的視覺/語音/文字 | 跨模態的同步準確度 |

### 維度 2：代理式精通度

模型使用工具與遵循多步驟指令的能力有多好？

```python
def evaluate_agentic_flow(agent, task_environment):
    """
    Measure success on 'Autonomous Agent' tasks:
    1. Plan generation
    2. Tool selection accuracy
    3. Error recovery
    4. Feedback loop utilization
    """
    results = []
    for scenario in task_environment.scenarios:
        traj = agent.run(scenario.goal)
        results.append({
            "success": traj.reached_goal,
            "steps": len(traj.steps),
            "tool_errors": traj.count_invalid_tool_calls()
        })
    return aggregate(results)
```

### 維度 3：推理可靠度

「思考」模式相較於標準生成，是否能提升輸出準確度？

| 模式 | 準確度（數學） | 準確度（程式） | 平均延遲 | 每次輸出 Tokens |
|------|-----------------|-----------------|-------------|-----------------|
| **標準** | 72% | 68% | 1.2s | 400 |
| **思考** | 94% | 89% | 12.5s | 2400 |
| **混合** | 不定 | 不定 | 使用者自訂 | 可設定 |

### 推理校準

**「過度思考」問題：**
模型常常在一個只需 10 個 tokens 就能回答的問題上花費 2000 個以上的「思考」tokens（例如「2+2 等於多少？」）。

**Principal 級別的細膩考量：**
根據**邏輯效率**評估模型：`Accuracy / (Inference Tokens)`。
生產環境系統會使用**模型仲裁（Model Arbitration）**：由一個小模型（Gemini 3.1 Flash、Claude Haiku 4.5、GPT-5.5-mini）判斷某個查詢是否需要「思考」模式。這能避免簡單查詢付出 10 倍的延遲與成本代價。

---

## 內部基於 Elo 的評估 {#internal-elo-based-evaluation}

**超越靜態評分標準。**
評分標準（1 至 5 分制）容易出現「評審疲勞」與「分數漂移」。現代系統會對內部黃金集（golden set）採用**成對 Elo（Pairwise Elo）**。

**工作流程：**
1. **盲測並排比較：** 模型 A 與模型 B 針對同一查詢生成答案。
2. **評審：** 由一個「Ultra」模型（Claude Opus 4.7、GPT-5.5 reasoning，或人類）選出勝者。
3. **Elo 更新：** 更新內部排行榜。

```python
def update_elo(winner_elo, loser_elo, k=32):
    expected_winner = 1 / (1 + 10 ** ((loser_elo - winner_elo) / 400))
    new_winner_elo = winner_elo + k * (1 - expected_winner)
    new_loser_elo = loser_elo + k * (0 - (1 - expected_winner))
    return new_winner_elo, new_loser_elo
```

**為何勝出：** 它提供的是**相對**排名，對評審個性或模型版本變動的穩健性高出許多。

### 維度 4：上下文召回

在 2M+ 上下文視窗的情況下，單純的「大海撈針」已經不夠。我們現在會跨整個視窗測量**上下文推理（Contextual Reasoning）**。

| 指標 | 測量方式 | 目標 |
|--------|-------------|--------|
| **視窗召回** | 在視窗 90% 深度處的事實召回 | > 98% |
| **跨文件推理** | 連結文件 A（位置 10k）與文件 B（位置 1M）的邏輯 | > 90% |
| **上下文雜訊抗性** | 當視窗中 90% 為無關「填充內容」時的準確度 | > 95% |

---

## 建立自訂評估 {#building-custom-evaluations}

### 步驟 1：定義評估標準

```python
evaluation_criteria = {
    "correctness": {
        "weight": 0.4,
        "description": "Is the answer factually correct?",
        "scale": [1, 2, 3, 4, 5],
        "rubric": {
            5: "Completely correct, no errors",
            4: "Mostly correct, minor issues",
            3: "Partially correct, some errors",
            2: "Mostly incorrect",
            1: "Completely wrong or nonsensical"
        }
    },
    "relevance": {
        "weight": 0.3,
        "description": "Does the answer address the question?",
        "scale": [1, 2, 3, 4, 5]
    },
    "completeness": {
        "weight": 0.2,
        "description": "Are all parts of the question addressed?",
        "scale": [1, 2, 3, 4, 5]
    },
    "conciseness": {
        "weight": 0.1,
        "description": "Is the answer appropriately concise?",
        "scale": [1, 2, 3, 4, 5]
    }
}
```

### 步驟 2：建立測試集

```python
test_set = [
    {
        "id": "q001",
        "query": "What is the refund policy for subscription cancellation?",
        "context": "[relevant documentation]",
        "ground_truth": "Full refund within 30 days, prorated after",
        "difficulty": "easy",
        "category": "policy"
    },
    {
        "id": "q002",
        "query": "How do I integrate the API with a Python async application?",
        "context": "[API documentation]",
        "ground_truth": "[expected code pattern]",
        "difficulty": "medium",
        "category": "technical"
    },
    # ... 50-100+ test cases
]
```

**測試集準則：**
- 涵蓋所有主要使用情境
- 包含簡單、中等、困難的範例
- 在各類別之間取得平衡
- 包含邊界案例
- 具備明確的標準答案（ground truth）

### 步驟 3：實作評估

```python
class ModelEvaluator:
    def __init__(self, models: list[str], test_set: list[dict]):
        self.models = models
        self.test_set = test_set
        self.results = {}
    
    def evaluate_all(self):
        for model in self.models:
            self.results[model] = self.evaluate_model(model)
        return self.results
    
    def evaluate_model(self, model: str) -> dict:
        scores = []
        latencies = []
        
        for case in self.test_set:
            start = time.time()
            response = self.generate(model, case)
            latency = time.time() - start
            latencies.append(latency)
            
            # Score using LLM judge or human
            score = self.score_response(case, response)
            scores.append(score)
        
        return {
            "mean_score": mean(scores),
            "score_by_category": self.group_by_category(scores),
            "p50_latency": percentile(latencies, 50),
            "p99_latency": percentile(latencies, 99)
        }
    
    def score_response(self, case: dict, response: str) -> float:
        # Option 1: LLM-as-judge
        return self.llm_judge(case, response)
        
        # Option 2: Exact match
        # return exact_match(response, case["ground_truth"])
        
        # Option 3: Semantic similarity
        # return cosine_sim(embed(response), embed(case["ground_truth"]))
```

### 步驟 4：LLM 作為評審（LLM-as-Judge）

```python
def llm_judge(case: dict, response: str) -> dict:
    prompt = f"""Evaluate this response to a customer query.

Query: {case['query']}
Expected Answer: {case['ground_truth']}
Model Response: {response}

Rate the response on these criteria (1-5 scale):
1. Correctness: Is it factually accurate?
2. Relevance: Does it answer the question?
3. Completeness: Are all aspects covered?
4. Conciseness: Is it appropriately brief?

Output JSON:
{{"correctness": X, "relevance": X, "completeness": X, "conciseness": X, "reasoning": "..."}}
"""
    
    result = judge_model.generate(prompt)
    return parse_json(result)
```

---

## 常見的評估陷阱 {#common-evaluation-pitfalls}

### 陷阱 1：測試集太小

**問題：** 20 個測試案例不足以進行可靠的比較。

**解法：** 以 100 個以上的案例為目標，依難度與類別分層。

### 陷阱 2：標準答案模稜兩可

**問題：**「合理」的答案被判定為錯誤。

```
Query: "What is the capital of Australia?"
Ground truth: "Canberra"
Model answer: "The capital of Australia is Canberra."
Exact match: FAIL (but clearly correct)
```

**解法：** 使用語意比對或 LLM 評審，而非完全字串比對（exact match）。

### 陷阱 3：評估集外洩

**問題：** 用同一批案例做開發與評估。

**解法：** 保留一份從不用於提示調校的保留測試集（held-out test set）。

### 陷阱 4：忽略變異

**問題：** 每個測試只跑一次，會忽略模型的隨機性。

**解法：** 以 temperature > 0 多次執行，並回報信賴區間。

### 陷阱 5：成本盲點

**問題：** 最佳模型貴上 10 倍。

**解法：** 一律回報品質調整後成本（quality-adjusted cost）。

```python
def quality_adjusted_cost(model_results):
    return {
        model: {
            "quality": results["mean_score"],
            "cost_per_1k": results["cost_per_1k_queries"],
            "quality_per_dollar": results["mean_score"] / results["cost_per_1k"]
        }
        for model, results in model_results.items()
    }
```

---

## 實務評估流程 {#practical-assessment-process}

### 第 1 週：設定與初步篩選

```
Day 1-2: Define evaluation criteria and create test set
Day 3-4: Benchmark 4-6 candidate models
Day 5: Analyze results, filter to top 2-3
```

### 第 2 週：深度評估

```
Day 1-2: Expand test set for top candidates
Day 3: Test edge cases and robustness
Day 4: Measure latency and throughput
Day 5: Calculate total cost of ownership
```

### 第 3 週：生產環境驗證

```
Day 1-2: Shadow mode deployment
Day 3-4: A/B test if traffic allows
Day 5: Final decision and documentation
```

### 決策範本

```markdown
## Model Evaluation Report

### Candidates Evaluated
- Model A: GPT-4o
- Model B: Claude 3.5 Sonnet
- Model C: Llama 3.1 70B

### Evaluation Results

| Metric | Model A | Model B | Model C |
|--------|---------|---------|---------|
| Overall Score | 4.2/5 | 4.3/5 | 3.9/5 |
| Category 1 | ... | ... | ... |
| P50 Latency | 450ms | 520ms | 180ms |
| Cost/1K queries | $0.85 | $1.10 | $0.25 |

### Recommendation
Model B (Claude 3.5 Sonnet) for quality-critical paths
Model C (Llama 3.1 70B) for high-volume, cost-sensitive paths

### Rationale
[Detailed reasoning]
```

---

## 模型 A/B 測試 {#ab-testing-models}

### 何時該做 A/B 測試

- 高流量（每天 1000 次以上查詢）
- 明確的成功指標
- 可接受品質變動的風險
- 需要生產環境驗證

### A/B 測試設計

```python
class ModelABTest:
    def __init__(self, model_a: str, model_b: str, traffic_split: float = 0.5):
        self.model_a = model_a
        self.model_b = model_b
        self.traffic_split = traffic_split
        self.results = {"a": [], "b": []}
    
    def route_request(self, request_id: str) -> str:
        # Deterministic routing for consistency
        hash_val = hash(request_id) % 100
        if hash_val < self.traffic_split * 100:
            return self.model_a
        return self.model_b
    
    def record_outcome(self, request_id: str, metrics: dict):
        model = self.route_request(request_id)
        bucket = "a" if model == self.model_a else "b"
        self.results[bucket].append(metrics)
    
    def analyze(self):
        return {
            "model_a": {
                "name": self.model_a,
                "mean_score": mean([r["score"] for r in self.results["a"]]),
                "sample_size": len(self.results["a"])
            },
            "model_b": {
                "name": self.model_b,
                "mean_score": mean([r["score"] for r in self.results["b"]]),
                "sample_size": len(self.results["b"])
            },
            "p_value": self.calculate_significance()
        }
```

### 要追蹤的指標

| 指標類型 | 範例 |
|-------------|----------|
| 品質 | 使用者評分、專家審查、LLM 評審 |
| 互動 | 點擊率、頁面停留時間、後續查詢 |
| 商業 | 轉換、客服升級、解決率 |
| 營運 | 延遲、錯誤、成本 |

---

## 面試問題 {#interview-questions}

### 問：你會如何為客服聊天機器人評估模型？

**優秀的回答：**
我會把評估分層進行：

**1. 離線評估（投入 80% 的心力）：**
- 從真實客服工單建立測試集（200 個以上案例）
- 涵蓋所有類別：帳務、技術、退貨、一般
- 包含簡單、中等、困難難度
- 測量：準確度、有用性、安全性

**2. 評估方法：**
- 對主觀指標使用 LLM 作為評審
- 對樣本（20%）進行人工審查
- 追蹤指令遵循（格式、長度）

**3. 指標：**
```python
metrics = {
    "resolution_accuracy": "Does answer solve the problem?",
    "safety": "No harmful/wrong advice?", 
    "tone": "Professional and empathetic?",
    "escalation_appropriate": "Knows when to involve human?"
}
```

**4. 生產環境驗證：**
- 影子模式（shadow mode）：執行新模型並比較輸出
- A/B 測試：將 10% 流量導向新模型
- 監控：CSAT、客服升級率、解決時間

### 問：用 MMLU 來為你的使用情境比較模型，有什麼問題？

**優秀的回答：**
MMLU 對特定使用情境有幾個問題：

**1. 領域不匹配：** MMLU 測的是學術知識，但我的客服機器人需要的是產品知識。

**2. 格式不匹配：** MMLU 是選擇題，我的使用情境是自由形式的生成。

**3. 汙染：** 模型可能已經用 MMLU 題目訓練過。

**4. 彙總掩蓋變異：** 模型 A 在 MMLU 上可能勝過 B，但在我在意的特定類別上落敗。

**5. 沒有上下文測試：** MMLU 不測試 RAG 或長上下文能力。

**更好的做法：**
- 用 MMLU 做初步篩選（節省時間）
- 為最終決策建立自訂評估
- 在實際使用情境的資料上測試
- 納入營運指標（延遲、成本）

---

## 參考資料 {#references}

- Zheng et al. "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena" (2023)
- LMSYS Chatbot Arena: https://chat.lmsys.org/
- HELM: https://crfm.stanford.edu/helm/
- LMSys Evaluation: https://github.com/lm-sys/FastChat/tree/main/fastchat/llm_judge
- OpenAI Evals: https://github.com/openai/evals

---

*上一篇：[模型分類](01-model-taxonomy.md) | 下一篇：[定價與成本](03-pricing-and-costs.md)*
