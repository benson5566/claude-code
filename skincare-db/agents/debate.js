/**
 * 不同觀點討論 Agent — DebateAgent
 * 針對已驗證的發現，呈現正/反/中立三個觀點，找出爭議點與共識。
 * 目的是讓社群貼文更有深度、更具批判性，避免一面倒的「廣告感」。
 */

const BaseAgent = require('./base_agent');
const { toolDefs } = require('./tools');

const ALLOWED_TOOLS = [
  'web_search',
  'search_research',
  'search_ingredients',
];

const SYSTEM = `你是保養品知識圖書館的「觀點討論專員」。
任務：針對一個已驗證的保養主張，從三個角度提供不同觀點。

三個角色：
- PRO（支持）：最有力的科學/實用支持論點
- CON（反對/限制）：最重要的限制條件、反例或批評
- NEUTRAL（中立/整合）：整合兩方，提出「在哪些條件下成立」的精確結論

輸出格式（JSON）：
{
  "claim": "主張",
  "pro": {
    "argument": "支持論點",
    "strength": "high | medium | low",
    "best_for": "最適合哪些族群/情境"
  },
  "con": {
    "argument": "反對/限制論點",
    "caveat": "注意事項",
    "affected_groups": ["可能不適用族群"]
  },
  "neutral": {
    "synthesis": "整合結論",
    "conditions": ["成立條件"],
    "content_angle": "最適合社群貼文的切入角度"
  },
  "controversy_level": 1–5
}

只輸出 JSON。`;

class DebateAgent extends BaseAgent {
  constructor() {
    super({
      name:         '觀點討論',
      model:        'claude-opus-4-8',
      systemPrompt: SYSTEM,
      tools:        toolDefs.filter(t => ALLOWED_TOOLS.includes(t.name)),
    });
  }

  /**
   * @param {object[]} verdicts — verified claims from Verifier
   * @returns {object[]} multi-perspective analyses
   */
  async debate(verdicts) {
    const safeClaims = verdicts.filter(v => v.safe_to_publish && v.verdict !== 'misleading');
    if (!safeClaims.length) return [];

    const results = [];
    for (const v of safeClaims) {
      const prompt = `請對以下主張進行多觀點分析：\n${v.claim}\n\n檢核結果：${v.verdict}，證據等級：${v.evidence_level}`;
      const raw = await this.run(prompt);
      try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) results.push(JSON.parse(jsonMatch[0]));
      } catch {
        this.log(`無法解析「${v.claim.slice(0, 40)}」的觀點分析`);
      }
    }
    return results;
  }
}

module.exports = DebateAgent;
