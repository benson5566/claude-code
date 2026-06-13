# 保養品知識圖書館 — 多代理資料收集系統

## 架構

```
run.js → Orchestrator
            │
            ├─ Stage 1: TopicPlanner    (題目制定) claude-haiku-4-5
            │   └─ 分析 DB 缺口，輸出 3-7 個研究問題
            │
            ├─ Stage 2: Researcher      (查詢)     claude-haiku-4-5
            │   └─ 搜尋 DB + 網路，整理原始發現
            │
            ├─ Stage 3: Verifier        (檢核)     claude-haiku-4-5
            │   └─ 評估每項發現的科學可信度
            │
            ├─ Stage 4: DebateAgent     (多觀點)   claude-opus-4-8
            │   └─ PRO / CON / NEUTRAL 三角分析
            │
            ├─ Stage 5: Auditor         (查核)     claude-opus-4-8
            │   └─ 跨來源一致性、決定可入庫項目
            │
            └─ Stage 6: DeepResearcher  (深度研究) claude-opus-4-8
                └─ 補全欄位，呼叫 DB API 儲存
```

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
