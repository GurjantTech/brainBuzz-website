/** Odd One Out (OddOneOutViewModel.kt / OddOneOutScreen.kt). */
import { h, icon, clear, gridKeys } from '../lib/dom.js';
import { generateOdd, ODD_PUZZLES, timePerPuzzleMs, describeItem } from '../engine/odd.js';
import { pointsFor } from '../engine/scoring.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const f = Math.fround;

function polygon(r, sides, startDeg) {
  return Array.from({ length: sides }, (_, i) => {
    const a = ((startDeg + (360 * i) / sides) * Math.PI) / 180;
    return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`;
  }).join(' ');
}

function star(r) {
  return Array.from({ length: 10 }, (_, i) => {
    const radius = i % 2 === 0 ? r : r * 0.45;
    const a = ((-90 + 36 * i) * Math.PI) / 180;
    return `${50 + radius * Math.cos(a)},${50 + radius * Math.sin(a)}`;
  }).join(' ');
}

/** An upward arrow; asymmetric under rotation so its direction is unambiguous. */
function arrow(r) {
  const c = 50;
  return [
    [c, c - r], [c + r * 0.8, c - r * 0.1], [c + r * 0.3, c - r * 0.1], [c + r * 0.3, c + r],
    [c - r * 0.3, c + r], [c - r * 0.3, c - r * 0.1], [c - r * 0.8, c - r * 0.1],
  ].map((p) => p.join(',')).join(' ');
}

/** Same geometry as drawOddShape() in the app: centred, scaled to the cell, turned by [rotation]. */
function glyph(item) {
  const el = document.createElementNS(SVG_NS, 'svg');
  el.setAttribute('viewBox', '0 0 100 100');
  el.setAttribute('aria-hidden', 'true');
  el.setAttribute('focusable', 'false');
  el.style.width = `${item.scale * 100}%`;
  el.style.height = `${item.scale * 100}%`;
  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('transform', `rotate(${item.rotation} 50 50)`);
  const r = 50;
  let shape;
  if (item.shape === 'CIRCLE') {
    shape = document.createElementNS(SVG_NS, 'circle');
    shape.setAttribute('cx', 50); shape.setAttribute('cy', 50); shape.setAttribute('r', r);
  } else if (item.shape === 'SQUARE') {
    shape = document.createElementNS(SVG_NS, 'rect');
    shape.setAttribute('x', 50 - r * 0.85); shape.setAttribute('y', 50 - r * 0.85);
    shape.setAttribute('width', r * 1.7); shape.setAttribute('height', r * 1.7);
  } else {
    shape = document.createElementNS(SVG_NS, 'polygon');
    const pts = {
      TRIANGLE: () => polygon(r, 3, -90), DIAMOND: () => polygon(r, 4, -90), PENTAGON: () => polygon(r, 5, -90),
      HEXAGON: () => polygon(r, 6, 0), STAR: () => star(r), ARROW: () => arrow(r),
    }[item.shape]();
    shape.setAttribute('points', pts);
  }
  g.appendChild(shape);
  el.appendChild(g);
  return el;
}

export function itemNode(item) {
  if (item.type === 'glyph') return glyph(item);
  if (item.type === 'number') return h('span.num', {}, String(item.value));
  return h(`span.let${item.mirrored ? '.mirror' : ''}`, {}, item.char);
}

export default {
  hintDescription: 'Rules out about half of the wrong items.',
  create(ctx) {
    const ui = ctx.ui;
    const d = ctx.difficulty;
    const perPuzzle = timePerPuzzleMs(d);
    let bestCombo = 0;
    let results = '';
    const st = {
      puzzle: null, index: 0, selected: null, answered: false, lastCorrect: null, lastPoints: 0,
      eliminated: new Set(), score: 0, combo: 0, correct: 0, timeLeft: perPuzzle,
    };
    const grid = h('div.odd-grid', { role: 'group', 'aria-label': 'Items' });
    clear(ctx.board).append(grid);
    gridKeys(grid, () => (st.puzzle ? st.puzzle.columns : 3));
    let cells = [];

    const fraction = () => Math.min(1, Math.max(0, f(f(st.timeLeft) / perPuzzle)));

    function show(index) {
      Object.assign(st, {
        puzzle: generateOdd(d, index, ctx.random), index, selected: null, answered: false,
        lastCorrect: null, eliminated: new Set(), timeLeft: perPuzzle,
      });
      const p = st.puzzle;
      const hadFocus = grid.contains(document.activeElement);
      grid.style.gridTemplateColumns = `repeat(${p.columns}, 1fr)`;
      cells = p.items.map((item, i) => h('button.tile-btn.odd-cell', { type: 'button', 'data-cell': i, onclick: () => select(i) }, itemNode(item)));
      clear(grid).append(...cells);
      if (hadFocus) cells[0].focus();
      ui.feedback(null);
      render();
      ui.timer(1, perPuzzle);
      ctx.announce(`Grid ${index + 1} of ${ODD_PUZZLES}. ${p.items.length} items.`);
    }

    function look(i) {
      if (st.answered && i === st.puzzle.oddIndex) return 'right';
      if (st.answered && i === st.selected) return 'wrong';
      if (st.answered || st.eliminated.has(i)) return 'dim';
      return '';
    }

    function render() {
      const p = st.puzzle;
      cells.forEach((cell, i) => {
        const l = look(i);
        cell.className = `tile-btn odd-cell${l ? ` ${l}` : ''}`;
        cell.querySelector('.badge')?.remove();
        if (l === 'right' || l === 'wrong') cell.append(icon(l === 'right' ? 'check_circle' : 'cancel', 'badge'));
        let label = `Item ${i + 1}, ${describeItem(p.items[i])}`;
        if (l === 'right') label += ', the odd one out';
        else if (l === 'wrong') label += ', your choice, wrong';
        else if (st.eliminated.has(i)) label += ', ruled out by hint';
        cell.setAttribute('aria-label', label);
        cell.setAttribute('aria-disabled', st.answered || st.eliminated.has(i) ? 'true' : 'false');
      });
      ui.score(st.score);
      ui.progress(`${st.index + 1}/${ODD_PUZZLES}`);
      if (st.combo >= 2) ui.extra(`Combo ×${st.combo}`, 'bolt', 'pill-streak combo'); else ui.extra(null);
      ui.status(st.answered ? '' : 'Tap the one that’s different');
    }

    function select(i) {
      if (!ctx.canPlay || st.answered || st.eliminated.has(i)) return;
      resolve(i);
    }

    async function resolve(selected) {
      const p = st.puzzle;
      const correct = selected === p.oddIndex;
      const combo = correct ? st.combo + 1 : 0;
      bestCombo = Math.max(bestCombo, combo);
      const points = correct ? pointsFor(d, fraction(), combo) : 0;
      results += correct ? '1' : '0';
      Object.assign(st, {
        selected, answered: true, lastCorrect: correct, lastPoints: points,
        score: st.score + points, combo, correct: st.correct + (correct ? 1 : 0),
      });
      render();
      const msg = correct ? `Correct! +${points}` : selected === null ? `Time's up! ${p.explanation}` : p.explanation;
      ui.feedback(msg, correct ? 'good' : 'bad');
      ctx.announce(msg);
      // Wrong answers stay up longer so the explanation can be read.
      await ctx.wait(correct ? 700 : 2000);
      const next = st.index + 1;
      if (next >= ODD_PUZZLES) {
        ctx.finish({
          score: st.score, correct: st.correct, total: ODD_PUZZLES, durationMs: ctx.activePlayMs,
          bestCombo, answerPattern: results,
        });
      } else show(next);
    }

    return {
      start: () => show(0),
      // The per-puzzle clock stops while the answer is being shown.
      clockRunning: () => !st.answered,
      onTick(dt) {
        if (st.answered || !st.puzzle) return;
        st.timeLeft = Math.max(0, st.timeLeft - dt);
        ui.timer(fraction(), st.timeLeft);
        if (st.timeLeft === 0) resolve(null);
      },
      hintAvailable() {
        const p = st.puzzle;
        if (!p || st.answered) return false;
        return p.items.filter((_, i) => i !== p.oddIndex && !st.eliminated.has(i)).length > 1;
      },
      /** Rules out about half of the remaining wrong items. */
      applyHint() {
        const p = st.puzzle;
        if (!p || st.answered) return false;
        const candidates = p.items.map((_, i) => i).filter((i) => i !== p.oddIndex && !st.eliminated.has(i));
        if (candidates.length <= 1) return false;
        const drop = ctx.random.shuffled(candidates).slice(0, Math.floor(candidates.length / 2));
        st.eliminated = new Set([...st.eliminated, ...drop]);
        render();
        return true;
      },
    };
  },
};
