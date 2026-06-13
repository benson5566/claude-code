/**
 * 檢核 Agent — Verifier
 * 針對 Researcher 的每項 finding，評估可信度並標記需要二次確認的項目。
 */

const BaseAgent = require('./base_agent');
const { toolDefs } = require('./tools');

const ALLOWED_TOOLS = [
  'web_search',
  'search_research',
  'get_research',
  'search_ingredients',
  'get_ingredient',
];

const SYSTEM = `你是保養品知識圖書館的「檢核專員」。
任務：評估研究員提交的每項發現是否可信、是否有科學支持。

評估標準：
- 是否有隨機對照試驗（RCT）或系統性回顧支持？
- 樣本數是否足夠（≥ 30 人）？
- 研究是否在過去 10 年內發表？
- 是否有利益衝突（品牌贊助）？
- 成分濃度/條件是否與一般消費性產品相符？

對每項 finding 輸出：
{
  "claim": "原始主張",
  "verdict": "verified | unverified | partially_verified | misleading",
  "evidence_level": "strong | moderate | weak | anecdotal",
  "notes": "說明",
  "red_flags": ["警示點（若有）"],
  "safe_to_publish": true | false
}

輸出整個陣列 JSON，不加說明。`;

class Verifier extends BaseAgent {
  constructor() {
    super({
      name:         '檢核專員',
      model:        'claude-haiku-4-5-20251001',
      systemPrompt: SYSTEM,
      tools:        toolDefs.filter(t => ALLOWED_TOOLS.includes(t.name)),
    });
  }

  /**
   * @param {object} researchResult — from Researcher
   * @returns {object[]} verification verdicts
   */
  async verify(researchResult) {
    const findings = researchResult.findings || [];
    if (!findings.length) return [];

    const prompt = `請檢核以下研究發現：\n${JSON.stringify(findings, null, 2)}`;
    const raw = await this.run(prompt);
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      this.log('JSON 解析失敗');
      return [];
    }
  }
}

module.exports = Verifier;
