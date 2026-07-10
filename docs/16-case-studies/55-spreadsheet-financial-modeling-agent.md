# Case Study: Spreadsheet and Financial-Modeling Agent

A fintech platform ships an agent that operates on live spreadsheets (Excel and Google Sheets): it answers questions about a financial model, builds and edits formulas, populates models from source data, and audits existing workbooks for errors, at roughly 50,000 model operations a day for FP&A, investment, and accounting analysts. The single hardest constraint is that a spreadsheet is load-bearing for real financial decisions, so a subtly wrong formula (an off-by-one range, a hardcoded number inside a formula, a broken reference) produces a confident wrong number that flows straight into a board deck or a valuation. Verifiable correctness beats fluency here, exactly as in the [Text-to-SQL BI Copilot](39-conversational-analytics-text-to-sql.md), but harder, because a spreadsheet carries hidden state and a two-dimensional web of dependencies that a warehouse query does not.

## The Business Problem

An analyst's real workday is not "write me a report," which is the [Financial Analysis](03-financial-analysis.md) case of generating equity research prose from filings. It is living inside a specific, hand-built model: a three-statement operating model, a DCF, a fund waterfall, a loan tape. The analyst wants to ask "why did FY27 free cash flow jump," extend the revenue build with a new product line, pull last quarter's actuals from a source file into the right cells, and catch the mistake before the model goes to the investment committee. The product must do all four: query, build and edit, populate, and audit.

The naive design is to paste the sheet as CSV into an LLM and let it answer or emit new formulas. This fails in the most dangerous way possible, because it is fluent. CSV throws away the formulas, the named ranges, and the dependency graph, so the model reasons over rendered numbers and guesses the logic that produced them. Worse, an LLM asked for a sum will happily do the arithmetic in its head and hand back a number that looks right and is wrong. Spreadsheet reasoning is genuinely unsolved: on [SpreadsheetBench](https://arxiv.org/abs/2406.14991), 912 tasks scraped from real Excel forums with tables past 100 columns and 20,000 rows, the strongest models land far short of the human baseline, and even [SheetCopilot](https://arxiv.org/abs/2305.19308) completes only 44.3 percent of its simpler control tasks in a single generation.

So the team inverts the objective the same way the [Text-to-SQL copilot](39-conversational-analytics-text-to-sql.md) turns "answer anything" into "compile a blessed metric." The product is not "trust the model's number." It is "read the actual cell graph, generate every formula as code that is parsed and recalculated in a sandbox before it is written, verify all math in the spreadsheet engine, and hand the analyst a reviewable diff." The defining difference from text-to-SQL is that there is no governed semantic layer to lean on: the workbook itself is both the ground truth and the load-bearing artifact, with state (cached values, volatile functions, circular references) hidden behind every cell. The agent's core modeling problem is representing that 2D dependency graph for an LLM at all, the problem Microsoft's [SpreadsheetLLM](https://arxiv.org/abs/2407.09025) attacks with its `SheetCompressor` encoding.

Constraints from the June 2026 reality:

- Roughly 50,000 model operations a day across FP&A, investment, and accounting analysts; a wrong number in a board deck is far worse than a refusal, so the product optimizes for verified-correct-or-abstain, not coverage.
- Spreadsheet errors are the norm, not the exception: field audits find mistakes in the large majority of operational spreadsheets, with per-cell error rates around 1 to 5 percent ([Panko / EuSpRIG](https://arxiv.org/abs/0802.3457)), and single errors have cost billions (Fidelity's [$2.6B missing minus sign](https://eusprig.org/research-info/horror-stories/), Fannie Mae's $1.136B restatement).
- The classic disasters are formula bugs, not typos: the [Reinhart-Rogoff](https://en.wikipedia.org/wiki/Growth_in_a_Time_of_Debt) `AVERAGE` range omitted 5 of 20 countries and flipped a headline result, and JPMorgan's [London Whale](https://en.wikipedia.org/wiki/2012_JPMorgan_Chase_trading_loss) VaR model divided by a sum instead of an average, halving reported risk before a roughly $6B loss.
- The agent must read state through real APIs, the [Microsoft Graph Excel](https://learn.microsoft.com/en-us/graph/api/resources/excel) workbook API and the [Google Sheets API](https://developers.google.com/sheets/api), not a flat export, so it sees formulas, named ranges, and dependents.
- Never trust the model's arithmetic: every value is recalculated in a real engine (`formulas`, [PyCel](https://github.com/dgorissen/pycel), or a headless LibreOffice) and reconciled before it is shown.
- Every write is a human-approved diff against a snapshot, reversible from a change log; the agent never silently overwrites an analyst's formula.
- Model canon: reads and simple edits on Claude Haiku 4.5 or [DeepSeek V4 Flash](https://api-docs.deepseek.com/); hard formula reasoning and auditing on [Claude Opus 4.8](https://www.anthropic.com/claude/opus), routed by difficulty through an [AI gateway](../11-infrastructure-and-mlops/03-ai-gateways-and-model-routing.md).

## Architecture

```mermaid
flowchart TB
    USER[Analyst in Excel Add-in or Sheets Add-on] --> ROUTE[Intent Router]
    ROUTE -->|query| GRAPH
    ROUTE -->|build or edit| GRAPH
    ROUTE -->|populate| GRAPH
    ROUTE -->|audit| GRAPH

    subgraph Ground["Structured Grounding"]
        GRAPH[Read Cell Graph via Graph and Sheets API] --> MODEL[Model Builder values formulas named ranges dependents]
        MODEL --> ENC[Compressed Encoding SheetCompressor style]
        MODEL --> SCACHE[(Model Structure Cache)]
    end

    ENC --> DRAFT[Draft Formula or Answer]
    DRAFT --> GATE

    subgraph Gatecheck["Formula Correctness Gate"]
        GATE[Parse AST] --> REFCHK[Reference and Range Check]
        REFCHK --> TYPE[Type and Unit Sanity]
        TYPE --> SANDBOX[Recalc in Sandboxed Copy]
        SANDBOX --> RECON[Reconcile vs Independent Derivation]
    end

    RECON -->|fail| REPAIR[Repair or Escalate to Opus 4.8]
    REPAIR --> DRAFT
    RECON -->|pass| DIFF[Reviewable Diff]
    DIFF --> HUMAN[Analyst Approves]
    HUMAN -->|approve| WRITE[Writeback via API]
    WRITE --> CLOSURE[Recalc Dependency Closure scan for new errors]
    CLOSURE --> LOG[(Reversible Change Log and Provenance)]
    ROUTE -.audit only.-> AUDIT[Read-Only Error Detector]
    AUDIT --> FINDINGS[Ranked Findings no writes]
```

### Components

| Layer | Tech | Purpose |
|-------|------|---------|
| Surface | Excel Add-in (Office.js), Google Sheets Add-on, chat panel | Where the analyst asks and reviews diffs in place |
| Spreadsheet access | [Microsoft Graph Excel API](https://learn.microsoft.com/en-us/graph/api/resources/excel), [Google Sheets API](https://developers.google.com/sheets/api) | Read and write cells, formulas, named ranges, not a flat export |
| Model builder | Formula parser plus dependency-graph extractor | Turn the workbook into values, formulas, named ranges, and a precedent/dependent graph |
| Encoding | `SheetCompressor`-style structural encoding ([SpreadsheetLLM](https://arxiv.org/abs/2407.09025)) | Fit a large 2D grid into a token budget without losing structure |
| Draft model | Claude Haiku 4.5 or [DeepSeek V4 Flash](https://api-docs.deepseek.com/) | Cheap first-pass answers and simple formula edits |
| Reasoning model | [Claude Opus 4.8](https://www.anthropic.com/claude/opus) | Hard formula synthesis, repair, and audit judgment |
| Recalc engine | `formulas`, [PyCel](https://github.com/dgorissen/pycel), or headless LibreOffice | Execute formulas deterministically in a sandbox, never in the LLM |
| Correctness gate | Formula AST parser plus reference and type checks | Deterministic validation before any probabilistic check |
| Auditor | [ExceLint](https://arxiv.org/abs/1901.11100)-style consistency checks plus LLM review | Detect hardcodes, inconsistent formulas, broken links, sign errors |
| Change control | Snapshot diff, approval queue, append-only log | Human-approved, reversible edits with full provenance |
| Tooling transport | [MCP 2.0](https://modelcontextprotocol.io) tool server | Expose read, recalc, and write as governed tools |

### Data flow

1. The analyst asks a question or requests an edit from the Excel Add-in or Sheets Add-on; the intent router classifies it as query, build/edit, populate, or audit.
2. The model builder reads the workbook through the Graph or Sheets API and constructs the cell graph: rendered values, the underlying formulas, named ranges, and the precedent/dependent edges, not a CSV of numbers.
3. That graph is encoded for the LLM with a `SheetCompressor`-style structural encoding so a wide sheet fits the context window with its layout and anchors intact; the parsed structure is cached keyed on a content hash.
4. A draft model proposes an answer or a candidate formula grounded in the actual cells and named ranges it was given, never in guessed logic.
5. For any write, the formula correctness gate runs deterministically first: the formula is parsed to an AST, every reference and range is checked against the real grid, and types and units are sanity-checked (a rate is not summed, a currency is not divided by a count).
6. The candidate is recalculated in a sandboxed copy of the workbook by a real engine, and the result is reconciled against an independent derivation; disagreement or any new error routes to repair or escalation to Opus 4.8, never to shipping the number.
7. A reviewable diff is rendered (old formula and value versus new) and queued for the analyst, who approves, edits, or rejects; nothing is auto-applied.
8. On approval, the write goes back through the API, the dependency closure is recalculated to catch errors that surfaced downstream, and the change plus its provenance is appended to a reversible log.
9. Audit requests take a read-only branch: consistency and structural checks plus LLM review produce ranked findings and never touch a cell.

### A worked example: adding a net revenue retention row per cohort

The analyst types "add a net revenue retention row for each cohort" into the Sheets add-on over `SaaS_Model.xlsx`, a live cohort revenue build. The request exercises the whole write path.

**Read the graph, not the grid.** The model builder pulls the workbook through the Graph API and reconstructs dependencies instead of rendered numbers. It recovers the grain: `Cohorts` has one row per acquisition month, rows 4 to 15 (cohorts `2025-01` through `2025-12`), month-0 MRR per cohort sits in `Cohorts!C4:C15`, and the revenue detail is a tidy ledger on `Data`, one row per (cohort, calendar month), rows 2 to 731, exposed as named ranges `led_mrr` (`Data!$C$2:$C$731`), `led_cohort` (`Data!$A$2:$A$731`), and `led_month` (`Data!$B$2:$B$731`). NRR is defined here as latest-period retained MRR over month-0 MRR, so each cohort row needs a numerator that totals that cohort's MRR in `Latest_Month`.

**Generate the formula.** The draft model proposes, for cohort row 4 in a new column `P`:

`=SUMIFS(Data!$C$2:$C$730, Data!$A$2:$A$730, $B4, Data!$B$2:$B$730, Latest_Month) / $C4`

The bug is a fencepost: it typed the three ranges as explicit `...$2:$730`, one row short of the `led_mrr` block that ends at row 731. Because the ranges are absolute, the shortfall always drops the very last ledger row, which belongs to cohort `2025-12` (row 15) and carries $8,400 of its latest-month MRR.

**Sandbox recalc reconciliation.** The gate clears the cheap deterministic checks (it parses, the references resolve) and recalculates the whole new column in a sandboxed copy with the `formulas` engine. Cohort `2025-12` returns $117,600 / $120,000 = 0.980, a contraction. Reconciliation then recomputes the same quantity a second, independent way, an accounting cross-foot: it sums the twelve per-cohort numerators, which must tie to a latest-month grand total taken independently over the full `led_mrr` range, and gets $1,412,100 against a grand total of $1,420,500. The gap is exactly $8,400, orders of magnitude outside the reconciliation epsilon (relative `1e-9`, absolute `$0.005`). In parallel the reference-and-range check flags that `Data!$C$2:$C$730` stops one row short of the contiguous `led_mrr` block. Both signals converge on the same fencepost. This is the [Reinhart-Rogoff](https://en.wikipedia.org/wiki/Growth_in_a_Time_of_Debt) shape exactly: an aggregation range that silently drops the boundary row and flips a headline, here `2025-12` from 105 percent expansion to 98 percent contraction.

**Fix, then a tracked diff.** The block routes to repair; because a deterministic check localized the cause to a range boundary, Opus 4.8 rewrites the three ranges to the maintained named ranges (`led_mrr`, `led_cohort`, `led_month`) so the formula self-extends. The re-recalc returns $126,000 / $120,000 = 1.050 for `2025-12`, the cross-foot ties to the cent, and the column reconciles. Only now is a diff rendered (new column `P`, per-row old-versus-new with recalculated previews). The analyst approves; the write goes back through the API, the dependency closure recomputes with no new `#REF!`, and the change lands in the reversible log. Nothing was auto-applied and no existing formula was touched.

### The same model in audit mode

Point the agent at the same `SaaS_Model.xlsx` read-only and it hunts the classic bug classes instead of building. Two findings surface:

- **Hardcoded number inside a formula.** `Cohorts!H9` reads `=G9*1.08`, where `1.08` is a churn-adjusted growth assumption typed as a literal instead of a reference to the `Assumptions` sheet's `Gross_Churn` driver, so it never moves when the analyst flexes the assumption. The auditor flags the numeric literal (outside the allowlist of true constants such as `12` months) and proposes `=G9*(1-Gross_Churn)`. This is the JPMorgan operator/plug class.
- **Inconsistent formula across a row.** `Cohorts!F4:F15` (month-3 retained MRR) is a uniform `=SUMIFS(...)` in every cell except `F11`, which was hand-edited months ago to `=SUMIFS(...)+500`, a since-forgotten manual true-up. [ExceLint](https://arxiv.org/abs/1901.11100)-style consistency detection flags `F11` as the lone outlier in a uniform range and ranks it by blast radius (how many downstream cells depend on it). The agent writes nothing; it emits ranked findings.

The contrast is the point: the same dependency-graph read powers a gated write and a zero-write audit, and the audit targets the exact error classes (off-by-one ranges, hardcoded plugs, inconsistent rows) that the [EuSpRIG](https://eusprig.org/research-info/horror-stories/) record is built from.

### The formula-change record

Every proposed edit is emitted as a schema-validated change record, not free prose, so the gate and the audit log reason over the same structured object. This is the record for the fixed `2025-12` cell:

```json
{
  "change_id": "chg-2026-07-10-0442",
  "workbook": "SaaS_Model.xlsx",
  "sheet": "Cohorts",
  "cell": "P15",
  "intent": "add net revenue retention row per cohort",
  "old": null,
  "new": "=SUMIFS(led_mrr, led_cohort, $B15, led_month, Latest_Month) / $C15",
  "recalc_preview": {"numerator": 126000.0, "denominator": 120000.0, "value": 1.05},
  "validation": {
    "parses": true,
    "refs_ok": true,
    "types_ok": true,
    "sandbox_recalc": true,
    "recalc_reconciled": true,
    "reconcile_method": "cross-foot vs independent latest-month grand total",
    "epsilon": {"relative": 1e-9, "absolute": 0.005, "observed_delta": 0.0}
  },
  "downstream_errors": [],
  "prior_draft_rejected": "range Data!$C$2:$C$730 short one row vs led_mrr",
  "route": "opus-4.8-repair",
  "requires_approval": true,
  "status": "pending_review"
}
```

The gate trusts only the structured `validation` block; a record with `recalc_reconciled` false or any `downstream_errors` can never reach the approval queue, and `requires_approval` is always true for a write.

## Key Design Decisions

### 1. Ground on the live cell graph, not the rendered grid

The whole design rests on this. A rendered value of `1,240,000` in cell `D14` could be a hardcoded plug, `=SUM(D2:D13)`, or `=D13*(1+Growth)`, and those mean completely different things for any edit. So the agent never reasons over a CSV of values; it reads the workbook through the [Graph](https://learn.microsoft.com/en-us/graph/api/resources/excel) or [Sheets](https://developers.google.com/sheets/api) API and reconstructs the cell graph: values, formulas, named ranges, and the precedent/dependent edges. Representing that two-dimensional graph for a one-dimensional token stream is the core modeling problem, and it is exactly what Microsoft's [SpreadsheetLLM](https://arxiv.org/abs/2407.09025) `SheetCompressor` was built for: structural-anchor compression and format-aware aggregation let a wide model fit the context window without flattening its structure into mush. This is the sharpest contrast with the [Text-to-SQL copilot](39-conversational-analytics-text-to-sql.md): that system has a governed semantic layer to compile against, this one has only the workbook, which is simultaneously the source of truth and the thing being edited.

### 2. Formula generation is verifiable code, gated before it is written

A generated formula is a hypothesis, not an answer, and it clears a gate that is code before it clears one that is vibes. This is the direct analog of the [text-to-SQL correctness gate](39-conversational-analytics-text-to-sql.md), and it runs deterministic checks first because they are free: the formula is parsed to an AST, every cell reference and range is validated against the real grid (does `Revenue` resolve, does the range cover the intended rows), and types and units are sanity-checked so a growth rate is never `SUM`-med and a per-unit price is never added to a total. Only after the cheap certain checks pass does the expensive probabilistic one run. This is the [guardrails](../13-reliability-and-safety/01-guardrails.md) discipline: never spend an LLM call to catch what a parser catches for free. The gold-set eval that scores this gate is a [SpreadsheetBench](https://arxiv.org/abs/2406.14991)-style suite of task, before-workbook, and after-workbook triples, so "correct" means the recalculated result matches, not that the formula reads plausibly. The gate is a fixed ordered sequence, and each check maps to write, block, or escalate:

| Validation check (in order) | Passes | Fails |
|---|---|---|
| Parses to a valid formula AST | next check | block, auto-repair |
| References and named ranges resolve | next check | block, auto-repair |
| Range spans the full contiguous block (no fencepost) | next check | block, auto-repair (off-by-one / Reinhart-Rogoff class) |
| Types and units coherent (no rate summed, no currency over a count) | next check | block, auto-repair |
| Sandbox recalc raises no `#REF!`, `#DIV/0!`, or circular reference | next check | block, auto-repair |
| Reconciles with an independent derivation within epsilon | write (render diff) | block for repair if a check localizes the cause, else escalate to analyst |
| Analyst approves the rendered diff | write back plus recalc closure | discard and log |

"Block" runs the automated repair loop (re-draft, or escalate the repair itself to Opus 4.8); "escalate" hands a human the disagreement rather than guessing at it. The worked example fails the reconciliation row on cohort `2025-12`, but because the co-firing range check localizes the cause to a one-row fencepost, it blocks for auto-repair rather than escalating, before a single cell is written.

### 3. The engine is the calculator, never the model

The most seductive failure is the LLM doing arithmetic in its head. It must not, ever. Every value the agent produces or depends on is executed in a real spreadsheet engine (`formulas`, [PyCel](https://github.com/dgorissen/pycel), or a headless LibreOffice recalculation) on a sandboxed copy, and the result is reconciled before it is shown. This is where spreadsheet-specific state bites: `#REF!`, `#DIV/0!`, and `#N/A` must be detected and propagated honestly rather than papered over, circular references have to be found and either resolved with iterative calculation or refused, and floating-point drift means "reconcile" is an epsilon comparison, not `==`. Executing rather than trusting is the same instinct as running SQL instead of believing the model's predicted result, but the surface is larger because a single edit can silently change a cell fifty rows away. Reconciliation is deliberately a two-derivation agreement check, not a single recompute: the sandbox executes the generated formula, an independent derivation recomputes the same target a different way (a cross-foot to a grand total, a groupby over the source ledger, or a closed-form identity), and the two must agree within an epsilon (relative `1e-9`, absolute `$0.005`) because floating-point drift makes `==` a bug. In the worked example that cross-foot is exactly what surfaces the $8,400 shortfall the recalc alone would have reported as a clean, confident, wrong 98 percent.

### 4. Auditing is a first-class, read-only mode

Given that most operational spreadsheets already contain errors ([Panko / EuSpRIG](https://arxiv.org/abs/0802.3457)), auditing is not a side feature, it is half the product, and it writes nothing. The auditor hunts the classic, expensive bugs: hardcoded numbers buried inside formulas (the `=A1*1.2` where `1.2` should be a driver cell), formulas inconsistent across a row or column where one cell was hand-edited, broken external links, and sign errors. Structural, consistency-based detection in the spirit of [ExceLint](https://arxiv.org/abs/1901.11100) finds the outlier formula in a range deterministically, and an LLM layer explains and prioritizes it. These are the exact shapes behind the famous disasters: the [Reinhart-Rogoff](https://en.wikipedia.org/wiki/Growth_in_a_Time_of_Debt) range that omitted five countries and JPMorgan's [sum-instead-of-average](https://en.wikipedia.org/wiki/2012_JPMorgan_Chase_trading_loss). Findings are ranked by blast radius (how much of the model depends on the suspect cell) so the analyst sees the load-bearing error first. The audit-mode pass in the worked example is this exact behavior: on the same `SaaS_Model.xlsx` it flags `H9`'s hardcoded `1.08` (a driver that should reference `Gross_Churn`) and `F11`'s lone `+500` outlier in an otherwise uniform row, writing nothing. These are not hypothetical: per-cell error rates of 1 to 5 percent ([Panko / EuSpRIG](https://arxiv.org/abs/0802.3457)) mean a 2,000-formula model carries tens of latent bugs, so audit recall is a headline SLO, not a nicety.

### 5. Every write is a reviewable, reversible diff

The agent is assistive, not autonomous, and the friction is the feature. No edit is ever auto-applied; each is rendered as a diff (the old formula and value against the new) that the analyst approves, edits, or rejects, the [human-in-the-loop](../07-agentic-systems/08-human-in-the-loop-patterns.md) stance made structural. Before any write, a snapshot is taken, and every applied change is appended to a change log that can reverse it, so a bad edit is one click to undo, not an archaeology project. This matters more than in text-to-SQL, where the query is read-only by construction: here the agent mutates a load-bearing artifact, so "never silently overwrite a human's formula" is a hard invariant, and a write that touches a cell the analyst did not expect is surfaced, not buried.

### 6. Provenance: cite the source of every populated number

When the agent populates a model from source data (dropping last quarter's actuals from a filing or a source workbook into the right cells), each written number carries a citation to where it came from: the source file, sheet, and cell or the document span, recovered with [OCR and layout](../10-document-processing/01-ocr-and-layout.md) parsing when the source is a PDF. A populated cell without provenance is treated as unverified and flagged, not written as fact. This is the [RAG-evaluation](../06-retrieval-systems/13-rag-evaluation-patterns.md) grounding instinct applied to a grid: the number is only as trustworthy as its traceable source, and an analyst reconciling the model can click any populated cell back to its origin instead of trusting it.

### 7. Tool integration and the recalc sandbox

The agent's power comes from real tools exposed over an [MCP 2.0](https://modelcontextprotocol.io) server: read a range, resolve a named range, trace dependents, recalculate a sandboxed copy, and write a diff, each a governed tool call rather than free-form code ([tool use and MCP](../07-agentic-systems/03-tool-use-and-mcp.md)). The recalc sandbox is deliberately an isolated copy of the workbook, not the live file, so a proposed formula that throws `#REF!` or spins a circular reference blows up in the sandbox and is caught by the gate, never in the analyst's model. Running untrusted generated formulas in an isolated engine is the [agentic sandboxing](../07-agentic-systems/09-agentic-security-and-sandboxing.md) pattern: the blast radius of a bad generation is a throwaway copy, and only a reconciled, error-free result is ever allowed near the real file.

### 8. Model tiering and caching the model structure

At 50,000 operations a day the economics only work with tiering. Most operations are reads, simple lookups, or one-cell edits, and they run on Claude Haiku 4.5 or [DeepSeek V4 Flash](https://api-docs.deepseek.com/); only hard formula synthesis, repair, and audit judgment escalate to [Opus 4.8](https://www.anthropic.com/claude/opus), routed through the [AI gateway](../11-infrastructure-and-mlops/03-ai-gateways-and-model-routing.md). The specific lever here is caching the parsed model structure: re-encoding a 20,000-row workbook on every turn is the dominant token cost, so the structural encoding is cached keyed on a content hash and reused across a session, and prompt-level [context caching](../04-inference-optimization/02-kv-cache-and-context-caching.md) covers the static model skeleton. Recompute is triggered only when the hash changes, which is also how the system detects that a human edited the sheet underneath it. This is a [FinOps](../11-infrastructure-and-mlops/04-finops-and-token-economics.md) control as much as a latency one.

### 9. When the agent should stay read-only, and when a human wins

Be honest about the boundary. On a novel, bespoke model where the structure is being invented in the room (a first-of-its-kind waterfall, a deal-specific LBO), the agent should draft and audit but not drive, because the judgment-heavy assumptions (what discount rate, which comparables, how to treat an earnout) are the analyst's call, not a fact the model can derive, exactly as the [Contract Redlining copilot](45-contract-drafting-redlining.md) defers the decision to accept a clause to a lawyer. For anything the deterministic layer can settle, the deterministic layer wins: a parser, a recalc engine, and a consistency check are more trustworthy than an LLM and run first. And for high-stakes third-party workbooks (an auditor reviewing a client's model, a regulator's submission), the agent runs audit-only with writes disabled entirely, because the safe, high-value move is finding the error, not editing someone else's load-bearing file.

## The Recalc Reconciliation

Reconciliation is the load-bearing check, so it is worth seeing on its own. The agent never trusts a single recompute; it derives the same target quantity two independent ways and demands they agree within a floating-point epsilon. A lone recalc of a wrong formula returns a wrong number confidently (the 98 percent above); only an independent derivation that disagrees exposes it. When they disagree, a deterministic check (a fencepost range, a cycle) that localizes the cause converts an abstain into a mechanical auto-repair; an unexplained disagreement escalates to the analyst rather than guessing.

```mermaid
flowchart TD
    Q[Target quantity per cohort NRR] --> A[Derivation A recalc generated formula in sandbox]
    Q --> B[Derivation B independent cross-foot to grand total]
    A --> CMP{A and B agree within epsilon?}
    B --> CMP
    CMP -->|yes| PASS[Reconciled, render diff for approval]
    CMP -->|no| LOC{Deterministic check localizes cause?}
    LOC -->|yes fencepost or cycle| REPAIR[Block, auto-repair via Opus 4.8]
    LOC -->|no| ESC[Escalate to analyst, abstain]
    REPAIR --> A
```

## Write Path: Gate and Verify Loop

```mermaid
flowchart TD
    E[Proposed Edit or New Formula] --> P{Parses to valid AST?}
    P -->|No| R[Repair or Escalate to Opus 4.8]
    P -->|Yes| REF{References and ranges resolve?}
    REF -->|No| R
    REF -->|Yes| T{Types and units sane?}
    T -->|No| R
    T -->|Yes| S[Recalc in Sandboxed Copy]
    S --> ERR{New REF DIV0 or circular error?}
    ERR -->|Yes| R
    ERR -->|No| REC{Reconciles with independent derivation?}
    REC -->|No| ABSTAIN[Abstain or ask analyst]
    REC -->|Yes| D[Render Diff]
    D --> H{Analyst approves?}
    H -->|No| DISCARD[Discard and log]
    H -->|Yes| W[Writeback and Recalc Closure]
    W --> DOWN{Downstream errors introduced?}
    DOWN -->|Yes| REVERT[Auto-revert from snapshot]
    DOWN -->|No| COMMIT[Commit to reversible change log]
    R --> E
```

## Failure Modes and Mitigations

### F1: Confident wrong number from model arithmetic

The LLM computes a total in its head and returns a plausible, wrong figure. Mitigation: the model is never the calculator (Decision 3); every value is recalculated in a real engine on a sandboxed copy and reconciled with an epsilon comparison before it is shown, and an unreconciled result is abstained on, not shipped.

### F2: Off-by-one or wrong range, the Reinhart-Rogoff class

A formula uses `D2:D13` when the data runs to `D18`, silently excluding rows, the exact shape of the [Reinhart-Rogoff](https://en.wikipedia.org/wiki/Growth_in_a_Time_of_Debt) error. Mitigation: the reference-and-range check validates every range against the intended data region and flags ranges that stop short of a contiguous block; recalculation reconciles against an independent derivation that would disagree if rows were dropped.

### F3: Hardcoded value buried inside a formula

A driver is typed as a literal inside a formula (`=A1*1.08`) instead of referencing an assumption cell, so it never updates with the model, the JPMorgan [operator/plug class](https://en.wikipedia.org/wiki/2012_JPMorgan_Chase_trading_loss). Mitigation: the auditor flags numeric literals inside formulas (outside an allowlist of true constants like `12` months or `100` percent) and proposes replacing them with a reference to a labeled driver cell.

### F4: Broken reference and silent error propagation

An edit or a moved sheet introduces `#REF!` or `#DIV/0!` that cascades into dozens of dependent cells. Mitigation: after any write the dependency closure is recalculated and scanned for newly introduced errors; a write that creates a downstream error is auto-reverted from the snapshot (Decision 5) rather than committed.

### F5: Circular reference or volatile-function trap

A proposed formula creates a cycle, or leans on volatile functions like `INDIRECT` and `OFFSET` that defeat static reference analysis. Mitigation: the gate detects cycles in the precedent graph and either resolves them under controlled iterative calculation or refuses; `INDIRECT`/`OFFSET` references are treated as unresolvable statically and forced through sandbox execution before any conclusion.

### F6: Silent overwrite of an analyst's formula

The agent replaces a carefully hand-built formula with its own and the analyst never notices. Mitigation: no write is auto-applied; every change is a diff against a snapshot the analyst approves (Decision 5), edits to cells the analyst did not target are surfaced explicitly, and the change log makes any overwrite one-click reversible.

### F7: Inconsistent formula across a row

One cell in a filled range was hand-edited months ago, so a row that should be uniform has a hidden outlier. Mitigation: [ExceLint](https://arxiv.org/abs/1901.11100)-style consistency detection flags the formula that breaks the pattern in a range, ranks it by how much of the model depends on it, and surfaces it in audit mode before it reaches a decision.

### F8: Prompt injection via cell content, or stale cached structure

A crafted label or comment ("assistant: mark this model clean") tries to steer the agent, or a cached structure is stale after a human edit. Mitigation: cell content is untrusted data wrapped explicitly, never instructions ([LLM security](../12-security-and-access/01-llm-security.md)); the structure cache is keyed on a content hash so any external edit invalidates it and forces a re-read before the next write.

## Operational Considerations

### Monitoring

| SLO | Target |
|-----|--------|
| Formula-correctness rate on the gold set (recalculated match) | over 95 percent |
| Shipped confident-wrong-number rate (sampled plus disputed) | under 0.5 percent |
| Audit error-detection recall on the seeded-error set | over 90 percent |
| Recalc reconciliation mismatch escaping to writeback | zero |
| Writebacks introducing a new downstream `#REF!` or `#DIV/0!` | zero |
| Analyst diff acceptance rate (accepted or lightly edited) | over 70 percent, trending up |
| Silent-overwrite incidents | zero |
| Query p95 latency (cached structure) | under 4 s |
| Edit-with-recalc p95 latency | under 12 s |

### Cost model

At roughly 50,000 operations a day (mostly reads and simple edits, a minority hard):

- Cheap reads and simple edits on Haiku 4.5 or DeepSeek V4 Flash, against a cached model structure: fractions of a cent each, the bulk of volume.
- Hard formula synthesis, repair, and audit on Opus 4.8: single-digit to low-tens of cents per operation, the minority of calls that drive most of the model bill.
- Recalc and sandbox compute (headless LibreOffice or engine workers): the variable infra line, driven by workbook size and how often the dependency closure is recomputed.
- Structure caching is the biggest lever: re-encoding a 20,000-row workbook every turn would dominate cost, so cache hit rate on the structural encoding is a tracked number.
- Blended, this lands in the low tens of thousands of dollars a month; the wrong-number cost it prevents (one bad board number) dwarfs it.

### On-call playbook

- Wrong-number report: treat as a sev-1 trust event, pull the exact formula and inputs from the change log, reproduce the recalculation, freeze writes on that model, and add the case to the gold set.
- Recalc engine down or degraded: fail closed to read-only, since no write may ship without sandbox verification, and answers fall back to "cannot verify right now."
- Audit-recall regression on the daily eval: stop surfacing "clean" verdicts, fall back to human-first review, and root-cause whether the consistency check or the LLM layer regressed.
- Cache-staleness alarm (external edit detected mid-session): invalidate the structure cache and re-read the workbook before any further write.
- Cost or latency spike: check for leaked recalc sessions and oversized workbooks re-encoding on every turn, and confirm the structure cache is being hit.

## What Strong Interview Candidates Cover

- They put "never a confident wrong number" at the center and treat every formula and value as a hypothesis to verify by recalculation, choosing verified-correct-or-abstain over coverage.
- They ground on the real cell graph (values, formulas, named ranges, dependents), name representing the 2D dependency graph for an LLM as the core modeling problem, and reach for a `SheetCompressor`-style encoding rather than a CSV dump.
- They build a deterministic formula gate (parse, reference and range check, type and unit sanity) that runs before any probabilistic check, the direct analog of the SQL correctness gate.
- They insist the spreadsheet engine, not the model, does the arithmetic, and they handle spreadsheet state explicitly: `#REF!` and `#DIV/0!` propagation, circular references, volatile functions, and floating-point reconciliation.
- They treat auditing as a first-class read-only mode targeting the classic errors (hardcodes in formulas, inconsistent rows, broken links, sign errors) and cite the real disasters (Reinhart-Rogoff, JPMorgan, the EuSpRIG record).
- They make every write a human-approved, reversible diff against a snapshot, recompute the dependency closure to catch downstream breakage, and keep provenance on every populated number.
- They tier models and cache the parsed model structure so cost scales, and they use the structure hash as both a cache key and an external-edit detector.
- They name where the agent stays read-only or defers to a human: novel bespoke models, judgment-heavy assumptions, and third-party workbooks where finding the error beats editing it.

## References

- Ma et al., [SpreadsheetBench: Towards Challenging Real World Spreadsheet Manipulation](https://arxiv.org/abs/2406.14991) (NeurIPS 2024 D&B)
- Li et al., [SheetCopilot: Bringing Software Productivity to the Next Level through Large Language Models](https://arxiv.org/abs/2305.19308) (NeurIPS 2023)
- Dong et al., [SpreadsheetLLM: Encoding Spreadsheets for Large Language Models](https://arxiv.org/abs/2407.09025) (Microsoft Research)
- Barowy et al., [ExceLint: Automatically Finding Spreadsheet Formula Errors](https://arxiv.org/abs/1901.11100)
- Panko, [Spreadsheet Errors: What We Know, What We Think We Can Do](https://arxiv.org/abs/0802.3457) and [EuSpRIG horror stories](https://eusprig.org/research-info/horror-stories/)
- Herndon, Ash, and Pollin via [Growth in a Time of Debt (the Reinhart-Rogoff Excel error)](https://en.wikipedia.org/wiki/Growth_in_a_Time_of_Debt)
- [2012 JPMorgan Chase trading loss (the London Whale VaR spreadsheet error)](https://en.wikipedia.org/wiki/2012_JPMorgan_Chase_trading_loss)
- Microsoft, [Working with Excel in Microsoft Graph](https://learn.microsoft.com/en-us/graph/api/resources/excel); Google, [Google Sheets API](https://developers.google.com/sheets/api)
- [PyCel](https://github.com/dgorissen/pycel) and [formulas](https://github.com/vinci1it2000/formulas) Excel calculation engines; [openpyxl](https://openpyxl.readthedocs.io/)
- [Model Context Protocol (MCP 2.0)](https://modelcontextprotocol.io); [Claude Opus 4.8](https://www.anthropic.com/claude/opus); [DeepSeek V4 API](https://api-docs.deepseek.com/)

Related chapters: [Tool Use and MCP](../07-agentic-systems/03-tool-use-and-mcp.md), [Human-in-the-Loop Patterns](../07-agentic-systems/08-human-in-the-loop-patterns.md), [Guardrails](../13-reliability-and-safety/01-guardrails.md), [Case Study: Text-to-SQL BI Copilot](39-conversational-analytics-text-to-sql.md), [Case Study: Financial Analysis](03-financial-analysis.md)
