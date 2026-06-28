# 注意力機制

注意力是讓 transformer 得以成立的核心創新。本章涵蓋數學基礎、各種變體，以及對系統設計與面試而言不可或缺的最佳化技巧。

## 目錄

- [注意力基礎](#attention-fundamentals)
- [縮放點積注意力](#scaled-dot-product-attention)
- [多頭注意力](#multi-head-attention)
- [注意力模式](#attention-patterns)
- [高效注意力變體](#efficient-attention-variants)
- [Flash Attention（v2 與 v3）](#flash-attention)
- [多頭潛在注意力（MLA）](#multi-head-latent-attention-mla)
- [KV cache 最佳化與上下文快取](#kv-cache-optimizations)
- [實務影響](#practical-implications)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 注意力基礎

### 核心概念

注意力讓序列中的每個位置都能從所有其他位置蒐集資訊。與遞迴（一步一步傳遞資訊）不同，注意力建立的是直接連結。

**給分散式系統工程師的心智模型：**
- RNN：沿著一條鏈傳遞訊息
- 注意力：發布／訂閱（pub/sub），每個節點都能查詢其他任一節點

### Query、Key、Value 框架

注意力使用輸入的三種投影：

| 組件 | 角色 | 類比 |
|-----------|------|---------|
| Query（Q） | 我在找什麼？ | 搜尋查詢 |
| Key（K） | 我包含什麼？ | 文件索引 |
| Value（V） | 我貢獻什麼？ | 文件內容 |

```python
# Input: x of shape [batch, seq_len, d_model]

Q = x @ W_q  # [batch, seq_len, d_k]
K = x @ W_k  # [batch, seq_len, d_k]
V = x @ W_v  # [batch, seq_len, d_v]
```

---

## 縮放點積注意力

最基本的注意力運算：

```python
def scaled_dot_product_attention(Q, K, V, mask=None):
    d_k = Q.shape[-1]
    
    # Compute attention scores
    scores = Q @ K.transpose(-2, -1)  # [batch, seq_len, seq_len]
    scores = scores / math.sqrt(d_k)  # Scale
    
    # Apply mask (for causal attention)
    if mask is not None:
        scores = scores.masked_fill(mask == 0, float('-inf'))
    
    # Convert to probabilities
    attention_weights = F.softmax(scores, dim=-1)
    
    # Weighted sum of values
    output = attention_weights @ V
    
    return output, attention_weights
```

### 為什麼要除以 d_k 的平方根？

**面試常考題**：這題在測試你對數值的直覺。

若不做縮放，點積會隨維度增長：
- 對於維度為 d 的隨機單位向量 q 與 k
- E[q . k] = 0，但 Var[q . k] = d
- 標準差 = sqrt(d)

當 d 很大時（512 以上），點積可能變得非常大或非常小。對極大數值做 softmax 會逼近 one-hot，造成梯度消失。

```python
# Demonstration
import numpy as np

d = 512
q = np.random.randn(d)
k = np.random.randn(d)

unscaled = np.dot(q, k)      # Magnitude ~ sqrt(512) ~ 22
scaled = unscaled / np.sqrt(d)  # Magnitude ~ 1
```

### 因果遮罩（Causal Masking）

對於自回歸生成，每個位置只能注意到先前的位置：

```python
def create_causal_mask(seq_len):
    # Lower triangular matrix
    mask = torch.tril(torch.ones(seq_len, seq_len))
    return mask

# Example for seq_len=4:
# [[1, 0, 0, 0],
#  [1, 1, 0, 0],
#  [1, 1, 1, 0],
#  [1, 1, 1, 1]]
```

mask=0 的位置會得到負無限大的分數，經過 softmax 後變成 0。

---

## 多頭注意力

不使用單一注意力函數，而是使用多個「頭（head）」，分別注意不同面向：

```python
class MultiHeadAttention(nn.Module):
    def __init__(self, d_model, num_heads):
        super().__init__()
        self.num_heads = num_heads
        self.d_k = d_model // num_heads
        
        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_o = nn.Linear(d_model, d_model)
    
    def forward(self, x, mask=None):
        batch_size, seq_len, d_model = x.shape
        
        # Project to Q, K, V
        Q = self.W_q(x)  # [batch, seq_len, d_model]
        K = self.W_k(x)
        V = self.W_v(x)
        
        # Reshape to multiple heads
        Q = Q.view(batch_size, seq_len, self.num_heads, self.d_k).transpose(1, 2)
        K = K.view(batch_size, seq_len, self.num_heads, self.d_k).transpose(1, 2)
        V = V.view(batch_size, seq_len, self.num_heads, self.d_k).transpose(1, 2)
        # Now: [batch, num_heads, seq_len, d_k]
        
        # Attention per head
        attn_output, _ = scaled_dot_product_attention(Q, K, V, mask)
        
        # Concatenate heads
        attn_output = attn_output.transpose(1, 2).contiguous()
        attn_output = attn_output.view(batch_size, seq_len, d_model)
        
        # Final projection
        output = self.W_o(attn_output)
        return output
```

**為什麼要用多個頭？**
1. 不同的頭學到不同的模式（語法、語意、共指）
2. 提供表徵多樣性（集成效應）
3. 讓各個頭之間能平行計算

### 頭數的常見配置

| 模型 | d_model | 頭數 | 每頭 d_k |
|-------|---------|-------|--------------|
| BERT-base | 768 | 12 | 64 |
| GPT-2 | 768 | 12 | 64 |
| GPT-3 175B | 12288 | 96 | 128 |
| Llama 2 70B | 8192 | 64 | 128 |

64 或 128 的 d_k 在不同模型規模間出奇地一致。

---

## 注意力模式

### 注意力學到了什麼

不同的頭專精於不同的模式：

| 模式類型 | 捕捉到的內容 | 範例 |
|--------------|------------------|---------|
| 位置型 | 相鄰的 token | 下一個／上一個詞 |
| 語法型 | 文法關係 | 主詞與動詞 |
| 語意型 | 意義關係 | 共指 |
| 分隔型 | 標點、結構 | 章節邊界 |
| 罕見型 | 不常見的模式 | 罕見詞複製 |

### 將注意力視覺化

注意力權重可以視覺化成熱力圖，顯示哪些位置注意到哪些位置：

```
Query positions (rows) vs Key positions (columns)

"The cat sat on the mat"

         The  cat  sat  on   the  mat
The     [□    ○    ○    ○    ○    ○ ]
cat     [●    □    ○    ○    ○    ○ ]
sat     [○    ●    □    ○    ○    ○ ]
on      [○    ○    ●    □    ○    ○ ]
the     [○    ○    ○    ○    □    ○ ]
mat     [○    ●    ○    ●    ●    □ ]

● = high attention, ○ = low attention
```

「mat」強烈注意到「cat」（語意）、「on」（語法）以及「the」（限定詞）。

---

## 高效注意力變體

標準注意力在序列長度上是 O(n^2)。許多變體可降低這個複雜度：

### 稀疏注意力（Sparse Attention）

只注意一部分位置，而非全部：

| 變體 | 模式 | 複雜度 | 範例 |
|---------|---------|------------|---------|
| 區域型（Local） | 每個位置周圍的視窗 | O(n * w) | Longformer |
| 跨步型（Strided） | 每第 k 個位置 | O(n^2 / k) | Sparse Transformer |
| 全域型（Global） | 特殊 token 注意所有位置 | O(n * g) | Longformer、BigBird |
| 區塊型（Block） | 區塊對角注意力 | O(n * b) | BigBird |

**Longformer 模式：**
```
Local window + Global tokens

[G] [L] [L] [L] [L] [G] [L] [L] [L] [L]

G: Global tokens (attend to/from all)
L: Local tokens (attend within window)
```

### 線性注意力（Linear Attention）

以可線性化的替代方案取代 softmax：

```python
# Standard attention (quadratic)
attention = softmax(Q @ K.T) @ V

# Linear attention approximation
attention = (Q @ (K.T @ V))  # Associativity trick
```

**變體：**
- Performer：隨機特徵近似
- Linear Transformer：elu(Q) @ (elu(K).T @ V)

**取捨：** 速度更快，但品質會下降，尤其是需要精確注意力的任務。

### 複雜度比較

| 方法 | 時間 | 空間 | 品質 | 備註 |
|--------|------|-------|---------|-------|
| 標準 | O(n^2) | O(n^2) | 最佳 | 基準 |
| 稀疏（Longformer） | O(n) | O(n) | 接近最佳 | 適合長文件 |
| 線性（Performer） | O(n) | O(n) | 下降 | 適合超長序列 |
| Flash Attention | O(n^2) | O(n) | 最佳 | 兩者兼得 |

---

## Flash Attention

Flash Attention 是目前最先進的實作，能在計算精確注意力的同時達到 O(n) 記憶體用量。

### 它解決的問題

標準注意力需要實際生成出 n x n 的注意力矩陣：
- 8K 上下文：64M 個浮點數 = 每層每頭 256 MB
- 100K 上下文：10B 個浮點數 = 每層每頭 40 GB

這個記憶體需求會限制批次大小與上下文長度。

### 運作方式

Flash Attention 採用分塊（tiling）與重算（recomputation），以避免儲存完整的注意力矩陣：

```
Standard: Q, K -> Attention Matrix (n x n) -> Output
Flash:    Q, K -> Tiles (block_size x block_size) -> Incremental Output
```

**關鍵概念：**
1. 以可塞進 SRAM 的區塊為單位處理注意力
2. 絕不在 HBM 中實際生成完整的注意力矩陣
3. 在反向傳播時重新計算注意力（比從 HBM 載入更快）

### 效能影響

### FlashAttention-2（工作分割）
針對 A100／H100 最佳化，透過改善跨頭與跨序列長度的平行度來提升效能。

### FlashAttention-3（FP8 與 H100 最佳化）
**目前 H100／B200 叢集的標準：**
- **非同步執行**：在 H100 上利用 TMA（Tensor Memory Accelerator）讓 GEMM（矩陣乘法）與 softmax 運算重疊進行。
- **FP8 支援**：原生支援 FP8 精度，相較 FP16 將吞吐量翻倍，同時透過隨機捨入（stochastic rounding）維持注意力的準確度。
- **加速幅度**：在長上下文 prefill 上，比 FlashAttention-2 快約 1.5x 至 2.0x。

---

## 多頭潛在注意力（MLA）

由 DeepSeek（V2／V3）提出，**MLA 是在極端 KV cache 壓力下取代 GQA 的現代方案**。

MLA 不只是把頭分組，而是在把 Key 與 Value 向量存入快取之前，先將它們壓縮到一個**低維度潛在空間**。

```
Query (Up-projected) ────────┐
                             ▼
Key, Value (Down-projected) ─▶ [Low-dim Latent Cache] ─▶ [Output]
                             ▲
                             └─ Projection Matrices
```

| 指標 | MHA | GQA | MLA（2025 年 12 月） |
|--------|-----|-----|----------------|
| KV cache 大小 | 100% | 12.5% | **約 5%** |
| 品質 | 基準 | 接近基準 | **優於 GQA** |
| 延遲 | 基準 | 較快 | **最快（降低 I/O）** |

**MLA 勝出的原因**：它使用「解耦旋轉位置嵌入（Decoupled Rotary Positional Embeddings）」，讓壓縮後的潛在 KV 無需解碼即可重複使用，在長上下文生成期間省下大量記憶體頻寬。

---

## KV cache 最佳化與上下文快取

### 上下文快取（系統層級）
API 供應商（OpenAI、Gemini、Anthropic）現在都提供 **Context Caching（上下文快取）**。
- **運作方式**：預先計算並儲存某段長「前綴」的 KV 張量（例如一本 100k token 的法律書）。
- **效益**：對於重複的前綴，可將 TTFT（Time to First Token，首個 token 時間）降低 90%，成本降低 50% 至 90%。

### 滑動視窗注意力（SWA）
用於 Mistral／Gemma 模型，將注意力深度限制在固定視窗內（例如 4096 個 token），避免 KV cache 無止盡地增長。

### 多查詢注意力（MQA）

讓所有 query 頭共用單一的 K 與 V：

```python
# Standard MHA
Q: [batch, num_heads, seq, d_k]  # 32 heads
K: [batch, num_heads, seq, d_k]  # 32 separate K
V: [batch, num_heads, seq, d_k]  # 32 separate V

# MQA
Q: [batch, num_heads, seq, d_k]  # 32 heads
K: [batch, 1, seq, d_k]          # 1 shared K
V: [batch, 1, seq, d_k]          # 1 shared V
```

**效果：** KV cache 大小縮減 32 倍，伴隨一些品質損失。

### 分組查詢注意力（GQA）

讓多組 query 頭共用 K 與 V：

```python
# GQA with 8 KV heads for 64 query heads (8:1 ratio)
Q: [batch, 64, seq, d_k]  # 64 query heads
K: [batch, 8, seq, d_k]   # 8 KV heads
V: [batch, 8, seq, d_k]   # 8 KV heads

# Each KV head serves 8 query heads
```

**效果：** KV cache 縮減 8 倍，品質損失極小。

**使用 GQA 的模型：**
- Llama 2 70B：8 個 KV 頭對應 64 個 query 頭
- Mistral 7B：8 個 KV 頭對應 32 個 query 頭
- Gemma：多種配置

### 比較

| 注意力 | KV cache | 品質 | 模型 |
|-----------|----------|---------|--------|
| MHA | 完整 | 最佳 | GPT-3 |
| GQA | 通常為 1/8 | 接近最佳 | Llama 2、Mistral |
| MQA | 1/n_heads | 下降 | PaLM、Falcon |

---

## 實務影響

### 對系統設計而言

1. **批次大小與上下文的取捨：**
   - 總 GPU 記憶體 = 模型 + KV cache * batch_size
   - 上下文越長，批次就越小
   - GQA 模型能服務更多並行請求

2. **延遲預算的分配：**
   - 注意力是 O(n^2) 計算，使用 Flash 則為 O(n)
   - Prefill（處理提示）隨提示長度擴展
   - Decode（生成）隨生成長度加提示長度擴展

3. **記憶體頻寬瓶頸：**
   - 生成通常受記憶體限制
   - 每個 token 都要載入 KV cache，這部分主導開銷
   - 較大的批次能攤平這項成本

### Prefill 與 Decode

| 階段 | 計算模式 | 瓶頸 |
|-------|-----------------|------------|
| Prefill | 處理所有輸入 token | 計算（GPU 核心） |
| Decode | 一次生成一個 token | 記憶體（頻寬） |

這就是為什麼 TTFT（首個 token 時間）與 TPS（每秒 token 數）要分開衡量。

### 上下文長度擴展

| 上下文 | 注意力計算量 | KV cache（Llama 70B） |
|---------|-------------------|---------------------|
| 4K | 基準 | 10.7 GB |
| 8K | 4x | 21.5 GB |
| 32K | 64x | 86 GB |
| 128K | 1024x | 344 GB |

長上下文需要：
- Flash Attention（記憶體高效）
- GQA 或 MQA（較小的 KV cache）
- 可能還需要模型平行化

---

## 面試問題

### Q：請解釋注意力機制，以及它為何呈二次方擴展。

**強力解答：**
注意力會計算所有位置之間的兩兩交互作用。對於 n 個位置：

1. Q @ K^T 產生一個 n x n 的分數矩陣
2. 每個注意力分數都是一個 query 與一個 key 的點積
3. 總計：n^2 次點積

這在序列長度上是二次方的。以 8K token 為例，每層每頭就是 6,400 萬個兩兩分數。以 128K token 為例，則是 160 億。

二次方擴展限制了上下文長度。解法包括：
- Flash Attention：O(n^2) 計算但 O(n) 記憶體
- 稀疏注意力：透過只注意子集達到 O(n)
- 線性注意力：O(n) 近似

### Q：什麼是 KV cache，為什麼它對服務（serving）至關重要？

**強力解答：**
在自回歸生成期間，我們一次產生一個 token。若沒有快取，每產生一個新 token 都得重新計算所有先前位置的 K 與 V。

KV cache 會儲存先前位置的 K 與 V 張量。每產生一個新 token 時：
1. 只為新位置計算 Q、K、V
2. 將新的 K、V 附加到快取
3. 對完整的快取 K、V 做注意力

這讓投影計算的每 token 複雜度從 O(n) 降到 O(1)。

代價是記憶體：KV cache 隨序列長度線性增長。以 Llama 70B 在 8K 上下文為例，每個請求約需 21 GB。這直接限制了批次大小與吞吐量。

GQA 與 MQA 透過讓 query 頭共用 K、V 來降低這項成本。

### Q：比較 MHA、GQA 與 MQA。

**強力解答：**
| 變體 | K,V 頭數 | KV cache | 品質 | 使用情境 |
|---------|-----------|----------|---------|----------|
| MHA | 等於 Q 頭數 | 完整 | 最佳 | 訓練、品質至上 |
| GQA | 少於 Q 頭數 | 縮減 | 接近 MHA | 生產環境服務 |
| MQA | 1 | 最小 | 下降 | 記憶體受限 |

MHA：每個 query 頭都有自己的 K 與 V。品質最佳但 KV cache 最大。

GQA：多組 query 頭共用 K 與 V。Llama 2 使用 8 個 KV 頭對應 64 個 query 頭（8:1 比例）。快取縮小 8 倍，品質損失極小。

MQA：所有 query 頭共用一組 K 與 V。記憶體節省最大，但品質有可量測的下降。PaLM 採用此法。

對於服務而言，GQA 是最佳取捨。它能支援更大的批次（更高吞吐量），品質又幾乎與 MHA 相同。

### Q：Flash Attention 如何達到 O(n) 記憶體？

**強力解答：**
標準注意力會在 GPU 記憶體中實際生成完整的 n x n 注意力矩陣。Flash Attention 透過以下方式避免這點：

1. **分塊（Tiling）：** 以可塞進晶片內 SRAM 的 Q 與 K 區塊為單位處理
2. **線上 softmax（Online softmax）：** 增量式地計算 softmax，無需儲存所有分數
3. **重算（Recomputation）：** 在反向傳播時重新計算注意力，而非載入已儲存的值

關鍵洞察在於，GPU SRAM（每個 SM 20 MB）比 HBM（80 GB）快 10 倍。透過在 SRAM 中做更多算術運算、減少 HBM 讀寫，Flash Attention 既更快又更省記憶體。

結果是精確的注意力（並非近似），達到 O(n) 記憶體與 2 至 4 倍加速。

---

## 參考資料

- Vaswani et al. "Attention Is All You Need" (2017)
- Dao et al. "FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness" (2022)
- Dao "FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning" (2023)
- Beltagy et al. "Longformer: The Long-Document Transformer" (2020)
- Ainslie et al. "GQA: Training Generalized Multi-Query Transformer Models" (2023)
- Shazeer "Fast Transformer Decoding: One Write-Head is All You Need" (MQA, 2019)
- [Flash Attention Repository](https://github.com/Dao-AILab/flash-attention)

---

*上一篇：[Tokenization 深入解析](02-tokenization-deep-dive.md) | 下一篇：[Transformer 架構](04-transformer-architecture.md)*
