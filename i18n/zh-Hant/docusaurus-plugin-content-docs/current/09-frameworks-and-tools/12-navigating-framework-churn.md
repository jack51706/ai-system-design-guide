# 應對框架快速汰換

AI 編排框架的變化速度，比教這些框架的教材更新得還快。LlamaIndex 與 LangChain 都在 2024 年重新架構了整個套件佈局，並在一年之內移除了它們最初的招牌抽象層。結果就是：一門十二個月前錄製的課程，常常在第一行 `import` 就掛掉。本頁要談的就是這個問題，談它為什麼會發生，以及如何學習與建構，好讓你的知識和程式碼都能在汰換中存活下來。

一句話版本：**框架是你這一季用來出貨的工具；基本元素才是你能長期保留的東西。前者要釘版本，後者要學透。**

## 目錄

- [觸發點：為什麼一門課程在全新安裝時就壞掉](#the-trigger-why-a-course-breaks-on-a-fresh-install)
- [實際上改變了什麼](#what-actually-changed)
- [為什麼課程與教學文會過時](#why-courses-and-tutorials-go-stale)
- [這份教學還是最新的嗎？30 秒快速檢查](#is-this-tutorial-current-a-30-second-check)
- [熬過汰換：釘版本、鎖定、隔離](#surviving-churn-pin-lock-isolate)
- [框架 vs 原生 SDK vs 薄封裝層](#framework-vs-raw-sdk-vs-thin-layer)
- [哪些東西能跨版本沿用](#what-transfers-across-versions)
- [非升級不可時的遷移做法](#migrating-when-you-must-upgrade)
- [一套耐用的學習方法](#a-durable-learning-playbook)
- [面試題](#interview-questions)
- [參考資料](#references)

---

## 觸發點：為什麼一門課程在全新安裝時就壞掉 {#the-trigger-why-a-course-breaks-on-a-fresh-install}

一個常見的真實案例：學習者開始上一門評價不錯的 LlamaIndex 影片課程，複製了第一個程式碼儲存格，然後就撞上

```
ImportError: cannot import name 'SimpleDirectoryReader' from 'llama_index'
```

或者，稍微後面一點，

```
TypeError: Can't instantiate abstract class OpenAI with abstract method _prepare_chat_with_tools
```

學習者沒有做錯任何事，課程錄製本身也沒有問題。課程的 notebook 環境釘住了舊版本（某門熱門的 LlamaIndex 課程附帶一份 `requirements.txt`，內含 `llama-index==0.10.30` 和 `llama-index-llms-openai==0.1.26`），影片也是針對這些版本錄製的。但你今天執行全新的 `pip install llama-index`，拿到的是好幾個小版本之後的新版，其中匯入路徑與類別階層都已改變。第一個錯誤是匯入位置被搬動了；第二個則是*部分*版本不一致，也就是核心套件和某個整合套件升級的步調沒有同步，導致基底類別上出現了新的抽象方法，而舊版的整合套件從未實作它。

這不是 LlamaIndex 的問題，也不是課程品質的問題。它是「快速變動的框架」加上「釘死、已錄製的教材」這個組合的預設結果。理解這個機制，才能讓你在幾秒鐘內修好它，而不是直接放棄。

---

## 實際上改變了什麼 {#what-actually-changed}

有兩次重新架構定義了現代的汰換亂象。底下的版本號是截至 2026 年 6 月時準確的；請把它們當成一個快照看待，因為它們會持續變動。

### LlamaIndex

- **v0.10（2024 年 2 月）：那次大拆分。** 原本單體的 `llama-index` 套件被拆成 `llama-index-core`（只剩抽象層）外加數百個各自獨立版本的整合套件（`llama-index-llms-openai`、`llama-index-embeddings-*`、`llama-index-vector-stores-*`、`llama-index-readers-*`）。原本獨立的 `llama-hub` 也被併了進來。匯入方式同時以兩種形式改變，這就是舊 notebook 會立刻失敗的原因：
  - 從頂層改到 core：`from llama_index import VectorStoreIndex` 變成 `from llama_index.core import VectorStoreIndex`
  - 整合層拆進各自的套件：`from llama_index.llms import OpenAI` 變成 `from llama_index.llms.openai import OpenAI`
- **v0.11（2024 年 8 月）：招牌抽象層被移除。** `ServiceContext`（每一份 0.10 之前的教學都用它來串接 LLM、嵌入與解析器的那個物件）在 0.10 被標記棄用，並在 0.11 被*移除*。它的替代品是全域的 `Settings` 物件。同一次發版也把程式碼庫遷移到 Pydantic v2。
  ```python
  # OLD (pre-0.10, removed in 0.11)
  from llama_index import ServiceContext, set_global_service_context
  service_context = ServiceContext.from_defaults(llm=llm, embed_model=embed)
  set_global_service_context(service_context)

  # CURRENT
  from llama_index.core import Settings
  Settings.llm = llm
  Settings.embed_model = embed
  ```
- **Workflows（2025 年 6 月推出 1.0，現為 2.x）：新的應用面。** 事件驅動、型別化狀態的代理式編排，被抽離成它自己的 `llama-index-workflows` 套件。請注意一個很多摘要都搞錯的更正：達到 1.0、接著進到 2.x 的是 *Workflows*；核心框架本身仍走在 0.x 這條線上（2026 年中時 `llama-index` 約在 0.14.x），而不是「1.x」那條線。
- **Codemod：** `llamaindex-cli upgrade <dir>` 會自動改寫舊的匯入。

### LangChain

- **套件拆分。** `langchain-core`（Runnables、訊息、基底介面，是唯一帶有向後相容保證的套件）、`langchain-community`（第三方整合）、`langchain`（chains 與 agents），以及各廠商的夥伴套件（`langchain-openai`、`langchain-anthropic`……）。LCEL，也就是那套 `|` 管線組合模型，取代了舊的 `Chain` 子類別。
- **v0.3（2024 年 9 月）：Pydantic v1 升到 v2。** 傳入 Pydantic v1 模型的使用者程式碼會壞掉。
- **v1.0（2025 年 10 月）：agents 改跑在 LangGraph 上。** 建構代理的官方欽定做法變成了 `create_agent`，它跑在 LangGraph 執行階段上，並帶有一套中介軟體系統。舊版的 chains（`LLMChain`、`RetrievalQA`、`AgentExecutor`、`initialize_agent`）被搬到 `langchain-classic`，標記棄用但尚未刪除。2026 年中時的當前 `langchain` 約在 1.3.x，並要求 Python 3.10+。
- **棄用對照表：** `LLMChain` 改用 LCEL 管線（`prompt | llm | parser`）；`RetrievalQA` 改用 `create_retrieval_chain`；`AgentExecutor` / `initialize_agent` 改用 `create_agent`；舊版 `Memory` 類別改用 LangGraph checkpointers。

各自更深入的細節在 [LangChain 深入剖析](01-langchain-deep-dive.md) 與 [LlamaIndex 章節](04-llamaindex.md)。這裡的重點是那個*模式*：一個單體拆成核心加外掛、最初的便利抽象層被移除、代理層搬到圖式執行階段上。兩大主流框架都依循了這個模式，前後大約相差一年。

---

## 為什麼課程與教學文會過時 {#why-courses-and-tutorials-go-stale}

已錄製的課程與部落格文章捕捉的是一個*快照*：影片本身，以及通常隨附的釘死版本 `requirements.txt` 或託管的 notebook 環境，都在錄製當下被固定下來。但線上的套件索引並不會被固定。當學習者重新安裝時，解析器會拉下已經超前那個釘死版本的當前版本，於是錄好的程式碼就不再對得上已安裝的 API。

這些失敗模式是可預測的：

- **匯入位置被搬動**（`cannot import name ... from 'llama_index'`）：那個符號被搬到了 `.core` 或某個夥伴套件。
- **符號被移除**（`ImportError: ServiceContext`，或引用到 `LLMChain` / `RetrievalQA`）：那個抽象層是被刪掉了，不只是搬位置。
- **部分升級造成的不一致**（`Can't instantiate abstract class ...`）：核心套件與某個整合套件的步調脫節了；常見的修法是把*整組*一起升級（`pip install -U llama-index llama-index-llms-openai`）。
- **模型名稱棄用**（`gpt-3.5-turbo-0301` 已不再提供）：教學釘住了一個供應商後來下架的模型 ID。這是同一種汰換，只是發生在下面一層。

大多數教學平台只把它們的版本約定編碼成一份隨附的 lockfile 或一個凍結的託管環境，而不是一條清楚可見的「本課程是針對版本 X 錄製」橫幅。所以這種過時在程式碼壞掉之前都是看不見的。

---

## 這份教學還是最新的嗎？30 秒快速檢查 {#is-this-tutorial-current-a-30-second-check}

在你投入好幾個小時上任何課程、文章或 notebook 之前：

1. **拿日期去對框架的發版節奏。** 一份 2024 年的 LlamaIndex 或 LangChain 教學，按定義就已經落後至少一整次重新架構。
2. **打開隨附的 `requirements.txt` 或 lockfile，把釘死的版本拿去和當前發版比較。** 在當前已是 `0.14.x` 時還釘著 `llama-index==0.10.x`，或任何 `langchain<1.0`，都代表你應該預期它會壞掉。
3. **用 grep 在程式碼裡搜尋已知被移除的符號。** 它們的存在能瞬間替這份教材定年代：
   - LlamaIndex：`ServiceContext`、`LLMPredictor`、`set_global_service_context`，或沒有帶 `.core` 的 `from llama_index import`。
   - LangChain：`LLMChain`、`RetrievalQA`、`initialize_agent`、`AgentExecutor`。
4. **以專案自己的當前快速入門作為事實來源**，並把第三方課程用來學*概念*，而不是用來複製貼上程式碼。

---

## 熬過汰換：釘版本、鎖定、隔離 {#surviving-churn-pin-lock-isolate}

能避免「昨天還能跑，今天就壞了」的紀律：

- **釘住精確版本。** 一個寬鬆、沒指定版本的 `llama-index` 是意外損壞最大的單一成因。至少要用 `==` 釘住你的直接相依套件。
- **使用真正的 lockfile**，把傳遞性相依套件也一併鎖住。[`uv`](https://docs.astral.sh/uv/)（`uv.lock`、`uv sync`）是 2026 年快速崛起的當紅選擇；Poetry（`poetry.lock`）與 pip-tools（`pip-compile`）則是老牌工具。正在成形的標準是與工具無關的 `pylock.toml`（PEP 751）。把 `pyproject.toml` 當成意圖、把 lockfile 當成現實，並把 lockfile 提交進版控。
- **把拆分後的套件當成一組來釘。** 對 LlamaIndex 和 LangChain 來說，`core` 與每一個整合套件都必須一起移動。那個「abstract class」錯誤正是部分升級造成的。要升就整組升，不要只升其中一個套件。
- **把每個專案都隔離**在它自己的 virtualenv 或容器裡。絕對不要安裝進系統的 Python。一個同時釘住 Python 基底映像檔加上 lockfile 的容器，正是託管課程 notebook 實際上在做的事，也正是本機學習者通常會略過的事。
- **把棄用警告當成倒數時鐘，而不是雜訊。** 執行時讓警告顯示出來；每一條都會點名替代品，而且常常還會點名移除版本。被靜音的警告，正是一個能跑的應用程式在下一次例行升級時變成壞掉應用程式的途徑。

---

## 框架 vs 原生 SDK vs 薄封裝層 {#framework-vs-raw-sdk-vs-thin-layer}

這是 2026 年一個活生生的問題，因為框架當初存在的理由有一部分已經蒸發了。當 LangChain 和 LlamaIndex 出現時，各家供應商的 API 並不一致，一個統一層自然值回票價。但從那之後，工具/函式呼叫與結構化輸出，已經在各大供應商 SDK 之間收斂成原生且彼此相似的功能，於是框架的抽象價值縮水了，但它的汰換成本卻沒有縮水。

| 抽象層級 | 適用時機 | 代價 |
|----------|----------|------|
| **原生供應商 SDK**（`anthropic`、`openai`） | 你只做少數幾次模型呼叫、想要最穩定的介面與最清楚的堆疊追蹤，或者你在寫函式庫程式碼 | 檢索、代理迴圈與重試都得自己做 |
| **框架**（LangChain、LlamaIndex） | 你需要整合的廣度（數十種向量資料庫、載入器），或需要內建電池式的 RAG/代理鷹架來快速推進 | 相依套件蔓延、堆疊追蹤又深又難讀、版本汰換 |
| **薄封裝層**（你自己包在 SDK 之上的介面） | 想在不動到呼叫處的情況下抽換模型或框架的生產環境系統 | 一點點前期設計 |

對生產環境來說，薄封裝層往往是最佳甜蜜點：相依於供應商 SDK（或只依賴 `langchain-core`），把它包在一個你自己的小介面後面，並把框架專屬的細節集中在一個可替換的模組裡。關於抽象洩漏的經驗法則是：一個層級隱藏越多你為了除錯而必須理解的東西（檢索排名、token 預算、工具呼叫迴圈），它就越危險。會洩漏的代理抽象層，正是當初推動 LangChain 去打造 LangGraph 的原因。深入的選擇分析請見 [框架選型指南](08-framework-selection-guide.md)。

---

## 哪些東西能跨版本沿用 {#what-transfers-across-versions}

這是「耐用地學習」的核心。一個框架 *API* 的半衰期大約是一年。它底下那些*概念*的半衰期，則是整個領域本身。請依此分配你的投資。

**能沿用（要學透）：**
- **RAG 的運作機制：** 分塊與切分策略、嵌入加上相似度搜尋、檢索、重排序，以及上下文相關性 / 接地性 / 答案相關性這組評估三元組。這些在 `VectorStoreIndex` 每一次改名後都還活著。
- **代理迴圈：** 模型呼叫、工具選擇、工具執行、觀察、重複，加上狀態、記憶與人類介入。不管它叫 `AgentExecutor`、`create_agent`，還是一個手刻的 `while` 迴圈，迴圈本身都是同一個。
- **供應商原生的基本元素：** 工具/函式呼叫、結構化輸出、串流、token 與上下文預算。如今已在各家之間標準化，所以這是所有層級裡最耐用的一層。
- **工程紀律：** lockfile、可重現的環境、讀變更日誌、評估框架。純粹的可沿用價值。

**無法沿用（不要過度投資）：** 精確的匯入路徑、類別名稱、建構子簽章、當月份的全域設定物件（`ServiceContext` 對上 `Settings`），以及這一季欽定的是哪個 chain 輔助器（`LLMChain` 對上 LCEL 對上 `create_agent`）。把這些背下來，等於是在背一項持續貶值的資產。

---

## 非升級不可時的遷移做法 {#migrating-when-you-must-upgrade}

當你真的得把一個實際的程式碼庫往前推進時：

1. **在一個分支裡升級，lockfile 優先**，一次只跨一個大版本（0.10 到 0.11 到 0.12），不要一次跨很多。
2. **執行官方的 codemod**（如果有的話，例如 `llamaindex-cli upgrade`），然後讓棄用警告與匯入錯誤來驅動你的待辦清單。
3. **倚靠橋接套件**（`langchain-classic`、`llama-index-legacy`）讓應用程式在你逐步遷移時保持運作，而不是一次到位的大爆炸式遷移。
4. **用評估框架確認行為**，而不只是確認匯入能解析成功。一次能編譯通過、卻悄悄改變了檢索品質或代理成功率的遷移，是一種你會想在進入生產環境前就抓到的退步。請見 [LLM 評估](../14-evaluation-and-observability/01-llm-evaluation.md)。

---

## 一套耐用的學習方法 {#a-durable-learning-playbook}

1. **先用原生 SDK 親手把迴圈做一次**，不用任何框架，這樣你才會理解框架到底自動化了什麼。之後你除錯框架失敗的速度會快上許多。
2. **接著採用一個框架**換取廣度與速度，但要把它的 API 當成可替換的，藏在一個薄介面後面。
3. **釘住一切、提交 lockfile、讓棄用警告保持可見。**
4. **重新推導，不要重新死背。** 當一個框架把東西改名時，把新 API 對應回它所實作的基本元素（「`create_agent` 不過就是跑在 LangGraph 上的代理迴圈」），而不是從頭重學一遍。
5. **在投入之前先審查課程的時效性**，用上面那套 30 秒檢查。把過時的課程用來學概念，把專案的當前文件用來抄程式碼。

關於經過精選、時效性已查核的課程，請見 [COURSES.md](../COURSES.md)。那份檔案之所以標註日期並重新驗證，原因正是本頁所描述的這種汰換。

---

## 面試題 {#interview-questions}

### Q：一位同事照著一份六個月前的 LlamaIndex 教學做，結果在 import 就失敗了。請帶我走過發生了什麼事，以及你會怎麼修。

**好的回答：**
那份教學是針對一個較舊的釘死版本錄製的，而全新安裝拉下了一個較新的版本，其中套件佈局已經改變。自 v0.10 起，LlamaIndex 變成 `llama-index-core` 加上一堆獨立的整合套件，所以像 `from llama_index import SimpleDirectoryReader` 這樣的頂層匯入，現在必須寫成 `from llama_index.core import SimpleDirectoryReader`，而 `ServiceContext` 在 v0.11 被移除，改用全域的 `Settings` 物件。如果錯誤反而是「can't instantiate abstract class OpenAI」，那就是一次部分升級，核心套件與 OpenAI 整合套件的步調脫節了；修法是把它們一起升級。耐用的修法是一份釘死的 lockfile，讓環境可重現，並且去讀遷移指南而不是用猜的。長期來看，我會請那位同事把專案的當前快速入門用來抄程式碼，而教學只用來學概念。

### Q：既然這些框架汰換得這麼快，你到底怎麼決定要不要用框架？

**好的回答：**
我會看這個框架實際上替我買到了什麼。它最初的工作是去抹平不一致的供應商 API，但工具呼叫與結構化輸出已經在各大 SDK 之間收斂，所以那份價值縮水了。如果我需要整合的廣度，或需要內建電池式的鷹架來快速推進，那框架就值回它的成本。如果我只是做少數幾次模型呼叫、或在寫函式庫程式碼，那原生供應商 SDK 會更穩定、也更容易除錯。對生產環境，我通常會把 SDK 包在一個我自己的薄介面後面，這樣抽換框架或模型就只動到一個模組。不論我選哪一個，我都會把它釘住並鎖定，並把框架專屬的程式碼隔離開來，因為我會假設這一季欽定的 API 將來會被棄用。

---

## 參考資料 {#references}

- LlamaIndex v0.10 遷移指南：https://developers.llamaindex.ai/python/framework/getting_started/v0_10_0_migration/
- LlamaIndex ServiceContext 轉 Settings 指南：https://developers.llamaindex.ai/python/framework/module_guides/supporting_modules/service_context_migration/
- LlamaIndex Workflows 1.0 公告（2025 年 6 月）：https://www.llamaindex.ai/blog/announcing-workflows-1-0-a-lightweight-framework-for-agentic-systems
- LangChain 與 LangGraph 1.0（2025 年 10 月）：https://www.langchain.com/blog/langchain-langgraph-1dot0
- LangChain v0.3 遷移（Pydantic v2）：https://docs.langchain.com
- `uv`（lockfile 與可重現環境）：https://docs.astral.sh/uv/
- PEP 751（`pylock.toml`，標準 lockfile 格式）：https://peps.python.org/pep-0751/

---

*下一篇：[文件處理](../10-document-processing/01-ocr-and-layout.md)*
