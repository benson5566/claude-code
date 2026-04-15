/* CoffeeCV — L3 Demo
 * Vanilla JS, no build step.
 * State → render loop: form inputs mutate `state`, render() redraws preview.
 */

// ---------- State ----------
const emptyState = () => ({
  profile: { name: '', title: '', avatar: '', email: '', location: '', summary: '' },
  social: { linkedin: '', github: '', website: '', twitter: '' },
  experiences: [],
  education: [],
  skills: [],
  projects: [],
  meta: { theme: 'bento', lang: 'zh-TW', accent: '#FF6B6B' },
});

let state = emptyState();

// ---------- Utilities ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const byPath = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
const setByPath = (obj, path, value) => {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((o, k) => (o[k] ??= {}), obj);
  target[last] = value;
};

const escapeHTML = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const toast = (msg) => {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 1800);
};

// ---------- Form <-> State binding ----------
function bindScalarInputs() {
  $$('#resume-form [data-path]').forEach((el) => {
    el.addEventListener('input', () => {
      setByPath(state, el.dataset.path, el.value);
      if (el.dataset.path === 'meta.accent') applyAccent(el.value);
      renderPreview();
    });
  });
}

function syncScalarInputsFromState() {
  $$('#resume-form [data-path]').forEach((el) => {
    const v = byPath(state, el.dataset.path);
    el.value = v ?? '';
  });
}

// ---------- Array field renderers ----------
function renderArraySection(key, container, rowBuilder) {
  container.innerHTML = '';
  state[key].forEach((item, idx) => {
    const wrap = document.createElement('div');
    wrap.className = 'array-item';
    wrap.innerHTML = rowBuilder(item, idx);
    wrap.querySelector('.remove')?.addEventListener('click', () => {
      state[key].splice(idx, 1);
      renderAll();
    });
    wrap.querySelectorAll('[data-field]').forEach((inp) => {
      inp.addEventListener('input', () => {
        const f = inp.dataset.field;
        if (f.includes('.')) {
          // handled as JSON list fields below
        }
        if (inp.dataset.listField) {
          state[key][idx][f] = inp.value.split(',').map((s) => s.trim()).filter(Boolean);
        } else if (inp.dataset.arrLines) {
          state[key][idx][f] = inp.value.split('\n').map((s) => s.trim()).filter(Boolean);
        } else {
          state[key][idx][f] = inp.value;
        }
        renderPreview();
      });
    });
    container.appendChild(wrap);
  });
}

const experienceRow = (e, i) => `
  <button type="button" class="remove" aria-label="remove">×</button>
  <label>公司</label>
  <input data-field="company" value="${escapeHTML(e.company)}" placeholder="Acme Inc." />
  <label>職稱</label>
  <input data-field="role" value="${escapeHTML(e.role)}" placeholder="Senior Designer" />
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
    <div>
      <label>開始 (YYYY-MM)</label>
      <input data-field="start" value="${escapeHTML(e.start)}" placeholder="2023-03" />
    </div>
    <div>
      <label>結束 (YYYY-MM / present)</label>
      <input data-field="end" value="${escapeHTML(e.end)}" placeholder="present" />
    </div>
  </div>
  <label>成就 (每行一項，最多 5 項)</label>
  <textarea data-field="achievements" data-arr-lines="1" rows="3" placeholder="提升轉換率 30%&#10;導入設計系統...">${escapeHTML((e.achievements || []).join('\n'))}</textarea>
  <label>技術標籤 (逗號分隔)</label>
  <input data-field="tech" data-list-field="1" value="${escapeHTML((e.tech || []).join(', '))}" placeholder="Figma, React, Tailwind" />
`;

const skillRow = (s, i) => `
  <button type="button" class="remove" aria-label="remove">×</button>
  <label>分類</label>
  <input data-field="category" value="${escapeHTML(s.category)}" placeholder="Design / Frontend / Tools" />
  <label>項目 (逗號分隔)</label>
  <input data-field="items" data-list-field="1" value="${escapeHTML((s.items || []).join(', '))}" placeholder="Figma, Sketch, Prototyping" />
`;

const projectRow = (p, i) => `
  <button type="button" class="remove" aria-label="remove">×</button>
  <label>名稱</label>
  <input data-field="name" value="${escapeHTML(p.name)}" placeholder="Project X" />
  <label>描述</label>
  <input data-field="description" value="${escapeHTML(p.description)}" placeholder="一句話說明" />
  <label>連結</label>
  <input data-field="url" value="${escapeHTML(p.url)}" placeholder="https://..." />
  <label>技術 (逗號分隔)</label>
  <input data-field="tech" data-list-field="1" value="${escapeHTML((p.tech || []).join(', '))}" placeholder="React, Node" />
`;

const educationRow = (e, i) => `
  <button type="button" class="remove" aria-label="remove">×</button>
  <label>學校</label>
  <input data-field="school" value="${escapeHTML(e.school)}" placeholder="台大" />
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
    <div>
      <label>學位</label>
      <input data-field="degree" value="${escapeHTML(e.degree)}" placeholder="Bachelor" />
    </div>
    <div>
      <label>主修</label>
      <input data-field="major" value="${escapeHTML(e.major)}" placeholder="資訊工程" />
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
    <div>
      <label>開始</label>
      <input data-field="start" value="${escapeHTML(e.start)}" placeholder="2018-09" />
    </div>
    <div>
      <label>結束</label>
      <input data-field="end" value="${escapeHTML(e.end)}" placeholder="2022-06" />
    </div>
  </div>
`;

const ROW_BUILDERS = {
  experiences: experienceRow,
  skills: skillRow,
  projects: projectRow,
  education: educationRow,
};

const DEFAULTS = {
  experiences: () => ({ company: '', role: '', start: '', end: '', achievements: [], tech: [] }),
  skills: () => ({ category: '', items: [] }),
  projects: () => ({ name: '', description: '', url: '', tech: [] }),
  education: () => ({ school: '', degree: '', major: '', start: '', end: '' }),
};

function renderArrayForms() {
  renderArraySection('experiences', $('#experiences-list'), ROW_BUILDERS.experiences);
  renderArraySection('skills', $('#skills-list'), ROW_BUILDERS.skills);
  renderArraySection('projects', $('#projects-list'), ROW_BUILDERS.projects);
  renderArraySection('education', $('#education-list'), ROW_BUILDERS.education);
}

function bindAddButtons() {
  $$('[data-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.add;
      state[key].push(DEFAULTS[key]());
      renderAll();
    });
  });
}

// ---------- Accent color ----------
function applyAccent(hex) {
  document.documentElement.style.setProperty('--accent', hex);
  document.documentElement.style.setProperty('--accent-soft', hex + '15');
  // auto pick text color for hero
  const yiq = getYIQ(hex);
  document.documentElement.style.setProperty('--accent-ink', yiq > 150 ? '#111' : '#fff');
  state.meta.accent = hex;
}
function getYIQ(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

// ---------- Preview render (Bento Grid) ----------
function renderPreview() {
  const root = $('#preview-root');
  const { profile, social, experiences, skills, projects, education } = state;

  if (!profile.name && experiences.length === 0 && skills.length === 0 && projects.length === 0) {
    root.innerHTML = `
      <div class="preview-empty">
        <div style="font-size:3rem;margin-bottom:12px;">☕</div>
        <p>開始填寫左邊的表單，或點上方「載入範例」看效果。</p>
      </div>`;
    return;
  }

  const socialLinks = Object.entries(social)
    .filter(([, v]) => v)
    .map(([k, v]) => `<a href="${escapeHTML(v)}" target="_blank" rel="noopener">${iconFor(k)} ${labelFor(k)}</a>`)
    .join('');

  // --- Hero
  const hero = `
    <div class="bento-card hero-card span-hero">
      <h3>Profile</h3>
      ${profile.avatar ? `<div class="hero-avatar"><img src="${escapeHTML(profile.avatar)}" alt="${escapeHTML(profile.name)}" onerror="this.style.display='none'" /></div>` : ''}
      <div class="hero-name">${escapeHTML(profile.name || 'Your Name')}</div>
      <div class="hero-title">${escapeHTML(profile.title || 'Your Title')}</div>
      <div class="hero-summary">${escapeHTML(profile.summary || '')}</div>
      <div class="hero-meta">
        ${profile.email ? `<span>✉ ${escapeHTML(profile.email)}</span>` : ''}
        ${profile.location ? `<span>📍 ${escapeHTML(profile.location)}</span>` : ''}
        ${socialLinks}
      </div>
    </div>`;

  // --- Stats
  const totalYears = calcYears(experiences);
  const stats = `
    <div class="bento-card stat-card span-2">
      <h3>Years of Experience</h3>
      <div>
        <div class="stat-value">${totalYears || '—'}</div>
        <div class="stat-label">年資累計</div>
      </div>
    </div>
    <div class="bento-card stat-card span-2">
      <h3>Projects Shipped</h3>
      <div>
        <div class="stat-value">${projects.length || '—'}</div>
        <div class="stat-label">作品案例</div>
      </div>
    </div>
    <div class="bento-card stat-card span-2">
      <h3>Skill Areas</h3>
      <div>
        <div class="stat-value">${skills.length || '—'}</div>
        <div class="stat-label">領域覆蓋</div>
      </div>
    </div>`;

  // --- Skills
  const skillsCard = skills.length ? `
    <div class="bento-card span-3">
      <h3>Skills</h3>
      ${skills.map((s) => `
        <div style="margin-bottom:10px;">
          <div style="font-size:.82rem;font-weight:600;color:#444;margin-bottom:4px;">${escapeHTML(s.category)}</div>
          <div>${(s.items || []).map((it) => `<span class="skill-chip">${escapeHTML(it)}</span>`).join('')}</div>
        </div>
      `).join('')}
    </div>` : '';

  // --- Contact
  const contactCard = (profile.email || Object.values(social).some(Boolean)) ? `
    <div class="bento-card span-3">
      <h3>Get in Touch</h3>
      ${profile.email ? `<a class="contact-link" href="mailto:${escapeHTML(profile.email)}">✉ ${escapeHTML(profile.email)}</a>` : ''}
      ${social.linkedin ? `<a class="contact-link" href="${escapeHTML(social.linkedin)}" target="_blank" rel="noopener">in &nbsp; LinkedIn</a>` : ''}
      ${social.github ? `<a class="contact-link" href="${escapeHTML(social.github)}" target="_blank" rel="noopener">&lt;/&gt; &nbsp; GitHub</a>` : ''}
      ${social.website ? `<a class="contact-link" href="${escapeHTML(social.website)}" target="_blank" rel="noopener">🌐 &nbsp; Website</a>` : ''}
      ${social.twitter ? `<a class="contact-link" href="${escapeHTML(social.twitter)}" target="_blank" rel="noopener">𝕏 &nbsp; Twitter</a>` : ''}
    </div>` : '';

  // --- Experiences
  const expCard = experiences.length ? `
    <div class="bento-card span-4">
      <h3>Experience</h3>
      ${experiences.map((e) => `
        <div class="exp-item">
          <div class="exp-date">${escapeHTML(e.start || '—')}<br/>${escapeHTML(e.end || '—')}</div>
          <div>
            <div class="exp-role">${escapeHTML(e.role)}</div>
            <div class="exp-company">${escapeHTML(e.company)}</div>
            ${(e.achievements || []).length ? `<ul class="exp-achievements" style="list-style:none;padding:0;margin:0;">${e.achievements.map((a) => `<li>${escapeHTML(a)}</li>`).join('')}</ul>` : ''}
            ${(e.tech || []).length ? `<div class="exp-tech">${e.tech.map((t) => `<span>${escapeHTML(t)}</span>`).join('')}</div>` : ''}
          </div>
        </div>
      `).join('')}
    </div>` : '';

  // --- Projects
  const projCard = projects.length ? `
    <div class="bento-card span-2 row-2">
      <h3>Projects</h3>
      ${projects.map((p) => `
        <div class="project-item">
          <div class="name">${p.url ? `<a href="${escapeHTML(p.url)}" target="_blank" rel="noopener">${escapeHTML(p.name)} ↗</a>` : escapeHTML(p.name)}</div>
          <div class="desc">${escapeHTML(p.description)}</div>
          ${(p.tech || []).length ? `<div style="margin-top:6px;">${p.tech.map((t) => `<span class="skill-chip" style="font-size:.68rem;">${escapeHTML(t)}</span>`).join('')}</div>` : ''}
        </div>
      `).join('')}
    </div>` : '';

  // --- Education
  const eduCard = education.length ? `
    <div class="bento-card span-3">
      <h3>Education</h3>
      ${education.map((e) => `
        <div style="margin-bottom:10px;">
          <div style="font-weight:600;font-size:.92rem;">${escapeHTML(e.school)}</div>
          <div style="font-size:.82rem;color:#666;">${escapeHTML([e.degree, e.major].filter(Boolean).join(' · '))}</div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:.72rem;color:#999;margin-top:2px;">${escapeHTML(e.start || '')} — ${escapeHTML(e.end || '')}</div>
        </div>
      `).join('')}
    </div>` : '';

  root.innerHTML = hero + stats + skillsCard + contactCard + expCard + projCard + eduCard;
}

function calcYears(experiences) {
  if (!experiences?.length) return 0;
  let months = 0;
  for (const e of experiences) {
    const start = parseYM(e.start);
    const end = e.end === 'present' ? new Date() : parseYM(e.end);
    if (start && end) months += (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  }
  return Math.max(1, Math.round(months / 12));
}
function parseYM(s) {
  if (!s || typeof s !== 'string') return null;
  const [y, m] = s.split('-').map(Number);
  if (!y) return null;
  return new Date(y, (m || 1) - 1, 1);
}

function iconFor(key) {
  return { linkedin: 'in', github: '&lt;/&gt;', website: '🌐', twitter: '𝕏' }[key] || '·';
}
function labelFor(key) {
  return { linkedin: 'LinkedIn', github: 'GitHub', website: 'Website', twitter: 'Twitter' }[key] || key;
}

// ---------- Master render ----------
function renderAll() {
  renderArrayForms();
  syncScalarInputsFromState();
  applyAccent(state.meta.accent || '#FF6B6B');
  renderPreview();
}

// ---------- Toolbar actions ----------
function loadSample() {
  fetch('sample.json')
    .then((r) => r.json())
    .then((data) => {
      state = data;
      renderAll();
      toast('已載入範例資料');
    })
    .catch(() => toast('載入失敗，請直接用 file:// 可能受限，改用 http server'));
}

function clearAll() {
  if (!confirm('確定要清空所有資料？')) return;
  state = emptyState();
  renderAll();
  toast('已清空');
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `resume-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('已匯出 JSON');
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      state = { ...emptyState(), ...data };
      renderAll();
      toast('已匯入');
    } catch {
      toast('JSON 格式錯誤');
    }
  };
  reader.readAsText(file);
}

function shareLink() {
  const encoded = btoa(encodeURIComponent(JSON.stringify(state)));
  const url = `${location.origin}${location.pathname}?d=${encoded}`;
  navigator.clipboard?.writeText(url);
  toast('分享連結已複製到剪貼簿');
}

function fakeAI() {
  toast('✨ AI 潤稿啟動中...（Demo：真實版本會呼叫 Claude API）');
  setTimeout(() => {
    if (state.profile.summary) {
      state.profile.summary = state.profile.summary.trim() + '（經 AI 強化，更聚焦數據與成果。）';
      renderAll();
      toast('潤稿完成 ✓');
    } else {
      toast('請先填入自我介紹再潤稿');
    }
  }, 1200);
}

function loadFromURL() {
  const params = new URLSearchParams(location.search);
  const d = params.get('d');
  if (!d) return false;
  try {
    const data = JSON.parse(decodeURIComponent(atob(d)));
    state = { ...emptyState(), ...data };
    return true;
  } catch {
    return false;
  }
}

// ---------- Init ----------
function init() {
  bindScalarInputs();
  bindAddButtons();

  $('#btn-load-sample').addEventListener('click', loadSample);
  $('#btn-clear').addEventListener('click', clearAll);
  $('#btn-export').addEventListener('click', exportJSON);
  $('#btn-share').addEventListener('click', shareLink);
  $('#btn-ai').addEventListener('click', fakeAI);
  $('#input-import').addEventListener('change', (e) => {
    if (e.target.files[0]) importJSON(e.target.files[0]);
  });

  // color presets
  $$('.color-preset').forEach((btn) => {
    btn.addEventListener('click', () => {
      applyAccent(btn.dataset.color);
      $('[data-path="meta.accent"]').value = btn.dataset.color;
      renderPreview();
    });
  });

  // mobile view toggle
  $$('.view-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.view-toggle').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const layout = $('#main-layout');
      layout.classList.remove('view-form', 'view-preview');
      layout.classList.add(`view-${btn.dataset.view}`);
    });
  });

  // Load from URL if present, otherwise empty
  const loaded = loadFromURL();
  renderAll();
  if (loaded) toast('已從分享連結載入');

  // Default mobile view = form
  const layout = $('#main-layout');
  layout.classList.add('view-form');
  $$('.view-toggle')[0]?.classList.add('active');
}

document.addEventListener('DOMContentLoaded', init);
