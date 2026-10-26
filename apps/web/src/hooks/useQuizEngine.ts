import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildQuiz,
  judge,
  summarize,
  toggleSelection,
  type Question,
  type QuestionResult,
  type QuizConfig,
} from '../core/quiz.ts';
import type { LyricsById, Song } from '../core/quiz.ts';

export type QuizPhase = 'quiz' | 'summary';

export interface QuizState {
  questions: Question[];
  index: number;
  current: Question | null;
  selectedIds: string[];
  answered: boolean;
  phase: QuizPhase;
  results: QuestionResult[];
  error: string | null;
}

/**
 * 答题状态机：构建卷面 → 逐题作答（选中即判）→ 汇总。
 * 业务规则（抽题/判定/计分）全部来自 core 纯函数，hook 只管状态流转与计时。
 */
const emptyLyrics: LyricsById = {};

export function useQuizEngine(songs: Song[], config: QuizConfig | null, lyrics: LyricsById = emptyLyrics) {
  const [state, setState] = useState<QuizState>({
    questions: [],
    index: 0,
    current: null,
    selectedIds: [],
    answered: false,
    phase: 'quiz',
    results: [],
    error: null,
  });
  const questionStartRef = useRef<number>(0);

  useEffect(() => {
    if (!config) {
      setState({ questions: [], index: 0, current: null, selectedIds: [], answered: false, phase: 'quiz', results: [], error: null });
      return;
    }
    let questions: Question[];
    try { questions = buildQuiz(songs, config, lyrics); }
    catch (err) {
      setState((s) => ({ ...s, error: err instanceof Error ? err.message : '无法生成题目，请重试。' }));
      return;
    }
    questionStartRef.current = Date.now();
    setState({
      questions,
      index: 0,
      current: questions[0] ?? null,
      selectedIds: [],
      answered: false,
      phase: 'quiz',
      results: [],
      error: questions.length ? null : '曲库为空，请返回首页。',
    });
  }, [config, songs, lyrics]);

  const select = useCallback((songId: string) => {
    setState((s) => {
      if (s.answered || s.phase !== 'quiz' || !s.current) return s;
      if (!s.current.optionSongIds.includes(songId)) return s;
      if (s.current.mode === 'mix') return { ...s, selectedIds: toggleSelection(s.current, s.selectedIds, songId) };
      const correct = judge(s.current, songId);
      const elapsedMs = Date.now() - questionStartRef.current;
      const result: QuestionResult = { questionId: s.current.id, correct, elapsedMs, selectedSongIds: [songId] };
      return { ...s, selectedIds: [songId], answered: true, results: [...s.results, result] };
    });
  }, []);

  const confirm = useCallback(() => {
    setState((s) => {
      if (s.answered || s.phase !== 'quiz' || s.current?.mode !== 'mix'
        || s.selectedIds.length !== s.current.answerSongIds.length) return s;
      const result: QuestionResult = {
        questionId: s.current.id, correct: judge(s.current, s.selectedIds),
        elapsedMs: Date.now() - questionStartRef.current, selectedSongIds: [...s.selectedIds],
      };
      return { ...s, answered: true, results: [...s.results, result] };
    });
  }, []);

  const next = useCallback(() => {
    setState((s) => {
      if (!s.answered) return s;
      const nextIndex = s.index + 1;
      if (nextIndex >= s.questions.length) {
        return { ...s, phase: 'summary' as const };
      }
      questionStartRef.current = Date.now();
      return {
        ...s,
        index: nextIndex,
        current: s.questions[nextIndex],
        selectedIds: [],
        answered: false,
      };
    });
  }, []);

  const summary = useMemo(() => summarize(state.results), [state.results]);

  return { state, select, confirm, next, summary };
}
