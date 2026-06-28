# 🎓 推薦 AI 課程與學習路徑

一份精選的**可靠、可信賴且即時更新**線上課程清單，適合 AI 工程師、ML 從業者與產品團隊。此處每一門課程都已於 **2026 年 5 月**驗證過，沒有灌水內容，也沒有過時的 MOOC。

> **關於程式碼過時的提醒：**這些課程是為了它們的*概念*而精選的。課程使用的框架 API（LlamaIndex、LangChain）汰換得很快，所以任何錄製課程中的 notebook 程式碼都會逐漸過時，在全新安裝的環境上可能會失敗。在複製貼上之前，請先執行 [駕馭框架汰換](09-frameworks-and-tools/12-navigating-framework-churn.md) 中那個 30 秒的時效性檢查，並學習基本原語，而不是 import 路徑。

---

## 目錄

- [基礎：LLM 與 Transformer](#foundation)
- [RAG 管線](#rag)
- [代理式 AI 與多代理系統](#agents)
- [上下文與記憶管理](#context-memory)
- [AI 評估與可觀測性](#evals)
- [提示工程與上下文工程](#prompting)
- [微調與調適](#finetuning)
- [推論優化與 MLOps](#mlops)
- [AI 安全與防護機制](#safety)
- [程式撰寫代理與開發者 AI 工具](#coding-agents)
- [給 PM 與非工程師](#pm-track)
- [YouTube 頻道與免費內容](#free)
- [學習路徑建議](#paths)

---

## 基礎：LLM 與 Transformer <a name="foundation"></a>

| 課程 | 提供者 | 費用 | 為何值得信賴 |
|--------|----------|------|-----------------|
| **[Neural Networks: Zero to Hero](https://www.youtube.com/playlist?list=PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ)** | Andrej Karpathy（YouTube） | 免費 | 由 OpenAI/Tesla 傳奇人物親自打造、權威性的從零開始系列。從頭建構出 GPT。 |
| **[CS324: Large Language Models](https://stanford-cs324.github.io/winter2022/)** | Stanford | 免費 | 史丹佛水準的講義，涵蓋 LLM 基礎、scaling laws、對齊。 |
| **[Generative AI with LLMs](https://www.coursera.org/learn/generative-ai-with-llms)** | DeepLearning.AI + AWS（Coursera） | 約 $50 | 動手實作的 LLM 入門，涵蓋訓練、微調、RLHF。由 Andrew Ng 的團隊製作。 |
| **[Practical Deep Learning for Coders](https://course.fast.ai/)** | fast.ai | 免費 | 由下而上、程式碼優先的方法。最適合透過實作來學習的工程師。 |

---

## RAG 管線 <a name="rag"></a>

| 課程 | 提供者 | 費用 | 為何值得信賴 |
|--------|----------|------|-----------------|
| **[Building and Evaluating Advanced RAG](https://www.deeplearning.ai/short-courses/building-evaluating-advanced-rag/)** | DeepLearning.AI + LlamaIndex | 免費 | 涵蓋 sentence-window 檢索、auto-merging、用 TruLens 做 RAG 評估。 |
| **[Vector Databases: from Embeddings to Applications](https://www.deeplearning.ai/short-courses/vector-databases-embeddings-applications/)** | DeepLearning.AI + Weaviate | 免費 | 實用地走過嵌入、向量資料庫與混合搜尋。 |
| **[Building RAG Agents with LLMs](https://courses.nvidia.com/courses/course-v1:DLI+S-FX-15+V1/)** | NVIDIA Deep Learning Institute | 免費 | 採用 NVIDIA NIM 的企業級 RAG。涵蓋分塊、重排序、評估。 |
| **[LlamaIndex — Documentation: Learning](https://docs.llamaindex.ai/en/stable/understanding/)** | LlamaIndex | 免費 | 官方 LlamaIndex 學習路徑，最適合深入精通 RAG 管線。 |
| **[RAG Fundamentals (Haystack)](https://haystack.deepset.ai/tutorials)** | deepset / Haystack | 免費 | 使用 Haystack 框架、以管線為基礎的 RAG 動手教學。 |

---

## 代理式 AI 與多代理系統 <a name="agents"></a>

| 課程 | 提供者 | 費用 | 為何值得信賴 |
|--------|----------|------|-----------------|
| **[AI Agents in LangGraph](https://www.deeplearning.ai/short-courses/ai-agents-in-langgraph/)** | DeepLearning.AI + LangChain | 免費 | 由 LangGraph 的創作者親自講授。涵蓋 ReAct、持久化、human-in-the-loop、多代理。 |
| **[Multi AI Agent Systems with crewAI](https://www.deeplearning.ai/short-courses/multi-ai-agent-systems-with-crewai/)** | DeepLearning.AI + crewAI | 免費 | 官方 CrewAI 課程。涵蓋 Crews、Flows 與真實世界的商業自動化。 |
| **[Building Agentic RAG with LlamaIndex](https://www.deeplearning.ai/short-courses/building-agentic-rag-with-llamaindex/)** | DeepLearning.AI + LlamaIndex | 免費 | 路由、工具呼叫代理，以及多文件的代理式檢索。 |
| **[Functions, Tools and Agents with LangChain](https://www.deeplearning.ai/short-courses/functions-tools-agents-langchain/)** | DeepLearning.AI + LangChain | 免費 | 工具呼叫、OpenAI function calling、從頭開始建構。 |
| **[Developing AI Agents using AutoGen](https://www.deeplearning.ai/short-courses/ai-agentic-design-patterns-with-autogen/)** | DeepLearning.AI + Microsoft | 免費 | AutoGen 多代理模式。涵蓋辯論、工具使用與程式碼執行代理。 |
| **[CS294/194-196: LLM Agents (Berkeley)](https://rdi.berkeley.edu/llm-agents/f24)** | UC Berkeley | 免費 | 研究所層級的 LLM 代理課程。涵蓋記憶、規劃、安全、評估。 |

---

## 上下文與記憶管理 <a name="context-memory"></a>

| 課程 | 提供者 | 費用 | 為何值得信賴 |
|--------|----------|------|-----------------|
| **[Building Systems with the ChatGPT API](https://www.deeplearning.ai/short-courses/building-systems-with-chatgpt/)** | DeepLearning.AI + OpenAI | 免費 | 涵蓋多輪對話狀態、上下文管理、審核鏈。 |
| **[Prompt Engineering with Llama 2](https://www.deeplearning.ai/short-courses/prompt-engineering-with-llama-2/)** | DeepLearning.AI + Meta | 免費 | 展示 Llama 2 的上下文視窗取捨與系統提示管理。 |
| **[Reasoning with o1](https://www.deeplearning.ai/short-courses/reasoning-with-o1/)** | DeepLearning.AI + OpenAI | 免費 | 深入探討 o1 推理、預算 token、思考模式。可直接應用於 o3 與 Claude 3.7 Extended Thinking。 |
| **[Mem0 Documentation](https://docs.mem0.ai/)** | Mem0（官方） | 免費 | 在生產環境代理中實作多層記憶的權威參考資料。 |

---

## AI 評估與可觀測性 <a name="evals"></a>

| 課程 | 提供者 | 費用 | 為何值得信賴 |
|--------|----------|------|-----------------|
| **[Evals for AI: Maven Course](https://maven.com/hamel-shreya/evals-for-ai)** | Hamel Husain & Shreya Shankar（Maven） | 付費（約 $400） | AI 評估的業界黃金標準。在數十家公司的生產環境中採用。本儲存庫的評估指南就是以這門課程為基礎。 |
| **[Evaluating and Debugging Generative AI](https://www.deeplearning.ai/short-courses/evaluating-debugging-generative-ai/)** | DeepLearning.AI + W&B | 免費 | 涵蓋追蹤、用 W&B Weave 做評估，以及實驗追蹤。 |
| **[Quality and Safety for LLM Applications](https://www.deeplearning.ai/short-courses/quality-safety-llm-applications/)** | DeepLearning.AI + WhyLabs | 免費 | 涵蓋幻覺偵測、毒性、偏見評估與漂移監控。 |
| **[LangSmith Evaluation Tutorials](https://docs.smith.langchain.com/evaluation)** | LangChain | 免費 | 如果你使用 LangChain 生態系，官方 LangSmith 文件是最好的動手評估參考。 |
| **[Phoenix + Langfuse official docs](https://docs.arize.com/phoenix)** | Arize Phoenix | 免費 | 使用 Phoenix 做開源評估的動手教學。 |

> 📖 另請參閱本儲存庫的配套指南：
> - [AI 評估：完整學習指南（Phoenix + Langfuse）](ai_evals_comprehensive_study_guide.md)
> - [AI 評估：LangWatch + Langfuse 指南](ai_evals_complete_guide_langwatch_langfuse.md)

---

## 提示工程與上下文工程 <a name="prompting"></a>

| 課程 | 提供者 | 費用 | 為何值得信賴 |
|--------|----------|------|-----------------|
| **[ChatGPT Prompt Engineering for Developers](https://www.deeplearning.ai/short-courses/chatgpt-prompt-engineering-for-developers/)** | DeepLearning.AI + OpenAI | 免費 | 奠基性的提示工程課程。由 Isa Fulford & Andrew Ng 講授。 |
| **[Prompting Fundamentals (Anthropic)](https://www.anthropic.com/learn)** | Anthropic | 免費 | 直接來自 Claude 團隊。涵蓋提示設計、XML 標籤、chain-of-thought。 |
| **[DSPy: Building Optimizable Pipelines](https://github.com/stanfordnlp/dspy)** | Stanford NLP（GitHub） | 免費 | 雖然不是一門課程，但 DSPy 儲存庫的 notebook 是學習程式化提示最好的方式。 |
| **[Prompt Engineering Guide](https://www.promptingguide.ai/)** | DAIR.AI | 免費 | 完整、由社群維護的參考資料，涵蓋所有主要的提示技巧。 |

---

## 微調與調適 <a name="finetuning"></a>

| 課程 | 提供者 | 費用 | 為何值得信賴 |
|--------|----------|------|-----------------|
| **[Finetuning Large Language Models](https://www.deeplearning.ai/short-courses/finetuning-large-language-models/)** | DeepLearning.AI + Lamini | 免費 | 涵蓋 LoRA、完整微調、資料集準備、評估。精簡又實用。 |
| **[Reinforcement Learning from Human Feedback](https://www.deeplearning.ai/short-courses/reinforcement-learning-from-human-feedback/)** | DeepLearning.AI + AWS | 免費 | 深入探討 RLHF：獎勵模型、PPO、偏好資料集。 |
| **[Hugging Face NLP Course](https://huggingface.co/learn/nlp-course/chapter1/1)** | Hugging Face | 免費 | 使用 HF 生態系（Trainer、PEFT 等）微調 transformer 最好的免費課程。 |
| **[How Diffusion Models Work](https://www.deeplearning.ai/short-courses/how-diffusion-models-work/)** | DeepLearning.AI | 免費 | 適用於影像模型微調（stable diffusion、影像版 LoRA）。 |

---

## 推論優化與 MLOps <a name="mlops"></a>

| 課程 | 提供者 | 費用 | 為何值得信賴 |
|--------|----------|------|-----------------|
| **[ML Engineering for Production (MLOps)](https://www.coursera.org/specializations/machine-learning-engineering-for-production-mlops)** | DeepLearning.AI（Coursera） | 付費 | 關於生產環境 ML 的 4 門課程專項：部署、監控、管線。 |
| **[Efficiently Serving LLMs](https://www.deeplearning.ai/short-courses/efficiently-serving-llms/)** | DeepLearning.AI + Predibase | 免費 | 涵蓋 vLLM、PagedAttention、量化、LoRA 服務。正是本指南所涵蓋的內容。 |
| **[vLLM Documentation & Tutorial](https://docs.vllm.ai/en/latest/)** | vLLM | 免費 | 官方 vLLM 文件是高吞吐量服務最即時更新的參考資料。 |

---

## AI 安全與防護機制 <a name="safety"></a>

| 課程 | 提供者 | 費用 | 為何值得信賴 |
|--------|----------|------|-----------------|
| **[Red Teaming LLM Applications](https://www.deeplearning.ai/short-courses/red-teaming-llm-applications/)** | DeepLearning.AI + Giskard | 免費 | 動手做紅隊演練、prompt injection、越獄偵測、偏見測試。 |
| **[AI Safety Fundamentals](https://aisafetyfundamentals.com/alignment-fast-track/)** | BlueDot Impact | 免費 | 關於 AI 對齊與安全最受信賴的免費課程。Anthropic、DeepMind 的專業人員都在使用。 |
| **[NVIDIA AI Red Team (NEMO Guardrails)](https://github.com/NVIDIA/NeMo-Guardrails)** | NVIDIA | 免費 | 用 NeMo Guardrails 建構生產環境防護機制的動手 notebook。 |

---

## 程式撰寫代理與開發者 AI 工具 <a name="coding-agents"></a>

| 課程 | 提供者 | 費用 | 為何值得信賴 |
|--------|----------|------|-----------------|
| **[Claude Code — Official Docs](https://docs.anthropic.com/en/home)** | Anthropic | 免費 | Claude Code 權威性的起點。涵蓋 CLAUDE.md、SDK 與權限。 |
| **[Building Code Agents (Hugging Face)](https://huggingface.co/learn/agents-course/unit1/introduction)** | Hugging Face | 免費 | HuggingFace 的官方代理課程，包含一個關於建構程式碼執行代理的單元。 |
| **[Introduction to OpenHands](https://github.com/All-Hands-AI/OpenHands/blob/main/docs/getting-started.md)** | All-Hands AI | 免費 | OpenHands 自主程式撰寫代理的官方入門指南。 |

> 📖 另請參閱本儲存庫的指南：[Claude Code 指南](09-frameworks-and-tools/09-claude-code.md) 與 [OpenCoder 全景](09-frameworks-and-tools/10-opencoderguide.md)

---

## 給 PM 與非工程師 <a name="pm-track"></a>

這些課程不需要任何 Python 經驗：

| 課程 | 提供者 | 費用 | 為何值得推薦 |
|--------|----------|------|--------------|
| **[AI for Everyone](https://www.coursera.org/learn/ai-for-everyone)** | DeepLearning.AI（Coursera） | 免費 | Andrew Ng 為非技術角色開設的課程。涵蓋 AI 能做什麼、不能做什麼，以及專案領導。 |
| **[Prompt Engineering for Everyone](https://learnprompting.org/)** | Learn Prompting | 免費 | 為非工程師寫的白話提示工程指南。 |
| **[Evals for AI (Maven)](https://maven.com/hamel-shreya/evals-for-ai)** | Hamel Husain & Shreya Shankar | 付費 | 雖然有程式碼，但這門課程是為 PM 與 QA 設計的，不只是給工程師。強烈推薦。 |
| **[AI Product Management](https://www.productschool.com/blog/product-management/ai-product-manager/)** | Product School | 免費（部落格） | 為建構 AI 驅動產品的 PM 寫的實用指南。 |
| **[Google: Introduction to Generative AI](https://cloud.google.com/learn/training/machinelearning-ai)** | Google Cloud Skills Boost | 免費 | 無需寫程式的生成式 AI、LLM 與負責任 AI 入門。 |

---

## YouTube 頻道與免費內容 <a name="free"></a>

| 頻道 / 資源 | 主題 | 為何值得追蹤 |
|-------------------|-------|------------|
| **[Andrej Karpathy](https://www.youtube.com/@AndrejKarpathy)** | 基礎、transformer | 對 LLM 實際運作方式最好的講解 |
| **[Yannic Kilcher](https://www.youtube.com/@YannicKilcher)** | 論文評析 | 清晰地走過最新的 ML 研究論文 |
| **[Aleksa Gordić - The AI Epiphany](https://www.youtube.com/@TheAIEpiphany)** | 論文評析 | 深入的技術論文剖析 |
| **[AI Jason](https://www.youtube.com/@AIJasonZ)** | 代理、LangChain、實用 | 代理式框架很棒的入門影片 |
| **[Sam Witteveen](https://www.youtube.com/@samwitteveenai)** | Gemini、RAG、代理 | 最好的實用 AI YouTuber 之一 |
| **[Matt Wolfe](https://www.youtube.com/@mreflow)** | AI 新聞、產品展示 | 最適合掌握最新 AI 新聞與工具 |
| **[Hamel Husain（部落格）](https://hamel.dev/)** | 評估、生產環境 AI、LLM | 來自 evals maven 課程作者的真實生產環境洞見 |
| **[Simon Willison（部落格）](https://simonwillison.net/)** | LLM 新聞、工具、程式撰寫 | 最值得信賴的每日 AI 新聞來源 |
| **[The Latent Space podcast](https://www.latent.space/)** | 技術性 AI 訪談 | 最好的技術性 AI podcast，與研究者深入對談 |
| **[Lex Fridman Podcast](https://lexfridman.com/podcast/)** | 廣泛的 AI/ML 訪談 | 與頂尖 AI 研究者的長篇訪談 |

---

## 學習路徑建議 <a name="paths"></a>

### 🛤️ 路徑：「我是 AI 新手，想快速動手做出東西」

```
Week 1: Prompt Engineering for Developers (DeepLearning.AI) — free, 2 hrs
Week 2: Building Systems with ChatGPT API (DeepLearning.AI) — free, 2 hrs
Week 3: Building and Evaluating Advanced RAG (DeepLearning.AI) — free, 2 hrs
Week 4: AI Agents in LangGraph (DeepLearning.AI) — free, 4 hrs
Month 2: Pick a real project, use this guide as reference
```

### 🛤️ 路徑：「我想深入理解 LLM」

```
Week 1-3: Neural Networks: Zero to Hero (Karpathy) — free, 12+ hrs
Week 4-6: CS324 Stanford LLMs — free, 30+ hrs
Month 2: Generative AI with LLMs (Coursera DeepLearning.AI)
Month 3: CS294 LLM Agents (Berkeley)
```

### 🛤️ 路徑：「我想建構生產就緒的 AI 評估」

```
Week 1: Evaluating and Debugging Generative AI (DeepLearning.AI + W&B) — free
Week 2: This repo's evals guides (Phoenix/Langfuse) — free  ← start here
Week 3-4: Quality and Safety for LLM Applications (DeepLearning.AI)
Month 2: Evals for AI (Maven, Hamel + Shreya) — paid, worth it
```

### 🛤️ 路徑：「我是 PM，正在學習如何為 AI 產品品質做出貢獻」

```
Week 1: AI for Everyone (Coursera) — free
Week 2: Prompt Engineering for Everyone (learnprompting.org) — free
Week 3: AI Evals guide in this repo — free (especially Chapters 1-3 on error analysis)
Month 2: Evals for AI (Maven) — paid, has PM track
```

### 🛤️ 路徑：「我想在我的團隊中部署程式撰寫代理」

```
Day 1: Claude Code docs (anthropic.com) — free
Week 1: This repo's Claude Code Guide + OpenCoder Landscape Guide
Week 2: Building Code Agents (Hugging Face) — free
Month 1: Run Claude Code on a real project in CI
```

---

## 如何保持即時更新

AI 進展飛快。除了課程之外，以下這些習慣能讓你保持即時更新：

1. **追蹤 Simon Willison 的部落格** — 每日、值得信賴的 AI 新聞摘要
2. **閱讀 Anthropic + OpenAI 的發布說明** — 第一手來源勝過二手摘要
3. **觀看 Latent Space podcast** — 最佳的技術深度
4. **為開源做出貢獻** — OpenHands、LlamaIndex、DSPy，真正的學習發生在 PR 之中
5. **為本儲存庫加星號** — 隨著局勢變化我們會持續更新它 ⭐

---

*由 [Om Bharatiya](https://github.com/ombharatiya) 維護。歡迎提交 PR 新增課程！*
