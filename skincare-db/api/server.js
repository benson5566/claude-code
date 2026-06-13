require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const apiKeyAuth = require('./middleware/auth');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '1mb' }));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT || '300'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '請求過於頻繁，請稍後再試' },
}));

app.use('/api', apiKeyAuth);

app.use('/api/ingredients',   require('./routes/ingredients'));
app.use('/api/products',      require('./routes/products'));
app.use('/api/skin-types',    require('./routes/skin_types'));
app.use('/api/care-methods',  require('./routes/care_methods'));
app.use('/api/research',      require('./routes/research'));
app.use('/api/environment',   require('./routes/environment'));
app.use('/api/brands',        require('./routes/brands'));
app.use('/api/reviews',       require('./routes/reviews'));
app.use('/api/content',       require('./routes/content'));

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

app.get('/api', (req, res) => res.json({
  name: '保養品資料圖書庫 API',
  version: '1.0.0',
  endpoints: [
    'GET/POST /api/ingredients',
    'GET/PATCH/DELETE /api/ingredients/:id',
    'GET /api/ingredients/:id/products',
    'GET /api/ingredients/:id/research',
    'GET/POST /api/products',
    'GET/PATCH/DELETE /api/products/:id',
    'GET/POST /api/skin-types',
    'GET /api/skin-types/:id/products',
    'GET/POST /api/care-methods',
    'GET/POST /api/research',
    'POST /api/research/:id/ingredients',
    'GET/POST /api/environment',
    'GET/POST /api/brands',
    'GET /api/reviews/product/:product_id',
    'POST /api/reviews',
    'GET /api/content/ingredient/:id?platform=ig|thread|fb&formula=f2|f3|f6b|f19|f15mini',
    'GET /api/content/product/:id?platform=ig|thread|fb',
    'GET /api/content/tips',
    'GET /api/content/research-highlight/:id',
    'GET /api/content/daily?day=1&platform=fb  (skill P2 使用)',
    'GET /api/content/formula-list',
  ],
}));

app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: '伺服器內部錯誤' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`保養品資料庫 API 運行於 port ${PORT}`));
