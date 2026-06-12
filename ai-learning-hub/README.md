# AI 學習中心(AI Learning Hub)

一個收集 **最新主流 AI 新聞**、**AI 教學** 與 **高分好用資源** 的靜態網站,
目的是把這些內容快速轉成文章發布到社群媒體,幫助一般人與專業人士學習 AI。

## ✨ 功能

- **📰 AI 新聞**:追蹤 OpenAI、Anthropic、Google 等主流動態,可依「一般人 / 專業人士」篩選
- **🎓 AI 教學**:精選課程與教學,依難度(入門 / 中級 / 進階)分級
- **⭐ 精選資源**:高分 AI 工具清單,附星級評分、分類與價格資訊
- **✍️ 社群貼文產生器**:每張卡片一鍵產生 Facebook / Threads / X / LinkedIn 貼文草稿,自動帶入標題、摘要、hashtag 與連結,並依平台字數限制裁切,可編輯後一鍵複製
- **🛠 貼文工坊**:可操作的 [social-post skill](https://github.com/Hao0321/claude-skill-social-post) 面板 — 選內容、套公式(F6b / F15 / F16 / F19 / F7)、即時規則檢查(R25 / R34 / F19 排版鐵則等),並可一鍵複製「給 Claude Code 的生成指令」
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
| `data/news.data.js` | AI 新聞 | id, title, summary, source, date, url, tags, audience |
| `data/tutorials.data.js` | AI 教學 | id, title, summary, level, duration, url, tags, audience |
| `data/resources.data.js` | 精選資源 | id, title, summary, rating, category, pricing, url, tags |
| `data/posts.data.js` | AI 生成的貼文草稿 | 以內容 id 為 key,含 facebook / threads / x / linkedin 四種版本 |

每個項目的 `id` 必須唯一(新聞 `n-`、教學 `t-`、資源 `r-` 前綴),`posts.data.js` 透過 id 對應貼文草稿。

- `level`:`beginner`(入門)/ `intermediate`(中級)/ `advanced`(進階)
- `rating`:1–5 分,可含小數
- `audience`:`一般人` 或 `專業人士`

## 🤖 用 Claude Code + social-post skill 批次生成貼文

貼文產生器有兩種來源:

- **內建模板**:純 JavaScript 規則,永遠可用
- **AI 草稿**:用 Claude Code 在本機執行 `/generate-posts` 指令(定義在 `.claude/commands/generate-posts.md`),搭配 [social-post skill](https://github.com/Hao0321/claude-skill-social-post) 為每個內容項目批次生成四個平台的草稿,寫入 `data/posts.data.js`

有 AI 草稿的項目,貼文視窗會顯示「🤖 AI 草稿」徽章並優先採用,可隨時切換回模板版本。`data/posts.data.js` 內附 `r-claude` 範例,即為 skill 應輸出的格式。

### 已套用的 skill 核心規則

- **R25**:FB / Threads 正文絕不放外部連結(演算法會降觸及)— 連結改放 `linkComment` 欄位,網站會顯示「貼到留言區」的專屬複製框,內建模板也遵守此規則
- **F19**:Threads 排版鐵則 — 單段、逗號流、60-150 字、hashtag 只 1 個
- **R15 / R16**:FB 結尾用開放式提問 + 引導分享給朋友
- **R34**:避免 AI 腔(抽象空詞、staged 開場)

安裝 skill 後若已用「學我的 FB 風格」建立 `style_profile.md`,`/generate-posts` 會自動套用你的個人語氣(skill 原則:公式 < 語氣)。

### 🛠 貼文工坊(網站內的 skill 面板)

「貼文工坊」分頁把 skill 中**可以在瀏覽器端執行**的部分做成了即時面板:

- **公式模板**:F6b 純血 hype、F15 mini、F16 精選彙整(FB)/ F19 立場宣言、F7 POV 吐槽(Threads)/ X 快訊,選內容後一鍵套骨架,【】處填入個人化內容
- **即時規則檢查**:邊打字邊檢查 R25(正文連結)、R34(AI 腔空詞)、F19 排版鐵則(單段 / 60-150 字 / 「!」≤2 / hashtag 1 個)、R12(每段數字 ≤3)、R15 / R16(CTA 與提問)、X 280 字元等,貼文視窗內也會顯示同樣的檢查
- **複製 Claude Code 指令**:把選好的內容與公式組成一段指令,貼到本機 Claude Code(已安裝 skill)即可用完整 skill + 你的語氣生成

需要 AI 即時生成與自動發佈的部分(學語氣、Chrome 自動發文、戰績追蹤),仍由本機的 Claude Code + skill 完成 — 靜態網站無法執行模型,這是刻意的分工。

> 進一步還能用 skill 本體的 Chrome 自動發佈功能:在網站複製草稿改用「今天發一篇」流程,由 skill 直接發到 FB / Threads / X,並追蹤戰績。

## 📝 內容發布工作流建議

1. 執行 `fetch-news.mjs` 或手動新增內容到 `data/`
2. (可選)在本機用 Claude Code 執行 `/generate-posts`,批次產生 AI 貼文草稿
3. 開啟網站,瀏覽並挑選要分享的內容
4. 點「✍️ 產生貼文」→ 選擇平台 → 編輯草稿(加入個人觀點更有溫度)
5. 「📋 複製貼文」→ 貼到社群平台發布
