/** 段落规格：键 = manifest segments 键；start 取值见 deriveStart */
export const SEGMENT_SPECS = [
  { key: 'intro-5', kind: 'intro', durationSec: 5 },
  { key: 'intro-10', kind: 'intro', durationSec: 10 },
  { key: 'intro-15', kind: 'intro', durationSec: 15 },
  { key: 'chorus-10', kind: 'chorus', durationSec: 10 },
  { key: 'reverse-8', kind: 'reverse', durationSec: 8 },
];

export const DEFAULT_CHORUS_START_SEC = 72;
export const AUDIO_BITRATE = '128k';
export const SAMPLE_RATE = '44100';
export const COVER_MAX_SIZE = 512;

/** 计算某片段的切片起点（秒） */
export function deriveStartSec(spec, chorusStartSec) {
  if (spec.kind === 'intro') return 0;
  return chorusStartSec; // chorus 与 reverse 都从副歌起点取
}

/** 某歌的副歌起点（显式值或默认 72） */
export function chorusStartOf(song) {
  return typeof song.chorusStartSec === 'number' ? song.chorusStartSec : DEFAULT_CHORUS_START_SEC;
}

/** 副歌前置校验所需的最短源时长（副歌起点 + 10s 切片） */
export function requiredSourceDurationSec(chorusStartSec) {
  return chorusStartSec + 10;
}
