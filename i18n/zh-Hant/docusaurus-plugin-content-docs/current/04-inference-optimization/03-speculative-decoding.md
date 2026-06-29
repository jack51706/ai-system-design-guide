# 推測解碼（Speculative Decoding）

推測解碼是一項如今已成標準的技術，它讓大型模型（LLM）能在每一次前向傳遞中生成多個 token，有效突破了循序解碼時的記憶體頻寬瓶頸。

## 目錄

- [核心概念](#the-core-concept)
- [Draft-Verify 範式](#draft-verify)
- [Medusa 與多 Token 預測頭](#medusa)
- [前瞻解碼（Lookahead Decoding）](#lookahead-decoding)
- [硬體感知推測](#hardware-aware)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 核心概念 {#the-core-concept}

LLM 解碼屬於記憶體受限（memory-bound）：載入 140GB 的權重（70B 模型）只為產生一個 2 byte 的 token，效率非常低落。
**推測解碼**改用一種成本較低的方法去「猜測」接下來的 $N$ 個 token，再用大型模型在單次平行的「Prefill 風格」傳遞中一次驗證全部結果。

---

## Draft-Verify 範式 {#draft-verify}

1. **草擬（Drafting）**：一個小而快的「Draft Model」（例如 1B 或 7B）生成 $K$ 個候選 token。
2. **驗證（Verification）**：大型的「Target Model」一次處理全部 $K$ 個 token。
3. **接受（Acceptance）**：利用 target model 的 logits 來接受或拒絕候選 token。若第 $i$ 個 token 被拒絕，其後的所有 token 都會被丟棄。

| 模型 | 大小 | 速度 | 每 token 延遲 |
|-------|------|-------|-------------------|
| **Draft** | 1B | 快 | 5ms |
| **Target**| 70B| 慢 | 50ms |
| **Speculative**| - | **快**| **15ms - 25ms** |

**最終結果**：以實際時間（wall-clock time）計算可達 2 倍到 3 倍的加速，且**品質完全沒有任何損失**。

---

## Medusa 與多 Token 預測頭 {#medusa}

業界已逐漸捨棄獨立的 draft model（會增加 VRAM 開銷），轉向採用 **Medusa Heads**。

- **它是什麼**：附加在 target model 最後一層之上的額外「預測頭」（小型線性層）。
- **運作方式**：不再只預測 token $t+1$，而是讓 Head 1 預測 $t+1$、Head 2 預測 $t+2$，以此類推。
- **好處**：不需要第二個模型；以極小的 VRAM 增量換取 2.5 倍加速。

---

## 前瞻解碼（Lookahead Decoding） {#lookahead-decoding}

另一種替代做法，它利用模型自身過去的隱藏狀態（hidden states）來尋找重複出現的模式（n-grams），藉此「向前看」並預測未來的 token。
- **最適用於**：結構化資料、程式碼，以及高度重複的技術寫作。

---

## 硬體感知推測 {#hardware-aware}

前沿的服務框架（vLLM、TensorRT-LLM）現在會採用**動態草擬長度（Dynamic Draft Lengths）**。
- 若 GPU 使用率偏低（小批次），系統會增加 draft token 的數量（$K$）。
- 若 GPU 已飽和（大批次），則會減少 $K$，以吞吐量優先於個別請求的延遲。

---

## 面試問題 {#interview-questions}

### 問：為什麼推測解碼在高溫度（high-temperature）的創意寫作上效果不佳？

**理想答案：**
推測解碼仰賴「Draft Model」能夠準確預測「Target Model」會說出什麼。在高溫度的創意寫作中，機率分布較為「平坦」，模型會被鼓勵去挑選較不可能的 token。這會導致**接受率（Acceptance Rate）**非常低（draft model 的猜測經常被拒絕）。當一個猜測被拒絕時，target model 的平行傳遞就成了浪費掉的運算，系統會退回到標準的循序解碼，反而額外增加了 draft model 帶來的延遲開銷。

### 問：Medusa 與傳統推測解碼有何不同？

**理想答案：**
傳統推測解碼需要一個獨立的小型模型（Draft Model），它會佔用額外的 VRAM，並且需要自行管理 KV cache。Medusa 則是改為在基礎模型的最終隱藏狀態之上加裝多個「預測頭」。每個預測頭都被訓練去預測一個不同的偏移量（例如下一個 token、下下個、再下下個）。這消除了對第二個模型的需求，並將步驟之間的通訊開銷降到最低，因為所有「猜測」都是在同一個基礎模型架構內、於單次前向傳遞中生成的。

---

## 參考資料 {#references}
- Chen et al. "Accelerating Transformer Decoding via Speculative Decoding" (2023)
- Cai et al. "Medusa: Simple LLM Acceleration via Multiple Decoding Heads" (2024)
- Fu et al. "Lookahead Decoding" (2024)

---

*下一篇：[批次處理策略](04-batching-strategies.md)*
