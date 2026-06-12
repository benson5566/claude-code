# AI 學習中心(AI Learning Hub)

一個收集 **最新主流 AI 新聞**、**AI 教學** 與 **高分好用資源** 的靜態網站,
目的是把這些內容快速轉成文章發布到社群媒體,幫助一般人與專業人士學習 AI。

## ✨ 功能

- **📰 AI 新聞**:追蹤 OpenAI、Anthropic、Google 等主流動態,可依「一般人 / 專業人士」篩選
- **🎓 AI 教學**:精選課程與教學,依難度(入門 / 中級 / 進階)分級
- **⭐ 精選資源**:高分 AI 工具清單,附星級評分、分類與價格資訊
- **✍️ 社群貼文產生器**:每張卡片一鍵產生 Facebook / Threads / X / LinkedIn 貼文草稿,自動帶入標題、摘要、hashtag 與連結,並依平台字數限制裁切,可編輯後一鍵複製
- **🔍 搜尋與篩選**:全文搜尋標題、摘要與標籤

純 HTML / CSS / JavaScript,**不需安裝任何套件**。

## 🚀 使用方式

### 本地預覽

```bash
cd ai-learning-hub
python3 -m http.server 8000
# 或 npx serve
```

打開 http://localhost:8000 即可。直接雙擊 `index.html` 也能運作。

### 部署到 GitHub Pages

到儲存庫 **Settings → Pages**,選擇分支並將目錄指向 `ai-learning-hub/`(或把整個資料夾放到獨立儲存庫的根目錄)。

## 🔄 更新新聞

執行內建腳本,從主流 AI 來源的 RSS 抓取最新新聞(需 Node 18+,無需安裝套件):

```bash
node scripts/fetch-news.mjs
```

腳本會更新 `data/news.data.js`。**發布前請務必人工檢查**:摘要為原文擷取(多為英文),建議翻譯改寫後再產生貼文。

新聞來源定義在 `scripts/fetch-news.mjs` 的 `FEEDS` 陣列,可自行增減。

## ✏️ 編輯內容

所有內容都在 `data/` 目錄,直接編輯即可,不需建置:

| 檔案 | 內容 | 主要欄位 |
|------|------|----------|
| `data/news.data.js` | AI 新聞 | title, summary, source, date, url, tags, audience |
| `data/tutorials.data.js` | AI 教學 | title, summary, level, duration, url, tags, audience |
| `data/resources.data.js` | 精選資源 | title, summary, rating, category, pricing, url, tags |

- `level`:`beginner`(入門)/ `intermediate`(中級)/ `advanced`(進階)
- `rating`:1–5 分,可含小數
- `audience`:`一般人` 或 `專業人士`

## 📝 內容發布工作流建議

1. 執行 `fetch-news.mjs` 或手動新增內容到 `data/`
2. 開啟網站,瀏覽並挑選要分享的內容
3. 點「✍️ 產生貼文」→ 選擇平台 → 編輯草稿(加入個人觀點更有溫度)
4. 「📋 複製貼文」→ 貼到社群平台發布
