# Multimodal Generation

Generating images, video, and audio is a different engineering problem from understanding them. A generative-media product is an **asset-processing pipeline of long-running, non-deterministic, expensive jobs**, and most of the work is orchestrating that safely, proving provenance, and evaluating quality you cannot reproduce exactly. This chapter leads with those durable concerns and treats the specific models as a perishable snapshot. Every capability figure below is a reported or vendor claim unless tied to a primary source.

**Scoping (read first):** this topic is load-bearing for creative, media, marketing, game, and avatar products, and largely noise for backend services, data platforms, RAG, and text-only agents. The one piece that reaches *any* product touching user-uploaded or AI-generated media is **provenance and safety**, because the legal obligations attach to generating or distributing synthetic media, not to your domain. If your system never emits a pixel or a waveform, only that section applies.

## Table of Contents

- [Production Pipeline Patterns](#production-pipeline-patterns)
- [Provenance and Safety](#provenance-and-safety)
- [Evaluating Generative Quality](#evaluating-generative-quality)
- [The Model Landscape](#the-model-landscape)
- [Interview Questions](#interview-questions)
- [References](#references)

---

## Production Pipeline Patterns

This is the part that outlives any model.

**Chaining is a DAG, not one call.** The canonical creative pipeline is a graph of stages, often each a different model from a different vendor: `prompt -> image (keyframes/style) -> image-to-video -> lip-sync -> voice/TTS -> music/SFX -> mux`. The durable lesson is **separation of concerns at the stage boundary**, so any stage is swappable, the same cascaded-versus-monolithic tradeoff the [voice agents](../18-voice-and-audio-agents/01-realtime-voice-agents.md) chapter draws. Node-graph tools (ComfyUI) codify this for images and video; treat the workflow graph as versioned code, not UI state.

**Async, queue, and long-job handling is mandatory.** Image generation is seconds; **video generation is tens of seconds to minutes per clip**, so no synchronous request survives it. The universal pattern: submit returns a job ID immediately, work runs on a GPU worker pool, and the client learns completion via a webhook callback (with a polling fallback, because webhooks get dropped). Verify webhook signatures, and **autoscale on queue depth**, not CPU. Because a single video job costs real money and minutes, attach an idempotency key per logical request so a client retry or a redelivered webhook does not pay twice.

**Cost and latency control**, in rough order of leverage: cache on the full request fingerprint (prompt plus all parameters plus seed plus model version) so identical requests never re-bill; draft cheaply (low resolution, few steps, a small fast model) and re-render only approved drafts at full quality, the single biggest saver in video; batch where supported; pick the tier deliberately (turbo and distilled variants trade quality for large latency and cost wins); and keep warm worker pools, because loading a multi-gigabyte checkpoint can take tens of seconds.

**Asset and prompt management.** Treat prompts, negative prompts, seeds, model and version, and all conditioning inputs (control maps, reference images, adapter IDs and weights) as a structured, versioned record stored with every output. You cannot reproduce or debug a generation without the full parameter set, and providers silently change models behind a stable name. This manifest doubles as your provenance log.

**Seeds and reproducibility, the hard truth.** A seed makes a *local, pinned* run reproducible, but reproducibility degrades the moment you cross hardware or batch boundaries and is effectively absent on hosted APIs. The root causes are general, not generative-specific: floating-point arithmetic is non-associative, so different GPU kernels accumulate in different orders; batch size changes the kernel strategy (the most common source of numerical noise); and some GPU operations are nondeterministic unless explicitly forced. Practical stance: self-hosted with pinned hardware, fixed batch, fixed library versions, and a seed gives near-reproducible images; any hosted API, and especially video, should be treated as non-reproducible, so design QA around perceptual similarity, not exact match.

---

## Provenance and Safety

The technology churns; the obligation to label and the inability to perfectly enforce it are durable. Two complementary layers, **and both are removable.**

**C2PA / Content Credentials** is an open standard that cryptographically binds provenance to an asset (a "nutrition label for media"). A manifest holds assertions about creation and edits, a signed claim, and references to source assets, with **hard bindings** (cryptographic hashes of the bytes, tamper-evident) and **soft bindings** (fingerprints or watermarks that survive re-encoding). "Durable Content Credentials" recover a stripped manifest by looking up a surviving watermark or content fingerprint in an external repository, which exists precisely because manifests get separated from assets by re-encoding and screenshots. Adoption is real and growing: major image and video generators now attach C2PA metadata and watermarks, some camera makers sign photos at capture, and platforms read credentials to apply AI labels. A cautionary example to teach: one camera maker added then suspended C2PA after a signing-key vulnerability, because the trust model is only as good as key custody.

**Watermarking (SynthID-style)** adds an imperceptible signal to generated media. The durable caveat for engineers: **invisible watermarks are not robust against a motivated adversary.** Peer-reviewed work shows a regeneration attack (add noise, denoise with a diffusion model) provably removes invisible image watermarks below a perturbation threshold while preserving quality, and text watermarks are degraded by paraphrase and back-translation. Watermarks deter casual misuse and enable platform labeling; they do not stop adversaries. Layer C2PA signed provenance, a watermark that survives metadata stripping, and classifier-based detection, and assume each can be defeated alone.

**Safety filters** apply input moderation (block disallowed prompts) and output moderation (NSFW and identity classifiers) before returning an asset. The high-severity classes are non-consensual intimate imagery, deepfakes of real people, voice cloning without consent, and copyright or likeness infringement; mitigations include prompt and region blocklists, known-face rejection, consent-gated likeness, rate limiting, and abuse logging tied to the provenance manifest.

**The 2026 regulatory backdrop** (this is the part that reaches non-media products that merely host media): the EU AI Act's transparency article requires providers to mark generated output in a machine-readable way and deployers to disclose deepfakes, with obligations applying from August 2026 (see [AI Governance and Compliance](../13-reliability-and-safety/04-ai-governance-and-compliance.md)); the US TAKE IT DOWN Act (2025) targets non-consensual intimate imagery including AI deepfakes with platform takedown duties; and state likeness laws (the Tennessee ELVIS Act and many sexually-explicit-deepfake statutes) protect voice and likeness. Music and voice generation additionally carry unsettled copyright litigation, which makes a model's licensing and indemnity status a real procurement question.

---

## Evaluating Generative Quality

Two unavoidable facts: automated metrics are weak, and human preference is the real ground truth but expensive.

**Automated metrics and why they are unreliable.** FID, the long-standing image metric, contradicts human raters, mishandles distortions, and is biased and unstable at realistic sample sizes; CLIPScore measures text-image alignment but is gameable, and combining weak metrics does not make a strong one. FVD inherits FID's problems and is unstable at the small sample sizes typical of video. For audio, FAD is the FID analogue with the same caveats, and MOS (subjective 1-5) is ceiling-limited now that TTS approaches human quality. Use these as coarse signals, never as correctness.

**Human preference is the gold standard.** The field ranks image and video models with blind pairwise arenas scored by Elo or TrueSkill over many votes. Treat public arena standings as a coarse signal and validate on *your own* prompt distribution, the same discipline the [benchmarks](../14-evaluation-and-observability/03-benchmarks-and-leaderboards.md) chapter prescribes for LLMs.

**Regression testing for non-reproducible pipelines** is the durable practice, because providers silently update models behind stable names. Build a versioned golden prompt set covering your real use cases and failure modes; on hosted APIs drop exact match and compare *distributions* of metric scores; use perceptual similarity (perceptual hashing, SSIM, CLIP-embedding distance to a baseline) rather than equality; add a VLM-as-judge on a rubric (prompt adherence, artifacts, brand safety) for what hashes cannot see; track judge and metric distributions over time and alert on drift, which often means the upstream provider changed the model; and pin to dated model versions wherever the API allows. Gate releases on statistical significance, not raw deltas, and version prompts independently of models.

---

## The Model Landscape

Kept light and dated, because it churns monthly and much of the circulating spec-sheet detail comes from low-quality sources.

- **Image.** The open-weight frontier is led by the FLUX family (a recent release is a large rectified-flow transformer runnable on a single high-end consumer GPU with quantization, and notably needs no fine-tuning for character or style reference); the Stable Diffusion lineage remains the broad tooling base. The licensing gotcha to teach: open *weights* does not mean open *use*, since several variants (the `dev` line) are non-commercial and require a paid license for commercial work, while the distilled `schnell` variant is permissively licensed (Apache-2.0). Conditioning composes: ControlNet (structural control from pose, depth, edge, or segmentation maps), reference adapters (use an image as a prompt for style or likeness), inpainting and outpainting, and regional prompting; the production combo is an identity adapter plus structural control plus a text theme in one graph. LoRA is the default for style or subject personalization.
- **Video.** Proprietary API leaders (OpenAI's Sora 2, Google's Veo with native synchronized audio, plus strong contenders from ByteDance, Kuaishou, Runway, and others) sit above a fast-improving open-weight tier. A correction worth flagging, and a live example of how fast this section decays: OpenAI deprecated the Sora 2 / Videos API in March 2026 (with a reported shutdown later in 2026) and discontinued the consumer Sora app soon after, so verify a video model's status before building on it rather than trusting any snapshot, this chapter included. Billing is per second of output (broadly a few cents to under a dollar per second), generation takes tens of seconds to minutes, and outputs are non-reproducible, which forces async jobs, draft-then-render, and hard per-user cost caps.
- **Audio.** Voice and TTS (ElevenLabs is the reference, with cloning and dubbing) and music (Suno and Udio, at the center of ongoing copyright litigation and licensing settlements). Composition with video mirrors the voice chapter's split: native joint audio-video gives the best synchronization with the least control, while a cascaded approach (generate silent video, then add TTS and music and lip-sync separately) gives independent control and dubbing at the cost of effort, which is why most production dubbing pipelines stay cascaded.

---

## Interview Questions

### Q: Design the backbone of a service that turns a script into a narrated, music-backed video. What are the hard parts?

**Strong answer:**
The backbone is an asynchronous DAG of stages, each a swappable model: prompt to keyframe images, image-to-video for motion, TTS for narration, a music model for score, and lip-sync to bind voice to video, then a mux step. Because video generation takes tens of seconds to minutes, every stage is a job: submit returns an ID, work runs on an autoscaling GPU worker pool scaled on queue depth, and completion fires a webhook with a polling fallback. The hard parts are cost and reliability. Cost: cache on the full request fingerprint, draft cheaply and only re-render approved drafts at full quality, and cap per-user spend, since each retry costs real money. Reliability: attach idempotency keys so a retried or redelivered job does not pay twice, and store a full manifest of prompt, seed, parameters, and model versions per asset, both for debugging and as the provenance record. I would also gate generation with input and output moderation and attach C2PA credentials, because the synthetic-media obligations apply regardless of my domain.

### Q: How do you regression-test a generative pipeline when outputs are not reproducible?

**Strong answer:**
You give up exact match and test perceptually and statistically. I keep a versioned golden prompt set covering real use cases and known failure modes, and run it on every change. Where reproducibility holds, self-hosted with pinned hardware and seeds, I can use seed-locked checks; on hosted APIs I assume non-reproducibility, so I compare distributions of metric scores rather than single outputs and use perceptual similarity, perceptual hashes, SSIM, and CLIP-embedding distance to a baseline, plus a VLM-as-judge on a rubric for prompt adherence and artifacts. I track those distributions over time and alert on drift, because a sudden shift usually means the provider silently updated the model behind a stable name, so I also pin to dated model versions when the API allows. Releases gate on statistical significance, not raw deltas, and I version prompts independently of models so I can attribute a regression to the right change.

---

## References

- [C2PA specification](https://spec.c2pa.org/) (Content Credentials)
- "Invisible Image Watermarks Are Provably Removable Using Generative AI" (NeurIPS 2024, arXiv:2306.01953)
- Google DeepMind, [SynthID](https://deepmind.google/science/synthid/)
- "Rethinking FID: Towards a Better Evaluation Metric for Image Generation" (CVPR 2024) arXiv:2401.09603
- Black Forest Labs, [FLUX](https://bfl.ai/) and its [licensing](https://bfl.ai/licensing)
- EU AI Act [Article 50](https://artificialintelligenceact.eu/article/50/) (transparency for generated content)

---

*Previous: [Real-Time Voice Agents](../18-voice-and-audio-agents/01-realtime-voice-agents.md)*
