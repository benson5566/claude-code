/**
 * Orchestrator — coordinates the full 6-agent data collection pipeline.
 *
 * Pipeline (with feedback loop):
 *
 *   TopicPlanner
 *       ↓
 *   Researcher ←──────────────────────────────────┐
 *       ↓                                          │  retry (max 1x)
 *   Verifier — needs_more_research items ──────────┘
 *       ↓ (verified + partially_verified only)
 *   DebateAgent
 *       ↓
 *   Auditor
 *       ↓
 *   DeepResearcher
 *
 * If Verifier marks items as needs_more_research, Orchestrator feeds the
 * suggested_followup queries back to Researcher for one retry round.
 * After the retry, Verifier runs again on the new findings only.
 */

const Anthropic = require('@anthropic-ai/sdk');

const TopicPlanner   = require('./topic_planner');
const Researcher     = require('./researcher');
const Verifier       = require('./verifier');
const DebateAgent    = require('./debate');
const Auditor        = require('./auditor');
const DeepResearcher = require('./deep_researcher');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

class Orchestrator {
  constructor() {
    this.topicPlanner   = new TopicPlanner();
    this.researcher     = new Researcher();
    this.verifier       = new Verifier();
    this.debateAgent    = new DebateAgent();
    this.auditor        = new Auditor();
    this.deepResearcher = new DeepResearcher();
  }

  log(msg) { console.log(`\n${'─'.repeat(60)}\n[Orchestrator] ${msg}`); }

  /**
   * Run the full pipeline for a given domain.
   * @param {string} domain — e.g. "抗老成分" | "油性膚質保養" | "環境友善防曬"
   * @param {object} opts
   * @param {number}  opts.maxTopics  — max number of topics to process (default: 3)
   * @param {boolean} opts.dryRun     — skip write operations (default: false)
   * @returns {object} pipeline report
   */
  async run(domain, { maxTopics = 3, dryRun = false } = {}) {
    const report = {
      domain,
      startedAt: new Date().toISOString(),
      topics: [],
      totalSaved: 0,
      errors: [],
    };

    // ── Stage 1: Topic Planning ───────────────────────────────────────────────
    this.log(`Stage 1｜題目制定 — 領域：${domain}`);
    let topics = [];
    try {
      topics = await this.topicPlanner.planTopics(domain);
      topics = topics.slice(0, maxTopics);
      console.log(`  → 產出 ${topics.length} 個研究問題`);
    } catch (err) {
      report.errors.push({ stage: 'topic_planner', error: err.message });
      console.error('題目制定失敗:', err.message);
      return report;
    }

    // ── Per-topic pipeline ────────────────────────────────────────────────────
    for (const topic of topics) {
      console.log(`\n  📌 ${topic.question}`);
      const topicReport = { topic, stages: {} };

      // Stage 2: Research (with one retry if Verifier requests more)
      this.log(`Stage 2｜查詢 — ${topic.question.slice(0, 50)}`);
      let researchResult;
      try {
        researchResult = await this.researcher.research(topic);
        topicReport.stages.research = { findingsCount: researchResult.findings?.length || 0, retried: false };
      } catch (err) {
        topicReport.stages.research = { error: err.message };
        report.errors.push({ stage: 'researcher', topic: topic.question, error: err.message });
        report.topics.push(topicReport);
        continue;
      }

      // Stage 3: Verification (first pass)
      this.log(`Stage 3｜檢核（第一輪）`);
      let verdicts = [];
      try {
        verdicts = await this.verifier.verify(researchResult);
        topicReport.stages.verifier = {
          verified:          verdicts.filter(v => v.verdict === 'verified').length,
          partiallyVerified: verdicts.filter(v => v.verdict === 'partially_verified').length,
          unverified:        verdicts.filter(v => v.verdict === 'unverified').length,
          rejected:          verdicts.filter(v => v.verdict === 'misleading').length,
        };
      } catch (err) {
        topicReport.stages.verifier = { error: err.message };
        report.errors.push({ stage: 'verifier', topic: topic.question, error: err.message });
      }

      // ── Feedback loop: retry research if Verifier needs more ─────────────
      const needsMoreResearch = verdicts.filter(v => v.needs_more_research);
      if (needsMoreResearch.length > 0) {
        const followupQueries = needsMoreResearch
          .map(v => v.suggested_followup)
          .filter(Boolean);

        this.log(`Stage 2b｜退回補查 — ${needsMoreResearch.length} 項需要更多資料`);
        console.log(`  → 補查方向：${followupQueries.slice(0, 3).join(' / ')}`);

        try {
          const retryResult = await this.researcher.research(topic, followupQueries);
          // Merge new findings (avoid duplicates by claim text)
          const existingClaims = new Set(researchResult.findings.map(f => f.claim));
          const newFindings = (retryResult.findings || []).filter(f => !existingClaims.has(f.claim));
          researchResult.findings = [...researchResult.findings, ...newFindings];

          // Re-verify the new findings only
          if (newFindings.length) {
            this.log(`Stage 3b｜重新檢核新增 ${newFindings.length} 項發現`);
            const retryVerdicts = await this.verifier.verify({ ...retryResult, findings: newFindings });
            verdicts = [...verdicts, ...retryVerdicts];
          }

          topicReport.stages.research.retried = true;
          topicReport.stages.research.newFindingsOnRetry = newFindings.length;
          topicReport.stages.verifier.afterRetry = {
            verified:   verdicts.filter(v => v.verdict === 'verified').length,
            unverified: verdicts.filter(v => v.verdict === 'unverified').length,
          };
        } catch (err) {
          this.log(`補查失敗（繼續使用第一輪結果）: ${err.message}`);
        }
      }

      // Stage 4: Multi-perspective Debate
      this.log(`Stage 4｜多觀點討論`);
      let perspectives = [];
      try {
        perspectives = await this.debateAgent.debate(verdicts);
        topicReport.stages.debate = { perspectivesCount: perspectives.length };
      } catch (err) {
        topicReport.stages.debate = { error: err.message };
        report.errors.push({ stage: 'debate', topic: topic.question, error: err.message });
      }

      // Stage 5: Audit
      this.log(`Stage 5｜查核稽核`);
      let auditReport;
      try {
        auditReport = await this.auditor.audit({ researchResult, verdicts, perspectives });
        topicReport.stages.auditor = {
          itemsToSave: auditReport.items_to_save?.length || 0,
          contentReadyClaims: auditReport.content_ready_claims?.length || 0,
        };
      } catch (err) {
        topicReport.stages.auditor = { error: err.message };
        report.errors.push({ stage: 'auditor', topic: topic.question, error: err.message });
        report.topics.push(topicReport);
        continue;
      }

      // Stage 6: Deep Research + Save (skip in dry-run)
      if (!dryRun && auditReport.items_to_save?.length) {
        this.log(`Stage 6｜深度研究 + 儲存 (${auditReport.items_to_save.length} 項)`);
        try {
          const saveReport = await this.deepResearcher.deepResearch(auditReport);
          topicReport.stages.deepResearch = {
            saved: saveReport.saved?.length || 0,
            skipped: saveReport.skipped?.length || 0,
            summary: saveReport.summary,
          };
          report.totalSaved += saveReport.saved?.length || 0;
        } catch (err) {
          topicReport.stages.deepResearch = { error: err.message };
          report.errors.push({ stage: 'deep_researcher', topic: topic.question, error: err.message });
        }
      } else if (dryRun) {
        topicReport.stages.deepResearch = { note: 'dry-run: 跳過儲存', wouldSave: auditReport.items_to_save?.length || 0 };
      }

      // Attach content-ready claims for social post use
      topicReport.contentReadyClaims = auditReport.content_ready_claims || [];
      report.topics.push(topicReport);
    }

    report.finishedAt = new Date().toISOString();
    return report;
  }

  /**
   * Summarise the pipeline report using claude-opus-4-8.
   * Returns a human-readable Chinese summary.
   */
  async summariseReport(report) {
    const resp = await client.messages.create({
      model:      'claude-opus-4-8',
      max_tokens: 1024,
      thinking:   { type: 'adaptive' },
      system:     '你是保養品知識管理員。請用繁體中文總結本次資料收集管道的執行結果，重點放在：新增了哪些資料、發現了哪些值得社群貼文使用的觀點、以及下次應優先補充哪些缺口。輸出 300 字內的摘要。',
      messages:   [{ role: 'user', content: JSON.stringify(report, null, 2) }],
    });
    return resp.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
  }
}

module.exports = Orchestrator;
