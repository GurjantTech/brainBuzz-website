/** Memory Match (MemoryViewModel.kt / MemoryScreen.kt). */
import { h, icon, clear, gridKeys } from '../lib/dom.js';
import { deal, columnsFor, pairsFor, previewMsFor, SYMBOLS } from '../engine/memory.js';
import { memoryScore } from '../engine/scoring.js';

const MISMATCH_REVEAL_MS = 750;
const PEEK_MS = 1500;

export default {
  hintDescription: 'Shows every card for a moment.',
  create(ctx) {
    const ui = ctx.ui;
    const d = ctx.difficulty;
    const totalPairs = pairsFor(d);
    const columns = columnsFor(d);
    const cards = deal(d, ctx.random);
    let phase = 'idle'; // idle → preview → playing → done
    let firstPick = null;
    let resolving = false;
    let peeking = false;
    let moves = 0;
    let matchedPairs = 0;

    const grid = h('div.mm-grid', { role: 'group', 'aria-label': 'Cards', style: { 'grid-template-columns': `repeat(${columns}, 1fr)` } });
    const els = cards.map((card, i) => {
      const sym = SYMBOLS[card.symbol];
      const front = h('span.mm-face.mm-front', {}, icon(sym.icon));
      front.style.color = sym.color;
      return h('button.mm-card', { type: 'button', 'data-cell': i, onclick: () => flip(i) },
        h('span.mm-inner', {}, h('span.mm-face.mm-back', {}, icon('psychology')), front));
    });
    grid.append(...els);
    gridKeys(grid, columns);
    clear(ctx.board).append(grid);

    function render() {
      const revealAll = phase === 'preview' || peeking;
      cards.forEach((card, i) => {
        const up = card.faceUp || card.matched || revealAll;
        const el = els[i];
        el.classList.toggle('up', up);
        el.classList.toggle('matched', card.matched);
        const name = SYMBOLS[card.symbol].name;
        el.setAttribute('aria-label', `Card ${i + 1}, ${up ? `${name}${card.matched ? ', matched' : ''}` : 'hidden'}`);
        el.setAttribute('aria-disabled', phase !== 'playing' || card.faceUp || card.matched ? 'true' : 'false');
      });
      ui.scoreLabel('MOVES');
      ui.score(moves);
      ui.progress(`Pairs ${matchedPairs}/${totalPairs}`);
      ui.elapsed(ctx.activePlayMs);
    }

    function flip(index) {
      const card = cards[index];
      if (!card || !ctx.canPlay || phase !== 'playing' || peeking || resolving || card.faceUp || card.matched) return;
      if (firstPick === null) {
        firstPick = index;
        card.faceUp = true;
        render();
        ctx.announce(`${SYMBOLS[card.symbol].name}`);
        return;
      }
      const first = firstPick;
      firstPick = null;
      card.faceUp = true;
      moves++;
      if (cards[first].symbol === card.symbol) {
        card.matched = true;
        cards[first].matched = true;
        matchedPairs++;
        render();
        ctx.announce(`${SYMBOLS[card.symbol].name}. Match! ${matchedPairs} of ${totalPairs} pairs.`);
        if (matchedPairs === totalPairs) finish();
      } else {
        resolving = true;
        render();
        ctx.announce(`${SYMBOLS[card.symbol].name}. No match.`);
        ctx.wait(MISMATCH_REVEAL_MS).then(() => {
          card.faceUp = false;
          cards[first].faceUp = false;
          resolving = false;
          render();
        });
      }
    }

    async function finish() {
      phase = 'done';
      const elapsed = ctx.activePlayMs;
      await ctx.wait(600); // let the last match animation land
      ctx.finish({
        score: memoryScore(d, totalPairs, moves, elapsed, ctx.hintsUsed),
        correct: totalPairs,
        total: totalPairs,
        durationMs: elapsed,
        moves,
      });
    }

    render();
    ui.status('');

    return {
      async start() {
        phase = 'preview';
        render();
        ui.status('Memorize the cards!');
        ctx.announce('Memorize the cards.');
        await ctx.wait(previewMsFor(d));
        phase = 'playing';
        ui.status('');
        render();
        ctx.announce('Find the pairs.');
      },
      clockRunning: () => phase === 'playing',
      onTick: () => ui.elapsed(ctx.activePlayMs),
      hintAvailable: () => phase === 'playing' && !peeking,
      applyHint() {
        if (phase !== 'playing' || peeking) return false;
        peeking = true;
        render();
        ctx.wait(PEEK_MS).then(() => {
          peeking = false;
          render();
        });
        return true;
      },
    };
  },
};
