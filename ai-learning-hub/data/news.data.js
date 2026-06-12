// AI 新聞資料 — 可手動編輯,或執行 `node scripts/fetch-news.mjs` 自動更新
// 欄位:title(標題)、summary(摘要)、source(來源)、date(YYYY-MM-DD)、url(連結)、tags(標籤)、audience(適合對象)
window.NEWS_DATA = [
  {
    title: "OpenAI 發布 GPT-5.1,推理與寫作能力再升級",
    summary: "OpenAI 推出 GPT-5.1 系列模型,主打更自然的對話風格與更強的指令遵循能力,並提供 Instant 與 Thinking 兩種模式,讓使用者在速度與深度推理之間取得平衡。",
    source: "OpenAI",
    date: "2025-11-12",
    url: "https://openai.com/index/gpt-5-1/",
    tags: ["OpenAI", "GPT", "大型語言模型"],
    audience: "一般人"
  },
  {
    title: "Anthropic 推出 Claude Opus 4.5,程式開發能力刷新紀錄",
    summary: "Anthropic 發布 Claude Opus 4.5,在 SWE-bench 等軟體工程基準測試中表現領先,同時大幅調降 API 價格,讓開發者更容易把頂級模型整合進產品。",
    source: "Anthropic",
    date: "2025-11-24",
    url: "https://www.anthropic.com/news/claude-opus-4-5",
    tags: ["Anthropic", "Claude", "程式開發"],
    audience: "專業人士"
  },
  {
    title: "Google 發表 Gemini 3,多模態理解全面進化",
    summary: "Google DeepMind 推出 Gemini 3 系列,強化多模態理解、長上下文與代理(Agent)能力,並深度整合進搜尋、Workspace 與 Android 生態系。",
    source: "Google DeepMind",
    date: "2025-11-18",
    url: "https://blog.google/products/gemini/gemini-3/",
    tags: ["Google", "Gemini", "多模態"],
    audience: "一般人"
  },
  {
    title: "AI Agent 元年:企業加速導入自動化智慧代理",
    summary: "從客服、行銷到軟體開發,2025 年企業大規模導入 AI Agent。Anthropic 的 MCP(Model Context Protocol)成為連接 AI 與工具的開放標準,獲多家大廠採用。",
    source: "產業趨勢",
    date: "2025-12-01",
    url: "https://modelcontextprotocol.io/",
    tags: ["AI Agent", "MCP", "企業應用"],
    audience: "專業人士"
  },
  {
    title: "開源模型急起直追:Llama、Qwen、DeepSeek 縮小差距",
    summary: "開源與開放權重模型持續進步,DeepSeek、Qwen 與 Llama 系列在多項基準測試逼近閉源模型,讓個人與中小企業能以更低成本在本地部署 AI。",
    source: "產業趨勢",
    date: "2025-10-20",
    url: "https://huggingface.co/models",
    tags: ["開源", "本地部署", "Llama"],
    audience: "專業人士"
  },
  {
    title: "AI 影音生成大爆發:Sora、Veo 帶動創作者經濟",
    summary: "OpenAI Sora 與 Google Veo 等影片生成模型快速普及,短影音創作門檻大幅降低,同時也引發版權與深偽(Deepfake)監管的熱烈討論。",
    source: "產業趨勢",
    date: "2025-10-06",
    url: "https://openai.com/sora/",
    tags: ["影片生成", "Sora", "創作者"],
    audience: "一般人"
  },
  {
    title: "歐盟 AI 法案進入實施階段,全球監管框架成形",
    summary: "歐盟《人工智慧法案》(EU AI Act)分階段生效,對高風險 AI 應用提出透明度與安全要求,成為全球 AI 治理的重要參考範本。",
    source: "政策法規",
    date: "2025-08-02",
    url: "https://artificialintelligenceact.eu/",
    tags: ["AI 法規", "歐盟", "AI 治理"],
    audience: "專業人士"
  },
  {
    title: "NotebookLM 掀起「AI 學習筆記」風潮",
    summary: "Google NotebookLM 的 Audio Overview 功能可將文件轉成 Podcast 式對談,成為學生與知識工作者整理資料、快速吸收新知的熱門工具。",
    source: "Google",
    date: "2025-09-15",
    url: "https://notebooklm.google.com/",
    tags: ["NotebookLM", "學習工具", "生產力"],
    audience: "一般人"
  }
];
