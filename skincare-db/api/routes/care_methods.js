const { Router } = require('express');
const { pool } = require('../db');
const router = Router();

router.get('/', async (req, res) => {
  const { category, time_of_day } = req.query;
  const params = [];
  const conditions = [];
  if (category) { params.push(category); conditions.push(`category = $${params.length}`); }
  if (time_of_day) { params.push(time_of_day); conditions.push(`time_of_day = $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(`SELECT * FROM care_methods ${where} ORDER BY name`, params);
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM care_methods WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: '找不到該保養方式' });
  res.json(rows[0]);
});

router.post('/', async (req, res) => {
  const { name, category, description, steps, frequency, time_of_day, target_concerns, notes } = req.body;
  if (!name) return res.status(400).json({ error: '保養方式名稱為必填' });
  const { rows } = await pool.query(
    `INSERT INTO care_methods (name, category, description, steps, frequency, time_of_day, target_concerns, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [name, category, description, steps ? JSON.stringify(steps) : null, frequency, time_of_day, target_concerns, notes]
  );
  res.status(201).json(rows[0]);
});

router.patch('/:id', async (req, res) => {
  const allowed = ['name','category','description','steps','frequency','time_of_day','target_concerns','notes'];
  const fields = Object.keys(req.body).filter(k => allowed.includes(k));
  if (!fields.length) return res.status(400).json({ error: '無更新欄位' });
  const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = [...fields.map(f => f === 'steps' && req.body[f] ? JSON.stringify(req.body[f]) : req.body[f]), req.params.id];
  const { rows } = await pool.query(
    `UPDATE care_methods SET ${setClause} WHERE id = $${values.length} RETURNING *`, values
  );
  if (!rows.length) return res.status(404).json({ error: '找不到該保養方式' });
  res.json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM care_methods WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: '找不到該保養方式' });
  res.status(204).send();
});

module.exports = router;
