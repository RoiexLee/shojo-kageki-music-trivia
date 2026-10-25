import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildQuiz,
  judge,
  summarize,
  type Question,
  type QuestionResult,
  type QuizConfig,
} from '../core/quiz.ts';
import type { Song } from '../core/quiz.ts';

export type QuizPhase = 'quiz' | 'summary';

export interface QuizState {
  questions: Question[];
  index: number;
  current: Question | null;
  selectedId: string | null;
  answered: boolean;
  phase: QuizPhase;
  results: QuestionResult[];
}

/**
 * 答题状态机：构建卷面 → 逐题作答（选中即判）→ 汇总。
 * 业务规则（抽题/判定/计分）全部来自 core 纯函数，hook 只管状态流转与计时。
 */
export function useQuizEngine(songs: Song[], config: QuizConfig | null) {
  const [state, setState] = useState<QuizState>({
    questions: [],
    index: 0,
    current: null,
    selectedId: null,
    answered: false,
    phase: 'quiz',
    results: [],
  });
  const questionStartRef = useRef<number>(0);
  const configKey = config ? `${config.mode}:${config.difficulty}:${config.seed}:${config.questionCount}` : '';

  useEffect(() => {
    if (!config) return;
    const questions = buildQuiz(songs, config);
    questionStartRef.current = Date.now();
    setState({
      questions,
      index: 0,
      current: questions[0] ?? null,
      selectedId: null,
      answered: false,
      phase: 'quiz',
      results: [],
    });
    // configKey 变化（新开一局）才重建；songs 由调用方保证稳定
  }, [configKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const select = useCallback((songId: string) => {
    setState((s) => {
      if (s.answered || s.phase !== 'quiz' || !s.current) return s;
      const correct = judge(s.current, songId);
      const elapsedMs = Date.now() - questionStartRef.current;
      const result: QuestionResult = { questionId: s.current.id, correct, elapsedMs };
      return { ...s, selectedId: songId, answered: true, results: [...s.results, result] };
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
        selectedId: null,
        answered: false,
      };
    });
  }, []);

  const summary = useMemo(() => summarize(state.results), [state.results]);

  return { state, select, next, summary };
}
