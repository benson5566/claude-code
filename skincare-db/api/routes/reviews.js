const { Router } = require('express');
const { pool } = require('../db');
const router = Router();

router.get('/product/:product_id', async (req, res) => {
  const { page = 1, limit = 20, min_rating } = req.query;
  const offset = (page - 1) * Math.min(limit, 100);
  const params = [req.params.product_id];
  let where = 'WHERE r.product_id = $1';
  if (min_rating) { params.push(min_rating); where += ` AND r.rating >= $${params.length}`; }
  const { rows } = await pool.query(
    `SELECT r.*, st.name AS skin_type_name
     FROM reviews r LEFT JOIN skin_types st ON r.skin_type_id = st.id
     ${where} ORDER BY r.created_at DESC LIMIT $${params.push(Math.min(limit,100))} OFFSET $${params.push(offset)}`,
    params
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { product_id, skin_type_id, rating, title, content, pros, cons, repurchase, reviewer_name } = req.body;
  if (!product_id || !rating) return res.status(400).json({ error: '產品ID和評分為必填' });
  const { rows } = await pool.query(
    `INSERT INTO reviews (product_id, skin_type_id, rating, title, content, pros, cons, repurchase, reviewer_name)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [product_id, skin_type_id, rating, title, content, pros, cons, repurchase, reviewer_name]
  );
  res.status(201).json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: '找不到該評論' });
  res.status(204).send();
});

module.exports = router;
