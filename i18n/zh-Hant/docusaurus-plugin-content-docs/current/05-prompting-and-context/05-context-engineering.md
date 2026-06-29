# 上下文工程

上下文工程是一門科學，目的是用最有價值的 token 填滿 LLM 有限的「工作記憶」。隨著上下文視窗現在已達到 1M 以上的 token（Claude Sonnet 4.6、Gemini 3.1 Pro、GPT-5.5），而且模型也具備了 Extended Thinking 能力，重點已經從「塞進資料」轉移到「排序相關性」與「管理運算預算」。

## 目錄

- [長上下文範式（1M 以上 Token）](#long-context)
- [代理式上下文工程](#agentic-context-engineering)
- [Extended Thinking 與 Budget Tokens](#extended-thinking)
- [Lost-in-the-Middle](#lost-in-the-middle)
- [上下文預算與 Token 意識](#budgeting)
- [Prompt Caching 經濟學](#prompt-caching)
- [上下文壓縮（RAD-L）](#compression)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 長上下文範式（1M 以上 Token） {#long-context}

像 Gemini 3.1 Pro（1M）、Claude Sonnet 4.6（1M）、Claude Opus 4.7（1M）以及 GPT-5.5（1M）這類模型，都具備極為龐大的上下文視窗。

**洞見**：「上下文就是新的 RAG。」
對於少於 100,000 份文件的資料集，把整個資料集放進上下文視窗，往往比使用外部向量資料庫更準確、也更快速。這稱為 **「In-Context RAG」**。

---

## 代理式上下文工程 {#agentic-context-engineering}

提示工程寫的是一條好指令。**上下文工程**則策劃模型在代理迴圈的**每一次推論回合**所看到的完整 token 集合：系統提示、工具、檢索到的資料、先前的工具結果，以及持續累積的訊息歷史。這個區別之所以重要，是因為代理會一回合接一回合地累積上下文，所以策劃的問題是持續性的，而非一次性的。這正是 Anthropic、OpenAI 與 Google 現在用來打造其代理框架的基本架構。

### Context Rot：為何上下文是有限資源

1M token 的視窗，不代表你就應該把它填滿。模型會出現 **context rot（上下文腐化）**：隨著 token 數量增加，準確度會下降，因為注意力會以 n 平方的兩兩關係成長，而且訓練資料偏向較短的序列。請把上下文當成一個邊際效益遞減的預算，而不是免費空間。任務的目標是保留**訊號最高、數量最少的 token 集合**，同時仍然能讓模型正確行動。

### 五大核心技巧

| 技巧 | 作用 | 使用時機 |
|-----------|--------------|----------|
| **Compaction（壓縮整併）** | 摘要訊息歷史，並以壓縮後的摘要加上最近期的少數產出物，重新初始化迴圈 | 接近視窗上限的長時間來回對話 |
| **Just-in-time loading（即時載入）** | 在上下文中保留輕量的識別符（檔案路徑、URL、列 ID），需要時再透過工具按需載入完整內容 | 無法全部塞入的大型語料庫或資料庫、探索式任務 |
| **Structured note-taking（結構化筆記）** | 代理把進度筆記寫到視窗外的檔案或記憶儲存，之後再讀回 | 跨越數十次工具呼叫的長時程任務 |
| **Sub-agent isolation（子代理隔離）** | 為某個子任務生成一個專注的子代理，配給它一個乾淨的視窗；它只回傳 1k 到 2k token 的摘要 | 平行研究、深度搜尋，以及任何會用中間細節淹沒主視窗的工作 |
| **System prompt calibration（系統提示校準）** | 瞄準「金髮女孩區間（Goldilocks zone）」：具體到足夠可靠，又泛用到不會過於脆弱；使用清楚的 XML 或 Markdown 區段 | 永遠都要，這是支撐其他四項的基礎 |

### Compaction

當歷史變得龐大時，把它傳回給模型做摘要，保留承載重點的細節（架構決策、未解決的 bug、關鍵限制），並捨棄多餘的工具輸出。Claude Code 就採用這個模式：它以壓縮後的摘要加上最近存取的檔案來繼續運作。**先針對召回率（recall）調校**（保留所有重要的內容），接著再改善精確率（precision）（刪掉多餘的部分）。

### Just-in-Time Loading

代理不會預先載入每一份文件，而是持有參照，只在某個步驟需要時才取得內容。這就像人類從檔案樹工作的方式：你只打開需要的檔案，而不是整個 repo。這讓視窗保持精簡，並讓代理透過探索來發現結構。它的取捨在於延遲，所以混合做法（預先載入明顯需要的部分，其餘按需取得）往往是最佳解。

### Structured Note-Taking（代理式記憶）

代理把筆記持久化到上下文視窗之外，並在相關時再拉回視窗內。這正是讓代理能在一個遠超過其視窗長度的任務中維持連貫性的關鍵。關於儲存底層（檔案系統、向量、圖），請參閱 [代理記憶與狀態](../07-agentic-systems/05-agent-memory-and-state.md) 與 [記憶架構](../08-memory-and-state/01-memory-architectures.md)。

### Sub-Agent Isolation

協調者把一個專注的子任務委派給子代理，子代理在自己乾淨的視窗中工作，並回傳一份精煉的摘要。詳細的搜尋或分析上下文，永遠不會污染協調者的視窗。這正是多代理系統能運作的上下文管理理由，與任何平行化帶來的好處是分開的。請參閱 [多代理編排](../07-agentic-systems/04-multi-agent-orchestration.md)。

---

## Extended Thinking 與 Budget Tokens {#extended-thinking}

數個前沿模型現在都提供在生成回應之前進行**可控的內部推理**：

### Claude（Sonnet 4.6、Opus 4.7）：Extended Thinking

```python
response = client.messages.create(
    model="claude-3-7-sonnet-20250219",
    max_tokens=16000,
    thinking={
        "type": "enabled",
        "budget_tokens": 10000  # max internal reasoning tokens
    },
    messages=[{"role": "user", "content": "Refactor this codebase to be async..."}]
)

# Response has two blocks:
# 1. thinking block (visible for debug, not shown to user)
# 2. text block (the actual answer)
for block in response.content:
    if block.type == "thinking":
        print("[THINKING]", block.thinking)
    elif block.type == "text":
        print("[ANSWER]", block.text)
```

**關鍵參數：**
- `budget_tokens`：1,024 → 100,000。數值越高 = 準確度越好、成本越高。
- 思考 token 以標準費率計費。10K 的思考預算 = 每次請求增加 +$0.15。
- 串流可運作，思考區塊會在文字之前串流輸出。

### o3（OpenAI）— Reasoning Effort

```python
response = client.chat.completions.create(
    model="o3",
    reasoning_effort="medium",  # "low" | "medium" | "high"
    messages=[{"role": "user", "content": "Prove P=NP or disprove it."}]
)
# Reasoning tokens are invisible — o3 never exposes its internal chain
```

**Effort 等級對比成本（約略）：**
| Effort | 速度 | 成本倍數 | 最適合 |
|--------|-------|-----------------|----------|
| low | 快 | 1x | 簡單邏輯、快速查詢 |
| medium | 中等 | 3-5x | 編寫程式、分析 |
| high | 慢 | 8-20x | 博士級問題、ARC-AGI |

### 何時該啟用 Thinking / Reasoning

| 條件 | 建議 |
|-----------|----------------|
| 複雜的多步驟程式碼重構 | ✅ 啟用（預算：8K-20K） |
| 簡單問答 / 抽取 | ❌ 停用，會增加成本與延遲 |
| STEM / 數學問題 | ✅ 啟用（o3-mini medium） |
| 大量請求的聊天機器人 | ❌ 停用，使用標準模式 |
| 安全關鍵的決策 | ✅ 啟用，額外的推理能抓出邊界情況 |

**生產環境模式**：使用一個複雜度分類器來把關 Extended Thinking。若查詢的複雜度分數低於 0.5，就完全跳過思考模式（在推理密集的工作負載上可省下 60-80%）。

```python
def smart_generate(query: str) -> str:
    complexity = classifier.predict(query)  # 0-1 score
    
    if complexity > 0.7:
        # Enable Extended Thinking for hard problems
        return claude_with_thinking(query, budget_tokens=8000)
    else:
        # Standard fast mode for simple tasks
        return claude_standard(query)
```

---

## Lost-in-the-Middle {#lost-in-the-middle}

在 2023 年，模型對於位於提示中間的資訊會喪失準確度。
**現況**：前沿模型（Claude Sonnet 4.6、Claude Opus 4.7、Gemini 3.1 Pro、GPT-5.5）表現顯著更好，但 **注意力梯度（Attention Gradient）** 仍然存在。
- **最佳實務**：把關鍵指令與黃金標準範例放在提示的**最開頭**與**最結尾**。中間 = 原始資料 / 知識區塊。
- **使用區塊排序**：對檢索到的文件做重排序，讓最相關的文件位於最前與最後。

---

## 上下文預算與 Token 意識 {#budgeting}

每一個 token 都要花錢，並會增加 TTFT（Time to First Token，首個 Token 的時間）。

| 元件 | 預算（Token） | 為什麼？ |
|-----------|-----------------|------|
| **系統提示** | 500 - 1,000 | 核心邏輯與人設。 |
| **歷史** | 2,000 - 5,000 | 對話的「狀態」。 |
| **資料 / 搜尋** | 10k - 1M | 取決於任務深度。 |
| **輸出保留**| 1,000 - 4,000 | 必須為推理保留空間。 |

---

## Prompt Caching 經濟學 {#prompt-caching}

幾乎所有主要供應商（OpenAI、DeepSeek、Anthropic、Google）都支援 **前綴快取（Prefix Caching）**。

- **交叉點**：如果你重複使用一段 100k token 的上下文（例如一個程式碼庫）超過 2 次請求，快取折扣實際上會讓它比 RAG 更便宜。
- **快取命中（Cache Hits）**：$0.05 / 1M tokens。
- **快取未命中（Cache Misses）**：$5.00 / 1M tokens。

**架構選擇**：設計你的系統，讓「系統提示 + 基礎知識」保持靜態，以維持 100% 的快取命中率。

---

## 上下文壓縮（RAD-L） {#compression}

對於極長的上下文（10M 以上），我們使用 **推理感知刪除（Reasoning-Aware Deletion，RAD-L）**。
- **做法**：一個極小的輔助模型（0.1B）掃描文字，並在提示送往龐大的前沿模型*之前*，移除「填充」字詞、常見的語言模式以及不相關的段落。
- **好處**：把提示大小縮減 20-50%，準確度下降幅度小於 1%。

---

## 面試問題 {#interview-questions}

### Q：你會在什麼時候選擇 Long Context 而非 RAG？

**有力的回答：**
當高保真度檢索與跨文件推理至關重要時，我會選擇 Long Context。RAG 會受到「檢索缺口（Retrieval Gap）」之苦，如果你的向量搜尋漏掉了相關區塊，模型就永遠看不到它。Long Context（最高 2M token）提供 100% 的召回率。具體來說，我會把它用於程式碼庫分析、法律文件審查，以及多檔案的財務稽核。對於動態的網路規模資料，或超出任何上下文視窗的十億份文件資料集，我則會堅持使用 RAG。

### Q：你如何處理百萬 token 提示所伴隨的高 TTFT？

**有力的回答：**
主要的解法是 **上下文快取（Context Caching）**。透過把沉重的文件快取在 GPU 叢集上，模型就不必為每一回合「重新讀取」（prefill）整個 1M token。已快取提示的 TTFT，幾乎和 1k token 提示一樣。此外，對於未快取的請求，我會使用 **串流預填（Streaming Prefill）**，讓模型在仍在處理龐大上下文後半段的同時，先生成一段初步摘要或「思考」。

### Q：一個代理在短任務上運作良好，但在長時間執行的任務上會退化。你會如何修正？

**有力的回答：**
這是 **context rot**：視窗被陳舊的工具輸出填滿，模型因而失去脈絡。我會套用代理式上下文工程。首先，**compaction**：在達到某個門檻時摘要歷史，並從摘要加上最近期的產出物繼續。其次，**just-in-time loading**：持有檔案路徑與 ID，而非完整內容，並按需取得。第三，**structured note-taking**：讓代理把進度寫到一個可以重新讀回的暫存檔，這樣工作記憶就能保持精簡。對於那些會產生大量中間細節的子任務（深度搜尋、多檔案分析），我會使用 **sub-agent isolation**，讓那些細節以一份簡短摘要的形式回傳，而不是淹沒主視窗。目標是每一回合都使用訊號最高、數量最少的 token 集合，而非最龐大的集合。

---

## 參考資料 {#references}
- Liu et al. "Lost in the Middle" (2023/2024 update)
- [Anthropic. "Effective context engineering for AI agents" (2025)](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Anthropic. "Effective harnesses for long-running agents" (2026)](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- Anthropic. "Extended Thinking: Technical Guide": https://docs.anthropic.com/
- OpenAI. "o3 and o3-mini System Card" (2025)

---

*下一篇：[結構化生成](06-structured-generation.md)*
