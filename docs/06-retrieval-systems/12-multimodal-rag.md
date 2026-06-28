# Multi-Modal RAG

Multi-modal RAG extends retrieval-augmented generation beyond plain text to handle images, tables, charts, audio, and mixed-layout documents. Production systems now routinely ingest PDFs with diagrams, slide decks, scanned invoices, and research papers where the visual layout *is* the meaning. Three architectures dominate: caption-and-index, unified vision-text embeddings (Cohere Embed v4, Voyage-Multimodal-3.5, Gemini Embedding 001), and page-as-image with late interaction (ColPali, ColQwen2.5, ColNomic).

## Table of Contents

- [Why Text-Only RAG Fails](#why-text-only-rag-fails)
- [Architecture Patterns](#architecture-patterns)
- [Multi-Modal Embedding Strategies](#multi-modal-embedding-strategies)
- [Vision-Language Models for Document Understanding](#vision-language-models)
- [ColPali and Vision-Based Retrieval](#colpali)
- [Table Extraction and Structured Data Retrieval](#table-extraction)
- [Chart and Diagram Understanding](#chart-understanding)
- [Production Architecture](#production-architecture)
- [Implementation Example](#implementation-example)
- [System Design Interview Angle](#system-design-interview-angle)
- [References](#references)

---

## Why Text-Only RAG Fails

Traditional RAG pipelines parse documents into text chunks, embed them, and retrieve against a text query. This breaks on real-world documents:

| Document Element | Text-Only RAG Behavior | Actual Information Lost |
|-----------------|----------------------|------------------------|
| **Bar Chart** | Extracts axis labels only | Trends, comparisons, magnitudes |
| **Architecture Diagram** | Misses entirely | Component relationships, data flow |
| **Table** | Flattened rows lose structure | Row-column associations, headers |
| **Infographic** | Captures scattered text fragments | Visual hierarchy, spatial groupings |
| **Photo with Caption** | Gets caption, loses image | Visual evidence, spatial context |

**Reality**: Enterprise documents are 40-60% non-textual content. A financial report's value is in its charts. A medical paper's key finding is in its figures. Ignoring visual content means ignoring most of the knowledge.

---

## Architecture Patterns

There are three dominant patterns for multi-modal RAG, each with distinct trade-offs:

### Pattern 1: Unified Embedding Space

```
                     Shared Vector Space
                    +-------------------+
  Text  --> Encoder |  [0.2, 0.8, ...] |
  Image --> Encoder |  [0.3, 0.7, ...] |  --> Single Index --> Retrieve
  Table --> Encoder |  [0.1, 0.9, ...] |
                    +-------------------+

  Query "show revenue trends" --> encode --> nearest neighbors across ALL modalities
```

- **How**: Use a model like CLIP or SigLIP to project text and images into the same vector space.
- **Pros**: Single index, single query, simple retrieval logic.
- **Cons**: Embedding quality varies across modalities; tables need serialization.

### Pattern 2: Modality-Specific Retrieval with Fusion

```
  Query --> +----> Text Index    --> Top-K text chunks
            |
            +----> Image Index   --> Top-K images
            |
            +----> Table Index   --> Top-K tables
            |
            v
        Fusion / Reranking Layer --> Combined Top-K --> VLM Generator
```

- **How**: Separate embeddings and indices per modality. A reranker or reciprocal rank fusion (RRF) merges results.
- **Pros**: Best-in-class embeddings per modality; can tune each retriever independently.
- **Cons**: More infra complexity; fusion logic is non-trivial.

### Pattern 3: Vision-First (Page-as-Image)

```
  Document Page --> Screenshot/Render --> Vision Encoder --> Multi-vector Index
                                              |
  Query ---------> Text Encoder --------------+---> Late Interaction Score
                                                    --> Retrieve top pages
```

- **How**: Treat every document page as an image. Use a vision-language model (e.g., ColPali) to create patch-level embeddings. Score via late interaction (MaxSim).
- **Pros**: No OCR, no layout parsing, no table extraction pipeline. End-to-end trainable.
- **Cons**: Higher compute at indexing; loses fine-grained text search.

**Recommendation**: Pattern 3 (vision-first) is gaining ground fast for document-heavy use cases. Pattern 2 remains the production workhorse when you need precise text search alongside visual retrieval.

---

## Multi-Modal Embedding Strategies

### CLIP (Contrastive Language-Image Pretraining)

The original dual-encoder that maps text and images to a shared 512/768-dim space.

- **Strengths**: Huge ecosystem, well-understood, many fine-tuned variants.
- **Weaknesses**: Weaker on document-style images (charts, tables) vs. natural photos. Contrastive loss requires large batch sizes.

### SigLIP / SigLIP 2

Replaces CLIP's softmax cross-entropy with a sigmoid loss, allowing each image-text pair to be evaluated independently.

- **SigLIP 2 (2025)**: Adds captioning decoders, self-distillation, and masked prediction. Trained on 10B+ images across 109 languages.
- **Key Win**: Outperforms CLIP at small batch sizes (4-8k) and provides denser, more robust features.
- **Production Use**: National Library of Norway, e-commerce visual search, AI art curation.

### Comparison for RAG

| Model | Best For | Embedding Dim | Document Quality | Natural Image Quality |
|-------|----------|--------------|-----------------|----------------------|
| CLIP ViT-L/14 | General purpose | 768 | Medium | High |
| SigLIP 2 So400m | Multi-lingual docs | 1152 | High | High |
| Nomic Embed Vision | Text-heavy docs | 768 | High | Medium |
| Voyage Multimodal 3 | Mixed documents | 1024 | High | High |

### Embedding Strategy Decision

```
Is your content mostly natural images (photos, products)?
  YES --> CLIP or SigLIP fine-tuned on your domain
  NO
    |
    v
Is your content document pages (PDFs, slides, reports)?
  YES --> ColPali / ColQwen (vision-first, no OCR needed)
  NO
    |
    v
Is it a mix of text, images, and structured data?
  YES --> Modality-specific encoders + fusion (Pattern 2)
```

---

## Vision-Language Models for Document Understanding

VLMs serve two roles in multi-modal RAG: (1) as the **generator** that synthesizes answers from retrieved multi-modal context, and (2) as the **indexing engine** that extracts structured information at ingestion time.

### VLM Capabilities Comparison

| Capability | Claude Opus 4.7 / Sonnet 4.6 | GPT-5.5 | Gemini 3.1 Pro |
|-----------|------------------------------|---------|----------------|
| **Chart Reading** | Excellent | Excellent | Excellent |
| **Table Extraction** | Excellent | Good | Excellent |
| **Diagram Understanding** | Excellent | Good | Excellent |
| **Handwriting OCR** | Good | Good | Good |
| **Multi-page Reasoning** | Excellent (1M ctx on Sonnet 4.6) | Excellent (1M ctx) | Excellent (1M ctx) |
| **Structured Output** | Native JSON mode | Native JSON mode | Native JSON mode |

### VLM-Augmented Ingestion Pipeline

```
  Raw PDF
    |
    v
  Page Renderer (pdf2image, 300 DPI)
    |
    v
  VLM Extraction Pass:
    +-- "Extract all tables as markdown"
    +-- "Describe this chart: axes, trends, key data points"
    +-- "Summarize the diagram: components and relationships"
    |
    v
  Structured Output (JSON)
    |
    +---> Text chunks     --> Text embedding index
    +---> Table markdown  --> Text embedding index (with metadata: "type=table")
    +---> Chart summaries --> Text embedding index (with metadata: "type=chart")
    +---> Page images     --> Image embedding index (CLIP/SigLIP)
```

This "describe-then-embed" approach converts visual content into searchable text while preserving the original image for the generation step.

---

## ColPali and Vision-Based Retrieval

ColPali represents a paradigm shift: instead of building complex OCR + layout + table extraction pipelines, treat each document page as a single image and let a vision-language model handle everything.

### How ColPali Works

```
  Document Page Image
        |
        v
  SigLIP Vision Encoder (So400m)
        |
  Splits image into patches (e.g., 32x32 grid = 1024 patches)
        |
        v
  Gemma 2B Language Model (contextualizes patch embeddings)
        |
        v
  Linear Projection --> 128-dim patch embeddings
        |
  Result: 1024 vectors of dim 128 per page
        |
        v
  Stored in Multi-Vector Index

  At query time:
  Query --> Tokenize --> Embed --> 128-dim token embeddings
        |
        v
  Late Interaction (MaxSim):
    Score = Sum over query tokens of Max similarity to any patch
```

### ColPali vs. Traditional Pipeline

| Aspect | Traditional Pipeline | ColPali |
|--------|---------------------|---------|
| **OCR** | Required (Tesseract, Azure OCR) | Not needed |
| **Layout Detection** | Required (Detectron2, LayoutLM) | Not needed |
| **Table Parser** | Required (Camelot, Tabula) | Not needed |
| **Chart Extractor** | Required (ChartOCR) | Not needed |
| **Indexing Speed** | Slow (multi-stage) | Fast (single forward pass) |
| **Retrieval Quality** | High on text, poor on visuals | High across all modalities |
| **Storage** | Text index (~small) | Multi-vector index (~larger) |

### ColPali Family

- **ColPali (v1)**: PaliGemma-3B backbone. The original.
- **ColQwen 2.5**: Qwen2-VL backbone. Better multilingual support, improved on Asian-language documents.
- **ColSmol**: Smaller variant for edge deployment. ~1B parameters.

### ViDoRe Benchmark Results

ColPali excels on visually complex benchmarks like InfographicVQA, ArxivQA, and TabFQuAD, which test infographics, figures, and tables respectively. It outperforms traditional text-based pipelines even on text-centric documents.

---

## Table Extraction and Structured Data Retrieval

Tables are the hardest modality for traditional RAG. Flattening a table row-by-row destroys the column-header relationships that give each cell meaning.

### Strategy 1: VLM-Based Extraction

```python
# Pseudocode: Extract tables using a VLM
def extract_tables_from_page(page_image: bytes) -> list[dict]:
    prompt = """
    Extract ALL tables from this document page.
    For each table, return:
    {
      "title": "table title or caption",
      "headers": ["col1", "col2", ...],
      "rows": [["val1", "val2", ...], ...],
      "markdown": "| col1 | col2 |\\n|---|---|\\n| val1 | val2 |"
    }
    Return JSON array. If no tables, return [].
    """
    response = vlm.generate(image=page_image, prompt=prompt)
    return json.loads(response)
```

### Strategy 2: Specialized Table Parsers

- **Tabula / Camelot**: Rule-based PDF table extraction. Fast but brittle on complex layouts.
- **Table Transformer (DETR-based)**: Detects table boundaries and cell structure from images.
- **Unstructured.io**: Combines heuristics with ML models for layout-aware parsing.

### Strategy 3: Table-Aware Chunking

```
  Original Table (20 rows x 8 columns)
        |
        v
  Chunk as complete unit (do NOT split tables across chunks)
        |
        v
  Embed the full markdown table as a single chunk
        |
        v
  Add metadata: {"type": "table", "page": 14, "caption": "Q3 Revenue by Region"}
        |
        v
  At generation time: pass the FULL table to the LLM, not a fragment
```

**Key Principle**: Tables must be atomic retrieval units. Never split a table across chunk boundaries.

---

## Chart and Diagram Understanding

### Chart Types and Extraction Approaches

| Chart Type | What to Extract | Best Approach |
|-----------|----------------|---------------|
| **Bar/Line/Pie** | Data values, trends, comparisons | VLM description + data table extraction |
| **Flow Diagram** | Steps, decisions, connections | VLM structured extraction (nodes + edges) |
| **Architecture Diagram** | Components, relationships, data flow | VLM description + entity extraction |
| **Scatter Plot** | Correlations, outliers, clusters | VLM trend description + raw data if available |
| **Gantt Chart** | Timeline, dependencies, milestones | VLM structured extraction |

### Dual-Representation Strategy

For each chart or diagram, store TWO representations:

```
  Chart Image
    |
    +---> (1) Text Description (for text-based retrieval)
    |         "This bar chart shows Q3 revenue by region.
    |          North America: $4.2M, Europe: $3.1M, APAC: $2.8M.
    |          NA grew 15% QoQ while APAC declined 3%."
    |
    +---> (2) Original Image (for visual retrieval + generation context)
              Stored with CLIP/SigLIP embedding for image-based queries
```

This ensures the chart is retrievable by both text queries ("what was APAC revenue?") and visual queries ("show me the revenue chart").

---

## Production Architecture

### Full Multi-Modal RAG Pipeline

```
  INGESTION:
  Raw Docs --> Doc Classifier --+--> Text-Heavy  --> chunking + text embeddings
                                +--> Visual-Heavy --> page render + ColPali
                                +--> Mixed        --> VLM extraction + hybrid
                                         |
                                         v
                          [Text Index] [Image Index] [Table Index]

  RETRIEVAL:
  Query --> Query Analyzer --+--> Text:  BM25 + dense search
                             +--> Image: CLIP/ColPali search
                             +--> Table: metadata-filtered dense
                                    |
                                    v
                             Cross-Modal Reranker --> Context Assembly --> VLM --> Response
```

### Scaling Considerations

| Concern | Solution |
|---------|----------|
| **Index Size** | ColPali stores ~1024 vectors/page. For 1M pages = ~1B vectors. Use quantization (binary, PQ). |
| **Ingestion Latency** | VLM extraction is slow (~2-5s/page). Use async workers with GPU acceleration. |
| **Query Latency** | Multi-index fan-out adds latency. Use parallel retrieval + aggressive top-k pruning. |
| **Cost** | VLM calls at ingestion are one-time. Amortize over query volume. Budget $0.01-0.05/page for extraction. |
| **Storage** | Store page images in object storage (S3). Store embeddings in vector DB. Store text in search index. |

---

## Implementation Example

### End-to-End Multi-Modal RAG with ColPali + VLM

```python
# Pseudocode: Production multi-modal RAG pipeline

from colpali_engine import ColPali, ColPaliProcessor
from qdrant_client import QdrantClient
import anthropic

# --- INDEXING ---

def index_document(pdf_path: str, collection: str):
    """Index a PDF document using ColPali for visual retrieval
    and VLM extraction for text-based retrieval."""

    pages = render_pdf_to_images(pdf_path, dpi=300)

    colpali_model = ColPali.from_pretrained("vidore/colpali-v1.3")
    processor = ColPaliProcessor.from_pretrained("vidore/colpali-v1.3")
    vlm_client = anthropic.Anthropic()

    for page_num, page_image in enumerate(pages):
        # 1. Generate ColPali multi-vector embeddings
        inputs = processor(images=[page_image])
        patch_embeddings = colpali_model(**inputs)  # shape: [1, 1024, 128]

        # 2. Extract structured content via VLM
        extraction = vlm_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image", "source": encode_image(page_image)},
                    {"type": "text", "text": """Extract from this page:
                    1. All text content (preserve structure)
                    2. Tables as markdown
                    3. Chart descriptions with data points
                    Return as JSON with keys: text, tables, charts"""}
                ]
            }]
        )

        structured = json.loads(extraction.content[0].text)

        # 3. Store in vector DB
        qdrant.upsert(collection, points=[
            # ColPali multi-vector for visual retrieval
            PointStruct(
                id=f"{pdf_path}:page:{page_num}:colpali",
                vector={"colpali": patch_embeddings[0].tolist()},
                payload={
                    "source": pdf_path,
                    "page": page_num,
                    "type": "page_image",
                    "text_preview": structured["text"][:500]
                }
            ),
            # Text embeddings for each extracted element
            *create_text_chunks(structured, pdf_path, page_num)
        ])


# --- RETRIEVAL ---

def retrieve(query: str, collection: str, top_k: int = 5):
    """Hybrid retrieval: ColPali visual + text semantic search."""

    # Visual retrieval via ColPali
    query_inputs = processor(text=[query])
    query_embeddings = colpali_model(**query_inputs)

    visual_results = qdrant.query(
        collection,
        query_vector=("colpali", query_embeddings[0].tolist()),
        limit=top_k,
        query_filter=Filter(must=[FieldCondition(key="type", match="page_image")])
    )

    # Text retrieval via dense embeddings
    text_embedding = text_encoder.encode(query)
    text_results = qdrant.search(
        collection,
        query_vector=("text", text_embedding.tolist()),
        limit=top_k
    )

    # Fuse results using reciprocal rank fusion
    fused = reciprocal_rank_fusion(visual_results, text_results, k=60)
    return fused[:top_k]


# --- GENERATION ---

def generate_answer(query: str, retrieved_context: list) -> str:
    """Generate answer using VLM with multi-modal context."""

    content_blocks = [{"type": "text", "text": f"Question: {query}\n\nContext:"}]

    for ctx in retrieved_context:
        if ctx.payload["type"] == "page_image":
            # Include the actual page image
            content_blocks.append({
                "type": "image",
                "source": load_page_image(ctx.payload["source"], ctx.payload["page"])
            })
        else:
            # Include text/table content
            content_blocks.append({
                "type": "text",
                "text": f"[{ctx.payload['type']}] {ctx.payload['content']}"
            })

    content_blocks.append({
        "type": "text",
        "text": "Answer the question using ONLY the provided context. Cite sources."
    })

    response = vlm_client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2048,
        messages=[{"role": "user", "content": content_blocks}]
    )
    return response.content[0].text
```

---

## System Design Interview Angle

### Q: Design a RAG system for a financial research platform that needs to answer questions about earnings reports containing text, tables, and charts.

**Strong answer:**

The core challenge is that 60%+ of the information in earnings reports lives in tables and charts, not prose. A text-only RAG pipeline would miss revenue breakdowns, trend lines, and comparative data.

**Architecture**: I would use a hybrid approach (Pattern 2 + elements of Pattern 3):

1. **Ingestion**: Render each PDF page at 300 DPI. Run a VLM extraction pass to convert tables to markdown and charts to structured descriptions. Simultaneously generate ColPali multi-vector embeddings for each page image.

2. **Storage**: Three indices -- (a) text chunks with dense embeddings (financial text), (b) table markdown with dense embeddings plus metadata filters for table type, (c) ColPali multi-vector index for page-level visual retrieval.

3. **Retrieval**: Query analyzer classifies the query type. "What was Q3 revenue?" triggers text + table search. "Show me the revenue trend" triggers visual (ColPali) search. Results are fused via RRF and reranked by a cross-encoder.

4. **Generation**: A VLM (Claude or Gemini) receives the fused context -- text chunks, table markdown, and relevant page images. It generates a grounded answer with citations to specific pages and tables.

**Key trade-offs**: ColPali gives excellent recall on visual content but stores ~1024 vectors per page, so for 100k documents (500k pages), that is ~500M vectors. I would use binary quantization to reduce storage by 32x, accepting a small recall hit. For the text path, BM25 + dense hybrid search handles financial terminology well.

### Q: How would you handle a query that requires information from BOTH a chart and a table on different pages?

**Strong answer:**

This is the cross-modal, cross-page retrieval problem. The solution has three parts:

1. **Retrieval diversity**: Ensure the retriever returns results from multiple modalities. Set minimum quotas -- at least 2 text results, 2 table results, and 1 visual result in every retrieval set, regardless of which modality scores highest.

2. **Context assembly**: When assembling the VLM prompt, include all retrieved content with explicit provenance: "[Table from page 14: Q3 Revenue by Region]" and "[Chart from page 22: Revenue Trend 2024-2026]". The VLM can then reason across both.

3. **Agentic fallback**: If the initial retrieval does not surface enough cross-modal context, an agentic layer can issue follow-up retrievals: "The table shows revenue numbers but the user asked about trends -- let me also search for charts related to revenue."

The key insight is that cross-modal questions are inherently multi-hop. The system needs to retrieve from one modality, recognize the gap, and retrieve from another.

---

## References

- Faysse et al. "ColPali: Efficient Document Retrieval with Vision Language Models" (ICLR 2025)
- Google. "SigLIP 2: Multilingual Vision-Language Encoders" (2025)
- NVIDIA. "An Easy Introduction to Multimodal Retrieval-Augmented Generation" (2025)
- HKUDS. "RAG-Anything: All-in-One Multimodal RAG Framework" (2025)
- Vespa Blog. "PDF Retrieval with Vision Language Models" (2024)

---

*Previous: [Advanced Retrieval Patterns](09-advanced-retrieval-patterns.md) | Next: [RAG Evaluation Patterns](13-rag-evaluation-patterns.md)*
