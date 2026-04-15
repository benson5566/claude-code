# CoffeeCV · Resume Builder

> 一杯咖啡的時間，擁有一張會說話的履歷

這是 **L3 Demo + Landing Page** 的原始碼，用於客戶訪談驗證與預購頁面。
無 build step，任何靜態主機皆可部署。

## 目錄結構

```
resume-builder/
├── demo/
│   ├── index.html     # L3 Demo（表單 + Bento Grid 即時預覽）
│   ├── styles.css     # 自訂樣式
│   ├── app.js         # 表單邏輯 / 預覽渲染 / 匯入匯出
│   └── sample.json    # 範例履歷資料
├── landing/
│   └── index.html     # Landing Page（Hero / 比較 / 定價 / FAQ / CTA）
└── docs/
    ├── spec.md         # L3 Demo 規格書（範圍 / DoD / 訪談用法）
    ├── schema.md       # Resume JSON schema（TypeScript interface）
    └── landing-copy.md # 文案手冊（Slogan / FAQ / 定價）
```

## 快速啟動

### 本機開發

```bash
# 推薦：用 npx serve 起一個 static server（避免 fetch sample.json 的 CORS 問題）
cd resume-builder
npx serve .

# 或用 Python
python3 -m http.server 8080
```

然後開：
- Demo：`http://localhost:3000/demo/`
- Landing：`http://localhost:3000/landing/`

> ⚠️ 直接用 `file://` 開啟 demo/index.html 時，「載入範例」按鈕因瀏覽器 CORS 限制會失敗，請改用 http server。

### 部署（三選一）

**Vercel（推薦）**
```bash
npx vercel resume-builder/
```

**Netlify**
```bash
# 把 resume-builder/ 目錄拖進 Netlify Drop
# 或設 Base directory = resume-builder
```

**Cloudflare Pages**
- Build command: 留空
- Output directory: `resume-builder`

## Demo 功能清單

| 功能 | 說明 |
|------|------|
| 即時預覽 | 每個 input 事件 < 100ms 更新 Bento Grid |
| 載入範例 | 秒填完整履歷（小雅 persona） |
| 匯出 JSON | 下載 `resume-[timestamp].json` |
| 匯入 JSON | 從檔案恢復資料 |
| 分享連結 | 資料 base64 編碼進 URL，可直接分享 |
| 主題色 | 5 個預設色票 + color picker |
| 假 AI 潤稿 | Toast 模擬，真實版接 Claude API |
| 手機版 | 上下切換「填寫」/「預覽」 |

## 訪談使用指引

1. 部署後把 Demo URL 提前傳給受訪者
2. 請他「把範例資料改成你自己的」→ 觀察卡在哪個欄位
3. 用「分享連結」讓他把結果傳給你留存
4. 問：「如果這是 NT$2,980 的成品，你會買嗎？差一點什麼？」

詳見 `docs/spec.md`。

## Tech Stack

| 層 | 選擇 | 理由 |
|----|------|------|
| HTML | Vanilla | 無 build step |
| CSS | Tailwind CDN + 自訂 | 快速開發，不鎖 Next.js |
| JS | Vanilla ES2022 | 無框架，降低心智負擔 |
| 字型 | Google Fonts (Inter + Noto Sans TC) | 中英文最佳組合 |

## 下一步路徑（驗證後）

- [ ] **第 2、3 套模板**（Terminal CLI、Minimal Mono）
- [ ] **真實 AI 潤稿**（接 Claude API，Haiku 4.5 節省成本）
- [ ] **帳號 + 後台**（Supabase Auth + 編輯介面）
- [ ] **Stripe 付款**（拿到第 5 筆預購後再做）
- [ ] **Next.js 升級**（流量上來後提升 DX 與 ISR）

## 產品名稱

**CoffeeCV** — Your resume, one coffee away.

---

*這份 README 是 L3 Demo 的配套文件。在取得真實客戶回饋並確認 PMF 前，請勿投入大量工程資源。*
