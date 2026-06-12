#!/usr/bin/env node
/**
 * fetch-tutorials.mjs — 從指定 YouTube 頻道的官方 RSS 撈最新影片,
 * 寫入 data/inbox.data.js 作為「待審清單」。
 * 不需 API key、不爬網頁內容,只用 YouTube 官方提供的 RSS feed。
 *
 *   node scripts/fetch-tutorials.mjs
 *
 * 之後到網站的「📥 待審」分頁人工審核,挑選要收進教學庫的影片。
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, "..", "data", "inbox.data.js");
const TUTORIALS = join(__dirname, "..", "data", "tutorials.data.js");
const MAX_PER_CHANNEL = 8;
const MAX_TOTAL = 48;

// 追蹤的頻道:有 id 直接用;只有 handle 的會自動解析成 channel id
const CHANNELS = [
  { handle: "garytalksstuff" },
  { handle: "programmer-wang" },
  { id: "UCbIeBdHsfTpHsICZy59ZzhA" },
  { handle: "lichangzhanglaile" },
  { handle: "teacher_kong" },
  { handle: "tiktokethan" }
];

const UA = { "user-agent": "Mozilla/5.0 (AI-Learning-Hub tutorials fetcher)" };

async function resolveChannelId(handle) {
  const res = await fetch(`https://www.youtube.com/@${handle}`, {
    headers: UA, signal: AbortSignal.timeout(15000)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const m =
    html.match(/rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/) ||
    html.match(/"channelId":"(UC[\w-]{22})"/);
  if (!m) throw new Error("頁面中找不到 channelId");
  return m[1];
}

function pick(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim() : "";
}

function decode(s) {
  return s
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

function parseChannelFeed(xml) {
  const channelName = decode(pick(xml.split("<entry>")[0], "title"));
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
  return entries.slice(0, MAX_PER_CHANNEL).map((e) => {
    const videoId = pick(e, "yt:videoId");
    const thumb = (e.match(/<media:thumbnail url="([^"]+)"/) || [])[1] || "";
    const views = (e.match(/<media:statistics views="(\d+)"/) || [])[1];
    return {
      id: "yt-" + videoId,
      title: decode(pick(e, "title")),
      summary: decode(pick(e, "media:description")).slice(0, 160) || "(無說明)",
      channel: channelName,
      date: (pick(e, "published") || "").slice(0, 10),
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: thumb,
      views: views ? Number(views) : null
    };
  }).filter((v) => v.title && v.id !== "yt-");
}

async function fetchChannel(ch) {
  try {
    const id = ch.id || (await resolveChannelId(ch.handle));
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`, {
      headers: UA, signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items = parseChannelFeed(await res.text());
    console.log(`✓ ${ch.handle || ch.id}(${items[0]?.channel || "?"}):${items.length} 部`);
    return items;
  } catch (err) {
    console.warn(`✗ ${ch.handle || ch.id} 失敗:${err.message}`);
    return [];
  }
}

// 已收錄過的影片不再進待審清單
const existingUrls = new Set();
if (existsSync(TUTORIALS)) {
  for (const m of readFileSync(TUTORIALS, "utf8").matchAll(/url:\s*"([^"]+)"/g)) existingUrls.add(m[1]);
}

const results = (await Promise.all(CHANNELS.map(fetchChannel))).flat()
  .filter((v) => !existingUrls.has(v.url));

if (results.length === 0) {
  console.error("\n沒有撈到任何影片(可能是網路限制),保留現有 inbox.data.js 不變。");
  process.exit(1);
}

results.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
const top = results.slice(0, MAX_TOTAL);

const banner =
  "// YouTube 教學待審清單 — 由 scripts/fetch-tutorials.mjs 於 " +
  new Date().toISOString().slice(0, 10) +
  " 自動產生。到網站「📥 待審」分頁人工審核後收錄。\n";
writeFileSync(OUTPUT, banner + "window.INBOX_DATA = " + JSON.stringify(top, null, 2) + ";\n");
console.log(`\n已寫入 ${top.length} 部候選影片 → ${OUTPUT}`);
