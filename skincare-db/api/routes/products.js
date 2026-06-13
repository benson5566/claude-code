const { Router } = require('express');
const { pool } = require('../db');
const router = Router();

// GET /products
router.get('/', async (req, res) => {
  const { q, type, brand_id, skin_type, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * Math.min(limit, 100);
  const params = [];
  const conditions = [];
  const joins = ['LEFT JOIN brands b ON p.brand_id = b.id'];

  if (q) {
    params.push(`%${q}%`);
    conditions.push(`(p.name ILIKE $${params.length} OR b.name ILIKE $${params.length})`);
  }
  if (type) {
    params.push(type);
    conditions.push(`p.product_type = $${params.length}`);
  }
  if (brand_id) {
    params.push(brand_id);
    conditions.push(`p.brand_id = $${params.length}`);
  }
  if (skin_type) {
    joins.push('JOIN product_skin_types pst ON p.id = pst.product_id JOIN skin_types st ON pst.skin_type_id = st.id');
    params.push(skin_type);
    conditions.push(`st.name = $${params.length} AND pst.suitability IN ('excellent','good')`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const joinStr = joins.join(' ');
  const countResult = await pool.query(
    `SELECT COUNT(DISTINCT p.id) FROM products p ${joinStr} ${where}`, params
  );
  params.push(Math.min(limit, 100), offset);
  const result = await pool.query(
    `SELECT p.*, b.name AS brand_name
     FROM products p ${joinStr} ${where}
     GROUP BY p.id, b.name
     ORDER BY p.name
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  res.json({ total: parseInt(countResult.rows[0].count), data: result.rows });
});

// GET /products/:id
router.get('/:id', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT p.*, b.name AS brand_name FROM products p
     LEFT JOIN brands b ON p.brand_id = b.id
     WHERE p.id = $1`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: '找不到該產品' });
  const product = rows[0];

  const [ingredients, skinTypes, careMethods] = await Promise.all([
    pool.query(
      `SELECT i.id, i.name, i.inci_name, pi.position, pi.role, pi.concentration
       FROM ingredients i JOIN product_ingredients pi ON i.id = pi.ingredient_id
       WHERE pi.product_id = $1 ORDER BY pi.position`,
      [req.params.id]
    ),
    pool.query(
      `SELECT st.id, st.name, pst.suitability, pst.notes
       FROM skin_types st JOIN product_skin_types pst ON st.id = pst.skin_type_id
       WHERE pst.product_id = $1`,
      [req.params.id]
    ),
    pool.query(
      `SELECT cm.id, cm.name, cm.category, pcm.sequence, pcm.notes
       FROM care_methods cm JOIN product_care_methods pcm ON cm.id = pcm.method_id
       WHERE pcm.product_id = $1 ORDER BY pcm.sequence`,
      [req.params.id]
    ),
  ]);

  res.json({
    ...product,
    ingredients: ingredients.rows,
    skin_types: skinTypes.rows,
    care_methods: careMethods.rows,
  });
});

// POST /products
router.post('/', async (req, res) => {
  const {
    name, brand_id, product_type, description, texture, volume_ml,
    price_twd, price_usd, shelf_life_months, pao_months, spf, pa_rating,
    barcode, image_url, purchase_url, env_profile_id,
    ingredients = [], skin_types = [], care_methods = []
  } = req.body;
  if (!name) return res.status(400).json({ error: '產品名稱為必填' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO products (name, brand_id, product_type, description, texture, volume_ml,
        price_twd, price_usd, shelf_life_months, pao_months, spf, pa_rating,
        barcode, image_url, purchase_url, env_profile_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [name, brand_id, product_type, description, texture, volume_ml,
       price_twd, price_usd, shelf_life_months, pao_months, spf, pa_rating,
       barcode, image_url, purchase_url, env_profile_id]
    );
    const product = rows[0];

    for (const ing of ingredients) {
      await client.query(
        `INSERT INTO product_ingredients (product_id, ingredient_id, position, role, concentration)
         VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
        [product.id, ing.ingredient_id, ing.position, ing.role, ing.concentration]
      );
    }
    for (const st of skin_types) {
      await client.query(
        `INSERT INTO product_skin_types (product_id, skin_type_id, suitability, notes)
         VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
        [product.id, st.skin_type_id, st.suitability, st.notes]
      );
    }
    for (const cm of care_methods) {
      await client.query(
        `INSERT INTO product_care_methods (product_id, method_id, sequence, notes)
         VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
        [product.id, cm.method_id, cm.sequence, cm.notes]
      );
    }
    await client.query('COMMIT');
    res.status(201).json(product);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// PATCH /products/:id
router.patch('/:id', async (req, res) => {
  const allowed = ['name','brand_id','product_type','description','texture','volume_ml',
    'price_twd','price_usd','shelf_life_months','pao_months','spf','pa_rating',
    'barcode','image_url','purchase_url','is_discontinued','env_profile_id'];
  const fields = Object.keys(req.body).filter(k => allowed.includes(k));
  if (!fields.length) return res.status(400).json({ error: '無更新欄位' });
  const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = [...fields.map(f => req.body[f]), req.params.id];
  const { rows } = await pool.query(
    `UPDATE products SET ${setClause} WHERE id = $${values.length} RETURNING *`, values
  );
  if (!rows.length) return res.status(404).json({ error: '找不到該產品' });
  res.json(rows[0]);
});

// DELETE /products/:id
router.delete('/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: '找不到該產品' });
  res.status(204).send();
});

module.exports = router;
