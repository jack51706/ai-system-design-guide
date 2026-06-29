# 代理記憶與狀態

記憶是讓代理能夠隨時間學習並維持上下文的關鍵。代理記憶已經從「聊天歷史」成熟為一套**多層認知架構**，包含四個具名層級（工作記憶、情節記憶、語意記憶、程序記憶），每一層都有自己的寫入模式、延遲預算與失效模式。生產環境系統（Mem0、Letta、Anthropic Memory Tool + Skills、Zep/Graphiti、LangMem）如今已把記憶選型視為一等公民等級的架構決策。

形塑本章內容的 2026 研究浪潮包括：A-MEM（NeurIPS 2025）、HippoRAG（多跳圖檢索）、多層記憶架構（Multi-Layered Memory Architectures）、HaluMem（操作層級的記憶幻覺基準測試）、MINJA / MemoryGraft（僅靠查詢即可進行的記憶投毒攻擊），以及 TTT-E2E（一項橫跨 Stanford、Berkeley、UCSD、NVIDIA 與 Astera 的多實驗室合作專案），這是一種把上下文壓縮進權重的測試時訓練（test-time-training）方法。

## 目錄

- [記憶層級結構](#hierarchy)
- [短期：推理軌跡](#short-term)
- [情節記憶：過往經驗](#episodic)
- [語意記憶：人格](#semantic)
- [程序記憶：習得的技能與工作流程](#procedural-memory-learned-skills-and-workflows)
- [權衡取捨：事實 X 該放哪裡？](#tradeoffs)
- [生產環境實作（2026 年 5 月）](#production-implementations)
- [失效模式與緩解措施](#failure-modes)
- [Mem0 與個人化](#mem0)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 記憶層級結構 {#hierarchy}

代理採用分層的儲存方式：

| 層級 | 類型 | 技術 | 用途 |
|------|------|------------|---------|
| **L1** | 工作記憶 | 上下文視窗 / KV Cache | 當前任務步驟、區域變數 |
| **L2** | 情節記憶 | 向量資料庫 / 圖 | 「我上次做了什麼？」 |
| **L3** | 語意記憶 | SQL / 知識圖 | 使用者偏好，「真理」 |
| **L4** | 程序記憶 | 技能登錄表 / 工具政策 / 工作流程圖 | 「我該怎麼執行這項任務？」 |

### 各層級的實務特性

各層級的差異不只在用途。讀取模式、寫入模式、延遲預算與新鮮度期望，各自都會推向不同的儲存技術：

| 維度 | L1 工作記憶 | L2 情節記憶 | L3 語意記憶 | L4 程序記憶 |
|---|---|---|---|---|
| **存放什麼** | 當前回合、工具輸出、暫存區（scratchpad）、系統提示 | 過往會話、軌跡、帶時間戳的觀察 | 蒸餾後的事實、偏好、實體關係 | 技能、操作手冊（playbook）、系統提示指令、程式碼/工具序列 |
| **讀取模式** | 每個 token、每個回合（在注意力內） | 依相似度 + 近期性 + 重要性取 top-k | 提及實體/主題時觸發查找 | 比對到符合的任務簽章時載入 |
| **寫入模式** | 由推論引擎連續追加；KV-cache 變動 | 僅追加日誌；在回合邊界提交 | 抽取、去重、upsert；寫入時解決衝突 | 在成功/失敗後反思式寫入；明確的人工或自我編輯 |
| **延遲預算** | <50ms（常駐於 GPU HBM） | 100-300ms（向量 ANN + 重排序） | 200-800ms（圖遍歷 + LLM 抽取） | 50-500ms（讀檔或小型索引查找） |
| **新鮮度期望** | token 級新鮮；會話結束即遺失 | 數小時到數月；可容忍陳舊 | 應反映*當前*狀態；陳舊即為錯誤 | 變動緩慢；更新是刻意為之 |
| **儲存技術** | HBM 中的 KV cache（vLLM PagedAttention 區塊） | 向量資料庫（Pinecone、Weaviate、Qdrant）、僅追加日誌 | 知識圖（Neo4j、Graphiti）、KV 儲存、雙時態關聯式資料列 | 檔案系統（Claude `/memories/`、以 `SKILL.md` 形式的 Skills）、提示登錄表、微調後的 LoRA |
| **查詢語意** | 位置 + 注意力 | 相似度 + 近期性 + 重要性（Park 等人的加權法） | 實體關係比對、結構化查詢、雙時態過濾 | 任務簽章比對，通常是檔名或標籤查找 |
| **逐出策略** | 滑動視窗、依 KV 區塊雜湊做 LRU | 衰減評分、整併進 L3、歸檔至冷儲存 | 透過時態 `valid_to` 取代；為 GDPR 進行明確刪除 | 人工棄用、與較新技能做 A/B、版本鎖定 |

**這在實務上的意義：**當一個事實抵達時，架構問題不是「我們該不該記住它？」，而是「*該放在哪一層*、用什麼新鮮度契約、用什麼逐出規則？」選錯層級會產生可預測的失效模式（一個會話內的偏好被晉升到 L3，就會跨會話外洩；一個穩定的使用者事實被留在 L2，兩週內就會被逐出）。請見下方的[權衡取捨：事實 X 該放哪裡？](#tradeoffs)。

---

## 短期：推理軌跡 {#short-term}

生產環境代理不再只儲存「訊息（Messages）」；它們儲存的是**狀態物件（State Object）**。
- **暫存區（Scratchpad）**：提示中專屬的一個區段，代理在其中為自己「寫筆記」，這些內容不會顯示給使用者。
- **KV Cache 分塊（Tiling）**：對於長時間運作的代理，我們使用**前綴快取（Prefix Caching）**，把「系統指令」與「標準工具」保持在 GPU 記憶體中的熱狀態，只替換動態的任務狀態。

---

## 情節記憶：過往經驗 {#episodic}

情節記憶儲存的是「執行（Runs）」或「軌跡（Trajectories）」。
- 如果某個代理上週二抓取某個網站失敗了，情節記憶應該要能防止它今天再次嘗試同一個會失敗的選擇器（selector）。
- **模式**：當一項任務完成時，總結出「經驗教訓（Lessons Learned）」並把它們存進向量資料庫。在新任務開始時，執行一次**自我搜尋（Self-Search）**，尋找類似的先前任務。

---

## 語意記憶：人格 {#semantic}

語意記憶儲存關於使用者或環境的「事實（Facts）」。
- *「使用者偏好 JSON 輸出。」*
- *「生產環境資料庫在凌晨 3 點到 4 點之間離線。」*

**最佳實務**：語意記憶請使用**知識圖（Knowledge Graph）**。與向量搜尋（模糊的）不同，圖能對實體與關係提供確定性的檢索（例如 `User` -- `OWNER_OF` --> `Project_A`）。

---

## 程序記憶：習得的技能與工作流程 {#procedural-memory-learned-skills-and-workflows}

程序記憶儲存的是「如何做事」。情節記憶回答的是「之前發生了什麼？」，語意記憶回答的是「什麼是真的？」，而程序記憶回答的是：

「完成這類任務的正確流程是什麼？」

這一層捕捉的是可重複使用的技能、工具使用模式、操作程序，以及工作流程偏好。

範例：

* 「產生週報時，先從 Snowflake 拉取指標，接著對照儀表板驗證，然後總結異常。」
* 「回應客訴時，先分類緊急程度，檢索政策，草擬回覆，若信心不足則升級。」
* 「撰寫 SQL 時，務必先檢視 schema，產生查詢，執行驗證，並說明假設。」

程序記憶對代理式系統特別重要，因為許多任務並不只是關於記住事實。它們需要遵循正確的動作序列。

---

## 權衡取捨：事實 X 該放哪裡？ {#tradeoffs}

第一順位的決策不是「哪一層」，而是*「誰來承擔出錯的代價？」*。L2 漏掉一次檢索，只會搞砸一個回合。L3 裡的一個壞事實，會搞砸*每一個*回合，直到被修正為止。L4 裡一個被投毒的技能，會傳播到未來每一次調用。

### 層級選擇表

| 事實 / 考量 | 層級 | 理由 |
|---|---|---|
| 「使用者的 API 速率限制是 1000 req/min」 | L3，搭配雙時態 `valid_to` | 租戶範圍的事實；可依實體查詢；必須支援取代。不放 L4，因為這是資料，不是程序。 |
| 「部署我們服務的步驟」 | L4，作為帶版本的技能 | 帶條件分支的多步驟流程。技能可組合；語意三元組則不行。 |
| 「代理上次嘗試這項任務的失敗紀錄」 | L2 原始紀錄，*接著*若可一般化則把教訓反思進 L4 | 原始軌跡屬於情節記憶；一般化後的教訓（「絕不在尖峰時段執行遷移」）值得用 Reflexion 風格寫入 L4。 |
| 「使用者偏好簡潔的回覆」 | L3 | 穩定的偏好，可依 `user_id` 查詢，單一三元組。 |
| 「使用者*在這次對話中*要求簡潔的回覆」 | 僅 L1 | 會話範圍；不要用可能是暫時性的偏好污染 L3。 |
| 當前天氣、今日股價 | 無：呼叫工具 | 變動快速且真理來源在別處的事實，絕不該進入記憶。 |
| 「Project Phoenix 的團隊成員有 A、B、C」 | L3，作為圖片段 | 具多跳遍歷價值；Graphiti 或 Neo4j 風格的儲存。 |

### 成本權衡

- **L1 主導*延遲成本***：TTFT 隨上下文大小擴展；工作記憶越長，首個 token 越慢。KV-cache 壓力會把高階加速器記憶體推向飽和。
- **L2 在規模化時主導*儲存成本***：僅追加日誌會隨使用量線性增長。[第 30 天問題](https://cipherbuilds.ai/blog/day-30-agent-memory-problem)描述了未經修剪的情節儲存如何在一個月後腐蝕代理品質。
- **L3 主導*寫入放大成本***：每個回合都可能觸發抽取、去重、衝突解決。Mem0 的設計明確地以檢索速度換取寫入時的工作量。
- **L4 主導*治理成本***：一個壞技能會傳播到未來每一次調用。Anthropic 的「[Claude Dreaming](https://www.mindstudio.ai/blog/what-is-claude-dreaming-anthropic-agent-memory)」排程整併，正是透過讓技能更新通過審查來正視這一點。

### 晉級規則

有趣的設計問題是*一個 L2 情節何時晉級到 L3 或 L4*。站得住腳的規則是基於門檻的，而非隱性衰減：

1. **N 次獨立觀察**到同一模式（N=3 到 5 是典型值）。
2. 依來源做**信心加權**：使用者陳述 > 工具輸出 > 模型推斷。
3. 在整併步驟（而非每回合）進行**人工或 LLM-judge 審查**。
4. **排程批次整併**，而非同步的逐回合寫入（避免寫入放大）。
5. **雙向**：L3 中的語意事實可以為特定任務重新實例化為情節上下文。記憶不是單行道。

---

## 生產環境實作（2026 年 5 月） {#production-implementations}

這些具名系統之間的差異，較少在於「它們儲存什麼」，而更多在於*寫入紀律*、*檢索演算法*與*治理姿態*。

| 系統 | 最適場景 | 它擅長什麼 | 它的不足之處 |
|---|---|---|---|
| **[Mem0](https://github.com/mem0ai/mem0)** | 大規模的跨會話個人化 | 混合圖 + 向量 + KV。在 2026 年 4 月的單遍重新設計後，於 LoCoMo 達到 92.5、於 LongMemEval 達到 94.4（[基準測試](https://mem0.ai/blog/ai-memory-benchmarks-in-2026)）。在正面對決中以 26% 的準確度勝過 OpenAI 的內建記憶。 | 每筆記憶 8K 字元上限（不適用於文件）；雲端優先的姿態造成資料主權上的摩擦；沒有正式的信念狀態模型（只能覆寫或追加）。 |
| **[Letta（前身為 MemGPT）](https://docs.letta.com/concepts/memgpt/)** | 以連貫性為產品核心的長時間自主代理 | OS 風格的虛擬上下文分頁，橫跨核心 / 回憶 / 歸檔層；代理使用工具呼叫把資料分頁進出。當使用者體驗是「代理永遠記得」時最佳。 | 每回合延遲高於 Mem0 風格的做法。未針對跨使用者的檢索精度做最佳化。 |
| **[Anthropic Memory Tool + Skills](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool)** | 在單一基底上掛載檔案系統的 L3 與 L4 | 記憶位於 `/memories/`；Skills 以 `SKILL.md` 套件加上選用腳本的形式存在；Managed Agents 在每個會話把記憶掛載於 `/mnt/memory/`，並具備不可變版本控制（2026 年 4 月 23 日 GA）。排程的「Claude Dreaming」在會話之間進行整併。 | 檔案系統語意把複雜度推給代理（代理必須妥善建構自己的目錄結構）。 |
| **[Zep + Graphiti](https://github.com/getzep/graphiti)** | 「這件事何時變成真的？」很重要的時態事實 | 開源時態知識圖。每條邊都有 `valid_from` / `valid_to` / `invalid_at`。在 DMR 上以 94.8% 對 93.4% 勝過 MemGPT。雙時態查詢讓你能比較「我們在 3 月 12 日相信什麼？」與「現在什麼是真的？」 | 寫入路徑（圖抽取、去重、衝突解決）比純向量儲存更重。 |
| **[LangMem + LangGraph](https://langchain-ai.github.io/langmem/)** | 當你想用 LangGraph 編排來取得全部四種記憶類型時 | 支援情節、語意，*以及*程序記憶。LangMem 中的程序記憶讓代理能根據回饋更新自己的系統提示。背景抽取在帶外（out-of-band）執行。 | 與 LangGraph 耦合；若你不在 LangChain 技術棧上，吸引力較低。 |
| **[OpenAI ChatGPT Memory](https://openai.com/index/memory-and-new-controls-for-chatgpt/)** | 消費級的聊天連續性，而非生產級的代理記憶 | 雙層架構：明確的「已儲存記憶」加上預先注入上下文的輕量對話摘要。在推論時跳過一個檢索步驟以求低延遲。 | 相較 Mem0 風格的檢索會損失精度。沒有供企業整合的細粒度程式化 API。 |
| **Cursor / Windsurf** | 給軟體工程代理的、感知程式碼庫的 L2/L3 | 在開啟專案時索引程式碼庫；以 `@` 提及來提供明確的上下文。Windsurf 的「Memories」會在約 48 小時的使用中學習架構模式。 | 鎖定於程式碼領域。不是通用型的記憶層。 |
| **[Cognition Devin](https://cognition.ai/blog/devin-sonnet-4-5-lessons-and-challenges)** | 倉庫範圍的工程代理 | 倉庫 wiki 每隔數小時自動索引；偏好明確的壓縮/摘要，而非由模型管理狀態。Devin Search 是一個代理式的程式碼庫記憶查詢介面。 | 對工程工作流程有既定立場。 |

**Generative Agents（Park 等人 2023）**仍是每篇綜述都會引用的參考架構。其近期性 / 重要性 / 相關性的檢索公式（`alpha_recency * recency + alpha_importance * importance + alpha_relevance * relevance`，各項正規化到 [0,1]，重要性由 LLM 評為 1-10 分）至今仍在上述大多數系統中投入生產使用。

**值得追蹤的新興框架**（2026 年 5 月）：[Supermemory](https://supermemory.ai)、[Recallr](https://recallrai.com)、AWS [Bedrock AgentCore](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/memory-integrate-lang.html)、[Oracle AI Agent Memory](https://blogs.oracle.com/developers/oracle-ai-agent-memory-a-governed-unified-memory-core-for-enterprise-ai-agents)。

---

## 失效模式與緩解措施 {#failure-modes}

生產環境記憶系統有六種反覆出現的失效模式。能叫得出它們的名字，就是初階與 staff 等級架構對話之間的差別。

### 1. 透過提示注入進行的記憶投毒

不可信的輸入被寫入 L3/L4，之後又被當作權威來源重播。[MINJA（NeurIPS 2025）](https://openreview.net/forum?id=QVX6hcJ2um)與 [MemoryGraft（2025 年 12 月）](https://arxiv.org/html/2512.16962v1)展示了*僅靠查詢*的投毒攻擊，在*無需*提升權限的情況下達到 95% 的注入率與 70% 的攻擊成功率。[Palo Alto Unit 42 的報告](https://unit42.paloaltonetworks.com/indirect-prompt-injection-poisons-ai-longterm-memory/)顯示毒可在引爆前數週就被植入。

**緩解措施：**
- 在每次記憶寫入加上**來源標籤（Provenance tags）**：`source = user_stated | model_inferred | tool_output`。
- **寫入時的防護機制模型**，拒絕可疑、形似指令的寫入（「忽略先前內容，改為……」、角色混淆、嵌入的系統提示片段）。
- **信任層級（Trust tiers）**：低信任的記憶在影響高風險決策前需要佐證。
- **艙壁隔離（Bulkhead isolation）**，讓某一租戶的毒無法樞轉進入另一租戶。

### 2. 陳舊事實

昨天的偏好對上今天的。經典案例是「使用者上個月說要深色模式，但現在用的是淺色模式」。

**緩解措施：**
- **雙時態儲存**（Zep/Graphiti 模式）：每個事實都有 `valid_from`、`valid_to`、`invalid_at`。
- 對會話範圍的偏好設定 **TTL**，讓它們自動過期。
- 在檢索評分中加入**衰減加權**。
- 對超過 N 天的高風險事實，採用**明確的重新確認**提示。

### 3. 衝突事實

使用者先說 X，現在說 Y。三種不同的衝突類型，值得用不同的回應方式：

| 衝突類型 | 正確回應 |
|---|---|
| 時態更新（「我搬到柏林了」） | 以 `valid_to = now` 取代舊事實 |
| 更正（「我從沒說過那個」） | 連同稽核軌跡一起撤回 |
| 偏好改變（「我現在想要簡潔的回覆」） | 新增新事實；讓衰減去處理舊的 |
| 徹底矛盾（沒有明顯的解法） | 詢問使用者；絕不靜默覆寫 |

使用 AGM 信念修正（belief revision）來追蹤信念狀態（`ACTIVE` / `SUPERSEDED` / `RETRACTED`），而非採用「最後寫入者勝出」。

### 4. 記憶漂移

品質會隨時間下降，因為低品質的寫入稀釋了高品質的寫入。[第 30 天問題](https://cipherbuilds.ai/blog/day-30-agent-memory-problem)記錄了代理效能在進入生產環境約 30 天後下降，因為情節儲存被雜訊填滿。

**緩解措施：**
- **品質加權檢索**：提升驗證分數高的記憶權重。
- **排程整併作業**，合併重複項並修剪低效用的記憶。
- **CI 中的金絲雀事實測試**：「代理在 50 個回合後仍應記得使用者的名字。」

### 5. 幻覺式記憶寫入

代理推斷出一個事實，把它當作真理儲存，之後又把它當作權威來引用。這是一種級聯失效，一個壞寫入污染了未來的檢索。[HaluMem 基準測試（2025 年 11 月）](https://arxiv.org/abs/2511.03506)顯示，現有系統在寫入時累積的錯誤會向前傳播，穿過 QA 階段。

**緩解措施：**
- **由 schema 強制的記憶物件**，為 `confirmed_facts`（帶來源）與 `inferred_facts`（帶信心值）設置分開的欄位。
- 在沒有明確的使用者訊號或工具輸出佐證之前，絕不把推斷自動晉升為已確認。
- 在 CI 中採用 HaluMem 風格的分階段評估：分別測量抽取精度、更新正確性與 QA 準確度，而非把它們當作單一的端到端指標。

### 6. 跨租戶外洩

向量 ANN 回傳了來自另一租戶的鄰居；快取的提示包含了另一租戶的資料。[實地量測](https://medium.com/@isuruig/multi-tenant-ai-infrastructure-the-5-isolation-layers-that-determine-whether-your-customers-data-stays-separate-340aaeef4922)顯示，在未隔離的多租戶 RAG 中，良性查詢的自然外洩率約為 95%。

**緩解措施：**
- **實體隔離**：每租戶獨立的集合（collection），而非以中介資料過濾的共享索引。
- 透過服務帳號權限在*儲存*層強制租戶範圍，而非在應用程式碼中。
- 每租戶獨立的 KV-cache 前綴。
- 對記憶 blob 採用每租戶獨立的加密金鑰，讓跨命名空間的讀取在加密層就失敗。

---

## Mem0 與代理式個人化

**Mem0**、Zep、Letta 與 Cognee 是代理技術棧中「智慧記憶（Smart Memory）」的標準框架。
- 它會自動從對話中抽取「使用者洞察（User Insights）」。
- 它提供一個「Memory API」，代理可以呼叫它來 `remember`（記住）或 `forget`（遺忘）特定的資訊三元組。
- **影響**：代理會讓人感覺「活著」，因為它記得你三個月前在另一個會話中提過的某個細節。

---

## 面試問題 {#interview-questions}

### 問：你如何在代理式系統中處理「衝突的記憶」？

**強力的回答：**
衝突的記憶（例如使用者上週說「我喜歡藍色」但現在說「我喜歡紅色」）是透過**時態加權（Temporal Weighting）**或**明確爭議（Explicit Disputing）**來處理的。在我的架構中，我為每個記憶三元組指派一個 `timestamp` 與一個 `confidence_score`。如果新事實與舊事實衝突，代理會被提示去「解決衝突」，做法是詢問使用者以求釐清，或預設採用最近的時間戳。我們也使用**衰減函式（Decay Functions）**，讓較舊、未被強化的記憶最終從活躍索引中被修剪掉。

### 問：為什麼單靠「上下文視窗」不足以支撐 staff 等級的代理架構？

**強力的回答：**
第一，**成本與延遲**：即使有上下文快取，為每個回合填入 1M token 的上下文仍然貴得令人卻步。第二，**訊噪比**：大型上下文視窗會受「In-context Learning」退化之苦，模型會被無關的歷史回合分心。Staff 等級的架構使用**選擇性記憶檢索（Selective Memory Retrieval）**（對歷史做 RAG），只拉入最相關的 3 到 5 次歷史互動，讓推理引擎專注於當前的子目標。

### 問：你會如何為生產環境的 AI 代理設計程序記憶？

**強力的回答：**

我會把程序記憶設計成**技能登錄表、工作流程圖與工具使用政策**的組合。每個程序會定義任務類型、所需步驟、可用工具、驗證檢查、失效模式與升級規則。在每次執行之後，代理可以進行反思，若發現更好的做法就更新該程序。舉例來說，如果一個 NL2SQL 代理因為跳過 schema 檢視而反覆失敗，我們可以在所有 SQL 產生任務的程序記憶中，把 schema 檢視編碼為必要的第一步。

### 問：情節記憶在什麼時候會從資產變成負債？

**強力的回答：**

情節記憶在三種具名模式下會變成負債。第一，**索引超載**：加入 1,000 筆低品質觀察，會在檢索時把那 10 筆高品質的給淹沒。這是 RAG 意義上的災難性遺忘。第二，**第 30 天漂移模式**：代理品質在進入生產環境約 30 天後下降，因為情節儲存被檢索無法與訊號區分的雜訊填滿。第三，**陳舊上下文滲漏**：在某個配置下曾成功的過往軌跡，在新配置下會變成*錯誤*的上下文。一段成功的 Stripe 工具序列，在使用者已切換到 Adyen 時會主動造成誤導。

緩解措施是品質加權檢索、整併進 L3，以及對上下文敏感的軌跡設定硬性近期性截止。更深層的教訓是：情節記憶從第一天起就需要一套*修剪政策*。沒有它，它就是會隨使用量線性複利增長的技術債。

### 問：當代理能寫入自己的長期儲存時，你如何防止記憶投毒？

**強力的回答：**

困難之處在於，近期的攻擊（MINJA、MemoryGraft）是*僅靠查詢*的，不需要提升權限。毒會在引爆前數週就被植入。所以威脅模型是「每一個輸入都可能成為未來的權威記憶」。防禦分為四層：

1. **寫入時的來源標記（Provenance）**：每筆記憶都帶有 `source`（使用者陳述、模型推斷、工具輸出）、`timestamp` 與 `trust_tier`。
2. **寫入時的防護機制模型**：一個較小的分類器在可疑、形似指令的寫入命中儲存前就拒絕它們。
3. **佐證門檻**：高風險決策不能僅憑單一低信任記憶做出；它們需要多個獨立的佐證寫入。
4. **CI 中的金絲雀測試**：合成的毒酬載絕不能傳播進輸出。每週執行。

最重要的架構性分離是：代理的工具表面與其記憶寫入表面不應共享信任。工具輸出在成為記憶之前，應先通過一個清理器（sanitizer）。

### 問：記憶層級選擇：以下這幾項你會分別放在哪裡，為什麼？(a) 使用者的 API 速率限制、(b) 部署我們服務的步驟、(c) 代理上次嘗試這項任務的失敗紀錄、(d) 今日股價。

**強力的回答：**

(a) **L3 語意**，搭配雙時態有效性。它是一個帶有取代生命週期、租戶範圍的事實。不放 L4，因為它是資料，不是程序。

(b) **L4 程序**，作為帶版本的技能或操作手冊。它是一個帶條件分支的多步驟流程。技能可組合；語意三元組則不行。

(c) **L2 情節原始紀錄**，若失敗揭示了可一般化的教訓，則加上一個*反思跳轉*到 L4。原始軌跡屬於情節記憶。那條教訓（「絕不在尖峰時段執行遷移」）值得用 Reflexion 風格寫入程序記憶。

(d) **無：呼叫工具。**變動快速且有即時真理來源的事實，絕不該進入記憶。它們在定義上就會變陳舊。

通則是：資料放 L3，程序放 L4，觀察放 L2，而且絕不儲存有即時來源的快速變動事實。

### 問：帶我走過你會為情節到語意轉換設計的整併政策。一個情節何時會變成一個事實？

**強力的回答：**

我使用基於門檻的晉級政策，而非隱性衰減：

- **頻率門檻**：對同一模式進行 N 次獨立觀察（3 到 5 是典型值）。
- **信心加權**：使用者陳述 > 工具輸出 > 模型推斷。
- **裁判審查（Judge review）**：一個排程的批次整併作業，對候選晉級項目執行一個 LLM 裁判（對高風險領域則用人工審查員）。
- **排程，而非同步**：整併在帶外（out-of-band）以 cron 進行，而非逐回合。這避免了寫入放大。
- **雙向**：L3 中的語意事實可以為特定任務重新實例化為情節上下文。記憶是雙向流動的。

要避免的陷阱是僅憑衰減權重的隱性整併。它在小規模有效，在生產規模卻會靜默失效，因為對於「這個事實為什麼會出現在 L3？」沒有稽核軌跡。

### 問：你的記憶儲存橫跨 10K 個租戶、共有 50M 筆記憶。你如何保證跨租戶隔離，而如果隔離失效，你的衝擊半徑（blast radius）是多大？

**強力的回答：**

這套架構有五層隔離：

1. **儲存層的實體隔離**：每租戶獨立的集合或分片（shard），而非以中介資料過濾的共享索引。「共享索引加租戶 id」的模式在出現 bug 時會失敗開放（fail open）。
2. **透過服務帳號範圍劃定來強制**：應用程式碼無法退出租戶範圍；資料庫角色沒有對其他租戶的可見性。
3. **每租戶獨立的 KV-cache 前綴**：防止快取的提示在租戶之間外洩。
4. **每租戶獨立的加密金鑰**：即使因 bug 被回傳，跨命名空間的位元組也無法讀取。
5. **對每一次跨命名空間查詢嘗試做稽核日誌記錄**：縱深偵測。

**若隔離失效的衝擊半徑**：單一一次糟糕的向量查詢，可能外洩某次查詢嵌入的*鄰域*，亦即潛在來自單一租戶的數百筆紀錄。實地量測顯示，在未隔離的多租戶 RAG 中，自然外洩率約為 95%。緩解之道不是「更謹慎的應用程式碼」，而是無法被應用程式 bug 繞過的結構性隔離。

### 問：HaluMem 顯示記憶幻覺在寫入時累積，然後傳播。你會如何為生產環境的記憶做檢測（instrument），以捕捉這種情況？

**強力的回答：**

大多數團隊掉進的陷阱是只在 QA 階段（端到端）測量記憶品質。HaluMem 證明了 60-80% 的記憶錯誤源自*抽取*（寫入）時並會傳播。你需要檢測三個分開的指標：

1. **抽取精度**：當代理把一個事實寫入 L3 時，這個事實真的有來源觀察的支持嗎？每天抽樣寫入，用更強的裁判來評估。
2. **更新正確性**：當衝突事實抵達時，衝突解決邏輯是否產生了正確的結果？用雙時態查詢來偵測「沒有取代中介資料卻翻轉了的事實」。
3. **QA 準確度**：端到端的回憶正確性。

在此之上，執行**影子模式重播（shadow-mode replay）**：寫入會以影子模式通過一個驗證器模型；即時寫入與影子驗證器寫入之間的不一致，會把潛在的幻覺標記出來供審查。CI 中的**金絲雀事實**確保記憶系統不會靜默退化。**週期性的全儲存稽核**抽樣隨機記憶，並追問「這是否仍與來源對話一致？」

### 問：TTT-E2E 透過測試時訓練把上下文壓縮進權重。這在 L1-L4 層級中位於何處，又引入了什麼新的失效模式？

**強力的回答：**

TTT-E2E 位於 L1 與 L4 *之間*。它讓上下文衍生的資訊在會話的其餘部分成為模型本身的一部分。其吸引力在於延遲：無論上下文長度為何都是固定成本（依 NVIDIA 的基準測試，在 H100 上於 128K 達到 2.7 倍加速、於 2M token 達到 35 倍加速）。

新的失效模式是治理。權重內記憶具有：

- **沒有稽核軌跡**：你無法檢視「這個模型現在相信什麼？」。
- **沒有逐出介面**：一旦記憶被壓縮進權重，你就無法在不回滾模型狀態的情況下刪除它。
- **GDPR 被遺忘權的挑戰**：監管框架假設資料是靜止的（at rest），而非在權重中。
- **更難偵測投毒**：沒有可檢視的儲存可供掃描金絲雀簽章。

除了治理，還有一個能力上的失效模式：該方法回報在其注意力視窗之外的「大海撈針（needle-in-a-haystack）」檢索會失敗（在 128K 約為 6%，而完整注意力為 99%），所以它保留的是上下文的要旨，而非逐字的事實。這使它無法作為檢索關鍵工作的唯一記憶層。

正確的框架是：TTT-E2E 把記憶治理從儲存層移到了訓練與部署管線。成本沒有被消除，只是被重新安置了。對 2026 年的大多數生產團隊而言，這是一個值得追蹤的研究方向，而非尚可部署的架構。更廣泛的測試時訓練家族在 [Research Radar 主題 12](../RESEARCH-RADAR.md#12-test-time-training-learning-at-inference) 中有所梳理。

---

## 參考資料 {#references}

### 生產框架
- [Mem0: Production-Ready AI Agents with Scalable Long-Term Memory (ECAI 2025)](https://arxiv.org/abs/2504.19413)
- [Mem0 AI Memory Benchmarks 2026](https://mem0.ai/blog/ai-memory-benchmarks-in-2026)
- [Letta (formerly MemGPT) documentation](https://docs.letta.com/concepts/memgpt/)
- [MemGPT: Towards LLMs as Operating Systems (arXiv 2310.08560)](https://arxiv.org/abs/2310.08560)
- [Anthropic Memory Tool documentation](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool)
- [Anthropic Claude Sonnet 4.6 Skills announcement](https://www.anthropic.com/news/claude-sonnet-4-6)
- [Claude Dreaming: scheduled memory consolidation](https://www.mindstudio.ai/blog/what-is-claude-dreaming-anthropic-agent-memory)
- [Zep: Temporal Knowledge Graph Architecture (arXiv 2501.13956)](https://arxiv.org/abs/2501.13956)
- [Graphiti GitHub](https://github.com/getzep/graphiti)
- [LangMem documentation](https://langchain-ai.github.io/langmem/)
- [OpenAI Memory and new controls for ChatGPT](https://openai.com/index/memory-and-new-controls-for-chatgpt/)
- [Cognition: Rebuilding Devin for Claude Sonnet 4.6](https://cognition.ai/blog/devin-sonnet-4-5-lessons-and-challenges)

### 研究（2023-2026）
- [Generative Agents: Interactive Simulacra of Human Behavior (Park et al. 2023)](https://arxiv.org/abs/2304.03442)
- [Reflexion: Language Agents with Verbal Reinforcement Learning (Shinn et al. 2023)](https://arxiv.org/abs/2303.11366)
- [HippoRAG: Neurobiologically Inspired Long-Term Memory (Gutierrez et al. 2024)](https://arxiv.org/abs/2405.14831)
- [A-MEM: Agentic Memory for LLM Agents (Xu et al. NeurIPS 2025)](https://arxiv.org/abs/2502.12110)
- [Multi-Layered Memory Architectures (arXiv 2603.29194, March 2026)](https://arxiv.org/abs/2603.29194)
- [Memp: Exploring Agent Procedural Memory (Aug 2025)](https://arxiv.org/html/2508.06433v2)
- [LEGOMem: Modular Procedural Memory for Multi-agent LLM (Oct 2025)](https://arxiv.org/pdf/2510.04851)
- [Rethinking Memory Mechanisms of Foundation Agents (Feb 2026 survey)](https://arxiv.org/abs/2602.06052)
- [Position: Episodic Memory is the Missing Piece (arXiv 2502.06975)](https://arxiv.org/pdf/2502.06975)

### 安全、投毒與幻覺
- [HaluMem: Operation-Level Memory Hallucination Benchmark (Nov 2025)](https://arxiv.org/abs/2511.03506)
- [MINJA Memory Injection Attack (NeurIPS 2025)](https://openreview.net/forum?id=QVX6hcJ2um)
- [MemoryGraft Persistent Memory Compromise (Dec 2025)](https://arxiv.org/html/2512.16962v1)
- [Palo Alto Unit 42: Indirect prompt injection poisons AI long-term memory](https://unit42.paloaltonetworks.com/indirect-prompt-injection-poisons-ai-longterm-memory/)
- [Multi-tenant AI Infrastructure: 5 Isolation Layers](https://medium.com/@isuruig/multi-tenant-ai-infrastructure-the-5-isolation-layers-that-determine-whether-your-customers-data-stays-separate-340aaeef4922)
- [The Day-30 Problem: agent memory drift](https://cipherbuilds.ai/blog/day-30-agent-memory-problem)

### 基礎設施
- TTT-E2E: "End-to-End Test-Time Training for Long Context" arXiv:2512.23675, and the [NVIDIA writeup: Reimagining LLM Memory](https://developer.nvidia.com/blog/reimagining-llm-memory-using-context-as-training-data-unlocks-models-that-learn-at-test-time/)
- [vLLM PagedAttention](https://docs.vllm.ai/en/latest/design/paged_attention/)
- [Anthropic Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

---

*下一篇：[規劃與分解](06-planning-and-decomposition.md)*
