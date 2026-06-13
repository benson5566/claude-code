/**
 * 題目制定 Agent — TopicPlanner
 * 接收一個主題領域，輸出 3–7 個具體、可驗證的研究問題。
 */

const BaseAgent = require('./base_agent');
const { toolDefs } = require('./tools');

// 只需要讀取類工具來了解現有資料缺口
const ALLOWED_TOOLS = [
  'search_ingredients',
  'search_products',
  'search_research',
  'list_skin_types',
  'list_care_methods',
  'list_environment',
];

const SYSTEM = `你是保養品知識圖書館的「題目制定」專員。
你的任務：
1. 先用工具查詢資料庫，了解哪些成分/研究/保養方式已有資料，哪些有缺口。
2. 根據缺口與趨勢，制定 3–7 個具體研究問題。
3. 每個問題必須：
   - 可用科學文獻驗證（可引用 DOI）
   - 對保養知識帳號的受眾（25–40 歲對保養有興趣但不專業的人）有實用價值
   - 有助於填補資料庫現有空白
4. 輸出格式為 JSON 陣列，每項包含：
   {
     "question": "問題",
     "category": "ingredient | skin_type | care_method | research | environment",
     "priority": 1–3,
     "suggested_db_action": "save_ingredient | save_research | save_care_method | none",
     "keywords": ["搜尋關鍵字1", "搜尋關鍵字2"]
   }

只輸出 JSON，不加任何說明文字。`;

class TopicPlanner extends BaseAgent {
  constructor() {
    super({
      name:         '題目制定',
      model:        'claude-haiku-4-5-20251001',
      systemPrompt: SYSTEM,
      tools:        toolDefs.filter(t => ALLOWED_TOOLS.includes(t.name)),
    });
  }

  /**
   * @param {string} domain — e.g. "抗老成分" | "油性膚質" | "環境友善防曬"
   * @returns {object[]} parsed research questions
   */
  async planTopics(domain) {
    const raw = await this.run(`請為「${domain}」領域制定研究問題清單。`);
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      this.log('JSON 解析失敗，返回原始文字');
      return [{ question: raw, category: 'unknown', priority: 2, keywords: [] }];
    }
  }
}

module.exports = TopicPlanner;
