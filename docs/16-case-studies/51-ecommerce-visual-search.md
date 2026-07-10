# Case Study: E-commerce Visual Search and Multimodal Product Discovery

A large marketplace with 80M products lets shoppers search by photo: snap a couch, dress, or sneaker and get visually similar in-stock items, shop the look from a lifestyle photo, and run text-plus-image queries like "this jacket but in green." At hundreds of millions of image embeddings and thousands of visual queries per second, the single hardest constraint is matching on visual similarity at massive scale with single-digit-millisecond ANN latency while keeping results commercially relevant (in stock, right category, not just pixel-similar) and the catalog fresh as inventory churns. Unlike the behavioral recommender in [11-recommendation-engine.md](11-recommendation-engine.md), the signal here is the image, not the click log.

## The Business Problem

Visual search matters most where words fail the shopper. Someone sees a couch at a friend's place, a dress on the street, or a sneaker in a photo, and cannot name the brand, the silhouette, or the exact color, but they can take a picture. The product has to turn that picture into a short row of buyable, in-stock look-alikes fast enough that it feels like search, not a science project. On top of single-item lookup sit two harder modes: shop the look, where a lifestyle photo contains a sofa and a rug and a lamp and the shopper wants all of them, and composed queries, where the shopper hands over an image plus a text edit ("this but cheaper," "in green," "more formal").

The naive build fails on three axes at once. First, off-the-shelf CLIP and SigLIP are trained on web alt-text: they nail coarse semantics ("a red dress") but miss the fine-grained attributes commerce is made of (midi versus maxi, ribbed versus cable knit, matte versus gloss finish), so generic embeddings return plausible-looking wrong products. Second, pure nearest-neighbor retrieval is not commercial relevance: the pixel-closest item is routinely out of stock, a different category (a phone case that looks like the handbag you photographed), or a low-margin drop-ship listing. Third, an 80M catalog churns every minute (new arrivals, sellouts, restocks, price and image changes), so an index built last night is already lying to shoppers.

So the team builds a content-retrieval system, not a recommender. A domain-fine-tuned multimodal encoder projects images and text into one shared space; a real vector engine holds hundreds of millions of quantized, sharded vectors and answers filtered ANN queries in single-digit milliseconds; a business-aware re-ranker blends visual similarity with availability, margin, and popularity; an object detector segments lifestyle photos so each product gets its own search; and an event-driven ingestion pipeline keeps embeddings fresh as inventory turns over. The distinction from [11-recommendation-engine.md](11-recommendation-engine.md) is the whole point: that system ranks from behavior and cannot see a brand-new SKU, while this one sees a product the moment its image is indexed, which is exactly why freshness is a first-order constraint here.

Constraints from the June 2026 reality:

- 80M products with several images each, plus lifestyle shots and per-region crops, push the index past 300M vectors; the catalog churns constantly, so a static nightly index is stale by morning.
- Thousands of visual queries per second at peak; the ANN step must stay single-digit milliseconds and end-to-end p99 under about 200 ms, or shoppers bounce.
- Off-the-shelf CLIP/SigLIP is trained on captions, not products: it confuses a midi with a maxi, misses knit patterns, and has no notion of in-stock versus discontinued.
- Frontier VLM APIs (Gemini 3.1 Pro, Claude Opus 4.8 vision) are too slow and too expensive to call on the per-query hot path at this QPS, so the query encoder must be self-hosted and cheap.
- Visual nearest neighbor is not commercial relevance: the closest match is often unavailable, off-category, or low-margin, so a business-aware re-rank is mandatory, not optional polish.
- A brand-new SKU has zero engagement, so behavioral recs cannot surface it, but its image embeds on day one; visual search is the cold-start discovery path, which raises the bar on freshness.
- Memory math forces the design: 300M 768-dim fp32 vectors are roughly 900 GB before graph overhead, so quantization and sharding are prerequisites, not tuning knobs.

## Architecture

```mermaid
flowchart TB
    subgraph Offline["Offline Indexing and Freshness"]
        CAT[(Product Catalog 80M items)] --> IMGS[Product and Lifestyle Images]
        IMGS --> DET[Detect and Crop Products]
        DET --> ENCB[Batch Encoder fine-tuned SigLIP]
        ENCB --> QUANT[Quantize OPQ and PQ]
        QUANT --> BUILD[Build and Upsert]
        BUILD --> VDB[(ANN Index sharded)]
        FEED[Inventory and Price Feed] --> META[(Metadata Store stock category margin popularity)]
    end

    subgraph Online["Online Query Path"]
        Q[Query image or image plus text] --> QT{Query type}
        QT -->|single item| QENC[Query Encoder GPU]
        QT -->|lifestyle| QDET[Detect regions then encode]
        QT -->|image plus text| COMP[Compose Image plus Text Embedding]
        QENC --> ANN[Filtered ANN Search]
        QDET --> ANN
        COMP --> ANN
        VDB --> ANN
        ANN --> CAND[Candidate Set 200 to 500]
        CAND --> RR[Re-ranker visual plus business blend]
        META --> RR
        RR --> RES[Ranked In-Stock Results]
    end
```

### Components

| Layer | Tech | Purpose |
|-------|------|---------|
| Query encoder | Fine-tuned SigLIP 2 ViT, self-hosted on GPU | Encode the query image and text into the shared space |
| Embedding model | Domain-fine-tuned CLIP/SigLIP; Cohere Embed v4 or Voyage Multimodal as managed alt | One shared image-text vector space |
| Object detection | Grounding DINO plus SAM for open-vocab detect and segment | Find and crop products in lifestyle photos |
| ANN index | Vespa or Milvus, HNSW and IVF-PQ, sharded and replicated | Sub-10ms nearest neighbors over hundreds of millions of vectors |
| Quantization | OPQ plus PQ, full-precision rerank vectors on SSD | Fit the index in RAM without collapsing recall |
| Metadata store | Postgres or low-latency KV, streaming inventory feed | Stock, category, price, margin, popularity for filter and rerank |
| Re-ranker | LambdaMART or small neural ranker, or a Vespa ranking expression | Blend visual similarity with business signals |
| Composed query | Attribute parser plus embedding composition, Pic2Word-style | Resolve "this but in green" |
| Ingestion pipeline | Event-driven encoder, streaming upserts, tombstones | Keep embeddings fresh as the catalog churns |
| Eval and logging | Labeled match set, click and conversion logs | recall@k, category precision, online CTR and CVR |

### Data flow

1. A shopper uploads a photo; the app classifies the query type (single item, lifestyle, or image-plus-text) and, for lifestyle photos, runs detection first.
2. The self-hosted query encoder projects the image into the shared embedding space; for image-plus-text, the text modifier is fused into the query or turned into attribute filters.
3. The search layer issues a filtered ANN query: nearest neighbors constrained at traversal time to in-stock and, where known, the right category, so the candidate set is already commercially valid.
4. The index returns 200 to 500 candidates with approximate distances; full-precision vectors for those candidates are fetched from SSD for exact re-scoring.
5. The metadata store supplies availability, price, margin, popularity, and seller quality for each candidate.
6. The re-ranker blends exact visual similarity with the business features into a final score, learned from click and conversion logs.
7. Results are returned as ranked in-stock products, or, for shop the look, as tapable pins grouped by detected region.
8. The interaction (impression, click, add-to-cart, purchase) is logged and feeds both the re-ranker training set and the relevance eval.

### A worked example: the mid-century couch

The design is easiest to see on one query walked end to end, then the shop-the-look and composed variants of the same photo.

**Single item.** A shopper photographs a mid-century couch (walnut legs, tufted olive upholstery, three seats) at a friend's place. The self-hosted fine-tuned SigLIP 2 encoder projects the crop into the shared 768-dim space in about 12 ms on an L4. A filtered ANN query over the seating shard (roughly 812,000 in-stock sofa vectors after the category and availability filter, drawn from the 80M-item catalog) returns the visually nearest 200 in 6 ms. Pure pixel order puts an out-of-stock near-identical sofa first (`SKU-7731`, visual similarity 0.94) and a look-alike loveseat second (`SKU-4402`, 0.93), and neither should win. `SKU-7731` sold out four minutes ago and slipped past the index filter on a slightly stale snapshot, so the re-rank availability backstop multiplies its score to near zero (final 0.04) and it drops off the page. `SKU-4402` is a two-seat loveseat, a different `product_type` than the query's inferred sofa, so the attribute gate filters it out entirely. The winner is `SKU-2185` (visual similarity 0.89, a genuine three-seat mid-century sofa, in stock, high margin, and popular), which the business blend lifts to final 0.89. Notice `SKU-6390` is actually more pixel-similar at 0.91, but its low margin and low conversion rate pull it to final 0.80, below the slightly-less-similar `SKU-2185`. The pixel-closest item was fourth by raw similarity and first by commercial relevance.

**Shop the look.** The same shopper then uploads a full living-room photo. Grounding DINO plus SAM detect and segment three product regions with usable confidence (couch 0.92, floor lamp 0.88, rug 0.71) and one weak region (a wall frame at 0.34) that is dropped below the confidence gate. Each kept crop runs its own filtered ANN and re-rank in parallel, returning three tapable pin groups: the couch region resurfaces `SKU-2185`, and the lamp and rug regions return their own in-stock matches. If any region comes back empty, the system falls back to whole-image search for that pin rather than showing nothing.

**Composed query.** The shopper then types "same style in forest green." The text parser lifts `color=green` into a hard facet filter and keeps the visual query on shape and style, so the ANN re-runs constrained to green upholstery over the same mid-century neighbors, and the facet-first path returns green three-seat sofas without the color drift that raw image-plus-text vector arithmetic would introduce.

### The result record

The search layer emits a schema-validated result record, not a bare ranked list. Every field the re-rank trusts is a verified signal (stock, `product_type`, margin), so an out-of-stock or wrong-type candidate is demoted deterministically, not on the strength of how similar it looks.

```json
{
  "query_image_id": "vq-2026-07-11-3f9a17",
  "query_type": "single_item",
  "inferred": {"product_type": "sofa", "style": "mid_century", "primary_color": "olive", "seat_count": 3},
  "ann": {"shard": "seating_hnsw_pq", "searched": 812000, "candidates_returned": 200, "latency_ms": 6},
  "weights": {"visual_sim": 0.55, "category_match": 0.15, "margin": 0.12, "popularity": 0.10, "seller_quality": 0.08},
  "candidates": [
    {"sku": "SKU-2185", "visual_sim": 0.89, "in_stock": true, "product_type": "sofa", "margin": 0.85, "popularity": 0.75, "final_score": 0.89, "returned": true},
    {"sku": "SKU-6390", "visual_sim": 0.91, "in_stock": true, "product_type": "sofa", "margin": 0.35, "popularity": 0.40, "final_score": 0.80, "returned": true},
    {"sku": "SKU-5012", "visual_sim": 0.86, "in_stock": true, "product_type": "sofa", "margin": 0.45, "popularity": 0.50, "final_score": 0.79, "returned": true},
    {"sku": "SKU-4402", "visual_sim": 0.93, "in_stock": true, "product_type": "loveseat", "margin": 0.70, "popularity": 0.55, "final_score": 0.00, "returned": false, "filtered": "attribute_mismatch product_type"},
    {"sku": "SKU-7731", "visual_sim": 0.94, "in_stock": false, "product_type": "sofa", "margin": 0.60, "popularity": 0.70, "final_score": 0.04, "returned": false, "filtered": "out_of_stock"}
  ],
  "returned": ["SKU-2185", "SKU-6390", "SKU-5012"]
}
```

The record makes the demotion auditable: `SKU-7731` and `SKU-4402` carry the two highest `visual_sim` values yet both fall out of `returned`, one on availability and one on a hard attribute gate, while `SKU-6390` stays but ranks below a less-similar rival on business signals. Worked through the weights, `SKU-2185` scores 0.55 times 0.89 plus 0.15 for the category match plus 0.12 times 0.85 plus 0.10 times 0.75 plus 0.08 times 0.92, which lands at 0.89, while `SKU-6390` runs the same formula on a higher 0.91 visual but a 0.35 margin and 0.40 popularity and lands at 0.80, so the slightly-less-similar item wins on economics, not on pixels.

Shop the look emits one record per detected region, and the weak wall-frame detection never becomes a pin:

```json
{
  "query_image_id": "vq-2026-07-11-7c22b0",
  "query_type": "shop_the_look",
  "regions": [
    {"label": "couch", "detect_conf": 0.92, "top_sku": "SKU-2185", "visual_sim": 0.88, "returned": true},
    {"label": "floor_lamp", "detect_conf": 0.88, "top_sku": "SKU-3310", "visual_sim": 0.83, "returned": true},
    {"label": "rug", "detect_conf": 0.71, "top_sku": "SKU-9184", "visual_sim": 0.79, "returned": true},
    {"label": "wall_frame", "detect_conf": 0.34, "top_sku": null, "returned": false, "dropped": "below_detect_gate"}
  ],
  "returned": ["SKU-2185", "SKU-3310", "SKU-9184"]
}
```

## Key Design Decisions

### 1. A fine-tuned shared image-text embedding space

Off-the-shelf CLIP and SigLIP are strong at coarse semantics and weak on the attributes commerce lives on: sleeve length, neckline, heel type, wood finish, knit pattern. The fix is to fine-tune a SigLIP 2-class encoder on the catalog itself, using product titles, structured attributes, and category as the text side and hard-negative mining (a maxi dress as a negative for a midi) so the space actually separates look-alikes that matter to shoppers. One shared space is the whole point: image queries, text queries, and product images all land in the same index, so a photo and the phrase "ribbed green cardigan" retrieve from a single store. Managed multimodal embeddings (Cohere Embed v4, Voyage Multimodal 3.5, Gemini Embedding) are a fast start, but at this QPS a self-hosted fine-tuned encoder wins on both cost and domain precision. Concretely, the encoder is a SigLIP 2 ViT-L/16 emitting 768-dim vectors, fine-tuned with a sigmoid contrastive objective and hard-negative mining where a look-alike loveseat is mined as a negative for a sofa query (the `SKU-4402` case in the worked example), which is where generic off-the-shelf SigLIP sits well below the recall SLO on the fine-grained match set ([Marqo GCL](https://arxiv.org/abs/2404.08535)). See [Embedding Models](../06-retrieval-systems/03-embedding-models.md) and [Multi-Modal RAG](../06-retrieval-systems/12-multimodal-rag.md).

### 2. ANN at scale: quantization, sharding, and the recall-latency-cost triangle

Hundreds of millions of vectors will not sit in RAM uncompressed: 300M 768-dim fp32 vectors are roughly 900 GB before the HNSW graph overhead. So the index compresses vectors to tens of bytes with OPQ plus product quantization, sharded across nodes and replicated for QPS, using HNSW or IVF-PQ as the graph and inverted structure ([HNSW](https://arxiv.org/abs/1603.09320), [FAISS](https://github.com/facebookresearch/faiss)). Concretely, OPQ plus PQ compresses each 768-dim fp32 vector (3072 bytes) to a PQ code of roughly 64 bytes, about a 48x reduction that takes the 300M-vector footprint from around 900 GB to under 20 GB of codes, small enough to shard across a handful of RAM nodes while the full-precision vectors sit on SSD for the exact re-rank. Quantization trades recall for memory, so the pattern is coarse-search-then-exact-rerank: ANN over compressed codes returns a few hundred candidates in single-digit milliseconds, then those candidates are re-scored against full-precision vectors on SSD. A real engine does the heavy lifting; Vespa and Milvus both scale here, and the choice turns on whether you want business ranking in the same query (Decision 3). See [Vector Databases](../06-retrieval-systems/04-vector-databases.md).

### 3. Visual similarity is not commercial relevance

The core mistake is shipping raw nearest-neighbor results. The pixel-closest item is frequently the wrong answer: out of stock, a different category, or a low-margin listing that hurts the marketplace. Commercial relevance is a re-ranking problem: over the ANN candidate set, a learned ranker (LambdaMART or a small neural model) blends visual similarity with availability, category match, price fit, margin, popularity, and seller quality, trained on click and conversion logs. This is why Vespa is attractive: it expresses the ANN closeness and the business features in one server-side ranking expression, so filtering and blending happen without a second hop. This layer, not the encoder, is what turns "looks similar" into "worth showing." The blend is a learned ranker (LambdaMART or a small neural model), but its feature weights are legible, and in the worked example they are exactly what demote the pixel-closest `SKU-7731` and `SKU-6390` below `SKU-2185`:

| Signal | Weight or effect | What it does |
|--------|------------------|--------------|
| Visual similarity (exact full-precision cosine) | 0.55 | Base relevance, the reason the item surfaced at all |
| Category and attribute match (`product_type`, `seat_count`, `material`) | 0.15, hard demote on `product_type` mismatch | Keeps a loveseat out of a sofa query, graded for soft attributes |
| In-stock availability | hard gate at ANN, multiply toward zero as re-rank backstop | An unbuyable result is worse than no result |
| Margin | 0.12 | Tilt ties toward marketplace economics, never overrides relevance |
| Popularity and conversion rate | 0.10 | Favor proven sellers, a soft prior offset by long-tail exploration |
| Seller quality and rating | 0.08 | Suppress low-quality or low-trust listings |
| Price fit to query context | tie-breaker | Nudge toward the shopper's implied price band |

The five scored weights sum to 1.0; availability is a gate, not a weight, and price fit only breaks ties. See [Reranking Strategies](../06-retrieval-systems/06-reranking-strategies.md); contrast the behavioral collaborative ranking in [11-recommendation-engine.md](11-recommendation-engine.md).

### 4. Filter in the index, not after it

In-stock and category constraints have to be applied during ANN traversal, not as a post-filter on the top-k. Post-filtering is a trap at this scale: if 40 percent of the catalog is out of stock, a naive top-100 can leave a handful of showable items, or none. Modern vector engines support filtered ANN (constrained HNSW traversal, IVF list pruning) so availability and category are honored while the graph is walked. The metadata that drives the filter (stock, category, price) lives in a low-latency store updated by the same inventory feed that drives freshness, so a sold-out item stops appearing within minutes, not on the next full rebuild. Filtering in the index is the first line of defense, not the only one: the metadata snapshot the traversal reads can lag reality by seconds, so a just-sold-out item (`SKU-7731` in the worked example, whose stock flipped four minutes before the query) can still enter the candidate set, where the re-rank availability backstop multiplies its score toward zero as the second line.

### 5. Shop the look: detect, then search each region

A lifestyle photo contains a sofa, a rug, a lamp, and a coffee table, and the shopper wants all of them. So shop the look is a two-stage path: an open-vocabulary detector (Grounding DINO) plus segmentation (SAM) finds and crops each product region, and each crop runs its own filtered ANN search, returning tapable pins per region ([Grounding DINO](https://arxiv.org/abs/2303.05499), [SAM](https://arxiv.org/abs/2304.02643)). This is the pattern Pinterest productized as Lens and Complete the Look ([unified embeddings](https://arxiv.org/abs/1908.01707), [Complete the Look](https://arxiv.org/abs/1812.01748)). Detection confidence gates the regions: a low-confidence box is dropped rather than shown as a bad match, and if detection finds nothing usable the system falls back to whole-image search. Concretely, in the worked example the detector keeps the couch (confidence 0.92), the floor lamp (0.88), and the rug (0.71) while dropping a wall frame at 0.34 below the gate, then searches the three kept crops in parallel.

### 6. Combined text-plus-image queries

"This jacket but in green" is a composed query, and there are two ways to serve it, used together. For well-defined attributes (color, size, price band, brand), the reliable move is to parse the text into structured facets and apply them as filters over visual similarity on shape and style, because a color facet is exact where embedding math is fuzzy. For open-ended style edits ("more formal," "vintage vibe"), a composed-image-retrieval model fuses the image and text into one query embedding ([Pic2Word](https://arxiv.org/abs/2302.03084)). Crude embedding arithmetic (image vector plus a text delta) works in a pinch but drifts off intent, so the production default is facet-filter-first, compose-for-the-rest.

### 7. Catalog freshness: incremental embedding and index updates

80M products churn constantly, and re-embedding and rebuilding nightly is too slow: a new SKU that is invisible for a day is lost GMV. So freshness is event-driven. A catalog change publishes an event, the new or changed image is encoded and upserted into the index within minutes, removed items get a tombstone so they drop out immediately, and pure availability flips are handled by the metadata filter with no re-encoding at all. HNSW degrades under heavy delete churn and IVF centroids drift over time, so a periodic full rebuild restores graph quality underneath the streaming layer. This is the ingestion discipline of [31-rag-data-ingestion-pipeline.md](31-rag-data-ingestion-pipeline.md) applied to image vectors instead of documents.

### 8. Cold-start and the long tail: where content retrieval wins and still struggles

This is the honest advantage over behavioral recommendation. A brand-new product has zero clicks, so the collaborative recommender in [11-recommendation-engine.md](11-recommendation-engine.md) cannot rank it, but its image embeds the moment it is listed, so visual search surfaces it on day one; that is exactly why freshness matters so much here. The long tail is harder in the other direction: rare items sit in sparse regions of the index where ANN recall drops, and a popularity-weighted re-ranker quietly buries them (rich get richer). The mitigation is diversity and exploration in the re-rank and treating popularity as a soft prior, not a hard gate, so the tail stays discoverable.

### 9. When visual search is the wrong tool

Visual search is a discovery entry point for visually-driven categories (fashion, furniture, decor), not a universal search replacement, and pretending otherwise degrades the experience. For commodity and spec-driven items (a named SKU, a laptop chosen by RAM, an iPhone charger), keyword and text search win outright because the shopper knows the exact term and pixels only add noise. For logged-in shoppers with rich history, behavioral recommendation often out-converts visual similarity because it captures taste and cross-category affinity that appearance cannot. And visual search underdelivers on intent mismatch: a photo of a couch might mean "this exact couch cheaper" (a product-match problem) or "things that go with this couch" (a recommendation problem), neither of which is nearest-neighbor similarity. The right posture is to route by category and query type and let text search and recs carry what they carry better. See [Hybrid Search](../06-retrieval-systems/05-hybrid-search.md).

## The Re-Rank Decision

Every ANN candidate passes the same deterministic gates before the learned blend scores it, so an unbuyable or wrong-type item cannot win on visual similarity alone. This is the logic behind the worked example: availability and attribute gates fire first, then the weighted blend, then a diversity pass that keeps the long tail discoverable.

```mermaid
flowchart TD
    C[ANN candidate from top 200] --> S{In stock now}
    S -->|no| DROP[Drop, availability backstop]
    S -->|yes| T{Product type matches query}
    T -->|no| DROP2[Drop, attribute mismatch]
    T -->|yes| SC[Blend 0.55 visual plus margin popularity seller]
    SC --> DIV[Diversity and long-tail exploration pass]
    DIV --> RANK[Sort by final score]
    RANK --> OUT[Return ranked in-stock results]
```

## Shop the Look Flow

```mermaid
flowchart TB
    LP[Lifestyle photo] --> ODET[Open-vocab detector Grounding DINO]
    ODET --> SEG[Segment regions SAM]
    SEG --> RCHK{Region confidence high}
    RCHK -->|no| DROP[Drop region]
    RCHK -->|yes| CROP[Crop per product]
    CROP --> ENC[Encode each region]
    ENC --> PAR[Parallel filtered ANN per region]
    PAR --> RRK[Re-rank each region by visual plus business]
    RRK --> ASSEM[Assemble shoppable pins sofa rug lamp table]
    ASSEM --> FB{Any region empty}
    FB -->|yes| WHOLE[Fallback whole-image search]
    FB -->|no| OUT[Return tapable product pins]
    WHOLE --> OUT
```

## Failure Modes and Mitigations

### F1: Out-of-stock or discontinued top results

The visual-closest item is unavailable, so the shopper taps into a dead end. Mitigation: in-stock filtering at ANN traversal time (Decision 4) plus an availability penalty in the re-rank, with the inventory feed flipping stock state within minutes.

### F2: Category drift, pixel-similar but commercially wrong

A lamp base retrieves for a handbag query, or a phone case for a shoe, because they share silhouette and color. Mitigation: a category classifier on the query, category-constrained retrieval, and category precision tracked as a gated metric so drift is caught before it ships.

### F3: Stale embeddings after catalog churn

New arrivals are missing and sold-out items still show because the index lags the catalog. Mitigation: event-driven incremental encode-and-upsert with tombstones (Decision 7), a freshness SLO on product-live-to-searchable lag, and periodic full rebuilds to restore graph quality.

### F4: Off-the-shelf encoder misses fine-grained attributes

A generic CLIP returns the right shape but the wrong pattern, sleeve, or material, which reads to shoppers as a broken search. Mitigation: domain fine-tuning with hard-negative mining on attributes (Decision 1), evaluated on a labeled fine-grained match set, not just coarse category.

### F5: Recall collapse under aggressive quantization

Over-compressed PQ codes drop the true match out of the candidate set entirely. Mitigation: coarse-search-then-exact-rerank against full-precision vectors, PQ parameters tuned against measured recall@k versus an exact baseline, and recall monitored as an index-health SLO separate from relevance.

### F6: Query-encoder GPU cost and latency spike at peak

A traffic surge on a viral item or a sale overloads the encoder fleet and p99 latency blows the budget. Mitigation: request batching on the encoder, a distilled smaller query model, autoscaling on the GPU fleet, and an embedding cache for popular or near-duplicate query images. See [Cost Optimization Playbook](../04-inference-optimization/07-cost-optimization-playbook.md).

### F7: Shop-the-look mis-detection

The detector segments a background object as a product or misses an item the shopper wanted. Mitigation: confidence-thresholded detection that drops weak regions, a whole-image fallback when nothing usable is found (Decision 5), and a human-labeled detection eval set.

### F8: Off-catalog or adversarial query images

The shopper photographs something the marketplace does not sell (a competitor SKU, a person, a meme), and the index returns a forced, irrelevant nearest neighbor. Mitigation: a low-similarity threshold that returns "no strong visual match" and falls back to text search, rather than showing a confidently wrong result.

## Operational Considerations

### Monitoring

| SLO | Target |
|-----|--------|
| ANN search latency p99 | single-digit ms |
| End-to-end visual query p99 | under 200 ms |
| recall@10 vs exact search | over 0.95 |
| Category precision@10 | over 0.90 |
| In-stock rate of top-10 | over 0.98 |
| Product-live to searchable, p95 | under 10 minutes |
| Visual-result click-through and add-to-cart | no regression on release |
| Full index rebuild | under a few hours |

### Cost model

Estimates at hundreds of millions of vectors and thousands of QPS:

- ANN index cluster (RAM-heavy, sharded and replicated, quantized): the dominant fixed cost, roughly tens of thousands of dollars a month.
- Query-encoder GPU fleet (L4/A10-class, autoscaled to thousands of QPS): a real monthly line, low tens of thousands.
- Initial catalog backfill: encoding hundreds of millions of images is a large one-time batch GPU spend; steady-state incremental re-embedding is a small fraction of it.
- Object detection for shop the look: GPU inference only on lifestyle queries, a smaller line that scales with that traffic slice.
- Re-ranker: a gradient-boosted or small neural model over a few hundred candidates, cheap relative to encode and index.
- Metadata store and streaming updates: modest, but the inventory feed must be reliable because it drives both filtering and freshness.

### On-call playbook

- ANN latency p99 breach: check shard hotspotting and replica health, shed load to a cached-result path for popular queries, and scale replicas before touching recall parameters.
- Freshness lag alarm: inspect the ingestion event backlog, confirm upserts and tombstones are draining, and trigger a targeted re-index of the affected catalog slice.
- Relevance drop in CTR or category precision: freeze re-ranker and encoder versions, diff against the last good release, and roll back; both go through shadow eval before traffic.
- Encoder fleet saturation: raise batching, autoscale GPUs, and serve popular query images from the embedding cache; if still saturated, degrade gracefully to text search.
- Index rebuild overrunning: run the rebuild on a replica and hot-swap, never rebuild a serving shard in place.

## What Strong Interview Candidates Cover

- They separate the two hard problems: a fine-tuned shared image-text embedding space for recall, and a business-aware re-rank for commercial relevance, and they insist raw nearest-neighbor is not shippable.
- They know off-the-shelf CLIP/SigLIP is weak on fine-grained product attributes and reach for domain fine-tuning with hard-negative mining, not a bigger generic model.
- They do the memory math (hundreds of millions of vectors do not fit uncompressed) and design coarse-quantized-search-then-exact-rerank with sharding, naming the recall-latency-cost triangle.
- They filter in the index for in-stock and category rather than post-filtering the top-k, and can explain why post-filtering collapses at high out-of-stock rates.
- They treat shop the look as detect-then-search-per-region with a whole-image fallback, and composed queries as facet-filter-first with embedding composition for fuzzy edits.
- They make freshness event-driven with incremental upserts, tombstones, and periodic rebuilds, and connect it to cold-start: visual search is the one path that surfaces a zero-engagement new SKU.
- They say plainly where visual search loses to keyword search and behavioral recs (commodity and spec items, logged-in taste, intent mismatch) and route by category and query type instead of over-claiming.

## References

- Radford et al., [Learning Transferable Visual Models From Natural Language Supervision (CLIP)](https://arxiv.org/abs/2103.00020)
- Zhai et al., [Sigmoid Loss for Language Image Pre-Training (SigLIP)](https://arxiv.org/abs/2303.15343)
- Tschannen et al., [SigLIP 2: Multilingual Vision-Language Encoders](https://arxiv.org/abs/2502.14786)
- Malkov and Yashunin, [Efficient and Robust ANN Search using HNSW Graphs](https://arxiv.org/abs/1603.09320)
- Jegou et al., [Product Quantization for Nearest Neighbor Search](https://inria.hal.science/inria-00514462)
- Facebook Research, [FAISS: a library for efficient similarity search](https://github.com/facebookresearch/faiss)
- [Vespa: ANN search plus business ranking in one query](https://vespa.ai/)
- [Milvus: open-source vector database](https://github.com/milvus-io/milvus)
- Jing et al., [Visual Search at Pinterest](https://arxiv.org/abs/1505.07647)
- Zhai et al., [Learning a Unified Embedding for Visual Search at Pinterest (Lens)](https://arxiv.org/abs/1908.01707)
- Kang et al., [Complete the Look: Scene-based Complementary Product Recommendation](https://arxiv.org/abs/1812.01748)
- Yang et al., [Visual Search at eBay](https://arxiv.org/abs/1706.03154)
- Liu et al., [Grounding DINO: Open-Set Object Detection](https://arxiv.org/abs/2303.05499)
- Kirillov et al., [Segment Anything (SAM)](https://arxiv.org/abs/2304.02643)
- Saito et al., [Pic2Word: Zero-Shot Composed Image Retrieval](https://arxiv.org/abs/2302.03084)
- Zhu et al., [Generalized Contrastive Learning for Multi-Modal Retrieval and Ranking (Marqo GCL)](https://arxiv.org/abs/2404.08535)

Related chapters: [Embedding Models](../06-retrieval-systems/03-embedding-models.md), [Vector Databases](../06-retrieval-systems/04-vector-databases.md), [Reranking Strategies](../06-retrieval-systems/06-reranking-strategies.md), [Multi-Modal RAG](../06-retrieval-systems/12-multimodal-rag.md), [Case Study: Recommendation Engine](11-recommendation-engine.md)
