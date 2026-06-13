# 保養品知識圖書館 — 資料收集管道

## 執行方式

**這個管道完全在 Claude Code 內執行，不需要額外的 Anthropic API Key，費用包含在你的 Claude Code 訂閱中。**

在 Claude Code 中說：

```
/collect-data 抗老成分
/collect-data 油性膚質保養
/collect-data 環境友善防曬
```

或直接說「幫我研究玻尿酸的保養效果」。

---

## 架構

```
Claude Code（你的 session）
  ↓ 讀取 SKILL.md
  ↓ 派生子代理（Agent tool，不額外計費）
  │
  ├─ Stage 1: 題目制定    → 分析 DB 缺口，產出 3-5 個研究問題
  ├─ Stage 2: 查詢研究員  → 搜尋 DB，誠實標記來源（不補腦）
  │     ↑ 退回補查（最多 1 次）
  ├─ Stage 3: 檢核        → 嚴格驗證，存疑優先
  ├─ Stage 4: 觀點討論    → 六角度：支持／反對／存疑／謹慎／務實／整合
  ├─ Stage 5: 查核        → 跨來源一致性，攔截敏感宣稱
  └─ Stage 6: 深度研究    → 補全欄位，curl POST 寫入 DB
```

DB API 呼叫透過 Bash + curl 完成，不需要 axios 或 Node.js。

---

## 設定

確保 Claude Code session 能讀到這兩個環境變數：

```bash
SKINCARE_API_BASE=http://localhost:3000/api
SKINCARE_API_KEY=your_api_key
```

---

## 設計原則對應

| 原則 | 實作 |
|---|---|
| 高度知識水平 | Verifier / Debate / Auditor / DeepResearcher 使用 Claude Code 最強模型 |
| 查核事實真偽 | Stage 3 嚴格分級，TRAINING_MEMORY 不得標 verified |
| 不胡亂編造 | Stage 2 明確標 TRAINING_MEMORY，禁止補腦，DOI 不確定填 null |
| 不同觀點 | Stage 4 六角度：存疑、謹慎、務實一定要給篇幅 |
| 懂得討論 | Stage 3 → Orchestrator → Stage 2 退回補查閉環 |
| 願意溝通 | 每個 Agent 有明確的 needs_more_research + suggested_followup |
