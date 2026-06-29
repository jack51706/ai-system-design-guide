# 案例研究：以集成驗證進行金融分析

本案例研究探討如何設計一套高可靠度的 AI 系統，用於生成股票研究報告，而準確性在此至關重要。

## 目錄

- [問題陳述](#problem-statement)
- [需求分析](#requirements-analysis)
- [架構設計](#architecture-design)
- [集成管線](#ensemble-pipeline)
- [事實驗證](#fact-verification)
- [品質關卡](#quality-gates)
- [成果與指標](#results-and-metrics)
- [面試逐步演練](#interview-walkthrough)

---

## 問題陳述 {#problem-statement}

**公司：** 生成股票研究報告的投資機構

**挑戰：**
- 報告會影響數百萬美元的投資決策
- 對幻覺金融數據零容忍
- AI 生成的分析受到監管嚴格審查
- 目前的人工流程：每份報告 8 小時，成本 500 美元

**目標：**
- 將報告生成時間縮短至 < 30 分鐘
- 維持 99.5%+ 的準確性
- 為合規提供清晰的稽核軌跡
- 成本目標：每份報告 < 50 美元

---

## 需求分析 {#requirements-analysis}

### 準確性需求

| 數據類型 | 容許誤差 | 驗證方法 |
|-----------|-----------|---------------------|
| 金融指標（EPS、PE） | 0% 誤差 | 來源驗證 |
| 百分比變化 | ±0.1% | 交叉驗證 |
| 日期參照 | 100% 準確 | 來源萃取 |
| 公司名稱 | 100% 準確 | 實體比對 |
| 分析師引言 | 逐字引用或標記 | 引言萃取 |

### 合規需求

- 所有主張都必須引用來源文件
- 沒有免責聲明就不得有前瞻性陳述
- 清楚揭露內容為 AI 生成
- 生成流程的完整稽核軌跡
- 發布前須經人工審查

---

## 架構設計 {#architecture-design}

### 高層級管線

```mermaid
flowchart TD
    S1["階段一：資料萃取 (Self-Consistency k=5)<br/>以多數決從申報文件萃取關鍵指標"]
    S2["階段二：分析生成 (Mixture of Agents)"]
    subgraph MOA["MoA 元件"]
        MA["Model A：聚焦量化分析"]
        MB["Model B：聚焦質化/敘事"]
        MC["Model C：風險因子分析"]
        AGG["Aggregator：彙整為連貫的報告"]
        MA --> AGG
        MB --> AGG
        MC --> AGG
    end
    S3["階段三：事實驗證 (Multi-Agent Debate)<br/>3 個模型辯論每項事實主張並標記分歧"]
    S4["階段四：最終審查 (Panel of Judges)<br/>品質分數決定自動發布或人工審查"]
    S1 --> S2
    S2 --> MOA
    MOA --> S3
    S3 --> S4
```

這條管線以流程方式呈現。每個階段刻意採用不同類別的模型：萃取需要多模態能力（圖表與表格），生成需要敘事品質，稽核需要推理深度，評審團則需要便宜但數量多以追求多樣性：

```mermaid
flowchart LR
    S1[階段一：萃取<br/>Gemini 3 Pro<br/>Self-Consistency k=5] --> S2
    S2[階段二：分析<br/>Mixture of Agents<br/>量化 + 敘事 + 風險] --> S3
    S3[階段三：驗證<br/>Multi-Agent Debate<br/>每項主張 3 個模型] --> S4
    S4[階段四：最終審查<br/>Panel of Judges<br/>品質分數] --> D{達到自動發布<br/>門檻}
    D -->|是| P[發布]
    D -->|否| H[人工審查佇列]
```

### 數據流

```mermaid
flowchart TD
    F1["10-K/Q 申報文件"] --> ING
    F2["法說會"] --> ING
    F3["分析師報告"] --> ING
    ING["資料匯入"] --> EX["萃取 (k=5 SC)"]
    EX --> SD["結構化資料（已驗證指標）"]
    SD --> MOA["MoA 生成"]
    MOA --> DEB["辯論驗證"]
    DEB --> PAN["評審團審查"]
    PAN --> AP["自動發布（高信心）"]
    PAN --> HR["人工審查（低信心）"]
```

以下用 Mermaid 呈現數據脈絡，顯示三個輸入來源如何匯聚成一份經過驗證的輸出：

```mermaid
flowchart TD
    F1[10-K 與 10-Q 申報文件] --> ING[資料匯入]
    F2[法說會] --> ING
    F3[分析師報告] --> ING
    ING --> EX[萃取<br/>k=5 Self-Consistency]
    EX --> SD[(結構化資料<br/>已驗證指標)]
    SD --> MOA[MoA 生成<br/>3 個專門代理]
    MOA --> DEB[辯論驗證<br/>標記分歧]
    DEB --> PAN[評審團審查<br/>品質分數]
    PAN --> AP[自動發布<br/>高信心]
    PAN --> HR[人工審查<br/>低信心]
```

---

## 集成管線 {#ensemble-pipeline}

### 階段一：多模態資料萃取（Gemini 3 Pro）

```python
class FinancialDataExtractor:
    """
    Using Gemini 3 Pro to handle complex 10-K tables and charts natively.
    """
    async def extract_metrics(self, doc_pages: list[bytes]) -> dict:
        # Gemini 3 Pro processes charts/tables as images + text natively
        response = await genai.GenerativeModel("gemini-3.0-pro").generate_content(
            [{"text": "Extract all balance sheet items into JSON."}, *doc_pages]
        )
        return json.loads(response.text)
```

### 階段二：分析生成（Claude 4.5 Opus）

```python
class AnalysisEngine:
    """
    Claude 4.5 Opus for deep qualitative synthesis and narrative coherence.
    """
    async def generate_report(self, data: dict) -> str:
        # High-cost, high-reliability generation for equity research
        return await self.anthropic.messages.create(
            model="claude-4.5-opus-20251101",
            messages=[{"role": "user", "content": f"Analyze: {data}"}]
        )
```

### 階段三：稽核與驗證（o3 推理模型）

```python
class AuditorAgent:
    """
    Using o3 (OpenAI) with high reasoning budget to audit claims.
    Thinking mode is used to detect subtle accounting contradictions.
    """
    async def audit_claim(self, claim: str, raw_data: str) -> dict:
        # o3 'Thinking' mode enables deep logical inference over financial data
        response = await self.openai.chat.completions.create(
            model="o3-2025-12",
            reasoning_effort="high",
            messages=[{"role": "user", "content": f"Find any contradiction in: {claim} vs {raw_data}"}]
        )
        return self.parse_audit(response)
```

### 階段三：以多代理辯論進行事實驗證

辯論階段正是能夠捕捉單一模型遺漏的細微幻覺之處。三個獨立的辯論者平行驗證每一項主張；共識勝出，異議則將該主張標記送交人工審查：

```mermaid
sequenceDiagram
    participant CE as 主張萃取器
    participant D1 as 辯論者 A<br/>Claude 4.5 Opus
    participant D2 as 辯論者 B<br/>GPT-5.2
    participant D3 as 辯論者 C<br/>Gemini 3 Pro
    participant CON as 共識邏輯
    participant OUT as 驗證結果

    CE->>CE: 從報告中<br/>萃取事實主張
    Note over CE,D3: 針對每一項主張，辯論者各自獨立驗證
    par 獨立驗證
        CE->>D1: 主張 + 來源文件
        D1-->>CON: 裁決（supported/inferred/unsupported/contradicted）
    and
        CE->>D2: 主張 + 來源文件
        D2-->>CON: 裁決
    and
        CE->>D3: 主張 + 來源文件
        D3-->>CON: 裁決
    end
    CON->>CON: 檢查共識
    alt 全部一致認為 supported
        CON->>OUT: 已驗證
    else 出現任何 contradiction
        CON->>OUT: 標記送交人工審查
    else 裁決分歧
        CON->>OUT: 低信心
    end
```

```python
class FactVerificationDebate:
    """
    Extract claims from the report and have multiple models
    debate their accuracy.
    """
    
    def __init__(self, debaters: list, rounds: int = 2):
        self.debaters = debaters
        self.rounds = rounds
        self.claim_extractor = ClaimExtractor()
    
    async def verify_report(self, report: str, source_docs: list[str]) -> dict:
        # Extract factual claims
        claims = await self.claim_extractor.extract(report)
        
        verification_results = []
        for claim in claims:
            result = await self.debate_claim(claim, source_docs)
            verification_results.append(result)
        
        return {
            "verified_claims": [r for r in verification_results if r["verified"]],
            "disputed_claims": [r for r in verification_results if not r["verified"]],
            "overall_confidence": self.calculate_confidence(verification_results)
        }
    
    async def debate_claim(self, claim: dict, source_docs: list[str]) -> dict:
        verification_prompt = f"""
Verify this claim against the source documents.

Claim: {claim['text']}

Source documents:
{self.format_sources(source_docs)}

Is this claim:
1. Supported: Explicitly stated in sources
2. Inferred: Reasonably derived from sources
3. Unsupported: Not found in sources
4. Contradicted: Conflicts with sources

Provide your verdict with evidence.
"""
        
        # Each debater verifies independently
        verdicts = await asyncio.gather(*[
            debater.generate(verification_prompt)
            for debater in self.debaters
        ])
        
        # Check consensus
        parsed_verdicts = [self.parse_verdict(v) for v in verdicts]
        consensus = self.check_consensus(parsed_verdicts)
        
        return {
            "claim": claim,
            "verified": consensus["agreed"] and consensus["verdict"] in ["supported", "inferred"],
            "confidence": consensus["agreement_ratio"],
            "verdicts": parsed_verdicts
        }
```

---

## 品質關卡 {#quality-gates}

### 自動化品質檢查

```python
class QualityGate:
    def __init__(self):
        self.thresholds = {
            "claim_verification_rate": 0.95,  # 95% claims verified
            "data_accuracy": 0.99,            # 99% metrics accurate
            "panel_score": 4.0,               # 4/5 minimum
            "disputed_claims_max": 2          # Max 2 disputed claims
        }
    
    async def evaluate(self, report_data: dict) -> dict:
        checks = {}
        
        # Check claim verification rate
        verified_rate = len(report_data["verified_claims"]) / len(report_data["all_claims"])
        checks["claim_verification"] = {
            "passed": verified_rate >= self.thresholds["claim_verification_rate"],
            "value": verified_rate,
            "threshold": self.thresholds["claim_verification_rate"]
        }
        
        # Check data accuracy
        data_accuracy = report_data["extraction_accuracy"]
        checks["data_accuracy"] = {
            "passed": data_accuracy >= self.thresholds["data_accuracy"],
            "value": data_accuracy,
            "threshold": self.thresholds["data_accuracy"]
        }
        
        # Check panel score
        panel_score = report_data["panel_score"]
        checks["panel_score"] = {
            "passed": panel_score >= self.thresholds["panel_score"],
            "value": panel_score,
            "threshold": self.thresholds["panel_score"]
        }
        
        # Determine routing
        all_passed = all(c["passed"] for c in checks.values())
        
        return {
            "checks": checks,
            "routing": "auto_publish" if all_passed else "human_review",
            "disputed_claims": report_data["disputed_claims"]
        }
```

### 人工審查介面

```python
class HumanReviewQueue:
    async def queue_for_review(self, report: dict, quality_result: dict):
        review_item = {
            "report_id": report["id"],
            "report_content": report["content"],
            "disputed_claims": quality_result["disputed_claims"],
            "quality_checks": quality_result["checks"],
            "sources": report["sources"],
            "priority": self.calculate_priority(quality_result),
            "queued_at": datetime.now()
        }
        
        await self.review_queue.enqueue(review_item)
        
        # Notify reviewers
        await self.notify_reviewers(review_item)
```

---

## 成果與指標 {#results-and-metrics}

### 效能比較

| 指標 | 人工流程 | AI 管線 | 改善幅度 |
|--------|---------------|-------------|-------------|
| 每份報告耗時 | 8 小時 | 25 分鐘 | 快 19 倍 |
| 每份報告成本 | $500 | $42 | 減少 92% |
| 事實錯誤率 | 2.1% | 0.4% | 減少 81% |
| 人工審查負擔 | 100% | 28% | 減少 72% |

### 品質指標

| 品質面向 | 目標 | 實際達成 |
|-------------------|--------|----------|
| 資料萃取準確性 | 99% | 99.3% |
| 主張驗證率 | 95% | 96.8% |
| 評審團品質分數 | 4.0/5.0 | 4.2/5.0 |
| 法規合規 | 100% | 100% |

### 成本明細（2025 年 12 月）

| 元件 | 成本 | 佔比 |
|-----------|------|------------|
| 資料萃取（Gemini 3 Pro） | $5 | 11% |
| 分析（Claude 4.5 Opus） | $20 | 44% |
| o3 Thinking 稽核（High） | $15 | 33% |
| 基礎設施與向量運算 | $5 | 12% |
| **總計** | **$45** | 100% |

*註：o3 稽核佔成本的 33%，但能捕捉 Claude 4.5 漏掉的 98% 幻覺，足以證明這筆「Thinking」token 溢價的合理性。*

---

## 面試逐步演練 {#interview-walkthrough}

**面試官：** 「請設計一套用於生成金融研究報告、且準確性要求極高的 AI 系統。」

**理想的回答：**

1. **釐清準確性需求**（1 分鐘）
   - 「金融數據可接受的錯誤率是多少？」
   - 「法規合規的要求是什麼？」
   - 「優先考量的是延遲還是準確性？」

2. **點出核心挑戰**（1 分鐘）
   - 「關鍵挑戰在於金融數據無法容忍幻覺。單一個錯誤數字就可能誤導投資決策。我需要集成方法來確保可靠度。」

3. **高層級架構**（3 分鐘）
   - 「我會採用多階段管線，在每個階段使用不同的集成技術：」
   - 「資料萃取：採用 k=5 的 self-consistency，以對數字達成一致同意」
   - 「分析：採用 Mixture of Agents 以取得多元觀點」
   - 「驗證：採用多代理辯論以捕捉幻覺」
   - 「品質關卡：採用 Panel of Judges 在發布前評分」

4. **深入探討事實驗證**（3 分鐘）
   - 「在事實驗證上，我會從報告中萃取每一項事實主張」
   - 「三個多元的模型針對每項主張是否有來源支持進行辯論」
   - 「如果它們意見分歧，該主張就會被標記送交人工審查」
   - 「這能捕捉到單一模型驗證會漏掉的細微錯誤」

5. **成本與品質的取捨**（2 分鐘）
   - 「這條管線比單一模型生成貴 10 至 20 倍」
   - 「但對金融報告而言，錯誤的代價（法律、商譽）遠遠超過驗證的成本」
   - 「我會實作基於信心的路由：高信心報告自動發布，低信心報告交由人工審查」

6. **監控**（1 分鐘）
   - 「我會持續追蹤萃取準確性、主張驗證率與評審團分數」
   - 「漂移偵測會在準確性下降時發出警示」
   - 「並保留完整的稽核軌跡以供合規之用」

---

## 重點學習

1. **僅靠 self-consistency 並不足夠**，無法應付數值資料萃取。應要求達成一致同意（k/k 票）。

2. **多代理辯論最為有效**，能捕捉細微的推理錯誤與幻覺。

3. **來源歸屬至關重要**，對準確性與合規皆然。每一項主張都必須連結到來源文件。

4. **基於信心的路由**對成本管理不可或缺。並非每份報告都需要完整的集成驗證。

5. **人在迴路中（human-in-the-loop）仍有必要**，以處理有爭議的主張與邊緣案例。設計時須考量優雅的升級機制。

---

## 參考資料

- Verga et al. "Replacing Judges with Juries: Evaluating LLM Generations with a Panel of Diverse Models" (2024)
- Du et al. "Improving Factuality and Reasoning in Language Models through Multiagent Debate" (2023)
- SEC AI Disclosure Requirements: https://www.sec.gov/

---

*下一篇：[程式碼助理案例研究](04-code-assistant.md)*
