# social-post × 保養品資料庫 Skill

> 本 skill 整合自 https://github.com/Hao0321/claude-skill-social-post
> 針對保養品知識帳號客製化，以保養品資料庫 API 作為內容來源

---

## 路由規則（每次呼叫必須先路由）

一句話告訴使用者進入哪個 Phase，給他一秒反應機會。

| 使用者說 | Phase |
|---------|-------|
| 「學我的風格」「分析我的 FB」 | **P1** 風格學習 |
| 「排行事曆」「排 14 天」 | **P0** 內容規劃 |
| 「發文」「PO 文」「今天要發什麼」 | **P2** 生成 + 發佈 |
| 「看數據」「這篇好嗎」 | **Diagnostic** 診斷 |
| 「查規則 R__」「歷史案例」 | **Rules / Case** 查閱 |

---

## P1 — 風格學習

1. 用 Chrome MCP 開啟使用者 Facebook，爬最近 20 篇公開貼文
2. 依 `references/learn_style.md` 結構分析聲音特徵
3. 覆寫 `style_profile.md`（若不存在則新建）
4. 最後確認：「風格檔已更新，偵測到你的聲音是 ___，對嗎？」

---

## P0 — 保養內容日曆規劃

**讀取**：`style_profile.md` + `references/formulas.md` + `references/db_content_types.md`

1. 詢問目標：增粉 / 知識建立 / 商品轉單 / 三者混合
2. 詢問頻率：每週幾篇
3. 從 `references/db_content_types.md` 挑選保養素材類型（成分解析、膚質教育、保養步驟、科研快訊、環境意識、產品評測、翻車復盤）
4. 用 `references/formulas.md` 的公式（F2/F3/F4/F6b/F8/F19）搭配素材
5. 覆寫 `content_plan.md`

---

## P2 — 生成並發佈

**讀取**：`style_profile.md` + `content_plan.md`（今天是第幾天）+ `references/formulas.md`（對應公式段落）+ `references/rules.md`（相關規則）

### 步驟

1. **查今天 Day**：讀 `content_plan.md` 確認今日公式與素材
2. **從保養資料庫取素材**：
   - 成分貼文 → `GET /api/content/ingredient/{id}?platform={平台}`
   - 產品貼文 → `GET /api/content/product/{id}?platform={平台}`
   - 保養小技巧 → `GET /api/content/tips`
   - 科研快訊 → `GET /api/content/research-highlight/{id}`
3. **套入公式骨架**：依今日公式結構改寫成你的聲音（參照 `style_profile.md`）
4. **發佈前確認**：把草稿完整展示給使用者，**等到看到「確認」或「發」才動作**
5. **發佈**：用 Chrome MCP 貼到對應平台
6. **記錄戰績**：發完後追加到 `content_plan.md` 的戰績表

---

## 安全規則（硬限制，不可違反）

- 看到使用者明確說「確認」或「發」前，**絕不觸碰發佈按鈕**
- 主文不附外部連結（演算法降權 30-50%）
- 不自動按讚、追蹤、大量留言
- 不刪除使用者內容

---

## 保養資料庫 API 位址

從 `.env` 讀取 `SKINCARE_API_URL` 和 `SKINCARE_API_KEY`，預設：
- URL: `http://localhost/api`
- 需要 header: `x-api-key: <SKINCARE_API_KEY>`

---

## 參考檔案清單

| 檔案 | 用途 |
|------|------|
| `style_profile.md` | 使用者聲音 profile（P1 生成） |
| `content_plan.md` | 14 天內容日曆 + 戰績表 |
| `references/formulas.md` | 病毒公式 F1-F27（來自原 skill） |
| `references/rules.md` | R1-R35 發文規則（來自原 skill） |
| `references/case_studies.md` | 實戰案例（來自原 skill） |
| `references/db_content_types.md` | 保養資料庫素材類型說明 |
| `references/learn_style.md` | 風格學習分析框架 |
