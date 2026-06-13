const { Router } = require('express');
const { pool } = require('../db');
const router = Router();

router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM skin_types ORDER BY name');
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM skin_types WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: '找不到該膚質' });
  res.json(rows[0]);
});

router.get('/:id/products', async (req, res) => {
  const { suitability = 'good,excellent', page = 1, limit = 20 } = req.query;
  const suits = suitability.split(',');
  const offset = (page - 1) * Math.min(limit, 100);
  const { rows } = await pool.query(
    `SELECT p.id, p.name, p.product_type, pst.suitability, b.name AS brand_name
     FROM products p
     JOIN product_skin_types pst ON p.id = pst.product_id
     LEFT JOIN brands b ON p.brand_id = b.id
     WHERE pst.skin_type_id = $1 AND pst.suitability = ANY($2)
     ORDER BY p.name LIMIT $3 OFFSET $4`,
    [req.params.id, suits, Math.min(limit, 100), offset]
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { name, description, characteristics, common_concerns } = req.body;
  if (!name) return res.status(400).json({ error: '膚質名稱為必填' });
  const { rows } = await pool.query(
    `INSERT INTO skin_types (name, description, characteristics, common_concerns)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [name, description, characteristics, common_concerns]
  );
  res.status(201).json(rows[0]);
});

router.patch('/:id', async (req, res) => {
  const fields = ['name','description','characteristics','common_concerns'].filter(k => req.body[k] !== undefined);
  if (!fields.length) return res.status(400).json({ error: '無更新欄位' });
  const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = [...fields.map(f => req.body[f]), req.params.id];
  const { rows } = await pool.query(
    `UPDATE skin_types SET ${setClause} WHERE id = $${values.length} RETURNING *`, values
  );
  if (!rows.length) return res.status(404).json({ error: '找不到該膚質' });
  res.json(rows[0]);
});

module.exports = router;
