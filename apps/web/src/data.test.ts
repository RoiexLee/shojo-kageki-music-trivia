import { describe, expect, it } from 'vitest';
import { assetUrl, parseLyrics, parseManifest, songs } from './data.ts';

function manifest() {
  return {
    version: 1,
    generatedAt: '2026-10-26T00:00:00Z',
    entries: songs.map((song) => ({
      id: song.id, folder: song.title, title: song.title, coverPath: `covers/${song.id}.jpg`,
      params: { chorusStartSec: 72, bitrate: '128k', generatedAt: '2026-10-26T00:00:00Z' },
      segments: Object.fromEntries(['intro-5', 'intro-10', 'intro-15', 'clip-5', 'clip-10', 'clip-15', 'chorus-10', 'reverse-8'].map((key) => [key, {
        path: `audio/${song.id}/${key}.mp3`, durationSec: Number(key.split('-')[1]),
      }])),
    })),
  };
}

function lyrics() {
  return { id: 'star-divine', lineCount: 8, lines: Array.from({ length: 8 }, (_, i) => ({ timeMs: i * 1000, text: `可用歌词第 ${i} 行`, translation: '译文' })) };
}

describe('资源信任边界', () => {
  it('有效清单和歌词可消费，URL 包含 assets 根', () => {
    const value = manifest();
    expect(parseManifest(value)).toBe(value);
    expect(parseLyrics(lyrics(), 'star-divine').lines).toHaveLength(8);
    expect(assetUrl('covers/star-divine.jpg')).toBe('/assets/covers/star-divine.jpg');
  });

  it('拒绝外部或越级资源路径，以及缺少的音频片段', () => {
    const badAudio = manifest();
    badAudio.entries[0].segments['intro-5'].path = 'https://example.com/music.mp3';
    expect(() => parseManifest(badAudio)).toThrow('缺少有效音频片段');
    const badCover = manifest();
    badCover.entries[0].coverPath = '../secret.jpg';
    expect(() => parseManifest(badCover)).toThrow('路径不正确');
    const missing = manifest();
    delete missing.entries[0].segments['reverse-8'];
    expect(() => parseManifest(missing)).toThrow('缺少有效音频片段');
  });

  it('拒绝缺歌、重复歌曲和无效时长', () => {
    const missing = manifest();
    missing.entries.pop();
    expect(() => parseManifest(missing)).toThrow('不完整');
    const duplicate = manifest();
    duplicate.entries.push(duplicate.entries[0]);
    expect(() => parseManifest(duplicate)).toThrow('重复');
    const invalid = manifest();
    invalid.entries[0].segments['intro-5'].durationSec = Number.NaN;
    expect(() => parseManifest(invalid)).toThrow('缺少有效音频片段');
  });

  it('拒绝错误歌词 id、行数、时间与文本结构', () => {
    const valid = lyrics();
    expect(() => parseLyrics(valid, 'wrong-id')).toThrow('格式不正确');
    expect(() => parseLyrics({ ...valid, lineCount: 9 }, valid.id)).toThrow('格式不正确');
    expect(() => parseLyrics({ ...valid, lineCount: 7, lines: valid.lines.slice(0, 7) }, valid.id)).toThrow('格式不正确');
    for (const badLine of [{ text: '' }, { timeMs: -1 }, { timeMs: Infinity }, { translation: 3 }]) {
      const value = { ...valid, lines: [{ ...valid.lines[0], ...badLine }, ...valid.lines.slice(1)] };
      expect(() => parseLyrics(value, valid.id)).toThrow('格式不正确');
    }
  });
});
