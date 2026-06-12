// 精選 AI 資源 — rating 為 1–5 分(可含小數),依實用度與口碑評分
window.RESOURCES_DATA = [
  {
    id: "r-claude",
    title: "Claude",
    summary: "Anthropic 推出的 AI 助手,擅長長文理解、寫作與程式開發,Artifacts 功能可直接生成網頁與文件,Projects 可建立專屬知識庫。",
    rating: 4.8,
    category: "AI 助手",
    pricing: "免費 / 付費方案",
    url: "https://claude.ai/",
    tags: ["對話", "寫作", "程式開發"],
    audience: "一般人"
  },
  {
    id: "r-chatgpt",
    title: "ChatGPT",
    summary: "最廣為人知的 AI 助手,生態系完整:語音對話、圖片生成、資料分析、自訂 GPTs 一應俱全,是大多數人接觸 AI 的第一站。",
    rating: 4.7,
    category: "AI 助手",
    pricing: "免費 / 付費方案",
    url: "https://chatgpt.com/",
    tags: ["對話", "多功能", "入門首選"],
    audience: "一般人"
  },
  {
    id: "r-gemini",
    title: "Google Gemini",
    summary: "深度整合 Google 生態系的 AI 助手,可搭配 Gmail、Docs、YouTube 使用,多模態與長上下文能力突出,免費額度大方。",
    rating: 4.6,
    category: "AI 助手",
    pricing: "免費 / 付費方案",
    url: "https://gemini.google.com/",
    tags: ["Google", "多模態", "生產力"],
    audience: "一般人"
  },
  {
    id: "r-perplexity",
    title: "Perplexity",
    summary: "AI 搜尋引擎,回答會附上來源引用,適合查證資料與研究主題,是寫文章前蒐集資料的利器。",
    rating: 4.5,
    category: "AI 搜尋",
    pricing: "免費 / 付費方案",
    url: "https://www.perplexity.ai/",
    tags: ["搜尋", "查證", "研究"],
    audience: "一般人"
  },
  {
    id: "r-notebooklm",
    title: "NotebookLM",
    summary: "Google 的 AI 筆記工具,上傳文件後可提問、生成摘要與心智圖,Audio Overview 還能把資料變成 Podcast 對談,學習新主題超高效。",
    rating: 4.6,
    category: "學習工具",
    pricing: "免費 / 付費方案",
    url: "https://notebooklm.google.com/",
    tags: ["筆記", "學習", "Podcast"],
    audience: "一般人"
  },
  {
    id: "r-claude-code",
    title: "Claude Code",
    summary: "在終端機運作的 AI 程式開發代理,能理解整個專案、自動修改多個檔案、執行測試與提交 PR,大幅加速開發流程。",
    rating: 4.8,
    category: "開發工具",
    pricing: "付費(API / 訂閱)",
    url: "https://www.anthropic.com/claude-code",
    tags: ["程式開發", "AI Agent", "終端機"],
    audience: "專業人士"
  },
  {
    id: "r-cursor",
    title: "Cursor",
    summary: "AI 優先的程式編輯器,內建多模型支援與 Agent 模式,Tab 自動補全體驗流暢,是目前最受歡迎的 AI IDE 之一。",
    rating: 4.6,
    category: "開發工具",
    pricing: "免費 / 付費方案",
    url: "https://cursor.com/",
    tags: ["程式開發", "IDE", "自動補全"],
    audience: "專業人士"
  },
  {
    id: "r-copilot",
    title: "GitHub Copilot",
    summary: "GitHub 官方 AI 程式助手,整合 VS Code 與 JetBrains 等主流編輯器,支援多家模型,學生與開源維護者可免費使用。",
    rating: 4.5,
    category: "開發工具",
    pricing: "免費 / 付費方案",
    url: "https://github.com/features/copilot",
    tags: ["程式開發", "VS Code", "GitHub"],
    audience: "專業人士"
  },
  {
    id: "r-huggingface",
    title: "Hugging Face",
    summary: "全球最大的開源 AI 社群平台,提供數十萬個模型、資料集與 Demo(Spaces),想找開源模型或發布自己的模型都在這裡。",
    rating: 4.7,
    category: "開發平台",
    pricing: "免費 / 付費方案",
    url: "https://huggingface.co/",
    tags: ["開源", "模型庫", "社群"],
    audience: "專業人士"
  },
  {
    id: "r-ollama",
    title: "Ollama",
    summary: "一行指令就能在自己電腦跑開源大語言模型(Llama、Qwen、Gemma 等),資料不出本機,注重隱私的使用者首選。",
    rating: 4.5,
    category: "開發工具",
    pricing: "免費開源",
    url: "https://ollama.com/",
    tags: ["本地部署", "開源", "隱私"],
    audience: "專業人士"
  },
  {
    id: "r-midjourney",
    title: "Midjourney",
    summary: "頂尖的 AI 圖像生成服務,以藝術感與美學品質著稱,適合製作社群貼文配圖、品牌視覺與概念設計。",
    rating: 4.6,
    category: "圖像生成",
    pricing: "付費方案",
    url: "https://www.midjourney.com/",
    tags: ["圖像生成", "設計", "創作"],
    audience: "一般人"
  },
  {
    id: "r-elevenlabs",
    title: "ElevenLabs",
    summary: "高品質 AI 語音生成與配音工具,支援多語言與聲音複製,Podcast、影片旁白與有聲內容製作的熱門選擇。",
    rating: 4.5,
    category: "語音工具",
    pricing: "免費 / 付費方案",
    url: "https://elevenlabs.io/",
    tags: ["語音合成", "配音", "Podcast"],
    audience: "一般人"
  }
];
