const { Router } = require('express');
const { pool } = require('../db');
const router = Router();

// GET /ingredients — 列表 + 搜尋
router.get('/', async (req, res) => {
  const { q, category, origin, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * Math.min(limit, 100);
  const params = [];
  const conditions = [];

  if (q) {
    params.push(`%${q}%`);
    conditions.push(`(name ILIKE $${params.length} OR inci_name ILIKE $${params.length})`);
  }
  if (category) {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }
  if (origin) {
    params.push(origin);
    conditions.push(`origin = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countResult = await pool.query(`SELECT COUNT(*) FROM ingredients ${where}`, params);
  params.push(limit, offset);
  const result = await pool.query(
    `SELECT * FROM ingredients ${where} ORDER BY name LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  res.json({ total: parseInt(countResult.rows[0].count), data: result.rows });
});

// GET /ingredients/:id
router.get('/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM ingredients WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: '找不到該成分' });
  res.json(rows[0]);
});

// GET /ingredients/:id/products — 含此成分的產品
router.get('/:id/products', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT p.id, p.name, pi.position, pi.role, pi.concentration
     FROM products p
     JOIN product_ingredients pi ON p.id = pi.product_id
     WHERE pi.ingredient_id = $1
     ORDER BY p.name`,
    [req.params.id]
  );
  res.json(rows);
});

// GET /ingredients/:id/research — 相關研究
router.get('/:id/research', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT r.* FROM research r
     JOIN ingredient_research ir ON r.id = ir.research_id
     WHERE ir.ingredient_id = $1
     ORDER BY r.publication_date DESC`,
    [req.params.id]
  );
  res.json(rows);
});

// POST /ingredients
router.post('/', async (req, res) => {
  const { name, inci_name, alias, category, description, benefits, concerns,
          ph_min, ph_max, max_safe_concentration, eu_regulated, comedogenic_rating,
          irritation_risk, origin } = req.body;
  if (!name) return res.status(400).json({ error: '成分名稱為必填' });
  const { rows } = await pool.query(
    `INSERT INTO ingredients (name, inci_name, alias, category, description, benefits, concerns,
      ph_min, ph_max, max_safe_concentration, eu_regulated, comedogenic_rating, irritation_risk, origin)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING *`,
    [name, inci_name, alias, category, description, benefits, concerns,
     ph_min, ph_max, max_safe_concentration, eu_regulated, comedogenic_rating, irritation_risk, origin]
  );
  res.status(201).json(rows[0]);
});

// PATCH /ingredients/:id
router.patch('/:id', async (req, res) => {
  const fields = Object.keys(req.body).filter(k => k !== 'id');
  if (!fields.length) return res.status(400).json({ error: '無更新欄位' });
  const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = fields.map(f => req.body[f]);
  values.push(req.params.id);
  const { rows } = await pool.query(
    `UPDATE ingredients SET ${setClause} WHERE id = $${values.length} RETURNING *`,
    values
  );
  if (!rows.length) return res.status(404).json({ error: '找不到該成分' });
  res.json(rows[0]);
});

// DELETE /ingredients/:id
router.delete('/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM ingredients WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: '找不到該成分' });
  res.status(204).send();
});

module.exports = router;
