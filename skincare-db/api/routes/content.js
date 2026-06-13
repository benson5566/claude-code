const { Router } = require('express');
const { pool } = require('../db');
const router = Router();

// ── 公式骨架（對應 social-post skill 的 formulas.md）──────────────────────
// F2: 截圖先丟再講 — 素材先行，標題極短，評論在下段
function applyF2(subject, detail, cta) {
  return `${subject}\n\n${detail}\n\n${cta || '你用過嗎？'}`;
}

// F3: 翻車復盤 — 「我以為...結果...」
function applyF3(wrongBelief, reality, lesson, cta) {
  return `我以為${wrongBelief}\n\n結果${reality}\n\n後來才懂：${lesson}\n\n${cta || '你有踩過類似的坑嗎？'}`;
}

// F6b: Mode B 知識發表（4段4句）— 最強病毒公式
function applyF6b(hook, story, emotion, action) {
  return `${hook}\n\n${story}\n\n${emotion}\n\n${action}`;
}

// F19: Threads 立場宣言（60-150字單段，感嘆號≤2）
function applyF19(statement) {
  return statement.replace(/！/g, (_, i, s) => {
    const count = (s.slice(0, i).match(/！/g) || []).length;
    return count < 2 ? '！' : '。';
  });
}

// F15mini: 30-50字極短發佈
function applyF15mini(result, invite) {
  return `${result}${invite ? `\n${invite}` : ''}`;
}

// ─────────────────────────────────────────────────────────────────────────────

// 成分介紹貼文格式
function ingredientPost(ing, platform, formula) {
  const concerns = ing.concerns?.length ? `⚠️ 注意：${ing.concerns.join('、')}` : '';
  const benefits = ing.benefits?.map(b => `✅ ${b}`).join('\n') || '';
  const rating = ing.comedogenic_rating !== null
    ? `毛孔堵塞指數：${ing.comedogenic_rating}/5`
    : '';

  if (platform === 'ig') {
    return `🧴 成分解析｜${ing.name}

【INCI名稱】${ing.inci_name || '—'}
【類型】${ing.category || '—'} ／ ${ing.origin || '—'}性成分

✨ 功效
${benefits}

${rating}
${concerns}

💡 適合收藏這篇，下次買保養品看成分時用得到！

${ig_tags(ing)}`;
  }

  if (platform === 'thread') {
    return `${ing.name}（${ing.inci_name || ''}）成分解析 🧪

功效：${ing.benefits?.join('、') || '—'}
刺激性：${ing.irritation_risk === 'low' ? '低' : ing.irritation_risk === 'moderate' ? '中' : '高'}
${concerns}

你的保養品有用這個成分嗎？`;
  }

  // 預設 FB/通用
  return `【保養成分知識｜${ing.name}】

${ing.description || ''}

主要功效：${ing.benefits?.join('、') || '—'}
成分來源：${ing.origin || '—'}
${rating}
${concerns}

💬 你在用含有${ing.name}的產品嗎？留言分享你的心得！`;
}

function ig_tags(ing) {
  const base = ['#保養', '#保養品成分', '#成分解析', '#skincare', '#skincareingredients'];
  const map = {
    '保濕劑': ['#保濕', '#補水'],
    '功效成分': ['#功效保養', '#美白', '#抗老'],
    '角質溶解劑': ['#去角質', '#煥膚'],
    '防曬劑': ['#防曬', '#sunscreen'],
  };
  const extra = map[ing.category] || [];
  return [...base, ...extra].join(' ');
}

// GET /content/ingredient/:id?platform=ig|thread|fb&formula=f2|f3|f6b|f19|f15mini
router.get('/ingredient/:id', async (req, res) => {
  const { platform = 'ig', formula } = req.query;
  const { rows } = await pool.query('SELECT * FROM ingredients WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: '找不到該成分' });
  const ing = rows[0];

  let post = ingredientPost(ing, platform, formula);

  // 套用指定公式骨架
  if (formula === 'f3') {
    post = applyF3(
      `${ing.name}越多越好`,
      `${ing.max_safe_concentration ? `超過 ${ing.max_safe_concentration}% 反而可能${ing.irritation_risk === 'high' ? '造成刺激' : '沒差'}` : '不是每種膚質都適合'}`,
      `選產品要看的是成分表順序，不是宣稱濃度`,
      '你買過廣告說「高濃度」結果沒感覺的嗎？'
    );
  } else if (formula === 'f19') {
    post = applyF19(
      `${ing.name}不是貴才好。便宜的 ${ing.inci_name || ing.name} 跟千元精華裡的成分表完全一樣。` +
      `差別在配方師、賦形劑、還有行銷費用。`
    );
  } else if (formula === 'f15mini') {
    post = applyF15mini(
      `「${ing.name}」加進保養品資料庫了`,
      `對這成分有問題嗎？留言我來解答`
    );
  }

  res.json({ ingredient: ing.name, platform, formula: formula || 'default', post });
});

// GET /content/product/:id?platform=ig|thread|fb
router.get('/product/:id', async (req, res) => {
  const { platform = 'ig' } = req.query;
  const { rows } = await pool.query(
    `SELECT p.*, b.name AS brand_name FROM products p
     LEFT JOIN brands b ON p.brand_id = b.id WHERE p.id = $1`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: '找不到該產品' });
  const p = rows[0];

  const ings = await pool.query(
    `SELECT i.name FROM ingredients i
     JOIN product_ingredients pi ON i.id = pi.ingredient_id
     WHERE pi.product_id = $1 AND pi.position <= 10 ORDER BY pi.position`,
    [req.params.id]
  );
  const skinTypes = await pool.query(
    `SELECT st.name, pst.suitability FROM skin_types st
     JOIN product_skin_types pst ON st.id = pst.skin_type_id
     WHERE pst.product_id = $1 AND pst.suitability IN ('excellent','good')`,
    [req.params.id]
  );

  const topIngs = ings.rows.map(r => r.name).join('、');
  const suitFor = skinTypes.rows.map(r => r.name).join('、') || '各類膚質';

  let post;
  if (platform === 'ig') {
    post = `🌿 產品開箱｜${p.brand_name || ''} ${p.name}

📦 類型：${p.product_type || '—'}
💰 售價：${p.price_twd ? `NT$${p.price_twd}` : '—'}
✨ 適合膚質：${suitFor}

🔍 前10大成分：${topIngs || '待補充'}

${p.spf ? `☀️ SPF${p.spf}${p.pa_rating ? ' ' + p.pa_rating : ''}` : ''}

💬 你用過這款嗎？留言告訴我你的感受！

#保養品推薦 #${(p.product_type || 'skincare').replace(/\//g, '')} #${(p.brand_name || 'skincare').replace(/\s/g, '')} #保養 #skincareroutine`;
  } else {
    post = `【產品介紹｜${p.brand_name || ''} ${p.name}】

${p.description || ''}

適合膚質：${suitFor}
主要成分：${topIngs || '—'}
${p.price_twd ? `售價：NT$${p.price_twd}` : ''}

你有在用這款嗎？`;
  }

  res.json({ product: p.name, platform, post });
});

// GET /content/tips?topic=skincare&skin_type_id=1
router.get('/tips', async (req, res) => {
  const { skin_type_id } = req.query;
  const params = [];
  let where = '';
  if (skin_type_id) {
    params.push(skin_type_id);
    // join care methods with skin type via products
    // fallback: return all care methods for now
  }
  const { rows } = await pool.query(
    `SELECT id, name, category, description, target_concerns, time_of_day, frequency
     FROM care_methods ORDER BY RANDOM() LIMIT 5`,
    params
  );
  const tips = rows.map(m => ({
    id: m.id,
    name: m.name,
    snippet: `💡 保養小技巧｜${m.name}\n\n${m.description || ''}\n\n頻率：${m.frequency || '—'}\n時間：${m.time_of_day === 'morning' ? '早晨' : m.time_of_day === 'evening' ? '晚上' : '早晚'}\n目標問題：${m.target_concerns?.join('、') || '—'}`,
  }));
  res.json(tips);
});

// GET /content/research-highlight/:id — 研究知識貼文
router.get('/research-highlight/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM research WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: '找不到該研究' });
  const r = rows[0];
  const post = `📚 保養科學｜${r.title}

${r.abstract ? r.abstract.substring(0, 200) + (r.abstract.length > 200 ? '...' : '') : ''}

🔬 研究類型：${r.study_type || '—'}
📅 發表：${r.publication_date ? r.publication_date.toISOString().split('T')[0] : '—'}
💡 關鍵發現：
${r.key_findings?.map(f => `• ${f}`).join('\n') || '—'}

${r.doi ? `DOI: ${r.doi}` : ''}

#保養科學 #skincareresearch #保養成分 #美容研究`;

  res.json({ research: r.title, post });
});

// GET /content/daily?day=1&platform=ig
// skill P2 呼叫此端點取得今日貼文素材（依 content_plan.md 規劃的 Day）
router.get('/daily', async (req, res) => {
  const { day = 1, platform = 'fb' } = req.query;
  const dayNum = parseInt(day);

  // 靜態範例日曆（P0 執行後應由 content_plan.md 驅動）
  const schedule = {
    1:  { type: 'ingredient', id: 1, formula: 'f6b' },
    3:  { type: 'skin_type_vote', id: null },
    4:  { type: 'care_method', id: 1 },
    5:  { type: 'care_method', id: 2, formula: 'f6b' },
    7:  { type: 'environment', id: 1, formula: 'f19' },
    8:  { type: 'ingredient', id: 2, formula: 'f2' },
    10: { type: 'product', id: 1 },
    11: { type: 'research', id: 1 },
    12: { type: 'care_method', id: 3, formula: 'f15mini' },
    14: { type: 'skin_type', id: 4, formula: 'f6b' },
  };

  const today = schedule[dayNum];
  if (!today) return res.json({ day: dayNum, rest: true, message: '今天是休息日' });

  try {
    if (today.type === 'ingredient') {
      const { rows } = await pool.query('SELECT * FROM ingredients WHERE id = $1', [today.id]);
      if (!rows.length) return res.status(404).json({ error: '素材不存在' });
      const ing = rows[0];
      const post = ingredientPost(ing, platform, today.formula);
      return res.json({ day: dayNum, type: 'ingredient', id: ing.id, name: ing.name, platform, formula: today.formula, post });
    }
    if (today.type === 'research') {
      const { rows } = await pool.query('SELECT * FROM research WHERE id = $1', [today.id]);
      if (!rows.length) return res.status(404).json({ error: '研究素材不存在' });
      const r = rows[0];
      const post = `📚 保養科學｜${r.title}\n\n${r.key_findings?.map(f => `• ${f}`).join('\n') || r.abstract?.substring(0, 150) || ''}\n\n#保養科學 #skincareresearch`;
      return res.json({ day: dayNum, type: 'research', id: r.id, name: r.title, platform, post });
    }
    if (today.type === 'care_method') {
      const { rows } = await pool.query('SELECT * FROM care_methods WHERE id = $1', [today.id]);
      if (!rows.length) return res.status(404).json({ error: '保養方式素材不存在' });
      const m = rows[0];
      return res.json({ day: dayNum, type: 'care_method', id: m.id, name: m.name, platform, raw: m, hint: '請用 style_profile.md 的聲音改寫以下步驟' });
    }
    return res.json({ day: dayNum, type: today.type, hint: '請自訂此素材類型的貼文' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /content/formula-list — 列出所有公式代碼供 skill 使用
router.get('/formula-list', (req, res) => {
  res.json([
    { code: 'f2',     name: 'F2 截圖先丟再講',  platform: 'FB/IG', signal: '留言+收藏' },
    { code: 'f3',     name: 'F3 翻車復盤',       platform: 'FB',    signal: '分享（真實感）' },
    { code: 'f6b',    name: 'F6b Mode B 知識發表', platform: 'FB+IG', signal: '廣推（4段4句）' },
    { code: 'f19',    name: 'F19 Threads 宣言',  platform: 'Threads', signal: '轉發' },
    { code: 'f15mini', name: 'F15mini 極短發佈',  platform: 'Threads/X', signal: '快速觸及' },
  ]);
});

module.exports = router;
