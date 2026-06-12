// AI 教學資料 — 依難度分級:beginner(入門)/ intermediate(中級)/ advanced(進階)
window.TUTORIALS_DATA = [
  {
    id: "t-getting-started",
    title: "ChatGPT / Claude 新手入門:第一次用 AI 就上手",
    summary: "認識什麼是生成式 AI、如何註冊與開始對話、常見使用情境(寫信、翻譯、摘要、腦力激盪),以及使用 AI 時該注意的隱私與正確性問題。",
    level: "beginner",
    duration: "30 分鐘",
    url: "https://www.anthropic.com/learn",
    tags: ["新手入門", "ChatGPT", "Claude"],
    audience: "一般人"
  },
  {
    id: "t-prompt-guide",
    title: "提示詞工程(Prompt Engineering)實戰指南",
    summary: "學會把問題「問得更好」:角色設定、提供範例(Few-shot)、思考鏈(Chain of Thought)、結構化輸出等技巧,大幅提升 AI 回答品質。",
    level: "beginner",
    duration: "1 小時",
    url: "https://www.promptingguide.ai/",
    tags: ["提示詞", "Prompt", "實用技巧"],
    audience: "一般人"
  },
  {
    id: "t-google-essentials",
    title: "Google AI Essentials:給所有人的 AI 基礎課",
    summary: "Google 官方推出的零基礎課程,涵蓋生成式 AI 概念、如何在日常工作中使用 AI 提升效率,以及負責任使用 AI 的原則,完課可獲證書。",
    level: "beginner",
    duration: "約 10 小時",
    url: "https://grow.google/ai-essentials/",
    tags: ["線上課程", "Google", "證書"],
    audience: "一般人"
  },
  {
    id: "t-ms-beginners",
    title: "Microsoft AI for Beginners:12 週系統化入門",
    summary: "微軟開源的 12 週課程,從 AI 歷史、神經網路、電腦視覺到自然語言處理,搭配 Jupyter Notebook 實作,適合想打好基礎的學習者。",
    level: "intermediate",
    duration: "12 週",
    url: "https://github.com/microsoft/AI-For-Beginners",
    tags: ["線上課程", "Microsoft", "開源教材"],
    audience: "專業人士"
  },
  {
    id: "t-dlai-short",
    title: "DeepLearning.AI 短課程:AI 開發者的快速充電站",
    summary: "吳恩達(Andrew Ng)團隊推出的免費短課程,主題涵蓋 LangChain、RAG、AI Agent、微調等熱門技術,每門課 1–2 小時即可完成。",
    level: "intermediate",
    duration: "每門 1-2 小時",
    url: "https://www.deeplearning.ai/short-courses/",
    tags: ["線上課程", "LLM 開發", "吳恩達"],
    audience: "專業人士"
  },
  {
    id: "t-hf-llm",
    title: "Hugging Face LLM Course:開源模型實戰",
    summary: "Hugging Face 官方課程,學習 Transformers 函式庫、模型微調(Fine-tuning)、資料集處理與模型部署,是進入開源 AI 生態系的最佳起點。",
    level: "advanced",
    duration: "自訂進度",
    url: "https://huggingface.co/learn/llm-course",
    tags: ["Hugging Face", "微調", "開源"],
    audience: "專業人士"
  },
  {
    id: "t-anthropic-prompt",
    title: "Anthropic 提示詞工程互動教學",
    summary: "Anthropic 官方的互動式教學,從基礎到進階共 9 章,透過實際練習學會撰寫清晰、可靠的提示詞,適合想把 Claude 用到極致的使用者與開發者。",
    level: "intermediate",
    duration: "約 3 小時",
    url: "https://github.com/anthropics/prompt-eng-interactive-tutorial",
    tags: ["提示詞", "Anthropic", "互動教學"],
    audience: "專業人士"
  },
  {
    id: "t-fastai",
    title: "fast.ai Practical Deep Learning:實戰派深度學習",
    summary: "以「先做出東西、再懂原理」聞名的免費課程,用 PyTorch 與 fastai 快速建立影像辨識、NLP 等模型,適合有程式基礎、想動手做的學習者。",
    level: "advanced",
    duration: "約 30 小時",
    url: "https://course.fast.ai/",
    tags: ["深度學習", "PyTorch", "實作"],
    audience: "專業人士"
  },
  {
    id: "t-social-posts",
    title: "用 AI 寫社群貼文:內容創作者工作流",
    summary: "從選題、擬大綱、生成草稿到改寫人味,完整示範如何用 AI 加速社群內容產出,並避免 AI 味太重、事實錯誤等常見地雷。",
    level: "beginner",
    duration: "45 分鐘",
    url: "https://www.promptingguide.ai/applications",
    tags: ["內容創作", "社群媒體", "工作流"],
    audience: "一般人"
  },
  {
    id: "t-rag",
    title: "RAG 檢索增強生成:讓 AI 回答你的私有資料",
    summary: "理解 RAG 架構(向量資料庫、Embedding、檢索與生成),動手打造能回答公司文件、個人筆記的 AI 問答系統。",
    level: "advanced",
    duration: "4 小時",
    url: "https://www.deeplearning.ai/short-courses/",
    tags: ["RAG", "向量資料庫", "LLM 開發"],
    audience: "專業人士"
  }
];
