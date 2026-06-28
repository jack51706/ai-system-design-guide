# 長期記憶

長期記憶（L2 與 L3）提供跨工作階段的持久性。生產環境的技術堆疊已經從簡單的「History RAG」轉向**多重表示儲存（Multi-Representation Stores）**，結合了 Vector、Graph 與 Relational 資料。專屬的記憶服務（Zep、Mem0、Letta、Cognee）現在會在這些儲存之上加上封裝，開箱即提供對話摘要、實體擷取與時間感知能力。

## 目錄

- [情節記憶（敘事）](#episodic)
- [語意記憶（知識）](#semantic)
- [混合式 Vector-Graph 儲存](#hybrid)
- [記憶修剪與衰減](#pruning)
- [隱私與多租戶](#privacy)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 情節記憶：個人日誌

情節記憶儲存的是**軌跡（Trajectories）**：事件序列以及其結果。
- **資料結構**：`(Timestamp, Interaction_ID, Trajectory_Summary, Embedding)`。
- **背後原理**：如果一個代理上個月曾經用某個特定的工具序列成功建好了一個 React 元件，那麼今天當被要求再建一個時，它應該要能「回想（Recall）」起那次成功的經驗。
- **實作備註**：我們把*摘要（Summary）*存起來供檢索使用，並把*原始日誌（Raw Logs）*放在冷儲存（S3/GCS）中供鑑識分析使用。

---

## 語意記憶：事實儲存

語意記憶儲存的是關於實體的**已發現事實（Discovered Facts）**。
- **實體識別**：使用「事實擷取代理（Fact Extraction Agent）」來剖析使用者的每一個回合。
- **三元組範例**：
  - `(User_1, HAS_PREFERENCE, Dark_Mode)`
  - `(Company_X, USES_SDK, Stripe)`
- **技術**：知識圖譜（Neo4j、AWS Neptune）結合關聯式標記。

---

## 混合式 Vector-Graph 儲存

資深（Staff）等級的工程師會使用 **GraphRAG 風格的記憶**。
- **Vector 搜尋**找出「相關（Related）」的節點。
- **Graph 遍歷**找出「連結（Connected）」的節點。
- **優勢所在**：如果我搜尋「Project Alpha」，vector 搜尋找到的是這個名稱，但 graph 遍歷則能找出那 10 位開發者、截止日期，以及連結的程式碼儲存庫。

---

## 記憶修剪與衰減

如果記憶毫無節制地增長，它就是一種負擔。
- **時間衰減（Temporal Decay）**：較舊的記憶若沒有被頻繁存取，其「相關性分數」就會降低。
- **整併（Consolidation）**：把 10 次各自獨立、關於「帳務（billing）」的互動合併成一個高品質的摘要節點。
- **明確遺忘（Explicit Forgetting）**：透過刪除與某個使用者 ID 相關聯的所有情節與語意叢集，來落實 GDPR 的「被遺忘權（Right to be Forgotten）」。

---

## 隱私與多租戶

> [!CAUTION]
> **跨工作階段洩漏（Cross-Session Leakage）**是全域記憶中排名第一的安全風險。
> 請確保 `user_id` 在你的向量資料庫 metadata 中是一個硬性的分區鍵（hard partition key）。絕對不要依賴 LLM 來依使用者過濾結果。

---

## 面試問題

### Q：對於長期記憶，你會如何在向量資料庫與知識圖譜之間做選擇？

**好的回答：**
我會用**向量資料庫**來處理**情節脈絡（Episodic Context）**（非結構化日誌、過往對話），因為我需要對「意義」做「模糊（Fuzzy）」比對。我會用**知識圖譜**來處理**結構化語意知識（Structural Semantic Knowledge）**（關係、屬性、階層），因為我需要「確定性（Deterministic）」的遍歷。一個生產系統會採用**混合式（Hybrid）**做法：向量索引指向 graph 的 ID，讓系統能先找到正確的「起始節點（Starting Node）」，接著再遍歷以取得高精確度的脈絡。

### Q：在習得式代理記憶（learned agentic memory）的脈絡下，「災難性遺忘（Catastrophic Forgetting）」是什麼？

**好的回答：**
在經過微調的代理中，災難性遺忘發生在新的訓練資料抹除掉舊知識的時候。在**代理式記憶（基於 RAG）**中，它指的是**索引超載（Index Overload）**。如果一個代理把 1,000 個低品質的新「事實」加進它的記憶裡，檢索精確度就會下降，等同於讓它「遺忘」掉那些較舊、品質較高的事實，因為它們被埋沒在雜訊之中。我們用**品質加權檢索（Quality-Weighted Retrieval）**來緩解這個問題：擁有來自監督者高「驗證分數（Verification Scores）」的記憶，會比原始日誌獲得更高的權重提升。

---

## 參考資料
- Neo4j. "Knowledge Graphs for Generative AI" (2025)
- Pinecone. "The Managed Memory Layer" (2025)
- GraphRAG. "Reasoning over Relationships" (2024/2025)

---

*下一篇：[使用 Mem0 的代理式記憶](04-agentic-memory-mem0.md)*
