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
    renderFilters();
    render();
  }

  /* ---------- 社群貼文產生器 ---------- */

  const PLATFORM_LIMIT = { facebook: 0, threads: 500, x: 280, linkedin: 3000 };
  let currentItem = null;
  let currentType = null;
  let currentPlatform = "facebook";

  function hashtags(item, max) {
    const base = ["AI", ...(item.tags || [])];
    return base.slice(0, max).map((t) => "#" + String(t).replace(/\s+/g, "")).join(" ");
  }

  function buildPost(item, type, platform) {
    const link = item.url || "";
    const title = item.title;
    const summary = item.summary;

    if (platform === "x") {
      // X 有 280 字元限制,走精簡路線
      const head = type === "news" ? "🔥 AI 快訊" : type === "tutorials" ? "🎓 AI 學習推薦" : "⭐ 好用 AI 工具";
      return `${head}|${title}\n\n${summary.slice(0, 80)}…\n\n${link}\n${hashtags(item, 3)}`;
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
    lines.push(`🔗 ${link}`);
    lines.push("");
    lines.push(hashtags(item, platform === "linkedin" ? 5 : 4));

    let post = lines.join("\n");
    const limit = PLATFORM_LIMIT[platform];
    if (limit && post.length > limit) {
      post = post.slice(0, limit - 1) + "…";
    }
    return post;
  }

  function updateDraft() {
    if (!currentItem) return;
    const draft = buildPost(currentItem, currentType, currentPlatform);
    $("#post-draft").value = draft;
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

  $("#post-draft").addEventListener("input", updateCharCount);
  $("#copy-btn").addEventListener("click", copyDraft);
  $("#modal-close").addEventListener("click", closeModal);
  $("#post-modal").addEventListener("click", (e) => { if (e.target === e.currentTarget) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  /* ---------- 初始化 ---------- */

  $("#stat-news").textContent = DATA.news.length;
  $("#stat-tutorials").textContent = DATA.tutorials.length;
  $("#stat-resources").textContent = DATA.resources.length;

  renderFilters();
  render();
})();
