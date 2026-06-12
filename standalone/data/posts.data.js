// AI 生成的社群貼文草稿 — 由 Claude Code 的 /generate-posts 指令搭配
// social-post skill(https://github.com/Hao0321/claude-skill-social-post)批次產生。
// 結構:{ <內容 id>: { generatedAt, facebook, threads, x, linkedin, linkComment } }
// 遵循 skill 規則:R25(FB/Threads 正文不放連結,連結放 linkComment 貼留言區)、
// F19(Threads 單段逗號流 60-150 字、1 hashtag)、R15(CTA 引導分享)、R34(避免 AI 腔)。
// 網站的貼文產生器會優先顯示這裡的 AI 草稿;沒有的項目則退回內建模板。
window.POSTS_DATA = {
  // ↓ 範例(r-claude 對應 resources.data.js 的 id),skill 生成時請依照相同結構輸出
  "r-claude": {
    generatedAt: "2026-06-12",
    facebook: "你有沒有遇過這種情況:想請 AI 幫忙整理一份 50 頁的報告,結果它讀到一半就「忘記」前面在講什麼?\n\n這就是我後來改用 Claude 的原因。\n\n它最強的三個地方:\n✅ 長文理解 — 整本 PDF 丟進去,前後文都接得住\n✅ Artifacts — 邊聊天邊生出網頁、簡報、文件,即時預覽\n✅ Projects — 常用資料存進知識庫,每次對話它都記得你的背景\n\n免費版就能體驗大部分功能,寫作者、學生、開發者都很適合。\n\n你最常用 AI 做什麼?留言聊聊,也分享給常被長文件折磨的朋友 👇(連結我放留言區)\n\n#AI #Claude #生產力工具",
    threads: "用過一輪 AI 助手,最後留在手機桌面的是 Claude,長文件丟進去不會失憶,Artifacts 邊聊邊生出網頁,Projects 還能存自己的知識庫,免費版就很夠用,常寫東西的人真的可以試試!連結放留言區 #AI",
    x: "⭐ 好用 AI 工具:Claude\n\n• 長文不失憶,整份 PDF 接得住\n• Artifacts:對話中直接生成網頁/文件\n• Projects:打造個人知識庫\n\n免費版就能用 👇\nhttps://claude.ai/\n\n#AI #Claude",
    linkedin: "在評估了市面上主流的 AI 助手後,我們團隊把 Claude 納入了日常工作流,三個月下來有幾點觀察值得分享:\n\n1️⃣ 長上下文處理:法務合約、技術文件這類長資料,Claude 的前後文一致性明顯較佳,減少了反覆確認的成本。\n\n2️⃣ Artifacts:從需求討論直接產出可預覽的網頁原型或文件,縮短了「討論 → 產出」的距離,對跨部門協作特別有感。\n\n3️⃣ Projects:把團隊的風格指南、產品資料存成知識庫,新成員提問時 AI 的回答自帶公司脈絡。\n\n對知識工作密集的團隊來說,值得安排一週試用期實際驗證。\n\n🔗 https://claude.ai/\n\n#AI #Claude #Productivity #KnowledgeManagement",
    linkComment: "🔗 Claude 免費版入口 → https://claude.ai/"
  }
};
