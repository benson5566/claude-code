/* ===== AI 學習中心 — 主程式 ===== */
(function () {
  "use strict";

  const DATA = {
    news: window.NEWS_DATA || [],
    tutorials: window.TUTORIALS_DATA || [],
    resources: window.RESOURCES_DATA || []
  };

  const LEVEL_LABEL = { beginner: "入門", intermediate: "中級", advanced: "進階" };

  // 各分頁的篩選選項
  const FILTERS = {
    news: ["全部", "一般人", "專業人士"],
    tutorials: ["全部", "入門", "中級", "進階"],
    resources: ["全部", "AI 助手", "開發工具", "學習工具", "其他"]
  };

  const state = { tab: "news", search: "", filter: "全部" };

  const $ = (sel) => document.querySelector(sel);
  const grids = { news: $("#news-grid"), tutorials: $("#tutorials-grid"), resources: $("#resources-grid") };

  /* ---------- 渲染 ---------- */

  function starBar(rating) {
    const full = Math.round(rating);
    return "★".repeat(full) + "☆".repeat(5 - full);
  }

  function formatDate(d) {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return `${dt.getFullYear()}/${String(dt.getMonth() + 1).padStart(2, "0")}/${String(dt.getDate()).padStart(2, "0")}`;
  }

  function esc(s) {
    const div = document.createElement("div");
    div.textContent = s == null ? "" : String(s);
    return div.innerHTML;
  }

  function cardHTML(item, type, index) {
    const tags = (item.tags || []).map((t) => `<span class="tag">#${esc(t)}</span>`).join("");
    let meta = "";
    if (type === "news") {
      meta = `<span class="badge">${esc(item.source)}</span><span>${formatDate(item.date)}</span><span>適合:${esc(item.audience)}</span>`;
    } else if (type === "tutorials") {
      meta = `<span class="badge level-${esc(item.level)}">${LEVEL_LABEL[item.level] || esc(item.level)}</span><span>⏱ ${esc(item.duration)}</span><span>適合:${esc(item.audience)}</span>`;
    } else {
      meta = `<span class="badge">${esc(item.category)}</span><span>${esc(item.pricing)}</span>`;
    }
    const rating = type === "resources"
      ? `<div class="rating">${starBar(item.rating)}<span class="score">${item.rating.toFixed(1)}</span></div>`
      : "";

    return `
      <article class="card">
        <div class="card-meta">${meta}</div>
        <h3 class="card-title"><a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.title)}</a></h3>
        ${rating}
        <p class="card-summary">${esc(item.summary)}</p>
        <div class="card-tags">${tags}</div>
        <div class="card-actions">
          <button class="btn btn-primary" data-post="${type}:${index}">✍️ 產生貼文</button>
          <a class="btn btn-ghost" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">🔗 前往</a>
        </div>
      </article>`;
  }

  function matchesFilter(item, type) {
    const f = state.filter;
    if (f === "全部") return true;
    if (type === "news") return item.audience === f;
    if (type === "tutorials") return LEVEL_LABEL[item.level] === f;
    if (type === "resources") {
      if (f === "其他") return !["AI 助手", "開發工具", "學習工具"].includes(item.category);
      return item.category === f;
    }
    return true;
  }

  function matchesSearch(item) {
    const q = state.search.trim().toLowerCase();
    if (!q) return true;
    const haystack = [item.title, item.summary, item.source, item.category, ...(item.tags || [])]
      .filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(q);
  }

  function render() {
    const type = state.tab;
    const list = DATA[type];
    const visible = [];
    list.forEach((item, i) => {
      if (matchesFilter(item, type) && matchesSearch(item)) visible.push(cardHTML(item, type, i));
    });
    grids[type].innerHTML = visible.join("");
    $("#empty-hint").hidden = visible.length > 0;
  }

  function renderFilters() {
    const wrap = $("#filter-chips");
    wrap.innerHTML = FILTERS[state.tab]
      .map((f) => `<button class="chip${f === state.filter ? " active" : ""}" data-filter="${f}">${f}</button>`)
      .join("");
  }

  function switchTab(tab) {
    state.tab = tab;
    state.filter = "全部";
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.toggle("active", p.id === "tab-" + tab));
    const isWorkshop = tab === "workshop";
    document.querySelector(".toolbar").style.display = isWorkshop ? "none" : "";
    $("#empty-hint").hidden = true;
    if (!isWorkshop) {
      renderFilters();
      render();
    }
  }

  /* ---------- 社群貼文產生器 ---------- */

  const PLATFORM_LIMIT = { facebook: 0, threads: 500, x: 280, linkedin: 3000 };
  const POSTS = window.POSTS_DATA || {};
  let currentItem = null;
  let currentType = null;
  let currentPlatform = "facebook";
  let preferAI = true; // 有 AI 草稿時優先顯示,可切換回模板

  function hashtags(item, max) {
    const base = ["AI", ...(item.tags || [])];
    return base.slice(0, max).map((t) => "#" + String(t).replace(/\s+/g, "")).join(" ");
  }

  // 回傳 { text, linkComment }。依 social-post skill 的 R25 規則:
  // FB / Threads 正文不放外部連結(會被演算法降觸及),連結另外貼到留言區。
  function buildPost(item, type, platform) {
    const link = item.url || "";
    const title = item.title;
    const summary = item.summary;

    if (platform === "x") {
      // X 280 字元限制,punchline 放最前,hashtag 1-2 個放句末
      const head = type === "news" ? "🔥 AI 快訊" : type === "tutorials" ? "🎓 AI 學習推薦" : "⭐ 好用 AI 工具";
      return { text: `${head}|${title}\n\n${summary.slice(0, 80)}…\n\n${link}\n${hashtags(item, 2)}`, linkComment: null };
    }

    if (platform === "threads") {
      // Threads:單段落、逗號流、不換行、60-150 字、1 個 hashtag、正文無連結
      let body = `${title},${summary.replace(/\n/g, "")}`;
      if (body.length > 120) body = body.slice(0, 119) + "…";
      return { text: `${body},連結放留言區!#AI`, linkComment: "🔗 " + link };
    }

    const lines = [];
    if (type === "news") {
      lines.push(`🔥【AI 快訊】${title}`);
      lines.push("");
      lines.push(summary);
      lines.push("");
      lines.push(`📅 ${formatDate(item.date)}|來源:${item.source}`);
      lines.push("");
      lines.push("💡 為什麼值得關注?");
      lines.push("AI 發展日新月異,跟上這則消息,你就比 90% 的人更了解趨勢。");
    } else if (type === "tutorials") {
      lines.push(`🎓【AI 學習推薦】${title}`);
      lines.push("");
      lines.push(summary);
      lines.push("");
      lines.push(`📊 難度:${LEVEL_LABEL[item.level] || item.level}|⏱ 所需時間:${item.duration}`);
      lines.push(`👥 適合:${item.audience}`);
      lines.push("");
      lines.push("💪 學 AI 不用等,從今天開始累積你的 AI 能力!");
    } else {
      lines.push(`⭐【好用 AI 工具】${title}(${item.rating.toFixed(1)} 分)`);
      lines.push("");
      lines.push(summary);
      lines.push("");
      lines.push(`🏷 分類:${item.category}|💰 ${item.pricing}`);
      lines.push("");
      lines.push("🙌 你用過了嗎?歡迎留言分享你的使用心得!");
    }
    lines.push("");

    if (platform === "facebook") {
      lines.push("覺得實用的話,分享給需要的朋友 👇(連結我放在留言區)");
      lines.push("");
      lines.push(hashtags(item, 4));
      return { text: lines.join("\n"), linkComment: "🔗 " + link };
    }

    // LinkedIn:正文可放連結
    lines.push(`🔗 ${link}`);
    lines.push("");
    lines.push(hashtags(item, 5));
    let post = lines.join("\n");
    const limit = PLATFORM_LIMIT[platform];
    if (limit && post.length > limit) post = post.slice(0, limit - 1) + "…";
    return { text: post, linkComment: null };
  }

  function aiDraftFor(item, platform) {
    const entry = item && POSTS[item.id];
    return entry && typeof entry[platform] === "string" ? entry[platform] : null;
  }

  function updateDraft() {
    if (!currentItem) return;
    const ai = aiDraftFor(currentItem, currentPlatform);
    const useAI = Boolean(ai) && preferAI;
    let text, linkComment;
    if (useAI) {
      text = ai;
      linkComment = POSTS[currentItem.id].linkComment || ("🔗 " + (currentItem.url || ""));
    } else {
      const built = buildPost(currentItem, currentType, currentPlatform);
      text = built.text;
      linkComment = built.linkComment;
    }
    $("#post-draft").value = text;

    // R25:FB / Threads 正文不放連結 → 顯示「貼到留言區」的連結框
    const showLinkBox = Boolean(linkComment) && (currentPlatform === "facebook" || currentPlatform === "threads");
    $("#link-comment-wrap").hidden = !showLinkBox;
    if (showLinkBox) $("#link-comment-text").value = linkComment;

    const srcEl = $("#draft-source");
    if (ai) {
      const date = POSTS[currentItem.id].generatedAt || "";
      srcEl.innerHTML = useAI
        ? `<span class="source-badge ai">🤖 AI 草稿${date ? "(" + date + " 生成)" : ""}</span><button class="source-toggle" id="source-toggle">改用模板</button>`
        : `<span class="source-badge">📐 內建模板</span><button class="source-toggle" id="source-toggle">改用 AI 草稿</button>`;
      $("#source-toggle").addEventListener("click", () => { preferAI = !preferAI; updateDraft(); });
    } else {
      srcEl.innerHTML = `<span class="source-badge">📐 內建模板(此項目尚無 AI 草稿,可用 /generate-posts 產生)</span>`;
    }
    renderLint($("#modal-lint"), lintDraft(text, currentPlatform, null));
    updateCharCount();
  }

  function updateCharCount() {
    const len = $("#post-draft").value.length;
    const limit = PLATFORM_LIMIT[currentPlatform];
    const el = $("#char-count");
    el.textContent = limit ? `${len} / ${limit} 字元` : `${len} 字元`;
    el.classList.toggle("over", Boolean(limit) && len > limit);
  }

  function openModal(type, index) {
    currentItem = DATA[type][index];
    currentType = type;
    preferAI = true;
    updateDraft();
    $("#post-modal").hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    $("#post-modal").hidden = true;
    document.body.style.overflow = "";
  }

  async function copyDraft() {
    const text = $("#post-draft").value;
    const btn = $("#copy-btn");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // 剪貼簿 API 不可用時退回選取複製
      $("#post-draft").select();
      document.execCommand("copy");
    }
    btn.textContent = "✅ 已複製!";
    setTimeout(() => (btn.textContent = "📋 複製貼文"), 1600);
  }

  /* ---------- 規則檢查器(出自 social-post skill R1-R35 / F19)---------- */

  // R34 反 AI 腔:抽象空詞黑名單
  const AI_TONE_WORDS = ["護城河", "本質上", "真正的", "賦能", "底層邏輯", "降維打擊", "不可否認", "值得注意的是"];

  function lintDraft(text, platform, formulaId) {
    const checks = [];
    const add = (ok, label, warn) => checks.push({ ok, label, warn: Boolean(warn) });
    if (!text.trim() || platform === "linkedin") return checks;

    const hasLink = /https?:\/\/|www\./i.test(text);
    const exclaims = (text.match(/[!!]/g) || []).length;
    const tags = (text.match(/#[^\s#]+/g) || []).length;
    const paras = text.split(/\n\s*\n/).filter((p) => p.trim());

    if (platform === "facebook" || platform === "threads") {
      add(!hasLink, hasLink ? "R25 正文發現連結!FB/Threads 連結要貼留言區" : "R25 正文無外部連結");
    }
    if (platform === "facebook") {
      add(tags <= 4, `hashtag ≤ 4(目前 ${tags})`);
      add(/[??]/.test(text), "R16 結尾開放式提問(長留言 = 3 倍權重)", true);
      add(/分享/.test(text), "R15 含「分享」CTA(私訊分享 = 最強信號)", true);
      if (formulaId === "F6b") add(paras.length === 4, `F6b 4 段結構(目前 ${paras.length} 段)`, true);
      if (formulaId === "F15") add(paras.length === 3, `F15 3 段結構(目前 ${paras.length} 段)`, true);
    }
    if (platform === "threads") {
      add(!text.includes("\n"), "F19 單段不換行(連續逗號流)");
      add(text.length >= 60 && text.length <= 150, `F19 60-150 字(目前 ${text.length})`, formulaId !== "F19");
      add(exclaims <= 2, `「!」最多 2 個(目前 ${exclaims})`);
      add(tags <= 1, `hashtag 只 1 個(目前 ${tags})`);
    }
    if (platform === "x") {
      const effLen = text.replace(/https?:\/\/\S+/g, "x".repeat(23)).length;
      add(effLen <= 280, `280 字元限制(目前約 ${effLen},URL 算 23 字)`);
      add(tags <= 2, `hashtag ≤ 2(目前 ${tags})`);
    }
    const found = AI_TONE_WORDS.filter((w) => text.includes(w));
    add(found.length === 0, found.length ? `R34 發現 AI 腔空詞:${found.join("、")}` : "R34 無 AI 腔抽象空詞");
    const maxNums = Math.max(0, ...paras.map((p) => (p.match(/\d+(\.\d+)?/g) || []).length));
    add(maxNums <= 3, `R12 每段數字 ≤ 3(最多的段落有 ${maxNums} 個)`, true);
    return checks;
  }

  function renderLint(el, checks) {
    if (!checks.length) { el.innerHTML = ""; el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = checks
      .map((c) => `<span class="lint-item ${c.ok ? "pass" : c.warn ? "warn" : "fail"}">${c.ok ? "✅" : c.warn ? "⚠️" : "❌"} ${esc(c.label)}</span>`)
      .join("");
  }

  /* ---------- 貼文工坊 ---------- */

  // 公式模板(骨架版;完整威力要靠 Claude Code + social-post skill 生成)
  const WS_FORMULAS = {
    facebook: [
      {
        id: "F6b", name: "F6b 純血 hype(4 段 4 句,衝廣推)",
        hint: "Mode B 主力公式:量化稀缺 hook → 內容 → 為什麼重要 → keyword CTA。發文黃金時段 22:00-01:00。",
        build: (it) => `「${it.title}」這件事,我看完只有一句話:【你的一句真實感想】!\n\n${it.summary}\n\n為什麼值得你花 30 秒看完?【寫一個跟讀者切身相關的理由,加 1-2 個具體數字】。\n\n想要完整整理的,留言「AI」我把連結放精選留言,也分享給需要的朋友!`
      },
      {
        id: "F15", name: "F15 mini(3 段精簡版)",
        hint: "F6b 的輕量版:hook → 重點 → CTA,適合不想寫長文的日子。",
        build: (it) => `${it.title} — 【一句話說出最大亮點】!\n\n${it.summary}\n\n細節我整理好了,連結放留言區,覺得有用就分享給朋友 👇`
      },
      {
        id: "F16", name: "F16 精選彙整(bullet list,衝儲存)",
        hint: "R18:清單型內容觸發「儲存」= 次強演算法信號。",
        build: (it) => `最近很多人問【主題】,我把重點整理成一篇:\n\n�Point 1:【重點一】\n�Point 2:【重點二】\n�Point 3:${it.summary.slice(0, 50)}…\n\n先儲存起來慢慢看,完整連結在留言區!`
      }
    ],
    threads: [
      {
        id: "F19", name: "F19 立場宣言(Thread 核心公式)",
        hint: "排版鐵則:1 段不換行、逗號流、60-150 字、「!」≤2、1 個 hashtag。hook 要含對立 keyword(免費 vs 付費 / 公開 vs 藏私)。",
        build: (it) => `大家都在【對立話題,例:把這個拿去賣課】,我直接免費講結論,${it.title},${it.summary.slice(0, 40)}…重點整理放留言,我做這個就是興趣而已!#AI`
      },
      {
        id: "F7", name: "F7 POV 吐槽(日常短梗)",
        hint: "短梗 + 高互動,週 2-3 篇維持活躍,不用挑時段。",
        build: (it) => `認真研究了${it.title},結論:【一句有梗的吐槽】😂 #AI`
      }
    ],
    x: [
      {
        id: "X", name: "X 快訊(280 字,punchline 在前)",
        hint: "節奏最快,最有梗的一句放最前面,hashtag 1-2 個放句末,連結可放正文。",
        build: (it) => `【最有梗的一句結論】\n\n${it.title}:\n• ${it.summary.slice(0, 60)}…\n\n${it.url}\n#AI`
      }
    ]
  };

  function wsAllItems() {
    const out = [];
    ["news", "tutorials", "resources"].forEach((type) => {
      DATA[type].forEach((item, i) => out.push({ type, i, item }));
    });
    return out;
  }

  function wsSelectedItem() {
    const v = $("#ws-item").value;
    if (v === "custom") {
      return { title: "【你的主題】", summary: "【主題的重點摘要,2-3 句】", url: "【相關連結】" };
    }
    const [type, i] = v.split(":");
    return DATA[type][Number(i)];
  }

  function wsCurrentFormula() {
    const platform = $("#ws-platform").value;
    const list = WS_FORMULAS[platform];
    return list.find((f) => f.id === $("#ws-formula").value) || list[0];
  }

  function wsRenderFormulaOptions() {
    const platform = $("#ws-platform").value;
    $("#ws-formula").innerHTML = WS_FORMULAS[platform]
      .map((f) => `<option value="${f.id}">${f.name}</option>`)
      .join("");
    $("#ws-formula-hint").textContent = wsCurrentFormula().hint;
  }

  function wsUpdateLint() {
    const text = $("#ws-draft").value;
    const platform = $("#ws-platform").value;
    renderLint($("#ws-lint"), lintDraft(text, platform, wsCurrentFormula().id));
    $("#ws-count").textContent = text ? `${text.length} 字元` : "";
  }

  function wsGenerate() {
    const item = wsSelectedItem();
    $("#ws-draft").value = wsCurrentFormula().build(item);
    wsUpdateLint();
  }

  function wsClaudePrompt() {
    const item = wsSelectedItem();
    const platform = $("#ws-platform").value;
    const f = wsCurrentFormula();
    const platformName = { facebook: "Facebook", threads: "Threads", x: "X" }[platform];
    return [
      `用 social-post skill 幫我寫一篇 ${platformName} 貼文。`,
      `公式:${f.name}`,
      `題材:${item.title}`,
      `重點(事實以此為準,不要捏造):${item.summary}`,
      `資料連結:${item.url}(R25:FB/Threads 正文不放連結,連結放留言區)`,
      `套用我的 style_profile 語氣,遵守 R34 不要 AI 腔。`,
      `先給我完整草稿確認,沒有我說「確認」之前不要發佈。`
    ].join("\n");
  }

  /* ---------- 事件 ---------- */

  document.querySelectorAll(".nav-btn").forEach((btn) =>
    btn.addEventListener("click", () => switchTab(btn.dataset.tab))
  );

  $("#logo-link").addEventListener("click", (e) => { e.preventDefault(); switchTab("news"); });

  $("#search-input").addEventListener("input", (e) => { state.search = e.target.value; render(); });

  $("#filter-chips").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    state.filter = chip.dataset.filter;
    renderFilters();
    render();
  });

  document.querySelectorAll(".card-grid").forEach((grid) =>
    grid.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-post]");
      if (!btn) return;
      const [type, index] = btn.dataset.post.split(":");
      openModal(type, Number(index));
    })
  );

  $("#platform-tabs").addEventListener("click", (e) => {
    const btn = e.target.closest(".platform-btn");
    if (!btn) return;
    currentPlatform = btn.dataset.platform;
    document.querySelectorAll(".platform-btn").forEach((b) => b.classList.toggle("active", b === btn));
    updateDraft();
  });

  $("#post-draft").addEventListener("input", () => {
    updateCharCount();
    renderLint($("#modal-lint"), lintDraft($("#post-draft").value, currentPlatform, null));
  });
  $("#copy-btn").addEventListener("click", copyDraft);
  $("#copy-link-btn").addEventListener("click", async () => {
    const btn = $("#copy-link-btn");
    try {
      await navigator.clipboard.writeText($("#link-comment-text").value);
    } catch {
      $("#link-comment-text").select();
      document.execCommand("copy");
    }
    btn.textContent = "✅";
    setTimeout(() => (btn.textContent = "複製"), 1600);
  });
  $("#modal-close").addEventListener("click", closeModal);
  $("#post-modal").addEventListener("click", (e) => { if (e.target === e.currentTarget) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  /* ---------- 工坊事件 ---------- */

  const TYPE_LABEL = { news: "新聞", tutorials: "教學", resources: "資源" };
  $("#ws-item").innerHTML =
    `<option value="custom">✏️ 自訂主題</option>` +
    wsAllItems()
      .map(({ type, i, item }) => `<option value="${type}:${i}">[${TYPE_LABEL[type]}] ${esc(item.title)}</option>`)
      .join("");

  $("#ws-platform").addEventListener("change", () => { wsRenderFormulaOptions(); wsUpdateLint(); });
  $("#ws-formula").addEventListener("change", () => { $("#ws-formula-hint").textContent = wsCurrentFormula().hint; wsUpdateLint(); });
  $("#ws-generate").addEventListener("click", wsGenerate);
  $("#ws-draft").addEventListener("input", wsUpdateLint);
  $("#ws-copy").addEventListener("click", async () => {
    const btn = $("#ws-copy");
    try { await navigator.clipboard.writeText($("#ws-draft").value); }
    catch { $("#ws-draft").select(); document.execCommand("copy"); }
    btn.textContent = "✅ 已複製!";
    setTimeout(() => (btn.textContent = "📋 複製草稿"), 1600);
  });
  $("#ws-claude").addEventListener("click", async () => {
    const btn = $("#ws-claude");
    try { await navigator.clipboard.writeText(wsClaudePrompt()); }
    catch { /* 剪貼簿不可用時顯示在草稿框 */ $("#ws-draft").value = wsClaudePrompt(); }
    btn.textContent = "✅ 已複製,貼到 Claude Code!";
    setTimeout(() => (btn.textContent = "🤖 複製 Claude Code 指令"), 2000);
  });

  /* ---------- 初始化 ---------- */

  $("#stat-news").textContent = DATA.news.length;
  $("#stat-tutorials").textContent = DATA.tutorials.length;
  $("#stat-resources").textContent = DATA.resources.length;

  wsRenderFormulaOptions();
  renderFilters();
  render();
})();
