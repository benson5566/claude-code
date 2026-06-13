#!/usr/bin/env node
/**
 * Entry point for the skincare data collection multi-agent pipeline.
 *
 * Usage:
 *   node run.js [domain] [--max=N] [--dry-run]
 *
 * Examples:
 *   node run.js "抗老成分"
 *   node run.js "油性膚質保養" --max=5
 *   node run.js "環境友善防曬" --dry-run
 *   node run.js  # uses default domain "保養成分"
 */

require('dotenv').config({ path: require('path').join(__dirname, '../api/.env') });

const fs           = require('fs');
const path         = require('path');
const Orchestrator = require('./orchestrator');

function parseArgs() {
  const args    = process.argv.slice(2);
  const domain  = args.find(a => !a.startsWith('--')) || '保養成分';
  const maxArg  = args.find(a => a.startsWith('--max='));
  const maxTopics = maxArg ? parseInt(maxArg.split('=')[1]) : 3;
  const dryRun  = args.includes('--dry-run');
  return { domain, maxTopics, dryRun };
}

async function main() {
  const { domain, maxTopics, dryRun } = parseArgs();

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('錯誤：請設定環境變數 ANTHROPIC_API_KEY');
    process.exit(1);
  }

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║          保養品知識圖書館 — 多代理資料收集管道            ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`  領域：${domain}`);
  console.log(`  最多主題數：${maxTopics}`);
  console.log(`  Dry Run：${dryRun ? '是（不儲存）' : '否（實際儲存）'}`);
  console.log('');

  const orchestrator = new Orchestrator();

  let report;
  try {
    report = await orchestrator.run(domain, { maxTopics, dryRun });
  } catch (err) {
    console.error('管道執行失敗:', err);
    process.exit(1);
  }

  // Save raw report
  const outDir  = path.join(__dirname, 'reports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  const stamp   = new Date().toISOString().replace(/[:.]/g, '-');
  const outFile = path.join(outDir, `report_${stamp}.json`);
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.log(`\n📄 原始報告已儲存：${outFile}`);

  // Human summary
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                       執行摘要                            ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  try {
    const summary = await orchestrator.summariseReport(report);
    console.log(summary);
  } catch (err) {
    console.log('（摘要生成失敗）', err.message);
  }

  console.log('\n統計：');
  console.log(`  • 處理主題數：${report.topics.length}`);
  console.log(`  • 新增資料筆數：${report.totalSaved}`);
  if (report.errors.length) {
    console.log(`  • 錯誤數：${report.errors.length}`);
    report.errors.forEach(e => console.log(`    - [${e.stage}] ${e.error}`));
  }

  // Print content-ready claims for social post use
  const allClaims = report.topics.flatMap(t => t.contentReadyClaims || []);
  if (allClaims.length) {
    console.log('\n✅ 可直接用於社群貼文的已驗證主張：');
    allClaims.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));
  }
}

main();
