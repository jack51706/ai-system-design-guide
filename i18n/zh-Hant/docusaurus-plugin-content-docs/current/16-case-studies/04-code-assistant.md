# 案例研究：AI 程式碼助理

本案例研究涵蓋如何設計一套生產環境的程式碼助理，能提供即時建議、程式碼生成與除錯協助。

## 目錄

- [問題陳述](#problem-statement)
- [需求分析](#requirements-analysis)
- [架構設計](#architecture-design)
- [程式碼生成管線](#code-generation-pipeline)
- [品質保證](#quality-assurance)
- [效能優化](#performance-optimization)
- [成果與指標](#results-and-metrics)
- [面試逐步講解](#interview-walkthrough)

---

## 問題陳述

**公司：** 開發者工具公司，正在打造 IDE 擴充套件

**目標：**
- 開發者輸入時即時提供程式碼補全
- 從自然語言生成多行程式碼
- 程式碼解釋與除錯協助
- 支援 20 種以上的程式語言

**限制條件：**
- 補全延遲 < 200ms（維持輸入流暢度）
- 生成延遲 < 3s（可接受的停頓）
- 安全性：程式碼不離開客戶基礎設施（企業版選項）
- 成本：在規模化下可持續（數百萬名開發者）

---

## 需求分析

### 功能需求

| 功能 | 說明 | 延遲目標 |
|---------|-------------|----------------|
| 行內補全 | 補全目前行或區塊 | < 200ms |
| 多行生成 | 從註解生成函式或類別 | < 3s |
| 程式碼解釋 | 解釋所選程式碼 | < 5s |
| 錯誤修正 | 為錯誤提供修正建議 | < 2s |
| 重構 | 提供改善建議 | < 5s |
| 文件 | 生成 docstring | < 2s |

### 品質需求

| 維度 | 目標 | 量測方式 |
|-----------|--------|-------------|
| 採納率 | > 30% | 被採納的建議 / 顯示的建議 |
| 語法正確性 | > 99% | 成功編譯或解析 |
| 安全性 | 0 漏洞 | SAST 掃描通過率 |
| 相關性 | > 85% | 使用者評分 |

---

## 架構設計

### 高層架構

```mermaid
flowchart TD
    IDE["IDE 擴充套件"]
    IDE --> GW

    subgraph GW["Gateway / Router"]
        DB["Debounce"]
        AU["Auth"]
        FF["Feature Flags"]
    end

    GW --> CS["補全服務<br/>(快速)"]
    GW --> GS["生成服務<br/>(品質)"]
    GW --> ES["解釋服務<br/>(品質)"]

    CS --> ML["模型層"]
    GS --> ML
    ES --> ML
```

把這套架構視為一條流程。三個服務層依「延遲對品質」拆分（補全是 200ms 以下，生成與解釋則以品質優先），三者共用同一個模型層：

```mermaid
flowchart TD
    IDE[IDE 擴充套件<br/>VS Code / JetBrains]
    IDE --> GW

    subgraph GW[Gateway / Router]
        DB[Debounce]
        AU[Auth]
        FF[Feature Flags]
    end

    GW --> CS[補全服務<br/>fast: under 200ms]
    GW --> GS[生成服務<br/>quality: 1-5s]
    GW --> ES[解釋服務<br/>quality: 1-5s]

    CS --> ML[模型層]
    GS --> ML
    ES --> ML
```

### 上下文組裝

```python
class CodeContextAssembler:
    """
    Assemble context for code completion.
    Challenge: Balance context richness with latency.
    """
    
    def __init__(self, max_tokens: int = 4000):
        self.max_tokens = max_tokens
    
    def assemble(
        self,
        cursor_position: dict,
        file_content: str,
        open_files: list[dict],
        project_context: dict
    ) -> str:
        context_parts = []
        remaining_tokens = self.max_tokens
        
        # Priority 1: Immediate context (before and after cursor)
        immediate = self.get_immediate_context(
            file_content, cursor_position, tokens=2000
        )
        context_parts.append(immediate)
        remaining_tokens -= count_tokens(immediate)
        
        # Priority 2: Related imports and definitions
        if remaining_tokens > 500:
            related = self.get_related_definitions(
                file_content, cursor_position, tokens=min(1000, remaining_tokens)
            )
            context_parts.append(related)
            remaining_tokens -= count_tokens(related)
        
        # Priority 3: Other open files (same module/package)
        if remaining_tokens > 500:
            other_files = self.get_relevant_open_files(
                open_files, cursor_position, tokens=remaining_tokens
            )
            context_parts.append(other_files)
        
        return self.format_context(context_parts)
    
    def get_immediate_context(
        self,
        content: str,
        cursor: dict,
        tokens: int
    ) -> str:
        lines = content.split("\n")
        cursor_line = cursor["line"]
        
        # Get lines before cursor (more important)
        before_ratio = 0.7
        before_tokens = int(tokens * before_ratio)
        after_tokens = tokens - before_tokens
        
        # Expand outward from cursor
        before_lines = lines[:cursor_line]
        after_lines = lines[cursor_line:]
        
        # Truncate to fit
        before_text = self.truncate_to_tokens(
            "\n".join(before_lines), before_tokens, from_end=True
        )
        after_text = self.truncate_to_tokens(
            "\n".join(after_lines), after_tokens, from_end=False
        )
        
        return f"{before_text}\n<CURSOR>\n{after_text}"
```

上下文組裝是一種「優先級驅動的預算分配」。模型只會看到通過 4000 token 上限後留存下來的內容，因此順序很重要：先放緊鄰的程式碼（一定塞得下），接著是相關定義，最後只有在還有預算時才放其他已開啟的檔案：

```mermaid
flowchart TD
    Start[游標事件<br/>budget = 4000 tokens]
    Start --> P1[P1: 緊鄰上下文<br/>2000 tokens before+after cursor<br/>70/30 split toward before]
    P1 --> R1{Remaining<br/>over 500}
    R1 -->|no| Final[組裝上下文<br/>send to model]
    R1 -->|yes| P2[P2: 相關定義<br/>imports, types, callees<br/>up to 1000 tokens]
    P2 --> R2{Remaining<br/>over 500}
    R2 -->|no| Final
    R2 -->|yes| P3[P3: 其他已開啟檔案<br/>same module / package<br/>fill remaining budget]
    P3 --> Final
```

---

## 程式碼生成管線

### 補全服務（2025 年 12 月）

```python
class DeepCompletion:
    """
    Sub-150ms latency using o4-mini with speculative decoding.
    """
    def __init__(self):
        self.model = "o4-mini"  # Native code-optimized mini
        self.draft_model = "nano-code-1b" # Local on-device model
    
    async def complete(self, context: str) -> str:
        # Speculative decoding: 1B model drafts, o4-mini verifies
        return await self.openai.generate(
            model=self.model,
            draft_model=self.draft_model,
            prompt=context,
            max_tokens=64
        )
```

### 生成服務（「Claude Code」時代）

```python
class AgenticGeneration:
    """
    Using Claude Sonnet 4.6 (Hybrid) for autonomous refactoring.
    """
    async def refactor_module(self, folder_path: str):
        # Claude Sonnet 4.6 with 'Thinking' enabled for architecture consistency
        agent = ClaudeCodeAgent(
            model="claude-3-7-sonnet",
            tools=["ls", "read_file", "write_file", "test_runner"]
        )
        
        # Agent explores codebase, understands dependencies, and applies fix
        return await agent.run(f"Refactor {folder_path} to use async/await.")
```

> [!TIP]
> **生產環境選擇：** 雖然 Claude Opus 4.7 在寫程式上是一頭猛獸，但在 2025 年 12 月，**Claude Sonnet 4.6** 才是 IDE 的首選生產環境選項，原因在於它的**混合推理（Hybrid Reasoning）**：開發者可以針對難纏的 bug 切換到「Thinking」模式，針對樣板程式碼切換到「Fast」模式。

---

## 品質保證

### 多階段驗證

驗證器是一道「快速失敗的關卡序列」。便宜的檢查（語法）先跑且為硬性阻擋；昂貴的檢查（測試執行）放最後，且只在情境允許時才跑。任何阻擋性失敗都會直接短路掉其餘步驟：

```mermaid
flowchart TD
    G[生成的程式碼] --> SY[Stage 1: 語法檢查<br/>fast, blocking]
    SY -->|fail| RJ[拒絕: syntax_error]
    SY -->|ok| SEC[Stage 2: 安全掃描<br/>medium, blocking]
    SEC -->|critical| RJV[拒絕: vulnerability]
    SEC -->|ok or warnings| TY[Stage 3: 型別檢查<br/>medium, advisory<br/>typescript / python]
    TY --> TST{Test context<br/>available}
    TST -->|yes| TR[Stage 4: 測試執行<br/>slow, optional]
    TST -->|no| PASS[呈現給使用者<br/>with warnings]
    TR -->|pass| PASS
    TR -->|fail| WARN[呈現給使用者<br/>with test-fail label]
```

```python
class CodeVerifier:
    """
    Verify generated code before presenting to user.
    """
    
    async def verify(self, code: str, language: str, context: str) -> VerificationResult:
        results = {}
        
        # Stage 1: Syntax check (fast, blocking)
        syntax_ok = self.check_syntax(code, language)
        if not syntax_ok:
            return VerificationResult(passed=False, reason="syntax_error")
        
        # Stage 2: Security scan (medium, blocking)
        security = await self.security_scan(code, language)
        if security.has_critical:
            return VerificationResult(passed=False, reason="security_vulnerability")
        results["security"] = security
        
        # Stage 3: Type check if applicable (medium)
        if language in ["typescript", "python"]:
            type_result = await self.type_check(code, context, language)
            results["types"] = type_result
        
        # Stage 4: Test execution if available (slow, optional)
        if self.has_test_context(context):
            test_result = await self.run_tests(code, context)
            results["tests"] = test_result
        
        return VerificationResult(
            passed=True,
            details=results,
            warnings=security.warnings if security else []
        )
    
    def check_syntax(self, code: str, language: str) -> bool:
        parsers = {
            "python": self.parse_python,
            "javascript": self.parse_javascript,
            "typescript": self.parse_typescript,
            # ... other languages
        }
        
        parser = parsers.get(language)
        if not parser:
            return True  # Cannot verify, assume OK
        
        try:
            parser(code)
            return True
        except SyntaxError:
            return False
    
    async def security_scan(self, code: str, language: str) -> SecurityResult:
        # Run static analysis
        if language == "python":
            result = await self.run_bandit(code)
        elif language in ["javascript", "typescript"]:
            result = await self.run_eslint_security(code)
        else:
            result = await self.run_semgrep(code, language)
        
        return result
```

### 採納率優化

```python
class AcceptanceOptimizer:
    """
    Learn from user acceptance patterns to improve suggestions.
    """
    
    def __init__(self):
        self.feedback_store = FeedbackStore()
    
    async def record_feedback(
        self,
        suggestion_id: str,
        accepted: bool,
        edited: bool,
        context_hash: str
    ):
        await self.feedback_store.record({
            "suggestion_id": suggestion_id,
            "accepted": accepted,
            "edited": edited,
            "context_hash": context_hash,
            "timestamp": datetime.now()
        })
    
    async def should_show_suggestion(
        self,
        suggestion: str,
        confidence: float,
        user_context: dict
    ) -> bool:
        # Historical acceptance rate for similar suggestions
        historical_rate = await self.get_historical_rate(
            user_context["user_id"],
            user_context["language"],
            confidence
        )
        
        # Threshold based on user preferences
        threshold = user_context.get("suggestion_threshold", 0.3)
        
        # Only show if likely to be accepted
        return (confidence * historical_rate) > threshold
```

---

## 效能優化

### 延遲優化

| 技術 | 影響 | 實作方式 |
|-----------|--------|----------------|
| 請求去抖動（debouncing） | -50ms | 在 IDE 中做 150ms 去抖動 |
| 連線池（connection pooling） | -30ms | 持久化 HTTP/2 |
| 模型暖機（warm-up） | -100ms | 預先載入的模型 |
| 推測解碼（speculative decoding） | -40% | 草稿模型 + 驗證 |
| 邊緣快取（edge caching） | -80ms | 針對常見模式使用 CDN |

### 快取策略

```python
class CompletionCache:
    """
    Multi-level cache for completions.
    """
    
    def __init__(self):
        self.local_cache = LRUCache(max_size=10000)  # In-memory
        self.redis_cache = Redis()  # Distributed
    
    def get_cache_key(self, context: str) -> str:
        # Hash context for cache key
        # Include language and cursor position
        return hashlib.sha256(context.encode()).hexdigest()[:16]
    
    async def get(self, context: str) -> str | None:
        key = self.get_cache_key(context)
        
        # Check local first
        local = self.local_cache.get(key)
        if local:
            return local
        
        # Check distributed
        remote = await self.redis_cache.get(f"completion:{key}")
        if remote:
            self.local_cache.set(key, remote)
            return remote
        
        return None
    
    async def set(self, context: str, completion: str):
        key = self.get_cache_key(context)
        
        # Set in both caches
        self.local_cache.set(key, completion)
        await self.redis_cache.setex(
            f"completion:{key}",
            3600,  # 1 hour TTL
            completion
        )
```

---

## 成果與指標

### 效能成果

| 指標 | 目標 | 達成 |
|--------|--------|----------|
| 補全延遲（p50） | < 200ms | 145ms |
| 補全延遲（p99） | < 500ms | 380ms |
| 生成延遲（p50） | < 3s | 2.1s |
| 語法正確性 | > 99% | 99.5% |
| 安全性（0 個高嚴重度） | 100% | 99.8% |
| 採納率 | > 30% | 34% |

### 成本分析（2025 年 12 月）

| 元件 | 每 100 萬則建議的成本 | 備註 |
|-----------|------------------------|-------|
| **補全（o4-mini）** | $0.20 | 為大量請求量做了極致優化 |
| **代理式任務（Claude Sonnet 4.6）** | $45.00 | 假設 10k tokens + Thinking |
| **驗證（本地）** | $0.00 | 已轉移到裝置端的 Nano |
| **基礎設施** | $15.00 | 託管式 GPU 服務 |
| **總計（混合）** | **~$12.00** | **相較 2024 年降低 90%** |

*混合成本假設 98% 為補全、2% 為高價值的代理式重構。*

---

## 面試逐步講解

**面試官：** 「為 IDE 設計一套 AI 程式碼助理。」

**優秀的回答：**

1. **釐清需求**（1 分鐘）
   - 「補全與生成各自的目標延遲是多少？」
   - 「是否需要企業部署搭配地端（on-prem）選項？」
   - 「需要支援哪些語言？」

2. **找出關鍵挑戰**（1 分鐘）
   - 「核心張力在於延遲對品質。補全為了維持輸入流暢度需要 < 200ms，但好的程式碼又需要豐富的上下文與驗證。」

3. **雙層架構**（3 分鐘）
   - 「我會把補全（快速）和生成（品質）分開：」
   - 「補全：較小的模型、最少的上下文、推測解碼」
   - 「生成：前沿模型、best-of-N、語法與安全驗證」

4. **上下文組裝**（2 分鐘）
   - 「上下文至關重要。我的優先順序是：緊鄰的程式碼 > 匯入或定義 > 已開啟的檔案」
   - 「對補全而言，我為了速度把上限設在 2K tokens」
   - 「對生成而言，我可以用 8K 以上的 tokens 來換取更好的理解」

5. **品質保證**（2 分鐘）
   - 「每一則建議都會經過：語法檢查、安全掃描，以及選擇性的型別檢查」
   - 「對生成而言，我會用 best-of-N 搭配 8 個候選，過濾掉無效的，再評分並挑選」
   - 「這能在安全漏洞抵達開發者之前就攔截下來」

6. **延遲優化**（2 分鐘）
   - 「在 IDE 中做請求去抖動、連線池、模型暖機」
   - 「用推測解碼換取 40% 的延遲降低」
   - 「快取常見模式（匯入、樣板程式碼）」

---

## 參考資料

- GitHub Copilot Architecture: https://github.blog/
- Codestral: https://mistral.ai/news/codestral/
- CodeLlama: https://ai.meta.com/blog/code-llama/

---

*下一篇：[內容審核案例研究](05-content-moderation.md)*
