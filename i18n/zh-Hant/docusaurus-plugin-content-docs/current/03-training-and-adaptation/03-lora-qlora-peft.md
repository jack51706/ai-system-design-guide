# LoRA、QLoRA 與 PEFT

參數高效微調（Parameter-Efficient Fine-Tuning，PEFT）是調整 LLM 的業界標準。本章涵蓋 LoRA 與其他 PEFT 方法的運作機制及進階變體。

## 目錄

- [PEFT 革命](#the-peft-revolution)
- [LoRA 運作機制](#lora-mechanics)
- [QLoRA：4-bit 微調](#qlora)
- [進階變體（DoRA、Vera、RS-LoRA）](#advanced-variants)
- [Multi-LoRA 服務（Adapters）](#multi-lora-serving)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## PEFT 革命 {#the-peft-revolution}

對前沿模型（GPT-5.5、Claude Opus 4.7、Llama 4 405B）進行完整微調，對多數企業而言在經濟上並不可行。PEFT 帶來以下優勢：
1. **記憶體效率**：在單張 A100 上訓練 70B 模型。
2. **速度**：僅更新不到 1% 的權重，訓練速度提升 2 倍。
3. **模組化**：在共用的基礎模型上抽換「技能」（adapters），無需重新載入權重。

---

## LoRA 運作機制 {#lora-mechanics}

LoRA（Low-Rank Adaptation，低秩適應）將可訓練的秩分解矩陣注入 transformer 各層之中。

```python
# The LoRA Equation for a Weight Matrix W:
h = Wx + (BA)x * (alpha/r)
```
- **W**：預訓練權重（凍結，Gradient = None）
- **A、B**：LoRA adapters（可訓練）
- **r**：秩（例如 8、16、64）
- **alpha**：縮放因子（通常為 2 * rank）

### 核心細節：目標模組（Target Modules）
過去我們只針對 query/value 投影（`q_proj`、`v_proj`）。
**現代標準**：針對**所有**線性層（`q, k, v, o, gate, up, down`），即使在較低的秩之下，也能達到最高的穩定性與效能。

---

## QLoRA：4-bit 微調 {#qlora}

QLoRA 將效率推得更高，把基礎模型量化為 4-bit（NF4），同時維持 16-bit 的梯度。

| 最佳化 | 方法 | 效益 |
|--------------|--------|---------|
| **NF4 量化** | Normalized Float 4 | 比標準 Int4 有更佳的資訊密度 |
| **Double Quant** | 對量化常數再做量化 | 每個模型節省約 0.5 GB VRAM |
| **Paging** | 統一記憶體（Nvidia） | 透過溢位至 CPU RAM 來避免 OOM |

---

## 進階變體

### 1. DoRA（Weight-Decomposed Low-Rank Adaptation）
DoRA 將權重更新拆解為**幅度（Magnitude）**與**方向（Direction）**。
- **結果**：學習速度比 LoRA 快 2 倍，表現更接近完整微調。
- **致勝原因**：它讓模型能夠獨立調整「要改變多少」與「正在改變什麼」。

### 2. Vera（Vector-based Random Aggregation）
Vera 不使用低秩矩陣 `A` 與 `B`，而是改用固定的隨機投影，搭配一個小型的可訓練向量。
- **效率**：相較於 LoRA，adapter 大小縮減**10 倍**。
- **使用情境**：大規模的 Multi-LoRA 服務。

### 3. RS-LoRA（Rank-Stabilized LoRA）
使用 `alpha / sqrt(r)` 作為縮放因子。
- **效益**：讓你能提高秩（到 256 以上），而不會使模型變得不穩定，也不需要降低學習率。

---

## Multi-LoRA 服務（Adapters） {#multi-lora-serving}

生產環境系統現在會以單一基礎模型（例如 Llama 4 70B）提供服務，並在同一個批次中動態抽換 adapters。

```python
# vLLM/LMCache Multi-LoRA Pattern:
# Request 1 -> Base + Finance_Adapter
# Request 2 -> Base + Legal_Adapter
# Request 3 -> Base + Medical_Adapter
```
**關鍵技術**：**Continuous Batching + PagedAttention v3** 讓你能服務 100 個以上的 adapters，相較於基礎模型僅增加 5 至 10% 的延遲開銷。

---

## 面試問題 {#interview-questions}

### Q：為什麼 LoRA 的 alpha 參數通常設為秩的 2 倍？

**優秀答案：**
`alpha` 參數是 LoRA 更新的縮放因子。當我們初始化 LoRA 矩陣時，B 通常以零初始化，A 則為隨機值。在訓練過程中，更新的幅度取決於秩 `r`。透過設定 `alpha=2r`（或任何常數），我們確保即使日後決定改變秩（例如從 8 改為 16），也不需要重新調整學習率。縮放因子 `alpha/r` 會將更新幅度相對於學習率做正規化。

### Q：什麼是 DoRA？為什麼你會選擇它而非標準 LoRA？

**優秀答案：**
DoRA（Weight-Decomposed Low-Rank Adaptation）是 2024 年的技術，它將預訓練權重的更新拆解為幅度與方向兩個分量，類似於 Weight Normalization。標準 LoRA 會同時更新幅度與方向，DoRA 則讓兩者能獨立學習。從實證來看，DoRA 展現出明顯更佳的收斂性與更高的準確率，即使在低秩之下也常能比擬全參數微調，因此成為高風險領域適應任務的首選。

---

## 參考資料 {#references}
- Hu et al. "LoRA: Low-Rank Adaptation of Large Language Models" (2021)
- Liu et al. "DoRA: Weight-Decomposed Low-Rank Adaptation" (2024)
- Dettmers et al. "QLoRA: Efficient Finetuning of Quantized LLMs" (2023)

---

*下一篇：[RLHF 與 DPO](04-rlhf-and-dpo.md)*
