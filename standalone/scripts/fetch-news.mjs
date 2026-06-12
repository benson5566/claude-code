#!/usr/bin/env node
/**
 * fetch-news.mjs — 從 AI 新聞來源撈「原始素材」到 data/news-inbox.data.js。
 *
 *   node scripts/fetch-news.mjs
 *
 * ⚠️ 這只是兩段式流程的第一段(撈原料):
 *   第二段請在 Claude Code 執行 /curate-news,
 *   它會篩掉不相關的、把英文翻譯改寫成繁中、加上學習視角,
 *   整理完才會合併進網站顯示的 data/news.data.js。
 *
 * 來源說明:
 *   - 官方 AI 部落格(OpenAI/Anthropic/Google/HF):全收,requireKeywords: false
 *   - 綜合科技媒體(iThome/INSIDE/TechOrange 等):用 AI 關鍵字過濾
 *   - 來源失效會自動跳過,不影響其他來源;可自行增減 FEEDS
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, "..", "data", "news-inbox.data.js");
const PUBLISHED = join(__dirname, "..", "data", "news.data.js");
const MAX_PER_FEED = 8;
const MAX_TOTAL = 40;

const DEFAULT_FEEDS = [
  // 官方 AI 來源(全收)
  { name: "OpenAI", url: "https://openai.com/news/rss.xml", tags: ["OpenAI"], requireKeywords: false },
  { name: "Anthropic", url: "https://www.anthropic.com/rss.xml", tags: ["Anthropic"], requireKeywords: false },
  { name: "Google AI Blog", url: "https://blog.google/technology/ai/rss/", tags: ["Google"], requireKeywords: false },
  { name: "Hugging Face Blog", url: "https://huggingface.co/blog/feed.xml", tags: ["Hugging Face", "教學"], requireKeywords: false },
  // 台灣中文科技媒體(關鍵字過濾)
  { name: "iThome", url: "https://www.ithome.com.tw/rss", tags: ["台灣", "中文"], requireKeywords: true },
  { name: "INSIDE", url: "https://www.inside.com.tw/feed/rss", tags: ["台灣", "中文"], requireKeywords: true },
  { name: "TechOrange 科技報橘", url: "https://buzzorange.com/techorange/feed/", tags: ["台灣", "中文"], requireKeywords: true }
];
// 測試用:NEWS_FEEDS_JSON 環境變數可覆寫來源清單
const FEEDS = process.env.NEWS_FEEDS_JSON ? JSON.parse(process.env.NEWS_FEEDS_JSON) : DEFAULT_FEEDS;

// 綜合媒體的 AI 相關性過濾(標題或摘要命中任一即收)
const AI_KEYWORDS = [
  "ai", "人工智慧", "生成式", "大型語言模型", "llm", "gpt", "chatgpt", "claude", "gemini",
  "copilot", "openai", "anthropic", "deepmind", "機器學習", "深度學習", "machine learning",
  "deep learning", "midjourney", "stable diffusion", "sora", "nvidia", "輝達", "ai agent",
  "智慧代理", "聊天機器人", "chatbot", "提示詞", "prompt"
];

// 教學性質偵測(標上 "教學" tag,/curate-news 會優先考慮收進教學庫)
const TUTORIAL_HINTS = ["how to", "guide", "tutorial", "step by step", "教學", "入門", "教你", "上手", "實作", "新手", "攻略"];

function decodeEntities(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, " ")
    .replace(/The post .* appeared first on .*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function pick(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? decodeEntities(m[1]) : "";
}

function pickLink(xml) {
  const plain = pick(xml, "link");
  if (plain && plain.startsWith("http")) return plain;
  const m = xml.match(/<link[^>]*href="([^"]+)"[^>]*\/?>(?:<\/link>)?/i);
  return m ? m[1] : "";
}

function isAIRelated(text) {
  const t = text.toLowerCase();
  return AI_KEYWORDS.some((k) => t.includes(k));
}

function looksTutorial(text) {
  const t = text.toLowerCase();
  return TUTORIAL_HINTS.some((k) => t.includes(k));
}

function parseFeed(xml, feed) {
  const items = xml.match(/<(item|entry)[\s\S]*?<\/\1>/gi) || [];
  return items.slice(0, MAX_PER_FEED).map((it) => {
    const title = pick(it, "title");
    const summary = (pick(it, "description") || pick(it, "summary") || pick(it, "content")).slice(0, 300);
    const dateRaw = pick(it, "pubDate") || pick(it, "published") || pick(it, "updated") || pick(it, "dc:date");
    const date = dateRaw && !isNaN(new Date(dateRaw)) ? new Date(dateRaw).toISOString().slice(0, 10) : "";
    const tags = looksTutorial(title + " " + summary) && !feed.tags.includes("教學")
      ? [...feed.tags, "教學"] : feed.tags;
    return { title, summary, source: feed.name, date, url: pickLink(it), tags };
  }).filter((it) => {
    if (!it.title || !it.url) return false;
    if (feed.requireKeywords && !isAIRelated(it.title + " " + it.summary)) return false;
    return true;
  });
}

async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url, {
      headers: { "user-agent": "Mozilla/5.0 (AI-Learning-Hub news fetcher)" },
      signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items = parseFeed(await res.text(), feed);
    console.log(`✓ ${feed.name}:${items.length} 則`);
    return items;
  } catch (err) {
    console.warn(`✗ ${feed.name} 失敗:${err.message}`);
    return [];
  }
}

// 已發布過的不再進待整理清單
const publishedUrls = new Set();
if (existsSync(PUBLISHED)) {
  for (const m of readFileSync(PUBLISHED, "utf8").matchAll(/url:\s*"([^"]+)"/g)) publishedUrls.add(m[1]);
}

const results = (await Promise.all(FEEDS.map(fetchFeed))).flat()
  .filter((it) => !publishedUrls.has(it.url));

if (results.length === 0) {
  console.error("\n沒有撈到任何內容(可能是網路限制或來源全數失效),保留現有檔案不變。");
  process.exit(1);
}

// 同網址去重 + 依日期排序
const seen = new Set();
const unique = results.filter((it) => (seen.has(it.url) ? false : seen.add(it.url)));
unique.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
const top = unique.slice(0, MAX_TOTAL);

const banner =
  "// 原始新聞素材(未整理)— 由 scripts/fetch-news.mjs 於 " +
  new Date().toISOString().slice(0, 10) +
  " 撈取\n// ⚠️ 這不是網站顯示的內容!請在 Claude Code 執行 /curate-news 整理後才會進 news.data.js\n";
writeFileSync(OUTPUT, banner + "window.NEWS_INBOX = " + JSON.stringify(top, null, 2) + ";\n");
console.log(`\n已寫入 ${top.length} 則原始素材 → ${OUTPUT}`);
console.log("下一步:在 Claude Code 執行 /curate-news,把素材整理成繁中、具學習視角的新聞");
