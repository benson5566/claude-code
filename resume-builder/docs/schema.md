# Resume Data Schema

> 一份資料、多套模板。這份 schema 是 `resume.json` 的標準結構，所有模板都吃這份資料。

## 設計原則

1. **扁平優先**：避免過度巢狀，方便表單 render
2. **陣列固定欄位**：每筆 item 的欄位名固定，模板才能反射
3. **所有欄位可空**：允許部分填寫，不強制所有區塊都要有資料
4. **Meta 分離**：主題、SEO、語言放在 `meta`，不污染內容

## Schema（TypeScript 風格）

```ts
interface Resume {
  profile: {
    name: string;
    title: string;           // 例: "Product Designer · Based in Taipei"
    avatar?: string;         // URL
    email?: string;
    location?: string;
    summary?: string;        // 3-4 句自我介紹
  };
  social?: {
    linkedin?: string;
    github?: string;
    website?: string;
    twitter?: string;
  };
  experiences: Array<{
    company: string;
    role: string;
    start: string;           // "YYYY-MM"
    end: string | "present"; // "YYYY-MM" 或 "present"
    achievements: string[];  // 最多 3-5 項
    tech?: string[];
  }>;
  education?: Array<{
    school: string;
    degree: string;
    major?: string;
    start?: string;
    end?: string;
  }>;
  skills: Array<{
    category: string;        // 例: "Design", "Frontend", "Tools"
    items: string[];         // 最多 5 項
  }>;
  projects?: Array<{
    name: string;
    description: string;
    url?: string;
    tech?: string[];
    image?: string;
  }>;
  meta?: {
    theme?: "bento" | "terminal" | "minimal";
    lang?: "zh-TW" | "en" | "ja";
    accent?: string;         // HEX，主題強調色
    seo?: {
      title?: string;
      description?: string;
      ogImage?: string;
    };
  };
}
```

## 範例（sample.json 內容形式）

見 `demo/sample.json`。

## 驗證規則（未來加 Zod / JSON Schema）

- `profile.name` 必填
- `experiences[].start/end` 格式為 `YYYY-MM` 或 `present`
- 所有 URL 需符合 `https?://` 或為空字串
- 陣列長度上限：experiences 10、skills 6、projects 12（避免爆版）
