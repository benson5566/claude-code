const { Router } = require('express');
const { pool } = require('../db');
const router = Router();

router.get('/', async (req, res) => {
  const { q, country, cruelty_free } = req.query;
  const params = [];
  const conditions = [];
  if (q) { params.push(`%${q}%`); conditions.push(`name ILIKE $${params.length}`); }
  if (country) { params.push(country); conditions.push(`country = $${params.length}`); }
  if (cruelty_free !== undefined) {
    params.push(cruelty_free === 'true');
    conditions.push(`cruelty_free = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(`SELECT * FROM brands ${where} ORDER BY name`, params);
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM brands WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: '找不到該品牌' });
  const products = await pool.query(
    'SELECT id, name, product_type FROM products WHERE brand_id = $1 ORDER BY name',
    [req.params.id]
  );
  res.json({ ...rows[0], products: products.rows });
});

router.post('/', async (req, res) => {
  const { name, country, website, cruelty_free, vegan, description } = req.body;
  if (!name) return res.status(400).json({ error: '品牌名稱為必填' });
  const { rows } = await pool.query(
    `INSERT INTO brands (name, country, website, cruelty_free, vegan, description)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [name, country, website, cruelty_free, vegan, description]
  );
  res.status(201).json(rows[0]);
});

router.patch('/:id', async (req, res) => {
  const fields = ['name','country','website','cruelty_free','vegan','description'].filter(k => req.body[k] !== undefined);
  if (!fields.length) return res.status(400).json({ error: '無更新欄位' });
  const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = [...fields.map(f => req.body[f]), req.params.id];
  const { rows } = await pool.query(
    `UPDATE brands SET ${setClause} WHERE id = $${values.length} RETURNING *`, values
  );
  if (!rows.length) return res.status(404).json({ error: '找不到該品牌' });
  res.json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM brands WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: '找不到該品牌' });
  res.status(204).send();
});

module.exports = router;
