/** Logic Path (LogicPathViewModel.kt / LogicPathScreen.kt). */
import { h, icon, clear, gridKeys } from '../lib/dom.js';
import {
  logicRules, generatePath, connectedCells, isSolved, misalignedPathCell, turnsToMatch, rotateMask, rotated, Dir,
} from '../engine/logic-path.js';
import { logicPath as logicScore } from '../engine/scoring.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const ENDS = { [Dir.N]: [50, 0], [Dir.E]: [100, 50], [Dir.S]: [50, 100], [Dir.W]: [0, 50] };
const DIR_NAMES = { [Dir.N]: 'up', [Dir.E]: 'right', [Dir.S]: 'down', [Dir.W]: 'left' };

function svg(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

/** The pipe drawn unrotated; the whole drawing turns, which keeps the animation smooth. */
export function pipeDrawing(kind) {
  const root = svg('svg', { viewBox: '0 0 100 100', 'aria-hidden': 'true', focusable: 'false' });
  for (const d of [Dir.N, Dir.E, Dir.S, Dir.W]) {
    if (kind.baseMask & d) {
      const [x, y] = ENDS[d];
      root.appendChild(svg('line', { class: 'pipe', x1: 50, y1: 50, x2: x, y2: y, 'stroke-width': 22 }));
    }
  }
  root.appendChild(svg('circle', { class: 'hub', cx: 50, cy: 50, r: 11 }));
  root.appendChild(svg('circle', { class: 'core', cx: 50, cy: 50, r: 5.5 }));
  return root;
}

export function describe(tile) {
  const mask = rotateMask(tile.kind.baseMask, tile.rotation);
  const openings = [Dir.N, Dir.E, Dir.S, Dir.W].filter((d) => mask & d).map((d) => DIR_NAMES[d]);
  return `${tile.kind.label} pipe, open ${openings.join(' and ')}`;
}

export default {
  roundTimeMs: (d) => logicRules(d).roundTimeMs,
  hintDescription: 'Turns one tile of the path into place and locks it.',
  create(ctx) {
    const ui = ctx.ui;
    const d = ctx.difficulty;
    const rules = logicRules(d);
    let solvedCount = 0;
    let totalTaps = 0;
    let boardStartedAt = 0;
    let hintsThisBoard = 0;
    let results = '';
    let ended = false;
    const st = { puzzle: null, tiles: [], turns: [], connected: new Set(), index: 0, solved: false, score: 0, taps: 0 };

    const wrap = h('div.lp-wrap', { role: 'group', 'aria-label': 'Pipe board' });
    clear(ctx.board).append(wrap);
    gridKeys(wrap, () => rules.size);
    let tileEls = [];

    function buildBoard() {
      const { size, startRow, endRow } = st.puzzle;
      wrap.style.gridTemplateColumns = `0.55fr repeat(${size}, 1fr) 0.55fr`;
      clear(wrap);
      wrap.classList.remove('lp-solved');
      tileEls = [];
      for (let r = 0; r < size; r++) {
        wrap.append(h(`span.lp-edge${r === startRow ? '.mark' : ''}`, { 'aria-hidden': 'true' }, r === startRow ? icon('arrow_forward') : null));
        for (let c = 0; c < size; c++) {
          const cell = r * size + c;
          const tile = st.tiles[cell];
          const btn = h('button.tile-btn.lp-tile', { type: 'button', 'data-cell': cell, onclick: () => rotate(cell) }, pipeDrawing(tile.kind));
          tileEls.push(btn);
          wrap.append(btn);
        }
        wrap.append(h(`span.lp-edge${r === endRow ? '.mark' : ''}`, { 'aria-hidden': 'true' }, r === endRow ? icon('emoji_events') : null));
      }
    }

    function render() {
      const { size, startRow, endRow } = st.puzzle;
      tileEls.forEach((btn, cell) => {
        const tile = st.tiles[cell];
        const on = st.connected.has(cell);
        btn.classList.toggle('on', on);
        btn.firstChild.style.transform = `rotate(${st.turns[cell] * 90}deg)`;
        if (tile.locked && !btn.querySelector('.lock')) btn.append(icon('lock', 'lock'));
        const r = Math.floor(cell / size);
        const c = cell % size;
        let label = `Row ${r + 1}, column ${c + 1}, ${describe(tile)}`;
        if (on) label += ', connected to start';
        if (tile.locked) label += ', locked by hint';
        if (cell === st.puzzle.startCell) label += ', start';
        if (cell === st.puzzle.endCell) label += ', exit';
        btn.setAttribute('aria-label', label);
        btn.setAttribute('aria-disabled', tile.locked || st.solved ? 'true' : 'false');
      });
      wrap.setAttribute('aria-label', `Pipe board ${size} by ${size}. Start on row ${startRow + 1} at the left, exit on row ${endRow + 1} at the right.`);
      ui.score(st.score);
      ui.progress(`Board ${st.index + 1}/${rules.puzzles}`);
      if (st.solved) ui.status(`Solved! +${st.lastPoints}`, 'good');
      else ui.status(`Link the arrow on row ${startRow + 1} to the trophy on row ${endRow + 1}`);
    }

    function loadBoard(index) {
      const puzzle = generatePath(d, index, ctx.random);
      boardStartedAt = ctx.activePlayMs;
      hintsThisBoard = 0;
      Object.assign(st, {
        puzzle, tiles: puzzle.tiles, turns: puzzle.tiles.map((t) => t.rotation),
        connected: connectedCells(puzzle, puzzle.tiles), index, solved: false, taps: 0,
      });
      buildBoard();
      render();
      ctx.announce(`Board ${index + 1} of ${rules.puzzles}.`);
    }

    function rotate(cell) {
      if (!ctx.canPlay || st.solved || !st.puzzle) return;
      const tile = st.tiles[cell];
      if (!tile || tile.locked) return;
      totalTaps++;
      const tiles = st.tiles.slice();
      tiles[cell] = rotated(tile);
      update(tiles, cell, 1, true);
    }

    function update(tiles, cell, turnsBy, tapped) {
      st.tiles = tiles;
      st.turns[cell] += turnsBy;
      st.connected = connectedCells(st.puzzle, tiles);
      if (tapped) st.taps++;
      render();
      if (isSolved(st.puzzle, tiles)) onSolved();
    }

    async function onSolved() {
      solvedCount++;
      results += '1';
      const p = st.puzzle;
      st.lastPoints = logicScore(d, p.size, p.par, st.taps, ctx.activePlayMs - boardStartedAt, hintsThisBoard);
      st.solved = true;
      st.score += st.lastPoints;
      wrap.classList.add('lp-solved');
      render();
      ctx.announce(`Solved! Plus ${st.lastPoints}.`);
      await ctx.wait(1100);
      const next = st.index + 1;
      if (next >= rules.puzzles) finishGame(); else loadBoard(next);
    }

    function finishGame() {
      if (ended) return;
      ended = true;
      while (results.length < rules.puzzles) results += '0';
      ctx.finish({
        score: st.score, correct: solvedCount, total: rules.puzzles, durationMs: ctx.activePlayMs,
        moves: totalTaps, answerPattern: results,
      });
    }

    return {
      start: () => loadBoard(0),
      onTimeUp() {
        ui.feedback("Time's up!", 'bad');
        ctx.announce("Time's up!");
        finishGame();
      },
      hintAvailable: () => !!st.puzzle && !st.solved && misalignedPathCell(st.puzzle, st.tiles) !== null,
      /** Turns one tile of the solution path into place and locks it. */
      applyHint() {
        if (!st.puzzle || st.solved) return false;
        const cell = misalignedPathCell(st.puzzle, st.tiles);
        if (cell === null) return false;
        const tile = st.tiles[cell];
        const target = rotateMask(tile.kind.baseMask, st.puzzle.solution.get(cell));
        const turns = turnsToMatch(tile.kind, tile.rotation, target);
        if (turns === null) return false;
        hintsThisBoard++;
        const tiles = st.tiles.slice();
        tiles[cell] = { ...tile, rotation: (tile.rotation + turns) % 4, locked: true };
        update(tiles, cell, turns, false);
        return true;
      },
    };
  },
};
