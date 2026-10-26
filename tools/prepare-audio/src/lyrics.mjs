/**
 * LRC 解析（纯函数）：`[mm:ss.mmm]日文 (翻译：中文)` 双语行 → 结构化行。
 * - 空时间戳行（纯间奏标记）静默跳过，不计异常
 * - 无法解析的非空行跳过并计入 skipped（调用方决定告警阈值）
 * - 翻译后缀剥离：兼容半角 `(翻译：…)` 与全角 `（翻译：…）`
 */

const TS_RE = /^\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\](.*)$/;

/** 剥离翻译后缀：返回 { text, translation? } */
export function splitTranslation(line) {
  const half = line.indexOf('(翻译：');
  const full = line.indexOf('（翻译：');
  let idx = -1;
  let closer = '';
  if (half >= 0 && (full < 0 || half < full)) { idx = half; closer = ')'; }
  else if (full >= 0) { idx = full; closer = '）'; }
  if (idx < 0) return { text: line };
  const text = line.slice(0, idx).trim();
  let inner = line.slice(idx + 4); // 跳过「(翻译：」/「（翻译：」均为 4 字符
  const end = inner.lastIndexOf(closer);
  if (end >= 0) inner = inner.slice(0, end);
  return { text, translation: inner.trim() };
}

/** 时间戳 → 毫秒；frac 支持 1-3 位（补零到毫秒精度） */
export function timestampToMs(mm, ss, frac) {
  const ms = frac ? Number(frac.padEnd(3, '0')) : 0;
  return Number(mm) * 60_000 + Number(ss) * 1000 + ms;
}

/**
 * 解析整份 lrc 内容。
 * @returns {{ lines: Array<{timeMs:number, text:string, translation?:string}>, skipped: number }}
 */
export function parseLrc(content) {
  const out = { lines: [], skipped: 0 };
  for (const raw of String(content).split(/\r?\n/)) {
    const trimmed = raw.trim();
    if (trimmed === '') continue;
    const m = TS_RE.exec(trimmed);
    if (!m) { out.skipped++; continue; }
    const [, mm, ss, frac, rest] = m;
    if (Number(ss) >= 60) { out.skipped++; continue; }
    const body = rest.trim();
    if (body === '') continue; // 空时间戳行：间奏标记，静默跳过
    const { text, translation } = splitTranslation(body);
    if (text === '') { out.skipped++; continue; }
    if (/^(?:翻译|翻譯|作词|作詞|作曲|编曲|編曲)\s*[：:]/.test(text)) continue;
    out.lines.push({ timeMs: timestampToMs(mm, ss, frac), text, ...(translation ? { translation } : {}) });
  }
  return out;
}

/** 有效行阈值（assets 阶段单歌低于此值报错） */
export const MIN_VALID_LINES = 8;
