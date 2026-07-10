# AI 系統設計術語表

本指南通篇使用的關鍵術語快速參考。

---

## A

**A2A（Agent-to-Agent Protocol，代理對代理協定）** - 用於代理之間通訊與任務委派的開放協定（agent card、任務生命週期、串流更新），與 MCP 互補：A2A 是代理對代理的邊界，MCP 是代理對工具的邊界。於 2026 年達到 v1.0。請參閱 [Multi-Agent Orchestration](07-agentic-systems/04-multi-agent-orchestration.md)。

**Agentic Coding（代理式編碼）** - LLM 自主編輯檔案、執行 shell 命令、撰寫測試並反覆迭代，直到編碼任務完成為止。代表案例有 Claude Code、OpenHands 與 Cline。

**Agentic System（代理式系統）** - 使用工具自主規劃並執行多步驟任務的 LLM 應用程式。

**AI Control（AI 控制）** - 一種安全方法，假設模型可能未對齊，並設計部署協定（監控、關鍵動作時延後處理、重新取樣、分解認知）以在這種情況下仍保持安全。它有別於對齊（alignment），對齊的目標是讓模型一開始就值得信賴。請參閱 [Research Radar](RESEARCH-RADAR.md)。

**AI Gateway（AI 閘道）** - 介於你的應用程式與模型供應商之間的控制平面代理（LiteLLM、OpenRouter、Portkey、Kong）。它對外提供單一個與 OpenAI 相容的 API，並集中處理路由、備援、負載平衡、速率限制處理、虛擬金鑰與預算、快取，以及可觀測性。請參閱 [AI Gateways and Model Routing](11-infrastructure-and-mlops/03-ai-gateways-and-model-routing.md)。

**Alert Fatigue（警示疲勞）** - 當助理發出太多低價值的警示（標記、警告、建議），使用者便開始忽略全部，連關鍵的也一併忽略。這正是為何在臨床決策支援、code review 與可觀測性告警上，精確率比召回率更重要。請參閱 [Case Study: Clinical Decision Support](16-case-studies/35-clinical-decision-support.md)。

**Attention Mechanism（注意力機制）** - 神經網路元件，讓模型能夠聚焦於輸入中相關的部分。自注意力（self-attention）會將每個 token 與其他所有 token 進行比較。

**ABAC（Attribute-Based Access Control，屬性型存取控制）** - 根據使用者、資源與環境的屬性，而非固定角色，來進行存取控制。

**Action-item grounding（行動項目接地）** - 要求每個被擷取出的行動項目、決策或風險，都必須引用支持它的確切逐字稿片段（發言者加時間戳），使沒有依據的項目被捨棄，而非被送進記錄系統。請參閱 [Case Study: Async Meeting Intelligence Platform](16-case-studies/41-meeting-intelligence-platform.md)。

**Adaptive keyframe sampling（自適應關鍵影格取樣）** - 依場景與動態活動變化影格擷取率（畫面繁忙時密集、靜態鏡頭時稀疏），而非採用固定影格率，以降低視覺索引成本。請參閱 [Case Study: Long-Form Video Understanding](16-case-studies/49-long-form-video-understanding.md)。

**Adverse Impact（Four-Fifths Rule，差別影響／五分之四規則）** - EEOC 的檢定標準，當某個受保護群體的錄取率低於最高群體錄取率的 80% 時，即標記為歧視。請參閱 [Case Study: AI Recruiting and Resume Screening](16-case-studies/44-ai-recruiting-resume-screening.md)。

**Adverse-action notice（不利處分通知）** - 保險公司或雇主在做出拒絕決定時，依法必須寄出的揭露文件，載明所引用的具體理由，這迫使每個拒絕理由都必須有依據且可解釋。請參閱 [Case Study: Insurance Claims Adjudication](16-case-studies/43-insurance-claims-adjudication.md)。

**Age assurance（年齡保證）** - 依據自述年齡加上行為與年齡估計訊號，以機率方式將使用者歸入成年或疑似未成年層級，用以對未成年人閘控內容。請參閱 [Case Study: AI Companion Platform](16-case-studies/47-ai-companion-character-platform.md)。

**AI-slop（AI 濫製內容）** - 低品質、機器生成的網路內容（大量製造的 SEO 填充文），研究代理在引用前必須偵測並將其降權。請參閱 [Case Study: Deep Research Agent](16-case-studies/42-deep-research-agent.md)。

**Attack Success Rate（ASR，攻擊成功率）** - 對目標 LLM 引發實際政策違規的對抗性探測所佔的比例，依危害類別分別追蹤，並預期隨防禦改善而下降。請參閱 [Case Study: Automated LLM Red-Teaming](16-case-studies/50-automated-llm-red-teaming.md)。

**Audio Overview（音訊概覽）** - 一種 NotebookLM 風格的雙主持人音訊「podcast」，由使用者的來源文件生成，以對話方式討論內容，而非照本宣科朗讀。請參閱 [Case Study: Doc-to-Podcast Audio Generation](16-case-studies/52-doc-to-podcast-audio-generation.md)。

**Automated Employment Decision Tool（AEDT，自動化僱用決策工具）** - 紐約市 Local Law 144 對演算法招聘工具的稱呼，此類工具必須通過獨立的偏見稽核，且稽核結果須公開張貼。請參閱 [Case Study: AI Recruiting and Resume Screening](16-case-studies/44-ai-recruiting-resume-screening.md)。

**Automated red-teaming（自動化紅隊演練）** - 使用模型大規模生成、變異並搜尋對抗性提示，使安全涵蓋範圍能隨威脅演進，而非仰賴靜態的測試集。請參閱 [Case Study: Automated LLM Red-Teaming](16-case-studies/50-automated-llm-red-teaming.md)。

---

## B

**Barge-in（插話）** - 在語音代理中，讓來電者能在代理講話中途打斷，使代理停止說話並開始聆聽。對自然的輪替至關重要；需要回音消除與快速的 VAD，才不會讓代理蓋過使用者的話。請參閱 [Real-Time Voice Agents](18-voice-and-audio-agents/01-realtime-voice-agents.md)。

**Batching（批次處理）** - 將多個請求一起處理以提升 GPU 使用率。連續批次處理（continuous batching）會在其他請求仍在生成時加入新的請求。

**Benchmark Saturation（基準測試飽和）** - 當前沿模型聚集得太靠近某個基準測試的上限，以致分數差異落在雜訊範圍內（提示措辭、執行變異），使該基準測試不再能區分模型。MMLU、HumanEval 與 GSM8K 都已飽和。請參閱 [Benchmarks and Leaderboards](14-evaluation-and-observability/03-benchmarks-and-leaderboards.md)。

**BM25** - 傳統的關鍵字型排序演算法。常與向量搜尋結合以進行混合檢索。

**Budget Tokens** - Extended Thinking（Claude）或推理（o3）可設定的運算預算。預算越高，內部推理步驟越多，準確度與成本也越高。

**Blast-radius estimate（影響範圍估計）** - 一種在執行前根據服務拓撲所做的計算，估算某個提議的修復措施會影響多少個 pod 與下游服務，並在任何生產環境動作執行前，連同 dry-run 差異一併呈現給核准者。請參閱 [Case Study: SRE Incident-Response Copilot](16-case-studies/48-sre-incident-response-copilot.md)。

**Blind-first review（盲審優先）** - 一種人類在環的標註模式，標註者在 LLM 的建議標籤揭曉之前就先提交自己的標籤，藉此在主觀或安全敏感的類別上破除自動化偏誤。請參閱 [Case Study: Data Annotation Platform](16-case-studies/56-data-annotation-platform.md)。

---

## C

**C2PA（Content Credentials）** - 一項開放標準，以密碼學方式將來源出處的詮釋資料（由誰製作、是否有 AI 參與、做了哪些編輯）綁定到媒體資產上，並具備防竄改的硬綁定，以及能在重新編碼後存活的浮水印型軟綁定。它是 AI 內容標示法規背後的來源出處層；由於可被移除，因此應與浮水印及偵測技術分層搭配使用。請參閱 [Multimodal Generation](19-multimodal-generation/01-multimodal-generation.md)。

**CaMeL（Capabilities for Machine Learning）** - 一種提示注入防禦（Google DeepMind，2025），讓不受信任的資料經過一個特權 planner，由它產生一份受能力閘控的計畫，使藏在工具結果中的指令無法觸發敏感動作。能力閘控的參考範式。請參閱 [Agentic Security and Sandboxing](07-agentic-systems/09-agentic-security-and-sandboxing.md)。

**Capability Gating（能力閘控）** - 依目前上下文中內容的信任層級，限制代理可調用的工具，使會改變狀態的工具（退款、寫入、寄送）無法由不受信任的工具結果觸發。這是核心的間接提示注入防禦。請參閱 [Agentic Security and Sandboxing](07-agentic-systems/09-agentic-security-and-sandboxing.md)。

**Capability Index（綜合基準測試，Composite Benchmark）** - 將許多基準測試加權彙整而成的指標（例如 Artificial Analysis Intelligence Index、Epoch Capability Index、給代理用的 HAL），用來為前沿模型排名，使排名在個別基準測試飽和後仍能持續區分高下。

**Chain-of-Thought（CoT，思維鏈）** - 一種提示技巧，在給出最終答案之前引導出逐步推理。

**Change Data Capture（CDC，變更資料擷取）** - 只串流來源系統的新增、更新與刪除（透過日誌或差異查詢），而非重新爬取全部資料。這是讓 RAG 索引保持新鮮且划算的基礎；漏掉刪除是經典的 CDC 臭蟲，會讓已移除的文件仍可被檢索到。請參閱 [Data Engineering for AI](06-retrieval-systems/15-data-engineering-for-ai.md)。

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

**Canary true-positive（金絲雀真陽性）** - 注入到實時分流管線中、合成但擬真的惡意警示，用以持續衡量系統對真實威脅的召回率。請參閱 [Case Study: SOC Alert-Triage Copilot](16-case-studies/40-soc-security-operations-copilot.md)。

**Citation-support rate（引用支持率）** - 一份報告中，其引用來源確實蘊含該主張的已引用主張所佔的比例，是帶引用報告代理的核心事實性度量。請參閱 [Case Study: Deep Research Agent](16-case-studies/42-deep-research-agent.md)。

**Composed image retrieval（組合式影像檢索）** - 查詢由一張影像加上一段文字修飾語（「這件外套但要綠色的」）構成的檢索，兩者融合成單一個查詢嵌入，或以結構化的屬性篩選來解析。請參閱 [Case Study: E-commerce Visual Search](16-case-studies/51-ecommerce-visual-search.md)。

**Confidence gating（信心閘控）** - 將某個自主動作（例如自動關閉警示）限制在經校準的模型信心跨過高門檻、且獨立已驗證訊號一致同意的情況下，否則預設交由人類升級處理。請參閱 [Case Study: SOC Alert-Triage Copilot](16-case-studies/40-soc-security-operations-copilot.md)。

**Contract playbook（合約攻略手冊）** - 一家公司針對每個條款所訂的標準、退讓與破局（紅線）談判立場集合，作為 redlining copilot 比對條款時所依據、機器可讀的真實依據，而非仰賴模型的一般法律知識。請參閱 [Case Study: Contract Drafting and Redlining](16-case-studies/45-contract-drafting-redlining.md)。

**Coverage-plateau stop（涵蓋率高原停止）** - 一種迴圈終止規則，當每次額外搜尋所帶來的邊際新主張低於某個門檻時，就停止代理的搜尋循環。請參閱 [Case Study: Deep Research Agent](16-case-studies/42-deep-research-agent.md)。

**Crescendo attack（漸強式攻擊）** - 一種多輪越獄手法，透過一連串看似無害的回合逐步升級，直到模型同意某件它在單一提示中原本會拒絕的事情。請參閱 [Case Study: Automated LLM Red-Teaming](16-case-studies/50-automated-llm-red-teaming.md)。

**Claims Allowlist（主張允許清單）** - 一份列舉出對外生成器獲准提出之主張的集合（已核准的價值主張、真實的客戶推薦、已公開發表的統計數字），藉此封鎖捏造的案例研究、虛構的指標與假造的急迫感。請參閱 [Case Study: AI SDR Outbound Sales](16-case-studies/54-ai-sdr-outbound-sales.md)。

**Crisis routing（危機轉介）** - 偵測到自傷或自殺意念的透露時，跳出角色設定以提供真實的危機資源（988、Crisis Text Line）並記錄交接，而非繼續以角色身分回應。請參閱 [Case Study: AI Companion Platform](16-case-studies/47-ai-companion-character-platform.md)。

---

## D

**Data Contamination（資料汙染）** - 當基準測試的題目或其答案洩漏進模型的訓練資料中，透過記憶而非能力來灌水分數。可用時間閘控、私有，或保留（held-out）測試集來反制。請參閱 [Benchmarks and Leaderboards](14-evaluation-and-observability/03-benchmarks-and-leaderboards.md)。

**Diffusion Language Model（擴散語言模型）** - 一種非自回歸的 LLM，透過平行地反覆對遮罩序列去雜訊來生成文字，而非由左至右生成，以犧牲部分品質換取大幅提升的吞吐量（據報導可達 1,000+ token/秒）。在程式碼與填空（infilling）上表現強勁；2026 年仍處於早期階段。請參閱 [Diffusion Language Models](04-inference-optimization/08-diffusion-llms.md)。

**DPO（Direct Preference Optimization，直接偏好最佳化）** - 一種微調方法，直接針對偏好資料進行最佳化，無需獨立的獎勵模型。

**Drift Detection（漂移偵測）** - 監測已部署模型的輸入（輸入或嵌入分布漂移）或輸出（品質漂移）是否出現統計上顯著的位移，好在使用者抱怨之前就抓到劣化。這有別於 APM：模型可能回傳 200 OK 卻悄悄變差。請參閱 [LLM Evaluation](14-evaluation-and-observability/01-llm-evaluation.md)。

**DSPy** - 透過可最佳化的模組（而非手動提示）來編寫 LLM 程式的框架。

**Dual-LLM Pattern（雙 LLM 模式）** - 一種提示注入圍堵設計（Simon Willison），將工作拆分給一個可呼叫工具但從不看到原始不受信任文字的特權 LLM，以及一個處理不受信任內容但沒有任何工具存取的隔離（quarantined）LLM，兩者之間只傳遞結構化、已驗證的資料。請參閱 [LLM Security](12-security-and-access/01-llm-security.md)。

**Durable Execution（持久執行）** - 一種執行模型（Temporal、Restate、DBOS），透過僅可追加的事件歷史與確定性重播，讓長時間執行的代理能在當機與重新啟動後存活，提供恰好一次（exactly-once）的副作用、持久計時器，以及能跨越部署存活的暫停。請參閱 [Durable Execution](07-agentic-systems/11-durable-execution.md)。

**Diarization Error Rate（DER，語者分段錯誤率）** - 標準的語者分段品質度量：所歸屬的發言者錯誤（漏聽、誤判有語音，或發言者混淆）的音訊時間所佔的比例，其中重疊語音是主要的錯誤來源。請參閱 [Case Study: Async Meeting Intelligence Platform](16-case-studies/41-meeting-intelligence-platform.md)。

---

## E

**Effective Context Length（有效上下文長度）** - 模型仍能維持品質的上下文長度，通常比宣稱的視窗短。在 RULER 上，許多宣稱 128K 的模型其實只能維持品質到約 32-64K。設計時應以有效上下文為準，而非宣稱的上下文。

**Embedding（嵌入）** - 文字的稠密向量表示。用於語意搜尋與相似度比較。

**Endpointing（Turn Detection，回合偵測）** - 在語音代理中，判斷使用者是否已說完話，好讓代理能夠回應。經學習的回合偵測模型會在語意完整的想法出現時觸發，勝過會讓每個回合都付出代價的固定靜默逾時。請參閱 [Real-Time Voice Agents](18-voice-and-audio-agents/01-realtime-voice-agents.md)。

**Ensemble（集成）** - 結合多個模型的輸出以提升可靠度。包括投票、辯論，以及代理混合（mixture-of-agents）。

**Entity Resolution（實體解析）** - 將同一個真實世界實體的眾多表面形式（一個基因、蛋白質或公司可能有數十種名稱）正規化為單一個標準識別碼，通常對照某個本體論（UMLS、ChEMBL、UniProt）。這是 GraphRAG 中知識圖譜建構的成敗關鍵步驟。請參閱 [GraphRAG](06-retrieval-systems/07-graph-rag.md)。

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

**Faithfulness gate（忠實性閘門）** - 一道獨立的事實查核流程，把生成的腳本分解成原子主張，並逐一對照來源文件加以驗證，在算繪音訊之前封鎖或重新生成任何沒有依據的主張。請參閱 [Case Study: Doc-to-Podcast Audio Generation](16-case-studies/52-doc-to-podcast-audio-generation.md)。

**Formula correctness gate（公式正確性閘門）** - 生成的試算表公式在寫回之前必須通過的確定性驗證（解析成 AST、參照與範圍檢查、型別與單位合理性、沙箱重算與對帳），是 SQL 正確性閘門在試算表上的對應物。請參閱 [Case Study: Spreadsheet Modeling Agent](16-case-studies/55-spreadsheet-financial-modeling-agent.md)。

---

## G

**GGUF** - llama.cpp、Ollama 與 LM Studio 用於本地推論的量化模型檔案格式。量化等級以品質換取大小；Q4_K_M 是實務上的甜蜜點。請參閱 [On-Device and Edge Deployment](04-inference-optimization/09-on-device-and-edge-deployment.md)。

**GraphRAG** - 在知識圖譜上（而非或並用於扁平向量索引）進行的檢索增強生成，可支援多跳、帶關係型別的查詢，並透過社群偵測（community detection）做全域摘要。由 Microsoft Research 推廣。當答案需要走訪沒有任何單一片段能涵蓋的關係時值得採用。請參閱 [GraphRAG](06-retrieval-systems/07-graph-rag.md)。

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

**Honeypot item（labeling，蜜罐項目）** - 一個植入的審查項目，其顯示的預設標籤刻意是錯的，用來抓出那些只會照單全收建議、而非獨立判斷的標註者（或模型）。請參閱 [Case Study: Data Annotation Platform](16-case-studies/56-data-annotation-platform.md)。

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

**Knowledge Tracing（知識追蹤）** - 從學習者的作答歷史，對其每項技能的精熟度隨時間建模（Bayesian Knowledge Tracing、Deep Knowledge Tracing），以驅動 AI 家教的自適應難度。請參閱 [Case Study: Adaptive AI Tutor](16-case-studies/27-adaptive-ai-tutor.md)。

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

**Leakage（滲漏）** - 在理賠裁定中，自動裁決的理賠案上因溢付加上已支付詐欺所損失的金額；這筆預算限定了直通式處理（straight-through processing）率能安全地拉到多高。請參閱 [Case Study: Insurance Claims Adjudication](16-case-studies/43-insurance-claims-adjudication.md)。

---

## M

**MCP（Model Context Protocol，模型上下文協定）** - 用於與 LLM 進行標準化工具／資源整合的開放協定。由 Anthropic 於 2024 年 11 月推出；治理權於 2025 年 12 月移交給 Linux Foundation 的 Agentic AI Foundation；獲 Anthropic、OpenAI、Google、Microsoft、AWS 採用。2.0 版（2026 年 3 月批准）新增 Streamable HTTP 傳輸與 OAuth 2.1 驗證。

**Mem0** - 一個開源的代理式記憶層，跨工作階段擷取、儲存並更新重要事實（在向量或圖資料庫上做新增、更新、刪除），讓代理擁有長期記憶，而無需把完整歷史重播進上下文。請參閱 [Agentic Memory with Mem0](08-memory-and-state/04-agentic-memory-mem0.md)。

**Memory Poisoning（記憶汙染）** - 一種攻擊，在代理的長期記憶中植入惡意或不實的條目，使其在未來的工作階段中重新浮現並造成影響。已被新增至 OWASP 2026 Agentic Top 10，編號為 ASI06。防禦上偏好在寫入時記錄來源出處，而非在讀取時清理。請參閱 [Research Radar](RESEARCH-RADAR.md)。

**Mixture of Agents（MoA，代理混合）** - 一種集成模式，由多個代理共同促成一個綜合後的回應。

**Model Collapse（模型崩塌）** - 當模型反覆在 AI 生成的輸出上訓練時所發生的劣化：分布的尾端消失、多樣性萎縮，品質隨世代衰退。這是天真的合成資料管線的核心風險；緩解之道是讓真實資料維持在訓練組合中，並嚴格過濾。請參閱 [Case Study: Synthetic Data Generation](16-case-studies/37-synthetic-data-generation.md)。

**Model Routing（模型路由）** - 依任務、成本、延遲、能力或語意來選擇由哪個模型服務每個請求，通常搭配級聯（先用便宜模型，信心不足時升級）與跨供應商備援。請參閱 [AI Gateways and Model Routing](11-infrastructure-and-mlops/03-ai-gateways-and-model-routing.md)。

**Multi-Tenancy（多租戶）** - 以共享的基礎設施服務多個客戶，並做到資料隔離。

**Machine Translation Post-Editing（MTPE，機器翻譯後編輯）** - 一種由人類編修機器翻譯草稿、而非從零翻譯的工作流程，保留給中度風險的內容使用。請參閱 [Case Study: Translation and Localization Pipeline](16-case-studies/46-translation-localization-pipeline.md)。

**Mailbox Warmup（信箱暖機）** - 在新的電子郵件網域或信箱上逐步拉高寄送量，好在它承載生產環境的對外郵件之前先建立寄件者信譽。請參閱 [Case Study: AI SDR Outbound Sales](16-case-studies/54-ai-sdr-outbound-sales.md)。

---

## N

**NCCI edits（NCCI 編輯規則）** - CMS 國家正確編碼倡議（National Correct Coding Initiative）的規則表（程序對程序配對與 Medically Unlikely Edits），以確定性方式阻擋醫療編碼中的拆帳（unbundling）與不可能的單位數量。請參閱 [Case Study: Medical Coding and RCM](16-case-studies/53-medical-coding-rcm.md)。

---

## O

**o3** - OpenAI 的高運算推理模型（2025 年 1 月發布）。使用內部思維鏈來分配測試階段運算。提供標準版與「mini」變體。擅長數學、程式碼與科學。

**OCR（Optical Character Recognition，光學字元辨識）** - 從影像或掃描文件中擷取文字。

**OpenHands** - 開源的自主軟體工程代理（前稱 OpenDevin）。支援多種後端 LLM，在 Docker 沙箱中執行。

**OpenTelemetry GenAI（語意慣例，Semantic Conventions）** - 用於追蹤 LLM 呼叫的供應商中立標準（為提示、回應、工具呼叫、token、成本、模型版本建立 span），讓可觀測性不被綁定在單一平台。Langfuse、LangSmith、Phoenix 與 Helicone 都會發出或接收它。請參閱 [LLM Evaluation](14-evaluation-and-observability/01-llm-evaluation.md)。

---

## P

**PagedAttention** - vLLM 背後的 KV cache 記憶體管理機制，將注意力的鍵與值以非連續的固定大小區塊儲存（類似作業系統的虛擬記憶體分頁），消除碎片化並使批次規模與吞吐量大幅提升。請參閱 [Serving Infrastructure](04-inference-optimization/06-serving-infrastructure.md)。

**pass^k** - 代理可靠度度量：在所有 k 次獨立嘗試中都解出的任務比例（相對於 pass@k，後者只需至少一次解出即可）。它揭露了可靠度懸崖：一個在 pass@1 約 60% 的代理，可能在 pass^8 掉到約 25%。這是與生產環境相關的一致性訊號。

**Prompt Caching（提示快取）** - 對重複的提示前綴重複使用 KV cache。Anthropic（cache_control）、Google（隱含）以及部分 OpenAI 端點原生提供。對於長而固定的前綴可降低 60-90% 的成本。

**Prompt Injection（提示注入）** - 惡意輸入操縱 LLM 行為的攻擊。

**Prefix Caching（前綴快取）** - 跨請求對常見的提示前綴重複使用 KV cache。

**Persona card（人設卡）** - 一份版本化、經前綴快取的系統提示，固定住一個 AI 角色的身分、語氣、背景故事與硬性界線，使其在數個月間都保持一致。請參閱 [Case Study: AI Companion Platform](16-case-studies/47-ai-companion-character-platform.md)。

**Physician query（醫師查詢）** - 當臨床文件含糊不清時，向醫療提供者發出的合規、不帶引導性的釐清詢問，用以取回正當的編碼具體性，而非逕自推斷。請參閱 [Case Study: Medical Coding and RCM](16-case-studies/53-medical-coding-rcm.md)。

---

## Q

**QLoRA** - LoRA 結合 4 位元量化，以進行記憶體高效的微調。

**Quantization（量化）** - 降低模型精度（例如從 FP16 到 INT4）以減少記憶體並提升速度。

**Quality Estimation（QE，品質估計）** - 僅從原文與譯文假設出發、無需參考譯文即為機器翻譯品質評分，用以只把有風險的段落轉交人工審查。請參閱 [Case Study: Translation and Localization Pipeline](16-case-studies/46-translation-localization-pipeline.md)。

**Query bank（查詢庫）** - 一組經策劃、已驗證的問題對 SQL 配對，用作少樣本範例，使 text-to-SQL 生成能立基於已知正確的查詢。請參閱 [Case Study: Conversational Analytics (Text-to-SQL)](16-case-studies/39-conversational-analytics-text-to-sql.md)。

---

## R

**RAG（Retrieval-Augmented Generation，檢索增強生成）** - 一種模式，檢索相關文件以為 LLM 生成提供上下文。

**RBAC（Role-Based Access Control，角色型存取控制）** - 根據具有預先定義權限的使用者角色來進行存取控制。

**ReAct** - 在推理（Reasoning）與行動（Acting）步驟之間交替的代理模式。

**Reranking（重排序）** - 第二階段的評分，用以提升檢索精確度。交叉編碼器（cross-encoder）比雙編碼器（bi-encoder）提供更高的準確度。

**RLHF（Reinforcement Learning from Human Feedback，從人類回饋進行的強化學習）** - 一種使用人類偏好來對齊模型行為的訓練方法。

**RLVR（RL with Verifiable Rewards，具可驗證獎勵的 RL）** - 推理模型主流的後訓練配方：以程式化的驗證器（數學、程式碼，或具有可檢核答案的邏輯）來獎勵策略，而非使用經學習的獎勵模型，藉此大致避開獎勵模型被鑽漏洞的問題。請參閱 [Training Reasoning Models](03-training-and-adaptation/08-rlvr-and-reasoning-models.md)。

**Read/act boundary（讀取／行動邊界）** - 一條設計規則，基礎設施 copilot 可自主執行唯讀的診斷工具，但每個會改變狀態的動作（回滾、擴縮、重啟、故障切換）都必須是經人類核准的提議，且在工具邊界而非提示中強制執行。請參閱 [Case Study: SRE Incident-Response Copilot](16-case-studies/48-sre-incident-response-copilot.md)。

**Recalc reconciliation（重算對帳）** - 在沙箱化的副本上，以真實的試算表引擎執行生成或編輯後的公式，並在信任或顯示該數字之前，將結果在浮點誤差（epsilon）範圍內與一個獨立推導的結果比對。請參閱 [Case Study: Spreadsheet Modeling Agent](16-case-studies/55-spreadsheet-financial-modeling-agent.md)。

**Red line（clause position，紅線條款立場）** - 公司絕不會接受的對方合約條款（無上限的賠償、寬泛的智財權讓與、自動續約陷阱）；漏掉一條就是 redlining copilot 調高召回率所要抓出、代價不對稱的高成本偽陰性，有別於「redline」這種追蹤修訂的編輯。請參閱 [Case Study: Contract Drafting and Redlining](16-case-studies/45-contract-drafting-redlining.md)。

---

## S

**Saga Pattern（Saga 模式）** - 一種分散式交易模式，把多步驟工作流程拆成各自帶有補償動作的本地步驟，使部分失敗能乾淨回滾，而無需全域鎖。用於多段式代理工作流程（例如跨組織訂位），當其中一個參與者可能在交易中途失敗時。請參閱 [Case Study: Cross-Organization Agent Federation](16-case-studies/38-cross-org-a2a-federation.md)。

**SaMD（Software as a Medical Device，醫療器材軟體）** - 以醫療為用途、其本身即屬受規範醫療器材的軟體。FDA 的臨床決策支援準則在臨床人員能獨立審查建議依據時提供豁免，這正是臨床 copilot 之所以設計成解釋並引用、而非自主決策的原因。請參閱 [Case Study: Clinical Decision Support](16-case-studies/35-clinical-decision-support.md)。

**Self-Consistency（自我一致性）** - 取樣多條推理路徑並選出最常見的答案。

**Semantic Search（語意搜尋）** - 使用嵌入，依意義而非關鍵字來尋找文件。

**Speculative Decoding（推測式解碼）** - 使用小型草稿模型來提議 token，再由大型模型驗證。

**Speech-to-Speech（S2S，語音對語音）** - 一種語音代理架構，由單一個多模態模型直接接收音訊輸入並發出音訊輸出，相對於級聯式的 STT 到 LLM 到 TTS 管線。更自然且延遲更低，但較不易除錯與控制。請參閱 [Real-Time Voice Agents](18-voice-and-audio-agents/01-realtime-voice-agents.md)。

**Structured Outputs（結構化輸出）** - OpenAI（以及 Anthropic 的工具模式）保證模型輸出符合所提供 JSON Schema 的能力。比舊版 JSON 模式更嚴格。

**SWE-bench Verified** - SWE-bench 中經人工驗證的 500 個議題子集，衡量真實 GitHub 議題的解決情況；是 2024-2026 年標準的編碼基準測試。如今已接近飽和且部分受到汙染，因此該領域正轉向 SWE-bench Pro 與抗汙染的即時變體。在信任某個分數之前，請先閱讀其測試框架。請參閱 [Benchmarks and Leaderboards](14-evaluation-and-observability/03-benchmarks-and-leaderboards.md)。

**SynthID** - Google DeepMind 為 AI 生成的影像、音訊、影片與文字所做的隱形浮水印，能在常見的轉換（重新壓縮、裁切）後存活。用作可被移除的 C2PA manifest 旁的存活層。請參閱 [Multimodal Generation](19-multimodal-generation/01-multimodal-generation.md)。

**System Prompt（系統提示）** - 為 LLM 對話設定上下文與行為的指令。

**Schema linking（結構描述連結）** - text-to-SQL 中的檢索步驟，只挑選與問題相關的資料表與欄位，而非把整個資料倉儲的 DDL 貼進提示中，且它主宰了 text-to-SQL 的準確度。請參閱 [Case Study: Conversational Analytics (Text-to-SQL)](16-case-studies/39-conversational-analytics-text-to-sql.md)。

**Semantic layer（語意層）** - 一個受治理的登錄庫（dbt Semantic Layer、Cube 或 LookML），把每個業務指標剛好定義一次，使 text-to-SQL copilot 得以編譯這份獲認可的定義，而非在原始欄位上臆測 SQL。請參閱 [Case Study: Conversational Analytics (Text-to-SQL)](16-case-studies/39-conversational-analytics-text-to-sql.md)。

**Shop the Look（整體造型選購）** - 一種視覺搜尋模式，先對一整張情境生活照做物件偵測，接著分別搜尋每個偵測到的區域，使單一張影像回傳多項可選購的商品。請參閱 [Case Study: E-commerce Visual Search](16-case-studies/51-ecommerce-visual-search.md)。

**Spam Trap（垃圾郵件陷阱）** - 一種電子郵件地址（全新或回收再用），信箱供應商與封鎖名單用它來抓出名單衛生不佳的寄件者；命中一個就會嚴重損害網域信譽。請參閱 [Case Study: AI SDR Outbound Sales](16-case-studies/54-ai-sdr-outbound-sales.md)。

**Straight-through processing（STP，直通式處理）** - 從頭到尾自動裁決一件案子（一張保單理賠、一筆貸款）而無需任何人為介入，並閘控在低嚴重度、高信心、低詐欺的案件上；是理賠自動化中的主要 ROI 槓桿。請參閱 [Case Study: Insurance Claims Adjudication](16-case-studies/43-insurance-claims-adjudication.md)。

---

## T

**Temperature（溫度）** - 控制 LLM 輸出隨機性的參數。越低則越具確定性。

**Test-Time Compute（Inference-Time Scaling，測試階段運算／推論階段擴展）** - 在權重**凍結**的情況下，於推論時花費更多運算：長思維鏈、best-of-N、自我一致性、搜尋。到 2026 年已在生產環境中無所不在，但超過某個點後報酬會遞減（有時甚至為負）。與 Test-Time Training 形成對比。

**Test-Time Training（TTT，測試階段訓練）** - 在推論時（通常是一個短暫的 LoRA）對測試輸入、其增強版本，或檢索到的鄰近項，更新模型的**權重**，接著進行預測並丟棄該次更新。有別於 test-time compute，後者讓權重維持凍結。2026 年仍處於研究階段；在像 ARC 這類新穎任務以及長上下文效率上最為強勁。請參閱 [Research Radar](RESEARCH-RADAR.md#12-test-time-training-learning-at-inference)。

**Token** - 文字處理的基本單位。在英文中大約是 0.75 個單字或 4 個字元。

**Tool Use（工具使用）** - LLM 調用外部函式／API 的能力。

**Transformer** - 以自注意力為基礎的神經網路架構。現代 LLM 的基礎。

**Trust-Tagging（信任標籤）** - 為檢索或工具結果內容的片段標上信任層級（例如把不受信任的文字以明確標籤包裹），讓代理及其能力閘控能拒絕對低信任內容中嵌入的指令採取行動。這是在讀取層的間接提示注入防禦。請參閱 [Agentic Security and Sandboxing](07-agentic-systems/09-agentic-security-and-sandboxing.md)。

**Temporal grounding（時間接地）** - 回傳影片中確切、帶時間戳、能回答查詢的片段，並以時間 IoU（例如 R@1 在 IoU >= 0.5 時）而非是／否來評分。請參閱 [Case Study: Long-Form Video Understanding](16-case-studies/49-long-form-video-understanding.md)。

**Translation Memory（TM，翻譯記憶庫）** - 一個存放已核准原文對譯文段落配對的資料庫，當新內容比對相符時可免費重複使用，是機器翻譯模型必須遵從的在地化真實依據。請參閱 [Case Study: Translation and Localization Pipeline](16-case-studies/46-translation-localization-pipeline.md)。

---

## U

**Upcoding（浮報編碼）** - 申報比臨床文件所能支持者更高階或更具體的代碼，構成 False Claims Act 違規並須負三倍損害賠償；這正是以文件為依據的編碼管線所要防止的失誤。請參閱 [Case Study: Medical Coding and RCM](16-case-studies/53-medical-coding-rcm.md)。

---

## V

**VAD（Voice Activity Detection，語音活動偵測）** - 偵測一段音訊是否含有語音，是語音代理輪替的第一階段。與 endpointing 搭配以判斷使用者是否已說完；快速的 VAD 也讓 barge-in 得以實現。Silero VAD 是常見選擇。請參閱 [Real-Time Voice Agents](18-voice-and-audio-agents/01-realtime-voice-agents.md)。

**Vector Database（向量資料庫）** - 為儲存與搜尋高維向量（嵌入）而最佳化的資料庫。

**Video RAG（影片 RAG）** - 從預先建好的多模態索引中檢索相關的帶時間碼片段，接著讓視覺語言模型只針對那些片段推理，以帶時間戳引用的方式作答。請參閱 [Case Study: Long-Form Video Understanding](16-case-studies/49-long-form-video-understanding.md)。

---

## W

**Windsurf** - AI 原生 IDE（由 Codeium 推出），具備緊密的代理式整合。使用「Flows」（確定性的代理式序列）。是 Cursor 的替代方案。

---

## Z

**Zero-Shot（零樣本）** - 不提供範例的提示，仰賴模型既有的知識。

---

*另請參閱：[PATTERNS.md](PATTERNS.md) 取得設計模式快速參考*
