# 結構化生成

結構化生成（Structured Generation）是強制 LLM 以機器可讀格式（JSON、YAML、CSV）產生輸出，並達到 100% 可靠度的過程。這項技術已經從「以提示為基礎的請求」轉變為「引擎層級的約束」。

## 目錄

- [JSON 模式的革命](#json-mode)
- [函式呼叫與工具使用](#function-calling)
- [約束式解碼（CFG 與 Regex）](#constrained-decoding)
- [多階段擷取模式](#multi-stage)
- [驗證與格式錯誤](#validation)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## JSON 模式的革命

過去要取得 JSON 是一場「只回傳 JSON、不要其他文字」的苦戰。
**標準做法**：使用原生的 `response_format: { type: "json_schema" }`（OpenAI/Gemini）或工具輸出 schema（Anthropic）。

- **好處**：100% 語法正確。模型實際上根本無法輸出一個非合法 JSON 的字串。
- **幕後機制**：服務引擎會在每一步遮罩詞彙表（vocabulary），確保只有合法的 JSON 字元（例如 `{`、`"`、`:`、`[`）才能在下一步被選中。

---

## 函式呼叫與工具使用

函式呼叫是一種結構化生成，由 LLM「挑選」一個函式並填入它的參數。

```json
// Example Tool Call
{
  "name": "get_stock_price",
  "arguments": { "symbol": "AAPL", "interval": "1d" }
}
```

**細節**：**平行函式呼叫（Parallel Function Calling）** 現在已是標準做法。模型可以決定同時呼叫 5 個不同的工具（例如查詢帳戶餘額、查詢信用評分、查詢貸款利率），並彙總結果。

---

## 約束式解碼（CFG 與 Regex）

對於自架（self-hosted）模型（透過 Outlines 使用的 Llama-cpp、vLLM），我們會使用 **上下文無關文法（Context-Free Grammars，CFG）** 或 **Regex**。

```python
# Outlines Pattern
model = outlines.models.transformers("meta-llama/Llama-4-8B")
generator = outlines.generate.regex(model, r"(\d{3})-\d{3}-\d{4}")
# Result: The model can ONLY output telephone numbers.
```

---

## 多階段擷取模式

對於複雜的資料擷取（例如從一份病歷中擷取 50 個欄位），不要一次完成。
- **階段 1（Text-to-Text）**：以自然語言擷取一組「凌亂」但完整的事實。
- **階段 2（Text-to-JSON）**：使用一個較小、較便宜的模型，把那些自然語言事實轉換成嚴格的 JSON schema。
- **好處**：減少「壓力下的幻覺」，大型模型在被強迫同時進行推理「以及」遵循嚴格語法時會很吃力。

---

## 驗證與格式錯誤

即使有了「JSON 模式」，JSON 內部的 **邏輯** 仍可能是錯的（例如某個欄位遺漏，或日期格式錯誤）。

**復原模式**：
1. 用 **Pydantic/Zod** 驗證輸出。
2. 如果驗證失敗，把 **Traceback** 回傳給模型：
   「Error: Field 'age' must be an integer, got 'twenty'. Fix and re-generate.」
3. 大多數模型會在第一次重試就修正錯誤。

---

## 面試問題

### Q：為什麼「JSON 模式」比以提示為基礎的 JSON 請求更可靠？

**理想回答：**
以提示為基礎的請求仰賴模型遵循指令的*意願*；「JSON 模式」（或約束式解碼）則仰賴服務引擎*無法做出其他行為*的特性。藉由在推論層級套用「Logit Bias」或「文法遮罩（Grammar Mask）」，引擎會把下一個 token 的選擇限制在那些符合 schema 的合法選項上。這消除了「前言」（例如「Sure, here is your JSON...」），並確保你絕不會因為高溫度（temperature）或隨機性而拿到格式錯誤的字串。

### Q：一次向 LLM 要求過多結構化欄位的風險是什麼？

**理想回答：**
在 **Schema 複雜度** 與 **資訊完整性** 之間存在一個取捨。隨著 schema 變大（例如 20 個以上的階層式欄位），模型的注意力會被維持 JSON 結構（括號、鍵、引號）所消耗，而不是用來驗證資料的正確性。這往往會導致「遺漏型幻覺（Omission Hallucinations）」，模型會跳過欄位或用佔位資料填充。緩解之道是使用「密度鏈（Chain-of-Density）」擷取，或把擷取拆分成多個平行的子任務。

---

## 參考資料
- OpenAI. "Structured Outputs Documentation"（2024 年 8 月更新）
- Outlines Project. "Context-Free Grammar Guided Generation"（2024）
- Willard et al. "Efficient Guided Generation for LLMs"（2023）

---

*下一篇：[提示最佳化（DSPy）](07-prompt-optimization-dspy.md)*
