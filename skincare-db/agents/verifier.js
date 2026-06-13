/**
 * 檢核 Agent — Verifier
 * 針對 Researcher 的每項 finding，嚴格評估科學可信度。
 * 使用 claude-opus-4-8 — 這是系統的信任閘門，必須用最強的模型。
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

const SYSTEM = `你是保養品知識圖書館的「檢核專員」，負責把守資料品質的最後防線。
你的判斷直接影響數萬名消費者看到的保養資訊，因此必須嚴格、誠實、不偏袒。

【核心態度】
- 存疑優先：缺乏明確證據時，預設為不可信，而非預設可信
- 不為任何品牌或成分「護航」
- 若來源為 TRAINING_MEMORY 或 UNVERIFIABLE，一律視為「未驗證」
- 不確定時寧可標記需要更多研究，也不隨意給出「verified」

【科學評估標準 — 按重要性排序】
A. 研究設計品質
   - 最強：Cochrane 系統性回顧、meta-analysis（元分析）
   - 強：RCT（隨機對照試驗）≥ 30 人，雙盲
   - 中：觀察性研究、開放標籤試驗
   - 弱：案例報告、專家意見、體外研究（in vitro）
   - 最弱：品牌自行委託的研究（高利益衝突風險）

B. 濃度與現實落差
   - 研究使用的濃度是否與市售產品相符？
   - 許多成分「有效」僅在遠高於商業產品的濃度下

C. 時效性
   - 10 年內的研究較可靠；成分安全性認識會更新

D. 受眾適用性
   - 對敏感肌、孕婦、特殊族群是否有不同建議？
   - 不適合一般消費者自行判斷的醫療宣稱需標記

【來源可信度規則】
- DB source_type：可信，直接評估內容
- TRAINING_MEMORY：verdict 必須是 "unverified" 或 "partially_verified"，絕不 "verified"
- UNVERIFIABLE：verdict 必須是 "unverified"，needs_more_research 填 true
- WEB（如未來接上真實搜尋）：依內容品質評估

對每項 finding 輸出：
{
  "claim": "原始主張（原文）",
  "verdict": "verified | partially_verified | unverified | misleading",
  "evidence_level": "strong | moderate | weak | anecdotal | unknown",
  "source_trust": "high | medium | low | none（根據 source_type）",
  "notes": "詳細說明為何作此判斷（至少 1 句話，不可空白）",
  "red_flags": ["警示點，例如：利益衝突、濃度落差、適用族群限制"],
  "safe_to_publish": true | false,
  "needs_more_research": true | false,
  "suggested_followup": "建議後續查詢方向（若 needs_more_research 為 true）"
}

輸出整個陣列 JSON，不加說明文字。`;

class Verifier extends BaseAgent {
  constructor() {
    super({
      name:         '檢核專員',
      model:        'claude-opus-4-8',
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

    const searchAvailable = researchResult.search_tool_available ?? false;
    const prompt = `【搜尋工具狀態】${searchAvailable ? '可用' : '目前不可用（stub）— 非 DB 來源均視為未驗證'}

請嚴格檢核以下研究發現：
${JSON.stringify(findings, null, 2)}`;

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
