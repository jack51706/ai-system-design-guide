# AI 就業市場趨勢 - 2026 年 6 月

> **最後驗證日期：2026 年 6 月 10 日。** 本章節提煉出目前 AI 招聘領域實際發生的情況，包括各公司張貼的職稱、他們篩選的技能、薪酬範圍，以及你會遇到的面試形式。內容來源為 2026 年 4 月至 6 月間 100 多則公開職缺、招聘報告與招募人員訊號。

> **2026 年 6 月更新：** 自 5 月份的市場掃描以來，發生了兩起撼動市場的事件。Anthropic 發布了 **Claude Fable 5**（6 月 9 日，每 100 萬 token 收費 $10/$50），將 Mythos 等級的能力推向全面上市，並提供 Opus 4.8 的後備保護機制；預期將出現一波能力天花板的產品工作，以及隨之而來的評估、安全與路由相關職位。DeepSeek 將其 **75% V4 Pro 折扣永久化**（5 月 22 日），加速了成本工程的招聘趨勢：能夠善用跨模型層級 70 倍價差的候選人，在篩選階段表現亮眼。下方的薪酬列為 5 月 17 日掃描所得；在上述事件所觸及的市場區段，請把它們視為底線。

本章節適合正在規劃下一步的工程師、正在建立評分標準的招聘經理，以及正在做組織設計決策的工程領導者。它與 [TRANSITION_GUIDE.md](../TRANSITION_GUIDE.md)（如何轉職進入 AI 職位）以及[題庫](01-question-bank.md)（該研讀什麼）相輔相成。

---

## 目錄

- [三大頭條轉變](#the-three-headline-shifts)
- [2026 年的職位分類](#role-taxonomy-in-2026)
- [依職涯層級劃分的技能](#skills-by-career-level)
- [職缺實際要求什麼](#what-job-listings-actually-require)
- [薪酬現實](#compensation-reality)
- [地理與產業分布](#geographic--industry-distribution)
- [面試流程模式](#interview-process-patterns)
- [值得關注的新興職位](#emerging-roles-to-watch)
- [策略要點](#strategic-takeaways)
- [參考資料](#references)

---

## 三大頭條轉變 {#the-three-headline-shifts}

如果你只讀一段，請把這三件事內化於心。

### 1. 市場矛盾地同時既熱又冷。

2026 年第一季出現約 52,050 起科技業裁員（Oracle 3 萬人、Amazon、Meta、Dell），是自 2023 年以來最高的第一季裁員數（[Kore1](https://www.kore1.com/tech-layoffs-2026/)；[Tom's Hardware](https://www.tomshardware.com/tech-industry/tech-industry-lays-off-nearly-80-000-employees-in-the-first-quarter-of-2026-almost-50-percent-of-affected-positions-cut-due-to-ai)）。與此同時，AI 職位環比成長 +8.9%、同比成長 +4.8%，約有 275,000 個 AI 職位尚未填補（[Allwork.space](https://allwork.space/2026/05/ai-hiring-is-rising-even-as-tech-layoffs-surge-140/)）。初階／入門級工程師受到的衝擊最大，例行的程式碼產生、QA 測試、基礎前端工作被不成比例地砍掉。資深加上專精的 AI 職位則維持韌性。

**意涵：** 在 2026 年，「科技業招聘」與「AI 招聘」並不是同一個故事。如果你的職涯是通才型的中階 SWE 工作，你正感受到冷市場。如果你是資深層級的 AI 專才，你正處於賣方市場。

### 2. 職稱正在收斂；工作則在碎片化。

大多數公司現在把「AI Engineer」當作統稱職稱張貼，但在這個角色內部，你會迅速專精到 RAG、代理、評估、微調或平台工作。[「未來 18 個月內，多數 AI 職稱會收斂為『AI Engineer』；具聲望的標籤只在前沿實驗室存活下來」](https://www.ivanturkovic.com/2026/04/24/ai-job-titles-2026-naming-chaos/)。「Prompt Engineer」這個獨立職稱實際上已從各大求職平台消失，技能存活了下來，職稱卻沒有（[PE Collective](https://pecollective.com/blog/is-prompt-engineering-a-real-career/)；[Medium - Prompt Engineering Is Dead 2026](https://medium.com/write-a-catalyst/prompt-engineering-is-dead-2026-ai-systems-engineering-7acdbbcb2160)）。

**意涵：** 如果你在招聘「Prompt Engineer」，你落後了 18 個月。請定義出實際的問題（評估的嚴謹度？代理除錯？面向客戶的調校？），並針對那個具體角色去招聘。

### 3. Forward Deployed Engineer 是 2026 年的爆紅角色。

在 2025 年中，FDE 在前沿實驗室還不是一個獨立的類別。到了 2026 年 5 月，OpenAI、Anthropic 與 Google 全都在招聘數百名。Google／Box 的執行長公開稱它為「科技業最炙手可熱的工作」（[Fast Company](https://www.fastcompany.com/91541878/google-box-ceos-say-this-is-the-most-in-demand-job-in-tech)；[Hashnode FDE 指南](https://hashnode.com/blog/a-complete-2026-guide-to-the-forward-deployed-engineer)）。中至資深層級的總薪酬穩定在 $350-550K。

**意涵：** 前沿 AI 的買方（Fortune 500、政府、生技）把駐點工程師的存在當成合約交付項目來要求。FDE 之所以存在，是因為買方重視它，而不是因為它是交付軟體最有效率的方式。

---

## 2026 年的職位分類 {#role-taxonomy-in-2026}

### 既有職稱（仍在強勁招聘）

| 職稱 | 描述 | 在哪裡張貼 |
|-------|-------------|-------------------|
| **AI Engineer** | 事實上的通用型 AI 職稱。其他職稱正在收斂進它。 | 普遍，多數職缺 |
| **LLM Engineer** | 以 transformer 微調、RAG、代理為核心。與 ML Engineer 有別。 | 中大型公司；[iSmart LLM JD 2026](https://www.ismartrecruit.com/job-descriptions/llm-engineer) |
| **ML Engineer / ML+AI Software Engineer** | 經典的訓練與部署角色。 | [levels.fyi ML/AI 領域](https://www.levels.fyi/t/software-engineer/focus/ml-ai) |
| **Applied AI Engineer** | 前沿實驗室中嵌入客戶端的變體。 | [Anthropic Applied AI](https://job-boards.greenhouse.io/anthropic/jobs/5116274008) |
| **Member of Technical Staff (MTS)** | 刻意模糊研究與工程界線的曖昧職稱。 | OpenAI、Anthropic、Thinking Machines、Mistral（[Scout AI 談 MTS](https://scoutnow.ai/blog/rebirth-member-of-technical-staff)） |
| **AI Research Engineer / Research Scientist** | 僅限前沿實驗室；偏好博士。 | [Sundeep Teki - AI Research Eng 2026](https://www.sundeepteki.org/advice/the-ultimate-ai-research-engineer-interview-guide-cracking-openai-anthropic-google-deepmind-top-ai-labs) |
| **AI Solutions Architect** | 在企業端比重很高。 | EY、Caterpillar、Deloitte（[EY 職缺](https://careers.ey.com/ey/job/Amsterdam-AI-Solution-Architect-1083-HP/1258705801/)） |
| **AI Platform Engineer** | 擁有內部 LLM-ops 平台。 | [Augment Code 規格 2026](https://www.augmentcode.com/guides/ai-platform-engineering-leader-job-spec) |
| **AI Engineering Manager** | 單一職位中薪酬最高者；中位數 $293.5K（[AI Pulse 基準](https://theaimarketpulse.com/salaries/)）。 | 在規模化公司以上普遍存在 |
| **AI Product Manager** | 幾乎每一個 B2B SaaS 都需要。 | 普遍（[Aakash Gupta](https://www.aakashg.com/product-manager-requirements/)） |
| **AI Technical Program Manager (TPM)** | 專精方向：「Responsible AI TPM」、「AI Infrastructure TPM」、「GenAI Customer Performance TPM」 | Microsoft、AMD、Together AI |

### 2025 年以來的新職稱

| 職稱 | 為何出現 | 在哪裡張貼 |
|-------|----------------|-------------------|
| **Forward Deployed Engineer (FDE)** | 前沿 AI 的買方把駐點工程當成交付項目來要求。 | OpenAI、Anthropic、Google（[Anthropic FDE](https://job-boards.greenhouse.io/anthropic/jobs/4985877008)） |
| **AI Evaluation Engineer** | 評估工作成熟為一門獨立的學科。 | OpenAI（[Applied Evals](https://openai.com/careers/software-engineer-applied-evals-san-francisco/)、[Frontier Evals](https://openai.com/careers/research-engineer-frontier-evals-and-environments-san-francisco/)）、Apple、Scale AI、Distyl、Apex |
| **Agentic Systems Engineer / AI Agent Engineer** | 代理成為自己獨立的工程介面。 | Teradata、GE Vernova、Deloitte、OpenAI（[Agent Infrastructure SWE](https://openai.com/careers/software-engineer-agent-infrastructure-san-francisco/)） |
| **AI Reliability Engineer** | 生產環境的 AI 需要類似 SRE 的紀律；與傳統 SRE 有別。 | Anthropic（[Staff/Sr AI Reliability](https://www.anthropic.com/jobs)）；AI SRE 作為一個類別正由 Resolve.ai、Rootly 在定義。 |
| **AI Security Engineer / LLM Red Team Specialist** | 提示注入防禦與越獄研究成為一門學科。 | Life360（[Principal AI Security Engineer](https://www.remoterocketship.com/us/company/life360/jobs/principal-ai-security-engineer-ai-native-platform-united-states-remote/)）；[Practical DevSecOps](https://www.practical-devsecops.com/emerging-ai-security-roles/) 列舉了 10 個新興 AI 安全職位。 |
| **MCP Engineer / MCP Software Engineer** | MCP 的採用讓伺服器開發成為自己獨立的專業。 | Descope（[MCP SWE](https://careers.descope.com/p/fe57f6224769-mcp-model-context-protocol-software-engineer)） |
| **AI Operator / Computer-Use Specialist** | 與 OpenAI Operator 及 Claude Cowork 綁定。 | $75-120K 專才層級（[Coasty](https://coasty.ai/blog/best-computer-use-platform-2026-20260402)） |

### 正在消失或整併的角色

- **Prompt Engineer（獨立職稱）：** 職稱正在消亡。技能則作為基本門檻留存下來。
- **Distillation Engineer：** 以一項*職責*的形式出現在微調／推論工程師的職缺中，而非自己被廣泛張貼的需求職位。

---

## 依職涯層級劃分的技能 {#skills-by-career-level}

### L4-L5（中階個人貢獻者，3-5 年）

- Python 生產環境熟練度，**71% 的 AI 職缺要求**（[Second Talent](https://www.secondtalent.com/resources/most-in-demand-ai-engineering-skills-and-salary-ranges/)）
- 至少實際操作過一個主要 LLM 供應商 SDK（OpenAI、Anthropic、Bedrock）以及一個編排框架，最常見的是 LangChain/LangGraph（佔代理式 AI 職缺的 34.3%；[Agentic Engineering Jobs](https://agentic-engineering-jobs.com/langchain-job-market-2026)）
- 向量資料庫基礎：Pinecone、Weaviate、pgvector，特定工具的經驗可在數週內學會，最重要的是概念上的理解
- RAG：分塊、混合搜尋、BM25、重排序、檢索評估
- 容器化：Docker（15.4%）、Kubernetes（17.6%）
- 雲端：AWS（32.9%）、Azure（26%）

### L6-L7（資深 / Staff）

- 從頭到尾完整出貨過的生產環境 LLM 系統，「出貨真實系統的產業經驗，比學術資歷是更好的訊號」
- 跨向量索引、GPU 記憶體、代理狀態的多租戶隔離
- 評估框架（LangSmith / Langfuse / Braintrust）；以評估為閘門的 CI/CD
- 微調 / LoRA / QLoRA / RLHF
- 成本最佳化，token 預算、模型路由、快取
- 「把 LLM、向量儲存與 RAG 當作標準系統設計的一部分來推理，而不是當作小眾的專長」（[Design Gurus](https://designgurus.substack.com/p/system-design-interviews-changed)）

### L8+（Principal / 領導型個人貢獻者）

- 擁有代理編排層、模型路由、服務所有工程團隊的 LLMOps 平台
- 為非確定性系統提供執行期治理
- 為 SOC 2 / HIPAA / EU AI Act 合規進行架構設計，在 AI Act 第 27 條下觸發 DPIA + FRIA
- 「定義技術願景並擴展工程團隊，比單純的程式撰寫實力更重要」

### 管理職軌（EM / Director）

- AI Engineering Manager 中位數 $293.5K，單一職位中薪酬最高者（[AI Pulse](https://theaimarketpulse.com/salaries/)）
- 招聘評分標準現在加重：「你能不能把這個人放進一個有 PM 和一位初階工程師的房間裡，讓他主導技術方向而不搞砸」，7 位受訪招聘經理中有 5 位這麼說（[Design Gurus](https://designgurus.substack.com/p/system-design-interviews-changed)）
- 在前沿實驗室，使命契合度與安全判斷力被高度加權（[Anthropic EM 指南](https://www.gethireready.com/interview-guides/engineering-manager-anthropic)）

### PM 職軌（AI PM / AI TPM）

- 「AI 是新的基準線，而非加分技能」
- 4 年以上 PM 經驗，最好是 B2B SaaS 或 AI 驅動的產品
- 關鍵：「在資深 AI PM 候選人中，能同時達到技術流暢度加上產品嚴謹度標準的，不到四分之一」（[Aakash Gupta](https://www.aakashg.com/product-manager-requirements/)）
- 「能拿出可運作原型的候選人，勝過只能口頭描述的候選人」

---

## 職缺實際要求什麼 {#what-job-listings-actually-require}

### 必備（在 100 多則職缺中被點名為必要）

- Python 生產環境程式碼，3 年以上
- LLM API 整合（OpenAI / Anthropic / Bedrock）
- RAG 管線經驗，包含向量資料庫、分塊、檢索評估
- 生產等級的可觀測性與評估管線
- 雲端 + Kubernetes + IaC
- 代理除錯 / 多步驟工作流程追蹤
- 針對安全敏感角色的提示注入 / 越獄防禦

### 加分（明確列為「plus」或「bonus」）

- 著作或 OSS 貢獻；對應用型角色而言，3-5 個專案的可運作作品集勝過一篇論文
- CUDA / GPU 層級最佳化，在 NVIDIA／前沿實驗室是必備，在其他地方是加分
- 蒸餾 / 模型壓縮
- 分散式推論經驗
- 用於老舊企業系統整合的 Java/C++
- RLHF 以外的強化學習

### 職缺中的頂尖技術堆疊（2026 年 5 月）

依出現頻率排序：

1. **Python** - 佔所有 AI 職缺的 71%
2. **PyTorch / JAX** - 在前沿實驗室普遍存在
3. **LangChain / LangGraph** - 佔代理式職缺的 34.3%，第一名的框架
4. **LlamaIndex** - 在 38% 的 LangChain 職缺中一同出現
5. **AWS（32.9%）/ Azure（26%）/ GCP / Vertex / Bedrock**
6. **Kubernetes（17.6%）+ Docker（15.4%）**
7. **向量資料庫：** Pinecone、Weaviate、Qdrant、Chroma、pgvector
8. **MCP（Model Context Protocol）** - 在最尖端的團隊中現已成為[「一項基本要求」](https://medium.com/@adnanmasood/the-rise-of-model-context-protocol-mcp-skills-5f0d6a1c3579)
9. **可觀測性：** LangSmith、Langfuse、Braintrust、Arize
10. **推論引擎：** vLLM、SGLang、TensorRT-LLM
11. **Terraform / Helm / Ray / Kubeflow / MLflow / Feast** - 內部平台堆疊
12. **供應商 SDK：** OpenAI Agents SDK、Claude SDK、Vercel AI SDK、Mastra、Pydantic AI

### 依公司層級劃分

- **前沿實驗室**（Anthropic、OpenAI、xAI）：PyTorch/JAX、vLLM/自製推論、內部評估、MCP 伺服器、CUDA/GPU 層級最佳化
- **規模化公司**（Cursor、Harvey、Sierra、Decagon、Glean、Perplexity）：TypeScript + Python 混合、LangGraph / OpenAI Agents SDK、Pinecone/pgvector、LangSmith/Braintrust 評估
- **企業**（Deloitte、EY、Caterpillar、Citi）：以 Azure 為主、Bedrock、LangChain、治理／MLOps 重點、地端能力

### 非技術要求

- **溝通 / 跨職能協作** - 在資深以上是基本門檻
- **面向客戶的技能** - 對 FDE 角色而言是承重要素；Anthropic 要求 3 年以上「技術性、面向客戶的角色」經驗
- **OSS 貢獻** - Anthropic 明確表示：[「如果你做過有趣的獨立研究、寫過有洞見的部落格文章，或對開源軟體做出實質貢獻，請把那些放在你履歷的最頂端」](https://www.sundeepteki.org/advice/how-to-get-hired-at-openai-anthropic-and-google-deepmind-in-2026)
- **著作** - AI Research Engineer 必備；只有約 50% 的 Anthropic 技術人員持有博士學位
- **使命契合度** - Anthropic 透過一輪行為與價值觀面試明確篩選它
- **法規經驗：** 企業端的 SOC 2 / HIPAA / FedRAMP；歐盟營運的 EU AI Act 熟悉度（FRIA/DPIA）
- **安全許可（security clearance）** - Lockheed 及聯邦相關角色必備

---

## 薪酬現實 {#compensation-reality}

> 僅限公開來源範圍。請以 [levels.fyi](https://www.levels.fyi/) 查驗最新資料。除另有註明外，所有數字皆為美元。

| 層級 / 公司 | 職級 | 總薪酬 |
|---|---|---|
| **Anthropic（SF）** | Senior SWE | $316K base / $563K TC |
| **Anthropic（SF）** | Lead SWE | $332K base / $785K TC |
| **OpenAI（SF）** | 所有 SWE | $251K – $1.28M+ TC |
| **OpenAI（SF）** | L5 SWE | $336K base + $774K stock = $1.15M TC |
| **OpenAI MTS / Research Scientist** | - | $245K – $685K base |
| **Cursor（Anysphere）** | SWE | $850K – $1.28M TC |
| **Sierra** | SWE | $200K – $460K TC；中位數 $450K |
| **Thinking Machines Lab** | 所有工程 | $450K – $500K base（第一季 H-1B 申報） |
| Google AI Engineer | L3-L6 | $183K – $583K TC；中位數 $280K |
| Microsoft AI Engineer | 全部 | $238K – $355K+ TC；中位數 $282K |
| **全美 AI Engineer** | 入門（0-2 年） | $90-135K base / $110-160K TC |
| **全美 AI Engineer** | 中階（3-5 年） | $140-210K base / $170-260K TC |
| **全美 AI Engineer** | 資深（6-9 年） | $180-280K base / $220-350K+ TC |
| **全美 AI Engineer** | Staff/Principal（10 年以上） | $250-400K+ base / $350-600K+ TC |
| RAG Engineer 資深 | - | $195-290K base；在前沿達 $400K+ TC |
| LLM Fine-Tuning Specialist | - | $195K-$350K |
| AI Security Engineer | - | $152-210K |
| LLM Red Team Specialist | - | $160-230K |
| **AI Engineering Manager** | - | $293.5K 中位數（單一職位中薪酬最高者） |
| AI Product Manager | - | $141K – $250K（中位數 $159K） |
| **Agentic AI Architect** | - | $260K – $420K base |
| AI Evaluation Engineer | - | 公開職缺太少，難以得出穩定範圍；各公司會將它對標到自家的資深 SWE 薪資帶。請以全美資深那一列作為錨點。 |
| MCP / Integrations Engineer | - | 公開資料稀薄的新職稱；通常被定級為資深平台工程。請錨定到資深 SWE 薪資帶。 |
| 倫敦（量化基金 / FAANG） | Senior ML | £140-180K base；£200K+ TC |
| 倫敦（Google DeepMind） | 資深 | £110-155K base + RSU |
| 柏林 / 德國 | 資深 | €95-130K |
| **班加羅爾（頂尖 GCC / AI 優先）** | 資深 | ₹1-2 Cr TC |
| 班加羅爾（應屆博士 / 頂尖碩士） | 入門 | ₹22-32 LPA |
| 新加坡 | 平均 | S$221,200 |
| 新加坡（Principal/Lead） | 10 年以上 | S$323,505 |

**來源：** [levels.fyi Anthropic](https://www.levels.fyi/companies/anthropic/salaries/software-engineer)、[OpenAI](https://www.levels.fyi/companies/openai/salaries/software-engineer)、[Cursor](https://www.levels.fyi/companies/cursor/salaries/software-engineer)、[Sierra](https://www.levels.fyi/companies/sierra/salaries/software-engineer)、[Pin AI Comp Guide 2026](https://www.pin.com/blog/ai-compensation-salary-guide/)、[Kore1 薪資指南](https://www.kore1.com/ai-engineer-salary-guide/)、[AI Pulse 基準](https://theaimarketpulse.com/salaries/)、[Career Check London 2026](https://www.careercheck.io/blog/ml-engineer-salary-london-2026)、[Zen van Riel Europe](https://zenvanriel.com/job/ai-engineer-salary-europe/)、[Scaler India](https://www.scaler.com/topics/ai-ml-engineer-salary-complete-guide/)。

### 薪酬洞察

前沿實驗室 MTS 薪酬（Anthropic/OpenAI 中位數約 $600-795K）與企業 AI 工程（中階約 $170-260K）之間的差距是 **3-5 倍**。請睜大眼睛選擇你的公司層級。

---

## 地理與產業分布 {#geographic--industry-distribution}

- **集中度：** 超過 65% 的 AI 工程師位於 SF + NYC
- **雙層市場：** Indeed Hiring Lab 報告，約 95% 的招聘公司「並未」張貼過 AI 職缺，採用集中在規模最大的公司（[Indeed Hiring Lab 2026 年 1 月](https://www.hiringlab.org/2026/01/16/ai-adoption-accelerating-still-concentrated-among-largest-firms/)）
- **企業採用：** 截至 2026 年第一季，72% 的企業在生產環境中至少有一個 AI 工作負載（[Medha Cloud](https://medhacloud.com/blog/ai-adoption-statistics-2026)）
- **顧問業熱潮：** BCG 報告其 2025 年 144 億美元營收中有 25%（36 億美元）來自 AI 顧問（[Metaintro BCG](https://www.metaintro.com/blog/bcg-25-percent-ai-revenue-consulting-jobs-2026)）
- **國際招聘同比成長 82%**；67% 的公司提供搬遷補助方案
- **遠端友善：** LangChain 生態系 35.2% 遠端、48.4% 混合、16.4% 嚴格要求進辦公室
- **Indeed AI 追蹤器：** 2025 年 12 月佔所有職缺的 4.2%，在整體招聘疲弱中持續成長

---

## 面試流程模式 {#interview-process-patterns}

2026 年 5 月在 AI 原生公司的標準：

1. **招募人員初篩**（30 分鐘）- 文化／使命 + 薪酬 + 簽證
2. **技術電話篩選**（60-90 分鐘）- 實務編碼，生產風格
3. **帶回家作業**（48 小時 - 3 天）- 在 LangChain、Mistral、Eightfold 很常見；建構一個小型 RAG/代理系統。[「這不是測試你能不能建構，而是你怎麼建構，包括程式碼品質、評估、錯誤處理」](https://github.com/alexeygrigorev/ai-engineering-field-guide/blob/main/interview/01-interview-process.md)
4. **現場／虛擬連環面試**（4-6 小時）：編碼回合 + AI 系統設計 + 專案深入探討 + 行為。[「純白板的回合大多已經消失，連 Google 的形式現在都是協作式的」](https://designgurus.substack.com/p/system-design-interviews-changed)
5. **招聘經理 / 價值觀回合** - 在 Anthropic 是明確設置的

### AI 角色的細節

- **系統設計回合**現在預期會涉及 LLM 基礎設施、GPU 排程、向量儲存、RAG、以評估為閘門的 CI、成本／延遲取捨
- **AI 輔助編碼回合**在 Meta、Canva、Google、Microsoft、Sierra、Cursor 明確允許使用 AI 工具（Cursor、Copilot、Claude），評估的是提示技巧與輸出驗證
- **帶回家作業的透明度：** 加上一份「AI 稽核註記」，說明你用 AI 做了什麼、你改了什麼、為什麼。透明勝過隱匿
- **Sierra：** 僅在 SF 或 NY 辦公室現場進行；「Plan + Build + Present」2 小時的代理評測，沒有演算法回合
- **Cursor：** 8 小時帶回家作業，使用他們自家產品，文件有限並提供一個 Slack 頻道，評估產品sense、自主性、系統設計
- **Anthropic：** 「聽起來像是前一晚才趕出來的答案，是個糟糕的訊號」

### 前沿實驗室的細節

- **Anthropic：** 90 分鐘、4 個層級逐步加難的編碼問題，測試你是否寫出能吸收新需求的乾淨模組化程式碼。價值觀回合明確設置。
- **OpenAI：** 「設計 OpenAI Playground」- 為討論串／訊息歷史做線框圖 + API + DB schema；多租戶安全雲端 IDE
- **Mistral（巴黎）：** 5 回合流程，不接受遠端，並有一個專門的「LLM 理論」階段，涵蓋 transformer 內部機制與對齊

---

## 值得關注的新興職位 {#emerging-roles-to-watch}

這些角色在 2026 年 5 月成長最快，如果你正在規劃 12 個月的職涯軌跡，可以押注它們。

### Forward Deployed Engineer (FDE)
- **為何：** 前沿 AI 的買方（Fortune 500、政府、生技）把駐點工程當成合約交付項目來要求
- **薪酬：** 在前沿實驗室，中至資深層級 $350-550K
- **技能：** RAG、微調、蒸餾、MCP、面向客戶的溝通、在客戶現場做評估
- **在哪裡：** OpenAI、Anthropic、Google、ElevenLabs、Cohere、Mistral、規模化公司

### AI Evaluation Engineer
- **為何：** 評估成熟為一門學科；生產環境需要以評估為閘門的 CI/CD
- **薪酬：** 約聘 $100-110/小時；前沿實驗室全職 $200-400K
- **技能：** LLM-as-judge 校準、錯誤分析方法論、統計校正、資料集策展、回歸偵測
- **在哪裡：** OpenAI（Applied Evals、Frontier Evals）、Apple、Scale AI、Distyl、Apex

### Agentic Systems Engineer
- **為何：** 多代理與工具使用成為一等公民的系統工程
- **薪酬：** 通常 $84-250K；代理式 AI 架構師 $260-420K
- **技能：** LangGraph / 多代理編排、MCP、A2A 協定、代理除錯、工具設計、沙箱安全
- **在哪裡：** Teradata、GE Vernova、Deloitte、OpenAI（Agent Infrastructure）

### AI Reliability Engineer
- **為何：** 生產環境的 AI 需要針對非確定性系統的類 SRE 紀律
- **薪酬：** 前沿實驗室資深 $250-400K（Anthropic 正在張貼 Staff/Sr 角色）
- **技能：** AI 代理的事件回應、失控迴圈的圍堵、成本異常偵測、多供應商後備
- **在哪裡：** Anthropic；「AI SRE」類別正由 Resolve.ai、Rootly 在定義

### AI Security Engineer / LLM Red Team Specialist
- **為何：** 在 2026 年 5 月的 AI 安全拐點（Mythos 揭露、Daybreak、MDASH、首個真實世界中由 AI 打造的零時差漏洞）之後，提示注入加上越獄研究成為獨立的學科
- **薪酬：** 依專精方向 $152-230K
- **技能：** 間接提示注入防禦、越獄研究、constitutional classifiers、模型供應鏈信任、MCP 威脅建模
- **在哪裡：** Life360、前沿實驗室、安全導向的企業

### MCP Engineer
- **為何：** MCP 生態系的成熟讓伺服器開發成為自己獨立的專業
- **技能：** MCP 伺服器設計（HTTP/STDIO）、OAuth 資源伺服器模式、agent-card 簽署、MCP 安全
- **在哪裡：** Descope、與 Anthropic 對齊的規模化公司、Fortune 500 的內部平台

---

## 策略要點 {#strategic-takeaways}

給正在規劃下一步的**工程師**：

1. **把自己定位成專才，而非「Prompt Engineer」。** 選一門學科（評估、代理、RAG、FDE、MLOps）並建立深度。
2. **可運作的作品集 > 論文。** 出貨 3-5 個具備評估與可觀測性的生產等級專案。對應用型角色而言，Anthropic、OpenAI 與規模化公司全都把這一點看得比著作重。
3. **FDE 槓桿很高。** 如果你能把技術深度與面向客戶的溝通結合起來，前沿實驗室的 FDE 薪酬就是市場頂端（獨角獸的創辦人／staff 股權除外）。
4. **市場已經分岔。** 通才型中階 SWE 工作正被砍掉。資深 AI 專才則處於賣方市場。請據此規劃你的軌跡。

給正在建立評分標準的**招聘經理**：

1. **針對具體問題招聘，而非為「AI Engineer」招聘。** 如果你寫一份通用的 AI Engineer JD，你就會得到通用的候選人。
2. **優先評估已出貨的系統。** 一份模擬你實際工作負載的帶回家作業（為我們的領域建構一個小型 RAG 代理），比演算法謎題更有預測力。
3. **AI 輔助編碼回合現在是標準。** 觀看候選人提示加上驗證模型輸出，比封鎖 AI 的使用更有資訊量。
4. **薪資分帶很重要。** 前沿實驗室的薪酬正對下兩層造成留才壓力。如果你是招聘 AI 人才的企業，請對標當地市場，並為資深以上加上 15-25% 的 AI 溢價。

給正在做組織設計的**工程領導者**：

1. **把角色對應到工作，而非對應到職稱。** 「AI Engineer」是你的統稱。在它之內，請點名明確的專精方向（RAG lead、agent lead、eval lead、platform lead）。
2. **Eval Engineer 是個真實的角色。** 別讓一位功能工程師去擁有他自己正試圖改善的那個指標。把衡量與交付分開。
3. **FDE 只在客戶 ARR 約 $500K 以上才划算。** 在那之下，使用解決方案工程。在那之上，FDE 透過文件無法概括的客戶專屬工程來賺取它的薪酬。
4. **AI Reliability Engineer 是你還不知道自己需要的角色。** 當你的第一個代理在凌晨 3 點陷入迴圈，並在迴圈防護機制觸發前燒掉 5 萬美元的 API 花費時，你會希望 6 個月前就有了這個角色。

---

## 參考資料 {#references}

本章節取材自截至 2026 年 5 月 17 日的 100 多則公開職缺、招聘報告與招募人員訊號。主要來源：

### 招聘市場報告
- [Ivan Turkovic - AI Job Titles 2026: A CTO's Guide to the Naming Chaos](https://www.ivanturkovic.com/2026/04/24/ai-job-titles-2026-naming-chaos/)
- [Kore1 - AI Engineer Salary Guide 2026](https://www.kore1.com/ai-engineer-salary-guide/)
- [Kore1 - Tech Layoffs Q1 2026](https://www.kore1.com/tech-layoffs-2026/)
- [Pin - AI Compensation Benchmarks 2026](https://www.pin.com/blog/ai-compensation-salary-guide/)
- [Allwork.space - AI Hiring Rising vs Layoffs](https://allwork.space/2026/05/ai-hiring-is-rising-even-as-tech-layoffs-surge-140/)
- [Tom's Hardware - Q1 2026 Layoffs](https://www.tomshardware.com/tech-industry/tech-industry-lays-off-nearly-80-000-employees-in-the-first-quarter-of-2026-almost-50-percent-of-affected-positions-cut-due-to-ai)
- [Indeed Hiring Lab - Jan 2026 AI in Postings](https://www.hiringlab.org/2026/01/22/january-labor-market-update-jobs-mentioning-ai-are-growing-amid-broader-hiring-weakness/)
- [Indeed Hiring Lab - AI Adoption Concentration](https://www.hiringlab.org/2026/01/16/ai-adoption-accelerating-still-concentrated-among-largest-firms/)
- [Second Talent - Top 10 In-Demand AI Engineering Skills](https://www.secondtalent.com/resources/most-in-demand-ai-engineering-skills-and-salary-ranges/)
- [World Economic Forum - AI Added 1.3M Jobs](https://www.weforum.org/stories/2026/01/ai-has-already-added-1-3-million-new-jobs-according-to-linkedin-data/)
- [AI Pulse - AI & ML Engineer Salary Benchmarks 2026](https://theaimarketpulse.com/salaries/)
- [Agentic Engineering Jobs - LangChain Market 2026](https://agentic-engineering-jobs.com/langchain-job-market-2026)

### 薪酬資料
- [levels.fyi - Anthropic](https://www.levels.fyi/companies/anthropic/salaries/software-engineer)
- [levels.fyi - OpenAI](https://www.levels.fyi/companies/openai/salaries/software-engineer)
- [levels.fyi - Cursor](https://www.levels.fyi/companies/cursor/salaries/software-engineer)
- [levels.fyi - Sierra](https://www.levels.fyi/companies/sierra/salaries/software-engineer)
- [levels.fyi - Google AI](https://www.levels.fyi/companies/google/salaries/software-engineer/title/ai-engineer)
- [levels.fyi - Microsoft AI](https://www.levels.fyi/companies/microsoft/salaries/software-engineer/title/ai-engineer)
- [Entrepreneur - OpenAI Salaries (Federal Filing)](https://www.entrepreneur.com/business-news/how-much-openai-employees-make-salaries-685000)
- [Career Check - ML Engineer Salary London 2026](https://www.careercheck.io/blog/ml-engineer-salary-london-2026)
- [Zen van Riel - AI Engineer Salary Europe](https://zenvanriel.com/job/ai-engineer-salary-europe/)
- [Scaler - AI/ML Engineer Salary India](https://www.scaler.com/topics/ai-ml-engineer-salary-complete-guide/)
- [Morgan McKinley - Singapore AI/ML Engineer](https://www.morganmckinley.com/sg/salary-guide/data/ai-ml-engineer/singapore)

### 前沿實驗室職涯來源
- [Anthropic - Careers](https://www.anthropic.com/careers)
- [Anthropic - Forward Deployed Engineer](https://job-boards.greenhouse.io/anthropic/jobs/4985877008)
- [Anthropic - Applied AI Engineer](https://job-boards.greenhouse.io/anthropic/jobs/5116274008)
- [OpenAI Careers](https://openai.com/careers/search/)
- [OpenAI - Applied Evals](https://openai.com/careers/software-engineer-applied-evals-san-francisco/)
- [OpenAI - Frontier Evals & Environments](https://openai.com/careers/research-engineer-frontier-evals-and-environments-san-francisco/)
- [OpenAI - Agent Infrastructure SWE](https://openai.com/careers/software-engineer-agent-infrastructure-san-francisco/)
- [Sundeep Teki - How to Get Hired at OpenAI/Anthropic/DeepMind 2026](https://www.sundeepteki.org/advice/how-to-get-hired-at-openai-anthropic-and-google-deepmind-in-2026)
- [Sundeep Teki - AI Research Engineer Interview Guide](https://www.sundeepteki.org/advice/the-ultimate-ai-research-engineer-interview-guide-cracking-openai-anthropic-google-deepmind-top-ai-labs)
- [Sundeep Teki - FDE Interviews](https://www.sundeepteki.org/advice/the-definitive-guide-to-forward-deployed-engineer-interviews-in-2026)
- [Hashnode - Complete 2026 Guide to FDE](https://hashnode.com/blog/a-complete-2026-guide-to-the-forward-deployed-engineer)

### 面試流程來源
- [Design Gurus - System Design Interviews Changed in 2026](https://designgurus.substack.com/p/system-design-interviews-changed)
- [IGotAnOffer - Anthropic Interview Process](https://igotanoffer.com/en/advice/anthropic-interview-process)
- [Jobright - Anthropic Technical Interview 2026](https://jobright.ai/blog/anthropic-technical-interview-questions-complete-guide-2026/)
- [Sierra - The AI-Native Interview](https://sierra.ai/blog/the-ai-native-interview)
- [Alexey Grigorev - AI Engineering Field Guide (Interview Process)](https://github.com/alexeygrigorev/ai-engineering-field-guide/blob/main/interview/01-interview-process.md)
- [interviewing.io - Meta AI-Assisted Coding Interview](https://interviewing.io/blog/how-to-use-ai-in-meta-s-ai-assisted-coding-interview-with-real-prompts-and-examples)
- [Exponent - OpenAI System Design 2026](https://www.tryexponent.com/blog/openai-system-design-interview)
- [Exponent - Anthropic System Design 2026](https://www.tryexponent.com/blog/anthropic-system-design-interview)

### 新興角色報導
- [AI Career Lab - Agentic-AI Job Guide 2026](https://theaicareerlab.com/blog/agentic-ai-jobs-guide-2026)
- [Practical DevSecOps - Top 10 Emerging AI Security Roles](https://www.practical-devsecops.com/emerging-ai-security-roles/)
- [Fast Company - Google/Box CEOs: FDE most in-demand](https://www.fastcompany.com/91541878/google-box-ceos-say-this-is-the-most-in-demand-job-in-tech)
- [Computerworld - FDE career emerging from AI shift](https://www.computerworld.com/article/4171867/heres-one-career-emerging-from-the-ai-shift-forward-deployed-engineers.html)
- [Rootly - AI SRE Guide 2026](https://rootly.com/ai-sre-guide)
- [Resolve.ai - What is an AI SRE](https://resolve.ai/glossary/what-is-ai-sre)
- [Medium - Rise of MCP Skills](https://medium.com/@adnanmasood/the-rise-of-model-context-protocol-mcp-skills-5f0d6a1c3579)

### 合規與法規
- [EU AI Act Implementation Timeline](https://artificialintelligenceact.eu/implementation-timeline/)
- [Secure Privacy - EU AI Act 2026 Compliance](https://secureprivacy.ai/blog/eu-ai-act-2026-compliance)
- [Augment Code - EU AI Act 2026 Guide](https://www.augmentcode.com/guides/eu-ai-act-2026)

---

*另見：[題庫](01-question-bank.md) | [答題框架](02-answer-frameworks.md) | [AI 角色的行為面試](05-behavioral-for-ai-roles.md) | [角色轉職指南](../TRANSITION_GUIDE.md)*
