# OCR 與版面分析

傳統 OCR（Tesseract、各種專用引擎）大致上已被**原生多模態 LLM**（Gemini 3.1 Pro、GPT-5.5、Claude Sonnet 4.6、Claude Opus 4.7）所取代。我們不再「辨識字元」，而是「理解版面」。

## 目錄

- [典範轉移：傳統 OCR 與 Vision-LLM 的對比](#shift)
- [Vision-LLM 版面擷取](#layout-extraction)
- [閱讀順序與邏輯結構](#reading-order)
- [處理低品質掃描與手寫內容](#quality)
- [成本與延遲的取捨](#tradeoffs)
- [面試題](#interview-questions)
- [參考資料](#references)

---

## 典範轉移：傳統 OCR 與 Vision-LLM 的對比 {#shift}

| 特性 | 傳統 OCR（Tesseract/AWS Textract） | Vision-LLM（Gemini 3.1 Pro、GPT-5.5、Claude Opus 4.7） |
|---------|-------------------------------------------|--------------------------------------------------------|
| **主要機制** | 字元辨識 | 視覺 token 理解 |
| **運作邏輯** | 點線分析 | 語意脈絡 |
| **閱讀順序** | 單純由上而下 | 可感知多欄與複雜版面 |
| **手寫內容** | 差 | 優異（達到人類水準） |
| **輸出** | 文字區塊 + 邊界框 | 結構化 Markdown/JSON |

---

## Vision-LLM 版面擷取 {#layout-extraction}

標準工作流程是 **Screenshot-to-Markdown**（截圖轉 Markdown）。
1. **點陣化（Rasterize）**：將 PDF 頁面轉換成圖片。
2. **視覺提示（Visual Prompting）**：要求視覺模型「將下列頁面轉錄成 GitHub-flavored Markdown，並保留表格與標題」。
3. **結構還原（Structured Recovery）**：運用模型的空間感知能力重建邏輯階層。

---

## 閱讀順序與邏輯結構 {#reading-order}

> [!IMPORTANT]
> 在原始的 RAG 做法中，一個常見的失敗是把同一段落跨欄拆斷。
> Vision-LLM 透過「看見」欄與欄之間的間隙來解決這個問題，並正確地排序文字，這點不同於可能會橫跨兩欄直接讀過去的規則式解析器。

---

## 處理低品質掃描

現代多模態模型對下列狀況具有強健的容錯能力：
- **歪斜/旋轉**：在視覺注意力層中自動校正。
- **背面透印（Bleed-through）**：模型利用語意脈絡來「忽略」來自頁面背面的文字。
- **手寫註記**：可擷取到獨立的 `annotations` JSON 欄位中。

---

## 成本與延遲的取捨 {#tradeoffs}

| 模型層級 | 使用情境 | 延遲 | 成本（1K 頁） |
|------------|----------|---------|-----------------|
| **Gemini 3.1 Flash** | 大量批次處理 | 1-2s / 頁 | $1-3 |
| **GPT-5.5 / Claude Sonnet 4.6** | 高精度 / 法律 | 3-5s / 頁 | $8-18 |
| **本地端（Llama 4 Vision）** | PII 敏感 / 地端部署 | <1s / 頁 | 僅基礎設施成本 |

---

## 面試題 {#interview-questions}

### Q：既然已經有 Vision LLM，為什麼還會繼續使用 AWS Textract 或 Azure AI Search（OCR）？

**有力的回答：**
**嚴格的空間中繼資料與合規需求**。如果我的應用程式需要為每一個字取得精確到像素層級的邊界框（例如用於法律文件遮蔽工具），專用的 OCR 引擎通常更精準，成本也更低。此外，OCR 引擎是**確定性（Deterministic）**的：它們不會「產生幻覺」捏造出不存在的文字。在要求 100% 字元正確率、而非「版面理解」的高風險文件處理場景中，傳統引擎在混合式管線裡仍佔有一席之地。

### Q：如何用 Vision LLM 有效率地處理一份 500 頁的 PDF？

**有力的回答：**
我們採用 **Parallel Map-Reduce**（平行映射歸併）模式。
1. **Map（映射）**：我們啟動 50 個平行 worker（使用 AWS Lambda 或 Modal），每個各處理 10 頁。每個 worker 呼叫一個快速的 Vision 模型（例如 Gemini 3 Flash）來取得 Markdown。
2. **Consolidate（彙整）**：由一個中央代理檢視這些 Markdown 片段，確保標題的連貫性。
3. **Cache（快取）**：我們將產出的 Markdown 儲存在向量資料庫中。
這能把處理時間從 30 分鐘（循序處理）縮短到 20 秒以內。

---

## 參考資料 {#references}
- Google DeepMind. "Gemini 2.0: Understanding Multi-column Documents" (2025)
- OpenAI. "Vision Models for Document Understanding" (2025)
- Tesseract v6. "The Integration of Hybrid Transformer OCR" (2025)
