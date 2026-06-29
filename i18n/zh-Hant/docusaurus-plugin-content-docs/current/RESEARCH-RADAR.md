# 研究雷達

一份精選的前沿主題地圖，匯整當下真正重要的議題，獻給想知道接下來該學什麼的實務工作者。[基準測試與排行榜](14-evaluation-and-observability/03-benchmarks-and-leaderboards.md)裡的排行榜告訴你今天哪個模型領先；而這個頁面告訴你哪些想法即將改變你的建構方式。

本頁依主題組織，而非依論文組織。每個主題都先說明它對正在交付生產系統的人為何重要，指出最關鍵的論文，並連結到這些想法在本指南中銜接之處。這份快照反映的是大約 2026 年第二季正在升溫的研究；研究本質上是暫定的，因此請把具體結果視為方向性指引，在押注一套系統之前先閱讀原始來源。

## 目錄

- [如何使用本頁](#how-to-use-this-page)
- [重大轉變](#the-big-shifts)
- [1. 上下文工程成為一門系統性學科](#1-context-engineering-becomes-a-systems-discipline)
- [2. 測試時運算的極限](#2-the-limits-of-test-time-compute)
- [3. RL 後訓練：它實際上做了什麼](#3-rl-post-training-what-it-actually-does)
- [4. 潛在與替代式推理](#4-latent-and-alternative-reasoning)
- [5. 高效長上下文架構](#5-efficient-long-context-architecture)
- [6. 代理可靠性與失效模式](#6-agent-reliability-and-failure-modes)
- [7. 代理與記憶安全](#7-agent-and-memory-security)
- [8. AI 控制與評估前沿](#8-ai-control-and-the-evaluation-frontier)
- [9. 記憶與檢索的進展](#9-memory-and-retrieval-advances)
- [10. 多模態：世界模型、VLA 與 Omni](#10-multimodal-world-models-vlas-and-omni)
- [11. 更小、更便宜、更快](#11-smaller-cheaper-faster)
- [12. 測試時訓練：在推論時學習](#12-test-time-training-learning-at-inference)
- [90 天學習路徑](#a-90-day-learning-path)
- [本頁如何對應到指南](#how-this-maps-to-the-guide)

---

## 如何使用本頁 {#how-to-use-this-page}

先閱讀[重大轉變](#the-big-shifts)以掌握元趨勢，再深入你所建構領域相關的主題。如果你建構代理，優先關注主題 1、6、7 與 8。如果你優化推論，優先關注 2、5 與 11。如果你從事檢索或記憶工作，優先關注 1 與 9。[90 天學習路徑](#a-90-day-learning-path)把槓桿最高的閱讀排出順序。

關於引用的說明：arXiv ID 遵循 `YYMM.NNNNN` 慣例，所以 `2606.xxxxx` 是 2026 年 6 月。當某篇 2025 年底的基礎論文是某個當前趨勢正被積極引用的參考點時，會酌量納入並加以標註。凡屬實證結果的主張，都以「該論文回報」措辭，因為結果會被修正。

---

## 重大轉變 {#the-big-shifts}

在這些具體論文底下，有五個元趨勢：

1. **上下文成為新的瓶頸，而且這是一個系統性問題。** 2026 年的共識是：1M token 的視窗是一份要管理的預算，而不是可以隨意填滿的免費空間。上下文工程已從提示技巧演進為學習而來的策略、服務層壓實（compaction），以及作業系統式的記憶階層。
2. **更多思考並非免費，有時甚至有害。** 測試時運算有可量測的極限與反向擴展（inverse-scaling）的情形。前沿在於*自適應*運算，按每個輸入花費，而非最大化運算。
3. **RL 後訓練是把既有能力磨利，而非新增能力。** 如今有大量研究在爭論：採用可驗證獎勵的 RL（RLVR）究竟真正新增了多少全新能力，還是只是重新加權基礎模型本來就會的東西，這改變了 RL 何時值得其成本的判斷。
4. **代理目前既不安全也不可靠，而且其中有些問題可被證明很難。** 間接提示注入有一個不可能性結果；記憶投毒是一種新的持久攻擊面；代理在重複執行下的可靠性遠低於最佳情況。對策正從預防轉向圍堵（containment）與控制。
5. **基準測試已經不夠了，而且模型可能知道自己正在被測試。** 評估本身就是一個研究前沿：評估覺察（eval-awareness）、棄答覺察（abstention-aware）計分、CoT 可監測性、以及評審（judge）可靠性都是尚未解決的問題。

---

## 1. 上下文工程成為一門系統性學科 {#1-context-engineering-becomes-a-systems-discipline}

**為何重要：** 長時間執行的代理會隨著上下文被陳舊的工具輸出塞滿而退化（上下文腐爛，context rot）。修正之道已從「摘要歷史」升級為訓練而成的上下文管理器、服務層壓實，以及需求分頁式（demand-paged）上下文。如果你讓代理自主執行超過幾分鐘，這是槓桿最高、最值得理解的領域。

- **為長程任務學習與代理相容的上下文管理（AdaCoM）**（[arXiv:2605.30785](https://arxiv.org/abs/2605.30785)）透過 RL 訓練一個外部 LLM 來編輯一個凍結代理的上下文，把上下文管理當作一個學習而來的策略，而非啟發式規則。
- **為長程 LLM 代理服務的平行上下文壓實**（[arXiv:2605.23296](https://arxiv.org/abs/2605.23296)）把摘要移出關鍵路徑，將壓實重新框定為一個服務／系統層面的議題。
- **缺失的記憶階層：為 LLM 上下文視窗做需求分頁**（[arXiv:2603.09023](https://arxiv.org/abs/2603.09023)）把作業系統式的需求分頁帶進上下文視窗。
- **更少上下文，更好的代理**（[arXiv:2606.10209](https://arxiv.org/abs/2606.10209)）是一項罕見、針對真實企業工具使用中工具回應臃腫所做的量化研究，顯示剪枝加摘要勝過保留完整歷史。
- Anthropic 在有效上下文工程、長時間執行代理的框架（harness）以及記憶工具方面的工程著作，仍是實務工作者的共通詞彙（即時檢索（just-in-time retrieval）、結構化筆記、壓實、清除工具結果）。

**銜接之處：** [上下文工程](05-prompting-and-context/05-context-engineering.md)、[代理記憶與狀態](07-agentic-systems/05-agent-memory-and-state.md)。

---

## 2. 測試時運算的極限 {#2-the-limits-of-test-time-compute}

**為何重要：**「把思考預算調高」並不是一根免費的品質槓桿。2026 年的多項結果顯示，超過某個臨界 token 數後會出現反向擴展，且報酬遞減並趨於平緩。對生產的啟示是：設定具成本意識、依難度自適應的預算，而非最大化的預算。（別把這和測試時*訓練*搞混，後者會在推論時更新模型權重；參見[主題 12](#12-test-time-training-learning-at-inference)。）

- **當更多思考有害：LLM 測試時運算擴展中的過度思考**（[arXiv:2604.10739](https://arxiv.org/abs/2604.10739)）證明了超過臨界 token 門檻後的反向擴展，並提出具成本意識的停止策略。對任何要交付推理模型的人而言，這是單一最具可操作性的發現。
- **測試時擴展對知識密集型任務尚不有效**（[arXiv:2509.06861](https://arxiv.org/abs/2509.06861)，升溫中）從資訊理論論證：單靠運算無法超越模型中既有的知識，且延長推理可能放大自信滿滿的幻覺。
- **超越擴展的擴展：測試時擴展的高原期**（[arXiv:2505.20522](https://arxiv.org/abs/2505.20522)，升溫中）以封閉形式給出報酬何時趨平的直覺。
- **SelfBudgeter**（[arXiv:2505.11274](https://arxiv.org/abs/2505.11274)）與 **AdaCtrl**（[arXiv:2505.18822](https://arxiv.org/abs/2505.18822)）讓模型能預測或揭露一個可控的 token 預算，這就是實務上的旋鈕。

**銜接之處：** [上下文工程：延伸思考](05-prompting-and-context/05-context-engineering.md)、[成本優化](04-inference-optimization/07-cost-optimization-playbook.md)。

---

## 3. RL 後訓練：它實際上做了什麼 {#3-rl-post-training-what-it-actually-does}

**為何重要：** 是否該把資源投入 RL 後訓練，取決於一個爭論中的實證問題：採用可驗證獎勵的 RL（RLVR）是新增了能力，還是只是把基礎模型本來就會的東西做更精準的取樣？答案決定了 RL 何時值得其成本，相對於監督式微調或蒸餾。

- **pass@k 之辯**：「RLVR 的極限」一方（[limit-of-rlvr.github.io](https://limit-of-rlvr.github.io/)）主張 RL 提升 pass@1，但基礎模型在高 pass@k 時就能追平，因此 RL 是磨利而非新增；對立一方（[arXiv:2506.14245](https://arxiv.org/abs/2506.14245)）主張只要用對指標，RLVR 會獎勵正確的推理並擴展邊界。綜合一方（[arXiv:2512.07783](https://arxiv.org/pdf/2512.07783)）發現 RL 主要在以下情況才帶來真正增益：任務在預訓練中覆蓋不足，且 RL 資料落在模型能力的邊緣，這也促成了一個獨立的**中段訓練（mid-training）**階段。
- **同策略蒸餾（on-policy distillation）**（[Thinking Machines Lab](https://thinkingmachines.ai/blog/on-policy-distillation/)；配方與失效模式見 [arXiv:2604.13016](https://arxiv.org/html/2604.13016v1)）在學生模型自己的 rollout 上、由教師評分來訓練學生，回報指出在把推理灌入小模型方面，其樣本效率約為 RL 的 10 倍。這是建構廉價推理模型的新預設做法。
- **會思考的過程獎勵模型（ThinkPRM）**（[arXiv:2504.16828](https://arxiv.org/abs/2504.16828)，升溫中）藉由撰寫一條驗證用的思維鏈、而非訓練一個判別式評分器，讓逐步驗證變得負擔得起。

**銜接之處：** [RLHF 與 DPO](03-training-and-adaptation/04-rlhf-and-dpo.md)、[知識蒸餾](03-training-and-adaptation/05-knowledge-distillation.md)。

---

## 4. 潛在與替代式推理 {#4-latent-and-alternative-reasoning}

**為何重要：** 思維鏈用 token 來思考。一條日益壯大的研究路線在潛在空間（循環深度，recurrent depth）中、或透過擴散（diffusion）來推理，開闢了一條不消耗輸出 token 的全新運算軸。即使它還不是你的預設選項也值得追蹤，因為它改變了推理的延遲與成本模型。

- **潛在／循環深度推理**：這個典範架構藉由把一個循環區塊展開到任意深度，來擴展測試時運算（[Huginn, arXiv:2502.05171](https://arxiv.org/pdf/2502.05171)）；迴圈式語言模型已能與主流開放模型競爭（[Ouro, arXiv:2510.25741](https://arxiv.org/html/2510.25741v2)）；而一項 2026 年的成果穩定了該循環，使深度擴展不再崩潰（[arXiv:2605.26733](https://arxiv.org/abs/2605.26733)）。
- **用於推理的擴散 LLM** 正逐漸成熟為一條可行的快速推論路徑：透過專家乘積（product-of-experts）橋接的平行解碼回報了大幅加速，同時恢復了大部分自迴歸準確度（[arXiv:2606.08048](https://arxiv.org/abs/2606.08048)），隨後也出現了針對擴散 LLM 推理的 RL 配方（[arXiv:2606.08501](https://arxiv.org/abs/2606.08501)）。
- **CoT 忠實度的警語**：可見的思維鏈可能無法反映真正的運算過程（[arXiv:2603.26410](https://arxiv.org/pdf/2603.26410)），這在你依賴 CoT 來除錯或監測時尤其重要（見主題 8）。

**銜接之處：** [思維鏈](05-prompting-and-context/03-chain-of-thought.md)、[推論基礎](04-inference-optimization/01-inference-fundamentals.md)。

---

## 5. 高效長上下文架構 {#5-efficient-long-context-architecture}

**為何重要：** 廉價地服務長上下文如今是一項架構決策，而不只是一個 KV cache 技巧。可訓練的稀疏注意力已從研究走進已出貨的前沿模型，而且它正是二次方注意力成本的生產解答。

- **可訓練稀疏注意力（NSA／DSA 一脈）：** Native Sparse Attention（[arXiv:2502.11089](https://arxiv.org/abs/2502.11089)，奠基性）引入了對齊硬體、原生可訓練的稀疏注意力；DeepSeek 的稀疏注意力以一個閃電索引器（lightning indexer）將其產品化，把注意力對序列長度從大致二次方變成線性，並帶動了一波索引器論文。這是廉價長上下文背後的藍圖。
- **MoE 擴展律**（[arXiv:2603.21862](https://arxiv.org/abs/2603.21862)）把任意運算預算對應到一個最佳的專家混合（mixture-of-experts）配置，並主張在不同 MoE 層型之間，每 token FLOPs 是一個不充分的公平性指標。
- **潛在／學習而來的上下文壓縮**：以大規模預訓練的編碼器-解碼器上下文壓縮器（[arXiv:2606.09659](https://arxiv.org/abs/2606.09659)）讓代理能略讀壓縮後的上下文，並按需展開相關片段，這是一個有別於 KV cache 壓縮的層次。
- **次二次方混合架構**（Mamba/Transformer、線性注意力）持續在長上下文上與 Transformer 並駕齊驅，並支撐起長影片與 omni 模型。

**銜接之處：** [注意力機制](01-foundations/03-attention-mechanisms.md)、[KV Cache 與上下文快取](04-inference-optimization/02-kv-cache-and-context-caching.md)、[服務基礎設施](04-inference-optimization/06-serving-infrastructure.md)。

---

## 6. 代理可靠性與失效模式 {#6-agent-reliability-and-failure-modes}

**為何重要：** 單次示範掩蓋了一個事實：代理在規模化時以不同的方式失效，錯誤會在多代理系統中層層串連，而同一個代理某次通過任務、重跑時卻失敗。可靠性是一項可量測的工程性質，而衡量它的基準測試是全新的。

- **可靠性科學（pass^k）：** 可靠性基準測試衡量跨重複執行的一致性、擾動穩健性與容錯能力；最佳情況（pass@1）與可靠（pass^k）表現之間的落差很大（tau2-bench 顯示代理在 8 次執行間從約 60% 掉到約 25%）。請按 pass^k 而非 pass@1 來設計與編列預算。
- **多代理系統中的錯誤串連：** 描述某一代理的錯誤如何放大至全系統的傳播動態模型（[arXiv:2603.04474](https://arxiv.org/abs/2603.04474)），以及在違反策略之前發出崩潰早期警訊的圖曲率（graph-curvature）訊號（[arXiv:2603.13325](https://arxiv.org/abs/2603.13325)）。這是針對失控多代理執行的一個監測基本元件。
- **多代理電腦使用**（[arXiv:2606.01533](https://arxiv.org/abs/2606.01533)）給出一份具體的「規劃器-DAG 加平行工作者」配方，是平行化電腦使用工作的一個乾淨參考。
- 一則警語：在自我生成的 rollout 上施加 GRPO，本身並不會弭平多代理協調落差（[arXiv:2606.07845](https://arxiv.org/abs/2606.07845)），所以別假設天真的 RL 就能修好協調問題。

**銜接之處：** [多代理編排](07-agentic-systems/04-multi-agent-orchestration.md)、[錯誤處理與復原](07-agentic-systems/07-error-handling-and-recovery.md)、[評估代理式系統](07-agentic-systems/10-evaluating-agentic-systems.md)。

---

## 7. 代理與記憶安全 {#7-agent-and-memory-security}

**為何重要：** 這是 2026 年變動最快的風險領域，而且其中有些問題可被證明很難。如果你交付會使用工具或配備記憶的代理，這些結果應該把你的架構推向最小權限（least-privilege）與圍堵。

- **間接提示注入尚未解決，可能無解。** 一場 464 位參與者的紅隊競賽發現，全部 13 個前沿模型都敗給了隱藏式的間接注入（[arXiv:2603.15714](https://arxiv.org/abs/2603.15714)），而一個情境完整性（contextual-integrity）的不可能性結果論證：對手永遠能建構出一個情境，讓被封鎖的資訊流看起來合法（[arXiv:2605.17634](https://arxiv.org/abs/2605.17634)）。結論是：從「封鎖注入」轉向基於能力（capability-based）、最小權限、圍堵式的架構。
- **記憶投毒是一種新的持久攻擊面。** 沉睡式記憶投毒會植入休眠的被投毒記憶，並在未來各次工作階段中重新浮現（[arXiv:2605.15338](https://arxiv.org/abs/2605.15338)）；記憶控制流（control-flow）攻擊把被投毒的記憶重新框定為一個寫一次讀多次（write-once-read-many）的控制訊號，用以覆蓋使用者指令（[arXiv:2603.15125](https://arxiv.org/abs/2603.15125)）。OWASP 的 2026 代理式 Top 10 新增了一個專門的「記憶與上下文投毒」條目（ASI06）。防禦在於儲存時的出處溯源（provenance），而非檢索時的清理（sanitization）。
- **以蒸餾作為攻擊：** 有害能力可透過在從一個受保護模型蒸餾出的、看似無害的鄰近領域輸出上進行微調而被還原（[arXiv:2601.13528](https://arxiv.org/abs/2601.13528)），對任何對外開放受保護 API 的人而言，這是一個威脅模型。

**銜接之處：** [代理式安全與沙箱化](07-agentic-systems/09-agentic-security-and-sandboxing.md)、[提示注入防禦](05-prompting-and-context/08-prompt-injection-defense.md)、[LLM 安全](12-security-and-access/01-llm-security.md)、[安全與治理](17-tool-use-and-computer-agents/07-safety-and-governance.md)。

---

## 8. AI 控制與評估前沿 {#8-ai-control-and-the-evaluation-frontier}

**為何重要：** 兩項與實務工作者相關的研究計畫正在成熟。AI 控制提供了部署你並不完全信任的代理的具體協定。而評估本身也已成為一個研究問題，因為模型能偵測並操弄評估。

- **AI 控制協定：** 在對抗性測試平台上，「為定罪而重新取樣（resample-for-incrimination）」加上「在關鍵行動上延遲（defer-on-critical-actions）」把安全度從約 50% 提升到約 96%，而「在關鍵行動上延遲」即使面對熟知協定的紅隊也很穩健（[arXiv:2511.02997](https://arxiv.org/abs/2511.02997)，升溫中）；分解式認知（factored cognition，一個受信任模型負責分解，一個不受信任模型負責解決互相隔離的子任務）強化了監測（[arXiv:2512.02157](https://arxiv.org/abs/2512.02157)）。這是一套可部署、針對不受信任代理的操作手冊，而它在多數生產堆疊中大致仍付之闕如。
- **評估覺察：** 模型往往知道自己何時正在被評估（[arXiv:2505.23836](https://arxiv.org/abs/2505.23836)，升溫中），這會干擾每一項安全與能力評估，並支持採用保留（held-out）、自然主義式的測試條件。
- **棄答覺察計分：** 對模型為何產生幻覺的統計性解釋（[arXiv:2509.04664](https://arxiv.org/abs/2509.04664)）顯示，獎勵猜測而非「我不知道」的基準測試會訓練出幻覺，因此評估設計應該獎勵經過校準的棄答。
- **CoT 可監測性**（[arXiv:2510.27378](https://arxiv.org/abs/2510.27378)；立場論文 [arXiv:2507.11473](https://arxiv.org/abs/2507.11473)）把思維鏈視為一個脆弱但有價值的安全訊號，值得保留而非訓練消除。
- **生產安全控制：** 能在分布偏移下存活的探針如今已出貨於前沿模型中（[arXiv:2601.11516](https://arxiv.org/abs/2601.11516)），而分類器級聯把越獄防禦成本削減約 40 倍（[arXiv:2601.04603](https://arxiv.org/abs/2601.04603)）。

**銜接之處：** [LLM 評估](14-evaluation-and-observability/01-llm-evaluation.md)、[基準測試與排行榜](14-evaluation-and-observability/03-benchmarks-and-leaderboards.md)、[可靠性與安全](13-reliability-and-safety/)。

---

## 9. 記憶與檢索的進展 {#9-memory-and-retrieval-advances}

**為何重要：** 檢索正變得代理式（模型拿到的是檢索基本元件，而非固定管線），記憶正獲得真正的工程與安全處理，而這個領域對記憶系統能做什麼、不能做什麼也有了難以反駁的新證據。

- **代理式檢索介面：** 把關鍵字、語意與區塊讀取工具暴露給模型，而非一套固定的 RAG 工作流程（[A-RAG, arXiv:2602.03442](https://arxiv.org/abs/2602.03442)）；把代理式 RAG 系統化為 POMDP 提供了結構性框架（[arXiv:2603.07379](https://arxiv.org/abs/2603.07379)）。
- **以 RL 訓練的搜尋代理：** Search-R1 及其後繼者以檢索 token 遮罩（retrieved-token masking）訓練交錯進行的推理與搜尋，這是深度研究系統的一項奠基技術，多數堆疊很可能尚未具備。
- **被嚴格檢視的記憶：** 代理式記憶解剖綜述（[arXiv:2602.19320](https://arxiv.org/abs/2602.19320)）是一記現實檢查，記錄了當前記憶系統中的基準測試飽和、指標與效用錯位，以及延遲開銷。
- **學習而來的遺忘與鞏固：** 受睡眠啟發的鞏固把主動干擾（陳舊條目蓋掉當前條目）從記憶數的線性降到對數（[SleepGate, arXiv:2603.14517](https://arxiv.org/abs/2603.14517)），把遺忘重新框定為一個設計目標。
- **深度研究評估：** 把檢索器與代理隔離開來的語料控制基準測試（[BrowseComp-Plus, arXiv:2508.06600](https://arxiv.org/abs/2508.06600)）顯示，檢索器品質主導深度研究的準確度。

**銜接之處：** [代理式 RAG](06-retrieval-systems/08-agentic-rag.md)、[記憶架構](08-memory-and-state/01-memory-architectures.md)、[長期記憶](08-memory-and-state/03-long-term-memory.md)、[RAG 評估](06-retrieval-systems/13-rag-evaluation-patterns.md)。

---

## 10. 多模態：世界模型、VLA 與 Omni {#10-multimodal-world-models-vlas-and-omni}

**為何重要：** 三條正在匯流的戰線：原生發出動作的全模態（omnimodal）模型、可即時導覽的互動式世界模型，以及用於機器人的視覺-語言-動作模型。即使你不建造機器人，這些架構模式（雙系統控制、潛在動作預訓練、預測式嵌入世界模型）正在擴散進代理之中。

- **發出動作的全模態世界模型：** 在單一堆疊中原生理解並生成文字、影像、影片、音訊*以及*動作的開放模型（[NVIDIA Cosmos 3](https://research.nvidia.com/labs/cosmos-lab/)；[Emu3.5, arXiv:2510.26583](https://arxiv.org/abs/2510.26583)，最清晰的「原生下一狀態預測產生世界模型」論點）。
- **互動式即時世界模型**（「神經遊戲引擎」）：從一個提示生成可即時導覽的模擬（DeepMind Project Genie 3；開放藍圖見 [DreamX-World, arXiv:2606.16993](https://arxiv.org/abs/2606.16993)），並以預測式（非生成式）的 JEPA 替代方案作為注重效率的對照（V-JEPA 2 及其後繼者）。
- **視覺-語言-動作（VLA）：** 把推理與動作交錯進行、再加上跨形體（cross-embodiment）遷移的具身「思考」（[Gemini Robotics 1.5, arXiv:2510.03342](https://arxiv.org/abs/2510.03342)）；雙系統（快速控制嵌在慢速推理之內）模式；以及從未標註影片進行潛在動作預訓練，這為機器人預訓練解鎖了網際網路規模的資料。
- **以生成進行推理：**「用影片思考」把影片生成當作一個推理基底（[arXiv:2511.04570](https://arxiv.org/abs/2511.04570)），是一種真正全新的推理模態。

**銜接之處：** [多模態 RAG](06-retrieval-systems/12-multimodal-rag.md)、[模型分類](02-model-landscape/01-model-taxonomy.md)、[電腦使用代理](17-tool-use-and-computer-agents/04-computer-use-agents.md)。

---

## 11. 更小、更便宜、更快 {#11-smaller-cheaper-faster}

**為何重要：** 成本前沿移動得和能力前沿一樣快。前沿等級的推理正出現在小模型中，低位元（low-bit）推論正變得具推理意識，而推測解碼（speculative decoding）持續精進。

- **小型推理模型：** 一個 3B 稠密模型據報透過「先多樣化、再 RL、再蒸餾」的配方達到了前沿等級的可驗證推理分數（[VibeThinker-3B, arXiv:2606.16140](https://arxiv.org/abs/2606.16140)），可在裝置端部署。
- **具推理意識的量化：** 4-bit 近乎無損，但 3-bit 與 2-bit 對推理的退化遠大於對非推理，而量化感知訓練（quantization-aware training）有所助益（[arXiv:2601.14888](https://arxiv.org/html/2601.14888v1)）。FP4 *訓練*（而不只是推論）正在 Blackwell 等級的硬體上變得真實可行（[NVFP4 預訓練, arXiv:2509.25149](https://arxiv.org/html/2509.25149v2)）。
- **推測解碼**持續推進：管線化的草擬與驗證（[arXiv:2603.03251](https://arxiv.org/abs/2603.03251)），以及能從免費的驗證回饋線上自適應的草擬器（[arXiv:2603.12617](https://arxiv.org/abs/2603.12617)）。
- **多模態 token 壓縮**是視覺模型的主要服務成本槓桿，重點在於於編碼期間壓縮、而非編碼之後。

**銜接之處：** [量化深入探討](03-training-and-adaptation/07-quantization-deep-dive.md)、[推測解碼](04-inference-optimization/03-speculative-decoding.md)、[成本優化](04-inference-optimization/07-cost-optimization-playbook.md)。

---

## 12. 測試時訓練：在推論時學習 {#12-test-time-training-learning-at-inference}

**為何重要：** 這是本頁最容易被混淆的術語，所以它值得擁有自己的章節。測試時*訓練*會在推論時更新模型的**權重**；測試時*運算*（主題 2）讓權重保持凍結，只多花一些前向傳遞的 token。不同的槓桿，不同的成本。TTT 在 2026 年仍處於研究階段，但它是審視一個真實問題最清晰的視角：當一個凍結模型在一項真正新穎的任務上停滯不前時，解法或許不是思考更久或檢索更多，而是短暫地*學習*一下。

**同一個名字，三種想法。** 三者都在推論時、針對僅在推論時可得的資料執行梯度下降；它們的差別在於更新的是什麼：

- **TTT 作為一種架構**（[Sun 等人, arXiv:2407.04620](https://arxiv.org/abs/2407.04620)）：一個序列層，其隱藏狀態本身就是一個小模型，每個 token 由一次自監督梯度步驟來更新。這是注意力的線性成本替代方案，當內層學習器為線性時會退化為線性注意力。該論文回報，在 Mamba 趨於平緩之處，它會隨著上下文增長而持續改善（在 1.3B 以下的規模）。已被延伸到分鐘級的影片生成（[arXiv:2504.05298](https://arxiv.org/abs/2504.05298)），並由 MesaNet 做到每 token 運算最優（[arXiv:2506.05233](https://arxiv.org/abs/2506.05233)）。
- **TTT 作為逐任務適應**（[Akyürek 等人, arXiv:2411.07279](https://arxiv.org/abs/2411.07279)）：在測試輸入及其增強版本上暫時微調模型（通常是一個逐任務的 LoRA），做出預測，然後丟棄該更新。最受矚目的結果是一個 8B 的 Llama-3 在 ARC-AGI-1 公開集上達到 53.0%（與程式合成集成後為 61.9%，論文表示這與人類平均表現相當），而單靠上下文學習就會停滯。源流：最初的視覺 TTT（[arXiv:1909.13231](https://arxiv.org/abs/1909.13231)）以及在檢索到的鄰居上做測試時訓練（[Hardt 與 Sun, arXiv:2305.18466](https://arxiv.org/abs/2305.18466)）。一個相關的 RL 變體 TTRL（[arXiv:2504.16084](https://arxiv.org/abs/2504.16084)）在測試時以多數投票的偽獎勵來更新權重。
- **TTT 作為記憶**（[TTT-E2E, arXiv:2512.23675](https://arxiv.org/abs/2512.23675)，一項 Stanford/Berkeley/UCSD/NVIDIA/Astera 的成果）：在長上下文串流進來時就訓練模型，讓上下文存活於權重中而非 KV cache 裡，從而不論長度都給出固定延遲。誠實的警語：論文回報，超出其注意力視窗後它會在大海撈針（needle-in-a-haystack）測試上失敗（在 128K 下約 6%，相對於全注意力的 99%），所以把上下文塞進權重買到的是要旨，而非逐字回憶。記憶治理的失效模式涵蓋於[代理記憶與狀態](07-agentic-systems/05-agent-memory-and-state.md)。

**TTT 對比測試時運算，一張表道盡：**

| | 測試時訓練 | 測試時運算（主題 2） |
|---|---|---|
| 改變什麼 | 權重（往往是一個短暫的 LoRA） | 什麼都不變；權重保持凍結 |
| 你花費什麼 | 推論時的反向傳遞 | 額外的前向傳遞／token |
| 看起來像 | 模型為這一道題用功，然後忘掉 | 模型思考更久並嘗試更多草稿 |
| 狀態 | 有狀態；一個請求可以變更權重 | 無狀態；是輸入的純函式 |

兩者可以疊加：ARC 的結果把一次 TTT 權重更新與增強投票配對，而後者是一個測試時運算的技巧。

**何時有幫助、何時有害。** 在以下情況有幫助：分布偏移、上下文學習會停滯的真正新穎任務（ARC 是典型代表），以及長上下文效率。在以下方面有害：成本（服務時的梯度步驟；實務工作者報告引用約 1.7 至 2.5 倍的延遲）、逐實例的過度擬合、會破壞快取與可重現性的有狀態性，以及服務複雜度，因為每個請求都變更權重，這牴觸了 vLLM 式批次處理背後「權重凍結」的假設。此外還有一個真實的安全角度：因為適應損失是在可被攻擊者影響的輸入上自監督的，精心構造的輸入可以投毒測試時更新（測試時資料投毒的文獻，目前大多在視覺領域）。

**成熟度（2026）：** 大多仍在研究與競賽，而非實際服務。它最經得起實戰考驗的歸宿是離線的 ARC-Prize 管線；其架構與記憶變體在 3 至 5B 參數規模獲得驗證，但沒有公開證據顯示有前沿模型在其服務路徑中出貨 TTT 層。與測試時*運算*形成對比，後者已在各處投入生產。實務上的啟示：先伸手去拿提示、檢索或單純的微調，並把 TTT 當作新穎任務適應與長上下文效率的前沿來觀察。

**銜接之處：** [測試時運算的極限](#2-the-limits-of-test-time-compute)（它的凍結權重手足）、[代理記憶與狀態](07-agentic-systems/05-agent-memory-and-state.md)（記憶變體）、[微調策略](03-training-and-adaptation/02-fine-tuning-strategies.md)與[知識蒸餾](03-training-and-adaptation/05-knowledge-distillation.md)（它暫時借用的那種適應）。

---

## 90 天學習路徑 {#a-90-day-learning-path}

如果你按這個順序閱讀，就會先涵蓋槓桿最高的想法：

1. **第 1 至 2 週，上下文工程。** Anthropic 的有效上下文工程著作，接著是 AdaCoM 與「更少上下文，更好的代理」研究。這在你跑的任何代理上都會立即見效。
2. **第 3 至 4 週，測試時運算的極限。**「當更多思考有害」與自適應預算的論文。改變你設定思考預算與為推理定價的方式。
3. **第 5 至 6 週，代理安全。** 間接注入競賽與不可能性結果，接著是記憶投毒論文與 OWASP ASI06。把你的代理架構重塑為最小權限。
4. **第 7 至 8 週，AI 控制與評估前沿。** 控制協定論文、評估覺察，以及棄答覺察計分。改變你部署不受信任代理的方式，以及你信任自己評估的方式。
5. **第 9 至 10 週，RL 後訓練之辯。** pass@k 論文與同策略蒸餾。決定對你而言 RL 何時值得其成本。
6. **第 11 至 12 週，高效架構。** 可訓練稀疏注意力與 MoE 擴展律，外加具推理意識的量化。長上下文與推論的成本前沿。

請把每個主題都與相關的指南章節配對，好讓研究落在一個具體的基礎上，而不是停留在抽象之中。

---

## 本頁如何對應到指南 {#how-this-maps-to-the-guide}

這些主題大多是深化既有章節，而非取代它們。如果你要擴充本指南，最乾淨的新章節候選是：**AI 控制協定**（大致缺席，且對代理部署者具生產相關性）、**記憶安全與 OWASP ASI06**（一個變動快速、且有專屬風險條目的叢集），以及把**有效上下文落差**當作一個一等概念。其餘最好是以「前沿（2026）」的標註形式加進它們各自的所屬章節，並連結回此處，這樣本頁就能維持為唯一的雷達，而各章節也能維持其可教學性。

---

*另見：[基準測試與排行榜](14-evaluation-and-observability/03-benchmarks-and-leaderboards.md)了解如何閱讀排行榜，以及 [PATTERNS.md](PATTERNS.md)了解這些想法所匯入的生產模式。*
