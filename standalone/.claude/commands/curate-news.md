---
description: 把撈回的原始新聞素材整理成繁中、具學習價值的新聞,合併進網站
---

把 `data/news-inbox.data.js` 的原始素材(fetch-news.mjs 撈取,多為英文或未整理)
整理成適合「AI 學習中心」的新聞,合併進 `data/news.data.js`。
使用者額外要求:$ARGUMENTS

## 步驟

1. 讀取 `data/news-inbox.data.js`(原始素材)與 `data/news.data.js`(已發布)。
   素材是空的就提醒使用者先執行 `node scripts/fetch-news.mjs`。
2. **篩選** — 收錄標準是「對想學 AI 的人有價值」,符合任一即收:
   - 主流模型/工具的重要更新(影響一般使用者或開發者的)
   - 有教學、實作價值的內容(官方 guide、how-to)
   - 重要產業趨勢或法規(影響學習方向的)

   **略過**:純行銷稿、財報、與 AI 學習無關的硬體消息、同一事件的重複報導
   (保留資訊最完整的一則)、單純的產品促銷。
3. **改寫每一則收錄的素材**(這是關鍵步驟,不是翻譯而是編輯):
   - `title`:繁體中文,資訊量足、不誇大、一句話能懂發生什麼事
   - `summary`:2-3 句繁中白話。第一句講「發生什麼」,第二句講
     「為什麼學 AI 的人值得關注 / 可以怎麼用」— 這是學習視角,必須有
   - `id`:`n-` 開頭的唯一英文 slug;`date` 保留原日期;`source` 保留
   - `tags`:2-3 個中文標籤;`audience`:判斷「一般人」或「專業人士」
   - 事實以素材為準,不確定的不要寫;標題黨原文要改寫成中性敘述
4. 帶有 `教學` tag 且確實是教學內容(guide/how-to)的素材,**建議改收進
   `data/tutorials.data.js`**(格式照該檔,level 自行判斷),在回報中列出並詢問使用者。
5. **合併進 `data/news.data.js`**:新項目放陣列前面、以 url 去重、
   總數超過 30 則時裁掉最舊的。
6. 清空 `data/news-inbox.data.js`(寫回 `window.NEWS_INBOX = [];` 與註解)。
7. `node --check data/news.data.js` 驗證。
8. 回報:收錄 X 則(列標題)、略過 Y 則(附原因分類:不相關/重複/行銷),
   並提醒 commit + push 後網站才會更新。
