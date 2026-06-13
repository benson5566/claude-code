# 保養品知識圖書館 — 多代理資料收集系統

## 架構

```
run.js → Orchestrator
            │
            ├─ Stage 1: TopicPlanner    (題目制定)  claude-haiku-4-5
            │   └─ 分析 DB 缺口，輸出 3-7 個研究問題
            │
            ├─ Stage 2: Researcher      (查詢)      claude-haiku-4-5
            │   ├─ 搜尋 DB + 網路，整理原始發現
            │   └─ 誠實標記 UNVERIFIABLE / TRAINING_MEMORY，不補腦
            │       ↑ retry (最多 1 次，由 Verifier 觸發)
            │
            ├─ Stage 3: Verifier        (檢核)      claude-opus-4-8 ← 升級
            │   ├─ 嚴格評估科學可信度（存疑優先）
            │   ├─ 標記 needs_more_research → 觸發 Stage 2 補查
            │   └─ 輸出 verdict / evidence_level / safe_to_publish
            │
            ├─ Stage 4: DebateAgent     (多觀點)    claude-opus-4-8
            │   └─ 六角度：支持／反對／存疑／謹慎／務實／整合
            │
            ├─ Stage 5: Auditor         (查核)      claude-opus-4-8
            │   └─ 跨來源一致性、決定可入庫項目
            │
            └─ Stage 6: DeepResearcher  (深度研究)  claude-opus-4-8
                └─ 補全欄位，呼叫 DB API 儲存
```

### 設計原則

| 原則 | 實作方式 |
|---|---|
| 高度知識水平 | Verifier / Debate / Auditor / DeepResearcher 全用 opus-4-8 |
| 查核事實真偽 | Verifier 嚴格分級，存疑優先，TRAINING_MEMORY 不得標 verified |
| 不胡亂編造 | Researcher 明確標記 UNVERIFIABLE，禁止憑記憶補充 WEB 來源 |
| 不同觀點 | DebateAgent 六個立場：支持、反對、存疑、謹慎、務實、整合 |
| 懂得討論 | Verifier → Orchestrator → Researcher 退回補查機制 |
| 願意溝通 | needs_more_research + suggested_followup 形成對話閉環 |

## 安裝

```bash
cd skincare-db/agents
npm install
```

## 設定

複製 `../api/.env` 並確保包含：

```env
ANTHROPIC_API_KEY=your_key_here
SKINCARE_API_BASE=http://localhost:3000/api
API_KEY=your_db_api_key
```

## 使用方式

```bash
# 預設領域（保養成分）
node run.js

# 指定領域
node run.js "抗老成分"
node run.js "油性膚質保養" --max=5
node run.js "環境友善防曬" --dry-run   # 不實際寫入 DB
```

## 輸出

- `reports/report_<timestamp>.json` — 完整管道報告
- 終端機摘要 + 可直接用於社群貼文的已驗證主張

## 加入真實網路搜尋

`tools.js` 的 `web_search` 預設為 stub。替換方式：

```js
// tools.js → toolImpls.web_search
web_search: async ({ query }) => {
  const { data } = await axios.get('https://api.search.brave.com/res/v1/web/search', {
    params: { q: query, count: 5 },
    headers: { 'Accept-Encoding': 'gzip', 'X-Subscription-Token': process.env.BRAVE_API_KEY },
  });
  return data.web?.results || [];
},
```
