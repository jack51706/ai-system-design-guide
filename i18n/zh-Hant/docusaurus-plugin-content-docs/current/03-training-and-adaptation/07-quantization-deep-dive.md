# 量化深入解析

量化是降低模型權重精度（例如從 16-bit 降到 4-bit）的過程，目的是節省記憶體並加快推論速度。這是在消費級與單一 GPU 硬體上部署大型模型的主要工具。

## 目錄

- [精度與效能的取捨](#precision-performance)
- [量化方法（NF4、GPTQ、AWQ）](#methods)
- [GGUF 與 EXL2](#formats)
- [KV cache 量化（VRAM 的救星）](#kv-cache)
- [量化感知微調](#qaft)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 精度與效能的取捨

傳統模型使用 **BF16**（16-bit）。量化的目標是把它降到 **8-bit（FP8）**、**4-bit（Int4/NF4）**，甚至是 **1.5-bit（BitNet）**。

| 精度 | 位元數 | 權重大小（8B 模型） | 品質損失 | GPU 相容性 |
|-----------|------|------------------------|--------------|-------------------|
| **BF16** | 16 | 16 GB | 0%（基準） | 所有現代 GPU |
| **FP8** | 8 | 8 GB | < 1% | H100 / B200 / RTX 4090 |
| **4-bit（NF4）**| 4 | 5 GB | 1-2% | 所有現代 GPU |
| **2-bit** | 2 | 2.5 GB | 10-15% | 研究 / 特殊用途 |

---

## 量化方法

### 1. NF4（NormalFloat4）
微調（QLoRA）的黃金標準。它假設權重服從常態分布，並將其映射到一組 16 個數值。

### 2. AWQ（Activation-aware Weight Quantization）
AWQ 不會對所有權重一視同仁地進行量化，而是找出對品質最重要的 **1%「顯著」權重**，並將其保留在較高的精度。
- **優點**：準確度比 GPTQ 更好。

### 3. FP8（多節點標準）
由 Nvidia 的 Transformer Engine 支援的硬體原生量化。
- **它勝出的原因**：它提供了 Int8 的速度，卻擁有 Float16 的動態範圍，使其在訓練與推論時都很穩定。

---

## GGUF 與 EXL2

### GGUF（llama.cpp）
- **部署**：CPU + GPU 卸載。
- **優點**：跨平台（Mac、Linux、Windows）、單一檔案、高度可攜。
- **缺點**：比純 GPU 格式慢。

### EXL2（ExLlamaV2）
- **部署**：僅限 GPU（Nvidia）。
- **優點**：**Nvidia GPU 上最快的 4-bit 格式**。相較於 AutoGPTQ/AWQ 有顯著的效能提升。
- **缺點**：缺乏彈性（僅限 Nvidia）。

---

## KV cache 量化（VRAM 的救星）

在長上下文 RAG（100 萬以上 token）的情境下，**KV cache** 消耗的 VRAM 往往比模型權重本身還多。

- **BF16 KV cache**：200 萬 token ≈ 32GB VRAM（以 8B 模型計）。
- **FP8/Int4 KV cache**：200 萬 token ≈ 8GB 到 16GB VRAM。

**細節**：現代的服務框架（vLLM、SGLang、TensorRT-LLM）現在支援 **串流量化（Streaming Quantization）**，KV cache 會即時被壓縮，讓同一張 GPU 上的並行數能提高 4 倍。

---

## 量化感知訓練（QAT）

QAT 不是在模型訓練*之後*才進行量化（訓練後量化，Post-training Quantization），而是在訓練過程*當中*就模擬量化。
- **結果**：模型會學著去補償損失的精度。
- **現況**：對於小於 3B 參數的模型來說，這是維持其在 4-bit 下仍堪用的必要手段。

---

## 面試問題

### Q：為什麼 QLoRA 要用 NF4，而不是標準的 Float4？

**強答案：**
標準的 Float4 採用固定的網格，無法妥善對應到 LLM 權重的實際分布，而這些權重通常服從以零為中心的常態分布。NF4（NormalFloat4）是一種經過數學最佳化的資料型別，使得每個量化區間（bin）都包含來自常態分布、數量相等的數值。這能避免權重「擠成一團」，並確保模型盡可能保留最多的資訊（熵），因而能達到比標準 4-bit 整數高出許多的準確度。

### Q：AWQ 和 GPTQ 有什麼不同？

**強答案：**
GPTQ 是一種「逐層（Layer-wise）」的量化方法，會最小化權重的均方誤差。AWQ（Activation-aware Weight Quantization）則是「輸入感知（input-aware）」的方法。它會根據一小段校準（calibration）執行過程中實際觀察到的激活值，找出哪些權重最為「顯著」。透過只把這些重要權重（通常是 1%）保留在較高精度、其餘則進行量化，AWQ 能達到比 GPTQ 更好的困惑度（perplexity），尤其是在較小的模型或更激進的量化（例如 3-bit）情況下。

---

## 參考資料
- Dettmers et al. "QLoRA: Efficient Finetuning of Quantized LLMs" (2023)
- Frantar et al. "GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers" (2022)
- Lin et al. "AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration" (2023)

---

*下一篇：[訓練推理模型：RLVR 與 GRPO](08-rlvr-and-reasoning-models.md)*
