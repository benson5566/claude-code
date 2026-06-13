/**
 * 查核 Agent — Auditor
 * 跨來源交叉比對，確保資料一致性，標記矛盾點，決定是否可寫入資料庫。
 */

const BaseAgent = require('./base_agent');
const { toolDefs } = require('./tools');

const ALLOWED_TOOLS = [
  'search_ingredients',
  'get_ingredient',
  'search_research',
  'get_research',
  'list_care_methods',
];

const SYSTEM = `你是保養品知識圖書館的「查核稽核員」。
任務：整合研究員、檢核員、觀點討論員的輸出，做最終品質把關。

稽核項目：
1. 跨來源一致性：不同來源的資訊是否互相矛盾？
2. 資料庫衝突：與現有資料庫資料是否有衝突？
3. 濃度/劑量合理性：聲稱的效果是否在合理使用濃度範圍內？
4. 受眾適合性：資訊是否適合一般消費者（非醫療從業者）？
5. 法規合規：是否包含不能公開宣稱的療效？

輸出（JSON）：
{
  "topic": "主題",
  "audit_summary": "稽核摘要（100字內）",
  "items_to_save": [
    {
      "type": "ingredient | research | care_method",
      "data": { ... },
      "confidence": "high | medium",
      "reason": "為何建議儲存"
    }
  ],
  "items_rejected": [
    {
      "claim": "被拒絕的主張",
      "reason": "拒絕原因"
    }
  ],
  "content_ready_claims": ["可直接用於社群貼文的主張（已稽核）"],
  "needs_expert_review": ["需要專業人士複核的項目"]
}

只輸出 JSON。`;

class Auditor extends BaseAgent {
  constructor() {
    super({
      name:         '查核稽核員',
      model:        'claude-opus-4-8',
      systemPrompt: SYSTEM,
      tools:        toolDefs.filter(t => ALLOWED_TOOLS.includes(t.name)),
    });
  }

  /**
   * @param {object} params
   * @param {object}   params.researchResult
   * @param {object[]} params.verdicts
   * @param {object[]} params.perspectives
   * @returns {object} audit report
   */
  async audit({ researchResult, verdicts, perspectives }) {
    const prompt = `請對以下資料進行最終稽核：

【研究問題】
${researchResult.question}

【研究發現】
${JSON.stringify(researchResult.findings, null, 2)}

【檢核結果】
${JSON.stringify(verdicts, null, 2)}

【觀點分析】
${JSON.stringify(perspectives, null, 2)}`;

    const raw = await this.run(prompt);
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { topic: researchResult.question, items_to_save: [], raw };
    } catch {
      return { topic: researchResult.question, items_to_save: [], raw };
    }
  }
}

module.exports = Auditor;
