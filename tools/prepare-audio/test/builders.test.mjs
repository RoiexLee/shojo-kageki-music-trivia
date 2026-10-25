import { describe, it, expect } from 'vitest';
import {
  buildSliceArgs,
  buildReverseArgs,
  buildCoverArgs,
  segmentToArgs,
  paramsEqual,
  alignSongs,
} from '../src/ffmpeg.mjs';
import { SEGMENT_SPECS, deriveStartSec, chorusStartOf, requiredSourceDurationSec } from '../src/util.mjs';

describe('ffmpeg 参数构造（纯函数）', () => {
  it('切片：-ss 在 -i 前、loudnorm + -ar 44100 + 128k', () => {
    const args = buildSliceArgs({ src: 'in.mp3', out: 'out.mp3', startSec: 15, durationSec: 10 });
    const i = args.indexOf('-i');
    expect(args.indexOf('-ss')).toBeLessThan(i);
    expect(args.indexOf('-t')).toBeLessThan(i);
    expect(args).toContain('loudnorm');
    expect(args[args.indexOf('-ar') + 1]).toBe('44100');
    expect(args).toContain('libmp3lame');
    expect(args[args.indexOf('-b:a') + 1]).toBe('128k');
    expect(args.at(-1)).toBe('out.mp3');
  });

  it('倒放：areverse 在 loudnorm 前（先倒放再归一响度）', () => {
    const args = buildReverseArgs({ src: 'in.mp3', out: 'out.mp3', startSec: 72, durationSec: 8 });
    expect(args).toContain('areverse,loudnorm');
  });

  it('封面：min 缩放防放大，转义逗号存在', () => {
    const args = buildCoverArgs({ src: 'a.jpg', out: 'b.jpg' });
    expect(args.join(' ')).toContain('scale=\'min(512\\,iw)\':-2');
    expect(args).toContain('-q:v');
  });

  it('segmentToArgs：intro 段从 0 起、chorus/reverse 从副歌起点起', () => {
    const intro = SEGMENT_SPECS.find((s) => s.key === 'intro-10');
    const chorus = SEGMENT_SPECS.find((s) => s.key === 'chorus-10');
    const rev = SEGMENT_SPECS.find((s) => s.key === 'reverse-8');
    const ai = segmentToArgs({ spec: intro, src: 's', out: 'o', chorusStartSec: 80 });
    const ac = segmentToArgs({ spec: chorus, src: 's', out: 'o', chorusStartSec: 80 });
    const ar = segmentToArgs({ spec: rev, src: 's', out: 'o', chorusStartSec: 80 });
    expect(ai[ai.indexOf('-ss') + 1]).toBe('0');
    expect(ac[ac.indexOf('-ss') + 1]).toBe('80');
    expect(ar[ar.indexOf('-ss') + 1]).toBe('80');
    expect(ar).toContain('areverse,loudnorm');
  });
});

describe('util 规格', () => {
  it('五个片段规格齐全', () => {
    expect(SEGMENT_SPECS.map((s) => s.key)).toEqual(['intro-5', 'intro-10', 'intro-15', 'chorus-10', 'reverse-8']);
  });
  it('deriveStartSec：intro=0，其余=副歌起点', () => {
    expect(deriveStartSec({ kind: 'intro' }, 72)).toBe(0);
    expect(deriveStartSec({ kind: 'chorus' }, 72)).toBe(72);
    expect(deriveStartSec({ kind: 'reverse' }, 72)).toBe(72);
  });
  it('chorusStartOf：显式值优先，缺省 72', () => {
    expect(chorusStartOf({ chorusStartSec: 55 })).toBe(55);
    expect(chorusStartOf({})).toBe(72);
  });
  it('requiredSourceDurationSec = 副歌起点 + 10', () => {
    expect(requiredSourceDurationSec(72)).toBe(82);
  });
});

describe('paramsEqual（幂等比对，排除 generatedAt）', () => {
  it('确定性参数一致即相等，generatedAt 不影响', () => {
    const a = { chorusStartSec: 72, bitrate: '128k', generatedAt: '2026-10-26T00:00:00Z' };
    const b = { chorusStartSec: 72, bitrate: '128k', generatedAt: '2099-12-31T00:00:00Z' };
    expect(paramsEqual(a, b)).toBe(true);
  });
  it('chorusStartSec 或 bitrate 不一致则不等', () => {
    const a = { chorusStartSec: 72, bitrate: '128k', generatedAt: '' };
    expect(paramsEqual(a, { ...a, chorusStartSec: 60 })).toBe(false);
    expect(paramsEqual(a, { ...a, bitrate: '192k' })).toBe(false);
  });
  it('任一为空对象/null 不等', () => {
    expect(paramsEqual(null, { chorusStartSec: 72, bitrate: '128k' })).toBe(false);
  });
});

describe('alignSongs（folder 对齐）', () => {
  const songs = [{ folder: 'Star Divine' }, { folder: '星のダイアローグ' }];
  it('完全对齐', () => {
    expect(alignSongs(songs, ['Star Divine', '星のダイアローグ'])).toEqual({ ok: true, missing: [], extra: [] });
  });
  it('报告缺失与多余（逐字符精确匹配，不做归一化）', () => {
    const r = alignSongs(songs, ['Star Divine', '星のダイアローグ ', 'Extra']);
    expect(r.ok).toBe(false);
    // 尾随空格的文件夹不匹配原条目 → 原条目缺失、带空格文件夹多余
    expect(r.missing).toEqual(['星のダイアローグ']);
    expect(r.extra).toEqual(['星のダイアローグ ', 'Extra']);
  });
  it('songs 声明了不存在的文件夹 → missing', () => {
    const r = alignSongs([{ folder: 'X' }], []);
    expect(r.missing).toEqual(['X']);
    expect(r.ok).toBe(false);
  });
});
