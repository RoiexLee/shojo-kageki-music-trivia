import { SEGMENT_SPECS, deriveStartSec } from './util.mjs';

/**
 * 纯函数：构造 ffmpeg 参数数组（不执行）。
 * 统一 loudnorm 单 pass + 显式 -ar 44100（避免 loudnorm 内部 192kHz 重采样传导到编码器）。
 * -ss 放在 -i 之前（输入端快速定位，重编码场景下精度足够）。
 */
export function buildSliceArgs({ src, out, startSec, durationSec }) {
  return [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-ss', String(startSec),
    '-t', String(durationSec),
    '-i', src,
    '-af', 'loudnorm',
    '-ar', '44100',
    '-codec:a', 'libmp3lame',
    '-b:a', '128k',
    out,
  ];
}

/** 倒放片段：副歌段切片 + areverse + loudnorm */
export function buildReverseArgs({ src, out, startSec, durationSec }) {
  return [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-ss', String(startSec),
    '-t', String(durationSec),
    '-i', src,
    '-af', 'areverse,loudnorm',
    '-ar', '44100',
    '-codec:a', 'libmp3lame',
    '-b:a', '128k',
    out,
  ];
}

/** 封面压缩：最长边 ≤512（不放大小图），JPEG 质量≈80（-q:v 3） */
export function buildCoverArgs({ src, out, maxSize = 512 }) {
  const vf = `scale='min(${maxSize}\\,iw)':-2`;
  return [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-i', src,
    '-vf', vf,
    '-q:v', '3',
    out,
  ];
}

/** 由段落规格得到切片参数（供 cli 组装，便于单测） */
export function segmentToArgs({ spec, src, out, chorusStartSec }) {
  const startSec = deriveStartSec(spec, chorusStartSec);
  const base = { src, out, startSec, durationSec: spec.durationSec };
  if (spec.kind === 'reverse') return buildReverseArgs(base);
  return buildSliceArgs(base);
}

/** 纯函数：幂等比对 —— 排除 generatedAt，仅比对确定性参数 */
export function paramsEqual(a, b) {
  if (!a || !b) return false;
  return a.chorusStartSec === b.chorusStartSec && a.bitrate === b.bitrate;
}

/** 纯函数：songs(folder 对齐键) 与 music/ 实际文件夹的对齐结果 */
export function alignSongs(songs, musicFolders) {
  const songFolders = songs.map((s) => s.folder);
  const missing = songFolders.filter((f) => !musicFolders.includes(f));
  const extra = musicFolders.filter((f) => !songFolders.includes(f));
  return { ok: missing.length === 0 && extra.length === 0, missing, extra };
}

export { SEGMENT_SPECS };
