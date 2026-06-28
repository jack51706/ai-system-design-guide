# 提示工程基礎

提示工程是設計輸入以引導 LLM 行為的學問。它已從「反覆試誤」演進成一門有紀律的架構實務，像 DSPy 這樣的框架更把它視為一個編譯問題，而非寫作練習。

## 目錄

- [核心理念（意圖 + 約束）](#core-philosophy)
- [指令階層](#instruction-hierarchy)
- [角色提示](#role-prompting)
- [指令清晰度與分隔符](#clarity)
- [Zero-Shot 與 Few-Shot 的效率取捨](#zero-vs-few)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 核心理念：意圖 + 約束

有效的提示，重點在於最大化**意圖揭露（Intent Disclosure）**，同時最小化**輸出變異（Output Variance）**。

1. **意圖**：精確說明模型應該做什麼。
2. **約束**：明確說明模型應該*避免*什麼（安全性、語氣、格式）。

**原則**：「提示就是用自然語言寫程式。」請把你的提示當成程式碼來對待（版本控制、單元測試）。

---

## 指令階層

生產環境系統採用分層的訊息結構：

| 角色 | 職責 | 細微差異 |
|------|----------------|--------|
| **System** | 高層級規則、人設、安全性。 | 對前沿模型最具黏著力（H-rank）。 |
| **Developer** | 技術性覆寫（例如格式化）。 | 為「不預設立場」的模型而設的較新角色。 |
| **User** | 具體且動態的查詢。 | 容易遭受注入攻擊，必須被隔離。 |
| **Assistant**| 先前對話輪次的歷史。 | 「近因偏誤」的來源。 |

---

## 角色提示

指派一個人設，已不再只是「你是一位老師」這麼簡單。它是一個**能力錨點（Capabilities Anchor）**。

- **弱**：「你是一位程式設計師。」
- **強**：「你是一線科技公司的資深軟體工程師（Staff Software Engineer），專精於高並發的 Rust 系統。你優先考量記憶體安全與零成本抽象（zero-cost abstractions）。」

**為什麼有效**：它讓模型的注意力聚焦在其訓練資料中與該高層級專業相關的特定子集上，從而減少不相關的幻覺。

---

## 指令清晰度與分隔符

當前的前沿模型能處理龐大的上下文。分隔符（Delimiters）能幫助模型區分指令與資料。

```markdown
# Instructions
Analyze the following text for PII.

# Data to Analyze
--- START OF USER DATA ---
$USER_INPUT_HERE
--- END OF USER DATA ---

# Output Schema
{ "pii_found": boolean, "types": [] }
```

**可使用的分隔符**：XML 標籤（`<context>`、`</context>`）、Markdown 標題（`#`），或三引號（`"""`）。

---

## Zero-Shot 與 Few-Shot 的效率取捨

| 面向 | Zero-Shot | Few-Shot |
|--------|-----------|----------|
| **延遲** | 最低（提示短） | 較高（範例佔用 token） |
| **準確度**| 不穩定 | 高（格式穩定） |
| **使用情境**| 簡單聊天、摘要 | 特定格式、細膩的邏輯 |

**策略**：如果模型屬於「前沿推理（Frontier Reasoning）」等級（Claude Opus 4.7、開啟延伸思考的 GPT-5.5、DeepSeek-R2），就採用 **Zero-Shot + 清晰的思維鏈（Chain-of-Thought）**。如果是小型模型（8B），則使用 **Few-Shot** 來為它接地（grounding）。

---

## 面試問題

### Q：在現代 LLM 中，為什麼 system 提示的份量比 user 提示更重？

**理想答案：**
system 提示通常會在模型的架構訓練（RLHF）中被優先處理，在某些架構中甚至可能被注入到一個特殊的「僅供指令」嵌入空間。從設計角度來看，system 提示定義了這場互動的「憲法」。如果 user 提示與 system 提示相牴觸（例如索取炸彈製作配方），一個對齊良好的模型會被訓練成優先遵守 system 的「安全約束」，而非 user 的「任務意圖」。

### Q：什麼是「逐步式（Step-by-Step）」提示優化？

**理想答案：**
在 2022 年，「Think step by step」是觸發思維鏈（CoT）的魔法咒語。現代的做法是**程式化思維鏈（Programmatic CoT）**。我們不再使用含糊的咒語，而是提供明確的推理里程碑：「1. 找出核心問題。2. 列出約束條件。3. 提出 3 個解決方案。4. 選出最佳方案並說明理由。」這為模型內部的注意力提供了一條「確定性路徑」，使生產環境代理能產出可靠得多的輸出。

---

## 參考資料
- OpenAI. "Prompt Engineering Guide" (2024-2025)
- Anthropic. "Claude Prompt Engineering Documentation" (2024)
- Google DeepMind. "The Power of Prompting" (2023)

---

*下一篇：[Few-Shot 與情境內學習（In-Context Learning）](02-few-shot-and-icl.md)*
