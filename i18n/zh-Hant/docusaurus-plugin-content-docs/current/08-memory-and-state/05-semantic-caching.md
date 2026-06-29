# 語意快取

快取已經從精確字串比對演進到**語意比對（Semantic Matching）**。語意快取藉由重複使用「等價」查詢的回應結果，將成本降低 **30-70%**，並把延遲從數秒縮短到數毫秒。

## 目錄

- [精確快取 vs. 語意快取](#vs)
- [語意比對管線](#pipeline)
- [RedisVL 與 GPTCache](#tech-stack)
- [評估：命中率 vs. 幻覺漂移](#eval)
- [多模態語意快取](#multimodal)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 精確快取 vs. 語意快取 {#vs}

| 特性 | 精確快取（Redis/Memcached） | 語意快取（RedisVL/Qdrant） |
|---------|-------------------------------|---------------------------------|
| **鍵（Key）** | 雜湊過的查詢字串 | 查詢的嵌入向量 |
| **比對**| 100% 字串完全相同 | Cosine 相似度 > 閾值 |
| **效率**| 低（微小的錯字就會讓快取失效） | 高（理解意圖） |
| **風險** | 零 | 語意漂移（回傳錯誤答案） |

---

## 語意比對管線 {#pipeline}

1. **嵌入（Embed）**：將進來的查詢轉換成向量（例如使用 `text-embedding-3-small`）。
2. **搜尋（Search）**：在快取中搜尋最近鄰。
3. **閾值檢查（Threshold Check）**：若 `distance < 0.05`（非常相似），就回傳快取的結果。
4. **LLM 驗證**：對於高風險查詢，由一個極小的「驗證模型（Verifier Model）」（例如 GPT-5.5-mini、Claude Haiku 4.5）檢查快取的回應是否真的能回答新的查詢。
5. **更新（Update）**：若沒有命中，就呼叫 LLM 並把新的結果存進向量快取。

---

## RedisVL 與 GPTCache {#tech-stack}

標準技術堆疊：
- **RedisVL**：直接在 Redis 實例內提供低延遲的向量搜尋。
- **混合快取（Hybrid Caching）**：使用 Redis 同時存放中繼資料（鍵）與向量酬載。
- **TTL**：語意快取應該設定 TTL（存活時間，Time-To-Live）。常見的做法是**動態 TTL（Dynamic TTL）**：熱門答案存活較久，而「過時」的資訊則會被定期淘汰。

---

## 多模態語意快取 {#multimodal}

有了原生多模態的前沿模型（Gemini 3.1 Pro、GPT-5.5、Claude Opus 4.7），我們現在也能快取**圖片與音訊查詢**。
- **視覺相似度（Visual Similarity）**：如果先前曾處理過語意上相似的圖片，就快取該圖片的描述。
- **音訊指紋（Audio Fingerprinting）**：為相似的語音指令快取其轉錄文字。

---

## 面試問題 {#interview-questions}

### Q：什麼是快取中的「語意漂移（Semantic Drift）」？你如何預防它？

**理想答案：**
當相似度閾值設定得太寬鬆時（例如設成 0.8 而不是 0.95），就會發生語意漂移。像 *"How do I fix my car?"*（我要怎麼修車？）這樣的查詢，可能會比對到 *"How do I wash my car?"*（我要怎麼洗車？）的快取回應。為了預防這種情況，我們使用**多階段驗證（Multi-Stage Validation）**：1) 向量相似度檢查、2) **實體比對檢查（Entity-Match check）**（確保兩個查詢都涉及「Car」以及相同的「動詞」）、3) **閾值收緊（Threshold Tightening）**：對於技術或醫療類查詢，我們要求相似度 $>0.98$ 才會回傳快取結果。

### Q：為什麼在低流量時，語意快取有時反而*比*直接呼叫 LLM 還要貴？

**理想答案：**
因為語意快取本身需要一次自己的**嵌入 API 呼叫**以及一次**向量搜尋查詢**。如果嵌入模型要花 $0.02、搜尋要花 100ms，而你的主要 LLM 呼叫只要 $0.05、花 500ms，那麼相對的節省幅度就很小。語意快取只有在**高規模（High Scale）**（數百萬次請求）下才會成為顯著的優勢，此時快取命中率高到足以抵銷「嵌入稅（Embedding Tax）」，並大幅降低整體的延遲。

---

## 參考資料 {#references}
- Redis. "RedisVL: Python Client for Redis Vector Library" (2025)
- Akiba et al. "GPTCache: A Library for Creating Semantic Cache" (2024/2025)
- Google Cloud. "Generative AI Caching Patterns" (2025)

---

*下一篇：[狀態管理模式](06-state-management-patterns.md)*
