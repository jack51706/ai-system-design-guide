# 記憶體架構

LLM 記憶體已從「歷史緩衝區」演進為**三層認知架構（Three-Tiered Cognitive Architecture）**。這套階層模仿人類的認知系統（L1-L3），用以在速度、成本與回想能力之間取得平衡。如今的生產環境代理技術堆疊，多半倚賴向量儲存之上的專屬記憶層（Mem0、Zep、Letta、Cognee），而非自行打造。

## 目錄

- [三層階層架構](#hierarchy)
- [第一層：工作記憶（上下文）](#tier-1)
- [第二層：情節記憶（事件）](#tier-2)
- [第三層：語意記憶（知識）](#tier-3)
- [記憶整合模式](#consolidation)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 三層階層架構

| 層級 | 類型 | 人類類比 | 技術 | 延遲 |
|------|------|---------------|------------|---------|
| **L1** | 工作記憶 | 當下的專注焦點 | 上下文視窗 / KV Cache | <50ms |
| **L2** | 情節記憶 | 過往的經驗 | 向量資料庫 / 本地圖譜 | 100-300ms |
| **L3** | 語意記憶 | 通用知識 | 全域圖譜 / SQL / Mem0 | >500ms |

---

## 第一層：工作記憶（L1）

L1 是模型的**主動專注焦點**。
- **上下文視窗**：在當前的前沿模型上為 128K 至 2M tokens（Claude Opus 4.7、Claude Sonnet 4.6、GPT-5.5、Gemini 3.1 Pro）。
- **KV Cache**：用於儲存預先計算之鍵（key）與值（value）的 GPU「RAM」。
- **管理策略**：**滑動視窗（Sliding Windows）**與**前綴快取（Prefix Caching）**（vLLM/PagedAttention）。
- **冗餘說明**：我們只在 L1 中保留最近的對話輪次與關鍵的系統指令。

---

## 第二層：情節記憶（L2）

L2 儲存的是本次工作階段，或過去與此使用者互動時「先前發生了什麼」。
- **儲存**：向量資料庫（Pinecone、Weaviate、Qdrant）。
- **檢索**：語意搜尋。如果使用者問「我們上週二聊了什麼？」，由 L2 提供答案。
- **模式**：**經驗回放（Experience Replay）**。代理會檢索過去成功的軌跡，以引導當前的決策。

---

## 第三層：語意記憶（L3）

L3 儲存**不可變的事實**與**習得的規則**。
- **知識圖譜**：儲存各種關係（例如 `User` -- `WORKS_FOR` --> `Company_X`）。
- **Mem0**：一項受管服務，可抽取事實（例如「使用者喜歡深色模式」）並使其在全域範圍內可被取用。
- **真值錨定（Truth Anchoring）**：當 L1 與 L2 提供互相矛盾的資訊時，L3 扮演「真實依據（Ground Truth）」的角色。

---

## 記憶整合模式

記憶會透過**整合（Consolidation）**在各層級之間移動：
1. **抽取（Extraction）**：在工作階段結束時，由一個 LLM「審閱者（Reviewer）」從 L1 中抽取事實。
2. **建立索引（Indexing）**：事實被儲存到 L2（作為向量）與 L3（作為圖譜節點）。
3. **衰減（Decay）**：陳舊且未被強化的記憶會從 L2 移至冷儲存（L3）或予以刪除。

---

## 面試問題

### 問：為什麼不直接用一個 2M token 的上下文視窗來容納所有記憶（L1-L3）？

**理想答案：**
雖然技術上可行，但這在**經濟與認知層面都缺乏效率**。
1. **成本**：每一輪都用 1M 以上 tokens 去呼叫模型，成本遠高於以 RAG 回想出的上下文進行的 10K token 呼叫。
2. **注意力稀釋**：即使是「長上下文（Long Context）」模型，「中間迷失（Lost in the Middle）」仍是一項因素。如果上下文被無關的歷史對話塞滿，模型在*當前*任務上的推理能力會下降。
3. **延遲**：由於需要載入 KV cache，TTFT（Time to First Token，首個 token 產生時間）會隨上下文大小而增加。
一個資深（staff-level）等級的架構會運用**策略性檢索（Strategic Retrieval）**，讓上下文視窗保持精簡且聚焦。

### 問：你如何處理第三層（全域語意記憶）中的「隱私外洩（Privacy Leakage）」？

**理想答案：**
第三層（語意記憶）必須**依命名空間進行分片（Sharded by Namespace）**。每個使用者或組織在向量資料庫與知識圖譜中都會取得一個唯一的 `namespace_id`。我們在資料庫層實作 **RLS（Row Level Security，列級安全性）**。此外，我們在整合步驟期間使用一個 **PII 清洗層（PII-Scrubbing Layer）**，以確保敏感資料（密碼、PII）絕不會從暫時性的 L1 上下文移動到持久化的 L3 知識儲存中。

---

## 參考資料
- Pack et al. "Generative Agents" (2023/2025 Context)
- OpenAI. "Context Window Optimization" (2025)
- Mem0 Documentation. "Dynamic Memory Management" (2025)

---

*下一篇：[短期上下文管理](02-short-term-context.md)*
