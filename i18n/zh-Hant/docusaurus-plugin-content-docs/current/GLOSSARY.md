# AI 系統設計術語表

本指南通篇使用的關鍵術語快速參考。

---

## A

**Agentic Coding（代理式編碼）** - LLM 自主編輯檔案、執行 shell 命令、撰寫測試並反覆迭代，直到編碼任務完成為止。代表案例有 Claude Code、OpenHands 與 Cline。

**Agentic System（代理式系統）** - 使用工具自主規劃並執行多步驟任務的 LLM 應用程式。

**AI Control（AI 控制）** - 一種安全方法，假設模型可能未對齊，並設計部署協定（監控、關鍵動作時延後處理、重新取樣、分解認知）以在這種情況下仍保持安全。它有別於對齊（alignment），對齊的目標是讓模型一開始就值得信賴。請參閱 [Research Radar](RESEARCH-RADAR.md)。

**AI Gateway（AI 閘道）** - 介於你的應用程式與模型供應商之間的控制平面代理（LiteLLM、OpenRouter、Portkey、Kong）。它對外提供單一個與 OpenAI 相容的 API，並集中處理路由、備援、負載平衡、速率限制處理、虛擬金鑰與預算、快取，以及可觀測性。請參閱 [AI Gateways and Model Routing](11-infrastructure-and-mlops/03-ai-gateways-and-model-routing.md)。

**Attention Mechanism（注意力機制）** - 神經網路元件，讓模型能夠聚焦於輸入中相關的部分。自注意力（self-attention）會將每個 token 與其他所有 token 進行比較。

**ABAC（Attribute-Based Access Control，屬性型存取控制）** - 根據使用者、資源與環境的屬性，而非固定角色，來進行存取控制。

---

## B

**Batching（批次處理）** - 將多個請求一起處理以提升 GPU 使用率。連續批次處理（continuous batching）會在其他請求仍在生成時加入新的請求。

**Benchmark Saturation（基準測試飽和）** - 當前沿模型聚集得太靠近某個基準測試的上限，以致分數差異落在雜訊範圍內（提示措辭、執行變異），使該基準測試不再能區分模型。MMLU、HumanEval 與 GSM8K 都已飽和。請參閱 [Benchmarks and Leaderboards](14-evaluation-and-observability/03-benchmarks-and-leaderboards.md)。

**BM25** - 傳統的關鍵字型排序演算法。常與向量搜尋結合以進行混合檢索。

**Budget Tokens** - Extended Thinking（Claude）或推理（o3）可設定的運算預算。預算越高，內部推理步驟越多，準確度與成本也越高。

---

## C

**C2PA（Content Credentials）** - 一項開放標準，以密碼學方式將來源出處的詮釋資料（由誰製作、是否有 AI 參與、做了哪些編輯）綁定到媒體資產上，並具備防竄改的硬綁定，以及能在重新編碼後存活的浮水印型軟綁定。它是 AI 內容標示法規背後的來源出處層；由於可被移除，因此應與浮水印及偵測技術分層搭配使用。請參閱 [Multimodal Generation](19-multimodal-generation/01-multimodal-generation.md)。

**Capability Index（綜合基準測試，Composite Benchmark）** - 將許多基準測試加權彙整而成的指標（例如 Artificial Analysis Intelligence Index、Epoch Capability Index、給代理用的 HAL），用來為前沿模型排名，使排名在個別基準測試飽和後仍能持續區分高下。

**Chain-of-Thought（CoT，思維鏈）** - 一種提示技巧，在給出最終答案之前引導出逐步推理。

**Chunking（分塊）** - 將文件切分成較小的片段以進行嵌入與檢索。策略包括固定大小、語意，以及階層式分塊。

**Claude Code** - Anthropic 的終端機原生自主編碼代理。它使用 bash、text_editor 與 computer 工具，在整個專案範圍內讀取、編輯並執行程式碼。透過 CLAUDE.md 清單檔案來控制。

**Claude Fable 5** - Anthropic 最強大且廣泛釋出的模型（2026 年 6 月 9 日，`claude-fable-5`）。這是一款經過安全處理以供一般使用的 Mythos 級模型：每 1M 為 $10/$50、1M 上下文、自適應思考永遠開啟。敏感查詢在不到 5% 的工作階段中會回退至 Claude Opus 4.8。未受限制的變體 Claude Mythos 5 僅限 Project Glasswing 夥伴使用。

**Cline** - 開源的 VS Code 擴充套件，透過工具使用（檔案編輯、終端機、瀏覽器）提供自主 AI 編碼。原生支援 MCP。

**Computer-Use** - 一種模型能力（Claude 3.5+ 原生支援），可透過模擬滑鼠點擊、鍵盤輸入與螢幕截圖來控制 GUI。可實現瀏覽器與桌面自動化。

**Context7** - 一款 MCP 伺服器，在執行階段擷取最新的函式庫文件，解決編碼代理「訓練資料過時」的問題。

**Context Window（上下文視窗）** - LLM 在單一請求中能處理的最大 token 數量。範圍從 4K 到 1M+ token。

**Context Rot（上下文腐化）** - 隨著無關或過時的 token 在上下文視窗中累積，輸出品質隨之劣化，且往往在遠未達到宣稱上限之前就發生。這促成了壓實（compaction）與即時檢索（just-in-time retrieval）的做法。請參閱 [Context Engineering](05-prompting-and-context/05-context-engineering.md)。

**Cosine Similarity（餘弦相似度）** - 衡量兩個向量之間相似程度的方法。比較嵌入的標準度量。

**Cursor** - AI 原生 IDE（VS Code 的分支），具備深度模型整合，可進行程式碼補全、代理式編輯，以及多檔案上下文感知。

---

## D

**Data Contamination（資料汙染）** - 當基準測試的題目或其答案洩漏進模型的訓練資料中，透過記憶而非能力來灌水分數。可用時間閘控、私有，或保留（held-out）測試集來反制。請參閱 [Benchmarks and Leaderboards](14-evaluation-and-observability/03-benchmarks-and-leaderboards.md)。

**Diffusion Language Model（擴散語言模型）** - 一種非自回歸的 LLM，透過平行地反覆對遮罩序列去雜訊來生成文字，而非由左至右生成，以犧牲部分品質換取大幅提升的吞吐量（據報導可達 1,000+ token/秒）。在程式碼與填空（infilling）上表現強勁；2026 年仍處於早期階段。請參閱 [Diffusion Language Models](04-inference-optimization/08-diffusion-llms.md)。

**DPO（Direct Preference Optimization，直接偏好最佳化）** - 一種微調方法，直接針對偏好資料進行最佳化，無需獨立的獎勵模型。

**DSPy** - 透過可最佳化的模組（而非手動提示）來編寫 LLM 程式的框架。

**Durable Execution（持久執行）** - 一種執行模型（Temporal、Restate、DBOS），透過僅可追加的事件歷史與確定性重播，讓長時間執行的代理能在當機與重新啟動後存活，提供恰好一次（exactly-once）的副作用、持久計時器，以及能跨越部署存活的暫停。請參閱 [Durable Execution](07-agentic-systems/11-durable-execution.md)。

---

## E

**Effective Context Length（有效上下文長度）** - 模型仍能維持品質的上下文長度，通常比宣稱的視窗短。在 RULER 上，許多宣稱 128K 的模型其實只能維持品質到約 32-64K。設計時應以有效上下文為準，而非宣稱的上下文。

**Embedding（嵌入）** - 文字的稠密向量表示。用於語意搜尋與相似度比較。

**Endpointing（Turn Detection，回合偵測）** - 在語音代理中，判斷使用者是否已說完話，好讓代理能夠回應。經學習的回合偵測模型會在語意完整的想法出現時觸發，勝過會讓每個回合都付出代價的固定靜默逾時。請參閱 [Real-Time Voice Agents](18-voice-and-audio-agents/01-realtime-voice-agents.md)。

**Ensemble（集成）** - 結合多個模型的輸出以提升可靠度。包括投票、辯論，以及代理混合（mixture-of-agents）。

**Eval Awareness（評估覺察）** - 模型偵測到自己正在被評估，並隨之改變行為的傾向，這會干擾安全與能力基準測試，並支持採用自然、保留（held-out）的測試條件。

**Extended Thinking** - Claude（3.7+）的內部推理模式，模型在產生回應之前會先進行一輪草稿紙式推理。可透過 `thinking.budget_tokens` 設定。預設不會顯示給終端使用者。

**EU AI Act（歐盟 AI 法案）** - 法規 (EU) 2024/1689，是第一部全面性的 AI 法律，依風險層級（禁止、高風險、有限、最小）建構，並另有針對 GPAI 的義務，罰款最高可達全球營業額的 7%。禁止項目與 GPAI 規則自 2026 年起可強制執行；高風險義務暫時延後至約 2027 年。請參閱 [AI Governance and Compliance](13-reliability-and-safety/04-ai-governance-and-compliance.md)。

---

## F

**Few-Shot Prompting（少樣本提示）** - 在提示中納入範例以引導模型行為。

**Fine-Tuning（微調）** - 在特定任務的資料上訓練預先訓練好的模型以提升表現。

**FinOps for AI（AI 的 FinOps）** - 衡量、歸因並最佳化 AI 支出的學科：每 token／每請求／每任務的成本、提示快取、批次經濟效益、showback 與 chargeback，以及單位經濟效益。請參閱 [FinOps and Token Economics](11-infrastructure-and-mlops/04-finops-and-token-economics.md)。

**Framework Churn（框架更迭）** - AI 編排框架（LlamaIndex、LangChain）快速且破壞性的演進，大約每年就會重新洗牌套件結構並移除抽象層，使得在全新安裝環境下，較舊的教學與課程都會失效。應對之道是釘住／鎖定版本，並學習基本原語而非 API。請參閱 [Navigating Framework Churn](09-frameworks-and-tools/12-navigating-framework-churn.md)。

**Function Calling（函式呼叫）** - LLM 輸出結構化工具調用而非純文字的能力。

---

## G

**GGUF** - llama.cpp、Ollama 與 LM Studio 用於本地推論的量化模型檔案格式。量化等級以品質換取大小；Q4_K_M 是實務上的甜蜜點。請參閱 [On-Device and Edge Deployment](04-inference-optimization/09-on-device-and-edge-deployment.md)。

**Guardrails（防護機制）** - 輸入／輸出驗證，用以防止有害或離題的回應。

**Grounding（接地）** - 將 LLM 的回應連結到事實來源以減少幻覺。

**Grok 4.3** - xAI 的前沿推理模型。在推理基準測試上與 GPT-5.5、Claude Opus 4.7 與 Gemini 3.1 Pro 競爭。可透過 xAI API 以及在 X 內部使用。

**GRPO（Group Relative Policy Optimization，群組相對策略最佳化）** - DeepSeek-R1 背後的 RL 演算法：捨棄 PPO 的價值／評論者網路，並從一組取樣完成項內的獎勵分散程度計算優勢（advantage）。比 PPO 便宜；其變體（Dr.GRPO、DAPO、GSPO）修正了它的長度偏差與零變異崩潰問題。請參閱 [Training Reasoning Models](03-training-and-adaptation/08-rlvr-and-reasoning-models.md)。

---

## H

**Hallucination（幻覺）** - 模型生成看似合理但事實上不正確的資訊。

**Harness（Scaffold）Variance（測試框架／鷹架變異）** - 同一組模型權重在不同提示、工具存取、推理力度或代理鷹架下，所產生的 10-20 分基準測試分數擺動。這是為何供應商自我回報的數據無法跨實驗室比較，只有相同測試框架下的數字才能相互比較。請參閱 [Benchmarks and Leaderboards](14-evaluation-and-observability/03-benchmarks-and-leaderboards.md)。

**Harness Engineering（測試框架工程）** - 設計圍繞代理的確定性驅動程式碼（上下文組裝、工具執行、預算、停止條件、持久狀態、可觀測性），而非調校模型本身。測試框架是核心（kernel），模型是策略（policy）。請參閱 [Loop Engineering](07-agentic-systems/12-loop-engineering.md)。

**HNSW（Hierarchical Navigable Small World，階層式可導覽小世界）** - 用於向量資料庫中近似最近鄰搜尋的圖形型演算法。

**Human-in-the-Loop（HITL，人類在環）** - 由人類監督、核准或修正 AI 輸出的模式。

---

## I

**In-Context Learning（情境學習）** - 模型根據提示中的範例適應任務，而無需更新權重。

**Indirect Prompt Injection（間接提示注入）** - 一種透過代理所讀取的內容（網頁、文件、工具結果）而非使用者直接輸入所傳遞的提示注入攻擊。紅隊研究與一項不可能性結果顯示它無法被完全防止，使防禦重心轉向最小權限與圍堵（containment）。請參閱 [Agentic Security and Sandboxing](07-agentic-systems/09-agentic-security-and-sandboxing.md)。

**Inference（推論）** - 執行已訓練的模型以生成預測／輸出。

---

## J

**JSON Mode（JSON 模式）** - 保證輸出為有效 JSON 結構的 LLM 輸出模式（舊版）。在較新的 API 中已被 **Structured Outputs（結構化輸出）** 取代。

---

## K

**KV Cache** - 從注意力運算中快取的鍵值對。可實現高效的自回歸生成。

---

## L

**LangChain** - 用於建構 LLM 應用程式的框架，提供鏈（chain）、代理與整合功能。

**Leaderboard Illusion（排行榜幻象）** - 一項批評（Cohere 等人，arXiv:2504.20879）指出，像 LMArena 這類群眾偏好排行榜，會因私下的 best-of-N 測試、資料存取不對等，以及無聲的模型淘汰而失真。LMArena 對其程度有所爭辯；實務上的要點是閱讀帶有信賴區間、經風格控制的 Elo 分數，並把 Arena 當作偏好而非正確性來看待。

**LlamaIndex** - 聚焦於 LLM 應用程式文件處理與檢索的資料框架。

**LiveCodeBench** - 在來自競技程式設計平台的真實世界問題上評估編碼模型的基準測試。對於生產環境的編碼任務，比 HumanEval 更可靠。

**LoRA（Low-Rank Adaptation，低秩適應）** - 一種參數高效的微調方法，訓練小型轉接器矩陣而非完整的模型權重。

**LLM-as-Judge（LLM 作為評審）** - 使用一個 LLM 來評估另一個 LLM 的輸出。

**Loop Engineering（迴圈工程）** - 設計並持續改進包覆代理的控制迴圈（觸發器、內層的推理-行動-觀察迴圈、驗證迴圈、事件驅動調用，以及評估驅動的改進迴圈）的學科，而非每個回合都手動提示模型。請參閱 [Loop Engineering](07-agentic-systems/12-loop-engineering.md)。

**Loopmaxxing** - 一種反模式，假設只要迭代次數越多就能自動解決任務。它在沒有可驗證退出條件的目標上會失敗，導致迴圈永不收斂、支出失控。這是 token-maxxing 的多步驟後代。請參閱 [Loop Engineering](07-agentic-systems/12-loop-engineering.md)。

---

## M

**MCP（Model Context Protocol，模型上下文協定）** - 用於與 LLM 進行標準化工具／資源整合的開放協定。由 Anthropic 於 2024 年 11 月推出；治理權於 2025 年 12 月移交給 Linux Foundation 的 Agentic AI Foundation；獲 Anthropic、OpenAI、Google、Microsoft、AWS 採用。2.0 版（2026 年 3 月批准）新增 Streamable HTTP 傳輸與 OAuth 2.1 驗證。

**Memory Poisoning（記憶汙染）** - 一種攻擊，在代理的長期記憶中植入惡意或不實的條目，使其在未來的工作階段中重新浮現並造成影響。已被新增至 OWASP 2026 Agentic Top 10，編號為 ASI06。防禦上偏好在寫入時記錄來源出處，而非在讀取時清理。請參閱 [Research Radar](RESEARCH-RADAR.md)。

**Mixture of Agents（MoA，代理混合）** - 一種集成模式，由多個代理共同促成一個綜合後的回應。

**Model Routing（模型路由）** - 依任務、成本、延遲、能力或語意來選擇由哪個模型服務每個請求，通常搭配級聯（先用便宜模型，信心不足時升級）與跨供應商備援。請參閱 [AI Gateways and Model Routing](11-infrastructure-and-mlops/03-ai-gateways-and-model-routing.md)。

**Multi-Tenancy（多租戶）** - 以共享的基礎設施服務多個客戶，並做到資料隔離。

---

## O

**o3** - OpenAI 的高運算推理模型（2025 年 1 月發布）。使用內部思維鏈來分配測試階段運算。提供標準版與「mini」變體。擅長數學、程式碼與科學。

**OCR（Optical Character Recognition，光學字元辨識）** - 從影像或掃描文件中擷取文字。

**OpenHands** - 開源的自主軟體工程代理（前稱 OpenDevin）。支援多種後端 LLM，在 Docker 沙箱中執行。

---

## P

**pass^k** - 代理可靠度度量：在所有 k 次獨立嘗試中都解出的任務比例（相對於 pass@k，後者只需至少一次解出即可）。它揭露了可靠度懸崖：一個在 pass@1 約 60% 的代理，可能在 pass^8 掉到約 25%。這是與生產環境相關的一致性訊號。

**Prompt Caching（提示快取）** - 對重複的提示前綴重複使用 KV cache。Anthropic（cache_control）、Google（隱含）以及部分 OpenAI 端點原生提供。對於長而固定的前綴可降低 60-90% 的成本。

**Prompt Injection（提示注入）** - 惡意輸入操縱 LLM 行為的攻擊。

**Prefix Caching（前綴快取）** - 跨請求對常見的提示前綴重複使用 KV cache。

---

## Q

**QLoRA** - LoRA 結合 4 位元量化，以進行記憶體高效的微調。

**Quantization（量化）** - 降低模型精度（例如從 FP16 到 INT4）以減少記憶體並提升速度。

---

## R

**RAG（Retrieval-Augmented Generation，檢索增強生成）** - 一種模式，檢索相關文件以為 LLM 生成提供上下文。

**RBAC（Role-Based Access Control，角色型存取控制）** - 根據具有預先定義權限的使用者角色來進行存取控制。

**ReAct** - 在推理（Reasoning）與行動（Acting）步驟之間交替的代理模式。

**Reranking（重排序）** - 第二階段的評分，用以提升檢索精確度。交叉編碼器（cross-encoder）比雙編碼器（bi-encoder）提供更高的準確度。

**RLHF（Reinforcement Learning from Human Feedback，從人類回饋進行的強化學習）** - 一種使用人類偏好來對齊模型行為的訓練方法。

**RLVR（RL with Verifiable Rewards，具可驗證獎勵的 RL）** - 推理模型主流的後訓練配方：以程式化的驗證器（數學、程式碼，或具有可檢核答案的邏輯）來獎勵策略，而非使用經學習的獎勵模型，藉此大致避開獎勵模型被鑽漏洞的問題。請參閱 [Training Reasoning Models](03-training-and-adaptation/08-rlvr-and-reasoning-models.md)。

---

## S

**Self-Consistency（自我一致性）** - 取樣多條推理路徑並選出最常見的答案。

**Semantic Search（語意搜尋）** - 使用嵌入，依意義而非關鍵字來尋找文件。

**Speculative Decoding（推測式解碼）** - 使用小型草稿模型來提議 token，再由大型模型驗證。

**Speech-to-Speech（S2S，語音對語音）** - 一種語音代理架構，由單一個多模態模型直接接收音訊輸入並發出音訊輸出，相對於級聯式的 STT 到 LLM 到 TTS 管線。更自然且延遲更低，但較不易除錯與控制。請參閱 [Real-Time Voice Agents](18-voice-and-audio-agents/01-realtime-voice-agents.md)。

**Structured Outputs（結構化輸出）** - OpenAI（以及 Anthropic 的工具模式）保證模型輸出符合所提供 JSON Schema 的能力。比舊版 JSON 模式更嚴格。

**SWE-bench Verified** - SWE-bench 中經人工驗證的 500 個議題子集，衡量真實 GitHub 議題的解決情況；是 2024-2026 年標準的編碼基準測試。如今已接近飽和且部分受到汙染，因此該領域正轉向 SWE-bench Pro 與抗汙染的即時變體。在信任某個分數之前，請先閱讀其測試框架。請參閱 [Benchmarks and Leaderboards](14-evaluation-and-observability/03-benchmarks-and-leaderboards.md)。

**System Prompt（系統提示）** - 為 LLM 對話設定上下文與行為的指令。

---

## T

**Temperature（溫度）** - 控制 LLM 輸出隨機性的參數。越低則越具確定性。

**Test-Time Compute（Inference-Time Scaling，測試階段運算／推論階段擴展）** - 在權重**凍結**的情況下，於推論時花費更多運算：長思維鏈、best-of-N、自我一致性、搜尋。到 2026 年已在生產環境中無所不在，但超過某個點後報酬會遞減（有時甚至為負）。與 Test-Time Training 形成對比。

**Test-Time Training（TTT，測試階段訓練）** - 在推論時（通常是一個短暫的 LoRA）對測試輸入、其增強版本，或檢索到的鄰近項，更新模型的**權重**，接著進行預測並丟棄該次更新。有別於 test-time compute，後者讓權重維持凍結。2026 年仍處於研究階段；在像 ARC 這類新穎任務以及長上下文效率上最為強勁。請參閱 [Research Radar](RESEARCH-RADAR.md#12-test-time-training-learning-at-inference)。

**Token** - 文字處理的基本單位。在英文中大約是 0.75 個單字或 4 個字元。

**Tool Use（工具使用）** - LLM 調用外部函式／API 的能力。

**Transformer** - 以自注意力為基礎的神經網路架構。現代 LLM 的基礎。

---

## V

**Vector Database（向量資料庫）** - 為儲存與搜尋高維向量（嵌入）而最佳化的資料庫。

---

## W

**Windsurf** - AI 原生 IDE（由 Codeium 推出），具備緊密的代理式整合。使用「Flows」（確定性的代理式序列）。是 Cursor 的替代方案。

---

## Z

**Zero-Shot（零樣本）** - 不提供範例的提示，仰賴模型既有的知識。

---

*另請參閱：[PATTERNS.md](PATTERNS.md) 取得設計模式快速參考*
