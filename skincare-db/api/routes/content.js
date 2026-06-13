const { Router } = require('express');
const { pool } = require('../db');
const router = Router();

// 成分介紹貼文格式
function ingredientPost(ing, platform) {
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

// GET /content/ingredient/:id?platform=ig|thread|fb
router.get('/ingredient/:id', async (req, res) => {
  const { platform = 'ig' } = req.query;
  const { rows } = await pool.query('SELECT * FROM ingredients WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: '找不到該成分' });

  const post = ingredientPost(rows[0], platform);
  res.json({ ingredient: rows[0].name, platform, post });
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

module.exports = router;
