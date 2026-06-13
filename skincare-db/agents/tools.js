/**
 * Shared tool definitions and implementations for all skincare agents.
 * Tools interact with the skincare database API and provide web-search stubs.
 */

const axios = require('axios');

const API_BASE = process.env.SKINCARE_API_BASE || 'http://localhost:3000/api';
const API_KEY  = process.env.API_KEY || '';

const http = axios.create({
  baseURL: API_BASE,
  headers: { 'x-api-key': API_KEY },
  timeout: 15000,
});

// ── DB helpers ────────────────────────────────────────────────────────────────

async function dbGet(path, params = {}) {
  const { data } = await http.get(path, { params });
  return data;
}

async function dbPost(path, body) {
  const { data } = await http.post(path, body);
  return data;
}

// ── Tool implementations ──────────────────────────────────────────────────────

const toolImpls = {
  // ── Read tools ──────────────────────────────────────────────────────────────
  search_ingredients: async ({ keyword, category }) => {
    const params = {};
    if (keyword)  params.search   = keyword;
    if (category) params.category = category;
    return dbGet('/ingredients', params);
  },

  get_ingredient: async ({ id }) => dbGet(`/ingredients/${id}`),

  search_products: async ({ keyword, skin_type_id, product_type }) => {
    const params = {};
    if (keyword)      params.search       = keyword;
    if (skin_type_id) params.skin_type_id = skin_type_id;
    if (product_type) params.product_type = product_type;
    return dbGet('/products', params);
  },

  get_product: async ({ id }) => dbGet(`/products/${id}`),

  list_skin_types: async () => dbGet('/skin-types'),

  list_care_methods: async ({ category, time_of_day }) => {
    const params = {};
    if (category)    params.category    = category;
    if (time_of_day) params.time_of_day = time_of_day;
    return dbGet('/care-methods', params);
  },

  search_research: async ({ keyword, ingredient_id }) => {
    const params = {};
    if (keyword)       params.search        = keyword;
    if (ingredient_id) params.ingredient_id = ingredient_id;
    return dbGet('/research', params);
  },

  get_research: async ({ id }) => dbGet(`/research/${id}`),

  list_environment: async ({ reef_safe, biodegradable }) => {
    const params = {};
    if (reef_safe !== undefined)    params.reef_safe     = reef_safe;
    if (biodegradable !== undefined) params.biodegradable = biodegradable;
    return dbGet('/environment', params);
  },

  // ── Write tools ─────────────────────────────────────────────────────────────
  save_ingredient: async (body) => dbPost('/ingredients', body),

  save_research: async (body) => dbPost('/research', body),

  link_research_ingredient: async ({ research_id, ingredient_id, relationship_type }) =>
    dbPost(`/research/${research_id}/ingredients`, { ingredient_id, relationship_type }),

  save_care_method: async (body) => dbPost('/care-methods', body),

  // ── Analysis utilities ───────────────────────────────────────────────────────
  web_search: async ({ query }) => {
    // Stub — in production wire up a real search API (Brave, Serper, etc.)
    // Returns a structured placeholder so agents can continue the pipeline.
    return {
      stub: true,
      query,
      note: '請自行替換為真實搜尋 API（Brave Search / Serper / Tavily）',
      results: [],
    };
  },
};

// ── JSON Schema tool definitions (Anthropic format) ───────────────────────────

const toolDefs = [
  {
    name: 'search_ingredients',
    description: '搜尋保養品成分資料庫',
    input_schema: {
      type: 'object',
      properties: {
        keyword:  { type: 'string', description: '關鍵字（成分名、INCI）' },
        category: { type: 'string', description: '成分類型（保濕劑/功效成分/防曬劑等）' },
      },
    },
  },
  {
    name: 'get_ingredient',
    description: '取得單一成分的完整資料',
    input_schema: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'integer' } },
    },
  },
  {
    name: 'search_products',
    description: '搜尋產品資料庫',
    input_schema: {
      type: 'object',
      properties: {
        keyword:      { type: 'string' },
        skin_type_id: { type: 'integer' },
        product_type: { type: 'string' },
      },
    },
  },
  {
    name: 'get_product',
    description: '取得單一產品的完整資料',
    input_schema: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'integer' } },
    },
  },
  {
    name: 'list_skin_types',
    description: '列出所有膚質類型',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'list_care_methods',
    description: '列出保養方式',
    input_schema: {
      type: 'object',
      properties: {
        category:    { type: 'string' },
        time_of_day: { type: 'string', enum: ['morning', 'evening', 'both'] },
      },
    },
  },
  {
    name: 'search_research',
    description: '搜尋研究文獻資料庫',
    input_schema: {
      type: 'object',
      properties: {
        keyword:       { type: 'string' },
        ingredient_id: { type: 'integer' },
      },
    },
  },
  {
    name: 'get_research',
    description: '取得單一研究文獻完整資料',
    input_schema: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'integer' } },
    },
  },
  {
    name: 'list_environment',
    description: '列出環保成分資料',
    input_schema: {
      type: 'object',
      properties: {
        reef_safe:    { type: 'boolean' },
        biodegradable:{ type: 'boolean' },
      },
    },
  },
  {
    name: 'save_ingredient',
    description: '將新成分寫入資料庫',
    input_schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name:                    { type: 'string' },
        inci_name:               { type: 'string' },
        category:                { type: 'string' },
        origin:                  { type: 'string' },
        benefits:                { type: 'array', items: { type: 'string' } },
        concerns:                { type: 'array', items: { type: 'string' } },
        irritation_risk:         { type: 'string', enum: ['low', 'moderate', 'high'] },
        comedogenic_rating:      { type: 'integer', minimum: 0, maximum: 5 },
        max_safe_concentration:  { type: 'number' },
        description:             { type: 'string' },
        evidence_level:          { type: 'string', enum: ['strong', 'moderate', 'weak', 'anecdotal'] },
      },
    },
  },
  {
    name: 'save_research',
    description: '將新研究文獻寫入資料庫',
    input_schema: {
      type: 'object',
      required: ['title'],
      properties: {
        title:            { type: 'string' },
        abstract:         { type: 'string' },
        key_findings:     { type: 'array', items: { type: 'string' } },
        study_type:       { type: 'string' },
        publication_date: { type: 'string', description: 'YYYY-MM-DD' },
        doi:              { type: 'string' },
        evidence_level:   { type: 'string', enum: ['strong', 'moderate', 'weak'] },
      },
    },
  },
  {
    name: 'link_research_ingredient',
    description: '連結研究文獻與成分',
    input_schema: {
      type: 'object',
      required: ['research_id', 'ingredient_id'],
      properties: {
        research_id:       { type: 'integer' },
        ingredient_id:     { type: 'integer' },
        relationship_type: { type: 'string' },
      },
    },
  },
  {
    name: 'save_care_method',
    description: '將新保養方式寫入資料庫',
    input_schema: {
      type: 'object',
      required: ['name', 'category'],
      properties: {
        name:            { type: 'string' },
        category:        { type: 'string' },
        description:     { type: 'string' },
        steps:           { type: 'array', items: { type: 'string' } },
        target_concerns: { type: 'array', items: { type: 'string' } },
        time_of_day:     { type: 'string', enum: ['morning', 'evening', 'both'] },
        frequency:       { type: 'string' },
        evidence_level:  { type: 'string', enum: ['strong', 'moderate', 'weak', 'anecdotal'] },
      },
    },
  },
  {
    name: 'web_search',
    description: '搜尋網路取得最新保養科學資訊',
    input_schema: {
      type: 'object',
      required: ['query'],
      properties: {
        query: { type: 'string', description: '搜尋關鍵字（建議英文學術詞彙）' },
      },
    },
  },
];

// ── Tool runner ───────────────────────────────────────────────────────────────

async function runTool(name, input) {
  const fn = toolImpls[name];
  if (!fn) throw new Error(`Unknown tool: ${name}`);
  try {
    return await fn(input);
  } catch (err) {
    return { error: err.message };
  }
}

module.exports = { toolDefs, runTool };
