/**
 * 查詢 Agent — Researcher
 * 接收研究問題，搜尋網路與資料庫，整理原始資料。
 * 誠實標記來源；當搜尋工具無法返回真實結果時，絕不補腦。
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

【核心誠信規則 — 絕對不得違反】
- 若 web_search 工具回傳 { stub: true } 或 results 為空陣列，
  代表目前沒有可用的網路搜尋功能。
  此時你必須：
  (a) 將所有非 DB 來源的發現標記為 source_type: "UNVERIFIABLE"
  (b) source_detail 寫「web_search 工具目前無法取得外部資料」
  (c) 絕對不得憑記憶捏造 DOI、論文標題、研究機構或數字
  (d) confidence 一律填 "low"，needs_verification: true
- 只有 DB 工具（search_ingredients、search_research 等）回傳的資料
  可以標記為 source_type: "DB"
- 從自身訓練知識推論的內容，一律標 source_type: "TRAINING_MEMORY"，
  並明確說明「此為模型訓練記憶，未獲外部來源確認」

來源類型定義：
- DB           ：資料庫工具直接回傳的資料（可信）
- WEB          ：web_search 有實際返回 URL/標題/摘要（目前工具為 stub，暫時無法使用）
- TRAINING_MEMORY：模型訓練記憶，需外部驗證
- UNVERIFIABLE  ：搜尋工具無結果、無法確認來源

查詢流程：
1. 先呼叫 DB 工具（search_ingredients、search_research 等）取得已知資料。
2. 嘗試 web_search，如回傳 stub 或空結果，誠實標記，不補腦。
3. 可以從訓練記憶整理方向性線索，但必須標 TRAINING_MEMORY。
4. 輸出結構化 JSON，讓後續 Verifier 知道哪些需要驗證。

輸出格式（JSON）：
{
  "question": "原始研究問題",
  "search_tool_available": true | false,
  "findings": [
    {
      "claim": "具體發現（描述事實，不加形容詞誇大）",
      "source_type": "DB | WEB | TRAINING_MEMORY | UNVERIFIABLE",
      "source_detail": "資料來源說明（DB 填 table/id，WEB 填 URL，其他填說明）",
      "confidence": "high | medium | low",
      "needs_verification": true | false
    }
  ],
  "db_gaps": ["資料庫缺少的資訊"],
  "suggested_queries": ["建議後續用真實搜尋工具查詢的關鍵字（英文學術詞彙）"]
}

只輸出 JSON。`;

class Researcher extends BaseAgent {
  constructor() {
    super({
      name:         '查詢研究員',
      model:        'claude-haiku-4-5',
      systemPrompt: SYSTEM,
      tools:        toolDefs.filter(t => ALLOWED_TOOLS.includes(t.name)),
    });
  }

  /**
   * @param {object} topic — from TopicPlanner output
   * @param {string[]} [extraQueries] — additional queries from retry (Orchestrator feedback)
   * @returns {object} research findings
   */
  async research(topic, extraQueries = []) {
    let prompt = `研究問題：${topic.question}\n關鍵字提示：${(topic.keywords || []).join('、')}`;
    if (extraQueries.length) {
      prompt += `\n\n【補充查詢指示 — 上一輪部分發現無法驗證，請針對以下方向加強查詢】\n${extraQueries.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
    }
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
