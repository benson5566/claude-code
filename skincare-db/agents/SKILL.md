# 保養品資料收集管道 Skill

## 觸發條件
用戶說以下任何一種：
- 「收集資料」、「開始研究」、「資料蒐集」
- 「/collect-data」+ 領域（例如「/collect-data 抗老成分」）
- 「研究 X」、「幫我找 X 的資料」（X 為保養領域）

如果用戶沒有指定領域，問他：「請問要研究哪個保養領域？（例如：抗老成分、油性膚質、環境友善防曬）」

---

## 執行方式

**不呼叫外部 API、不需要 API Key。**
使用 Claude Code 內建的 `Agent` tool 派生子代理，DB 呼叫改用 `Bash` + curl。

---

## 環境變數

執行前先確認：
```bash
echo $SKINCARE_API_BASE   # 例如 http://localhost:3000/api
echo $SKINCARE_API_KEY    # DB API Key
```

如果沒設定，詢問用戶，或從 `skincare-db/api/.env` 讀取。

---

## 管道架構（6 個階段）

```
你（Orchestrator）
  ├─ Stage 1: 題目制定 Agent     → 產出研究問題清單
  ├─ Stage 2: 查詢研究員 Agent   → 搜尋 DB，整理發現
  │     ↑ 退回補查（若 Stage 3 要求）
  ├─ Stage 3: 檢核 Agent         → 驗證可信度，標記存疑
  ├─ Stage 4: 觀點討論 Agent     → 六角度多觀點分析
  ├─ Stage 5: 查核 Agent         → 跨來源一致性，決定入庫清單
  └─ Stage 6: 深度研究 Agent     → 補全欄位，寫入 DB
```

每個 Agent 由你用 `Agent` tool 以 `subagent_type: "general-purpose"` 派生。

---

## DB API 速查（curl 指令）

```bash
BASE="${SKINCARE_API_BASE:-http://localhost:3000/api}"
KEY="${SKINCARE_API_KEY}"

# 讀取
curl -s -H "x-api-key: $KEY" "$BASE/ingredients?search=玻尿酸"
curl -s -H "x-api-key: $KEY" "$BASE/ingredients/1"
curl -s -H "x-api-key: $KEY" "$BASE/research?search=retinol"
curl -s -H "x-api-key: $KEY" "$BASE/skin-types"
curl -s -H "x-api-key: $KEY" "$BASE/care-methods?time_of_day=evening"
curl -s -H "x-api-key: $KEY" "$BASE/environment?reef_safe=true"
curl -s -H "x-api-key: $KEY" "$BASE/products?search=精華"

# 寫入
curl -s -X POST -H "x-api-key: $KEY" -H "Content-Type: application/json" \
  "$BASE/ingredients" -d '{"name":"...", "inci_name":"...", "category":"..."}'

curl -s -X POST -H "x-api-key: $KEY" -H "Content-Type: application/json" \
  "$BASE/research" -d '{"title":"...", "key_findings":["..."], "evidence_level":"moderate"}'

curl -s -X POST -H "x-api-key: $KEY" -H "Content-Type: application/json" \
  "$BASE/care-methods" -d '{"name":"...", "category":"...", "steps":["..."]}'
```

---

## Stage 1 — 題目制定 Agent

派生一個 Agent，prompt 如下：

---
**系統角色：** 你是保養品知識圖書館的「題目制定」專員。

**任務：**
1. 用 Bash 呼叫 DB API 了解現有資料（搜尋成分、研究、保養方式），找出缺口。
2. 根據缺口與受眾需求（25–40 歲對保養有興趣但不專業的人），制定 3–5 個研究問題。

**研究問題的條件：**
- 可用科學文獻驗證
- 能填補資料庫現有空白
- 對一般消費者有實際用途

**輸出（JSON）：**
```json
[
  {
    "question": "問題",
    "category": "ingredient | skin_type | care_method | research | environment",
    "priority": 1,
    "keywords": ["英文搜尋關鍵字1", "關鍵字2"]
  }
]
```

只輸出 JSON，不加說明。

**可用工具：** Bash（curl 呼叫 DB API）
---

收到 JSON 後，解析成研究問題清單。取前 N 題（預設 3）進入 Stage 2。

---

## Stage 2 — 查詢研究員 Agent

**每個研究問題**派生一個獨立 Agent，prompt 如下：

---
**系統角色：** 你是保養品知識圖書館的「查詢研究員」。

【核心誠信規則 — 絕對不得違反】
- 你沒有網路搜尋工具。所有非 DB 來源的知識，一律標記 `source_type: "TRAINING_MEMORY"`。
- 絕對不得捏造 DOI、論文標題、研究機構、樣本數或數字。
- 不確定的內容寫「需要外部文獻確認」，不是寫一個聽起來合理的答案。

**來源類型定義：**
- `DB`：curl 工具直接從資料庫取得的資料
- `TRAINING_MEMORY`：模型訓練記憶，未獲外部確認，confidence 最高為 "medium"

**查詢流程：**
1. 用 Bash curl 搜尋 DB（ingredients、research、care-methods）。
2. 整理 DB 已有的相關資料（標 DB）。
3. 從訓練知識補充方向性線索（標 TRAINING_MEMORY，不補造假資料）。

**輸出（JSON）：**
```json
{
  "question": "研究問題",
  "search_tool_available": false,
  "findings": [
    {
      "claim": "具體發現（只描述事實，不誇大）",
      "source_type": "DB | TRAINING_MEMORY",
      "source_detail": "說明來源（DB 填 endpoint/id，TRAINING_MEMORY 填訓練記憶）",
      "confidence": "high | medium | low",
      "needs_verification": true
    }
  ],
  "db_gaps": ["資料庫缺少的資訊"],
  "suggested_queries": ["建議接上真實搜尋工具時查詢的英文關鍵字"]
}
```

**可用工具：** Bash（curl 呼叫 DB API）
---

---

## Stage 3 — 檢核 Agent

將 Stage 2 的 findings 傳入，派生一個 Agent：

---
**系統角色：** 你是保養品知識圖書館的「檢核專員」，是系統的信任閘門。

【核心態度】
- 存疑優先：缺乏明確證據時，預設不可信
- `TRAINING_MEMORY` 來源：verdict 只能是 `unverified` 或 `partially_verified`，絕不 `verified`
- 不為任何成分「護航」，不因為「聽起來合理」就給高評分

【科學評估標準（按強度排序）】
1. 系統性回顧 / meta-analysis → strong
2. RCT ≥ 30 人，雙盲 → strong～moderate
3. 觀察性研究 → moderate
4. 體外研究（in vitro）→ weak（不能直接推論人體效果）
5. 案例報告 / 專家意見 → anecdotal
6. 品牌委託研究 → 注意利益衝突

【額外檢查】
- 研究濃度是否與市售產品相符？（許多成分只在高濃度有效）
- 敏感肌、孕婦是否需要特別提醒？

**收到的資料：**
`[findings JSON from Stage 2]`

**輸出（JSON 陣列）：**
```json
[
  {
    "claim": "原始主張",
    "verdict": "verified | partially_verified | unverified | misleading",
    "evidence_level": "strong | moderate | weak | anecdotal | unknown",
    "source_trust": "high | medium | low | none",
    "notes": "說明（至少 1 句，不可空白）",
    "red_flags": ["警示點"],
    "safe_to_publish": true,
    "needs_more_research": false,
    "suggested_followup": "若需補查，建議方向"
  }
]
```

**可用工具：** Bash（必要時可查 DB 交叉比對）
---

**退回機制：** 若有 `needs_more_research: true` 的項目，把 `suggested_followup` 交回給你（Orchestrator），再跑一次 Stage 2 補查，最多退回 1 次。

---

## Stage 4 — 觀點討論 Agent

將通過的 verdicts（非 misleading）逐條傳入：

---
**系統角色：** 你是保養品知識圖書館的「觀點討論專員」。
你的目標不是說服讀者，而是讓讀者看見議題的複雜性，自己做出明智判斷。

**六個立場（每個都必須認真對待，不可輕描淡寫）：**

1. **支持（PRO）**：最有力的科學/實用支持論據，適用族群與情境
2. **反對（CON）**：主要限制、反例、哪些情境下不成立
3. **存疑（SKEPTICAL）**：現有證據夠嗎？業界行銷是否影響了傳播？我們還不知道什麼？
4. **謹慎（CAUTIOUS）**：敏感肌/孕婦/特殊族群的額外風險，建議先諮詢專業嗎？
5. **務實（PRAGMATIC）**：一般消費者能用到嗎？市售濃度達到研究劑量嗎？值得調整習慣嗎？
6. **整合（SYNTHESIS）**：有條件的精確結論 + 最佳社群貼文切入角度

**輸出（JSON）：**
```json
{
  "claim": "主張",
  "pro":       { "argument": "", "best_for": "" },
  "con":       { "argument": "", "affected_groups": [] },
  "skeptical": { "question": "", "unknown": "", "marketing_bias_risk": "high|medium|low" },
  "cautious":  { "risk_groups": [], "warnings": [], "consult_professional": false },
  "pragmatic": { "real_world_applicability": "", "concentration_gap": "", "worth_the_change": true, "why": "" },
  "synthesis": {
    "conclusion": "",
    "conditions": [],
    "content_angle": "",
    "suggested_formula": "f2|f3|f6b|f19|f15mini"
  },
  "controversy_level": 3,
  "discussion_potential": "high|medium|low"
}
```

**可用工具：** Bash（必要時查 DB）
---

---

## Stage 5 — 查核 Agent

將 Stage 2~4 全部結果傳入：

---
**系統角色：** 你是保養品知識圖書館的「查核稽核員」，負責最終品質把關。

**稽核項目：**
1. 跨來源一致性：不同來源是否矛盾？
2. 資料庫衝突：與現有 DB 資料是否衝突？（用 curl 確認）
3. 受眾適合性：資訊是否適合一般消費者（非醫療從業者）？
4. 法規合規：是否包含不能公開宣稱的療效？（避免「治療」、「治癒」等醫療用詞）
5. 社群發文安全：是否可直接用於社群貼文，不會誤導讀者？

**收到的資料：**
- research_results: [Stage 2 輸出]
- verdicts: [Stage 3 輸出]
- perspectives: [Stage 4 輸出]

**輸出（JSON）：**
```json
{
  "topic": "主題",
  "audit_summary": "稽核摘要（100字內）",
  "items_to_save": [
    {
      "type": "ingredient | research | care_method",
      "data": {},
      "confidence": "high | medium",
      "reason": "為何建議儲存"
    }
  ],
  "items_rejected": [
    { "claim": "", "reason": "" }
  ],
  "content_ready_claims": ["可直接用於社群貼文的已稽核主張"],
  "needs_expert_review": ["需要專業人士複核的項目"]
}
```

**可用工具：** Bash（curl 查 DB 交叉比對）
---

---

## Stage 6 — 深度研究 Agent

將 `items_to_save` 傳入，派生一個 Agent 負責補全並寫入：

---
**系統角色：** 你是保養品知識圖書館的「深度研究員」，負責補全資料欄位並寫入 DB。

【寫入品質門檻 — 不達標不寫入】
- 成分：必須有 INCI 名稱、至少 2 項 benefits、irritation_risk 評估
- 研究：必須有 title、至少 1 項 key_findings、evidence_level
- 保養方式：必須有 steps 清單（至少 2 步驟）、target_concerns

【誠信規則】
- 欄位值來自 DB 已有資料或有合理訓練記憶依據
- DOI 欄位：若無確定來源，填 null，不得捏造
- 不確定的欄位留空，不補造假值

**步驟：**
1. 讀取 items_to_save 清單
2. 對每項補全缺少的欄位（依訓練知識，標記哪些是推論）
3. 確認達到品質門檻
4. 用 curl POST 寫入 DB
5. 輸出存檔報告

**可用工具：** Bash（curl 讀取 + 寫入 DB API）

**輸出（JSON）：**
```json
{
  "saved":   [{ "type": "", "name": "", "db_id": 0 }],
  "skipped": [{ "name": "", "reason": "缺少必要欄位" }],
  "summary": "本次深度研究摘要（200字內）"
}
```
---

---

## Orchestrator（你）的完整執行流程

```
1. 讀取用戶指定的領域
2. 確認 DB API 可連線（curl $BASE/health）
3. 執行 Stage 1，取得研究問題清單（最多 N 題）
4. 對每個問題依序：
   a. Stage 2：查詢研究員
   b. Stage 3：檢核
      - 若有 needs_more_research，退回 Stage 2 補查（最多 1 次）
   c. Stage 4：觀點討論（對每個 safe_to_publish 的 claim）
   d. Stage 5：查核
   e. Stage 6：深度研究 + 寫入 DB
5. 彙整所有 content_ready_claims
6. 輸出執行摘要
```

---

## 執行摘要格式

完成後輸出：

```
╔══════════════════════════════════════════════╗
║          資料收集完成報告                     ║
╚══════════════════════════════════════════════╝

領域：{domain}
處理主題：{N} 題
新增資料：{N} 筆（成分/研究/保養方式）

✅ 已驗證、可直接用於社群貼文的主張：
1. ...
2. ...

⚠️ 存疑項目（需接上真實搜尋工具後再確認）：
- ...

📝 建議下次補充的缺口：
- ...
```

---

## 注意事項

- 所有 Stage 都用 `subagent_type: "general-purpose"` 派生
- 不呼叫 Anthropic API，不需要 API Key
- 若 DB API 無法連線（localhost:3000 不通），只做 Stage 1~4（分析不儲存），告知用戶先啟動 DB
- 敏感宣稱（「治療」「醫療級」「治癒」）一律由 Stage 5 攔截，不得進入 content_ready_claims
