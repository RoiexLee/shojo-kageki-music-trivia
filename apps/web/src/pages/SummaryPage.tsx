import { useEffect, useMemo, useRef, useState } from 'react';
import { formatTime, MODE_LABEL, DIFFICULTY_LABEL, answerIds, summarize, type QuizConfig, type Question, type QuestionResult, type Song } from '../core/quiz.ts';
import { assetUrl } from '../data.ts';
import { saveBest } from '../core/best.ts';
import { shareText } from '../core/share.ts';
import { Arrow, Brand, Footer } from '../components/Brand.tsx';
import type { ManifestEntry } from '@starlight/shared';

interface Props {
  config: QuizConfig; results: QuestionResult[]; questions: Question[];
  songById: Map<string, Song>; entryById: Map<string, ManifestEntry>; onRestart: () => void;
}

export function SummaryPage({ config, results, questions, songById, entryById, onRestart }: Props) {
  const score = useMemo(() => summarize(results), [results]);
  const [record, setRecord] = useState<ReturnType<typeof saveBest> | null>(null);
  const [notice, setNotice] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    setRecord(saveBest(config.mode, config.difficulty, score));
    heading.current?.focus();
  }, [config.mode, config.difficulty, score]);

  async function copyResult() {
    try { await navigator.clipboard.writeText(shareText(config, score)); setNotice('成绩文案已复制。'); }
    catch { setNotice('无法访问剪贴板，你可以直接选中页面上的成绩复制。'); }
  }

  async function downloadResult() {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1000; canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 不可用');
      const style = getComputedStyle(document.documentElement);
      const color = (name: string) => style.getPropertyValue(name).trim();
      ctx.fillStyle = color('--background'); ctx.fillRect(0, 0, 1000, 600);
      ctx.strokeStyle = color('--gold'); ctx.strokeRect(32, 32, 936, 536);
      ctx.fillStyle = color('--text'); ctx.textAlign = 'center';
      ctx.font = '30px serif'; ctx.fillText('少女☆歌剧 · 舞台猜歌', 500, 100);
      ctx.fillStyle = color('--gold'); ctx.font = '26px sans-serif';
      ctx.fillText(`${MODE_LABEL[config.mode]} · ${DIFFICULTY_LABEL[config.difficulty]}`, 500, 160);
      ctx.font = 'bold 120px serif'; ctx.fillText(`${score.correct} / ${score.total}`, 500, 315);
      ctx.fillStyle = color('--text'); ctx.font = '26px sans-serif';
      ctx.fillText(`用时 ${formatTime(score.elapsedMs)} · 种子 ${config.seed}`, 500, 390);
      ctx.fillStyle = color('--muted'); ctx.font = '20px sans-serif';
      ctx.fillText('非官方粉丝作品 · 素材版权归原权利方 · 仅限本地学习', 500, 510);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('导出失败')), 'image/png'));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = `starlight-${config.mode}-${config.seed}.png`;
      link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice('成绩图片已生成，下载已开始。');
    } catch { setNotice('无法导出图片，请尝试复制成绩文案。'); }
  }

  return (
    <main className="app-shell result-shell">
      <Brand onHome={onRestart} />
      <header className="result-heading">
        <p className="muted">{MODE_LABEL[config.mode]} · {DIFFICULTY_LABEL[config.difficulty]}</p>
        <h1 ref={heading} tabIndex={-1}>本场谢幕</h1>
        <p className="result-score">{score.correct}<span> / {score.total}</span></p>
        <p>用时 {formatTime(score.elapsedMs)} · 种子 <span className="seed">{config.seed}</span></p>
        <p role="status" className="best-score">{record === null ? '正在保存成绩…' : record.saved ? `本机最佳：${record.best.correct}/${record.best.total} · ${formatTime(record.best.elapsedMs)}` : '无法保存本机最佳成绩，仅显示本局结果。'}</p>
        <div className="result-actions">
          <button type="button" className="secondary-button" onClick={copyResult}>复制成绩</button>
          <button type="button" className="secondary-button" onClick={downloadResult}>下载成绩图</button>
          <button type="button" className="primary-button" onClick={onRestart}>再玩一次<Arrow /></button>
        </div>
        <p className="share-notice" aria-live="polite">{notice}</p>
      </header>
      <section className="result-review" aria-labelledby="review-title">
        <h2 className="section-heading" id="review-title">回望这场演出</h2>
        <ol className="result-list">
          {results.map((result, i) => {
            const answers = answerIds(questions[i]);
            return <li key={result.questionId} className="result-row">
              <span className={`result-mark ${result.correct ? 'success-text' : 'error-text'}`}>{String(i + 1).padStart(2, '0')}<small>{result.correct ? '答对' : '选错'}</small></span>
              <div className="result-songs">{answers.map((id) => <div className="result-song" key={id}>
                {entryById.get(id)?.coverPath && <img src={assetUrl(entryById.get(id)!.coverPath)} alt="" width="56" height="56" loading="lazy" />}
                <div><strong>{songById.get(id)?.title ?? id}</strong><small>{songById.get(id)?.origin}</small></div>
              </div>)}
              {!result.correct && <p className="your-answer">你的选择：{(result.selectedSongIds ?? []).map((id) => songById.get(id)?.title ?? id).join('、') || '无'}</p>}</div>
              <span className="result-time">{formatTime(result.elapsedMs)}</span>
            </li>;
          })}
        </ol>
      </section>
      <Footer />
    </main>
  );
}
