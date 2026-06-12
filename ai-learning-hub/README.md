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

## 📥 撈取 YouTube 教學(半自動 + 人工審核)

```bash
node scripts/fetch-tutorials.mjs
```

從追蹤頻道的 **YouTube 官方 RSS**(不需 API key、不違反服務條款)撈最新影片到 `data/inbox.data.js`,
然後到網站「📥 待審」分頁人工審核:

1. **✅ 收錄**:選取要加入教學庫的影片(狀態存在瀏覽器 localStorage)
2. **🗑 略過**:不適合的直接隱藏
3. 匯出方式二選一:
   - **複製收錄程式碼** → 貼進 `data/tutorials.data.js`,手動調整難度與適合對象
   - **複製 Claude Code 指令** → 交給 Claude Code 自動寫入並判斷難度

> 設計原則:**自動撈候選、人工做把關**。教學內容的品質與正確性比數量重要,
> 錯誤的教學比沒有教學更傷讀者信任,所以不做全自動入庫。

追蹤頻道清單在 `scripts/fetch-tutorials.mjs` 的 `CHANNELS` 陣列(支援 `@handle` 或 channel id),可自行增減。
已收錄過的影片(URL 已存在於 `tutorials.data.js`)不會重複出現在待審清單。

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

## 🎬 深度分析 YouTube 影片:/analyze-video

在本機 Claude Code 執行 `/analyze-video <影片網址或逐字稿>`(定義在 `.claude/commands/analyze-video.md`),
把影片整理成**詳細的結構化筆記**(TL;DR、時間軸、核心觀念、實作步驟、名詞解釋…),存入 `articles/`。

### 沒有字幕的影片也能分析:transcribe.mjs(免費語音辨識)

```bash
pip install yt-dlp whisper-ctranslate2   # 一次性安裝(免費開源)
node scripts/transcribe.mjs <影片網址>    # 產出 articles/transcripts/<id>.txt
```

腳本流程:**先抓 YouTube 現成字幕(含自動字幕)→ 沒有才下載音訊用
[Whisper](https://github.com/openai/whisper) 本機語音辨識**。
Whisper 是 OpenAI 開源的辨識模型,完全免費、離線執行、支援中文;
預設 `small` 模型(首次自動下載約 460MB,CPU 可跑),要更準用 `--model medium`。

逐字稿來源總整理(擇一):
1. `node scripts/transcribe.mjs <網址>` — 全自動,含無字幕影片
2. 手動:YouTube 影片說明欄「…更多 → 顯示轉錄稿」複製貼上
3. 也可改用 [NotebookLM](https://notebooklm.google.com/) 貼影片網址做初步分析,再把結果交給 Claude 整理

筆記是詳細內容;要發社群再用 `/convert-post articles/<檔名>.md` 轉換。

## 🔁 把任意內容轉成社群貼文:/convert-post

在本機 Claude Code 執行 `/convert-post <網址或內容>`(定義在 `.claude/commands/convert-post.md`),
即可把**影片、文章、網頁、任何資源**轉成四個平台的貼文草稿:

```
/convert-post https://example.com/some-article
/convert-post(直接貼上整段文字或影片重點)
```

流程:抓取內容 → 提煉重點(英文自動翻譯改寫)→ 套 social-post skill 規則生成
FB / Threads / X / LinkedIn 草稿 → 確認後可選擇收進網站資料庫與 `posts.data.js`。

## 📝 內容發布工作流建議

1. 執行 `fetch-news.mjs` 或手動新增內容到 `data/`
2. (可選)在本機用 Claude Code 執行 `/generate-posts`,批次產生 AI 貼文草稿
3. 開啟網站,瀏覽並挑選要分享的內容
4. 點「✍️ 產生貼文」→ 選擇平台 → 編輯草稿(加入個人觀點更有溫度)
5. 「📋 複製貼文」→ 貼到社群平台發布
