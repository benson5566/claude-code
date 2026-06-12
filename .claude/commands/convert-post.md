---
description: 把使用者提供的內容(影片、文章、網頁、資源)轉換成各平台社群貼文草稿
---

把使用者提供的任意內容轉換成社群貼文草稿。內容可能是:網址(文章/網頁/YouTube 影片)、
貼上的整段文字、檔案路徑,或一句主題描述。使用者輸入:$ARGUMENTS

## 步驟

1. **取得內容**:
   - 網址 → 用 WebFetch 抓取頁面內容;YouTube 連結抓標題與說明(無法取得逐字稿時,
     請使用者貼上影片重點或字幕)
   - 貼上的文字 / 檔案路徑 → 直接讀取
   - 抓取失敗(付費牆、網路限制)→ 請使用者直接貼內容,不要憑空猜測
2. **提煉重點**:整理出標題、3-5 個核心重點、目標讀者(一般人/專業人士)、原始連結。
   **事實以原文為準,不可捏造數據**;英文內容翻譯改寫成自然的繁體中文。
3. **生成貼文**:遵循 social-post skill 規則(skill 安裝於 `~/.claude/skills/social-post/`,
   未安裝則參考 `.claude/commands/generate-posts.md` 中的規則表):
   - `facebook`:鉤子開頭 + 條列重點;R25 正文不放連結;R15 分享 CTA;R16 結尾開放式提問
   - `threads`:F19 單段逗號流、60-150 字、「!」≤2、hashtag 1 個、無連結
   - `x`:≤280 字元、punchline 在前、hashtag 1-2 個
   - `linkedin`:專業視角、英文 hashtag
   - `linkComment`:發文後貼留言區的連結文字
   - R34 反 AI 腔;若有 `style_profile.md` 套用使用者語氣
4. **輸出**:在對話中完整列出四個平台的草稿讓使用者檢視。
5. **詢問是否入庫**(使用者要求才做):
   - 收進網站 → 依內容性質加入 `ai-learning-hub/data/` 的 news / tutorials / resources
     (id 唯一、格式照既有項目),並把草稿寫入 `posts.data.js`(同 id + linkComment)
   - 寫入後用 `node --check` 驗證所有改過的資料檔
