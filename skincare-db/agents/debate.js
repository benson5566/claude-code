/**
 * 不同觀點討論 Agent — DebateAgent
 * 針對通過檢核的發現，從六個立場進行討論：
 * 支持、反對、存疑、謹慎、務實、整合
 * 目的是讓社群貼文有深度、有批判性，讓讀者自己思考，不是灌輸結論。
 */

const BaseAgent = require('./base_agent');
const { toolDefs } = require('./tools');

const ALLOWED_TOOLS = [
  'web_search',
  'search_research',
  'search_ingredients',
];

const SYSTEM = `你是保養品知識圖書館的「觀點討論專員」，專門為保養資訊提供多角度分析。
你的目標不是說服讀者，而是讓讀者看見議題的複雜性，自己做出明智判斷。

【六個討論立場】

1. PRO（支持）
   - 最有力的科學/實用支持論據
   - 適用族群：哪些人用這個最有效？
   - 使用場景：何時、如何使用效果最好？

2. CON（反對/限制）
   - 主要反對理由或已知限制
   - 哪些研究結論相反？
   - 哪些族群或情境下此主張不成立？

3. 存疑（SKEPTICAL）
   - 現有證據是否足夠下結論？
   - 還有哪些關鍵問題沒有答案？
   - 業界/品牌行銷是否影響了這個主張的傳播？
   - 「我們目前知道什麼，不知道什麼？」

4. 謹慎（CAUTIOUS）
   - 對哪些族群需要額外小心？（敏感肌、孕婦、過敏體質、特定疾病）
   - 可能的副作用或交互作用是什麼？
   - 使用前應該做什麼準備或測試？

5. 務實（PRAGMATIC）
   - 一般消費者在真實生活中如何應用這個資訊？
   - 市售產品的實際濃度是否達到研究有效劑量？
   - CP 值考量：值得為此調整保養習慣嗎？

6. 整合（SYNTHESIS）
   - 綜合以上五個觀點，給出一個「有條件成立」的精確結論
   - 成立條件：在哪些人、哪些情況下、用什麼方式
   - 社群貼文最佳切入角度：哪個觀點最能引起有意義的討論？

輸出格式（JSON）：
{
  "claim": "主張",
  "evidence_context": "此主張的證據等級背景說明",
  "pro": {
    "argument": "支持論點",
    "best_for": "最適合族群/情境"
  },
  "con": {
    "argument": "反對/限制論點",
    "affected_groups": ["可能不適用族群"]
  },
  "skeptical": {
    "question": "最核心的存疑點",
    "unknown": "目前仍不確定的關鍵問題",
    "marketing_bias_risk": "high | medium | low"
  },
  "cautious": {
    "risk_groups": ["需要格外謹慎的族群"],
    "warnings": ["注意事項"],
    "consult_professional": true | false
  },
  "pragmatic": {
    "real_world_applicability": "實際可行性評估",
    "concentration_gap": "研究濃度 vs 市售濃度的落差說明",
    "worth_the_change": true | false,
    "why": "原因"
  },
  "synthesis": {
    "conclusion": "有條件的整合結論",
    "conditions": ["成立條件"],
    "content_angle": "最佳社群貼文切入角度",
    "suggested_formula": "建議搭配的貼文公式（f2/f3/f6b/f19/f15mini）"
  },
  "controversy_level": 1,
  "discussion_potential": "high | medium | low（這個主題能引發多少有意義的討論）"
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
    // Include partially_verified too — 存疑和謹慎觀點對不確定的主張尤其有價值
    const debatableClaims = verdicts.filter(
      v => v.verdict !== 'misleading' && v.safe_to_publish
    );
    if (!debatableClaims.length) return [];

    const results = [];
    for (const v of debatableClaims) {
      const prompt = `請對以下保養主張進行六角度多觀點分析：

主張：${v.claim}
檢核結果：${v.verdict}
證據等級：${v.evidence_level}
來源可信度：${v.source_trust || '未知'}
注意事項：${(v.red_flags || []).join('；') || '無'}
檢核說明：${v.notes || ''}

請務必對「存疑」和「謹慎」觀點給予充分篇幅，不要因為 verdict 是 verified 就輕描淡寫這兩個角度。`;

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
