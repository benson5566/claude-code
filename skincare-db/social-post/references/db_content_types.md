# 保養資料庫素材類型 × 公式配對表

> P0 規劃時使用：挑選素材類型搭配公式

## 素材類型

### T1｜成分解析
- **API**: `GET /api/ingredients/{id}` → `GET /api/content/ingredient/{id}?platform=ig`
- **適合公式**: F2（截圖先丟）、F6b（Mode B 知識發表）、F3（翻車型：「我以為XX成分很好結果...」）
- **範例題材**: 玻尿酸分子量差異、菸鹼醯胺與維C可以一起用嗎、視黃醇入門踩坑
- **增粉潛力**: ⭐⭐⭐⭐⭐（知識型高儲存率）

### T2｜膚質教育
- **API**: `GET /api/skin-types` → `GET /api/skin-types/{id}/products`
- **適合公式**: F4（里程碑投票）、F6b（乾性vs油性懶人包）、F19（Threads 立場宣言）
- **範例題材**: 你真的是油肌嗎、混合肌保養最常犯的錯、敏感肌不能用酒精？
- **增粉潛力**: ⭐⭐⭐⭐（廣受眾共鳴）

### T3｜保養步驟 / 程序
- **API**: `GET /api/care-methods`
- **適合公式**: F6b（晚間保養教學）、F2（步驟截圖）、F15 mini（30字極短版）
- **範例題材**: 視黃醇入門 3 步、防曬正確補擦方式、早晚護膚順序懶人包
- **增粉潛力**: ⭐⭐⭐⭐⭐（收藏率極高）

### T4｜科研快訊
- **API**: `GET /api/research/{id}` → `GET /api/content/research-highlight/{id}`
- **適合公式**: F6b（研究發現發表）、F3（「期刊說和我想的不一樣」）、F14-F17（思想領袖型）
- **範例題材**: 最新研究發現XX成分有效、XX成分被EU限制了
- **增粉潛力**: ⭐⭐⭐（小眾但高信任度）

### T5｜環境 / 成分道德
- **API**: `GET /api/environment`
- **適合公式**: F19（Threads 立場宣言）、F6b（無良知配方揭露）
- **範例題材**: 你的防曬是在殺珊瑚礁嗎、Cruelty-free 跟 Vegan 的差別
- **增粉潛力**: ⭐⭐⭐（價值觀共鳴，強分享）

### T6｜產品開箱 / 評測
- **API**: `GET /api/products/{id}` → `GET /api/content/product/{id}?platform=ig`
- **適合公式**: F2（成分表截圖吐槽/稱讚）、F6b（開箱敘事）、F3（翻車復盤）
- **範例題材**: 這款面霜的成分表太猛了、買了後悔的保養品
- **增粉潛力**: ⭐⭐⭐⭐（互動高，常被問推薦）

### T7｜翻車 / 踩坑復盤
- **API**: 多個端點搭配
- **適合公式**: F3（翻車復盤）、F6b（「我做錯了」懺悔型）
- **範例題材**: 我用了半年視黃醇才懂的事、花 5000 買的精華液踩坑記
- **增粉潛力**: ⭐⭐⭐⭐⭐（真實感最強，轉發率最高）

---

## 平台素材配對建議

| 平台 | 最適素材 | 長度 | 公式 |
|------|---------|------|------|
| **FB** | T7翻車、T1成分長文、T6開箱 | 長文 150-400 字 | F3/F6b/F2 |
| **IG** | T3步驟、T6產品、T2膚質 | 短說明 + 圖 | F2/F6b |
| **Threads** | T5環境、T4科研、T2膚質宣言 | 60-150 字單段 | F19/F15mini |
| **X** | T4科研、T1成分比較 | 短串 | F14/F15mini |

---

## API 呼叫快速參考

```bash
# 取成分資料（用 id 換）
GET /api/ingredients/1

# 取成分的社群貼文草稿
GET /api/content/ingredient/1?platform=ig

# 取膚質適合的產品
GET /api/skin-types/1/products

# 取保養步驟
GET /api/care-methods?time_of_day=evening

# 取科研快訊貼文
GET /api/content/research-highlight/1

# 搜尋產品
GET /api/products?q=玻尿酸&type=精華液
```
