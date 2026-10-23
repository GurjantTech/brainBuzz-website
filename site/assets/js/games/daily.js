/**
 * Daily Challenge (DailyViewModel.kt / DailyScreen.kt): 12 Hard puzzles from all seven games, one after another.
 * Each puzzle has its own clock; a right answer scores like a Hard quiz answer (speed and combo bonuses).
 * Every puzzle type returns { hintAvailable, applyHint, onKey?, timeUp? } and calls done(correct, message).
 */
import { h, icon, clear, gridKeys } from '../lib/dom.js';
import { Difficulty } from '../engine/models.js';
import { pointsFor } from '../engine/scoring.js';
import { QuestionKind } from '../engine/quiz.js';
import { describeItem } from '../engine/odd.js';
import { isCorrect } from '../engine/words.js';
import { checkTap, Tap, SYMBOLS } from '../engine/memory.js';
import { connectedCells, isSolved, misalignedPathCell, turnsToMatch, rotateMask, rotated } from '../engine/logic-path.js';
import {
  dailyMix, DAILY_TOTAL, STAGE_TIME_MS, STAGE_LABEL, DAILY_MATRIX, DAILY_MEMORY_PREVIEW_MS, DAILY_MEMORY_COLUMNS,
} from '../engine/daily.js';
import { itemNode } from './odd.js';
import { pipeDrawing, describe } from './logic.js';

const f = Math.fround;
const MATRIX_GAP_MS = 180;
const MISMATCH_REVEAL_MS = 750;
const PEEK_MS = 1500;

export default {
  hintDescription: 'Helps with the current puzzle: removes wrong answers, replays a pattern, shows the cards, places a letter or turns a pipe.',
  create(ctx) {
    const ui = ctx.ui;
    const stages = dailyMix(ctx.epochDay);
    const st = { index: 0, score: 0, combo: 0, bestCombo: 0, correct: 0, pattern: '', timeLeft: 0, limit: 1, clock: false, answered: false, puzzle: null };
    const kindEl = h('div.quiz-kind.daily-kind');
    const host = h('div.daily-stage');
    clear(ctx.board).append(h('div.daily', {}, kindEl, host));

    const fraction = () => Math.min(1, Math.max(0, f(f(st.timeLeft) / st.limit)));
    const canAct = () => ctx.canPlay && !st.answered;
    const api = {
      host,
      canAct,
      startClock() { st.clock = true; },
      stopClock() { st.clock = false; },
      done: (correct, message) => resolve(correct, message),
    };
    const BUILDERS = { MATH: choiceStage, SEQUENCE: choiceStage, ODD: oddStage, WORD: wordStage, MATRIX: matrixStage, MEMORY: memoryStage, LOGIC: logicStage };

    function show(index) {
      const s = stages[index];
      Object.assign(st, { index, answered: false, clock: false, limit: STAGE_TIME_MS[s.kind], timeLeft: STAGE_TIME_MS[s.kind] });
      kindEl.textContent = `${STAGE_LABEL[s.kind]} · Hard`;
      ui.progress(`${index + 1}/${DAILY_TOTAL}`);
      ui.feedback(null);
      ui.status('');
      ui.timer(1, st.limit);
      clear(host);
      host.className = `daily-stage daily-${s.kind.toLowerCase()}`;
      st.puzzle = BUILDERS[s.kind](s, api, ctx);
      ctx.announce(`Puzzle ${index + 1} of ${DAILY_TOTAL}: ${STAGE_LABEL[s.kind]}.`);
    }

    async function resolve(correct, message) {
      if (st.answered) return;
      st.answered = true;
      st.clock = false;
      const combo = correct ? st.combo + 1 : 0;
      const points = correct ? pointsFor(Difficulty.HARD, fraction(), combo) : 0;
      Object.assign(st, {
        score: st.score + points, combo, bestCombo: Math.max(st.bestCombo, combo),
        correct: st.correct + (correct ? 1 : 0), pattern: st.pattern + (correct ? '1' : '0'),
      });
      ui.score(st.score);
      if (combo >= 2) ui.extra(`Combo ×${combo}`, 'bolt', 'pill-streak combo'); else ui.extra(null);
      const msg = correct ? `+${points}${message ? ` · ${message}` : ''}` : message;
      ui.feedback(msg, correct ? 'good' : 'bad');
      ctx.announce(correct ? `Correct. ${msg}` : `Wrong. ${msg}`);
      await ctx.wait(correct ? 900 : 2200);
      if (!ctx.alive) return;
      if (st.index + 1 >= DAILY_TOTAL) {
        ctx.finish({
          score: st.score, correct: st.correct, total: DAILY_TOTAL, durationMs: ctx.activePlayMs,
          bestCombo: st.bestCombo, answerPattern: st.pattern,
        });
      } else show(st.index + 1);
    }

    ui.score(0);
    return {
      start: () => show(0),
      clockRunning: () => st.clock && !st.answered,
      onTick(dt) {
        st.timeLeft = Math.max(0, st.timeLeft - dt);
        ui.timer(fraction(), st.timeLeft);
        if (st.timeLeft === 0 && !st.answered) {
          st.clock = false;
          if (st.puzzle.timeUp) st.puzzle.timeUp(); else resolve(false, "Time's up!");
        }
      },
      hintAvailable: () => !st.answered && !!st.puzzle && st.puzzle.hintAvailable(),
      applyHint: () => !st.answered && !!st.puzzle && st.puzzle.applyHint(),
      onKey: (e) => (!st.answered && st.puzzle && st.puzzle.onKey ? st.puzzle.onKey(e) : false),
    };
  },
};

// ---------- Quick Math and Number Sequence: pick one of four answers ----------

function choiceStage(s, api, ctx) {
  const q = s.question;
  const local = { selected: null, eliminated: new Set(), revealRule: false, answered: false };
  const text = h('div.quiz-text', {}, q.prompt);
  const rule = h('div.quiz-rule');
  const options = h('div.quiz-options', { role: 'group', 'aria-label': 'Answers' });
  api.host.append(h('div.quiz', {}, h('div.quiz-prompt', {}, text, rule), options));

  function render() {
    clear(rule);
    if (local.revealRule && !local.answered) rule.append(h('span.pill.pill-amber', {}, icon('lightbulb'), `Hint: ${q.explanation}`));
    const focused = Array.prototype.indexOf.call(options.children, document.activeElement);
    clear(options).append(...q.options.map((opt, i) => {
      let cls = '';
      let badge = null;
      let state = '';
      if (local.answered) {
        if (opt === q.answer) { cls = 'correct'; badge = 'check_circle'; state = ', correct answer'; }
        else if (opt === local.selected) { cls = 'wrong'; badge = 'cancel'; state = ', your answer, wrong'; }
      }
      if (local.eliminated.has(opt)) { cls = cls || 'out'; state = state || ', ruled out by hint'; }
      return h(`button.tile-btn.quiz-opt${cls ? `.${cls}` : ''}`, {
        type: 'button',
        'aria-label': `${opt}${state}`,
        'aria-disabled': local.answered || local.eliminated.has(opt) ? 'true' : null,
        onclick: () => answer(opt),
      }, h('span.key', { 'aria-hidden': 'true' }, String(i + 1)), String(opt), badge ? icon(badge, 'badge') : null);
    }));
    if (focused >= 0 && options.children[focused]) options.children[focused].focus();
  }

  function answer(opt) {
    if (!api.canAct() || local.answered || local.eliminated.has(opt)) return;
    finish(opt);
  }

  function finish(opt) {
    local.answered = true;
    local.selected = opt;
    render();
    const correct = opt === q.answer;
    api.done(correct, correct ? (q.kind === QuestionKind.SEQUENCE ? q.explanation : '') : `${opt === null ? "Time's up! " : ''}${q.explanation}`);
  }

  render();
  api.startClock();
  ctx.announce(`${q.prompt.replace('?', 'what')}. Options ${q.options.join(', ')}.`);
  return {
    timeUp: () => finish(null),
    hintAvailable: () => local.eliminated.size === 0,
    applyHint() {
      local.eliminated = new Set(ctx.random.shuffled(q.options.filter((o) => o !== q.answer)).slice(0, 2));
      local.revealRule = q.kind === QuestionKind.SEQUENCE;
      render();
      return true;
    },
    onKey(e) {
      const n = Number(e.key);
      if (n >= 1 && n <= 4) { answer(q.options[n - 1]); return true; }
      return false;
    },
  };
}

// ---------- Odd One Out: tap the item that doesn't belong ----------

function oddStage(s, api, ctx) {
  const p = s.puzzle;
  const local = { selected: undefined, eliminated: new Set(), answered: false };
  const grid = h('div.odd-grid', { role: 'group', 'aria-label': 'Items', style: { 'grid-template-columns': `repeat(${p.columns}, 1fr)` } });
  const cells = p.items.map((item, i) => h('button.tile-btn.odd-cell', { type: 'button', 'data-cell': i, onclick: () => select(i) }, itemNode(item)));
  grid.append(...cells);
  gridKeys(grid, p.columns);
  api.host.append(grid);

  function render() {
    cells.forEach((cell, i) => {
      let l = '';
      if (local.answered && i === p.oddIndex) l = 'right';
      else if (local.answered && i === local.selected) l = 'wrong';
      else if (local.answered || local.eliminated.has(i)) l = 'dim';
      cell.className = `tile-btn odd-cell${l ? ` ${l}` : ''}`;
      const badge = cell.querySelector('.badge');
      if (badge) badge.remove();
      if (l === 'right' || l === 'wrong') cell.append(icon(l === 'right' ? 'check_circle' : 'cancel', 'badge'));
      let label = `Item ${i + 1}, ${describeItem(p.items[i])}`;
      if (l === 'right') label += ', the odd one out';
      else if (l === 'wrong') label += ', your choice, wrong';
      else if (local.eliminated.has(i)) label += ', ruled out by hint';
      cell.setAttribute('aria-label', label);
      cell.setAttribute('aria-disabled', local.answered || local.eliminated.has(i) ? 'true' : 'false');
    });
  }

  function select(i) {
    if (!api.canAct() || local.answered || local.eliminated.has(i)) return;
    finish(i);
  }

  function finish(i) {
    local.answered = true;
    local.selected = i;
    render();
    const correct = i === p.oddIndex;
    api.done(correct, correct ? '' : `${i === null ? "Time's up! " : ''}${p.explanation}`);
  }

  render();
  ctx.ui.status('Tap the one that’s different');
  api.startClock();
  return {
    timeUp: () => finish(null),
    hintAvailable: () => p.items.filter((_, i) => i !== p.oddIndex && !local.eliminated.has(i)).length > 1,
    applyHint() {
      const candidates = p.items.map((_, i) => i).filter((i) => i !== p.oddIndex && !local.eliminated.has(i));
      if (candidates.length <= 1) return false;
      local.eliminated = new Set([...local.eliminated, ...ctx.random.shuffled(candidates).slice(0, Math.floor(candidates.length / 2))]);
      render();
      return true;
    },
  };
}

// ---------- Word Scramble: one long word, clue hidden until a hint ----------

function wordStage(s, api, ctx) {
  const answer = s.entry.word;
  const local = { tiles: s.letters.slice(), slots: Array(answer.length).fill(null), revealed: new Set(), clueVisible: false, status: 'typing' };
  const clue = h('div.ws-clue', { 'aria-live': 'polite' });
  const slotsEl = h('div.ws-slots', { role: 'group', 'aria-label': 'Your answer' });
  const tilesEl = h('div.ws-tiles', { role: 'group', 'aria-label': 'Letters' });
  const tool = (label, ic, fn) => h('button.btn.btn-secondary.btn-sm', { type: 'button', onclick: fn }, icon(ic), h('span', {}, label));
  const root = h('div.ws', {}, clue, slotsEl, tilesEl,
    h('div.ws-tools', {}, tool('Shuffle', 'shuffle', () => shuffle()), tool('Clear', 'backspace', () => clearSlots()), tool('Skip', 'skip_next', () => giveUp('Skipped.'))),
    h('p', { class: 'muted', style: { margin: 0, fontSize: '.85rem', textAlign: 'center' } }, 'Tip: you can type the letters. Backspace removes the last one.'));
  api.host.append(root);
  const accepts = () => api.canAct() && (local.status === 'typing' || local.status === 'wrong');
  const used = () => new Set(local.slots.filter((t) => t !== null));

  function render() {
    clear(clue).append(icon('lightbulb'), h('span', {}, local.clueVisible ? s.entry.clue : 'Clue hidden. Use a hint to reveal it.'));
    clue.classList.toggle('hidden-clue', !local.clueVisible);
    root.classList.toggle('solved', local.status === 'solved');
    root.classList.toggle('wrong', local.status === 'wrong');
    const focusedTile = Array.prototype.indexOf.call(tilesEl.children, document.activeElement);
    clear(slotsEl).append(...local.slots.map((t, i) => {
      const letter = t === null ? '' : local.tiles[t];
      const revealed = local.revealed.has(i);
      return h(`button.tile-btn.ws-slot${letter ? '.filled' : ''}${revealed ? '.revealed' : ''}`, {
        type: 'button',
        'aria-label': `Position ${i + 1}, ${letter ? `${letter}${revealed ? ', placed by hint' : ''}` : 'empty'}`,
        'aria-disabled': !letter || revealed ? 'true' : 'false',
        onclick: () => tapSlot(i),
      }, letter);
    }));
    const u = used();
    clear(tilesEl).append(...local.tiles.map((ch, i) => h(`button.tile-btn.ws-tile${u.has(i) ? '.used' : ''}`, {
      type: 'button', 'aria-label': u.has(i) ? `Letter ${ch}, placed` : `Letter ${ch}`, 'aria-disabled': u.has(i) ? 'true' : 'false',
      onclick: () => tapTile(i),
    }, ch)));
    if (focusedTile >= 0 && tilesEl.children[focusedTile]) tilesEl.children[focusedTile].focus();
    ctx.ui.status(local.status === 'wrong' ? 'Not quite. Tap letters to rearrange them.' : `${answer.length} letters`, local.status === 'wrong' ? 'bad' : null);
  }

  function tapTile(tile) {
    if (!accepts() || used().has(tile)) return;
    const slot = local.slots.indexOf(null);
    if (slot < 0) return;
    local.slots[slot] = tile;
    local.status = 'typing';
    render();
    check();
  }

  function tapSlot(slot) {
    if (!accepts() || local.revealed.has(slot) || local.slots[slot] === null) return;
    local.slots[slot] = null;
    local.status = 'typing';
    render();
  }

  function clearSlots() {
    if (!accepts()) return;
    local.slots = local.slots.map((t, i) => (local.revealed.has(i) ? t : null));
    local.status = 'typing';
    render();
  }

  function shuffle() {
    if (!accepts()) return;
    const order = ctx.random.shuffled(local.tiles.map((_, i) => i));
    const newIndexOf = new Map(order.map((oldIdx, newIdx) => [oldIdx, newIdx]));
    local.slots = local.slots.map((t) => (t === null ? null : newIndexOf.get(t)));
    local.tiles = order.map((i) => local.tiles[i]);
    render();
  }

  function check() {
    if (local.slots.some((t) => t === null)) return;
    if (isCorrect(answer, local.slots.map((t) => local.tiles[t]).join(''))) {
      local.status = 'solved';
      render();
      ctx.ui.status('');
      api.done(true, `${answer}!`);
    } else {
      local.status = 'wrong';
      render();
      ctx.announce('Not quite.');
    }
  }

  function giveUp(prefix) {
    if (local.status === 'solved' || local.status === 'over') return;
    if (prefix === 'Skipped.' && !accepts()) return;
    local.status = 'over';
    ctx.ui.status('');
    api.done(false, `${prefix} The word was ${answer}.`);
  }

  render();
  api.startClock();
  ctx.announce(`${answer.length} letters: ${local.tiles.join(' ')}.`);
  return {
    timeUp: () => giveUp("Time's up!"),
    hintAvailable: () => accepts() && (!local.clueVisible || local.revealed.size < answer.length - 1),
    /** First shows the clue; after that places the next letter for good (never the last one). */
    applyHint() {
      if (!accepts()) return false;
      if (!local.clueVisible) {
        local.clueVisible = true;
        render();
        return true;
      }
      let position = -1;
      for (let i = 0; i < answer.length; i++) if (!local.revealed.has(i)) { position = i; break; }
      if (position < 0 || local.revealed.size >= answer.length - 1) return false;
      const locked = new Set([...local.revealed].map((i) => local.slots[i]).filter((t) => t !== null));
      const tile = local.tiles.findIndex((ch, i) => ch === answer[position] && !locked.has(i));
      if (tile < 0) return false;
      const prev = local.slots.indexOf(tile);
      if (prev >= 0) local.slots[prev] = null;
      local.slots[position] = tile;
      local.revealed = new Set([...local.revealed, position]);
      local.status = 'typing';
      render();
      check();
      return true;
    },
    onKey(e) {
      if (!accepts()) return false;
      if (e.key === 'Backspace') {
        for (let i = local.slots.length - 1; i >= 0; i--) if (local.slots[i] !== null && !local.revealed.has(i)) { tapSlot(i); break; }
        return true;
      }
      if (/^[a-z]$/i.test(e.key)) {
        const u = used();
        const tile = local.tiles.findIndex((c, i) => c === e.key.toUpperCase() && !u.has(i));
        if (tile >= 0) tapTile(tile);
        return true;
      }
      return false;
    },
  };
}

// ---------- Memory Matrix: watch 6 tiles, repeat them in order ----------

function matrixStage(s, api, ctx) {
  const n = DAILY_MATRIX.gridSize;
  const local = { stage: 'showing', lit: null, tapped: [], wrong: null, token: 0 };
  const grid = h('div.mx-grid', { role: 'group', 'aria-label': 'Tiles', style: { 'grid-template-columns': `repeat(${n}, 1fr)` } });
  const cells = Array.from({ length: n * n }, (_, i) => h('button.tile-btn.mx-cell', { type: 'button', 'data-cell': i, onclick: () => tap(i) }));
  grid.append(...cells);
  gridKeys(grid, n);
  api.host.append(grid);

  function render() {
    cells.forEach((cell, i) => {
      let l = '';
      if (local.lit === i) l = 'lit';
      else if (local.tapped.includes(i)) l = 'found';
      else if (local.wrong === i) l = 'wrong';
      else if (local.stage === 'over' && s.pattern.includes(i)) l = 'missed';
      cell.className = `tile-btn mx-cell${l ? ` ${l}` : ''}`;
      clear(cell);
      if (l === 'found') cell.append(h('span.ord', {}, String(local.tapped.indexOf(i) + 1)));
      else if (l === 'missed') cell.append(h('span.ord', {}, String(s.pattern.indexOf(i) + 1)));
      else if (l) cell.append(icon({ lit: 'star', wrong: 'close' }[l]));
      const label = `Row ${Math.floor(i / n) + 1}, column ${(i % n) + 1}`;
      const state = { lit: 'lit', found: 'found', wrong: 'wrong', missed: 'was in the pattern' }[l];
      cell.setAttribute('aria-label', state ? `${label}, ${state}` : label);
      cell.setAttribute('aria-disabled', local.stage === 'input' ? 'false' : 'true');
    });
    if (local.stage === 'showing') ctx.ui.status('Watch closely…');
    else if (local.stage === 'input') ctx.ui.status(`Your turn: tap the ${s.pattern.length} tiles in order (${local.tapped.length}/${s.pattern.length})`);
    else ctx.ui.status('');
  }

  async function showSequence() {
    const token = ++local.token;
    api.stopClock();
    local.stage = 'showing';
    local.lit = null;
    render();
    ctx.announce(`Watch the ${s.pattern.length} tiles.`);
    await ctx.wait(500);
    for (const cell of s.pattern) {
      if (token !== local.token) return;
      local.lit = cell;
      render();
      await ctx.wait(DAILY_MATRIX.flashMs);
      local.lit = null;
      render();
      await ctx.wait(MATRIX_GAP_MS);
    }
    if (token !== local.token || local.stage === 'over') return;
    local.stage = 'input';
    render();
    api.startClock();
    ctx.announce(`Your turn. Tap ${s.pattern.length} tiles in order.`);
  }

  function tap(cell) {
    if (!api.canAct() || local.stage !== 'input') return;
    const result = checkTap(s.pattern, true, local.tapped, cell);
    if (result === Tap.IGNORED) return;
    if (result === Tap.WRONG) {
      local.wrong = cell;
      end(false, 'The numbered tiles show the pattern.');
      return;
    }
    local.tapped = [...local.tapped, cell];
    if (result === Tap.COMPLETE) end(true, 'Pattern repeated!');
    else render();
  }

  function end(correct, message) {
    local.stage = 'over';
    local.token++;
    render();
    api.done(correct, message);
  }

  render();
  showSequence();
  return {
    timeUp: () => end(false, "Time's up! The numbered tiles show the pattern."),
    hintAvailable: () => local.stage === 'input',
    /** Plays the pattern again; tiles already found stay found. */
    applyHint() {
      if (local.stage !== 'input') return false;
      showSequence();
      return true;
    },
  };
}

// ---------- Memory Match: find all 6 pairs ----------

function memoryStage(s, api, ctx) {
  const cards = s.cards.map((c) => ({ ...c }));
  const total = cards.length / 2;
  const local = { phase: 'preview', first: null, resolving: false, peeking: false, matched: 0, moves: 0 };
  const grid = h('div.mm-grid', { role: 'group', 'aria-label': 'Cards', style: { 'grid-template-columns': `repeat(${DAILY_MEMORY_COLUMNS}, 1fr)` } });
  const els = cards.map((card, i) => {
    const sym = SYMBOLS[card.symbol];
    const front = h('span.mm-face.mm-front', {}, icon(sym.icon));
    front.style.color = sym.color;
    return h('button.mm-card', { type: 'button', 'data-cell': i, onclick: () => flip(i) },
      h('span.mm-inner', {}, h('span.mm-face.mm-back', {}, icon('psychology')), front));
  });
  grid.append(...els);
  gridKeys(grid, DAILY_MEMORY_COLUMNS);
  api.host.append(grid);

  function render() {
    const all = local.phase === 'preview' || local.peeking || local.phase === 'over';
    cards.forEach((card, i) => {
      const up = card.faceUp || card.matched || all;
      els[i].classList.toggle('up', up);
      els[i].classList.toggle('matched', card.matched);
      const name = SYMBOLS[card.symbol].name;
      els[i].setAttribute('aria-label', `Card ${i + 1}, ${up ? `${name}${card.matched ? ', matched' : ''}` : 'hidden'}`);
      els[i].setAttribute('aria-disabled', local.phase !== 'playing' || card.faceUp || card.matched ? 'true' : 'false');
    });
    ctx.ui.status(local.phase === 'preview' ? 'Memorize the cards!' : local.phase === 'playing' ? `Pairs ${local.matched}/${total} · Moves ${local.moves}` : '');
  }

  function flip(i) {
    const card = cards[i];
    if (!api.canAct() || local.phase !== 'playing' || local.peeking || local.resolving || card.faceUp || card.matched) return;
    card.faceUp = true;
    if (local.first === null) {
      local.first = i;
      render();
      return;
    }
    const first = cards[local.first];
    local.first = null;
    local.moves++;
    if (first.symbol === card.symbol) {
      first.matched = true;
      card.matched = true;
      local.matched++;
      render();
      if (local.matched === total) {
        local.phase = 'over';
        api.done(true, `All ${total} pairs in ${local.moves} moves!`);
      }
    } else {
      local.resolving = true;
      render();
      ctx.wait(MISMATCH_REVEAL_MS).then(() => {
        first.faceUp = false;
        card.faceUp = false;
        local.resolving = false;
        if (local.phase === 'playing') render();
      });
    }
  }

  render();
  ctx.announce('Memorize the cards.');
  ctx.wait(DAILY_MEMORY_PREVIEW_MS).then(() => {
    if (local.phase !== 'preview') return;
    local.phase = 'playing';
    render();
    api.startClock();
    ctx.announce(`Find the ${total} pairs.`);
  });
  return {
    timeUp() {
      local.phase = 'over';
      render();
      api.done(false, `Time's up! You found ${local.matched} of ${total} pairs.`);
    },
    hintAvailable: () => local.phase === 'playing' && !local.peeking,
    /** Shows every card for a moment. */
    applyHint() {
      if (local.phase !== 'playing' || local.peeking) return false;
      local.peeking = true;
      render();
      ctx.wait(PEEK_MS).then(() => {
        local.peeking = false;
        if (local.phase === 'playing') render();
      });
      return true;
    },
  };
}

// ---------- Logic Path: one board ----------

function logicStage(s, api, ctx) {
  const p = s.puzzle;
  const local = { tiles: p.tiles, turns: p.tiles.map((t) => t.rotation), connected: connectedCells(p, p.tiles), solved: false };
  const wrap = h('div.lp-wrap', { role: 'group', 'aria-label': 'Pipe board' });
  wrap.style.gridTemplateColumns = `0.55fr repeat(${p.size}, 1fr) 0.55fr`;
  const tileEls = [];
  for (let r = 0; r < p.size; r++) {
    wrap.append(h(`span.lp-edge${r === p.startRow ? '.mark' : ''}`, { 'aria-hidden': 'true' }, r === p.startRow ? icon('arrow_forward') : null));
    for (let c = 0; c < p.size; c++) {
      const cell = r * p.size + c;
      const btn = h('button.tile-btn.lp-tile', { type: 'button', 'data-cell': cell, onclick: () => rotate(cell) }, pipeDrawing(local.tiles[cell].kind));
      tileEls.push(btn);
      wrap.append(btn);
    }
    wrap.append(h(`span.lp-edge${r === p.endRow ? '.mark' : ''}`, { 'aria-hidden': 'true' }, r === p.endRow ? icon('emoji_events') : null));
  }
  gridKeys(wrap, p.size);
  api.host.append(wrap);

  function render() {
    tileEls.forEach((btn, cell) => {
      const tile = local.tiles[cell];
      const on = local.connected.has(cell);
      btn.classList.toggle('on', on);
      btn.firstChild.style.transform = `rotate(${local.turns[cell] * 90}deg)`;
      if (tile.locked && !btn.querySelector('.lock')) btn.append(icon('lock', 'lock'));
      let label = `Row ${Math.floor(cell / p.size) + 1}, column ${(cell % p.size) + 1}, ${describe(tile)}`;
      if (on) label += ', connected to start';
      if (tile.locked) label += ', locked by hint';
      if (cell === p.startCell) label += ', start';
      if (cell === p.endCell) label += ', exit';
      btn.setAttribute('aria-label', label);
      btn.setAttribute('aria-disabled', tile.locked || local.solved ? 'true' : 'false');
    });
    wrap.classList.toggle('lp-solved', local.solved);
    ctx.ui.status(local.solved ? '' : `Link the arrow on row ${p.startRow + 1} to the trophy on row ${p.endRow + 1}`);
  }

  function update(tiles, cell, turnsBy) {
    local.tiles = tiles;
    local.turns[cell] += turnsBy;
    local.connected = connectedCells(p, tiles);
    if (isSolved(p, tiles)) local.solved = true;
    render();
    if (local.solved) api.done(true, 'Path connected!');
  }

  function rotate(cell) {
    const tile = local.tiles[cell];
    if (!api.canAct() || local.solved || tile.locked) return;
    const tiles = local.tiles.slice();
    tiles[cell] = rotated(tile);
    update(tiles, cell, 1);
  }

  render();
  api.startClock();
  ctx.announce(`Pipe board ${p.size} by ${p.size}. Start on row ${p.startRow + 1}, exit on row ${p.endRow + 1}.`);
  return {
    hintAvailable: () => !local.solved && misalignedPathCell(p, local.tiles) !== null,
    /** Turns one tile of the solution path into place and locks it. */
    applyHint() {
      const cell = misalignedPathCell(p, local.tiles);
      if (local.solved || cell === null) return false;
      const tile = local.tiles[cell];
      const turns = turnsToMatch(tile.kind, tile.rotation, rotateMask(tile.kind.baseMask, p.solution.get(cell)));
      if (turns === null) return false;
      const tiles = local.tiles.slice();
      tiles[cell] = { ...tile, rotation: (tile.rotation + turns) % 4, locked: true };
      update(tiles, cell, turns);
      return true;
    },
  };
}
