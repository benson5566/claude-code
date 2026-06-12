#!/usr/bin/env node
/**
 * fetch-news.mjs — 從主流 AI 來源的 RSS/Atom feed 抓取最新新聞,
 * 更新 data/news.data.js。不需安裝任何套件,Node 18+ 即可執行:
 *
 *   node scripts/fetch-news.mjs
 *
 * 抓取後請人工檢查內容再發布(摘要為原文擷取,可能需要翻譯/改寫)。
 */
import { writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, "..", "data", "news.data.js");
const MAX_PER_FEED = 5;
const MAX_TOTAL = 24;

// 主流 AI 新聞來源(RSS / Atom)
const FEEDS = [
  { name: "OpenAI", url: "https://openai.com/news/rss.xml", tags: ["OpenAI"] },
  { name: "Anthropic", url: "https://www.anthropic.com/rss.xml", tags: ["Anthropic"] },
  { name: "Google AI Blog", url: "https://blog.google/technology/ai/rss/", tags: ["Google"] },
  { name: "Hugging Face", url: "https://huggingface.co/blog/feed.xml", tags: ["Hugging Face", "開源"] },
  { name: "MIT Tech Review AI", url: "https://www.technologyreview.com/topic/artificial-intelligence/feed", tags: ["產業趨勢"] },
  { name: "The Verge AI", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", tags: ["產業趨勢"] }
];

function decodeEntities(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, "") // 去除殘留 HTML 標籤
    .replace(/\s+/g, " ")
    .trim();
}

function pick(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? decodeEntities(m[1]) : "";
}

function pickLink(xml) {
  // RSS: <link>url</link>;Atom: <link href="url"/>
  const plain = pick(xml, "link");
  if (plain && plain.startsWith("http")) return plain;
  const m = xml.match(/<link[^>]*href="([^"]+)"[^>]*\/?>(?:<\/link>)?/i);
  return m ? m[1] : "";
}

function parseFeed(xml, feed) {
  const items = xml.match(/<(item|entry)[\s\S]*?<\/\1>/gi) || [];
  return items.slice(0, MAX_PER_FEED).map((it) => {
    const title = pick(it, "title");
    const summary = (pick(it, "description") || pick(it, "summary") || pick(it, "content")).slice(0, 220);
    const dateRaw = pick(it, "pubDate") || pick(it, "published") || pick(it, "updated") || pick(it, "dc:date");
    const date = dateRaw ? new Date(dateRaw).toISOString().slice(0, 10) : "";
    return {
      title,
      summary: summary || "(無摘要,請點連結閱讀原文)",
      source: feed.name,
      date,
      url: pickLink(it),
      tags: feed.tags,
      audience: "一般人"
    };
  }).filter((it) => it.title && it.url);
}

async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url, {
      headers: { "user-agent": "Mozilla/5.0 (AI-Learning-Hub news fetcher)" },
      signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items = parseFeed(await res.text(), feed);
    console.log(`✓ ${feed.name}: ${items.length} 則`);
    return items;
  } catch (err) {
    console.warn(`✗ ${feed.name} 抓取失敗:${err.message}`);
    return [];
  }
}

const results = (await Promise.all(FEEDS.map(fetchFeed))).flat();

if (results.length === 0) {
  console.error("\n所有來源都抓取失敗(可能是網路限制),保留現有 news.data.js 不變。");
  process.exit(1);
}

results.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
const top = results.slice(0, MAX_TOTAL);

const banner =
  "// AI 新聞資料 — 由 scripts/fetch-news.mjs 於 " +
  new Date().toISOString().slice(0, 10) +
  " 自動產生,發布前請人工確認內容\n";
writeFileSync(OUTPUT, banner + "window.NEWS_DATA = " + JSON.stringify(top, null, 2) + ";\n");
console.log(`\n已寫入 ${top.length} 則新聞 → ${OUTPUT}`);
