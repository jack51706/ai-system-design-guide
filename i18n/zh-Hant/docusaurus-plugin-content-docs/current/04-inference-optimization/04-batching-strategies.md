# 批次處理策略

批次處理是提升 LLM 吞吐量與降低成本的主要手段。服務框架已經從單純的請求層級批次處理，進展到次 token、迭代層級的編排。

## 目錄

- [靜態與動態批次處理](#static-vs-dynamic)
- [連續批次處理](#continuous-batching)
- [飛行中批次處理（Prefill-Decode 融合）](#in-flight-batching)
- [分塊 Prefill 與 RAD-O](#chunked-prefill)
- [面試問題](#interview-questions)
- [參考資料](#references)

---

## 靜態與動態批次處理 {#static-vs-dynamic}

在傳統機器學習（分類）中，我們使用**靜態批次處理（Static Batching）**，要求所有請求必須具有相同的大小，並且一起開始與結束。由於 LLM 的回應長度不固定，這種做法對 LLM 來說效率低落。

---

## 連續批次處理（迭代層級）

連續批次處理（由 Orca 與 vLLM 率先提出）允許在每一個獨立 token 生成步驟結束時，讓新的請求加入批次，並讓已完成的請求離開批次。

| 面向 | 靜態批次處理 | 連續批次處理 |
|--------|-----------------|---------------------|
| **加入/離開** | 僅在開始/結束時 | 任何迭代 |
| **GPU 使用率**| 低（等待最長的請求） | 高（始終保持飽和） |
| **吞吐量** | 1x | **4x - 10x** |
| **延遲** | 對最短請求而言最高 | 平衡 |

---

## 飛行中批次處理（Prefill-Decode 融合） {#in-flight-batching}

過去，服務引擎處理的是一批「Prefill」（運算密集）或者一批「Decode」（記憶體密集）。
**飛行中批次處理（In-Flight Batching）**（TensorRT-LLM）則允許將兩者混合：
- 1 個請求處於 Prefill 階段。
- 15 個請求處於 Decode 階段。
- **好處**：Prefill 請求利用 GPU 閒置的運算核心，而 Decode 請求則利用記憶體頻寬。

---

## 分塊 Prefill 與 RAD-O {#chunked-prefill}

超大上下文提示（1M+ tokens）在 Prefill 階段可能讓一個批次卡住數秒，造成「停滯（stall）」。

**解決方法：分塊 Prefill（Chunked Prefill）**
引擎不再一次 prefill 128k tokens，而是把 prefill 拆成較小的區塊（例如每塊 4k tokens），並將它們與其他使用者正在進行的 Decode 步驟交錯穿插。即使遇到繁重的請求進來，這也能維持穩定的 **TPOT**。

---

## 面試問題 {#interview-questions}

### Q：對 LLM 而言，為什麼連續批次處理優於靜態批次處理？

**優秀回答：**
靜態批次處理迫使一個批次中的所有請求等待最長的那個生成完成（即「最長尾巴」問題）。如果一個使用者要求 500 個 tokens，另一個只要求 5 個 tokens，那麼 GPU 會為這位只要 5 個 token 的使用者閒置 495 個週期。連續批次處理則允許這位 5-token 使用者的請求在產出最後一個 token 後立即離開 GPU，釋出 VRAM 與運算插槽給佇列中的新請求。這能將整個硬體叢集的「每秒 token 數」最大化。

### Q：LLM 服務中的「停滯（stall）」是什麼？分塊 Prefill 又如何緩解它？

**優秀回答：**
當一個超大的新請求進來，而它的 Prefill 階段（運算需求極高）需要 2 至 3 秒才能完成時，就會發生「停滯」。在這段期間，GPU 忙於 prefill，以致於無法為處於「Decode」階段的既有使用者生成 tokens，導致他們的 TPOT 飆升。分塊 Prefill 把那 3 秒的 prefill 拆成許多 200ms 的小「區塊」，先處理一個區塊，然後為其他所有人做一輪解碼，接著再回到下一個 prefill 區塊。這確保所有使用者都能獲得一致且流暢的體驗。

---

## 參考資料 {#references}
- Yu et al. "Orca: A Distributed Serving System for [Transformer] Models" (2022)
- NVIDIA. "TensorRT-LLM: In-Flight Batching" (2023)
- vLLM Project. "Iteration-Level Scheduling" (2023)

---

*下一篇：[PagedAttention](05-paged-attention.md)*
