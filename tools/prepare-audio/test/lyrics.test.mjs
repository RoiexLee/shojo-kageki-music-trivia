import { describe, it, expect } from 'vitest';
import { parseLrc, splitTranslation, timestampToMs, MIN_VALID_LINES } from '../src/lyrics.mjs';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const musicDir = path.join(ROOT, 'music');

describe('splitTranslation', () => {
  it('半角括号剥离', () => {
    expect(splitTranslation('齿轮 (翻译：开始转动)')).toEqual({ text: '齿轮', translation: '开始转动' });
  });
  it('全角括号剥离', () => {
    expect(splitTranslation('歯車（翻译：齿轮）')).toEqual({ text: '歯車', translation: '齿轮' });
  });
  it('行尾直接括号中文翻译剥离（含嵌套括号）', () => {
    expect(splitTranslation('ドレープカーテンの裏側(幕布背后)')).toEqual({
      text: 'ドレープカーテンの裏側',
      translation: '幕布背后',
    });
    expect(splitTranslation('あの日の自分に (そうと) 教えてあげたい(真想对那日的自己 (说没错) 把这些告诉其)')).toEqual({
      text: 'あの日の自分に (そうと) 教えてあげたい',
      translation: '真想对那日的自己 (说没错) 把这些告诉其',
    });
  });
  it('无翻译原样返回', () => {
    expect(splitTranslation('Star Divine')).toEqual({ text: 'Star Divine' });
  });
});

describe('timestampToMs', () => {
  it('三位毫秒', () => expect(timestampToMs('01', '02', '280')).toBe(62_280));
  it('两位毫秒补零（.28 → 280ms）', () => expect(timestampToMs('0', '10', '28')).toBe(10_280));
  it('无毫秒段', () => expect(timestampToMs('2', '05')).toBe(125_000));
});

describe('parseLrc', () => {
  it('非法秒数不接受，超短行保留供抽题阶段过滤', () => {
    const r = parseLrc('[00:60.000]无效秒数\n[00:03.000]ハイ');
    expect(r.skipped).toBe(1);
    expect(r.lines).toEqual([{ timeMs: 3000, text: 'ハイ' }]);
  });
  it('双语行解析 + 时间戳', () => {
    const r = parseLrc('[00:14.000]躊躇う暇はない (翻译：无暇踌躇)\r\n');
    expect(r.lines).toEqual([{ timeMs: 14_000, text: '躊躇う暇はない', translation: '无暇踌躇' }]);
    expect(r.skipped).toBe(0);
  });
  it('空时间戳行静默跳过（不计异常）', () => {
    const r = parseLrc('[00:09.280]\n[00:14.000]歌詞\n');
    expect(r.lines).toHaveLength(1);
    expect(r.skipped).toBe(0);
  });
  it('无法解析的非空行计入 skipped', () => {
    const r = parseLrc('这行没有时间戳\n[00:01.000]正常行\n');
    expect(r.skipped).toBe(1);
    expect(r.lines).toHaveLength(1);
  });
  it('只有翻译没有原文的行计入 skipped', () => {
    const r = parseLrc('[00:01.000](翻译：只有翻译)\n');
    expect(r.skipped).toBe(1);
  });

  it.skipIf(!existsSync(musicDir))('对 music/ 全部真实 lrc 解析成功且达到有效行阈值（只读）', () => {
    const folders = readdirSync(musicDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== '_tmp')
      .map((d) => d.name);
    expect(folders.length).toBeGreaterThanOrEqual(10);
    for (const folder of folders) {
      const content = readFileSync(path.join(musicDir, folder, `${folder}.lrc`), 'utf-8');
      const r = parseLrc(content);
      expect(r.lines.length, `${folder} 有效行应 ≥ ${MIN_VALID_LINES}`).toBeGreaterThanOrEqual(MIN_VALID_LINES);
      for (const line of r.lines) {
        expect(line.text.length).toBeGreaterThan(0);
        expect(line.text).not.toMatch(/翻译：/);
      }
    }
  });
});
