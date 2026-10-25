import type { Manifest } from '@starlight/shared';
import songsJson from '@starlight/shared/songs.json';
import type { Song } from './core/quiz.ts';

/** songs.json 静态 import（构建期内联，不依赖 loadSongs 运行时形态） */
export const songs = songsJson as Song[];

/** 运行时拉取切片清单（须先 npm run assets 生成 public/assets） */
export async function fetchManifest(): Promise<Manifest> {
  const res = await fetch(`${import.meta.env.BASE_URL}assets/manifest.json`);
  if (!res.ok) throw new Error(`manifest.json 加载失败（${res.status}）——请先在仓库根目录运行 npm run assets`);
  return res.json() as Promise<Manifest>;
}
