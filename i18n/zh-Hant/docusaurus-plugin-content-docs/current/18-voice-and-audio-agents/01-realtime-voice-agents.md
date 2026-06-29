# 即時語音代理

語音代理是包裹在 LLM 外層的軟即時媒體系統。推理是簡單的部分，困難的部分是**時序**：把音訊收進來、判斷人類究竟何時停止說話、進行思考，然後夠快地把音訊送回去，讓對話感覺活靈活現。一旦時序沒抓好，使用者就會搶在代理前面說話、重複自己的話，最後掛斷電話。本章涵蓋架構、延遲預算、2026 年的技術堆疊，以及生產環境的失效模式。

一則範圍說明：如果你正在打造電話、客服或語音優先的產品，請閱讀本章。如果不是，[代理基礎](../07-agentic-systems/01-agent-fundamentals.md)與[工具使用](../17-tool-use-and-computer-agents/01-tool-use-landscape.md)章節涵蓋了可以轉用的部分。下文中具體的模型名稱、價格與延遲數據是 2026 年中的快照，而且變動很快，引用前請先查證。

## 目錄

- [兩種架構](#the-two-architectures)
- [管線逐個元件解析](#the-pipeline-component-by-component)
- [延遲預算](#latency-budgets)
- [2026 年的技術堆疊](#the-2026-stack)
- [生產環境考量](#production-concerns)
- [誠實看待成熟度](#honest-maturity)
- [面試題](#interview-questions)
- [參考資料](#references)

---

## 兩種架構 {#the-two-architectures}

每個語音代理都是兩種形態之一。

**級聯管線（Cascaded pipeline）：** `mic -> VAD -> streaming STT -> endpointing -> LLM -> streaming TTS -> speaker`。音訊在每個邊界都會變成**文字**，而且每個階段都是可替換的元件，往往來自不同的供應商。

**語音對語音（Speech-to-speech，S2S）：** 單一的多模態模型直接攝入音訊幀並發出音訊幀，文字只作為旁路通道產生。OpenAI 的 Realtime API、Google 的 Gemini Live 原生音訊，以及 AWS Nova Sonic 是 2026 年的範例。

| 面向 | 級聯 | 語音對語音 |
|-----------|----------|------------------|
| **延遲下限** | 樸素形式下較高；在全串流之下，總延遲會塌縮趨近 `max(stage)`，大約 400-800ms | 結構上較低（沒有文字往返） |
| **可控性** | 高：每次交接都有文字，可獨立替換 LLM/語音、A/B 測試、注入提示 | 低：單一模型，更換供應商等於重新架構 |
| **打斷** | 確定性、由執行期控制（VAD 觸發、取消 TTS、回滾該回合） | 全雙工更自然，但失效不透明 |
| **成本** | 可預測，通常按分鐘計費 | 以 token 計費，每回合都重送音訊歷史，隨通話長度增長 |
| **可觀測性** | 每個邊界都有文字產物，易於記錄與稽核 | 需要一條平行的轉錄串流來做記錄 |
| **韻律／情感** | 從文字重建，因此情感往往在 STT 瓶頸處流失 | 原生保留並生成語氣、笑聲、強調 |
| **語言／語碼轉換** | 受每個元件所限 | 更自然地處理句中語碼轉換 |

**決策指南。** 當你需要逐元件除錯與稽核軌跡、法規遵循（HIPAA、金融）、供應商彈性、深度工具呼叫，以及可預測的成本時，請選擇**級聯**。這是 2026 年企業生產環境的預設選擇，部分原因在於生態系裡有許多可互換的 STT 與 TTS 供應商，而 S2S 供應商只有少數幾家。當你需要最大化對話自然度、最低的打斷延遲，以及富有表現力的語音（陪伴型應用、教練、消費級展示），並且能容忍較弱的可除錯性與浮動成本時，請選擇 **S2S**。一種常見的**混合**做法是：以 S2S 處理對話核心，再搭配一條平行的 STT 串流，純粹用於記錄與評估。

一則對兩者都適用的現實檢核：兩者預設都不會在延遲上勝出。WebSocket 建立、VAD 設定、網路跳數、編解碼器與取樣率才是主導因素，而一個調校良好的級聯在許多部署中都能與 S2S 並駕齊驅。

---

## 管線逐個元件解析 {#the-pipeline-component-by-component}

**語音活動偵測（Voice Activity Detection，VAD）。** 第一層即時地把每個音訊幀分類為語音或靜音。Silero VAD 是事實上的開源標準，已原生整合進主要框架，而且只增加約 10-50ms。VAD 本身無法分辨句中停頓與一個回合的結束，這正是下一個問題。

**語意斷點偵測與輪替，關鍵所在。** 有兩種做法：
- **靜音閾值斷點偵測（Silence-threshold endpointing）** 會等待 N 毫秒的靜音。做法簡單，但它對每一個回合都課稅：800ms 的逾時，會在管線都還沒開始之前就加上將近一整秒。
- **學習式輪替偵測（Learned turn detection）** 讀取部分轉錄，並預測這段想法在語意上是否完整，*搶在*尾隨靜音之前觸發。2026 年的具體系統包括一個小型 transformer 輪替偵測器（一個約 135M 參數的模型，從一個小型基底微調而來，在 CPU 上以數十毫秒執行，並有多語言變體），以及串流式 STT 斷點偵測，後者會以可調的信賴閾值發出一個學習得來的「回合結束」token。其回報是把代理的回合間隙收斂趨近 ~300ms，又不會把使用者話講到一半就切斷。

**插話／打斷（Barge-in / interruption）。** 輪替偵測在*代理正在說話時*仍保持作用。當使用者的音軌觸發 VAD，執行期會取消當前的 TTS 串流、回滾被打斷的 LLM 回合，並重新進入 STT。WebRTC 傳輸對打斷的處理明顯優於 WebSocket，因為 UDP 在封包遺失時可避免線頭阻塞（head-of-line blocking）。

**串流轉錄。** 串流式 STT 在使用者仍在說話時，每 ~50ms 就發出一次部分轉錄，因此轉錄與說話平行進行，在使用者停止後幾乎不增加任何延遲。要區分三種 STT 延遲：部分轉錄、最終轉錄（在說話結束後），以及斷點偵測延遲。語音代理優化的是最後一種。

**TTS 與首段音訊時間（time-to-first-audio，TTFA）。** 代理必須在第一批字詞一存在時就開始說話，而不是等到整句生成完畢。TTS 以區塊串流音訊；TTFA（到第一個音訊位元組的時間）是頭號指標，現代串流引擎以第一個區塊 ~100-200ms 為目標。

---

## 延遲預算 {#latency-budgets}

在自然的人類對話中，一個人說完到另一個人開始說之間的間隙平均約為 **~200ms**。在端到端大約 700ms 以下，代理感覺像真人；超過這個數字，來電者就會開始打斷與重複。一個全串流級聯的實際每回合預算如下：

| 階段 | 典型預算 | 備註 |
|-------|---------------|-------|
| 網路傳輸（單向） | 30-80ms | WebRTC/UDP 低於 100ms；SIP 每跳增加 20-50ms |
| VAD 幀判斷 | 10-50ms | 持續運行 |
| 斷點偵測／輪替判斷 | 150-300ms | 由你的靜音／信賴度設定主導 |
| STT 最終轉錄 | 說話結束後 50-100ms | 部分轉錄已在說話期間串流 |
| **LLM 首個 token 時間** | **150-400ms**（可能更高） | 通常是單一最大的可控成本 |
| TTS 首段音訊時間 | 100-200ms | 僅第一個區塊；其餘以串流送出 |
| **實際端到端（TTFA）** | **~600-800ms** 為佳 | 串流會把總延遲塌縮趨近 `max(stage)`，而非總和 |

樸素的非串流堆疊會跑到 1000-2000ms 甚至更糟。各種槓桿，依影響力排序：**全部串流**（部分轉錄、token 串流、分塊 TTS，這會把總和變成最大值）；**調校斷點偵測**（用學習式輪替偵測器取代固定的長靜音逾時）；**選一條快速的首個 token 路徑**（較小／較快的模型或推測性草擬，因為 LLM 首個 token 時間是最長的瓶頸）；**以 TTFA 為準選擇 TTS**，並在第一個子句就開始發聲；以及**使用基於 UDP 的 WebRTC**，並把抖動控制在 ~20ms 以下。

---

## 2026 年的技術堆疊 {#the-2026-stack}

請把具體的名稱、版本與價格當成某個時間點的快照。

- **編排框架：** LiveKit Agents 與 Pipecat 是開源領導者（WebRTC 原生、可自帶 STT/LLM/TTS 或插入一個 S2S 模型，內附 VAD 加一個輪替偵測器）。Vapi、Retell 與 Bland 是受管平台。在把工程時間計入後，受管方案在大約每月 10k 分鐘以下往往較便宜；在那之上，據報框架路線的每通電話成本較低。
- **STT：** Deepgram 與 AssemblyAI 在即時串流領先，兩者都內建斷點偵測，且回報的字錯誤率在 ~6-7% 區間（視基準測試而定）。
- **S2S 即時模型：** OpenAI 的 Realtime API（`gpt-realtime` 系列；請查閱[模型分類](../02-model-landscape/01-model-taxonomy.md)以取得目前支援的版本，因為後綴一直在變動）、Google Gemini Live 原生音訊，以及 AWS Nova Sonic。這些都支援函式呼叫，而對 OpenAI 來說，還支援在即時工作階段內使用遠端 MCP 伺服器。
- **TTS：** Cartesia 與 ElevenLabs 在低延遲串流領先；供應商宣稱的 TTFA 從數十毫秒到 ~200ms 不等，且視基準測試而定。
- **傳輸：** WebRTC（UDP、Opus 編解碼器）用於用戶端到代理的媒體；WebSocket（TCP）對伺服器到模型這一段較為簡單，但在遺失封包時會受線頭阻塞所苦。一種常見的混合做法是：WebRTC 用戶端接到中繼，WebSocket 中繼再接到模型 API。SIP 橋接到電話網路（PSTN），而其中每個電信業者跳數都會增加延遲。

---

## 生產環境考量 {#production-concerns}

**ASR 錯誤是主要的失效。** 值得內化的基準測試發現是：身分驗證是瓶頸，因為一旦代理聽錯一個姓名、電子郵件或確認碼，下游的一切就全部失敗。防禦手段：用信賴閾值把低信賴度的片段導向一個澄清問題（「你是說……嗎？」），以及針對姓名、SKU 與英數字串的自訂詞彙／關鍵字加權。

**對話中的工具呼叫。** 兩種架構都支援函式呼叫。發出一句口語填補語（「讓我查一下」）來掩蓋工具延遲，這樣在工具執行時線路就不會是一片死寂。

**跨回合記憶。** S2S 模型每回合都重送音訊歷史，因此 token 成本與上下文壓力會隨通話長度增長；請修剪工具輸出並做摘要。在語音路徑中持久的跨工作階段記憶仍然薄弱；把記憶留在文字／LLM 層（級聯）較為便宜。參見[代理記憶與狀態](../07-agentic-systems/05-agent-memory-and-state.md)。

**電話。** SIP 中繼線橋接到 PSTN，並交付 8kHz 的 mu-law 音訊，若未妥善處理，會破壞 VAD 與輪替偵測；這是電話線路上一個已被記錄的 S2S 失效模式。

**可觀測性與評估。** 級聯堆疊免費提供文字產物；S2S 則需要一條平行的轉錄串流。值得認識的基準測試是 **tau-Voice**（Sierra，arXiv:2603.13686），它把代理式工具使用的評估延伸到帶有雜訊、口音與打斷的全雙工語音，並隔離出語音特有的失效類別：ASR 聽錯、打斷管理不當、多步驟上下文遺失，以及無法從掉線中復原。參見[評估代理式系統](../07-agentic-systems/10-evaluating-agentic-systems.md)。

**成本：音訊 token 的成本遠高於文字。** 以 OpenAI 的即時模型而言，據報音訊輸入大約是文字輸入費率的 8 倍，音訊輸出大約是文字輸出的 4 倍，而且音訊是以時長編碼的（非常粗略地說，使用者語音約每 100ms 一個 token，合成語音約每 50ms 一個 token）。據報提示快取與修剪過的工具輸出能大幅降低每分鐘成本。請按分鐘為語音代理編列預算，而不是抽象地按 token，並參見[FinOps 與 Token 經濟學](../11-infrastructure-and-mlops/04-finops-and-token-economics.md)。

---

## 誠實看待成熟度 {#honest-maturity}

2026 年運作良好的部分：在調校過的級聯堆疊與 S2S 上，達到次秒級、感覺自然的單回合延遲；勝過靜音閾值的學習式輪替偵測；級聯執行期中的確定性插話；S2S 中富有表現力的韻律；以及成熟的工具生態系。

仍然困難的部分：全雙工自然度（優雅的重疊、回饋訊號、可靠的話講一半的打斷）；嘈雜的真實世界音訊；句中語碼轉換；以及語音路徑中的長上下文記憶。來自 tau-Voice 的頭號警告：即便是前沿的語音代理，在實際嘈雜條件下也只保有相當於文字代理任務能力的約 30-45%，而且絕大多數失效都來自代理行為，而非測試框架本身。**語音還不是「一個文字代理加上一支麥克風」。** 請為這道落差做設計：明確確認關鍵欄位（姓名、代碼、金額）、保留一條交接給真人的路徑，並在雜訊與打斷之下評估，而不只是在乾淨音訊之下。

---

## 面試題 {#interview-questions}

### Q：帶我走過一個語音代理的延遲預算。毫秒都花到哪裡去了，而單一最大的槓桿是什麼？

**好的回答：**
自然對話大約有 200ms 的回合間隙，而在端到端 ~700ms 以下，代理感覺像真人。預算分散在傳輸（每個方向 30-80ms）、VAD（10-50ms）、斷點偵測（150-300ms，由你的靜音或信賴度設定決定）、STT 最終轉錄（說話結束後 50-100ms，因為部分轉錄在說話期間就已串流）、LLM 首個 token 時間（150-400ms，通常是最長的瓶頸），以及 TTS 首段音訊時間（100-200ms）。單一最大的槓桿是全部串流，因為它把各階段的總和變成大約是最大值：部分轉錄、token 串流與分塊 TTS 彼此重疊，而非串行。在那之後，用學習式輪替偵測器取代固定的長靜音逾時可移除每回合的稅負，而選擇一個快速首個 token 的模型則能攻擊最長的瓶頸。

### Q：級聯管線還是語音對語音：你怎麼選？

**好的回答：**
凡是需要可稽核性、合規、供應商彈性、深度工具使用，以及可預測成本的，選級聯，因為每個邊界都有文字，能給你記錄、可替換的元件與審查掛鉤；它是企業的預設選擇。當對話自然度與最低打斷延遲最為重要，而你能接受不透明的失效、較少的供應商，以及隨通話長度增長的 token 成本（因為它每回合都重送音訊歷史）時，選語音對語音。許多團隊採取混合做法：以 S2S 處理對話核心，再搭配一條平行的 STT 串流，純粹用於記錄與評估。我不會假設 S2S 自動就是較低延遲；一個調校良好的級聯具有競爭力，而且傳輸與斷點偵測設定無論在哪種架構下都是主導因素。

---

## 參考資料 {#references}

- Sierra, "tau-Voice: advancing agent benchmarking to knowledge and voice" arXiv:2603.13686, and [blog](https://sierra.ai/blog/bench-advancing-agent-benchmarking-to-knowledge-and-voice)
- OpenAI, [Introducing the Realtime API](https://openai.com/index/introducing-the-realtime-api/)
- LiveKit, [turn detection for voice agents](https://livekit.com/blog/turn-detection-voice-agents-vad-endpointing-model-based-detection) and [a transformer for end-of-turn detection](https://livekit.com/blog/using-a-transformer-to-improve-end-of-turn-detection)
- AssemblyAI, [turn detection and endpointing](https://www.assemblyai.com/blog/turn-detection-endpointing-voice-agent)
- Deepgram, [speech-to-speech vs cascade architecture](https://deepgram.com/learn/speech-to-speech-vs-cascade-voice-agent-architecture)
- Pipecat, [open-source voice agent framework](https://github.com/pipecat-ai/pipecat)
- Cekura, [voice AI evaluation metrics](https://www.cekura.ai/blogs/voice-ai-evaluation-metrics)

---

*上一篇：[安全與治理](../17-tool-use-and-computer-agents/07-safety-and-governance.md) · 下一篇：[多模態生成](../19-multimodal-generation/01-multimodal-generation.md)*
