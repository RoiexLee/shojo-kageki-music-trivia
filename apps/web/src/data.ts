import type { Manifest } from '@starlight/shared';
import songsJson from '@starlight/shared/songs.json';
import type { LyricsById, LyricsData, Song } from './core/quiz.ts';

export const songs = songsJson as Song[];
export const assetUrl = (path: string) => `${import.meta.env.BASE_URL}assets/${path}`;

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const segmentKeys = ['intro-5', 'intro-10', 'intro-15', 'clip-5', 'clip-10', 'clip-15', 'chorus-10', 'reverse-8'] as const;

export function parseManifest(value: unknown): Manifest {
  if (!isObject(value) || value.version !== 1 || typeof value.generatedAt !== 'string' || !Array.isArray(value.entries)) {
    throw new Error('曲库清单格式不正确，请重新准备资源。');
  }
  const ids = new Set<string>();
  for (const entry of value.entries) {
    if (!isObject(entry) || typeof entry.id !== 'string' || !songs.some((song) => song.id === entry.id)
      || ids.has(entry.id) || typeof entry.folder !== 'string' || typeof entry.title !== 'string'
      || entry.coverPath !== `covers/${entry.id}.jpg` || !isObject(entry.segments) || !isObject(entry.params)) {
      throw new Error('曲库清单条目缺失、重复或路径不正确。');
    }
    ids.add(entry.id);
    for (const key of segmentKeys) {
      const segment = entry.segments[key];
      if (!isObject(segment) || segment.path !== `audio/${entry.id}/${key}.mp3`
        || typeof segment.durationSec !== 'number' || !Number.isFinite(segment.durationSec) || segment.durationSec <= 0) {
        throw new Error(`《${entry.title}》缺少有效音频片段，请重新准备资源。`);
      }
    }
  }
  if (songs.some((song) => !ids.has(song.id))) throw new Error('曲库资源不完整，请重新准备全部歌曲。');
  return value as unknown as Manifest;
}

export function parseLyrics(value: unknown, id: string): LyricsData {
  if (!isObject(value) || value.id !== id || !Array.isArray(value.lines) || value.lines.length < 8
    || value.lineCount !== value.lines.length || value.lines.some((line: unknown) => !isObject(line)
      || typeof line.text !== 'string' || !line.text.trim() || typeof line.timeMs !== 'number'
      || !Number.isFinite(line.timeMs) || line.timeMs < 0
      || (line.translation !== undefined && typeof line.translation !== 'string'))) {
    throw new Error('歌词资源不完整或格式不正确，请重新准备资源。');
  }
  return value as unknown as LyricsData;
}

async function fetchJson(path: string): Promise<unknown> {
  const response = await fetch(assetUrl(path));
  if (!response.ok) throw new Error(`资源加载失败（${response.status}），请检查连接或重新准备资源。`);
  try { return await response.json(); }
  catch { throw new Error('资源响应不是有效数据，请重新准备资源。'); }
}

export async function fetchManifest(): Promise<Manifest> {
  return parseManifest(await fetchJson('manifest.json'));
}

export async function fetchLyrics(): Promise<LyricsById> {
  const entries = await Promise.all(songs.map(async ({ id }) => [id, parseLyrics(await fetchJson(`lyrics/${id}.json`), id)] as const));
  return Object.fromEntries(entries);
}
