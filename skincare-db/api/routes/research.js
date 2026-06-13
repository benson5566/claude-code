const { Router } = require('express');
const { pool } = require('../db');
const router = Router();

router.get('/', async (req, res) => {
  const { q, study_type, year, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * Math.min(limit, 100);
  const params = [];
  const conditions = [];

  if (q) {
    params.push(`%${q}%`);
    conditions.push(`(title ILIKE $${params.length} OR abstract ILIKE $${params.length})`);
  }
  if (study_type) {
    params.push(study_type);
    conditions.push(`study_type = $${params.length}`);
  }
  if (year) {
    params.push(`${year}-01-01`, `${year}-12-31`);
    conditions.push(`publication_date BETWEEN $${params.length - 1} AND $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countResult = await pool.query(`SELECT COUNT(*) FROM research ${where}`, params);
  params.push(Math.min(limit, 100), offset);
  const { rows } = await pool.query(
    `SELECT * FROM research ${where} ORDER BY publication_date DESC NULLS LAST
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  res.json({ total: parseInt(countResult.rows[0].count), data: rows });
});

router.get('/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM research WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: '找不到該研究' });

  const ingredients = await pool.query(
    `SELECT i.id, i.name, ir.relevance_notes FROM ingredients i
     JOIN ingredient_research ir ON i.id = ir.ingredient_id
     WHERE ir.research_id = $1`,
    [req.params.id]
  );
  res.json({ ...rows[0], related_ingredients: ingredients.rows });
});

router.post('/', async (req, res) => {
  const { title, authors, journal, publication_date, doi, url, abstract,
          key_findings, study_type, evidence_level, tags } = req.body;
  if (!title) return res.status(400).json({ error: '研究標題為必填' });
  const { rows } = await pool.query(
    `INSERT INTO research (title, authors, journal, publication_date, doi, url, abstract,
      key_findings, study_type, evidence_level, tags)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [title, authors, journal, publication_date, doi, url, abstract,
     key_findings, study_type, evidence_level, tags]
  );
  res.status(201).json(rows[0]);
});

router.patch('/:id', async (req, res) => {
  const allowed = ['title','authors','journal','publication_date','doi','url','abstract',
    'key_findings','study_type','evidence_level','tags'];
  const fields = Object.keys(req.body).filter(k => allowed.includes(k));
  if (!fields.length) return res.status(400).json({ error: '無更新欄位' });
  const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = [...fields.map(f => req.body[f]), req.params.id];
  const { rows } = await pool.query(
    `UPDATE research SET ${setClause} WHERE id = $${values.length} RETURNING *`, values
  );
  if (!rows.length) return res.status(404).json({ error: '找不到該研究' });
  res.json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM research WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: '找不到該研究' });
  res.status(204).send();
});

// POST /research/:id/ingredients — 綁定成分
router.post('/:id/ingredients', async (req, res) => {
  const { ingredient_id, relevance_notes } = req.body;
  await pool.query(
    `INSERT INTO ingredient_research (ingredient_id, research_id, relevance_notes)
     VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
    [ingredient_id, req.params.id, relevance_notes]
  );
  res.status(201).json({ message: '成分關聯已新增' });
});

module.exports = router;
