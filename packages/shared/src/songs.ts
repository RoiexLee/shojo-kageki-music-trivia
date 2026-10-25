import type { SongMeta } from './types.ts';

/**
 * 手写校验（不引 zod）：校验 songs.json 的结构。
 * 抛出 Error 时附带全部问题条目，便于一次修复。
 */

const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function checkStringArray(v: unknown, errors: string[], field: string): void {
  if (!Array.isArray(v) || v.some((x) => typeof x !== 'string')) {
    errors.push(`${field} 必须是 string[]`);
  }
}

export function parseSongs(raw: unknown): SongMeta[] {
  if (!Array.isArray(raw)) {
    throw new Error('songs.json 顶层必须是数组');
  }
  const errors: string[] = [];
  const seenIds = new Set<string>();
  const seenFolders = new Set<string>();

  raw.forEach((item, i) => {
    const where = `第 ${i + 1} 条（${isRecord(item) ? String(item['folder'] ?? item['title'] ?? i + 1) : typeof item}）`;
    if (!isRecord(item)) {
      errors.push(`${where}: 不是对象`);
      return;
    }
    for (const field of ['id', 'folder', 'title', 'romaji', 'type', 'origin', 'description']) {
      if (typeof item[field] !== 'string' || (item[field] as string).length === 0) {
        errors.push(`${where}: ${field} 必须是非空 string`);
      }
    }
    checkStringArray(item['aliases'], errors, `${where}: aliases`);
    checkStringArray(item['singers'], errors, `${where}: singers`);
    if (typeof item['chorusStartSec'] !== 'undefined' && typeof item['chorusStartSec'] !== 'number') {
      errors.push(`${where}: chorusStartSec 若存在必须是 number`);
    }
    if (typeof item['id'] === 'string') {
      if (!ID_PATTERN.test(item['id'])) errors.push(`${where}: id "${item['id']}" 不符合罗马字 slug 格式（^[a-z0-9-]+$）`);
      if (seenIds.has(item['id'])) errors.push(`${where}: id "${item['id']}" 重复`);
      seenIds.add(item['id']);
    }
    if (typeof item['folder'] === 'string') {
      if (seenFolders.has(item['folder'])) errors.push(`${where}: folder "${item['folder']}" 重复`);
      seenFolders.add(item['folder']);
    }
  });

  if (errors.length > 0) {
    throw new Error(`songs.json 校验失败（${errors.length} 处）:\n- ${errors.join('\n- ')}`);
  }
  return raw as SongMeta[];
}

// 注：Node 环境读取请直接 JSON.parse(fs.readFileSync(...)) 后调用 parseSongs；
// 本包保持浏览器安全（零 node 依赖），供 apps/web 经 Vite 直接消费。
