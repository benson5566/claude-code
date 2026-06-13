const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function init() {
  const client = await pool.connect();
  try {
    console.log('初始化資料庫結構...');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('資料庫結構建立完成');

    console.log('載入種子資料...');
    const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    await client.query(seed);
    console.log('種子資料載入完成');
  } finally {
    client.release();
    await pool.end();
  }
}

init().catch(err => {
  console.error('初始化失敗:', err.message);
  process.exit(1);
});
