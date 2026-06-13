const { Router } = require('express');
const { pool } = require('../db');
const router = Router();

router.get('/', async (req, res) => {
  const { cruelty_free, vegan, reef_safe, biodegradability } = req.query;
  const params = [];
  const conditions = [];

  if (cruelty_free !== undefined) {
    params.push(cruelty_free === 'true');
    conditions.push(`is_cruelty_free = $${params.length}`);
  }
  if (vegan !== undefined) {
    params.push(vegan === 'true');
    conditions.push(`is_vegan = $${params.length}`);
  }
  if (reef_safe !== undefined) {
    params.push(reef_safe === 'true');
    conditions.push(`is_reef_safe = $${params.length}`);
  }
  if (biodegradability) {
    params.push(biodegradability);
    conditions.push(`biodegradability = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(`SELECT * FROM environmental_profiles ${where} ORDER BY name`, params);
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM environmental_profiles WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: '找不到該環境資料' });

  const products = await pool.query(
    'SELECT id, name, product_type FROM products WHERE env_profile_id = $1 ORDER BY name',
    [req.params.id]
  );
  res.json({ ...rows[0], products: products.rows });
});

router.post('/', async (req, res) => {
  const { name, biodegradability, ecotoxicity_risk, packaging_type, packaging_material,
          is_cruelty_free, is_vegan, is_reef_safe, certifications, carbon_footprint, notes } = req.body;
  if (!name) return res.status(400).json({ error: '環境資料名稱為必填' });
  const { rows } = await pool.query(
    `INSERT INTO environmental_profiles (name, biodegradability, ecotoxicity_risk, packaging_type,
      packaging_material, is_cruelty_free, is_vegan, is_reef_safe, certifications, carbon_footprint, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [name, biodegradability, ecotoxicity_risk, packaging_type, packaging_material,
     is_cruelty_free, is_vegan, is_reef_safe, certifications, carbon_footprint, notes]
  );
  res.status(201).json(rows[0]);
});

router.patch('/:id', async (req, res) => {
  const allowed = ['name','biodegradability','ecotoxicity_risk','packaging_type','packaging_material',
    'is_cruelty_free','is_vegan','is_reef_safe','certifications','carbon_footprint','notes'];
  const fields = Object.keys(req.body).filter(k => allowed.includes(k));
  if (!fields.length) return res.status(400).json({ error: '無更新欄位' });
  const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = [...fields.map(f => req.body[f]), req.params.id];
  const { rows } = await pool.query(
    `UPDATE environmental_profiles SET ${setClause} WHERE id = $${values.length} RETURNING *`, values
  );
  if (!rows.length) return res.status(404).json({ error: '找不到該環境資料' });
  res.json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM environmental_profiles WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: '找不到該環境資料' });
  res.status(204).send();
});

module.exports = router;
