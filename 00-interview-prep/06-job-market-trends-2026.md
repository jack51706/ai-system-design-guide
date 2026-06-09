# AI Job Market Trends - June 2026

> **Last verified: June 10, 2026.** This chapter distills what's actually happening in AI hiring right now - titles companies post, skills they screen for, compensation ranges, and the interview formats you'll encounter. Sourced from 100+ public job listings, hiring reports, and recruiter signals across April-June 2026.

> **June 2026 update:** Two market-moving events since the May sweep. Anthropic released **Claude Fable 5** (June 9, $10/$50 per 1M), bringing Mythos-class capability to general availability with an Opus 4.8 fallback safeguard; expect a wave of capability-ceiling product work and the eval, safety, and routing roles that come with it. DeepSeek made its **75% V4 Pro discount permanent** (May 22), accelerating the cost-engineering hiring trend: candidates who can exploit a 70x price spread across model tiers are screening well. Compensation rows below are from the May 17 sweep; treat them as floors in the segments those events touch.

This chapter is for engineers planning their next move, hiring managers building rubrics, and engineering leaders making organizational design decisions. It complements [TRANSITION_GUIDE.md](../TRANSITION_GUIDE.md) (how to transition into AI roles) and the [Question Bank](01-question-bank.md) (what to study).

---

## Table of Contents

- [The Three Headline Shifts](#the-three-headline-shifts)
- [Role Taxonomy in 2026](#role-taxonomy-in-2026)
- [Skills by Career Level](#skills-by-career-level)
- [What Job Listings Actually Require](#what-job-listings-actually-require)
- [Compensation Reality](#compensation-reality)
- [Geographic & Industry Distribution](#geographic--industry-distribution)
- [Interview Process Patterns](#interview-process-patterns)
- [Emerging Roles to Watch](#emerging-roles-to-watch)
- [Strategic Takeaways](#strategic-takeaways)
- [References](#references)

---

## The Three Headline Shifts

If you read nothing else, internalize these three things.

### 1. The market is paradoxically hot and cold.

Q1 2026 saw ~52,050 tech layoffs (Oracle 30K, Amazon, Meta, Dell), the highest Q1 since 2023 ([Kore1](https://www.kore1.com/tech-layoffs-2026/); [Tom's Hardware](https://www.tomshardware.com/tech-industry/tech-industry-lays-off-nearly-80-000-employees-in-the-first-quarter-of-2026-almost-50-percent-of-affected-positions-cut-due-to-ai)). Simultaneously, AI roles grew +8.9% QoQ and +4.8% YoY, with ~275,000 unfilled AI roles ([Allwork.space](https://allwork.space/2026/05/ai-hiring-is-rising-even-as-tech-layoffs-surge-140/)). Junior/entry-level engineers were hit hardest - routine codegen, QA testing, basic frontend work disproportionately cut. Senior + specialist AI roles remained resilient.

**Implication:** "Tech hiring" and "AI hiring" are not the same story in 2026. If your career is generalist mid-level SWE work, you're feeling the cold market. If you're AI-specialized at senior level, you're in a sellers' market.

### 2. The title is collapsing; the work is fragmenting.

Most companies now post "AI Engineer" as the umbrella, but inside the role you specialize quickly into RAG, agents, evals, fine-tuning, or platform work. ["Most AI job titles will collapse into 'AI Engineer' over the next 18 months; prestige labels survive only at frontier labs"](https://www.ivanturkovic.com/2026/04/24/ai-job-titles-2026-naming-chaos/). The "Prompt Engineer" standalone title has effectively disappeared from major job boards - the skill survived; the title didn't ([PE Collective](https://pecollective.com/blog/is-prompt-engineering-a-real-career/); [Medium - Prompt Engineering Is Dead 2026](https://medium.com/write-a-catalyst/prompt-engineering-is-dead-2026-ai-systems-engineering-7acdbbcb2160)).

**Implication:** If you're hiring a "Prompt Engineer," you're 18 months behind. Define the actual problem (eval rigor? agent debugging? customer-facing tuning?) and hire for that specific role.

### 3. Forward Deployed Engineer is the breakout role of 2026.

FDE didn't exist as a discrete category at frontier labs in mid-2025. By May 2026, OpenAI, Anthropic, and Google are all hiring hundreds. Google/Box CEOs publicly called it "the most in-demand job in tech" ([Fast Company](https://www.fastcompany.com/91541878/google-box-ceos-say-this-is-the-most-in-demand-job-in-tech); [Hashnode FDE guide](https://hashnode.com/blog/a-complete-2026-guide-to-the-forward-deployed-engineer)). TC stabilized at $350-550K mid-to-senior.

**Implication:** Frontier-AI buyers (Fortune 500, government, biotech) demand on-site engineering presence as a contractual deliverable. FDE is the role that exists because the buyer values it - not because it's the most efficient way to deliver software.

---

## Role Taxonomy in 2026

### Established titles (still hiring strongly)

| Title | Description | Where it's posted |
|-------|-------------|-------------------|
| **AI Engineer** | The de facto general-purpose AI title. Other titles are collapsing into it. | Universal - most postings |
| **LLM Engineer** | Centered on transformer fine-tuning, RAG, agents. Distinct from ML Engineer. | Mid-large companies; [iSmart LLM JD 2026](https://www.ismartrecruit.com/job-descriptions/llm-engineer) |
| **ML Engineer / ML+AI Software Engineer** | Classic training-and-deployment role. | [levels.fyi ML/AI focus](https://www.levels.fyi/t/software-engineer/focus/ml-ai) |
| **Applied AI Engineer** | Customer-embedded variant at frontier labs. | [Anthropic Applied AI](https://job-boards.greenhouse.io/anthropic/jobs/5116274008) |
| **Member of Technical Staff (MTS)** | Deliberately ambiguous title that blurs research vs engineering. | OpenAI, Anthropic, Thinking Machines, Mistral ([Scout AI on MTS](https://scoutnow.ai/blog/rebirth-member-of-technical-staff)) |
| **AI Research Engineer / Research Scientist** | Frontier labs only; PhD-preferred. | [Sundeep Teki - AI Research Eng 2026](https://www.sundeepteki.org/advice/the-ultimate-ai-research-engineer-interview-guide-cracking-openai-anthropic-google-deepmind-top-ai-labs) |
| **AI Solutions Architect** | Heavy in enterprise. | EY, Caterpillar, Deloitte ([EY listing](https://careers.ey.com/ey/job/Amsterdam-AI-Solution-Architect-1083-HP/1258705801/)) |
| **AI Platform Engineer** | Owns the internal LLM-ops platform. | [Augment Code spec 2026](https://www.augmentcode.com/guides/ai-platform-engineering-leader-job-spec) |
| **AI Engineering Manager** | Highest-paying single role; median $293.5K ([AI Pulse benchmarks](https://theaimarketpulse.com/salaries/)). | Universal at scale-ups+ |
| **AI Product Manager** | Required for nearly every B2B SaaS. | Universal ([Aakash Gupta](https://www.aakashg.com/product-manager-requirements/)) |
| **AI Technical Program Manager (TPM)** | Specializations: "Responsible AI TPM," "AI Infrastructure TPM," "GenAI Customer Performance TPM" | Microsoft, AMD, Together AI |

### NEW titles since 2025

| Title | Why it emerged | Where it's posted |
|-------|----------------|-------------------|
| **Forward Deployed Engineer (FDE)** | Frontier-AI buyers demand on-site engineering as a deliverable. | OpenAI, Anthropic, Google ([Anthropic FDE](https://job-boards.greenhouse.io/anthropic/jobs/4985877008)) |
| **AI Evaluation Engineer** | Eval work matured into a discrete discipline. | OpenAI ([Applied Evals](https://openai.com/careers/software-engineer-applied-evals-san-francisco/), [Frontier Evals](https://openai.com/careers/research-engineer-frontier-evals-and-environments-san-francisco/)), Apple, Scale AI, Distyl, Apex |
| **Agentic Systems Engineer / AI Agent Engineer** | Agents became their own engineering surface. | Teradata, GE Vernova, Deloitte, OpenAI ([Agent Infrastructure SWE](https://openai.com/careers/software-engineer-agent-infrastructure-san-francisco/)) |
| **AI Reliability Engineer** | Production AI needs SRE-like discipline; distinct from traditional SRE. | Anthropic ([Staff/Sr AI Reliability](https://www.anthropic.com/jobs)); AI SRE as a category being defined by Resolve.ai, Rootly. |
| **AI Security Engineer / LLM Red Team Specialist** | Prompt-injection defense and jailbreak research as a discipline. | Life360 ([Principal AI Security Engineer](https://www.remoterocketship.com/us/company/life360/jobs/principal-ai-security-engineer-ai-native-platform-united-states-remote/)); 10 emerging AI security roles enumerated by [Practical DevSecOps](https://www.practical-devsecops.com/emerging-ai-security-roles/). |
| **MCP Engineer / MCP Software Engineer** | MCP adoption made server development its own specialty. | Descope ([MCP SWE](https://careers.descope.com/p/fe57f6224769-mcp-model-context-protocol-software-engineer)) |
| **AI Operator / Computer-Use Specialist** | Tied to OpenAI Operator and Claude Cowork. | $75-120K specialist tier ([Coasty](https://coasty.ai/blog/best-computer-use-platform-2026-20260402)) |

### Roles disappearing or consolidating

- **Prompt Engineer (standalone):** Title is dying. Skill remains as table stakes.
- **Distillation Engineer:** Appears as a *responsibility* in fine-tuning/inference engineer postings, not its own widely-posted req.

---

## Skills by Career Level

### L4-L5 (Mid-level IC, 3-5 yrs)

- Python production proficiency - **71% of AI job postings** ([Second Talent](https://www.secondtalent.com/resources/most-in-demand-ai-engineering-skills-and-salary-ranges/))
- Hands-on with at least one major LLM provider SDK (OpenAI, Anthropic, Bedrock) and one orchestration framework - most commonly LangChain/LangGraph (34.3% of agentic AI postings; [Agentic Engineering Jobs](https://agentic-engineering-jobs.com/langchain-job-market-2026))
- Vector DB fundamentals: Pinecone, Weaviate, pgvector - tool-specific experience is learnable in weeks; conceptual understanding matters most
- RAG: chunking, hybrid search, BM25, reranking, retrieval evals
- Containerization: Docker (15.4%), Kubernetes (17.6%)
- Cloud: AWS (32.9%), Azure (26%)

### L6-L7 (Senior / Staff)

- Production LLM systems shipped end-to-end - "industry experience shipping real systems is a better signal than an academic credential"
- Multi-tenant isolation across vector indexes, GPU memory, agent state
- Eval frameworks (LangSmith / Langfuse / Braintrust); eval-gated CI/CD
- Fine-tuning / LoRA / QLoRA / RLHF
- Cost optimization - token budgets, model routing, caching
- "Reason about LLMs, vector stores, and RAG as part of standard system design, not as a niche specialty" ([Design Gurus](https://designgurus.substack.com/p/system-design-interviews-changed))

### L8+ (Principal / Leadership IC)

- Own agent orchestration layers, model-routing, LLMOps platforms serving all eng teams
- Runtime governance for non-deterministic systems
- Architect for SOC 2 / HIPAA / EU AI Act compliance - trigger DPIA + FRIA under AI Act Article 27
- "Define technical vision and scale engineering teams matters more than coding prowess alone"

### Manager track (EM / Director)

- AI Engineering Manager median $293.5K - highest-paying single role ([AI Pulse](https://theaimarketpulse.com/salaries/))
- Hiring rubrics now weight: "can you put this person in a room with a PM and a junior eng and have them drive technical direction without making a mess" - 5 of 7 hiring managers surveyed ([Design Gurus](https://designgurus.substack.com/p/system-design-interviews-changed))
- Mission alignment and safety judgment heavily weighted at frontier labs ([Anthropic EM guide](https://www.gethireready.com/interview-guides/engineering-manager-anthropic))

### PM track (AI PM / AI TPM)

- "AI is the new baseline, not a bonus skill"
- 4+ yrs PM, ideally B2B SaaS or AI-driven product
- Critical: "fewer than 1 in 4 senior AI PM candidates meet the bar for technical fluency + product rigor" ([Aakash Gupta](https://www.aakashg.com/product-manager-requirements/))
- "Candidates who can show a working prototype outperform those who can only describe one"

---

## What Job Listings Actually Require

### Must-Have (called out as required across 100+ postings)

- Python production code, 3+ yrs
- LLM API integration (OpenAI / Anthropic / Bedrock)
- RAG pipeline experience including vector DB, chunking, retrieval evals
- Production-grade observability and eval pipelines
- Cloud + Kubernetes + IaC
- Agent debugging / multi-step workflow tracing
- Prompt injection / jailbreak defense for security-sensitive roles

### Nice-to-Have (explicitly listed as "plus" or "bonus")

- Publications or OSS contributions; working portfolio of 3-5 projects beats a paper for applied roles
- CUDA / GPU-level optimization - must-have at NVIDIA/frontier labs, nice-to-have elsewhere
- Distillation / model compression
- Distributed inference experience
- Java/C++ for legacy enterprise integration
- Reinforcement learning beyond RLHF

### Top Tech Stack in Listings (May 2026)

Ranked by frequency:

1. **Python** - 71% of all AI postings
2. **PyTorch / JAX** - universal at frontier labs
3. **LangChain / LangGraph** - 34.3% of agentic postings, #1 framework
4. **LlamaIndex** - co-occurs in 38% of LangChain listings
5. **AWS (32.9%) / Azure (26%) / GCP / Vertex / Bedrock**
6. **Kubernetes (17.6%) + Docker (15.4%)**
7. **Vector DBs:** Pinecone, Weaviate, Qdrant, Chroma, pgvector
8. **MCP (Model Context Protocol)** - now ["a fundamental requirement"](https://medium.com/@adnanmasood/the-rise-of-model-context-protocol-mcp-skills-5f0d6a1c3579) at cutting-edge teams
9. **Observability:** LangSmith, Langfuse, Braintrust, Arize
10. **Inference engines:** vLLM, SGLang, TensorRT-LLM
11. **Terraform / Helm / Ray / Kubeflow / MLflow / Feast** - internal platform stack
12. **Provider SDKs:** OpenAI Agents SDK, Claude SDK, Vercel AI SDK, Mastra, Pydantic AI

### By Company Tier

- **Frontier labs** (Anthropic, OpenAI, xAI): PyTorch/JAX, vLLM/custom inference, internal evals, MCP servers, CUDA/GPU-level optimization
- **Scale-ups** (Cursor, Harvey, Sierra, Decagon, Glean, Perplexity): TypeScript + Python mix, LangGraph / OpenAI Agents SDK, Pinecone/pgvector, LangSmith/Braintrust evals
- **Enterprises** (Deloitte, EY, Caterpillar, Citi): Azure-heavy, Bedrock, LangChain, governance/MLOps focus, on-prem capability

### Non-Technical Requirements

- **Communication / cross-functional collaboration** - table stakes at senior+
- **Customer-facing skills** - load-bearing for FDE roles; Anthropic requires 3+ yrs in "technical, customer-facing role"
- **OSS contributions** - Anthropic states explicitly: ["if you have done interesting independent research, written an insightful blog post, or made substantial contributions to open-source software, put that at the TOP of your resume"](https://www.sundeepteki.org/advice/how-to-get-hired-at-openai-anthropic-and-google-deepmind-in-2026)
- **Publications** - required for AI Research Engineer; only ~50% of Anthropic technical staff hold PhDs
- **Mission alignment** - Anthropic explicitly screens for it via a Behavioral and Values round
- **Regulatory experience:** SOC 2 / HIPAA / FedRAMP for enterprise; EU AI Act familiarity (FRIA/DPIA) for EU operations
- **Security clearance** - required for Lockheed and federal-adjacent roles

---

## Compensation Reality

> Public-source ranges only. Verify with [levels.fyi](https://www.levels.fyi/) for current data. All figures USD unless noted.

| Tier / Company | Level | Total Comp |
|---|---|---|
| **Anthropic (SF)** | Senior SWE | $316K base / $563K TC |
| **Anthropic (SF)** | Lead SWE | $332K base / $785K TC |
| **OpenAI (SF)** | All SWE | $251K – $1.28M+ TC |
| **OpenAI (SF)** | L5 SWE | $336K base + $774K stock = $1.15M TC |
| **OpenAI MTS / Research Scientist** | - | $245K – $685K base |
| **Cursor (Anysphere)** | SWE | $850K – $1.28M TC |
| **Sierra** | SWE | $200K – $460K TC; median $450K |
| **Thinking Machines Lab** | All eng | $450K – $500K base (Q1 H-1B filings) |
| Google AI Engineer | L3-L6 | $183K – $583K TC; median $280K |
| Microsoft AI Engineer | All | $238K – $355K+ TC; median $282K |
| **US National AI Engineer** | Entry (0-2y) | $90-135K base / $110-160K TC |
| **US National AI Engineer** | Mid (3-5y) | $140-210K base / $170-260K TC |
| **US National AI Engineer** | Senior (6-9y) | $180-280K base / $220-350K+ TC |
| **US National AI Engineer** | Staff/Principal (10+y) | $250-400K+ base / $350-600K+ TC |
| RAG Engineer Senior | - | $195-290K base; $400K+ TC at frontier |
| LLM Fine-Tuning Specialist | - | $195K-$350K |
| AI Security Engineer | - | $152-210K |
| LLM Red Team Specialist | - | $160-230K |
| **AI Engineering Manager** | - | $293.5K median (highest-paying single role) |
| AI Product Manager | - | $141K – $250K (median $159K) |
| **Agentic AI Architect** | - | $260K – $420K base |
| AI Evaluation Engineer | - | Too few public postings for a stable range; companies level it against their senior SWE band. Use the US National Senior row as the anchor. |
| MCP / Integrations Engineer | - | New title with thin public data; typically leveled as senior platform engineering. Anchor to the senior SWE band. |
| London (Quant fund / FAANG) | Senior ML | £140-180K base; £200K+ TC |
| London (Google DeepMind) | Senior | £110-155K base + RSU |
| Berlin / Germany | Senior | €95-130K |
| **Bangalore (Top GCC / AI-first)** | Senior | ₹1-2 Cr TC |
| Bangalore (Fresh PhD / top MS) | Entry | ₹22-32 LPA |
| Singapore | Avg | S$221,200 |
| Singapore (Principal/Lead) | 10+y | S$323,505 |

**Sources:** [levels.fyi Anthropic](https://www.levels.fyi/companies/anthropic/salaries/software-engineer), [OpenAI](https://www.levels.fyi/companies/openai/salaries/software-engineer), [Cursor](https://www.levels.fyi/companies/cursor/salaries/software-engineer), [Sierra](https://www.levels.fyi/companies/sierra/salaries/software-engineer), [Pin AI Comp Guide 2026](https://www.pin.com/blog/ai-compensation-salary-guide/), [Kore1 salary guide](https://www.kore1.com/ai-engineer-salary-guide/), [AI Pulse benchmarks](https://theaimarketpulse.com/salaries/), [Career Check London 2026](https://www.careercheck.io/blog/ml-engineer-salary-london-2026), [Zen van Riel Europe](https://zenvanriel.com/job/ai-engineer-salary-europe/), [Scaler India](https://www.scaler.com/topics/ai-ml-engineer-salary-complete-guide/).

### Compensation insight

The gap between frontier-lab MTS comp (~$600-795K median at Anthropic/OpenAI) and enterprise AI engineering (~$170-260K mid-level) is **3-5x**. Choose your company tier with eyes open.

---

## Geographic & Industry Distribution

- **Concentration:** 65%+ of AI engineers are in SF + NYC
- **Two-tier market:** Indeed Hiring Lab reports ~95% of hiring firms have NOT posted an AI job - adoption is concentrated among largest firms ([Indeed Hiring Lab Jan 2026](https://www.hiringlab.org/2026/01/16/ai-adoption-accelerating-still-concentrated-among-largest-firms/))
- **Enterprise adoption:** 72% of enterprises have at least one AI workload in production as of Q1 2026 ([Medha Cloud](https://medhacloud.com/blog/ai-adoption-statistics-2026))
- **Consulting boom:** BCG reports 25% of $14.4B 2025 revenue ($3.6B) was AI consulting ([Metaintro BCG](https://www.metaintro.com/blog/bcg-25-percent-ai-revenue-consulting-jobs-2026))
- **International hiring up 82% YoY**; 67% of companies offering relocation packages
- **Remote-friendly:** LangChain ecosystem 35.2% remote, 48.4% hybrid, 16.4% strictly onsite
- **Indeed AI Tracker:** 4.2% of all postings in Dec 2025 - sustained growth amid broader hiring weakness

---

## Interview Process Patterns

The May 2026 standard at AI-native companies:

1. **Recruiter screen** (30 min) - culture/mission + comp + visa
2. **Technical phone screen** (60-90 min) - practical coding, production-style
3. **Take-home** (48 hr - 3 day) - common at LangChain, Mistral, Eightfold; build a small RAG/agent system. ["Not a test of whether you can build, but how - code quality, evals, error handling"](https://github.com/alexeygrigorev/ai-engineering-field-guide/blob/main/interview/01-interview-process.md)
4. **Onsite/virtual loop** (4-6 hr): coding round + AI system design + project deep dive + behavioral. ["Whiteboard-only rounds are mostly gone, even Google's format is collaborative now"](https://designgurus.substack.com/p/system-design-interviews-changed)
5. **Hiring manager / values round** - explicit at Anthropic

### AI-role specifics

- **System design rounds** now expect LLM infra, GPU scheduling, vector stores, RAG, eval-gated CI, cost/latency tradeoffs
- **AI-assisted coding rounds** at Meta, Canva, Google, Microsoft, Sierra, Cursor explicitly allow AI tools (Cursor, Copilot, Claude) - evaluating prompt skill and output validation
- **Take-home transparency:** Add an "AI audit note" - what you used AI for, what you changed, why. Transparency beats stealth
- **Sierra:** in-person-only at SF or NY offices; "Plan + Build + Present" 2-hour agent assessment with no algorithm rounds
- **Cursor:** 8-hour take-home using their own product with limited docs and a Slack channel - assesses product sense, autonomy, system design
- **Anthropic:** "the answer that sounds like it was written the night before is a bad signal"

### Frontier-lab specifics

- **Anthropic:** 90-minute, 4-level progressively harder coding problem testing whether you write clean modular code that absorbs new requirements. Values round explicit.
- **OpenAI:** "Design the OpenAI Playground" - wireframes + API + DB schema for thread/message history; multi-tenant secure cloud IDE
- **Mistral (Paris):** 5-round process, no remote, with a dedicated "LLM theory" stage covering transformer internals and alignment

---

## Emerging Roles to Watch

These roles are growing fastest in May 2026 - bet on them if you're planning a 12-month career trajectory.

### Forward Deployed Engineer (FDE)
- **Why:** Frontier-AI buyers (Fortune 500, government, biotech) demand on-site engineering as a contractual deliverable
- **Comp:** $350-550K mid-to-senior at frontier labs
- **Skills:** RAG, fine-tuning, distillation, MCP, customer-facing communication, evals at the customer site
- **Where:** OpenAI, Anthropic, Google, ElevenLabs, Cohere, Mistral, scale-ups

### AI Evaluation Engineer
- **Why:** Eval matured into a discipline; production needs eval-gated CI/CD
- **Comp:** $100-110/hr contractor; $200-400K FT at frontier labs
- **Skills:** LLM-as-judge calibration, error analysis methodology, statistical correction, dataset curation, regression detection
- **Where:** OpenAI (Applied Evals, Frontier Evals), Apple, Scale AI, Distyl, Apex

### Agentic Systems Engineer
- **Why:** Multi-agent and tool-use are first-class systems engineering
- **Comp:** $84-250K typical; agentic AI architect $260-420K
- **Skills:** LangGraph / multi-agent orchestration, MCP, A2A protocol, agent debugging, tool design, sandbox security
- **Where:** Teradata, GE Vernova, Deloitte, OpenAI (Agent Infrastructure)

### AI Reliability Engineer
- **Why:** Production AI needs SRE-like discipline for non-deterministic systems
- **Comp:** Senior $250-400K at frontier labs (Anthropic posting Staff/Sr roles)
- **Skills:** Incident response for AI agents, runaway-loop containment, cost anomaly detection, multi-provider fallback
- **Where:** Anthropic; "AI SRE" category being defined by Resolve.ai, Rootly

### AI Security Engineer / LLM Red Team Specialist
- **Why:** Prompt injection + jailbreak research became discrete disciplines after the May 2026 AI security inflection (Mythos disclosure, Daybreak, MDASH, first in-the-wild AI-built zero-day)
- **Comp:** $152-230K depending on specialty
- **Skills:** Indirect prompt injection defense, jailbreak research, constitutional classifiers, model supply-chain trust, MCP threat modeling
- **Where:** Life360, frontier labs, security-focused enterprises

### MCP Engineer
- **Why:** MCP ecosystem maturity made server development its own specialty
- **Skills:** MCP server design (HTTP/STDIO), OAuth resource server pattern, agent-card signing, MCP security
- **Where:** Descope, Anthropic-aligned scale-ups, internal platforms at Fortune 500

---

## Strategic Takeaways

For **engineers** planning the next move:

1. **Position as a specialist, not "Prompt Engineer."** Pick a discipline (evals, agents, RAG, FDE, MLOps) and build depth.
2. **Working portfolio > paper.** Ship 3-5 production-grade projects with evals and observability. Anthropic, OpenAI, and scale-ups all weight this over publications for applied roles.
3. **FDE is high-leverage.** If you can pair technical depth with customer-facing communication, FDE comp at frontier labs is the top of the market outside founder/staff equity at unicorns.
4. **The market is bifurcated.** Generalist mid-level SWE work is being cut. Senior AI specialists are in a sellers' market. Plan your trajectory accordingly.

For **hiring managers** building rubrics:

1. **Hire for the specific problem, not for "AI Engineer."** If you write a generic AI Engineer JD, you'll get generic candidates.
2. **Evaluate shipped systems first.** A take-home that simulates your actual workload (build a small RAG agent for our domain) is more predictive than algorithm puzzles.
3. **AI-assisted coding rounds are now standard.** Watching candidates prompt + validate model output is more informative than blocking AI use.
4. **Comp banding matters.** Frontier-lab comp is creating retention pressure 2 tiers down. If you're an enterprise hiring AI talent, calibrate to local market plus a 15-25% AI premium for senior+.

For **engineering leaders** doing org design:

1. **Map roles to the work, not to titles.** "AI Engineer" is your umbrella. Inside it: name explicit specializations (RAG lead, agent lead, eval lead, platform lead).
2. **Eval Engineer is a real role.** Don't make a feature engineer own the metric they're trying to improve. Separate measurement from delivery.
3. **FDE only pays off above ~$500K customer ARR.** Below that, use solutions engineering. Above, FDE earns its comp through customer-specific engineering that documentation can't generalize.
4. **AI Reliability Engineer is the role you don't know you need yet.** When your first agent loops at 3 AM and burns $50K of API spend before the loop guard fires, you'll wish you had this role 6 months earlier.

---

## References

This chapter is sourced from 100+ public job listings, hiring reports, and recruiter signals as of May 17, 2026. Key sources:

### Hiring market reports
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

### Compensation data
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

### Frontier-lab career sources
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

### Interview process sources
- [Design Gurus - System Design Interviews Changed in 2026](https://designgurus.substack.com/p/system-design-interviews-changed)
- [IGotAnOffer - Anthropic Interview Process](https://igotanoffer.com/en/advice/anthropic-interview-process)
- [Jobright - Anthropic Technical Interview 2026](https://jobright.ai/blog/anthropic-technical-interview-questions-complete-guide-2026/)
- [Sierra - The AI-Native Interview](https://sierra.ai/blog/the-ai-native-interview)
- [Alexey Grigorev - AI Engineering Field Guide (Interview Process)](https://github.com/alexeygrigorev/ai-engineering-field-guide/blob/main/interview/01-interview-process.md)
- [interviewing.io - Meta AI-Assisted Coding Interview](https://interviewing.io/blog/how-to-use-ai-in-meta-s-ai-assisted-coding-interview-with-real-prompts-and-examples)
- [Exponent - OpenAI System Design 2026](https://www.tryexponent.com/blog/openai-system-design-interview)
- [Exponent - Anthropic System Design 2026](https://www.tryexponent.com/blog/anthropic-system-design-interview)

### Emerging role coverage
- [AI Career Lab - Agentic-AI Job Guide 2026](https://theaicareerlab.com/blog/agentic-ai-jobs-guide-2026)
- [Practical DevSecOps - Top 10 Emerging AI Security Roles](https://www.practical-devsecops.com/emerging-ai-security-roles/)
- [Fast Company - Google/Box CEOs: FDE most in-demand](https://www.fastcompany.com/91541878/google-box-ceos-say-this-is-the-most-in-demand-job-in-tech)
- [Computerworld - FDE career emerging from AI shift](https://www.computerworld.com/article/4171867/heres-one-career-emerging-from-the-ai-shift-forward-deployed-engineers.html)
- [Rootly - AI SRE Guide 2026](https://rootly.com/ai-sre-guide)
- [Resolve.ai - What is an AI SRE](https://resolve.ai/glossary/what-is-ai-sre)
- [Medium - Rise of MCP Skills](https://medium.com/@adnanmasood/the-rise-of-model-context-protocol-mcp-skills-5f0d6a1c3579)

### Compliance & regulation
- [EU AI Act Implementation Timeline](https://artificialintelligenceact.eu/implementation-timeline/)
- [Secure Privacy - EU AI Act 2026 Compliance](https://secureprivacy.ai/blog/eu-ai-act-2026-compliance)
- [Augment Code - EU AI Act 2026 Guide](https://www.augmentcode.com/guides/eu-ai-act-2026)

---

*See also: [Question Bank](01-question-bank.md) | [Answer Frameworks](02-answer-frameworks.md) | [Behavioral for AI Roles](05-behavioral-for-ai-roles.md) | [Role Transition Guide](../TRANSITION_GUIDE.md)*
