# Contextual Retrieval

Contextual Retrieval is an ingestion-time technique that solves the #1 cause of RAG failure: **chunks that lose meaning when separated from their source document**. Pioneered by Anthropic in late 2024, it is now a production standard for high-precision retrieval. Anthropic's own measurements show a 49% reduction in retrieval failures with hybrid search alone, and 67% reduction when combined with reranking.

## Table of Contents

- [The Problem: Context Dilution](#context-dilution)
- [How Contextual Retrieval Works](#how-it-works)
- [Contextual Embeddings](#contextual-embeddings)
- [Contextual BM25](#contextual-bm25)
- [The Full Pipeline: Hybrid + Reranking](#full-pipeline)
- [Implementation Patterns](#implementation)
- [Cost Considerations](#cost)
- [Contextual Retrieval vs. Other Approaches](#comparison)
- [Production Architecture](#production)
- [Interview Questions](#interview-questions)
- [References](#references)

---

## The Problem: Context Dilution

When we chunk documents for RAG, individual chunks lose the surrounding context that gives them meaning.

**Example of Context Dilution:**

```
Original Document: "Acme Corp Q3 2025 Financial Report"
  Section 4: Product Pricing

  "The Standard plan costs $200/month. The Enterprise
   plan includes SSO and audit logs for $800/month."

-------- After Chunking --------

Chunk 17: "It costs $200/month."
Chunk 18: "The Enterprise plan includes SSO and audit
           logs for $800/month."
```

**The problem with Chunk 17**: A user searching "How much does Acme Standard plan cost?" will likely miss this chunk because it contains no mention of "Acme," "Standard," or "plan." The embedding of "It costs $200/month" is semantically distant from the query.

**Insight**: Anthropic's research showed that traditional chunking causes a **5.7% retrieval failure rate** on the top-20 retrieved chunks. That means roughly 1 in 18 queries fails to retrieve the relevant information, even when it exists in the knowledge base.

---

## How Contextual Retrieval Works

The core idea is simple: **before embedding a chunk, prepend a short context string that explains what the chunk is about within the full document**.

```
┌──────────────────────────────────────────────────┐
│              TRADITIONAL CHUNKING                │
│                                                  │
│  Document ──► Split ──► Chunks ──► Embed ──► DB  │
│                                                  │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│              CONTEXTUAL RETRIEVAL                            │
│                                                              │
│  Document ──► Split ──► Chunks ──┐                           │
│                                  ├──► Contextualize ──►      │
│  Document (full) ───────────────┘    (LLM call per chunk)    │
│                                                              │
│  ──► Contextual Chunks ──► Embed ──► DB                      │
│                            + BM25 Index                      │
└──────────────────────────────────────────────────────────────┘
```

**The contextualization step** sends the full document + individual chunk to an LLM with this prompt:

```
<document>
{{WHOLE_DOCUMENT}}
</document>

Here is the chunk we want to situate within the whole document:
<chunk>
{{CHUNK_CONTENT}}
</chunk>

Please give a short succinct context to situate this chunk
within the overall document for the purposes of improving
search retrieval of the chunk. Answer only with the succinct
context and nothing else.
```

**Result for Chunk 17**:

```
Before: "It costs $200/month."

After:  "This chunk is from the Acme Corp Q3 2025 Financial
         Report, Section 4 on Product Pricing. It describes
         the cost of the Standard plan.
         It costs $200/month."
```

Now the embedding of this chunk contains "Acme," "Standard plan," and "Product Pricing" -- all the terms a user would naturally search for.

---

## Contextual Embeddings

Contextual Embeddings is the first sub-technique: embedding the contextualized chunk instead of the raw chunk.

### How It Improves Retrieval

| Scenario | Raw Chunk Embedding | Contextual Embedding |
|----------|--------------------|-----------------------|
| User asks about "Acme pricing" | Misses "It costs $200" | Matches "Acme...Standard plan...costs $200" |
| User asks about "SSO features" | Matches "SSO and audit logs" | Matches with added context of "Enterprise plan" |
| User asks about "Q3 financials" | No match (no mention of Q3) | Matches via prepended "Q3 2025 Financial Report" |

**Performance**: Contextual Embeddings alone reduce top-20 retrieval failure from **5.7% to 3.7%** -- a **35% reduction** in retrieval failures.

### The Vector Space Shift

```
                    ▲ Dimension 2
                    │
                    │    ● "Acme pricing" (query)
                    │         \
                    │          \  close (contextual)
                    │           \
                    │            ● Contextualized chunk
                    │
                    │                          ● Raw chunk "It costs $200"
                    │                            (far from query)
                    │
                    └─────────────────────────────► Dimension 1
```

---

## Contextual BM25

The second sub-technique applies the same contextualization to create a **BM25 keyword index** over the enriched chunks.

### Why BM25 Still Matters

Dense embeddings excel at semantic similarity but fail on:
- **Exact terms**: Product IDs, version numbers, acronyms
- **Rare tokens**: Domain-specific jargon that embedding models under-represent
- **Proper nouns**: Company names, people, places

**Example**: A user searching "Widget-X pricing" would get zero BM25 matches on the raw chunk "It costs $200/month" because "Widget-X" never appears. With contextual BM25, the prepended context includes "Widget-X" as a keyword, enabling the BM25 match.

### Performance Gains (Cumulative)

| Configuration | Failure Rate | Reduction vs. Baseline |
|---------------|-------------|----------------------|
| Traditional embeddings (baseline) | 5.7% | -- |
| Contextual Embeddings only | 3.7% | 35% |
| Contextual Embeddings + Contextual BM25 | 2.9% | **49%** |
| Contextual Embeddings + Contextual BM25 + Reranking | 1.9% | **67%** |

**Takeaway**: The combination of contextual embeddings + contextual BM25 is the highest-leverage single change you can make to a RAG pipeline. Adding a reranker on top gets you to 67% fewer failures.

---

## The Full Pipeline: Hybrid + Reranking

The production-grade Contextual Retrieval pipeline has four stages:

```
┌─────────────────────────────────────────────────────────────────┐
│                     INGESTION PIPELINE                          │
│                                                                 │
│  1. Chunk documents (recursive, 300-500 tokens)                 │
│  2. For each chunk:                                             │
│     a. Send (full_doc + chunk) to LLM                           │
│     b. Get context string (50-100 tokens)                       │
│     c. Prepend context to chunk                                 │
│  3. Embed contextualized chunks ──► Vector DB                   │
│  4. Index contextualized chunks ──► BM25 Index                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     QUERY PIPELINE                              │
│                                                                 │
│  User Query                                                     │
│      │                                                          │
│      ├──► Vector Search (Top 50) ──┐                            │
│      │                             ├──► RRF Fusion (Top 25)     │
│      └──► BM25 Search (Top 50)  ──┘         │                   │
│                                             ▼                   │
│                                      Reranker (Top 5)           │
│                                             │                   │
│                                             ▼                   │
│                                     LLM Generation              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Reciprocal Rank Fusion (RRF) for Combining Results

The same RRF technique used in standard hybrid search applies here:

```
RRF_Score(doc) = sum( 1 / (k + rank_in_list) )
                 for each list where doc appears

k = 60 (standard smoothing constant)
```

---

## Implementation Patterns

### Pattern 1: Basic Contextual Retrieval (Python)

```python
import anthropic
from typing import List

client = anthropic.Anthropic()

CONTEXT_PROMPT = """<document>
{document}
</document>

Here is the chunk we want to situate within the whole document:
<chunk>
{chunk}
</chunk>

Please give a short succinct context to situate this chunk
within the overall document for the purposes of improving
search retrieval of the chunk. Answer only with the succinct
context and nothing else."""


def contextualize_chunk(
    full_document: str,
    chunk: str,
    model: str = "claude-sonnet-4-20250514"
) -> str:
    """Generate context for a single chunk."""
    response = client.messages.create(
        model=model,
        max_tokens=200,
        messages=[{
            "role": "user",
            "content": CONTEXT_PROMPT.format(
                document=full_document,
                chunk=chunk
            )
        }]
    )
    context = response.content[0].text
    return f"{context}\n\n{chunk}"


def process_document(document: str, chunks: List[str]) -> List[str]:
    """Contextualize all chunks in a document."""
    contextualized = []
    for chunk in chunks:
        ctx_chunk = contextualize_chunk(document, chunk)
        contextualized.append(ctx_chunk)
    return contextualized
```

### Pattern 2: Cost-Optimized with Prompt Caching

The biggest cost driver is sending the full document with every chunk. **Prompt Caching** solves this:

```python
def contextualize_with_caching(
    full_document: str,
    chunks: List[str],
    model: str = "claude-sonnet-4-20250514"
) -> List[str]:
    """
    Use prompt caching so the full document is only
    processed once across all chunks.
    """
    results = []

    for chunk in chunks:
        response = client.messages.create(
            model=model,
            max_tokens=200,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"<document>\n{full_document}\n</document>",
                        "cache_control": {"type": "ephemeral"}
                    },
                    {
                        "type": "text",
                        "text": (
                            f"<chunk>\n{chunk}\n</chunk>\n\n"
                            "Please give a short succinct context to "
                            "situate this chunk within the overall "
                            "document for the purposes of improving "
                            "search retrieval of the chunk. Answer "
                            "only with the succinct context and "
                            "nothing else."
                        )
                    }
                ]
            }]
        )
        context = response.content[0].text
        results.append(f"{context}\n\n{chunk}")

    return results
```

**Cost Impact of Prompt Caching**: For a 10,000-token document split into 30 chunks, prompt caching reduces the contextualization cost by up to **90%** because the document prefix is cached after the first call.

### Pattern 3: Contextual Chunk Headers (Lightweight Alternative)

If LLM-based contextualization is too expensive, use **Contextual Chunk Headers (CCH)** as a deterministic alternative:

```python
def add_chunk_headers(
    document_title: str,
    section_hierarchy: List[str],
    chunk: str
) -> str:
    """
    Prepend document and section metadata to the chunk.
    No LLM call required -- purely structural.
    """
    header_parts = [f"Document: {document_title}"]

    for i, section in enumerate(section_hierarchy):
        prefix = "  " * i
        header_parts.append(f"{prefix}Section: {section}")

    header = "\n".join(header_parts)
    return f"{header}\n\n{chunk}"


# Example usage:
contextualized = add_chunk_headers(
    document_title="Acme Corp Q3 2025 Financial Report",
    section_hierarchy=["Finance", "Product Pricing", "Standard Plan"],
    chunk="It costs $200/month."
)

# Result:
# Document: Acme Corp Q3 2025 Financial Report
#   Section: Finance
#     Section: Product Pricing
#       Section: Standard Plan
#
# It costs $200/month.
```

**When to use CCH vs. LLM Contextualization:**

| Factor | Chunk Headers (CCH) | LLM Contextualization |
|--------|--------------------|-----------------------|
| **Cost** | Free (no LLM calls) | $1-5 per 1M tokens |
| **Quality** | Good for structured docs | Excellent for all docs |
| **Speed** | Instant | 50-200ms per chunk |
| **Best for** | Markdown, HTML, PDFs with clear headers | Unstructured text, legal, medical |

---

## Cost Considerations

### Contextualization Costs

For a knowledge base of 10,000 chunks (avg 400 tokens each):

| Model | Cost per Chunk | Total Cost | Quality |
|-------|---------------|------------|---------|
| Claude Haiku (fast, cheap) | ~$0.0003 | ~$3 | Good |
| Claude Sonnet (balanced) | ~$0.002 | ~$20 | Very Good |
| Claude Opus (highest quality) | ~$0.01 | ~$100 | Excellent |

**Best practice**: Use Haiku (or another fast, cheap model) for contextualization. The context strings are short and factual, so you do not need a frontier model. Combine with prompt caching for ~90% cost reduction on the document body that gets passed in repeatedly.

### When to Use Contextual Retrieval

**Use it when:**
- Your corpus has fragmented documents where chunks lose meaning in isolation
- You have domain-specific jargon that embedding models struggle with
- Your retrieval failure rate exceeds 3-5%
- You can afford the one-time ingestion cost

**Skip it when:**
- Your chunks are already self-contained (e.g., FAQ pairs, product descriptions)
- Your corpus is tiny (< 100 chunks) -- just use long-context instead
- You need real-time ingestion (< 1s per document) and cannot batch

---

## Contextual Retrieval vs. Other Approaches

| Approach | How It Works | Retrieval Improvement | Cost | Complexity |
|----------|-------------|----------------------|------|------------|
| **Naive Chunking** | Fixed-size splits, embed raw | Baseline | None | Low |
| **Chunk Headers (CCH)** | Prepend doc/section titles | 10-20% | None | Low |
| **Contextual Retrieval** | LLM-generated context per chunk | 35-49% | $3-20 per 10k chunks | Medium |
| **Contextual + Reranking** | Above + cross-encoder rerank | 67% | $5-30 per 10k chunks | Medium-High |
| **HyDE** | Hypothetical doc generation at query time | 20-40% | Per-query LLM cost | Medium |
| **Parent-Child Chunking** | Embed children, retrieve parents | 15-30% | None | Medium |

**Key Distinction**: Contextual Retrieval is an **ingestion-time** technique (pay once), while HyDE is a **query-time** technique (pay per query). For high-volume systems, Contextual Retrieval amortizes much better.

### Contextual Retrieval vs. Late Chunking

**Late Chunking** (Jina, 2024) is a related but distinct approach:

```
Contextual Retrieval:
  Chunk ──► LLM adds context ──► Embed enriched chunk

Late Chunking:
  Full doc ──► Long-context embed model ──► Token embeddings
  ──► THEN chunk the token embeddings (preserving context)
```

Late Chunking requires a long-context embedding model (e.g., Jina v3) and avoids LLM calls entirely. It preserves context through the embedding model's attention mechanism rather than explicit text prepending. The tradeoff is that Late Chunking does not help BM25 search, only dense retrieval.

---

## Production Architecture

### Reference Architecture: Contextual RAG at Scale

```
┌─────────────────────────────────────────────────────────────────────┐
│                     INGESTION SERVICE                               │
│                                                                     │
│  Document Store ──► Chunker ──► Contextualization Queue             │
│                       │              │                              │
│                       │         ┌────┴────┐                         │
│                       │         │ Workers  │ (N parallel LLM calls) │
│                       │         │ + Cache  │                        │
│                       │         └────┬────┘                         │
│                       │              │                              │
│                       ▼              ▼                              │
│                  Raw Chunks    Contextualized Chunks                 │
│                       │              │                              │
│                       │         ┌────┴────┐                         │
│                       │         │ Embed + │                         │
│                       │         │ BM25    │                         │
│                       │         └────┬────┘                         │
│                       │              │                              │
│                       ▼              ▼                              │
│                  Metadata DB    Vector DB + BM25 Index               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     QUERY SERVICE                                   │
│                                                                     │
│  Query ──► [Vector Search] + [BM25 Search]                          │
│                    │               │                                │
│                    └───── RRF ─────┘                                │
│                           │                                         │
│                      Top 25 chunks                                  │
│                           │                                         │
│                      Reranker (Cohere, Cross-Encoder)               │
│                           │                                         │
│                      Top 5 chunks                                   │
│                           │                                         │
│                      LLM Generation                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Scaling Considerations

| Concern | Solution |
|---------|----------|
| **Ingestion throughput** | Parallelize LLM calls (50-100 concurrent) with async workers |
| **Document updates** | Re-contextualize only changed chunks; store raw + context separately |
| **Cost at scale** | Use Haiku + prompt caching; batch documents by size |
| **Quality monitoring** | Sample 1% of chunks and human-evaluate context quality |
| **Index consistency** | Update vector DB + BM25 index atomically per document |

---

## Interview Questions

### Q: Explain Anthropic's Contextual Retrieval. When would you use it and when would you skip it?

**Strong answer:**
Contextual Retrieval solves the "context dilution" problem in RAG. When documents are chunked, individual chunks lose the surrounding context that gives them meaning -- a chunk saying "It costs $200" is useless without knowing *what* costs $200. The technique uses an LLM at ingestion time to generate a short context string (50-100 tokens) per chunk, explaining what that chunk is about within the document. This context is prepended to the chunk before embedding and BM25 indexing.

The key results: Contextual Embeddings alone reduce retrieval failures by 35%. Adding Contextual BM25 achieves 49% reduction. Adding a reranker reaches 67% reduction.

I would use it when chunks regularly lose meaning in isolation -- legal contracts, financial reports, technical manuals. I would skip it when chunks are already self-contained (FAQs, product cards) or when the corpus is small enough for long-context RAG.

### Q: A knowledge base of 50,000 documents needs Contextual Retrieval. How do you manage the ingestion cost?

**Strong answer:**
Three strategies:
1. **Model selection**: Use a small, fast model (Claude Haiku-class) for contextualization. The output is short factual text, not creative writing -- a frontier model adds cost without quality gain.
2. **Prompt caching**: Cache the full document text across all chunk contextualization calls. For a 10,000-token document with 30 chunks, this reduces input token costs by approximately 90%.
3. **Tiered approach**: Not every document needs LLM contextualization. For well-structured documents (Markdown, HTML with headers), use deterministic Contextual Chunk Headers (prepending doc title + section hierarchy) which is free. Reserve LLM contextualization for unstructured or ambiguous documents.

### Q: How does Contextual Retrieval compare to HyDE for improving retrieval quality?

**Strong answer:**
They solve different sides of the same problem. Contextual Retrieval enriches **documents** at ingestion time (pay once), while HyDE enriches **queries** at search time (pay per query). For a system handling 10,000 queries/day against a 50,000-chunk corpus, Contextual Retrieval is dramatically cheaper because the ingestion cost is amortized. HyDE also has a hallucination risk -- the hypothetical document might pull in wrong data. In practice, the strongest systems use both: Contextual Retrieval for ingestion enrichment and HyDE (or multi-query expansion) for complex queries that need query-side help.

---

## References
- Anthropic. "Contextual Retrieval" (September 2024)
- Jina AI. "Late Chunking: Contextual Chunk Embeddings Using Long-Context Embedding Models" (2024)
- Voyage AI. "voyage-context-3: Contextualized Chunk Embeddings" (2025)
- NirDiamant. "RAG Techniques: Contextual Chunk Headers" (GitHub, 2024)

---

*Previous: [Advanced Retrieval Patterns](09-advanced-retrieval-patterns.md) | Next: [Late Interaction & ColBERT](11-late-interaction-colbert.md)*
