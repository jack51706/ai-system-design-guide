# AI Gateway 與模型路由

支持路由層的論點如今是有實證的，而非僅止於理想。根據 Datadog 的 2026 State of AI Engineering，**69% 的公司在生產環境中運行三個以上的模型**，而 **rate-limit／容量錯誤是最主要的單一生產環境故障模式**（約 5% 的請求會失敗，其中約 60% 的故障由容量驅動）。Datadog 自己的說法是：如今阻礙大規模可靠 AI 的主要障礙是營運的複雜度，而非模型的智慧程度。

一旦你依賴多個模型，而且流量規模不容小覷，單一供應商就會成為單點故障，而真正會在凌晨兩點把你叫醒的是 rate limit，而非模型品質。**AI gateway** 是標準的緩解手段。本章涵蓋它的功能、路由與 fallback 如何運作、2026 年的工具版圖，以及你究竟何時才真正需要它。

## 目錄

- [什麼是 AI Gateway](#what-an-ai-gateway-is)
- [路由策略](#routing-strategies)
- [Fallback 與可靠性](#fallback-and-reliability)
- [2026 年的工具版圖](#the-2026-tool-landscape)
- [架構模式](#architecture-patterns)
- [你現在需要 Gateway 了嗎？](#do-you-need-a-gateway-yet)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 什麼是 AI Gateway {#what-an-ai-gateway-is}

AI gateway（也稱為 LLM gateway、LLM proxy 或 LLM router）是**位於你的應用程式與模型供應商之間的控制平面**，對外暴露一個一致的（幾乎總是與 OpenAI 相容的）API，並把那些原本會散落在每個服務中的橫切關注點集中管理。

| 職責 | 它做什麼 |
|-----|--------------|
| 統一 API | 橫跨各供應商的單一 OpenAI 形式介面；無須為每個供應商寫黏合程式碼 |
| 模型路由 | 決定哪個模型／部署來服務每個請求 |
| Fallback 鏈 | 在可重試的故障發生時，依序嘗試清單中的下一個供應商／模型 |
| 負載平衡 | 將流量分散到不同的金鑰、區域、部署與供應商 |
| 帶 backoff 的重試 | 指數退避加上 jitter，並遵循 `Retry-After` |
| Rate-limit 處理 | 偵測 429、讓被限流的部署冷卻、重新路由 |
| 虛擬金鑰 + 預算 | 每個金鑰／團隊的金鑰，搭配以美元計的預算與硬性上限 |
| 花費追蹤 | 以 token 與美元層級，按金鑰／團隊／模型歸因 |
| 可觀測性 | 集中化的追蹤紀錄：誰呼叫的、嘗試了什麼、為何失敗、最後是哪個勝出 |
| Caching | 精確比對與語意快取，以降低成本與延遲 |
| 防護機制／PII | 在這個咽喉點進行提示／回應的過濾與遮蔽 |

心智模型如下：gateway 把應用程式碼中 `N 個供應商 x M 個關注點` 的黏合問題，轉換成單一個受策略管控的咽喉點。代價是多一次網路跳轉，以及一個你必須維持高可用性的元件，這正是下文討論的核心張力。

---

## 路由策略 {#routing-strategies}

路由策略形成一道複雜度與額外開銷遞增的階梯。作為粗略的規模感（廠商／實務者提供的數字，僅供數量級參考）：以規則為基礎的路由增加不到約 1ms，嵌入／語意路由約 5ms，而較重的 ML 分類器或 LLM-as-router 約 50-100ms，這些都對照於典型 500-2000ms 的模型延遲。

| 策略 | 依據什麼決定 | 最適合 | 額外開銷 | 故障模式 |
|----------|-----------|----------|----------|---------------|
| 靜態／手動 | 每條路由硬編碼一個模型 | 簡單、可預測的工作負載 | 約 0ms | 脆弱；無法因應停機或價格變動而調整 |
| 以任務為基礎 | 任務類型對應到一個模型 | 已知的任務分類 | <1ms | 分類錯誤；分類隨時間失效 |
| 以成本為基礎 | 在滿足限制下選最便宜的模型 | 成本上限、批次工作 | <1ms | 可能犧牲品質；最便宜的可能會被 rate-limit |
| 以延遲為基礎 | 觀測／預期延遲最低者 | 即時 UX | 約 1-5ms | 群聚到單一快速端點；冷啟動造成偏差 |
| 以能力為基礎 | 所需能力（長上下文、視覺、工具） | 異質性需求 | 1-5ms | 過度配置到「最佳」模型 |
| 語意 | 將請求嵌入，比對到某條路由 | 意圖分派、難度混雜 | 約 5-50ms | 嵌入漂移；模稜兩可的長尾；閾值調校 |
| LLM-as-router | 由小型 LLM 分類並挑選 | 嵌入漏掉的模稜兩可長尾 | 約 50-100ms | 增加一次 LLM 呼叫，帶來自己的成本與故障面 |
| Cascade | 先用便宜模型，信心不足時升級 | 大規模下的成本與品質權衡 | 循序進行 | 升級的查詢會雙重花費；信心訊號有雜訊 |

兩點在實務上很重要的注意事項。**語意路由**透過嵌入相似度挑選路由，而不呼叫 LLM；常見的生產模式是一種兩階段混合法，由語意處理有信心的多數，並把模稜兩可的長尾送往 LLM-as-router。**Cascade** 是槓桿最高的成本策略：RouteLLM（UC Berkeley／LMSYS，ICLR 2025）回報在僅把一小部分呼叫路由到前沿模型的情況下，達到了該模型約 95% 的品質，成本降幅落在 45-85% 區間。請把這個區間理解為特定基準測試下的上限，而非保證；升級率才是真正左右成本的變數，一個會把大部分流量都升級的 cascade 省不了多少。

路由與 fallback 是可組合的：在順利路徑上為成本／品質／延遲做路由，在不順利路徑上跨供應商做 fallback 以維持可靠性。一個 cascade 本質上就是以品質驅動的路由，內建了可靠性 fallback。

---

## Fallback 與可靠性 {#fallback-and-reliability}

這一節直接回應 Datadog 的數據：rate limit 造成了大多數的生產環境故障，而 fallback 機制就是解藥。

**Fallback 鏈**會在主要供應商回傳一個*可重試*的故障時（429 rate limit、5xx、逾時、找不到模型），把請求重試到下一個供應商／模型。只重試 429 與 5xx 類的錯誤；切勿重試 400 類的用戶端錯誤，那只會浪費配額。

**正確做重試**遵循三條規則：指數退避（每次失敗都等更久）、jitter（將等待時間隨機化，讓用戶端不會步調一致地同時重試，進而造成加劇停機的 thundering herd），以及遵循 `Retry-After`（OpenAI 與 Anthropic 在 429 時都會回傳它；使用 `max(retry_after, computed_backoff)`）。忽略 `Retry-After` 是最常見的 backoff 錯誤。

**斷路器（Circuit breaker）**會全域追蹤端點健康狀態，並在故障率越過閾值時開啟，讓你不再每個請求都去敲一個已死或被限流的供應商。搭配冷卻機制，把故障中的部署擱置一個固定時間窗，之後再自動恢復。

跨多個金鑰、區域與供應商的**負載平衡**會倍增你有效的 rate-limit 餘裕，這是針對容量故障最直接的結構性修正。

要內化的警告是：**盲目重試會在故障期間增加負載，從而放大停機**。Backoff、jitter、斷路器與 `Retry-After`，正是區分「修好 rate limit 的 gateway」與「讓 rate limit 變更糟的 gateway」的關鍵。參見 [可靠性模式](../13-reliability-and-safety/03-reliability-patterns.md)。

---

## 2026 年的工具版圖 {#the-2026-tool-landscape}

請把版本與確切的功能聲明視為某一時間點的快照，並注意下面有幾項比較數字來自廠商行銷。

- **LiteLLM**（開源、自架的 proxy 加上 SDK）是事實上的標準：在 OpenAI 格式 API 之後接上 100 多個供應商，提供路由策略（延遲、用量、成本、最不忙）、有序的 fallback、帶美元預算的虛擬金鑰，以及原生的 OpenTelemetry。常見的批評是 YAML 設定在企業治理規模下會吃力。
- **OpenRouter**（受管聚合器）提供最快的廣度與零維運，橫跨 200 多個模型，並以直接轉嫁的供應商定價計費（適用一筆有明文記載的 BYOK 費用）。代價是多一次外部跳轉，以及資料離開你的邊界。
- **Portkey**（受管，附帶自架層級）定位為完整的控制平面：路由、fallback、token 層級的可觀測性、語意快取與防護機制。
- **Cloudflare AI Gateway**（受管、邊緣）在可觀測性與快取上很強，搭配循序的供應商 fallback，但在路由邏輯與預算強制上較為單薄。
- **Kong AI Gateway**（API 管理平台）把 LLM 路由（包含語意路由）、重試／fallback、語意快取與 PII 清理器帶進一個成熟的 gateway；當你已經在運行 Kong 時最為合適。
- **Envoy AI Gateway**（開源、CNCF 生態系）提供基礎設施等級、以優先順序為基礎的 fallback、重試與逾時，且為 Kubernetes 原生。
- **雲端原生**路由器（AWS Bedrock intelligent prompt routing、Google Vertex）與其各自的雲整合得很緊密；但嚴格的逐帳戶 rate limit 仍讓一個多供應商層保有用處。

**自架 vs 受管**，核心的權衡是：自架（LiteLLM、Kong、Envoy）讓資料留在你的邊界內、給你完整的掌控，並且在嚴格合規下是必要的，但*你*必須讓這個 proxy 維持高可用性，否則它就會變成單點故障。受管（OpenRouter、Portkey、Cloudflare）幾乎零維運且採用快速，但資料會經過第三方，而且你會把對方的可用性當成一個硬性依賴繼承下來。

---

## 架構模式 {#architecture-patterns}

- **它落腳在哪裡：**位於應用程式服務與供應商之間，作為一個水平擴展的服務或 sidecar。所有 LLM 流量都會流經它，因此它繼承了任何關鍵路徑基礎設施的可靠性要求。
- **網路跳轉稅：**gateway 增加一次跳轉。緩解之道是把它與你的應用程式同址部署（同一區域／VPC／叢集），讓這次跳轉降到次毫秒等級、保持 proxy 輕薄，並積極快取，讓命中的請求完全跳過供應商。對照於 500-2000ms 的模型延遲，這次跳轉並不大，但在高負載下會是真實的負擔。
- **別讓 gateway 變成 SPOF：**這是核心的架構風險。在負載平衡器後方運行多個無狀態副本、把共享狀態外置（用 Redis 存放 rate-limit 與用量計數器、用資料庫存放金鑰與花費），並對副本做健康檢查。一個把所有東西都集中、卻只跑單一實例的 gateway，只不過是把你的單點故障*搬了個位置*而已。
- **多區域：**每個區域部署副本、在區域內就近路由，並使用跨區域／跨供應商的 fallback，讓某個區域性的停機能轉移到別處。
- **快取與可觀測性：**對相同的提示用精確比對、對近乎重複的提示用語意快取，並用 OpenTelemetry span 攜帶使用者／金鑰、嘗試過的模型、失敗原因、勝出的 fallback、每一步的延遲，以及確切的成本。這正是讓 rate-limit 故障模式變得可見、而非神祕難解的關鍵。參見 [可觀測性](../14-evaluation-and-observability/02-observability.md)。

---

## 你現在需要 Gateway 了嗎？ {#do-you-need-a-gateway-yet}

**大概還不需要**（用一個薄的應用程式內抽象層）當你只有單一供應商、一個原型，或一兩個供應商被包在一個小巧、還塞得進你腦袋的封裝裡時。直接呼叫 SDK 更簡單、活動零件更少。這正是 [在框架更迭中導航](../09-frameworks-and-tools/12-navigating-framework-churn.md) 中所主張的同一個薄層概念。

**你確實需要**當下列幾項成立時：3 個以上的模型或多個供應商（那 69% 的多數）；多個共享模型存取的團隊，需要虛擬金鑰、預算與花費歸因；rate-limit 錯誤真的打到你了；你的程式碼庫裡已經散落著重試／fallback／金鑰管理的邏輯（這個氣味代表採用 gateway 不再是過早之舉）；或者你沒有靠一個附帶的小專案就無法回答「這個請求是哪個供應商服務的？」或「每個團隊花了多少？」。

**自建 vs 採購：**在 1-2 個供應商時，薄的應用程式內抽象層最好；當你需要資料落地或深度掌控、而且有平台團隊的人力時，自架一個開源 gateway（先選 LiteLLM）最好；當你想要這些能力卻不想自己擁有基礎設施、而且能接受外部依賴時，採購受管方案最好。

**推進**請依此順序：先以 shadow／觀察模式開始、先移動非關鍵的工作負載、加上虛擬金鑰與預算以便在強制之前先取得歸因、加上針對你最嚴重的 rate-limit 慣犯的 fallback 鏈，接著在可靠性穩固之後再疊上快取與路由，並在 gateway 變成承重元件之前先讓它具備高可用性。

---

## 面試問題 {#interview-questions}

### Q：Rate-limit 錯誤是你最主要的生產環境故障。Gateway 如何幫上忙，又可能如何讓情況變得更糟？

**有力的回答：**
Gateway 透過跨多個金鑰、區域與供應商做負載平衡（這會倍增 rate-limit 餘裕），以及在 429 時透過有序的 fallback 鏈轉移到替代供應商來幫忙，讓單一供應商的限流不再構成硬性停機。它也讓故障變得可見：集中化的追蹤會顯示嘗試了哪個供應商、以及為何失敗。如果重試很天真，它會讓情況變得更糟：盲目、立即的重試會在供應商過載的那一刻正好又增加負載，形成一個加深停機的 thundering herd。修正方式是帶 jitter 的指數退避、遵循供應商的 `Retry-After` 標頭，以及一個能全域停止敲擊已死端點、而非逐請求重試的斷路器。而且 gateway 本身必須具備高可用性並把狀態外置，否則它只是把單點故障搬了個位置。

### Q：什麼時候一個完整的 gateway 是殺雞用牛刀，你會改用什麼做法？

**有力的回答：**
對於單一供應商或一個原型，gateway 是殺雞用牛刀；它為了你還用不到的能力，增加了一次網路跳轉與高可用性的負擔。我會用一個薄的應用程式內抽象層：在我自己的小介面之後依賴供應商 SDK，搭配一個基本的 fallback 鏈與 backoff。一旦我跨入多個供應商、多個需要預算與花費歸因的團隊，或反覆出現的 rate-limit 痛點，我才會採用一個真正的 gateway，那大致就是重試與金鑰管理邏輯開始被到處複製貼上到各服務的時候。即便如此，我也會先以 shadow 模式推進，並在它變成承重元件之前先讓它具備高可用性。

---

## 參考資料 {#references}

- Datadog，[State of AI Engineering 2026](https://www.datadoghq.com/state-of-ai-engineering/) 與 [新聞稿](https://www.datadoghq.com/about/latest-news/press-releases/datadog-state-of-ai-engineering-report-2026/)
- [LiteLLM 路由文件](https://docs.litellm.ai/docs/routing) 與 [負載平衡](https://docs.litellm.ai/docs/proxy/load_balancing)
- RouteLLM，[LMSYS 部落格](https://www.lmsys.org/blog/2024-07-01-routellm/) 與 [GitHub](https://github.com/lm-sys/routellm)
- [Envoy AI Gateway：供應商 fallback](https://aigateway.envoyproxy.io/docs/0.5/capabilities/traffic/provider-fallback/)
- [Kong AI Gateway 文件](https://developer.konghq.com/ai-gateway/)
- [OpenRouter BYOK 文件](https://openrouter.ai/docs/guides/overview/auth/byok)

---

*上一篇：[LLM 應用的 CI/CD](02-cicd.md) · 下一篇：[FinOps 與 Token 經濟學](04-finops-and-token-economics.md)*
