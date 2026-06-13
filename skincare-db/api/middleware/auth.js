module.exports = function apiKeyAuth(req, res, next) {
  if (!process.env.API_KEY) return next();

  const key = req.headers['x-api-key'];
  if (key !== process.env.API_KEY) {
    return res.status(401).json({ error: '未授權：API 金鑰無效' });
  }
  next();
};
