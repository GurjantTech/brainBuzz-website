/** Word Scramble (WordScrambleViewModel.kt / WordScrambleScreen.kt). Tap or type to play. */
import { h, icon, clear } from '../lib/dom.js';
import { wordRound, wordRoundTimeMs, clueVisibleByDefault, isCorrect, wordsPerRound } from '../engine/words.js';
import { word as wordScore } from '../engine/scoring.js';

const FAST_WORD_MS = 25000;
const f = Math.fround;

export default {
  roundTimeMs: wordRoundTimeMs,
  hintDescription: "Shows the clue if it's hidden, otherwise places the next letter for you.",
  create(ctx) {
    const ui = ctx.ui;
    const d = ctx.difficulty;
    const total = wordsPerRound(d);
    let wrongTotal = 0;
    let wrongThisWord = 0;
    let hintsThisWord = 0;
    let wordStartedAt = 0;
    let results = '';
    let ended = false;
    const st = {
      words: [], index: 0, tiles: [], slots: [], revealed: new Set(), clueVisible: clueVisibleByDefault(d),
      status: 'typing', lastPoints: 0, score: 0, solved: 0,
    };
    const current = () => st.words[st.index];
    const usedTiles = () => new Set(st.slots.filter((t) => t !== null));
    const acceptsInput = () => st.status === 'typing' || st.status === 'wrong';

    const clue = h('div.ws-clue', { 'aria-live': 'polite' });
    const slotsEl = h('div.ws-slots', { role: 'group', 'aria-label': 'Your answer' });
    const tilesEl = h('div.ws-tiles', { role: 'group', 'aria-label': 'Letters' });
    const tool = (label, ic, fn) => h('button.btn.btn-secondary.btn-sm', { type: 'button', onclick: fn }, icon(ic), h('span', {}, label));
    const tools = h('div.ws-tools', {}, tool('Shuffle', 'shuffle', () => shuffle()), tool('Clear', 'backspace', () => clearSlots()), tool('Skip', 'skip_next', () => skip()));
    const root = h('div.ws', {}, clue, slotsEl, tilesEl, tools,
      h('p', { class: 'muted', style: { margin: 0, fontSize: '.85rem', textAlign: 'center' } }, 'Tip: you can type the letters. Backspace removes the last one.'));
    clear(ctx.board).append(root);

    function show(index) {
      const w = st.words[index];
      if (!w) return;
      wrongThisWord = 0;
      hintsThisWord = 0;
      wordStartedAt = ctx.activePlayMs;
      Object.assign(st, {
        index, tiles: w.letters.slice(), slots: Array(w.answer.length).fill(null), revealed: new Set(),
        clueVisible: clueVisibleByDefault(d), status: 'typing',
      });
      render(true);
      ctx.announce(`Word ${index + 1} of ${total}. ${w.answer.length} letters: ${st.tiles.join(' ')}.`);
    }

    function render(rebuild = false) {
      const w = current();
      if (!w) return;
      clear(clue).append(icon('lightbulb'), h('span', {}, st.clueVisible ? w.entry.clue : 'Clue hidden. Use a hint to reveal it.'));
      clue.classList.toggle('hidden-clue', !st.clueVisible);
      root.classList.toggle('solved', st.status === 'solved');
      root.classList.toggle('wrong', st.status === 'wrong');

      const focusedTile = Array.prototype.indexOf.call(tilesEl.children, document.activeElement);
      const focusedSlot = Array.prototype.indexOf.call(slotsEl.children, document.activeElement);
      clear(slotsEl).append(...st.slots.map((t, i) => {
        const letter = t === null ? '' : st.tiles[t];
        const revealed = st.revealed.has(i);
        return h(`button.tile-btn.ws-slot${letter ? '.filled' : ''}${revealed ? '.revealed' : ''}`, {
          type: 'button',
          'aria-label': `Position ${i + 1}, ${letter ? `${letter}${revealed ? ', placed by hint' : ''}` : 'empty'}`,
          'aria-disabled': !letter || revealed || !acceptsInput() ? 'true' : 'false',
          onclick: () => tapSlot(i),
        }, letter);
      }));
      const used = usedTiles();
      clear(tilesEl).append(...st.tiles.map((ch, i) => h(`button.tile-btn.ws-tile${used.has(i) ? '.used' : ''}`, {
        type: 'button',
        'aria-label': used.has(i) ? `Letter ${ch}, placed` : `Letter ${ch}`,
        'aria-disabled': used.has(i) || !acceptsInput() ? 'true' : 'false',
        onclick: () => tapTile(i),
      }, ch)));
      if (!rebuild) {
        if (focusedTile >= 0) tilesEl.children[focusedTile]?.focus();
        if (focusedSlot >= 0) slotsEl.children[focusedSlot]?.focus();
      }

      ui.score(st.score);
      ui.progress(`Word ${st.index + 1}/${total}`);
      if (st.status === 'wrong') ui.feedback('Not quite. Tap letters to rearrange them.', 'bad');
      else if (st.status === 'solved') ui.feedback(`${w.answer}! +${st.lastPoints}`, 'good');
      else if (st.status === 'skipped') ui.feedback(`The word was ${w.answer}.`, 'info');
      else ui.feedback(null);
    }

    function tapTile(tile) {
      if (!ctx.canPlay || !acceptsInput() || usedTiles().has(tile) || tile < 0 || tile >= st.tiles.length) return;
      const slot = st.slots.indexOf(null);
      if (slot < 0) return;
      st.slots[slot] = tile;
      st.status = 'typing';
      render();
      checkIfFull();
    }

    function tapSlot(slot) {
      if (!ctx.canPlay || !acceptsInput() || st.revealed.has(slot) || st.slots[slot] === null || st.slots[slot] === undefined) return;
      st.slots[slot] = null;
      st.status = 'typing';
      render();
    }

    function clearSlots() {
      if (!ctx.canPlay || !acceptsInput()) return;
      st.slots = st.slots.map((t, i) => (st.revealed.has(i) ? t : null));
      st.status = 'typing';
      render();
    }

    /** Reorders the letter tiles, keeping every placed letter where it is. */
    function shuffle() {
      if (!ctx.canPlay || !acceptsInput()) return;
      const order = ctx.random.shuffled(st.tiles.map((_, i) => i));
      const newIndexOf = new Map(order.map((oldIdx, newIdx) => [oldIdx, newIdx]));
      st.slots = st.slots.map((t) => (t === null ? null : newIndexOf.get(t)));
      st.tiles = order.map((i) => st.tiles[i]);
      render();
    }

    function skip() {
      if (!ctx.canPlay || !acceptsInput()) return;
      results += '0';
      st.status = 'skipped';
      render();
      ctx.announce(`Skipped. The word was ${current().answer}.`);
      advance(1600);
    }

    function checkIfFull() {
      const w = current();
      if (!w || st.slots.some((t) => t === null)) return;
      const guess = st.slots.map((t) => st.tiles[t]).join('');
      if (isCorrect(w.answer, guess)) {
        const speed = f(1 - f(f(ctx.activePlayMs - wordStartedAt) / FAST_WORD_MS));
        st.lastPoints = wordScore(d, w.answer.length, hintsThisWord, wrongThisWord, speed);
        results += '1';
        st.status = 'solved';
        st.score += st.lastPoints;
        st.solved++;
        render();
        ctx.announce(`${w.answer}! Plus ${st.lastPoints}.`);
        advance(900);
      } else {
        wrongThisWord++;
        wrongTotal++;
        st.status = 'wrong';
        render();
        ctx.announce('Not quite.');
      }
    }

    async function advance(after) {
      await ctx.wait(after);
      const next = st.index + 1;
      if (next >= st.words.length) finishGame(); else show(next);
    }

    function finishGame() {
      if (ended) return;
      ended = true;
      while (results.length < total) results += '0';
      ctx.finish({
        score: st.score, correct: st.solved, total, durationMs: ctx.activePlayMs,
        moves: wrongTotal, answerPattern: results,
      });
    }

    return {
      start() {
        st.words = wordRound(d, ctx.random);
        show(0);
      },
      onTimeUp() {
        ui.feedback("Time's up!", 'bad');
        ctx.announce("Time's up!");
        finishGame();
      },
      hintAvailable() {
        const w = current();
        if (!w) return false;
        // A hint never places the final letter, so one must be left to reveal besides it.
        return acceptsInput() && (!st.clueVisible || st.revealed.size < w.answer.length - 1);
      },
      /** First shows a hidden clue; after that places the next letter for good. */
      applyHint() {
        const w = current();
        if (!w || !acceptsInput()) return false;
        if (!st.clueVisible) {
          hintsThisWord++;
          st.clueVisible = true;
          render();
          return true;
        }
        const answer = w.answer;
        let position = -1;
        for (let i = 0; i < answer.length; i++) if (!st.revealed.has(i)) { position = i; break; }
        if (position < 0 || st.revealed.size >= answer.length - 1) return false;
        const locked = new Set([...st.revealed].map((i) => st.slots[i]).filter((t) => t !== null));
        const tile = st.tiles.findIndex((ch, i) => ch === answer[position] && !locked.has(i));
        if (tile < 0) return false;
        hintsThisWord++;
        const prev = st.slots.indexOf(tile);
        if (prev >= 0) st.slots[prev] = null;
        st.slots[position] = tile;
        st.revealed = new Set([...st.revealed, position]);
        st.status = 'typing';
        render();
        checkIfFull();
        return true;
      },
      onKey(e) {
        if (!acceptsInput()) return false;
        if (e.key === 'Backspace') {
          for (let i = st.slots.length - 1; i >= 0; i--) {
            if (st.slots[i] !== null && !st.revealed.has(i)) { tapSlot(i); break; }
          }
          return true;
        }
        if (/^[a-z]$/i.test(e.key)) {
          const ch = e.key.toUpperCase();
          const used = usedTiles();
          const tile = st.tiles.findIndex((c, i) => c === ch && !used.has(i));
          if (tile >= 0) tapTile(tile);
          return true;
        }
        return false;
      },
    };
  },
};
