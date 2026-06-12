---
description: 用 social-post skill 批次為 AI 學習中心的內容生成各平台貼文草稿
---

為 `ai-learning-hub` 網站的內容批次生成社群媒體貼文草稿,寫入 `ai-learning-hub/data/posts.data.js`。
本指令**只生成草稿、不發佈**,所以不需要 Chrome MCP,也不觸發 social-post skill 的發佈安全閘。

## 前置:social-post skill

風格與公式來自 [Hao0321/claude-skill-social-post](https://github.com/Hao0321/claude-skill-social-post)。

1. 檢查 `~/.claude/skills/social-post/` 是否存在。
   - 存在 → 讀取 `SKILL.md`,以及 `references/` 中的 `rules.md`、`formulas.md`、`facebook.md`、`threads.md`、`x.md`。
   - 不存在 → 告知使用者依該 repo 的 `docs/setup.md` 安裝,本次先 clone 該 repo 到暫存目錄讀取相同檔案繼續執行。
2. 若 `~/.claude/skills/social-post/style_profile.md` 存在(使用者已學過個人語氣),生成時必須套用該語氣 — skill 原則:**公式 < 語氣**。

## 步驟

1. 讀取內容資料(每項都有唯一 `id`):
   - `ai-learning-hub/data/news.data.js`(新聞,`n-` 前綴)
   - `ai-learning-hub/data/tutorials.data.js`(教學,`t-` 前綴)
   - `ai-learning-hub/data/resources.data.js`(資源,`r-` 前綴)
2. 讀取 `ai-learning-hub/data/posts.data.js`,找出**還沒有草稿**的項目。若使用者有指定 id 或「全部重新生成」,以使用者指示為準:$ARGUMENTS
3. 對每個待處理項目生成四個平台的版本,**必須遵守 skill 規則**:

   | 平台 | 格式要求 |
   |------|----------|
   | `facebook` | 鉤子開頭 + 分段條列;**R25:正文絕不放外部連結**;R15:CTA 引導「分享給朋友」;R16:結尾開放式提問;hashtag ≤ 4 |
   | `threads` | **F19 排版鐵則:單段、不換行、逗號流、60-150 字、「!」最多 2 個、hashtag 只 1 個**;正文無連結(R25) |
   | `x` | ≤ 280 字元(URL 算 23 字);punchline 放最前;hashtag 1-2 個放句末;連結可放正文 |
   | `linkedin` | 專業視角、適合知識工作者;連結可放正文;hashtag 以英文為主 |

   - **R34 反 AI 腔**:禁止抽象空詞(「護城河」「本質」「真正的 X」)、staged 開場與 over-narrate;語氣要像真人
   - 事實以資料檔的 `summary` 為準,不可捏造數據或誇大
   - 每項另外生成 `linkComment` 欄位:發文後貼到留言區的連結文字(例:`🔗 完整文章 → <url>`)
4. 合併寫回 `ai-learning-hub/data/posts.data.js`,維持既有格式:

   ```js
   window.POSTS_DATA = {
     "<id>": {
       generatedAt: "YYYY-MM-DD",
       facebook: "...",
       threads: "...",
       x: "...",
       linkedin: "...",
       linkComment: "🔗 ... → <url>"
     }
   };
   ```

5. 用 `node --check ai-learning-hub/data/posts.data.js` 驗證語法。
6. 回報生成了幾個項目,並提醒使用者:草稿僅供參考,發佈前請在網站上人工檢查、加入個人觀點。
