# LangSmith 可觀測性

在 2023 年，LLM 可觀測性還只是「把字串記錄下來」。如今它已經演進成**完整軌跡除錯（Full Trajectory Debugging）**與**自動化評估管線（Automated Evaluation Pipelines）**。LangSmith 是擁擠的「LLMOps」層中與 LangChain 原生整合的選項，這個層級還包含 Langfuse（2026 年 1 月被 ClickHouse 收購）、LangWatch、Braintrust 與 Arize Phoenix。

## 目錄

- [可觀測性金字塔](#pyramid)
- [追蹤與軌跡](#tracing)
- [LLM 的單元測試（資料集）](#datasets)
- [自動化評估器（LLM-as-Judge）](#evaluators)
- [管理部署：A/B 測試](#ab-testing)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 可觀測性金字塔

1. **頂層（價值）**：使用者的任務有沒有被完成？（成功率）
2. **中層（流程）**：哪一個代理節點是瓶頸？（每個節點的延遲／成本）
3. **底層（原始資料）**：確切的提示／補全配對是什麼？（追蹤）

---

## 追蹤與軌跡

LangSmith 會自動擷取 **LangGraph** 或 **Chain** 中的每一個節點。
- **中繼資料標記（Metadata Tagging）**：為每一筆追蹤標上 `user_id`、`model_tier` 與 `is_canary`。
- **除錯器**：你可以在 LangSmith UI 中「回放」一筆追蹤，修改提示並觀察回應如何變化。這個過程不需要重新執行整個應用程式。

---

## LLM 的單元測試（資料集）

在沒有**資料集（Dataset）**的情況下建構 LLM 應用，就是「憑感覺開發」。
- **黃金標準資料集（Gold Standard Datasets）**：一組 `(Input, Expected_Output)` 配對的集合。
- **標準工作流程**：每當使用者提供負面回饋時，該次互動就會自動被灌入「修正資料集（Correction Dataset）」，供未來測試使用。

---

## 自動化評估器

你沒辦法每天早上手動檢查 1,000 筆日誌。
- **LLM-as-Judge**：使用更強的模型（Claude Opus 4.7、GPT-5.5 reasoning、DeepSeek-R2）針對**語氣（Tone）**、**準確度（Accuracy）**與**安全動作執行（Safe Action execution）**等類別，為生產環境的模型評分。
- **自訂評估器（Custom Evaluators）**：用來檢查正規表示式樣式、JSON schema 是否有效，或毒性分數（Toxicity scores）的 Python 函式。

---

## A/B 測試

LangSmith 支援**實驗分支（Experiment Branching）**。
- 讓 2% 的流量跑在新版的「System Prompt」上。
- 即時比較**成功率**與 **Token 成本**。
- 當失敗率超過門檻時自動回滾。

---

## 面試問題

### Q：為什麼「追蹤歸因（Trace Attribution）」對 Staff 級工程師至關重要？

**好的回答：**
在複雜的多代理系統中，最終輸出可能很糟，但錯誤其實發生在 10 步之前某個「Researcher」節點裡。如果沒有**追蹤歸因**，你只是在猜測該去哪裡修改提示。歸因讓我能看見**推理脈絡（Line of Reasoning）**。我可以看到「Researcher」沒能找到正確的 URL，進而導致「Summarizer」產生幻覺。這讓我能做**有針對性的最佳化（Targeted Optimization）**，而不是大範圍亂槍打鳥式的「提示工程」。

### Q：你如何替像 LangSmith 這樣的可觀測性平台的成本做出合理說明？

**好的回答：**
這筆成本會被**開發者生產力（Developer Productivity）**與 **Token 效率（Token Efficiency）**所抵銷。工程師花上一整天「猜」模型為什麼會失敗，成本遠遠高於每月的訂閱費。此外，藉由 LangSmith 找出那些「繞遠路（Meandering）」的代理（也就是步數過多的代理），我可以最佳化圖結構，把平均步數從 8 步降到 5 步，這會直接帶來 **30 到 40% 的 LLM API 帳單縮減**。

---

## 參考資料
- LangChain Team. "LangSmith: The Unified Evaluation Platform" (2025)
- Microsoft. "Tracing and Debugging Multi-Agent Systems" (2025)
- Weights & Biases. "Integrating LLOps into the CI/CD Pipeline" (2024/2025)

---

*下一篇：[LlamaIndex 與資料中心式 AI](04-llamaindex.md)*
