# Tokenization 深入解析

Tokenization 是把文字轉換成模型可處理的離散單位（token）的過程。它直接影響模型的能力、成本與效能。

## 目錄

- [為什麼 Tokenization 很重要](#why-tokenization-matters)
- [Tokenization 演算法](#tokenization-algorithms)
- [詞彙表設計的取捨](#vocabulary-design-tradeoffs)
- [特殊 token](#special-tokens)
- [多語言 Tokenization](#multilingual-tokenization)
- [用於成本估算的 token 計數](#token-counting-for-cost-estimation)
- [常見的 Tokenization 問題](#common-tokenization-issues)
- [實用的 Tokenization 模式](#practical-tokenization-patterns)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 為什麼 Tokenization 很重要 {#why-tokenization-matters}

### 對系統設計而言

1. **成本**：LLM API 是按 token 計費。Tokenization 的效率直接影響成本。
2. **上下文限制**：決定能塞進上下文的是 token 數量，而非字數。
3. **能力**：有些任務（數字母、變位詞）很困難，正是因為 Tokenization。
4. **一致性**：同一段文字在不同模型上會被切成不同的 token。

### 對理解 LLM 行為而言

**經典面試問題**：為什麼 GPT 很難數出「strawberry」裡有幾個字母？

因為「strawberry」會被切成多個子詞（subword）。模型從來不會看到個別的字元，它看到的是子詞單位。要數字母就必須對 token 的內部結構進行推理。

---

## Tokenization 演算法 {#tokenization-algorithms}

### Byte Pair Encoding（BPE）

最常見的演算法。GPT 系列、Llama 4、Claude 都採用它。

**訓練演算法：**
1. 從個別位元組組成的詞彙表開始（256 個 token）
2. 統計訓練語料中所有相鄰的 token 配對
3. 把出現頻率最高的配對合併成一個新 token
4. 重複直到達到詞彙表大小為止

**範例：**
```
Corpus: "low lower lowest"
Initial: ['l', 'o', 'w', ' ', 'l', 'o', 'w', 'e', 'r', ' ', 'l', 'o', 'w', 'e', 's', 't']

Step 1: Most frequent pair is ('l', 'o'). Merge to 'lo'.
['lo', 'w', ' ', 'lo', 'w', 'e', 'r', ' ', 'lo', 'w', 'e', 's', 't']

Step 2: Most frequent pair is ('lo', 'w'). Merge to 'low'.
['low', ' ', 'low', 'e', 'r', ' ', 'low', 'e', 's', 't']

Step 3: Most frequent pair is ('low', 'e'). Merge to 'lowe'.
['low', ' ', 'lowe', 'r', ' ', 'lowe', 's', 't']

Continue until vocabulary size target...
```

**特性：**
- 在訓練好的詞彙表下，tokenization 是決定性的（deterministic）
- 常見字詞往往會是單一 token
- 罕見字詞會被拆成子詞

### WordPiece

由 BERT 系列模型採用。

**與 BPE 的關鍵差異：**
- BPE：依頻率合併
- WordPiece：依「概似度（likelihood）提升程度」合併

```
Score = freq(AB) / (freq(A) * freq(B))
```

這會偏好那些比隨機共現更有意義的合併。

**視覺標記：** WordPiece 使用 ## 前綴來表示接續 token：
```
"embedding" becomes ["em", "##bed", "##ding"]
```

### Unigram（SentencePiece）

由 T5、ALBERT 以及部分多語言模型採用。

**訓練演算法：**
1. 從一個很大的候選詞彙表開始
2. 計算移除每個 token 時造成的損失（loss）
3. 移除那些對 loss 增加最少的 token
4. 重複直到達到詞彙表大小為止

**關鍵差異：** 它是以機率而非頻率來運作。能從早期不理想的合併中復原。

### 比較

| 演算法 | 合併準則 | Tokenization | 採用者 |
|-----------|-----------------|--------------|---------|
| BPE | 頻率 | 決定性 | GPT、Llama、Claude |
| WordPiece | 概似度 | 決定性 | BERT、DistilBERT |
| Unigram | 機率 | 機率性 | T5、mT5、XLNet |

---

## 詞彙表設計的取捨 {#vocabulary-design-tradeoffs}

### 詞彙表大小

| 大小 | 範例 | 優點 | 缺點 |
|------|---------|------|------|
| 小（10K） | 部分早期模型 | 嵌入較小 | token 序列很長 |
| 中（32K） | Llama 2 | 取捨平衡良好 | 多語言效率不佳 |
| 大（128K） | Llama 3/4、Claude Sonnet 4.6、Mistral Medium 3.5 | **目前的標準。** 壓縮比高。 | 嵌入表較大 |
| 巨大（200K+） | GPT-5.5（o200k）、Claude Opus 4.7 | 原生多模態與多語言效率 | LM Head 的記憶體壓力 |

**詞彙表擴充的深入解析：**
- **Llama 3/4（128k）**：藉由從 32k 擴增到 128k，Meta 把英文的壓縮率提升了約 15%，並把像印地語這類非英文語言提升了 3 到 4 倍。
- **GPT-4o/5.2（o200k_base）**：Tiktoken 最新的編碼為程式碼與多語言文字提供了更優異的壓縮，藉由用更少的 token 表達相同語義，間接降低了 API 成本。

### 字元 vs 子詞 vs 整詞

| 粒度 | 範例 | 「running」的 token | 取捨 |
|-------------|---------|---------------------|-----------|
| 字元 | ByT5 | ['r','u','n','n','i','n','g'] | 能處理任何文字，但序列非常長 |
| 子詞 | GPT | ['running'] 或 ['run','ning'] | 取捨平衡良好 |
| 整詞 | 早期 NLP | ['running'] | 序列短，但無法處理 OOV（詞彙表外的字） |

現代 LLM 普遍採用子詞 tokenization，以兼顧詞彙表大小與序列長度的平衡。

### Byte-Level BPE

GPT-2 引入了 byte-level BPE：
- 基礎詞彙表是 256 個位元組，而非字元
- 能表示任何文字而不需要 UNK token
- Unicode 會自然地以位元組序列來處理

```python
# Character-level: Needs explicit handling of characters
text = "cafe"  # Unknown character might become [UNK]

# Byte-level: Works with any text (no UNK needed)
text = "cafe"  # Becomes bytes, then BPE operates on bytes
```

---

## 特殊 token {#special-tokens}

特殊 token 用來處理一般文字之外的結構性資訊：

| Token | 用途 | 範例 |
|-------|---------|---------|
| BOS | 序列開頭 | 標示生成的起點 |
| EOS | 序列結尾 | 標示完成 |
| PAD | 填充 | 把批次補齊到相同長度 |
| UNK | 未知 token | OOV 的後備方案（在 byte BPE 下很少見） |
| SEP | 分隔符 | 分隔不同片段（BERT 風格） |

### 對話模板（Chat Templates）

現代對話模型使用特殊 token 來表達對話結構：

**Llama 2 格式：**
```
[INST] <<SYS>>
You are a helpful assistant.
<</SYS>>

User message here [/INST] Assistant response here
```

**ChatML（OpenAI 風格）：**
```
<|im_start|>system
You are a helpful assistant.<|im_end|>
<|im_start|>user
Hello!<|im_end|>
<|im_start|>assistant
Hi there!<|im_end|>
```

**為什麼這很重要：**
- 格式錯誤會導致很差的結果
- 特殊 token 並不存在於預訓練資料中
- 像 transformers 這類函式庫會用 chat_template 來自動套用格式

---

## 多語言 Tokenization {#multilingual-tokenization}

### 挑戰

主要以英文訓練的 tokenizer，對其他語言的效率很差：

| 語言 | 「Hello」的 token | 對等問候語的 token |
|----------|-------------------|-------------------------------|
| 英文 | 1（「Hello」） | - |
| 中文 | - | 對等用語需 2 到 3+ |
| 日文 | - | 對等用語需 3 到 5+ |
| 韓文 | - | 對等用語需 2 到 4+ |

**成本影響：** 非英文使用者，每個語義單位要多付 2 到 3 倍的費用。

### 解決方案

1. **多語言訓練語料：** 用平衡的多語言資料來訓練 tokenizer
2. **更大的詞彙表：** 留更多空間給非英文的 token
3. **語言特定的 tokenizer：** 依語系分別建立 tokenizer

**多語言支援良好的模型：**
- mT5、XLM-R：以 100 多種語言訓練
- GPT-4、Claude 3.5：搭配多語言覆蓋的大型詞彙表
- Gemini：從一開始就為多語言而設計

| 模型 | 中文 | 日文 | 韓文 | 印地語 |
|-------|---------|----------|--------|--------|
| GPT-2 | 2.5x | 3.0x | 2.8x | 6.0x |
| GPT-4（cl100k） | 1.4x | 1.6x | 1.5x | 3.2x |
| GPT-5.2（o200k） | 1.1x | 1.2x | 1.1x | 1.4x |
| Llama 3/4（128k）| 1.2x | 1.3x | 1.2x | 1.5x |

---

## 多模態 Tokenization（從像素到 token）

現代原生多模態模型不只是「看到」圖像，而是把圖像 token 化。

### 圖像 Tokenization（Vision Transformers）
圖像會被切成多個區塊（patch，例如 14x14 像素）。每個區塊會通過一個視覺編碼器（例如 SigLIP）來產生單一的視覺 token。
- **固定 token 成本**：多數模型在特定解析度下，每張圖像使用固定數量的 token（例如每張圖像 256 或 729 個 token）。
- **動態解析度**：有些模型（Gemini 3）會依圖像長寬比與細節程度，使用可變數量的 token。

### 音訊／影片 Tokenization
- **音訊**：用 EnCodec 這類編解碼器壓縮成離散單位，再表示成一串音訊 token。
- **影片**：被當成一連串圖像影格來處理（時間維度的 tokenization）。一段 1 秒、1FPS 的影片，可能跟一張高解析度圖像的成本一樣高。

---

## 用於成本估算的 token 計數 {#token-counting-for-cost-estimation}

### 快速估算規則

對英文文字而言：
- **字數換算 token：** 每個字約 1.3 個 token
- **字元換算 token：** 每個 token 約 4 個字元
- **頁數換算 token：** 每頁約 500 到 800 個 token

```python
def estimate_tokens(text: str) -> int:
    # Rough estimation for English
    word_count = len(text.split())
    return int(word_count * 1.3)
```

### 精確計數

使用模型專屬的 tokenizer：

```python
import tiktoken

# For OpenAI models
encoding = tiktoken.encoding_for_model("gpt-4")
tokens = encoding.encode("Your text here")
token_count = len(tokens)

# For Llama/Anthropic, use transformers
from transformers import AutoTokenizer
tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-2-7b")
tokens = tokenizer.encode("Your text here")
token_count = len(tokens)
```

### 成本計算

```python
def calculate_cost(input_text: str, output_text: str, model: str) -> float:
    pricing = {
        "gpt-4o": {"input": 2.50, "output": 10.00},  # per 1M tokens
        "gpt-4o-mini": {"input": 0.15, "output": 0.60},
        "claude-3.5-sonnet": {"input": 3.00, "output": 15.00},
    }
    
    encoding = tiktoken.encoding_for_model(model)
    input_tokens = len(encoding.encode(input_text))
    output_tokens = len(encoding.encode(output_text))
    
    cost = (
        (input_tokens / 1_000_000) * pricing[model]["input"] +
        (output_tokens / 1_000_000) * pricing[model]["output"]
    )
    return cost
```

---

## 常見的 Tokenization 問題 {#common-tokenization-issues}

### 問題 1：token 邊界未對齊

**問題：** 文字操作可能無法對齊 token 邊界。

```python
text = "Hello world"
# Tokens: ["Hello", " world"]  # Note: space is part of second token

# Truncating at character 6 ("Hello ") splits a token
```

**解決方案：** 在管理上下文時，務必在 token 邊界處截斷。

### 問題 2：tokenization 不一致

**問題：** 同一段文字會依上下文而被切成不同的 token。

```python
# GPT tokenizer example
"New York"     # Might be ["New", " York"]
"NewYork"      # Might be ["New", "York"]
" New York"    # Might be [" New", " York"]
```

**影響：** token 數量會因周圍文字而變動。務必對完整的上下文進行 tokenize。

### 問題 3：程式碼與結構化資料

**問題：** 程式碼與 JSON 常常切得很沒效率。

```python
# Python code often tokenizes poorly
"def calculate_average(numbers):"
# Becomes many tokens: ["def", " calculate", "_", "average", "(", "numbers", "):", ...]

# JSON keys tokenize individually
'{"firstName": "John"}'
# Many tokens for structure
```

**緩解方式：**
- 有些模型備有針對程式碼最佳化的 tokenizer
- 考慮在送出前先壓縮 JSON
- 在可用時採用結構化輸出模式

### 問題 4：空白字元的處理

**問題：** 不同 tokenizer 對空白字元的處理方式不一樣。

```python
# Leading spaces often become separate tokens
" Hello"  # [" ", "Hello"] or [" Hello"]

# Multiple spaces may merge or stay separate
"Hello  world"  # Behavior varies by tokenizer
```

**最佳實務：** 在 tokenize 之前先正規化空白字元。

---

## 實用的 Tokenization 模式 {#practical-tokenization-patterns}

### 模式 1：上下文視窗管理

```python
def fit_to_context(
    system_prompt: str,
    user_message: str,
    history: list[str],
    max_tokens: int = 8000,
    reserve_for_output: int = 2000
) -> str:
    encoding = tiktoken.encoding_for_model("gpt-4")
    
    available = max_tokens - reserve_for_output
    
    # System prompt always included
    tokens_used = len(encoding.encode(system_prompt))
    available -= tokens_used
    
    # User message always included
    tokens_used = len(encoding.encode(user_message))
    available -= tokens_used
    
    # Add history from most recent, drop oldest if needed
    included_history = []
    for msg in reversed(history):
        msg_tokens = len(encoding.encode(msg))
        if msg_tokens <= available:
            included_history.insert(0, msg)
            available -= msg_tokens
        else:
            break
    
    return format_prompt(system_prompt, included_history, user_message)
```

### 模式 2：在 token 邊界處分塊

```python
def chunk_at_token_boundaries(
    text: str,
    chunk_size: int = 500,
    overlap: int = 50
) -> list[str]:
    encoding = tiktoken.encoding_for_model("gpt-4")
    tokens = encoding.encode(text)
    
    chunks = []
    start = 0
    while start < len(tokens):
        end = min(start + chunk_size, len(tokens))
        chunk_tokens = tokens[start:end]
        chunk_text = encoding.decode(chunk_tokens)
        chunks.append(chunk_text)
        start = end - overlap
    
    return chunks
```

### 模式 3：token 預算分配

```python
class TokenBudget:
    def __init__(self, total: int):
        self.total = total
        self.allocated = {}
    
    def allocate(self, component: str, tokens: int) -> bool:
        used = sum(self.allocated.values())
        if used + tokens > self.total:
            return False
        self.allocated[component] = tokens
        return True
    
    def remaining(self) -> int:
        return self.total - sum(self.allocated.values())

# Usage
budget = TokenBudget(total=8000)
budget.allocate("system_prompt", 500)
budget.allocate("retrieved_context", 2000)
budget.allocate("user_message", 200)
budget.allocate("output_reserve", 2000)
# Remaining: 3300 tokens for conversation history
```

---

## 面試問題 {#interview-questions}

### Q：為什麼 GPT-4 連簡單的數字母都很吃力？

**有力的回答：**
Tokenization 把文字轉換成子詞單位，而非字元。當被問到「strawberry 裡有幾個 'r'？」時，模型看到的是像 ["str", "aw", "berry"] 這樣的 token，而不是個別的字母。

模型必須對它並未直接觀察到的 token 內部結構進行推理。這需要去記住或計算 token 的字元組成，而這是一種「湧現能力（emergent capability）」，並非總是可靠。

解決辦法是提示模型先把單字逐字拼出來，再來計數。這會迫使它產生字元層級的 token。

### Q：你會如何估算 token 數量以進行成本規劃？

**有力的回答：**
粗略估算：對英文文字，把字數乘以 1.3。

精確計數：使用模型專屬的 tokenizer。
- OpenAI：tiktoken 函式庫
- 其他：transformers 的 AutoTokenizer

重要考量：
- 非英文文字會多用 1.5 到 3 倍的 token
- 程式碼與結構化資料切得很沒效率
- 務必為輸出 token 多留預算（通常定價較高）
- 要把 system prompt 與格式相關的 token 一併算入

對於生產環境的成本估算，我會抽樣真實請求並量測實際的 token 用量，再套上安全邊際。

### Q：在不同模型之間切換 tokenizer 時會發生什麼事？

**有力的回答：**
每個模型家族都有自己的 tokenizer。你無法跨模型重用 token，因為：

1. **詞彙表不同：** 相同的 token ID 代表不同的字串
2. **合併規則不同：** 同一段文字會切得不一樣
3. **特殊 token 不同：** 對話格式各不相同

實務上的影響：
- 計數 token 時務必使用正確的 tokenizer
- 快取下來的嵌入是模型專屬的
- 提示模板需要依各模型分別調整
- 微調後的模型會沿用其基礎模型的 tokenizer

### Q：你會如何處理 RAG 分塊的 tokenization？

**有力的回答：**
關鍵考量：

1. **在 token 邊界處分塊：** 從 token 中間切開，解碼時會讓文字毀損
2. **把模板的 token 算進去：** system prompt、格式都會消耗 token
3. **預留緩衝空間：** 檢索到的區塊加上問題，必須塞得進上下文

實作做法：
```python
# Determine available tokens for chunks
available = max_context - system_prompt_tokens - question_tokens - output_reserve

# Chunk with overlap at token boundaries
chunks = chunk_at_token_boundaries(document, chunk_size=500, overlap=50)

# Select chunks until budget exhausted
selected = []
tokens_used = 0
for chunk in ranked_chunks:
    chunk_tokens = count_tokens(chunk)
    if tokens_used + chunk_tokens <= available:
        selected.append(chunk)
        tokens_used += chunk_tokens
```

---

## 參考資料 {#references}

- Sennrich et al. "Neural Machine Translation of Rare Words with Subword Units"（BPE, 2016）
- Wu et al. "Google's Neural Machine Translation System"（WordPiece, 2016）
- Kudo and Richardson "SentencePiece: A simple and language independent subword tokenizer"（2018）
- OpenAI tiktoken 函式庫：https://github.com/openai/tiktoken
- HuggingFace tokenizers：https://github.com/huggingface/tokenizers

---

*上一篇：[LLM 內部運作](01-llm-internals.md) | 下一篇：[注意力機制](03-attention-mechanisms.md)*
