# L3 Demo 規格書

> 目的：做到能拿去「訪談 + 預購頁」用的 fidelity。非最終產品，但需給受訪者「這是真的可以用的東西」的直覺。

## 產品名（暫定）

**CoffeeCV** — 一杯咖啡的時間，擁有一張會說話的履歷。

## L3 Demo 範圍

### In Scope
- 單一模板：**Bento Grid**（首發 flagship，覆蓋最大客群）
- 單頁式 (SPA) 左右分欄：左邊表單、右邊即時預覽
- 表單欄位（MVP）：
  - Profile：姓名、一句話定位、大頭照 URL、Email、地點
  - Summary：自我介紹（3-4 句）
  - Experience：公司、職稱、起迄、3 項成就（最多 3 筆）
  - Skills：分 3 組，每組最多 5 項
  - Projects：作品名、描述、連結、技術 tag（最多 3 筆）
  - Social：LinkedIn / GitHub / Website
- **即時預覽**：表單每個欄位 `input` 事件都立即更新右側渲染
- **範例資料**：點「載入範例」可秒填一份完整履歷，降低受訪者門檻
- **匯出 / 匯入 JSON**：讓使用者把資料帶走或載回
- **分享連結**：把資料 base64 塞進 URL，產生可分享的預覽連結（訪談時關鍵：「把它傳給你朋友看」）
- 響應式：桌機左右分欄、手機上下堆疊並提供「只看預覽」切換

### Out of Scope（L3 不做）
- 多模板切換（等驗證後再補 Terminal / Minimal）
- 真實部署到自訂網域
- 後台帳號、付款、Stripe 整合（交給 Landing Page 的 fake door）
- AI 潤稿（太貴太重，訪談時用「假按鈕 + toast」模擬）
- 多語系（先繁中 + 英文內容混排足矣）

## 驗收標準（DoD）

1. 打開 `demo/index.html` 即可使用，不需 build step
2. 填任何欄位，右邊預覽 < 100ms 更新
3. 點「載入範例」可看到完整履歷
4. Lighthouse 效能 ≥ 90（純靜態應該輕鬆達標）
5. iPhone 12 / Pixel 7 / MacBook 13 三種尺寸都不破版
6. 匯出 JSON → 清空 → 匯入 JSON → 資料完整還原

## 訪談用法

1. 訪談前 5 分鐘，請受訪者自己打開 demo URL、載入範例
2. 請他「把範例資料改成你自己的」→ 觀察卡在哪個欄位
3. 問：「如果這是 NT$2,980 的成品，你會買嗎？差一點什麼？」
4. 問：「你會把這個連結寄給誰看？」（測驗傳播意願）

## 技術選型（刻意最小化）

| 項目 | 選擇 | 理由 |
|------|------|------|
| HTML | 原生 | 無 build step |
| CSS | Tailwind CDN | 快速樣式，不鎖死 Next.js |
| JS | Vanilla | 不引入框架，降低心智負擔 |
| 字體 | Google Fonts (Inter + Noto Sans TC) | 免費、中英文都好看 |
| 圖示 | Lucide via CDN | 輕量、齊全 |
| 部署 | 任何靜態主機 | Vercel / Netlify / Cloudflare Pages 皆可 |

## 檔案結構

```
demo/
├── index.html       # 入口（表單 + 預覽分欄）
├── styles.css       # 補 Tailwind 不足的樣式
├── app.js           # 表單 → 資料 → 渲染的邏輯
└── sample.json      # 範例資料
```

## 下一步（L3 之後）

- L4 Landing Page（同時產出，見 `landing/`）
- 驗證後：擴充第 2、3 套模板（Terminal CLI、Minimal Mono）
- 真實帳號系統 + Stripe（拿到第 5 筆預購才做）
