#!/usr/bin/env node
/**
 * transcribe.mjs — 把 YouTube 影片變成逐字稿(全程免費、本機執行)。
 *
 *   node scripts/transcribe.mjs <影片網址> [--model small] [--lang zh]
 *
 * 流程:
 *   1. 先試抓 YouTube 現成字幕(含自動字幕)— 有就直接用,最快
 *   2. 沒有字幕 → yt-dlp 下載音訊 → Whisper 本機語音辨識
 *   3. 逐字稿存到 articles/transcripts/<影片id>.txt
 *      → 之後用 Claude Code 執行 /analyze-video 做深度分析
 *
 * 前置安裝(一次性):
 *   pip install yt-dlp
 *   pip install whisper-ctranslate2   # faster-whisper,速度快(推薦)
 *   #(或 pip install openai-whisper,需另裝 ffmpeg)
 *
 * 模型建議:small(中文準確度夠、CPU 可跑)/ medium(更準但慢)。
 * 第一次執行會自動下載模型(small 約 460MB),之後離線可用。
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "articles", "transcripts");

const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith("--"));
const model = args.includes("--model") ? args[args.indexOf("--model") + 1] : "small";
const lang = args.includes("--lang") ? args[args.indexOf("--lang") + 1] : null;

if (!url) {
  console.error("用法:node scripts/transcribe.mjs <YouTube 網址> [--model small|medium] [--lang zh|en]");
  process.exit(1);
}

function has(cmd) {
  return spawnSync(process.platform === "win32" ? "where" : "which", [cmd], { stdio: "ignore" }).status === 0;
}

function run(cmd, argv, opts = {}) {
  const r = spawnSync(cmd, argv, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"], ...opts });
  if (r.status !== 0) throw new Error(`${cmd} 執行失敗(exit ${r.status})`);
  return r.stdout || "";
}

if (!has("yt-dlp")) {
  console.error("找不到 yt-dlp。請先安裝:pip install yt-dlp");
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });
const work = join(tmpdir(), "aihub-transcribe");
rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });

// 取得影片資訊
const info = run("yt-dlp", ["--print", "%(id)s\t%(title)s\t%(channel)s\t%(upload_date)s", "--skip-download", url]).trim();
const [vid, title, channel, uploadDate] = info.split("\t");
const outFile = join(OUT_DIR, `${vid}.txt`);
console.log(`🎬 ${title}(${channel})`);

function header() {
  const d = uploadDate ? `${uploadDate.slice(0, 4)}-${uploadDate.slice(4, 6)}-${uploadDate.slice(6, 8)}` : "";
  return `標題:${title}\n頻道:${channel}\n發布:${d}\n網址:https://www.youtube.com/watch?v=${vid}\n\n--- 逐字稿 ---\n\n`;
}

function cleanVtt(vtt) {
  const lines = vtt.split("\n");
  const out = [];
  for (const raw of lines) {
    const line = raw.replace(/<[^>]+>/g, "").trim();
    if (!line || line === "WEBVTT" || /-->/.test(line)) continue;
    if (/^(Kind|Language|NOTE|STYLE|::cue)/.test(line)) continue;
    if (out[out.length - 1] !== line) out.push(line); // 自動字幕會重複行
  }
  return out.join("\n");
}

// ── 第 1 步:先試現成字幕 ─────────────────────────────
console.log("① 檢查 YouTube 現成字幕…");
spawnSync("yt-dlp", [
  "--skip-download", "--write-subs", "--write-auto-subs",
  "--sub-langs", "zh-TW,zh-Hant,zh-Hans,zh,en",
  "--sub-format", "vtt", "-o", join(work, "sub"), url
], { stdio: "ignore" });

const vttFiles = readdirSync(work).filter((f) => f.endsWith(".vtt"));
if (vttFiles.length > 0) {
  // 優先繁中 → 任何中文 → 英文
  const pickOrder = ["zh-TW", "zh-Hant", "zh-Hans", ".zh.", "en"];
  const picked = pickOrder.map((k) => vttFiles.find((f) => f.includes(k))).find(Boolean) || vttFiles[0];
  const text = cleanVtt(readFileSync(join(work, picked), "utf8"));
  if (text.length > 100) {
    writeFileSync(outFile, header() + text + "\n");
    console.log(`✅ 使用現成字幕(${picked.replace("sub.", "")})`);
    console.log(`📄 逐字稿:${outFile}`);
    console.log(`\n下一步:在 Claude Code 執行 /analyze-video ${outFile}`);
    process.exit(0);
  }
}

// ── 第 2 步:下載音訊 + Whisper 辨識 ──────────────────
const whisperCmd = has("whisper-ctranslate2") ? "whisper-ctranslate2" : has("whisper") ? "whisper" : null;
if (!whisperCmd) {
  console.error("② 沒有現成字幕,需要 Whisper 做語音辨識,但尚未安裝。");
  console.error("   請執行:pip install whisper-ctranslate2(或 pip install openai-whisper + 安裝 ffmpeg)");
  process.exit(1);
}

console.log("② 沒有現成字幕,下載音訊中…");
run("yt-dlp", ["-x", "--audio-format", "m4a", "-o", join(work, "audio.%(ext)s"), url], { stdio: "inherit" });
const audio = join(work, readdirSync(work).find((f) => f.startsWith("audio.")));

console.log(`③ Whisper 語音辨識中(model=${model},第一次會下載模型,CPU 跑 small 約為影片長度的 0.5-2 倍時間)…`);
const wArgs = [audio, "--model", model, "--output_format", "txt", "--output_dir", work];
if (lang) wArgs.push("--language", lang);
spawnSync(whisperCmd, wArgs, { stdio: "inherit" });

const txt = readdirSync(work).find((f) => f.endsWith(".txt"));
if (!txt) {
  console.error("Whisper 沒有產出逐字稿,請檢查上方錯誤訊息。");
  process.exit(1);
}
writeFileSync(outFile, header() + readFileSync(join(work, txt), "utf8"));
rmSync(work, { recursive: true, force: true });
console.log(`✅ 辨識完成`);
console.log(`📄 逐字稿:${outFile}`);
console.log(`\n下一步:在 Claude Code 執行 /analyze-video ${outFile}`);
