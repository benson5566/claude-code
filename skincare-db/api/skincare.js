#!/usr/bin/env node
/**
 * skincare — 保養品資料庫 CLI
 *
 * 使用方式（代理直接以自然語言格式呼叫）：
 *
 *   搜尋：
 *     node skincare.js 搜尋 成分 玻尿酸
 *     node skincare.js 搜尋 研究 retinol
 *     node skincare.js 搜尋 產品 精華
 *     node skincare.js 列出 膚質
 *     node skincare.js 列出 保養方式 晚間
 *     node skincare.js 列出 環境成分
 *
 *   查單筆：
 *     node skincare.js 查詢 成分 1
 *     node skincare.js 查詢 產品 3
 *     node skincare.js 查詢 研究 2
 *
 *   新增：
 *     node skincare.js 新增 成分 '{"name":"菸鹼醯胺","inci_name":"Niacinamide",...}'
 *     node skincare.js 新增 研究 '{"title":"...","key_findings":["..."]}'
 *     node skincare.js 新增 保養方式 '{"name":"...","steps":["..."]}'
 *
 *   連結：
 *     node skincare.js 連結 研究 1 成分 2
 *
 *   健康檢查：
 *     node skincare.js 健康
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const https = require('https');
const http  = require('http');
const url   = require('url');

const BASE = (process.env.SKINCARE_API_BASE || 'http://localhost:3000/api').replace(/\/$/, '');
const KEY  = process.env.API_KEY || '';

// ── HTTP 工具 ─────────────────────────────────────────────────────────────────

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const fullUrl  = `${BASE}${path}`;
    const parsed   = url.parse(fullUrl);
    const isHttps  = parsed.protocol === 'https:';
    const payload  = body ? JSON.stringify(body) : null;

    const opts = {
      hostname: parsed.hostname,
      port:     parsed.port || (isHttps ? 443 : 80),
      path:     parsed.path,
      method,
      headers: {
        'x-api-key':    KEY,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };

    const req = (isHttps ? https : http).request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ── 格式化輸出 ────────────────────────────────────────────────────────────────

function pretty(data) {
  if (typeof data === 'string') return data;
  return JSON.stringify(data, null, 2);
}

function ok(data)  { console.log(pretty(data)); }
function err(msg)  { console.error(`❌ 錯誤：${msg}`); process.exit(1); }

// ── 指令處理 ──────────────────────────────────────────────────────────────────

const RESOURCE_MAP = {
  '成分': 'ingredients',  '原料': 'ingredients',  'ingredient': 'ingredients',
  '研究': 'research',     '文獻': 'research',      'research': 'research',
  '產品': 'products',     '商品': 'products',      'product': 'products',
  '保養方式': 'care-methods', '保養步驟': 'care-methods', 'care': 'care-methods',
  '膚質': 'skin-types',   'skin': 'skin-types',
  '品牌': 'brands',       'brand': 'brands',
  '環境成分': 'environment', '環保': 'environment', 'env': 'environment',
  '評論': 'reviews',      'review': 'reviews',
};

const TIME_MAP = {
  '早晨': 'morning', '早上': 'morning', '白天': 'morning',
  '晚間': 'evening', '晚上': 'evening', '夜間': 'evening',
  '早晚': 'both',
};

async function cmd(args) {
  const [action, ...rest] = args;

  // ── 健康檢查 ──────────────────────────────────────────────────────────────
  if (!action || action === '健康' || action === 'health') {
    const r = await request('GET', '/health');
    if (r.status === 200) ok({ 狀態: '✅ DB API 正常', ...r.body });
    else err(`DB API 無法連線（HTTP ${r.status}）`);
    return;
  }

  // ── 搜尋 ──────────────────────────────────────────────────────────────────
  if (action === '搜尋' || action === 'search') {
    const [resourceRaw, ...keywords] = rest;
    const resource = RESOURCE_MAP[resourceRaw];
    if (!resource) err(`不認識的資源類型「${resourceRaw}」\n可用：${Object.keys(RESOURCE_MAP).join('、')}`);

    const keyword = keywords.join(' ');
    const qs = keyword ? `?search=${encodeURIComponent(keyword)}` : '';
    const r  = await request('GET', `/${resource}${qs}`);
    if (r.status !== 200) err(r.body?.error || `HTTP ${r.status}`);

    const list = Array.isArray(r.body) ? r.body : (r.body.data || [r.body]);
    if (!list.length) { console.log(`（找不到符合「${keyword}」的${resourceRaw}）`); return; }
    ok(list.map(item => ({ id: item.id, name: item.name || item.title, ...item })));
    return;
  }

  // ── 列出 ──────────────────────────────────────────────────────────────────
  if (action === '列出' || action === 'list') {
    const [resourceRaw, filter] = rest;
    const resource = RESOURCE_MAP[resourceRaw];
    if (!resource) err(`不認識的資源類型「${resourceRaw}」`);

    let qs = '';
    if (filter) {
      const timeValue = TIME_MAP[filter];
      if (timeValue)         qs = `?time_of_day=${timeValue}`;
      else if (filter === '礁岩友善' || filter === 'reef_safe') qs = '?reef_safe=true';
      else if (filter === '可生物降解') qs = '?biodegradable=true';
    }

    const r = await request('GET', `/${resource}${qs}`);
    if (r.status !== 200) err(r.body?.error || `HTTP ${r.status}`);
    ok(r.body);
    return;
  }

  // ── 查詢單筆 ──────────────────────────────────────────────────────────────
  if (action === '查詢' || action === 'get') {
    const [resourceRaw, id] = rest;
    const resource = RESOURCE_MAP[resourceRaw];
    if (!resource) err(`不認識的資源類型「${resourceRaw}」`);
    if (!id) err(`請提供 id，例如：查詢 成分 1`);

    const r = await request('GET', `/${resource}/${id}`);
    if (r.status === 404) err(`找不到 ${resourceRaw} id=${id}`);
    if (r.status !== 200) err(r.body?.error || `HTTP ${r.status}`);
    ok(r.body);
    return;
  }

  // ── 新增 ──────────────────────────────────────────────────────────────────
  if (action === '新增' || action === 'add') {
    const [resourceRaw, jsonStr] = rest;
    const resource = RESOURCE_MAP[resourceRaw];
    if (!resource) err(`不認識的資源類型「${resourceRaw}」`);
    if (!jsonStr) err(`請提供 JSON 資料，例如：新增 成分 '{"name":"..."}'`);

    let data;
    try { data = JSON.parse(jsonStr); }
    catch { err(`JSON 格式錯誤，請確認引號與格式`); }

    const r = await request('POST', `/${resource}`, data);
    if (r.status >= 400) err(r.body?.error || `HTTP ${r.status}`);
    ok({ 成功: `✅ 已新增 ${resourceRaw}`, 資料: r.body });
    return;
  }

  // ── 連結（研究 ↔ 成分）────────────────────────────────────────────────────
  if (action === '連結' || action === 'link') {
    // 連結 研究 1 成分 2 [關係類型]
    const [, researchId, , ingredientId, relationship_type = 'studied'] = rest;
    if (!researchId || !ingredientId) err('用法：連結 研究 <研究id> 成分 <成分id> [關係類型]');

    const r = await request('POST', `/research/${researchId}/ingredients`, {
      ingredient_id: parseInt(ingredientId),
      relationship_type,
    });
    if (r.status >= 400) err(r.body?.error || `HTTP ${r.status}`);
    ok({ 成功: `✅ 已連結研究 ${researchId} ↔ 成分 ${ingredientId}` });
    return;
  }

  // ── 說明 ──────────────────────────────────────────────────────────────────
  console.log(`
保養品資料庫 CLI — 使用說明

  node skincare.js 健康                         檢查 DB 連線
  node skincare.js 搜尋 成分 玻尿酸             關鍵字搜尋成分
  node skincare.js 搜尋 研究 retinol            搜尋研究文獻
  node skincare.js 搜尋 產品 精華               搜尋產品
  node skincare.js 列出 膚質                    列出所有膚質類型
  node skincare.js 列出 保養方式 晚間           列出晚間保養方式
  node skincare.js 列出 環境成分                列出環保成分資料
  node skincare.js 查詢 成分 1                  查詢 id=1 的成分
  node skincare.js 查詢 研究 2                  查詢 id=2 的研究
  node skincare.js 新增 成分 '{"name":"..."}'   新增成分
  node skincare.js 新增 研究 '{"title":"..."}'  新增研究文獻
  node skincare.js 新增 保養方式 '{"name":"..."}' 新增保養方式
  node skincare.js 連結 研究 1 成分 2           連結研究與成分
`);
}

cmd(process.argv.slice(2)).catch(e => { console.error(e.message); process.exit(1); });
