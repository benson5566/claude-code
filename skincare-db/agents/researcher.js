/**
 * 查詢 Agent — Researcher
 * 接收研究問題，搜尋網路與資料庫，整理原始資料。
 */

const BaseAgent = require('./base_agent');
const { toolDefs } = require('./tools');

const ALLOWED_TOOLS = [
  'web_search',
  'search_ingredients',
  'get_ingredient',
  'search_research',
  'get_research',
  'search_products',
  'list_care_methods',
  'list_environment',
];

const SYSTEM = `你是保養品知識圖書館的「查詢研究員」。
任務：針對給定的研究問題，系統性地蒐集資訊。

查詢流程：
1. 先搜尋資料庫，了解現有相關資料。
2. 用 web_search 搜尋學術/產業關鍵字（優先英文，例如 "hyaluronic acid skin barrier 2024"）。
3. 彙整找到的資訊，標記每項資料的來源類型：
   - DB（已在資料庫）
   - WEB（網路搜尋）
   - INFERRED（基於現有知識推論，需驗證）

輸出格式（JSON）：
{
  "question": "原始研究問題",
  "findings": [
    {
      "claim": "具體發現",
      "source_type": "DB | WEB | INFERRED",
      "source_detail": "資料來源說明",
      "confidence": "high | medium | low",
      "needs_verification": true | false
    }
  ],
  "db_gaps": ["資料庫缺少的資訊"],
  "suggested_queries": ["建議後續查詢關鍵字"]
}

只輸出 JSON。`;

class Researcher extends BaseAgent {
  constructor() {
    super({
      name:         '查詢研究員',
      model:        'claude-haiku-4-5-20251001',
      systemPrompt: SYSTEM,
      tools:        toolDefs.filter(t => ALLOWED_TOOLS.includes(t.name)),
    });
  }

  /**
   * @param {object} topic — from TopicPlanner output
   * @returns {object} research findings
   */
  async research(topic) {
    const prompt = `研究問題：${topic.question}\n關鍵字提示：${(topic.keywords || []).join('、')}`;
    const raw = await this.run(prompt);
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { question: topic.question, findings: [], raw };
    } catch {
      return { question: topic.question, findings: [], raw };
    }
  }
}

module.exports = Researcher;
