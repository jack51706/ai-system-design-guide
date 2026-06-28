# AI Governance and Compliance

Governance is now a delivery constraint, not a policy abstraction. The EU AI Act carries fines up to the greater of 35M euros or 7% of global turnover, US states are passing their own AI laws, and enterprise buyers ask for AI governance evidence in procurement. The good news for engineers: governance maps cleanly onto practices you already run (security, evals, observability, incident response), so the goal is to **emit governance evidence as a byproduct** rather than bolt on a parallel process.

This chapter is time-sensitive. Dates and enforcement status are given **as of June 2026** and are moving, especially the EU timeline; verify against primary sources before relying on a specific date. Items that were provisional at the time of writing are flagged.

## Table of Contents

- [The EU AI Act](#the-eu-ai-act)
- [NIST AI RMF and the GenAI Profile](#nist-ai-rmf-and-the-genai-profile)
- [ISO 42001 and Assurance](#iso-42001-and-assurance)
- [The US Landscape](#the-us-landscape)
- [What Engineers Actually Implement](#what-engineers-actually-implement)
- [A Compliance Checklist](#a-compliance-checklist)
- [Interview Questions](#interview-questions)
- [References](#references)

---

## The EU AI Act

Regulation (EU) 2024/1689 is the world's first comprehensive AI law, structured by **risk tier**:

- **Prohibited** (unacceptable risk): social scoring, manipulative or subliminal techniques, untargeted facial-recognition scraping, workplace and school emotion recognition, certain biometric uses. Banned outright.
- **High-risk** (Annex III use cases like employment, credit, education, biometrics, law enforcement; Annex I AI inside already-regulated products): the full conformity regime: risk management, data governance, technical documentation, logging, human oversight, accuracy and cybersecurity, conformity assessment, and registration.
- **Limited risk** (chatbots, deepfakes, synthetic media): transparency and labeling obligations only (Article 50).
- **Minimal risk** (most enterprise tooling): no mandatory obligations.
- **GPAI / general-purpose models** are a separate cross-cutting layer (Articles 51-55), with extra obligations for "systemic-risk" models above a training-compute threshold (10^25 FLOP).

**Timeline and enforcement status as of June 2026:**

| Date | Milestone | Status |
|------|-----------|--------|
| Aug 2024 | Regulation entered into force | Done |
| Feb 2025 | Prohibited practices + AI-literacy obligations apply | Enforceable now |
| Aug 2025 | GPAI model obligations, governance, and penalties apply | Enforceable now |
| Aug 2026 | Article 50 transparency obligations apply | Upcoming (still scheduled) |
| Dec 2026 | New ban on AI-generated CSAM/NCII; synthetic-content marking grace period ends | Upcoming |
| Dec 2027 | High-risk Annex III obligations apply (delayed ~16 months) | Provisional, see below |
| Aug 2028 | High-risk Annex I obligations apply (delayed ~1 year) | Provisional |

The delay of high-risk obligations is the **"Digital Omnibus"** simplification package. As of June 2026 it had cleared trilogue and European Parliament approval but was **not yet published in the Official Journal**, so the new high-risk dates (Dec 2027 / Aug 2028) are politically agreed and near-certain but legally pending. It does **not** roll back the prohibitions (Feb 2025) or GPAI obligations (Aug 2025), which are enforceable now. The Omnibus also adds a readiness/conditionality trigger that ties high-risk application to the availability of supporting standards, so the dates could move again.

**Who bears which obligation** matters because it is easy to misjudge. GPAI providers maintain technical documentation, publish a training-data summary, and keep a copyright/opt-out policy (systemic-risk models add evaluations, adversarial testing, and incident reporting). High-risk **providers** carry the heavy conformity lift; high-risk **deployers** ensure human oversight, keep logs, and inform affected people. Critically, a downstream developer who substantially modifies a high-risk system, puts their name on it, or repurposes a GPAI into a high-risk use can **become the "provider"** and inherit those obligations (Article 25). Article 50 transparency splits too: providers must disclose AI interaction and mark synthetic content in a machine-readable way; deployers must disclose deepfakes and label AI-generated public-interest text.

---

## NIST AI RMF and the GenAI Profile

The **NIST AI Risk Management Framework** (AI 100-1, Jan 2023) is voluntary but the de-facto US baseline, built on four functions: **Govern** (org-level policy and accountability, cross-cutting), **Map** (establish context and categorize the system), **Measure** (benchmark and track risks), and **Manage** (prioritize, treat, monitor, respond).

The **Generative AI Profile** (NIST AI 600-1, Jul 2024) is a companion that enumerates 12 GenAI risk categories and maps suggested actions back to the RMF core. The categories include confabulation (hallucination), data privacy, harmful bias, information integrity (synthetic media), information security (where prompt injection lives), intellectual property, dangerous content, CBRN information, human-AI configuration, and value-chain/third-party risk. It is the cleanest checklist for "what could go wrong with a GenAI system," and it lines up with the threats in [LLM Security](../12-security-and-access/01-llm-security.md).

---

## ISO 42001 and Assurance

**ISO/IEC 42001:2023** is the first certifiable AI Management System standard, structured like ISO 27001 (Plan-Do-Check-Act, leadership, risk and impact assessments, a set of AI controls). It certifies *organizational governance* ("do you have a system?"), not a per-model technical property, and is increasingly used as due-diligence evidence toward the EU AI Act and as a procurement signal. **SOC 2** remains the dominant US assurance attestation for security and operational controls but does not cover AI-specific risk by itself. The common 2026 pattern for AI vendors selling into regulated buyers is **SOC 2 plus ISO/IEC 42001**, with controls harmonized to avoid duplicate work.

---

## The US Landscape

There is **no comprehensive federal AI statute** as of June 2026, and the federal posture is deregulatory: Executive Order 14365 (Dec 2025) directs a DOJ task force to challenge state AI laws on preemption grounds, but a proposed federal moratorium on state laws did not pass. NIST AI RMF remains the voluntary federal touchstone.

That leaves a **state patchwork**. The Colorado AI Act (the first comprehensive state law) was amended and delayed to Jan 2027. California is the most active: SB 53 (frontier-model transparency and incident reporting) and AB 2013 (training-data transparency) have obligations live since Jan 2026, alongside sector laws on hiring and healthcare AI. Inconsistent definitions across states are exactly the friction the federal posture targets; verify the current status per state, since several effective dates have already shifted.

---

## What Engineers Actually Implement

The practical core. Map each regulatory concept to a concrete artifact or control you already understand.

- **Risk classification first.** Per system or feature, record the EU AI Act tier, your role (provider, deployer, or GPAI integrator), and which US regimes attach. The written determination is itself an audit artifact, and it flags whether fine-tuning or rebranding could pull you into provider status.
- **The cards stack (versioned in your repo).** A model card (intended use, training-data summary, eval results, limitations), a system card (end-to-end risks and mitigations), a data card (provenance, licensing, known biases), and for high-risk the Annex IV technical file.
- **Audit trails and logging.** Immutable, tamper-evident logs of prompts, outputs, tool calls, retrieved context, model version, and decision outcomes, with retention aligned to legal duties (EU high-risk requires automatic logging, and deployers typically retain at least six months). Treat this as an extension of your existing tracing, not a new system. See [Observability](../14-evaluation-and-observability/02-observability.md).
- **Human oversight.** Design for meaningful oversight: interpret output, override or halt (a stop button), and avoid automation bias, with defined escalation thresholds for consequential decisions. See [Human-in-the-Loop Patterns](../07-agentic-systems/08-human-in-the-loop-patterns.md).
- **Transparency.** AI-interaction disclosure, synthetic-content provenance (C2PA-style watermarking), and deepfake labeling per Article 50.
- **Data governance.** Training-data provenance and licensing, PII minimization and data-subject-request support, and copyright opt-out compliance, mapped onto your existing privacy program rather than rebuilt.
- **Incident reporting.** An AI-incident process (detect, triage, report) reusing your security incident-response runbook. The EU high-risk serious-incident windows are tiered and still being finalized in guidance, so verify the exact day counts.
- **Evaluation and red-team evidence.** Durable evidence of pre-deployment and ongoing evals, adversarial and jailbreak testing, prompt-injection testing, and bias and robustness testing. This is your existing eval harness and CI producing governance evidence; see [LLM Evaluation](../14-evaluation-and-observability/01-llm-evaluation.md) and [Guardrails](01-guardrails.md).
- **Map OWASP to controls.** The OWASP Top 10 for LLM Applications (2025) and the Top 10 for Agentic Applications (2026, ASI01-ASI10, including memory and context poisoning at ASI06) give a risk list; turn each into a control, a test, and a log signal. For example, prompt injection becomes input/output guardrails plus an injection eval suite plus logged guardrail trips.
- **Machine-readable governance (emerging).** Policy cards and policy-as-code express rules an agent can parse and enforce at runtime, with crosswalks to NIST/ISO/EU frameworks. This is direction-of-travel and early-adopter, not a ratified requirement.

The unifying idea: security gives you the OWASP controls and data governance, evals and CI give you the red-team and measurement evidence, observability gives you the audit logs and post-market monitoring, and release gates give you the sign-off record. Compliance becomes a *view* over telemetry and artifacts you already produce.

---

## A Compliance Checklist

- [ ] Classify each system: EU tier, your role, applicable US regimes; record the rationale.
- [ ] Produce the cards stack (model, system, data) and, for high-risk, the Annex IV file.
- [ ] Log prompts, outputs, tool calls, context, version, and decisions immutably, with a defined retention period.
- [ ] Build human-oversight UX: override/stop, a competent reviewer, escalation thresholds.
- [ ] Implement user disclosure, synthetic-content watermarking, and deepfake labeling.
- [ ] Govern data: provenance, licensing, PII minimization, data-subject requests, opt-out honoring.
- [ ] Run eval and red-team suites in CI (jailbreak, injection, bias, robustness) and store the artifacts.
- [ ] Map each OWASP LLM and Agentic risk to a control, a test, and a log signal.
- [ ] Stand up an AI-incident runbook with pre-drafted report templates.
- [ ] Pursue SOC 2 plus ISO/IEC 42001 if selling to regulated buyers; harmonize controls.
- [ ] Calendar the live dates: prohibitions and GPAI obligations are enforceable now; Article 50 transparency is next; high-risk is provisionally Dec 2027.

---

## Interview Questions

### Q: How do you make a production LLM system EU AI Act ready without building a separate compliance stack?

**Strong answer:**
I start by classifying the system: its risk tier, whether we are a provider or deployer, and whether anything we do (fine-tuning, rebranding, repurposing a general-purpose model) makes us the provider. Most enterprise systems land in limited risk, where the obligation is transparency: disclose that users are talking to AI and mark synthetic content. Then I map the rest onto what we already run. Audit logging is an extension of our tracing, with retention set to the legal minimum. Human oversight is a stop button and an escalation path on consequential decisions. Red-team and bias evidence comes out of the eval suite in CI. The cards stack (model, system, data) lives in the repo and is versioned. The point is that governance is a view over existing telemetry and artifacts, not a parallel process, and I would calendar the live dates, since prohibitions and GPAI obligations are already enforceable while high-risk has been pushed to around 2027.

### Q: What is the difference between the EU AI Act and the NIST AI RMF, and when does each matter?

**Strong answer:**
The EU AI Act is binding law with risk tiers, hard deadlines, and fines up to 7% of global turnover; it matters whenever you place a system on the EU market or your output reaches EU users, and it dictates concrete obligations by tier. The NIST AI RMF is a voluntary US framework (Govern, Map, Measure, Manage) plus a Generative AI Profile that enumerates GenAI risks; it matters as the de-facto best-practice baseline, as a way to structure your internal risk program, and as evidence of due diligence. In practice I would use NIST and ISO 42001 to build the governance system and the EU Act to set the hard requirements and deadlines that system has to satisfy. They are complementary: one tells you how to organize, the other tells you what you must do and by when.

---

## References

- [EU AI Act, European Commission](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai) and the [implementation timeline](https://artificialintelligenceact.eu/implementation-timeline/)
- [Digital Omnibus, European Parliament Legislative Train](https://www.europarl.europa.eu/legislative-train/package-digital-package/file-digital-omnibus-on-ai)
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) and the Generative AI Profile (NIST AI 600-1)
- [ISO/IEC 42001:2023](https://www.iso.org/standard/81230.html)
- [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/resource/owasp-top-10-for-llm-applications-2025/) and the [Top 10 for Agentic Applications 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/)
- US: Executive Order 14365 (Dec 2025); California SB 53 and AB 2013; Colorado AI Act (SB 24-205, amended)

---

*Previous: [Reliability Patterns](03-reliability-patterns.md)*
