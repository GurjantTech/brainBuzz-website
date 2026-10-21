/**
 * Multiple-choice quiz engine (QuizViewModel.kt): Quick Math Rush (60 s sprint, adaptive),
 * Number Sequence Master (10 questions, per-question clock) and the Daily Challenge.
 */
import { h, icon, clear } from '../lib/dom.js';
import { quizConfig, KIND_LABEL, QuestionKind } from '../engine/quiz.js';
import { pointsFor } from '../engine/scoring.js';

const SPRINT_FAST_ANSWER_MS = 6000;
const f = Math.fround;

export function quizGame(type) {
  return {
    hintDescription: type === 'MATH' ? 'Removes two wrong answers.' : 'Removes two wrong answers and reveals the pattern.',
    create(ctx) {
      const config = quizConfig(type, ctx.difficulty, { epochDay: ctx.epochDay });
      const sprint = config.totalQuestions === null;
      const ui = ctx.ui;
      const st = {
        phase: 'idle', question: null, index: 0, score: 0, combo: 0, bestCombo: 0, correct: 0, answered: 0,
        timeLeft: config.roundTimeMs ?? config.questionTimeMs, timeLimit: config.roundTimeMs ?? config.questionTimeMs,
        eliminated: new Set(), revealRule: false, shownAt: 0, pattern: '',
      };

      const kind = h('div.quiz-kind');
      const text = h('div.quiz-text');
      const rule = h('div.quiz-rule');
      const prompt = h('div.quiz-prompt', {}, kind, text, rule);
      const options = h('div.quiz-options', { role: 'group', 'aria-label': 'Answers' });
      clear(ctx.board).append(h('div.quiz', {}, prompt, options));

      const fraction = () => Math.min(1, Math.max(0, f(f(st.timeLeft) / st.timeLimit)));
      const tick = () => ui.timer(fraction(), st.timeLeft);

      function render() {
        const q = st.question;
        kind.textContent = type === 'DAILY' ? `${KIND_LABEL[q.kind]} · ${q.level.label}` : KIND_LABEL[q.kind];
        text.textContent = q.prompt;
        clear(rule);
        if (st.revealRule && st.phase === 'playing') rule.append(h('span.pill.pill-amber', {}, icon('lightbulb'), `Hint: ${q.explanation}`));
        // Keep keyboard focus on the same answer slot when the buttons are redrawn.
        const focused = Array.prototype.indexOf.call(options.children, document.activeElement);
        clear(options).append(...q.options.map((opt, i) => {
          let cls = '';
          let badge = null;
          let state = '';
          if (st.phase === 'feedback') {
            if (opt === q.answer) { cls = 'correct'; badge = 'check_circle'; state = ', correct answer'; }
            else if (opt === st.selected) { cls = 'wrong'; badge = 'cancel'; state = ', your answer, wrong'; }
          }
          if (st.eliminated.has(opt)) { cls = cls || 'out'; state = state || ', ruled out by hint'; }
          return h(`button.tile-btn.quiz-opt${cls ? `.${cls}` : ''}`, {
            type: 'button',
            'aria-label': `${opt}${state}`,
            'aria-disabled': st.phase !== 'playing' || st.eliminated.has(opt) ? 'true' : null,
            onclick: () => answer(opt),
          }, h('span.key', { 'aria-hidden': 'true' }, String(i + 1)), String(opt), badge ? icon(badge, 'badge') : null);
        }));
        if (focused >= 0 && options.children[focused]) options.children[focused].focus();
        const progressText = sprint ? `${st.answered} answered` : `${st.index + 1}/${config.totalQuestions}`;
        ui.progress(progressText);
        ui.score(st.score);
        if (st.combo >= 2) ui.extra(`Combo ×${st.combo}`, 'bolt', 'pill-streak combo'); else ui.extra(null);
      }

      function showQuestion(index) {
        st.question = config.question(index);
        st.index = index;
        st.phase = 'playing';
        st.selected = null;
        st.eliminated = new Set();
        st.revealRule = false;
        st.shownAt = ctx.activePlayMs;
        if (!sprint) {
          st.timeLeft = config.questionTimeMs;
          st.timeLimit = config.questionTimeMs;
        }
        ui.feedback(null);
        render();
        tick();
        ctx.announce(`${KIND_LABEL[st.question.kind]}: ${st.question.prompt.replace('?', 'what')}. Options ${st.question.options.join(', ')}.`);
      }

      function answer(option) {
        const q = st.question;
        if (!ctx.canPlay || st.phase !== 'playing' || st.eliminated.has(option)) return;
        const correct = option === q.answer;
        const combo = correct ? st.combo + 1 : 0;
        const speed = sprint ? f(1 - f(f(ctx.activePlayMs - st.shownAt) / SPRINT_FAST_ANSWER_MS)) : fraction();
        // Adaptive rounds score each question at the level it was asked.
        const points = correct ? pointsFor(q.level || config.difficulty, speed, combo) : 0;
        st.pattern += correct ? '1' : '0';
        config.recordAnswer(correct);
        Object.assign(st, {
          phase: 'feedback', selected: option, score: st.score + points, combo,
          bestCombo: Math.max(st.bestCombo, combo), correct: st.correct + (correct ? 1 : 0), answered: st.answered + 1,
        });
        render();
        feedback(correct, points, option);
        advance(correct);
      }

      function feedback(correct, points, selected) {
        const q = st.question;
        let msg;
        if (correct && q.kind === QuestionKind.SEQUENCE) msg = `+${points} · ${q.explanation}`;
        else if (correct) msg = `+${points} points`;
        else if (selected === null) msg = `Time's up! ${q.explanation}`;
        else msg = q.explanation;
        ui.feedback(msg, correct ? 'good' : 'bad');
        ctx.announce(correct ? `Correct. ${msg}` : `Wrong. ${msg}`);
      }

      function onTimeout() {
        if (st.phase !== 'playing') return;
        st.pattern += '0';
        config.recordAnswer(false);
        Object.assign(st, { phase: 'feedback', selected: null, combo: 0, answered: st.answered + 1 });
        render();
        feedback(false, 0, null);
        advance(false);
      }

      async function advance(correct) {
        const waitMs = sprint ? (correct ? 280 : 900) : correct ? 650 : 1800;
        await ctx.wait(waitMs);
        if (st.phase !== 'feedback') return;
        const next = st.index + 1;
        const total = config.totalQuestions;
        if ((total !== null && next >= total) || (sprint && st.timeLeft <= 0)) done();
        else showQuestion(next);
      }

      function done() {
        if (st.phase === 'done') return;
        st.phase = 'done';
        ctx.finish({
          score: st.score,
          correct: st.correct,
          total: config.totalQuestions ?? st.answered,
          durationMs: sprint ? config.roundTimeMs : ctx.activePlayMs,
          bestCombo: st.bestCombo,
          answerPattern: st.pattern,
        });
      }

      return {
        start: () => showQuestion(0),
        // The sprint clock keeps running while feedback shows; per-question clocks stop.
        clockRunning: () => (sprint ? st.phase === 'playing' || st.phase === 'feedback' : st.phase === 'playing'),
        onTick(dt) {
          st.timeLeft = Math.max(0, st.timeLeft - dt);
          tick();
          if (st.timeLeft === 0) {
            if (sprint) done(); else onTimeout();
          }
        },
        hintAvailable: () => st.phase === 'playing' && st.eliminated.size === 0,
        applyHint() {
          const q = st.question;
          if (st.phase !== 'playing') return false;
          const wrong = ctx.random.shuffled(q.options.filter((o) => o !== q.answer)).slice(0, 2);
          st.eliminated = new Set(wrong);
          st.revealRule = q.kind === QuestionKind.SEQUENCE;
          render();
          return true;
        },
        onKey(e) {
          const n = Number(e.key);
          if (n >= 1 && n <= 4 && st.question && st.phase === 'playing') {
            answer(st.question.options[n - 1]);
            return true;
          }
          return false;
        },
      };
    },
  };
}
