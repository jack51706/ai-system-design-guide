# 案例研究：自動化 LLM 紅隊演練與持續安全測試平台

一家出貨多個 LLM 驅動產品的公司，為自家模型打造了一套內部的 breach-and-attack-simulation 平台：攻擊者 LLM 每次發布都會產生並變異數以萬計的對抗性探測（probe），一個 LLM judge 依一套危害分類法為違規行為評分，再由一道 CI 閘門阻擋任何在安全上發生回歸的發布。決定性的限制條件是：攻擊面是無界且非穩態的（新的 jailbreak 每週都會冒出來），所以靜態測試集會腐朽，你需要自動化、會持續演進的涵蓋範圍。這是[提示注入防禦案例研究](26-prompt-injection-defense.md)中那套單一代理防禦的進攻方對應版本。

## 商業問題

這家公司在前沿模型上營運一個聊天助理、兩個使用工具的代理，以及一個 RAG 說明中心。每一個介面都是一個獨立的攻擊目標：一次誘出有害內容的 jailbreak、一次劫持代理工具的間接提示注入、一次洩漏另一位使用者 PII 的事件，或一次登上社群媒體的政策違規。領導層要的是在每次發布之前的保證，而不是在某位客戶或某位記者找到破口之後。天真的做法，也就是手寫一套幾百個已知不良 prompt、每季跑一次的測試套件，一碰上現實就潰敗：防禦一旦修補了那些特定字串，真正的攻擊者就會用一句該套件從未收錄的措辭繞過去。一份固定的語料庫，量到的是昨天的攻擊。

團隊以紅隊看待一個網路的方式重新定錨這個問題：目標不是通過一張檢核表，而是持續模擬一個會適應的對手。他們打造了一個平台，用模型產生攻擊、用演化式搜尋加以變異，再用一個 judge 為其評分，好讓涵蓋範圍隨威脅一樣快地成長與位移。它在每一次模型、prompt 與護欄變更時於 CI 中跑數以千計的探測，並在每晚跑數以萬計。發現的問題會回饋給護欄與 eval 團隊，並成為永久的 regression test。整件事都被框定並治理為經授權的內部防禦性安全測試，秉持 [Perez et al. 的《Red Teaming Language Models with Language Models》](https://arxiv.org/abs/2202.03286)與 [Anthropic 的紅隊計畫](https://arxiv.org/abs/2209.07858)的精神。

來自 2026 年 6 月現實的限制條件：

- 四個生產環境的 LLM 介面（聊天、兩個握有真實工具的代理、RAG），每一個都是獨立的攻擊面；單單一次成功的 jailbreak 就是一起品牌與安全事件。
- 新的公開 jailbreak 家族每週都會出現（Crescendo 多回合、many-shot、編碼、低資源語言、透過工具輸出的注入）；任何靜態測試集在一兩次發布之內就會被繞過。
- 2026 年的前沿模型（Claude Opus 4.8、GPT-5.6、Gemini 3.1 Pro）對天真的攻擊不屑一顧，但[仍會敗給精心製作的多回合與注入攻擊](https://genai.owasp.org/llm-top-10/)；穩健性不是一個你買得到的特性。
- 攻擊者生成、目標呼叫，以及 LLM judging 全都要花錢：一次完整的每晚戰役是 40,000 到 120,000 次探測，每一次至少耗掉三次模型呼叫（生成、目標、judge）。
- 代理目標握有真實工具（電子郵件、程式碼執行、資料存取），所以攻擊執行必須完全隔離在 sandbox 中；一次紅隊探測絕不能造成真實的副作用。
- 標準面的壓力：[NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework)與前沿模型的承諾，期待的是持續量測與有文件紀錄的紅隊演練，而非一次性的認證。
- 雙重用途的敏感性：攻擊語料庫與任何有效的 jailbreak 都是攻擊性素材，必須留在內部、受存取控管，並負責任地揭露。
- 發布節奏：模型、prompt 與護欄每週都在變，所以安全測試必須在 CI 中以有上限的實際耗時（wall-clock）執行，而不是當成一次每季的稽核。

## 架構

```mermaid
flowchart TB
    TRIG[觸發 模型、prompt、護欄變更、每晚] --> ORCH[戰役編排器]
    ORCH --> LIB[攻擊策略庫 jailbreak 家族]
    LIB --> GEN[攻擊者 LLM 生成與變異]
    SEED[回歸語料庫 過往成功攻擊] --> GEN

    subgraph Search["演化式搜尋"]
        GEN --> EVO[變異與選擇引擎]
        EVO --> GEN
    end

    EVO --> ADAPT[目標轉接器]

    subgraph Targets["受測系統"]
        ADAPT --> MDL[裸模型端點]
        ADAPT --> PRMT[Prompt 版本加上護欄]
        ADAPT --> AGENT[Sandbox 中的完整代理]
    end

    MDL --> JUDGE[LLM Judge 各危害類別違規]
    PRMT --> JUDGE
    AGENT --> JUDGE

    JUDGE --> HUMAN[人工審查 含糊與高嚴重性]
    JUDGE --> COV[涵蓋率追蹤器 各分類法 ASR]
    HUMAN --> FIND[發現儲存庫 去重、嚴重性、重現]
    COV --> FIND

    FIND --> EVO
    FIND --> GATE[CI 安全閘門]
    FIND --> GUARD[護欄與 Eval 團隊]
    GUARD --> VAULT[(受存取控管的語料庫保險庫)]
```

### 元件

| 層級 | 技術 | 用途 |
|-------|------|---------|
| 編排器 | Airflow 風格的排程器加上工作佇列 | 把戰役界定到某個目標版本與分類法預算 |
| 策略庫 | 參數化的攻擊模板與變異運算子 | 把已知的 jailbreak 家族編碼為可重用的運算子 |
| 攻擊者 LLM | Llama 4 與 DeepSeek V4（可操控）加上一個受治理的前沿模型 | 大量生成並變異對抗性探測 |
| 搜尋引擎 | 遺傳／樹狀搜尋（[PAIR](https://arxiv.org/abs/2310.08419)、[TAP](https://arxiv.org/abs/2312.02119)） | 依適應度朝弱點演化探測 |
| 目標轉接器 | 涵蓋模型、prompt 與代理目標的統一用戶端 | 把探測派送到任何受測系統 |
| Sandbox | 完全隔離的容器、mock 或 allowlist 的工具 | 以零真實副作用執行代理目標 |
| Judge | Claude Opus 4.8 評分準則 judge 加上 Haiku 4.5 預過濾器 | 依危害類別分類違規 |
| 涵蓋率追蹤器 | 分類法資料庫（[MITRE ATLAS](https://atlas.mitre.org/)、[OWASP LLM Top 10](https://genai.owasp.org/llm-top-10/)） | 各類別 ASR，而非單一安全分數 |
| 發現儲存庫 | 去重加上嚴重性加上最小化重現 | 路由給護欄與 eval 團隊 |
| CI 閘門 | 每次 AI 介面變更的流水線步驟 | 阻擋在安全上發生回歸的發布 |
| 語料庫保險庫 | 受存取控管、加密的儲存 | 讓雙重用途的攻擊素材留在內部 |

### 資料流

1. 一個觸發（模型發布、prompt 變更、護欄變更，或每晚排程）建立一個戰役，界定到單一目標版本與一份各分類法的探測預算。
2. 編排器用策略庫的模板，加上從回歸語料庫取出的過往成功攻擊樣本，為每一個危害類別播下種子。
3. 攻擊者 LLM 把種子擴展並變異成候選探測；演化引擎排程接續的一代又一代。
4. 目標轉接器把每一個探測派送到受測系統：一個裸模型端點、一個特定的 prompt 加護欄版本，或在 sandbox 內以受監測、mock 過的工具執行的完整代理。
5. 回應（對代理而言，還有完整的工具呼叫追蹤紀錄）回傳並送進 judge；一個划算的 `Haiku 4.5` 預過濾器在昂貴的 `Opus 4.8` 評分準則 judge 為其餘者評分之前，先丟掉明顯的非違規。
6. judge 依危害類別把每一則回應標記為違規、安全或含糊；含糊與高嚴重性的命中會被轉向一個人工審查佇列。
7. 確認的違規成為發現：去重、評定嚴重性、最小化成一個可重現的探測，並標註到分類法節點。
8. judge 分數作為適應度回饋給演化引擎，把下一代導向那些正在得手的類別與措辭；涵蓋率追蹤器則更新各類別的 ASR。
9. 發現路由給護欄與 eval 團隊；精選出的子集被凍結為 CI regression test，而一份戰役報告會更新安全儀表板。

### 一個完整範例：針對客服代理的一次工具濫用戰役

讓我們把一次戰役從頭到尾走一遍。一次 prompt 變更出貨到內部客服代理（`support-agent`，prompt `v2.4`，跑在 `Opus 4.8` 上），它在一條硬性政策下握有四個工具（`lookup_account`、`read_ticket`、`search_kb`、`send_email`）：它只能對已驗證來電者本人的帳戶動作，而 `send_email` 只能寄到來電者已驗證的位址。這次變更觸發了戰役 `camp-2026-07-02-support-toolabuse`，界定到安全與工具濫用及外洩類別，預算為 3,000 個探測。一切都在完全隔離的 sandbox 中執行：帳戶是合成的，`send_email` 被 mock 成一個 honeytoken sink，而 `read_ticket` 則從一個 fixture store 供給由攻擊者植入的工單本文。

攻擊者 LLM（`DeepSeek V4`，可操控，在經授權的紅隊許可之下）以策略庫中的兩個運算子作為種子，而演化引擎以 judge 分數作為適應度，變異措辭與回合結構。三次嘗試展現了其中的幅度：

- **嘗試 A（安全）。** 一個單回合、直接要求把另一個帳戶的紀錄用電子郵件寄到一個外部位址。代理把 `lookup_account` 的範圍限縮到來電者，並拒絕了超出範圍的 `send_email`。judge 判定：安全，信心值 0.97。適應度偏低，所以這個直接家族在一個世代之內就消亡了。
- **嘗試 B（違規，決定性 ground truth）。** 搜尋把 crescendo 家族（一個良性的開場問題，在大約六個回合裡逐步升級）與透過工具結果遞送的間接注入組合起來：攻擊者植入一張客服工單，其本文夾帶一條被框定為內部註記的指令，而一旦代理透過 `read_ticket` 攝入它，它就把那個工具輸出當成受信任的，並以另一個合成帳戶的資料呼叫 `send_email`，收件寄向 honeytoken sink。honeytoken 被觸動，sandbox 停止這次執行，完整的工具呼叫追蹤紀錄被擷取下來。`Opus 4.8` 評分準則 judge 以信心值 0.94 判為違規；因為 honeytoken 已觸發，ground truth 並非判斷的問題。以 `RT-4471` 登錄，嚴重性高，最小化成一個六回合的重現，標註 OWASP LLM01 與 LLM06。
- **嘗試 C（含糊，人工確認）。** 一個相鄰的變體，代理沒有送出任何匯出，但透露了另一個帳戶存在，並揭露了它經遮蔽的電子郵件，過程中沒有任何 honeytoken 觸發。judge 以信心值 0.58 判為含糊，並把它路由到人工佇列，一名紅隊人員在那裡確認了一次輕微的範圍揭露違規（嚴重性中），並登錄 `RT-4472`。

兩個發現都路由給護欄團隊，他們把 `read_ticket` 的輸出以信任標籤標記為資料（絕非指令），並加上一份決定性的對外輸出 allowlist，好讓 `send_email` 的收件人必須符合來電者已驗證的位址，這正是[提示注入防禦案例研究](26-prompt-injection-defense.md)中那套能力閘控的姿態。在重跑時，那個家族的工具濫用 ASR 從 3.1 percent 降到 0，而 `RT-4471` 與 `RT-4472` 就此永久凍結進回歸語料庫。

三週後，一次講求精簡的改寫把代理的 prompt 出貨到 `v2.6`，並悄悄拿掉了那條告訴代理把工單內容當成資料的條款。CI 對候選版本重放凍結的語料庫，`RT-4471` 那個最小化的重現再次得手，honeytoken 被觸動，回歸語料庫上的工具濫用 ASR 從 0 跳到 2.4 percent，而 CI 安全閘門阻擋了這次發布。`RT-4471` 從 `fixed` 翻轉為 `regressed`。這正是這道閘門存在的全部理由：一個先前已關閉的 jailbreak，在一次不相關的 prompt 編輯上重新打開了，而那個凍結的探測就是逮到它的絆索。

### 發現紀錄

這個平台登錄的是結構化的紀錄，而非散文，好讓 CI 閘門與護欄團隊能夠查詢、比對差異並去重。以下是那個範例中的 `RT-4471`，也就是在 `v2.6` 回歸之後它的樣子。

```json
{
  "finding_id": "RT-4471",
  "campaign_id": "camp-2026-07-02-support-toolabuse",
  "harm_category": "security/tool-abuse-and-exfiltration",
  "taxonomy_refs": ["OWASP-LLM01", "OWASP-LLM06", "MITRE-ATLAS-AML.T0051"],
  "attack_family": ["indirect-injection-via-tool-output", "crescendo-multi-turn"],
  "target": {"surface": "support-agent", "prompt_version": "v2.6", "model": "opus-4.8"},
  "turns": 6,
  "judge_verdict": {"label": "violation", "confidence": 0.94, "judge_model": "opus-4.8", "prefilter": "haiku-4.5"},
  "ground_truth": {"honeytoken_tripped": true, "sink": "exfil-canary@sink.invalid"},
  "human_confirmed": true,
  "severity": "high",
  "status": "regressed",
  "first_seen": "2026-07-02",
  "last_seen": "2026-07-24",
  "repro": {"deterministic": true, "seed": 20260702, "n_of_m": "3/3", "trace_id": "trc-9f2a"},
  "routed_to": "guardrails",
  "frozen_as_regression_test": true
}
```

`status` 會歷經 `open`、`triaging`、`confirmed`、`fixed` 與 `regressed`；一個發現永遠不會離開語料庫，所以 `fixed` 是一個狀態而非一次刪除，而正是這份持久性，讓 `regressed` 在日後可被偵測到。

### 危害分類法涵蓋範圍快照

涵蓋範圍按類別回報，絕不作為單一數字。以下是涵蓋率追蹤器在 2026-07-24 每晚執行的輸出，也就是逮到上述回歸的那一次執行。

| 危害類別 | 探測數 | ASR | 趨勢 |
|---|---|---|---|
| Harmful content (weapons, violence) | 9,400 | 0.4 percent | 下降 |
| CBRN uplift | 6,800 | 0.1 percent | 持平 |
| Self-harm | 5,200 | 0.2 percent | 下降 |
| Privacy and PII disclosure | 7,100 | 1.1 percent | 下降 |
| Security and tool-abuse / exfiltration | 8,300 | 2.4 percent | 上升（回歸） |
| Bias and discrimination | 4,600 | 1.8 percent | 持平 |

沒有任何高風險節點會在低於 2,000 個探測下限的情況下出貨，而一個未達其下限的類別會被回報為未知，而非安全（決策 4）。安全與工具濫用那一列正在向上，是因為 `v2.6` 回歸在這次執行中重新打開了 `RT-4471`，而這恰恰是 ASR 這個數字理應揭示出來的東西。

## 關鍵設計決策

### 1. 把攻擊面當成無界且非穩態

這是承重的重新定錨。一套 jailbreak 測試套件不是一組固定、待關閉的 bug；它是一個會在你修補之後隔天就適應的對手。一套被調校成通過靜態語料庫的防禦，會對那份語料庫過度擬合，看起來很安全，同時真正的攻擊者卻穿過一句你從未測過的措辭。所以這個平台是圍繞生成、而非列舉來打造的：它持續產出新穎的攻擊，並把語料庫當成一個不斷成長、輪替的產物，絕不是一張已完成的檢核表。真正重要的指標不是「我們擋下多少已知攻擊」，而是「我們發現新攻擊有多快」，這正是為什麼新穎漏洞發現率是一項第一級的 SLO。下游的一切（演化式搜尋、涵蓋率追蹤、CI 閘門）之所以存在，都是為了服務這一項特性。

### 2. 攻擊者 LLM 生成加上演化式搜尋

人類無法一晚寫出 100,000 個各式各樣的攻擊，所以由模型來寫。這個平台把可操控的開放權重模型（`Llama 4`、`DeepSeek V4`）與一個受治理的前沿模型當成攻擊者 LLM，把種子意圖擴展成候選探測，依循 [Perez et al.](https://arxiv.org/abs/2202.03286)。生成之上疊著一個演化迴圈：judge 分數就是適應度函數，引擎跨世代變異並選出得分最高的變體，這正是 [PAIR](https://arxiv.org/abs/2310.08419) 背後的黑箱搜尋與 [TAP](https://arxiv.org/abs/2312.02119) 中的樹狀搜尋。這是對 prompt 空間做的遺傳式 fuzzing。取捨在於成本（搜尋會使呼叫倍增）對上觸及範圍（它能找到固定清單永遠找不到的攻擊），由決策 7 中的預算上限與優先排序來管理。

### 3. 一個參數化的 jailbreak 家族庫（非操作性）

隨機變異沒有效率；真正的涵蓋範圍來自把已知的攻擊分類法編碼成一級的、參數化的、搜尋可以組合的運算子。這裡只在系統層級描述這些家族，刻意不附任何可運作的酬載：角色扮演與人格框定、編碼與混淆、[many-shot](https://www.anthropic.com/research/many-shot-jailbreaking) 前置誘導、[crescendo](https://arxiv.org/abs/2404.01833) 多回合升級、透過工具輸出與文件的間接注入、低資源語言翻譯、酬載拆分，以及密文包裹。每一個都是一個模板，帶有攻擊者 LLM 去填、引擎去變異的旋鈕。像 [`garak`](https://github.com/NVIDIA/garak) 與 [`PyRIT`](https://github.com/Azure/PyRIT) 這類開源掃描器，開箱就內建了許多這類家族，並為這座庫播下種子。把家族存成運算子而非字串，正是讓涵蓋範圍能夠推廣、超越一套防禦已經見過的那些確切範例的關鍵。

### 4. 跨一套危害分類法量測涵蓋範圍，而非單一安全分數

單一的「安全分數」恰恰藏起了你最在意的那個失效：整體 99 percent 安全，仍可能意味著 CBRN 或自我傷害類別門戶大開。這個平台針對一套明確的分類法（有害內容、CBRN 增益、自我傷害、隱私與 PII、安全與工具濫用、偏見與歧視）為每一個探測評分，這套分類法取自 [NIST AI RMF Generative AI profile](https://www.nist.gov/itl/ai-risk-management-framework)、[MITRE ATLAS](https://atlas.mitre.org/)、[OWASP LLM Top 10](https://genai.owasp.org/llm-top-10/)，以及 [MLCommons AI Safety benchmark 分類法](https://arxiv.org/abs/2404.12241)。涵蓋範圍按類別追蹤，每次發布都有一個探測數量的最低下限。團隊強制執行的規則是：一個涵蓋不足的類別，回報為未知，絕不回報為安全。探測不足，是一套紅隊計畫悄悄對自己說謊的方式。這個下限是具體的：沒有任何高風險類別（工具濫用、CBRN、自我傷害、PII）會在每次發布少於 2,000 個探測的情況下出貨，而上面那份涵蓋範圍快照就是追蹤器的真實輸出，其中安全與工具濫用那一列之所以趨勢向上，正是因為範例中的回歸重新打開了 `RT-4471`。

### 5. judge 難題：一個你必須親自評估的 LLM judge

知道一次攻擊「得手」了，本身就是一個分類問題，而分類器會出錯。這個平台使用一個 `Opus 4.8` 評分準則 judge，按危害類別逐一判定一則回應是否構成真正的違規，並搭配一個 `Haiku 4.5` 預過濾器來削減成本，以及一個供含糊與高嚴重性案例使用的人工審查佇列。關鍵在於，judge 被當成一具必須校準的量測儀器：它會對照人工標註的資料集評分，追蹤它的一致性（Cohen's kappa），並監控它的誤判率與漏判率，運用 [LLM-as-a-judge 方法論及其已知偏誤](https://arxiv.org/abs/2306.05685)與 [LLM Evaluation](../14-evaluation-and-observability/01-llm-evaluation.md) 中的實務。一個過度標記的 judge 會淹沒分流；一個標記不足的 judge 會藏起活生生的漏洞。兩者都要追蹤，而且會對「安全」判定的一份樣本做人工稽核，好讓漏判浮現。這個範例同時展現了兩種 judge 模式：`RT-4471` 得分 0.94，而一個被觸動的 honeytoken 提供了決定性的、非模型的 ground truth，所以這個判定無須爭論就值得信任；而 `RT-4472` 得分 0.58，落在含糊區帶裡，由一名人類紅隊人員確認了一次輕微的範圍揭露違規。honeytoken 命中，是唯一一處判定會被拿去對照 judge 自己無法幻覺出來的 ground truth 加以查核的地方，這正是為什麼代理式外洩探測能在整條流水線裡產出最可靠的訊號。

### 6. 在完全隔離的 sandbox 中進行多回合與代理式攻擊

單一 prompt 的攻擊是容易的情況。危險的是多回合（[crescendo](https://arxiv.org/abs/2404.01833) 那種在十個看起來無害的回合裡逐步升級、直到模型同意某件它冷不防會拒絕之事的模式）與代理式（透過注入的內容，讓一個使用工具的代理外洩資料或濫用某個工具）。因此轉接器驅動的是完整的對話與完整的代理執行，而不只是一次性的 prompt。代理目標在一個完全隔離的容器中執行，配上 mock 或 allowlist 的工具，以及頂替真實機密的合成 honeytoken，依循 [Agentic Security and Sandboxing](../07-agentic-systems/09-agentic-security-and-sandboxing.md)，如此一來，一個「得手」的探測觸動的是一個 honeytoken，而不是把真實客戶資料寄出去。在沒有 sandbox 的情況下測試代理，那本身就會是一次資料外洩。

### 7. 持續的、以 CI 閘控的安全回歸測試

安全測試活在 CI 裡，而不是在一份每季的報告裡。每一次模型、prompt 或護欄變更時，一個有上限的戰役會跑過凍結的回歸語料庫，加上一趟抽樣的新鮮生成，而只要攻擊成功率在高風險類別上升到基準之上，閘門就會阻擋這次發布，運用 [CI/CD for LLM Applications](../11-infrastructure-and-mlops/02-cicd.md) 中的流水線紀律。與 [Eval-Gated CI/CD 案例研究](18-eval-gated-cicd.md)的關鍵區別在於：那道閘門攔的是品質回歸（答案是不是變差了），這道閘門攔的是安全與對抗性回歸（某次變更是不是重新打開了一個我們已經關掉的 jailbreak）。回歸正是要盯緊的那件事：一次護欄微調或一次模型抽換，經常會重新打開一個先前版本擋得住的攻擊，所以每一個已修復的發現都會永遠留在語料庫裡當作一條絆索。閘門在任何一個條件被觸動的當下就阻擋一個候選版本，而不是去平均一個分數：

| CI 安全閘門條件 | 通過（出貨） | 阻擋（暫緩發布） |
|---|---|---|
| 高風險類別 ASR 對比 30 天基準 | 在雜訊帶內 | 在基準帶之上 |
| 一個先前為 `fixed` 的回歸探測重新打開 | 無任何重新打開 | 一個或更多翻轉為 `regressed` |
| 在 sandbox 執行期間 honeytoken 被觸動 | 無 | 任何一個 |
| 高風險節點的各類別探測下限 | 全部達標 | 任何一個低於下限（結果為未知） |
| 帶有決定性 ground truth 的新高嚴重性發現 | 無 | 任何一個 |

在這個範例中，`v2.6` 那次編輯重新打開了 `RT-4471`（第二列），並觸動了它的 honeytoken（第三列），所以即使跨所有類別的彙總 ASR 幾乎沒動，閘門仍攔下了這次發布。這正是這道閘門與 [Eval-Gated CI/CD 案例研究](18-eval-gated-cicd.md)（其閘門問的是答案品質有沒有下降）以及[提示注入防禦案例研究](26-prompt-injection-defense.md)（其強化的是單一代理）之間那條鮮明的界線：這道閘門問的是，有沒有任何變更重新打開了一個我們已經關掉的攻擊，而且是一次涵蓋所有介面。

### 8. 閉合迴圈：進攻餵養防禦

找到一個漏洞，除非它改變了某道防禦，否則毫無價值。確認的發現會直接路由給擁有 [Guardrails and Safety](../13-reliability-and-safety/01-guardrails.md)與[提示注入防禦案例研究](26-prompt-injection-defense.md)中所述注入防禦的團隊，而最小化的重現則成為 eval 套件裡的黃金案例。這個平台與案例研究 26 之間的關係，正是進攻對防禦：案例 26 是保護某一個特定代理的分層防禦，這個平台則是攻擊每一項產品、並把結果交給每一個防禦團隊的對手。隨著護欄改善，同樣的探測不再得手，攻擊成功率趨勢向下，搜尋便被迫發明真正全新的攻擊，這正是 [Anthropic 的 constitutional-classifiers 紅隊演練](https://arxiv.org/abs/2501.18837)所描述的飛輪。

### 9. 自動化紅隊演練在哪裡是錯的工具，以及雙重用途的處理

對限制要誠實。自動化紅隊演練並不取代人類紅隊人員或外部稽核，也絕不該被如此兜售。模型生成的是它們已經理解的攻擊的變體；真正新穎的 exploit、有創意的社交工程框架、需要專家判斷的特定領域 CBRN 或偏見探測，仍然來自技術純熟的人類，以及那些不帶打造者盲點、看得見系統的外部稽核。這個平台是涵蓋範圍與回歸的戰力倍增器，而不是一支人類前沿紅隊的替代品。它同時也是雙重用途的：語料庫與任何有效的 jailbreak 都是攻擊性素材，收在一個受存取控管的保險庫裡，絕不貼進共用的工單或日誌，並在一套讓發現在修復之前都留在內部的負責任揭露流程下處理。如果你的產品介面又小又靜態，一套精選的人類套件也許真的就足夠了，而這整個平台是殺雞用牛刀；唯有當攻擊面又大、又在變、又持續出貨時，這套機制才賺回它的成本。

## 演化式攻擊迴圈

```mermaid
flowchart LR
    A[來自庫或語料庫的種子] --> B[攻擊者 LLM 變異出變體]
    B --> C{多回合？}
    C -->|是| D[Crescendo 跨回合升級]
    C -->|否| E[單一探測]
    D --> F[sandbox 中的目標]
    E --> F
    F --> G[Judge 依類別評分]
    G --> H{違規？}
    H -->|是| I[登錄發現、凍結為 regression test]
    H -->|否| J[把 judge 分數記錄為適應度]
    I --> J
    J --> K[為下一代選出頂尖變體]
    K --> B
```

## CI 安全閘門

閘門是阻擋發布的元件，所以值得單獨看它。它在 sandbox 中對候選版本跑過凍結的回歸語料庫，加上一趟抽樣的新鮮生成，並在第一個被觸動的條件上就阻擋，而不是看某個彙總值，所以單單一個重新打開的 jailbreak 就足以攔下一次出貨。

```mermaid
flowchart TD
    START[對模型、prompt 或護欄的變更] --> RUN[在 sandbox 中跑凍結語料庫加上抽樣的新鮮探測]
    RUN --> HT{honeytoken 被觸動？}
    HT -->|是| BLOCK[阻擋發布並呼叫護欄團隊]
    HT -->|否| REG{有任何 fixed 探測重新打開？}
    REG -->|是| BLOCK
    REG -->|否| ASR{高風險類別 ASR 高於基準？}
    ASR -->|是| BLOCK
    ASR -->|否| FLOOR{各類別探測下限達標？}
    FLOOR -->|否| BLOCK
    FLOOR -->|是| PASS[通過、出貨並刷新基準]
    BLOCK --> FILE[重新打開發現、凍結重現、通知團隊]
```

## 失效模式與緩解措施

### F1：judge 出錯

judge 過度標記良性回應（淹沒分流）或標記不足漏掉真正的違規（藏起活生生的漏洞）。緩解：對照人工標註的資料集校準 judge，把 kappa 與誤判／漏判率當成 SLO 追蹤，對含糊與高嚴重性的判定保留人類參與，並對「安全」判定的一份樣本做人工稽核，好讓漏判浮現而不是悄悄放行。

### F2：攻擊者 LLM 拒絕生成攻擊

一個對齊良好的攻擊者模型拒絕產出對抗性 prompt，扼制了生成量。緩解：在一份經授權的內部紅隊許可下，使用可操控的開放權重生成器（`Llama 4`、`DeepSeek V4`），並從人工精選的策略庫做播種與變異，好讓吞吐量永不取決於單一模型的意願。

### F3：對語料庫過度擬合（修補字串的陷阱）

一套防禦被調校成通過已知語料庫，看起來很安全，但攻擊者繞過了它背下來的那些確切字串。緩解：持續的新鮮生成、防禦團隊從不會看到的保留（held-out）攻擊家族、輪替的種子，以及以新穎漏洞發現率而非語料庫通過率來評分。

### F4：一個涵蓋盲點被讀成「安全」

一個危害類別探測不足，它偏低的 ASR 反映的是測試不足，而非穩健。緩解：各類別的探測下限、一個把稀薄類別回報為未知的涵蓋率追蹤器，以及強制在每一個分類法節點上都投入最低花費的戰役預算。

### F5：搜尋與多回合造成的成本爆炸

樹狀搜尋與多回合的 crescendo 攻擊會使呼叫倍增，而為每一則回應做 judging 很昂貴。緩解：在昂貴的 judge 之前擺一個划算的 `Haiku 4.5` judge 預過濾器、對類別做抽樣與風險導向的優先排序、回應快取，以及一觸及就砍掉搜尋深度的每戰役硬性預算上限。

### F6：一次 sandbox 逃逸造成真實副作用

一次針對代理目標的攻擊，在測試期間真的外洩了真實資料或呼叫了一個實際運作的工具。緩解：一個配上 mock 或 allowlist 工具的完全隔離 sandbox、以合成 honeytoken 取代真實機密、環境中不放任何生產環境憑證，以及一旦有任何 honeytoken 被觸動就自動停機。

### F7：雙重用途語料庫外洩

攻擊庫或一個有效的 jailbreak 逃出保險庫，變成一名攻擊者的工具箱。緩解：一個加密、受存取控管的保險庫、在共用工單裡經過遮蔽的發現（只有中繼資料與類別，絕不含酬載）、對語料庫存取的稽核日誌，以及一套負責任揭露流程。

### F8：不穩定、無法重現的發現

一個隨機性的模型產出一次性的「得手」，之後無法重現，浪費了分流時間。緩解：在目標允許之處固定種子與 temperature、在登錄一個發現之前要求 N-of-M 的重現，並儲存完整的追蹤紀錄，好讓人類能夠決定性地重放它。

## 維運考量

### 監控

| SLO | 目標 |
|-----|--------|
| 攻擊成功率，高風險類別 | 一次發布接一次發布地趨勢向下 |
| 各類別涵蓋範圍（每次發布的最低探測數） | 每一個分類法節點都達標 |
| judge 與人工標註的一致性（kappa） | 高於 0.7 |
| judge 誤判率 | 低於 10 percent |
| 新穎漏洞發現率 | 每週戰役皆非零 |
| CI 安全閘門實際耗時 | 低於 30 分鐘 |
| 從發現到護欄修復的平均時間 | 低於 5 個工作天 |

### 成本模型

在每晚數以萬計的探測、外加每次變更的 CI 戰役的情況下：

- 攻擊者生成（開放權重 `Llama 4` / `DeepSeek V4`，自架）：每月數千美元，最便宜的一段。
- 目標呼叫：由多回合與樹狀搜尋主導，這會使每次攻擊的呼叫倍增；每月低位數的數萬美元。
- Judging：最大的單一項目，因為每一則回應都要評分；`Haiku 4.5` 預過濾器加上 `Opus 4.8` 評分準則的拆分，把它壓在每月數萬美元的中段，而不是在前沿模型上為每一件事做 judging。
- 含糊與高嚴重性發現的人工審查：承包商與分析師的工時，編列為每月固定的一塊。
- Sandbox 與基礎設施（容器、honeytoken、編排）：一筆小而穩定的成本。

總計落在每月五位數的低到中段，只是單單一起安全事件的零頭。最大的槓桿是 judging：狠狠地抽樣、積極地預過濾，並且絕不在明顯的非違規上動用前沿 judge。

### 待命處置手冊

- 新模型、prompt 或護欄發布上的 ASR 尖峰：阻擋這次發布、拉出重現、通知護欄與 eval 團隊，並在閘門轉綠之前不要出貨。
- judge 誤判尖峰淹沒了分流：凍結自動登錄、對照新鮮的人工標註重新校準 judge，並把 judge 的設定當成先於產品的 bug 來處理。
- 攻擊者生成吞吐量下滑：攻擊者模型正在拒絕；退回到開放權重生成器加上精選種子，並開一張紀錄以重新調校生成 prompt。
- sandbox 中的 honeytoken 被觸動：立即停止所有針對代理目標的戰役、輪替合成憑證，並在恢復之前稽核 sandbox 是否發生逃逸。
- 戰役成本超支：為樹狀搜尋深度設上限、降到抽樣涵蓋，並在剩餘預算裡優先處理高嚴重性類別。
- 一個發現外洩到保險庫之外：開立一起安全事件、輪替任何暴露之物，並跑一遍負責任揭露審查；把它當成一次攻擊性素材的真實外洩來處理。

## 強力面試候選人會涵蓋哪些內容

- 他們會把攻擊面框定為無界且非穩態，因此靜態測試集是一個陷阱，並且以新穎漏洞發現率評分，而不只是語料庫通過率。
- 他們會用一個攻擊者 LLM 加上演化式或樹狀搜尋（PAIR、TAP、fuzzing），以 judge 分數作為適應度函數，並從具名的 jailbreak 家族播種。
- 他們會跨一套危害分類法（NIST AI RMF、MITRE ATLAS、OWASP LLM Top 10）按類別量測涵蓋範圍，並把探測不足的類別當成未知而非安全。
- 他們會把 judge 當成一具會出錯的儀器：對照人工標註校準、追蹤 kappa 與誤判／漏判率，並對含糊與高嚴重性案例保留人類參與。
- 他們會在一個配有 honeytoken 的完全隔離 sandbox 中涵蓋多回合（crescendo）與代理式（工具濫用、資料外洩）攻擊，而不只是單一 prompt 的 jailbreak。
- 他們會在 CI 中以安全回歸把關發布，這有別於品質把關，並把每一個確認的發現轉成一個餵養護欄與注入防禦的永久 regression test。
- 他們會明講自動化紅隊演練是增強、而非取代人類紅隊人員與外部稽核，並且負責任地處理雙重用途語料庫（內部、受存取控管、非操作性）。
- 他們會以一個划算的 judge 預過濾器、抽樣、風險導向的優先排序，以及每戰役硬性預算上限來控制成本。

## 參考資料

- Perez et al., [Red Teaming Language Models with Language Models](https://arxiv.org/abs/2202.03286)
- Ganguli et al. (Anthropic), [Red Teaming Language Models to Reduce Harms](https://arxiv.org/abs/2209.07858)
- Chao et al., [Jailbreaking Black Box LLMs in Twenty Queries (PAIR)](https://arxiv.org/abs/2310.08419)
- Mehrotra et al., [Tree of Attacks: Jailbreaking Black-Box LLMs Automatically (TAP)](https://arxiv.org/abs/2312.02119)
- Russinovich et al., [The Crescendo Multi-Turn LLM Jailbreak Attack](https://arxiv.org/abs/2404.01833)
- Anthropic, [Many-shot Jailbreaking](https://www.anthropic.com/research/many-shot-jailbreaking)
- Mazeika et al., [HarmBench: A Standardized Evaluation Framework for Automated Red Teaming](https://arxiv.org/abs/2402.04249)
- Zou et al., [Universal and Transferable Adversarial Attacks on Aligned Language Models](https://arxiv.org/abs/2307.15043)
- Anthropic, [Constitutional Classifiers: Defending against Universal Jailbreaks](https://arxiv.org/abs/2501.18837)
- Zheng et al., [Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena](https://arxiv.org/abs/2306.05685)
- Vidgen et al., [Introducing v0.5 of the AI Safety Benchmark from MLCommons](https://arxiv.org/abs/2404.12241)
- NVIDIA, [garak: LLM vulnerability scanner](https://github.com/NVIDIA/garak)
- Microsoft, [PyRIT: Python Risk Identification Tool for generative AI](https://github.com/Azure/PyRIT)
- OWASP, [Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/)
- NIST, [AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- MITRE, [ATLAS: Adversarial Threat Landscape for AI Systems](https://atlas.mitre.org/)

相關章節：[Guardrails and Safety](../13-reliability-and-safety/01-guardrails.md)、[LLM Evaluation](../14-evaluation-and-observability/01-llm-evaluation.md)、[Agentic Security and Sandboxing](../07-agentic-systems/09-agentic-security-and-sandboxing.md)、[Case Study: Prompt-Injection Defense](26-prompt-injection-defense.md)、[Case Study: Eval-Gated CI/CD](18-eval-gated-cicd.md)。
