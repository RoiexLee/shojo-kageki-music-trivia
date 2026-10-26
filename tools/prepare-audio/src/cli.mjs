#!/usr/bin/env node
/**
 * prepare-audio：由 music/ 生成猜歌游戏所需音频切片与 manifest。
 * 用法：
 *   npm run assets                     全量生成（幂等）
 *   npm run assets -- --only <id>      只处理指定歌曲
 *   npm run assets -- --force          忽略幂等，全量重建
 *   npm run assets -- --verify         只读校验 manifest 与产物（不转码）
 */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const MUSIC_DIR = path.join(ROOT, 'music');
const ASSETS_DIR = path.join(ROOT, 'apps', 'web', 'public', 'assets');
const SONGS_JSON = path.join(ROOT, 'packages', 'shared', 'src', 'songs.json');
const MANIFEST_PATH = path.join(ASSETS_DIR, 'manifest.json');

import { SEGMENT_SPECS, chorusStartOf, requiredSourceDurationSec, deriveStartSec } from './util.mjs';
import { segmentToArgs, buildCoverArgs, paramsEqual, alignSongs } from './ffmpeg.mjs';
import { parseLrc, MIN_VALID_LINES } from './lyrics.mjs';
import { run, probeDurationSec } from './proc.mjs';

function parseArgs(argv) {
  const opts = { only: null, force: false, verify: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--only') opts.only = argv[++i];
    else if (argv[i] === '--force') opts.force = true;
    else if (argv[i] === '--verify') opts.verify = true;
    else { console.error(`未知参数: ${argv[i]}`); process.exit(1); }
  }
  return opts;
}

async function scanMusicFolders() {
  const entries = await fs.readdir(MUSIC_DIR, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory() && e.name !== '_tmp').map((e) => e.name);
}

/**
 * 读取 songs.json 并做最小运行时校验（重复 id/folder、slug 格式）。
 * 完整 schema 校验由 packages/shared 的 parseSongs + 其测试承担（Web/Vitest 侧）；
 * 此处不 import @starlight/shared —— Node 运行时对 node_modules 内的 .ts
 * 不做类型剥离，直接读 JSON 保证零依赖可执行。
 */
async function loadSongs() {
  const raw = JSON.parse(await fs.readFile(SONGS_JSON, 'utf-8'));
  if (!Array.isArray(raw) || raw.length === 0) throw new Error('songs.json 必须是非空数组');
  const ids = new Set();
  const folders = new Set();
  for (const s of raw) {
    if (typeof s?.id !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.id)) {
      throw new Error(`songs.json 存在非法 id: ${JSON.stringify(s?.id)}`);
    }
    if (typeof s?.folder !== 'string' || s.folder.length === 0) {
      throw new Error(`songs.json 存在非法 folder: ${JSON.stringify(s?.folder)}`);
    }
    if (ids.has(s.id)) throw new Error(`songs.json id 重复: ${s.id}`);
    if (folders.has(s.folder)) throw new Error(`songs.json folder 重复: ${s.folder}`);
    ids.add(s.id);
    folders.add(s.folder);
  }
  return raw;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const songs = await loadSongs();

  if (opts.only && !songs.some((s) => s.id === opts.only)) {
    console.error(`[错误] --only ${opts.only}：songs.json 中不存在该 id。可用：${songs.map((s) => s.id).join(', ')}`);
    process.exit(1);
  }

  const musicFolders = await scanMusicFolders();
  const alignment = alignSongs(songs, musicFolders);
  if (!alignment.ok) {
    if (alignment.missing.length) console.error(`[错误] songs.json 声明了 music/ 中不存在的文件夹:\n  - ${alignment.missing.join('\n  - ')}`);
    if (alignment.extra.length) console.error(`[错误] music/ 中存在 songs.json 未收录的文件夹:\n  - ${alignment.extra.join('\n  - ')}`);
    process.exit(1);
  }

  const targets = opts.only ? songs.filter((s) => s.id === opts.only) : songs;
  const prevManifest = existsSync(MANIFEST_PATH)
    ? JSON.parse(await fs.readFile(MANIFEST_PATH, 'utf-8'))
    : null;
  const prevEntries = new Map((prevManifest?.entries ?? []).map((e) => [e.id, e]));

  if (opts.verify) return verify(prevManifest, songs);

  // 前置校验：源时长 + lrc 有效行数
  const tooShort = [];
  for (const song of targets) {
    const src = path.join(MUSIC_DIR, song.folder, `${song.folder}.mp3`);
    const dur = await probeDurationSec(src);
    const need = requiredSourceDurationSec(chorusStartOf(song));
    if (dur === null) tooShort.push(`${song.folder}: 无法探测时长`);
    else if (dur < need) tooShort.push(`${song.folder}: 总时长 ${dur.toFixed(1)}s < 副歌起点+15s（${need}s）`);
    const lrc = parseLrc(await fs.readFile(path.join(MUSIC_DIR, song.folder, `${song.folder}.lrc`), 'utf-8'));
    if (lrc.skipped > 0) console.warn(`[警告] ${song.folder}: lrc 有 ${lrc.skipped} 行无法解析（已跳过）`);
    if (lrc.lines.length < MIN_VALID_LINES) tooShort.push(`${song.folder}: lrc 有效行 ${lrc.lines.length} < ${MIN_VALID_LINES}，歌词模式不可用`);
  }
  if (tooShort.length) {
    console.error(`[错误] 以下歌曲源素材未通过校验:\n  - ${tooShort.join('\n  - ')}`);
    process.exit(1);
  }

  const stats = { skipped: 0, built: 0 };
  const entries = [];
  for (const song of songs) {
    const prev = prevEntries.get(song.id) ?? null;
    const isTarget = targets.includes(song);
    // 非目标歌曲：沿用上次 manifest 条目（若无记录则仍需处理，保证 manifest 完整）
    if (!isTarget && prev) { entries.push(prev); continue; }
    entries.push(await processSong(song, prev, opts, stats));
  }

  const manifest = { version: 1, generatedAt: new Date().toISOString(), entries };
  await fs.mkdir(ASSETS_DIR, { recursive: true });
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
  console.log(`完成：新建 ${stats.built} 个文件，跳过 ${stats.skipped} 个（幂等命中）。manifest → ${path.relative(ROOT, MANIFEST_PATH)}`);
}

async function processSong(song, prev, opts, stats) {
  const chorusStart = chorusStartOf(song);
  const lrc = await fs.readFile(path.join(MUSIC_DIR, song.folder, `${song.folder}.lrc`), 'utf-8');
  const lyricsHash = createHash('sha256').update(lrc).digest('hex');
  const { lines } = parseLrc(lrc);
  if (lines.length < MIN_VALID_LINES) throw new Error(`${song.id}: 歌词有效行不足 ${MIN_VALID_LINES}`);
  const params = { chorusStartSec: chorusStart, bitrate: '128k', lyricsHash, generatedAt: new Date().toISOString() };
  const prevParamsOk = prev !== null && paramsEqual(prev.params, params);
  const segments = {};

  for (const spec of SEGMENT_SPECS) {
    const rel = `audio/${song.id}/${spec.key}.mp3`;
    const abs = path.join(ASSETS_DIR, rel);
    const upToDate = !opts.force && prevParamsOk && prev.segments[spec.key]?.path === rel && existsSync(abs);
    if (upToDate && prev.segments[spec.key]) {
      segments[spec.key] = prev.segments[spec.key];
      stats.skipped++;
      continue;
    }
    await fs.mkdir(path.dirname(abs), { recursive: true });
    const src = path.join(MUSIC_DIR, song.folder, `${song.folder}.mp3`);
    await run('ffmpeg', segmentToArgs({ spec, src, out: abs, chorusStartSec: chorusStart }));
    const dur = await probeDurationSec(abs);
    segments[spec.key] = { path: rel, durationSec: dur ?? spec.durationSec };
    stats.built++;
    console.log(`  [${song.id}] ${spec.key} ✓`);
  }

  const coverRel = `covers/${song.id}.jpg`;
  const coverAbs = path.join(ASSETS_DIR, coverRel);
  let coverPath = coverRel;
  const coverUpToDate = !opts.force && prevParamsOk && prev?.coverPath === coverRel && existsSync(coverAbs);
  if (coverUpToDate) {
    stats.skipped++;
  } else {
    await fs.mkdir(path.dirname(coverAbs), { recursive: true });
    const src = path.join(MUSIC_DIR, song.folder, `${song.folder}.jpg`);
    await run('ffmpeg', buildCoverArgs({ src, out: coverAbs }));
    stats.built++;
    console.log(`  [${song.id}] cover ✓`);
  }

  const lyricsAbs = path.join(ASSETS_DIR, 'lyrics', `${song.id}.json`);
  const lyricsData = { id: song.id, lineCount: lines.length, sourceHash: lyricsHash, lines };
  let lyricsUpToDate = false;
  if (!opts.force && prev?.params.lyricsHash === lyricsHash && existsSync(lyricsAbs)) {
    try { lyricsUpToDate = JSON.stringify(JSON.parse(await fs.readFile(lyricsAbs, 'utf-8'))) === JSON.stringify(lyricsData); }
    catch { /* 损坏产物会由源歌词重建。 */ }
  }
  if (lyricsUpToDate) stats.skipped++;
  else {
    await fs.mkdir(path.dirname(lyricsAbs), { recursive: true });
    await fs.writeFile(lyricsAbs, JSON.stringify(lyricsData, null, 2) + '\n', 'utf-8');
    stats.built++;
    console.log(`  [${song.id}] lyrics (${lines.length} 行) ✓`);
  }

  return { id: song.id, folder: song.folder, title: song.title, segments, coverPath, params };
}

async function verify(manifest, songs) {
  const problems = [];
  if (!manifest) {
    console.error('[错误] manifest.json 不存在，请先运行 npm run assets');
    process.exit(1);
  }
  for (const song of songs) {
    const entry = manifest.entries.find((e) => e.id === song.id);
    if (!entry) { problems.push(`${song.id}: manifest 缺少条目`); continue; }
    for (const spec of SEGMENT_SPECS) {
      const seg = entry.segments[spec.key];
      if (!seg) { problems.push(`${song.id}/${spec.key}: manifest 缺少片段`); continue; }
      const abs = path.join(ASSETS_DIR, seg.path);
      if (!existsSync(abs)) { problems.push(`${song.id}/${spec.key}: 文件不存在 ${seg.path}`); continue; }
      const actual = await probeDurationSec(abs);
      if (actual === null || Math.abs(actual - seg.durationSec) > 0.5) {
        problems.push(`${song.id}/${spec.key}: 时长不符 manifest=${seg.durationSec}s 实测=${actual ?? '探测失败'}s`);
      }
      if (Math.abs((seg.durationSec ?? 0) - spec.durationSec) > 0.5) {
        problems.push(`${song.id}/${spec.key}: manifest 时长 ${seg.durationSec}s 与规格 ${spec.durationSec}s 不符`);
      }
    }
    const coverAbs = path.join(ASSETS_DIR, entry.coverPath);
    if (!existsSync(coverAbs)) problems.push(`${song.id}: 封面不存在 ${entry.coverPath}`);
    try {
      const content = await fs.readFile(path.join(MUSIC_DIR, song.folder, `${song.folder}.lrc`), 'utf-8');
      const hash = createHash('sha256').update(content).digest('hex');
      const expected = parseLrc(content).lines;
      const lyrics = JSON.parse(await fs.readFile(path.join(ASSETS_DIR, 'lyrics', `${song.id}.json`), 'utf-8'));
      if (lyrics.id !== song.id || lyrics.sourceHash !== hash || entry.params.lyricsHash !== hash
        || lyrics.lineCount !== expected.length || expected.length < MIN_VALID_LINES
        || JSON.stringify(lyrics.lines) !== JSON.stringify(expected)) {
        problems.push(`${song.id}: 歌词内容、行数或源文件指纹不一致，请重新生成`);
      }
    } catch (err) {
      problems.push(`${song.id}: 歌词校验失败（${err.message}）`);
    }
  }
  if (problems.length) {
    console.error(`校验失败（${problems.length} 处）:\n  - ${problems.join('\n  - ')}`);
    process.exit(1);
  }
  console.log(`校验通过：${songs.length} 首歌 × ${SEGMENT_SPECS.length} 片段 + 封面 + 歌词，路径、时长（±0.5s）、歌词内容与源文件指纹全部一致。`);
}

main().catch((err) => { console.error(err.message ?? err); process.exit(1); });
