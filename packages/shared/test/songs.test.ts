import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseSongs } from '../src/songs.ts';
import songsJson from '../src/songs.json';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const validEntry = {
  id: 'test-song', folder: 'Test Song', title: 'Test Song', romaji: 'Test Song',
  aliases: [], type: 'OP', origin: 'test', singers: [], description: 'test',
};

describe('parseSongs 校验', () => {
  it('songs.json 全部条目通过校验（条目数与 music/ 对账见下）', () => {
    const songs = parseSongs(songsJson);
    expect(songs.length).toBeGreaterThan(0);
    expect(songs.every((s) => s.id && s.folder && s.title)).toBe(true);
  });

  it('id 重复被拒绝', () => {
    expect(() => parseSongs([validEntry, { ...validEntry, folder: 'Another' }])).toThrow(/id "test-song" 重复/);
  });

  it('folder 重复被拒绝', () => {
    expect(() => parseSongs([validEntry, { ...validEntry, id: 'another' }])).toThrow(/folder "Test Song" 重复/);
  });

  it('缺必填字段被拒绝', () => {
    const { title, ...noTitle } = validEntry;
    void title;
    expect(() => parseSongs([noTitle])).toThrow(/title 必须是非空 string/);
  });

  it('id 不符合 slug 格式被拒绝', () => {
    expect(() => parseSongs([{ ...validEntry, id: 'Bad_ID' }])).toThrow(/不符合罗马字 slug 格式/);
  });

  it('aliases/singers 非字符串数组被拒绝', () => {
    expect(() => parseSongs([{ ...validEntry, singers: '九九組' }])).toThrow(/singers 必须是 string\[\]/);
  });
});

describe('songs.json 与 music/ 动态对账', () => {
  it('条目数 === music/ 文件夹数，且 folder 与文件系统逐一对应', () => {
    const songs = parseSongs(songsJson);
    const musicFolders = readdirSync(path.join(ROOT, 'music'), { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== '_tmp')
      .map((d) => d.name);
    expect(songs, '条目数应与 music/ 文件夹数一致（不硬编码数值）').toHaveLength(musicFolders.length);
    const songFolders = songs.map((s) => s.folder);
    for (const f of musicFolders) {
      expect(songFolders, `music/ 文件夹 ${f} 应在 songs.json 中有精确同名 folder`).toContain(f);
    }
    expect(new Set(songFolders).size).toBe(songFolders.length);
  });

  it('每首歌的源文件存在（mp3/lrc/jpg）', () => {
    const songs = parseSongs(songsJson);
    for (const s of songs) {
      for (const ext of ['mp3', 'lrc', 'jpg']) {
        const p = path.join(ROOT, 'music', s.folder, `${s.folder}.${ext}`);
        expect(() => readFileSync(p), `${p} 应存在`).not.toThrow();
      }
    }
  });
});
