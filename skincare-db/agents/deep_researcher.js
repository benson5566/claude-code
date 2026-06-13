/**
 * 研究 Agent — DeepResearcher
 * 對稽核通過的項目進行深度研究，補全資料庫欄位，並生成結構化入庫資料。
 * 使用 claude-opus-4-8 + adaptive thinking 處理複雜成分機制分析。
 */

const BaseAgent = require('./base_agent');
const { toolDefs } = require('./tools');

const WRITE_TOOLS = [
  'web_search',
  'search_ingredients',
  'get_ingredient',
  'search_research',
  'list_skin_types',
  'save_ingredient',
  'save_research',
  'link_research_ingredient',
  'save_care_method',
];

const SYSTEM = `你是保養品知識圖書館的「深度研究員」，負責為稽核通過的資料補全所有欄位並寫入資料庫。

工作流程：
1. 讀取稽核報告中的 items_to_save 清單。
2. 對每個項目，用 web_search 補全缺少的欄位（INCI 名稱、濃度、機轉、副作用、文獻來源）。
3. 呼叫對應的寫入工具（save_ingredient / save_research / save_care_method）儲存資料。
4. 若有研究文獻與成分的關聯，呼叫 link_research_ingredient。
5. 最後輸出存檔報告。

寫入前的品質門檻：
- 成分：必須有 INCI 名稱、至少 2 項 benefits、irritation_risk 評估
- 研究：必須有 title、至少 1 項 key_findings、evidence_level
- 保養方式：必須有 steps 清單（至少 2 步驟）、target_concerns

輸出格式（JSON）：
{
  "saved": [
    { "type": "ingredient|research|care_method", "id": 123, "name": "..." }
  ],
  "skipped": [
    { "name": "...", "reason": "缺少必要欄位" }
  ],
  "summary": "本次深度研究摘要（200字內）"
}`;

class DeepResearcher extends BaseAgent {
  constructor() {
    super({
      name:         '深度研究員',
      model:        'claude-opus-4-8',
      systemPrompt: SYSTEM,
      tools:        toolDefs.filter(t => WRITE_TOOLS.includes(t.name)),
    });
  }

  /**
   * @param {object} auditReport — from Auditor
   * @returns {object} save report
   */
  async deepResearch(auditReport) {
    if (!auditReport.items_to_save?.length) {
      this.log('無待儲存項目，跳過深度研究');
      return { saved: [], skipped: [], summary: '無待儲存項目' };
    }

    const prompt = `請根據以下稽核報告進行深度研究並寫入資料庫：

${JSON.stringify(auditReport, null, 2)}

請依序處理 items_to_save 中的每一項，補全欄位後儲存。`;

    const raw = await this.run(prompt);
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { saved: [], skipped: [], summary: raw };
    } catch {
      return { saved: [], skipped: [], summary: raw };
    }
  }
}

module.exports = DeepResearcher;
