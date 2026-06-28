# 裝置端與邊緣部署

不是每個模型都得跑在別人的雲端。把 LLM 放在**本地**執行，無論是筆電、工作站 GPU、手機，還是邊緣設備，在 2026 年都是真實可行的部署目標，背後的驅動力來自隱私、離線運作、延遲，以及在穩定流量下的成本考量。問題在於，讓本地模型容易*試用*的工具（Ollama）並不是把它們放上*生產環境*服務的工具（vLLM），而這兩者經常被混為一談。本章會把執行階段技術堆疊、從原型到生產的路徑、硬體限制，以及本地何時真正勝過 API，一一釐清。

## 目錄

- [執行階段技術堆疊](#the-runtime-stack)
- [為什麼 Ollama 不是生產環境伺服器](#why-ollama-is-not-a-production-server)
- [本地何時勝過雲端（以及何時不會）](#when-local-beats-cloud-and-when-it-does-not)
- [本地服務的量化](#quantization-for-local-serving)
- [硬體](#hardware)
- [原型到生產](#prototype-to-production)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 執行階段技術堆疊

關鍵的心智模型是：這些工具**並非互相取代**。它們處在不同的層級。

| 工具 | 層級 | 用途 |
|------|-------|----------------|
| **Ollama** | 體驗層 / 本地常駐程式 | 一行指令拉取並執行模型，類 OpenAI 的 API，單人開發。建構於 llama.cpp 之上，近期版本在 Apple Silicon 上使用 Apple MLX。 |
| **LM Studio** | 體驗層 / 圖形介面 | 用來瀏覽並執行本地模型的桌面圖形介面。聚焦於單人使用。 |
| **llama.cpp** | 推論引擎 | 可攜的 C/C++ CPU/GPU 推論（GGUF 格式）；幾乎能在任何地方執行；驅動了體驗層的工具。 |
| **MLX** | 推論引擎 | Apple 的陣列框架；Apple Silicon 上最快的路徑；研究與微調。 |
| **vLLM** | 服務系統 | 以 PagedAttention 與連續批次處理（continuous batching）達成高吞吐量的並行服務；OpenAI 相容。生產環境的答案。 |
| **TGI / TensorRT-LLM** | 服務系統 | Hugging Face 與 NVIDIA 的高吞吐量伺服器；生產環境。 |
| **ExecuTorch** | 嵌入式 / 行動端執行階段 | PyTorch 原生的裝置端推論（從手機到微控制器）；在 2025 年底達到 1.0，並已內建於數十億使用者的應用程式中。 |
| **Core ML / ONNX Runtime / MLC LLM** | 嵌入式 / 行動端執行階段 | 分別對應 Apple 裝置端、跨平台，以及編譯至多種目標（含瀏覽器／WebGPU）。 |

---

## 為什麼 Ollama 不是生產環境伺服器

Ollama 與 LM Studio 非常適合做原型，卻不適合作為共享的生產環境端點，這背後有個值得拿來教學的架構原因。

Ollama 預設以非常有限的並行度來服務請求，並把超量的請求以先進先出（first-in-first-out）的方式排隊；佇列滿了就回傳錯誤。每個並行插槽還會以靜態方式倍增上下文的記憶體配置。LM Studio 則是為單人情境打造，沒有速率限制或驗證。兩者都不是設計來把並行需求轉換成吞吐量的。

**vLLM** 做得到，靠的是兩個機制：**PagedAttention**（KV cache 像作業系統分頁那樣，儲存在不連續的區塊中，把樸素服務方式 60-80% 的 KV 記憶體浪費砍到約 4% 以下）以及**連續批次處理**（在批次進行中把一個已完成的請求換出、把佇列中的一個換入）。最清楚的第一方基準測試來自 Red Hat：在單張資料中心 GPU 上執行一個 8B 模型，vLLM 達到大約 **793 tokens/sec，而 Ollama 約為 41**，約 19 倍，尾端延遲也低得多，即使是經過調校的 Ollama，在所有並行層級也都落後。

結論不是「vLLM 調得比較好」。這是結構性的：Ollama 與 LM Studio 是序列化處理，vLLM 則是連續批次處理並對 KV cache 分頁。對單一使用者來說差異很小；在並行之下，差距會變成大約 16-20 倍。為求誠實有一點要說明：大多數公開的正面對決數字都跑在資料中心 GPU 上，目的是隔離出*軟體*層面的差異，所以別把「vLLM 勝過 Ollama」解讀成「GPU 勝過 Mac」。

---

## 本地何時勝過雲端（以及何時不會）

**在下列情況偏向本地或邊緣：**
- **隱私或受監管的資料**不能離開該設備（HIPAA、GDPR、合約約定的資料落地）。一個值得教學的提醒：主要的 API 供應商現在都提供零資料保留（zero-data-retention）的企業方案，所以單憑「隱私」已不再自動就決定要走本地。
- **離線或氣隙（air-gapped）**運作（現場設備、關鍵基礎設施）。
- **延遲下限**：裝置端省去了網路來回（通常 50-200ms），這對緊湊的互動迴圈很重要；不過整體回應延遲仍取決於模型與硬體。
- **穩定、高流量下的成本**：據報導，一張預留（reserved）GPU 大約在每天數百萬 tokens 左右就能與前沿 API 達到損益兩平，超過這個量，自有硬體就會勝出，因為你不再按 token 付費。確切的損益兩平點取決於工作負載。

**在下列情況留在雲端 API**：你需要前沿等級的品質、有尖峰或難以預測的需求（你會為閒置的 GPU 付費；批次端點以約五折的價格在中等流量下往往勝過本地）、跑的是低到中等的流量（在損益兩平點以下，整體成本對 API 有利），或缺乏營運能量去運行帶有自動擴展與監控的 vLLM。2026 年的共識通常是**混合式**：把小型、私密、離線或對成本敏感的路徑放在本地，把重型、前沿或尖峰的路徑導向雲端，全都收在同一個產品裡。

---

## 本地服務的量化

量化是讓本地服務變得可行的關鍵；[量化深入探討](../03-training-and-adaptation/07-quantization-deep-dive.md)涵蓋了數學原理，所以這裡只談部署層面。

**GGUF** 是 llama.cpp、Ollama 與 LM Studio 所用的本地模型格式。常見的量化等級在品質與大小之間取捨：Q4_K_M 是實務上的最佳甜蜜點（相較 FP16 大約 1-3% 的品質損失，大小約為四分之一），Q5_K_M 在程式碼與推理上明顯更好，損失在約 1% 以下，Q8_0 在約 FP16 一半的大小下實質上無損，而 Q2/Q3 省下最多記憶體，但會讓數學與推理退化 5-10% 甚至更多。

**VRAM 經驗法則**：

```
VRAM (GB) ≈ (params in billions × bits per weight) / 8   # model weights only
```

接著再加上 KV cache（它會隨著上下文長度乘以並行請求數而成長），外加大約 10-20% 的執行階段額外開銷。所以一個 7B 模型的權重在 FP16 下大約 14GB，在 Q8_0 下約 7.7GB，在 Q4_K_M 下約 4.5GB，這還沒算上那些額外開銷。每個人都在重複的操作準則是：**在保留 10-20% 餘裕**給 KV cache、活化值與上下文的前提下，**使用塞得下的最高品質量化**。

---

## 硬體

一份模型大小對應硬體的指南（假設採用 Q4 量化；屬於規劃指引，而非保證）：

| 模型大小（Q4） | 最低 VRAM/RAM | 實際硬體 |
|-----------------|--------------|--------------------|
| 1-3B | 4-6 GB | 任何現代 GPU；高階手機（NPU）；AI PC |
| 7-8B | 8 GB | 主流 GPU；16 GB Mac |
| 13-14B | 12 GB | 中高階主流 GPU；16-24 GB Mac |
| 32-35B | 24 GB | 一張 24 GB 的消費級 GPU；36-48 GB Mac |
| 70B | 約 40 GB 以上 | 高階或雙 GPU；64 GB 以上 Mac；或一張資料中心卡 |
| 200B+ | 48 GB 以上，常需多 GPU／128 GB 以上統一記憶體 | 多 GPU 機台；大容量統一記憶體的工作站 |

附註：
- **消費級 GPU** 的 VRAM 上限落在 24-32 GB，這是本地模型大小的關鍵約束。
- **Apple Silicon** 在 CPU 與 GPU 之間共用同一個記憶體池，所以系統 RAM 兼作 VRAM，讓大容量 RAM 的 Mac 能裝下同價位獨立 GPU 裝不下的模型。Apple 的 MLX 路徑持續進步：Ollama 的 MLX 後端（預覽版）回報在 Apple Silicon 上藉由善用統一記憶體，在 prefill 與 decode 上有可觀的提升，另有一項更新加入了 NVFP4，這是 NVIDIA 的 4-bit 浮點格式（不是 Apple 的），據報導比 Q4_K_M 快約 20%。
- 手機與 AI PC 裡的 **NPU** 標榜高 TOPS，但有個教學上的細節：單看 TOPS 並不能預測 LLM 速度，因為有限的運算子支援與記憶體頻寬會卡住實際效能。NPU 適合輕量、省電的任務；在繁重的本地推論上，獨立 GPU 仍然勝出。
- **行動端**受頻寬與記憶體所限：手機上實際可行的模型約在 1B 以下到 3B 左右，即使是旗艦機，可用的應用程式 RAM 往往不到 4 GB，而行動端記憶體頻寬比資料中心 GPU 低 30-50 倍。裝置端的標準是 4-bit 量化。

---

## 原型到生產

1. 在 GGUF Q4_K_M 模型上，用 Ollama（CLI）或 LM Studio（GUI）做**原型**；在能通過的最小模型上驗證品質與提示。
2. **挑選塞得下目標硬體、並保有 KV cache 餘裕的最大模型與最佳量化**。
3. 對任何並行端點都要**切換服務引擎**：vLLM（NVIDIA 或 AMD）、TensorRT-LLM（NVIDIA 上極致）或 TGI。維持 OpenAI 相容的 API，讓應用程式碼幾乎不用改。
4. **對行動端或邊緣**，匯出至 ExecuTorch、Core ML 或 ONNX Runtime / MLC LLM，量化到 4-bit，並把預算抓在 4 GB RAM 以下與頻寬限制之內。

常見陷阱：把 Ollama 或 LM Studio 當伺服器用（它在負載下會序列化）；在估算記憶體時忘了 KV cache（長上下文乘以並行插槽可能占主導）；過度量化（Q2/Q3 會傷害推理）；把「vLLM 勝過 Ollama」和「GPU 勝過 Mac」混為一談；以為 NPU 的 TOPS 等於 LLM 速度；以及把引擎與硬體配錯（vLLM 以 GPU 為中心，MLX 只限 Apple，llama.cpp 是可攜性的退路）。

**成熟度：**伺服器端的本地服務已達生產級成熟（vLLM 帶著 OpenAI 相容 API 被廣泛部署）。裝置端與行動端對*小型*模型（1B 以下到 3B）已可用於生產，但對前沿模型則不行。NPU 作為 LLM 引擎仍處於早期；在 2026 年，獨立 GPU 與大容量統一記憶體的 Mac 仍是認真的本地路徑。

---

## 面試問題

### Q：某團隊在 Ollama 上做了原型，想把它當成共享 API 上線。有哪些東西要改，為什麼？

**有力的回答：**
Ollama 是共享端點的錯誤工具。它以有限的並行度服務，並把超量請求以先進先出的方式排隊，所以在並行之下延遲會飆升，請求開始失敗。修法是把服務引擎切換成 vLLM（或 TensorRT-LLM 或 TGI），維持同一個 OpenAI 相容的 API，讓應用程式幾乎不用動。vLLM 是靠結構勝出，而不是靠調校：PagedAttention 把 KV cache 儲存在不連續的區塊裡，消除大部分的記憶體浪費，連續批次處理則在批次進行中把已完成的請求換出、把佇列中的換入，於是並行需求就變成了吞吐量。第一方基準測試顯示，在負載下吞吐量大約高出一個數量級，尾端延遲也低得多。我還會把模型與量化依目標 GPU 調整到合適大小並保有 KV cache 餘裕，並加上自動擴展與監控，這些都是 Ollama 不提供的。

### Q：你什麼時候會選擇本地或裝置端推論，而不是雲端 API？

**有力的回答：**
當資料因隱私或資料落地的理由不能離開該設備時、當系統必須離線或氣隙運作時、當我需要藉由省去網路來回拿到盡可能低的延遲時，或當我有穩定的高流量、一張預留 GPU 勝過按 token 計價時（據報導大約在每天數百萬 tokens 達到損益兩平）。我會在以下情況留在 API：需要前沿品質、尖峰需求下閒置 GPU 會浪費錢、流量低於損益兩平點，或團隊缺乏營運能量去運行一套服務堆疊。實務上通常是混合式：小型、私密或離線的路徑在本地以量化模型執行，而重型、前沿或突發的路徑則導向雲端。特別是在手機上，我會以 1B 以下到 3B 的模型來規劃，因為行動端受記憶體與頻寬所限。

---

## 參考資料

- Red Hat Developer，[〈Ollama vs vLLM: a deep dive into performance benchmarking〉](https://developers.redhat.com/articles/2025/08/08/ollama-vs-vllm-deep-dive-performance-benchmarking)
- vLLM，[文件](https://docs.vllm.ai/)與 [PagedAttention 部落格](https://blog.vllm.ai/2023/06/20/vllm.html)
- Ollama，[now powered by MLX on Apple Silicon](https://ollama.com/blog/mlx)與[並行 FAQ](https://docs.ollama.com/faq)
- PyTorch，[Introducing ExecuTorch 1.0](https://pytorch.org/blog/introducing-executorch-1-0/)
- Chandra 與 Krishnamoorthi（Meta），[〈On-Device LLMs: State of the Union, 2026〉](https://v-chandra.github.io/on-device-llms/)

---

*下一篇：[提示工程基礎](../05-prompting-and-context/01-prompt-engineering-fundamentals.md)*
