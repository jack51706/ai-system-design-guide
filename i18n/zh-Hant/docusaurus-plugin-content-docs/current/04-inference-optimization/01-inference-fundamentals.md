# 推論基礎

推論是從訓練好的模型產生預測的過程。推論最佳化已經從「單純加速」轉向「架構效率」，以便在 Hopper (H100) 與 Blackwell (B200) 等級的硬體上處理高度依賴推理的工作負載。

## 目錄

- [推論的兩個階段](#two-phases)
- [瓶頸：受限於運算 vs. 受限於記憶體](#bottlenecks)
- [效能指標：TTFT 與 TPOT](#metrics)
- [硬體支援的最佳化 (FP8)](#hardware-optimizations)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 推論的兩個階段

LLM 推論並非單一操作，它由兩個截然不同的運算階段組成。

### 1. 預填充階段 (Prefill，提示處理)
模型在單次傳遞中處理整個輸入提示。
- **運算**：高度平行的矩陣乘法。
- **瓶頸**：**受限於運算** (受限於 GPU TFLOPS)。
- **時間複雜度**：$O(N)$，其中 $N$ 為輸入長度 (但已平行化)。

### 2. 解碼階段 (Decode，token 生成)
模型逐一生成 token，每個 token 都依賴前面的 token。
- **運算**：循序處理，一次處理權重矩陣的一列。
- **瓶頸**：**受限於記憶體** (受限於記憶體頻寬)。
- **時間複雜度**：$O(M)$，其中 $M$ 為輸出長度 (循序)。

---

## 瓶頸：受限於運算 vs. 受限於記憶體

了解系統的瓶頸所在，對於選擇正確的最佳化方式至關重要。

| 階段 | 瓶頸 | 原因？ | 主要最佳化 |
|-------|------------|------|----------------------|
| **預填充 (Prefill)** | 運算 (FLOPs) | 平行處理使 GPU 的算術單元達到飽和。 | FlashAttention、FP8/FP16 精度。 |
| **解碼 (Decode)** | 記憶體頻寬 | *每一個 token* 都必須從 VRAM 載入權重。 | 量化 (4-bit)、GQA、批次處理。 |

**記憶體牆 (Memory Wall) 的洞察**
隨著模型越來越大，記憶體頻寬 (HBM3/HBM3e) 的成長速度趕不上運算 (TFLOPS)。這使得解碼階段成為生產環境最佳化的主要目標。

---

## 效能指標

| 指標 | 全名 | 目標 | 重要性 |
|--------|-----------|------|------------|
| **TTFT** | Time To First Token (首個 token 時間) | < 200ms | 使用者感受到的回應速度。 |
| **TPOT** | Time Per Output Token (每個輸出 token 時間) | < 30ms | 閱讀速度與對話流暢度。 |
| **吞吐量 (Throughput)** | Tokens/Second (彙總) | 最大化 | 決定每次查詢的成本。 |
| **延遲 (Latency)** | 端對端時間 | < 2.0s | 代理的整體往返時間。 |

---

## 硬體支援的最佳化 (FP8)

**FP8 (8 位元浮點數)** 是 H100 與 B200 GPU 上推論的原生精度。

- **好處**：比 FP16/BF16 快 2 倍，且精度損失可忽略 (<0.1%)。
- **運作原理**：相較於 Int8，它使用較小的尾數 (mantissa) 與較大的指數 (exponent)，因此能在不需複雜校準的情況下，更準確地表示 LLM 激活值的動態範圍。

**Principal 等級的細節**：服務框架現在採用 **動態 FP8 縮放 (Dynamic FP8 Scaling)**，會逐層調整量化縮放比例，避免離群值 (outliers) 破壞整個模型的邏輯。

---

## 面試問題

### Q：為什麼 LLM 生成比分類慢？

**理想答案：**
分類是「僅預填充 (Prefill-only)」的任務，它在單次平行傳遞中處理整個輸入並產生單一輸出，因此在運算上是最佳化的。然而，LLM 生成是 **自迴歸 (auto-regressive)** 的。每個 token 都依賴前一個 token，迫使系統進入循序的「解碼」迴圈。由於這個迴圈中的每一步都受限於記憶體 (載入數 GB 的權重，卻只產生數 mg 的資料)，系統大部分時間都在等待記憶體傳輸，而非進行運算。

### Q：你如何分別最佳化 TTFT 與 TPOT？

**理想答案：**
要最佳化 **TTFT**，必須最佳化預填充階段：使用 FlashAttention-3、提高運算平行度 (張量平行 Tensor Parallelism)，或使用前綴快取 (Prefix Caching) 對常見提示完全略過預填充。
要最佳化 **TPOT**，必須在解碼期間最佳化記憶體頻寬：使用量化 (4-bit 權重) 以減少從 VRAM 移動的資料量、使用分組查詢注意力 (Grouped Query Attention, GQA) 以縮小 KV cache 大小，或使用推測性解碼 (Speculative Decoding) 在每次記憶體載入時生成多個 token。

---

## 參考資料
- Pope et al. "Efficiently Scaling Transformer Inference" (2022)
- NVIDIA. "Transformer Engine Documentation" (2024)
- vLLM Blog. "Understanding LLM Inference Latency" (2023)

---

*下一篇：[KV Cache 與上下文快取](02-kv-cache-and-context-caching.md)*
