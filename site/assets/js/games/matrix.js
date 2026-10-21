/** Memory Matrix (MatrixViewModel.kt / MatrixScreen.kt). */
import { h, icon, clear, gridKeys } from '../lib/dom.js';
import { matrixRules, levelFor, nextLength, matrixPattern, checkTap, Tap, MATRIX_LIVES, MATRIX_MAX_ROUNDS } from '../engine/memory.js';
import { matrixRound } from '../engine/scoring.js';

const GAP_MS = 180;

export default {
  hintDescription: "Plays the sequence again. Tiles you've already found stay found.",
  create(ctx) {
    const rules = matrixRules(ctx.difficulty);
    const ui = ctx.ui;
    let length = rules.startLength;
    let bestLength = 0;
    let clearedRounds = 0;
    let played = 0;
    let hintThisRound = false;
    let results = '';
    let showToken = 0;
    const st = {
      stage: 'showing', round: 1, lives: MATRIX_LIVES, gridSize: levelFor(rules, length).gridSize,
      pattern: [], lit: null, tapped: [], wrong: null, lastCleared: null, lastPoints: 0, score: 0,
    };

    const grid = h('div.mx-grid', { role: 'group', 'aria-label': 'Tiles' });
    clear(ctx.board).append(grid);
    let cells = [];

    function buildGrid() {
      const n = st.gridSize;
      grid.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
      cells = Array.from({ length: n * n }, (_, i) => h('button.tile-btn.mx-cell', {
        type: 'button', 'data-cell': i, onclick: () => tap(i),
      }));
      clear(grid).append(...cells);
    }
    gridKeys(grid, () => st.gridSize);

    function look(i) {
      if (st.lit === i) return 'lit';
      if (st.tapped.includes(i)) return 'found';
      if (st.wrong === i) return 'wrong';
      if (st.stage === 'result' && st.lastCleared === false && st.pattern.includes(i)) return 'missed';
      return '';
    }

    function render() {
      if (cells.length !== st.gridSize * st.gridSize) buildGrid();
      const n = st.gridSize;
      cells.forEach((cell, i) => {
        const l = look(i);
        cell.className = `tile-btn mx-cell${l ? ` ${l}` : ''}`;
        clear(cell);
        const order = rules.ordered && l === 'found' ? st.tapped.indexOf(i) + 1 : null;
        if (order) cell.append(h('span.ord', {}, String(order)));
        else if (l) cell.append(icon({ lit: 'star', found: 'check', wrong: 'close', missed: 'visibility' }[l]));
        const label = `Row ${Math.floor(i / n) + 1}, column ${(i % n) + 1}`;
        const state = { lit: 'lit', found: 'found', wrong: 'wrong', missed: 'was in the pattern' }[l];
        cell.setAttribute('aria-label', state ? `${label}, ${state}` : label);
        cell.setAttribute('aria-disabled', st.stage === 'input' ? 'false' : 'true');
      });
      ui.score(st.score);
      ui.progress(`Round ${st.round}/${MATRIX_MAX_ROUNDS}`);
      ui.lives(st.lives, MATRIX_LIVES);
      if (st.stage === 'showing') ui.status('Watch closely…');
      else if (st.stage === 'input') ui.status(`Your turn: tap ${st.pattern.length} tiles${rules.ordered ? ' in order' : ''} (${st.tapped.length}/${st.pattern.length})`);
      else if (st.lastCleared) ui.status(`Cleared! +${st.lastPoints}`, 'good');
      else ui.status('Not quite. The outlined tiles were the pattern.', 'bad');
    }

    function playRound() {
      const level = levelFor(rules, length);
      Object.assign(st, {
        stage: 'showing', gridSize: level.gridSize, pattern: matrixPattern(level, ctx.random),
        tapped: [], wrong: null, lastCleared: null, lit: null,
      });
      hintThisRound = false;
      render();
      showSequence();
    }

    /** Lights the pattern one tile at a time, then hands control to the player. */
    async function showSequence() {
      const token = ++showToken;
      st.stage = 'showing';
      st.lit = null;
      render();
      ctx.announce(`Round ${st.round}. Watch the ${st.pattern.length} tiles.`);
      await ctx.wait(500);
      for (const cell of st.pattern) {
        if (token !== showToken) return;
        st.lit = cell;
        render();
        await ctx.wait(rules.flashMs);
        st.lit = null;
        render();
        await ctx.wait(GAP_MS);
      }
      if (token !== showToken) return;
      st.stage = 'input';
      render();
      ctx.announce(`Your turn. Tap ${st.pattern.length} tiles${rules.ordered ? ' in order' : ''}.`);
    }

    function tap(cell) {
      if (!ctx.canPlay || st.stage !== 'input') return;
      const result = checkTap(st.pattern, rules.ordered, st.tapped, cell);
      if (result === Tap.IGNORED) return;
      if (result === Tap.WRONG) {
        st.wrong = cell;
        endRound(false);
        return;
      }
      st.tapped = [...st.tapped, cell];
      if (result === Tap.COMPLETE) endRound(true);
      else render();
    }

    async function endRound(cleared) {
      played++;
      results += cleared ? '1' : '0';
      const points = cleared ? matrixRound(ctx.difficulty, st.pattern.length, hintThisRound) : 0;
      if (cleared) {
        clearedRounds++;
        bestLength = Math.max(bestLength, st.pattern.length);
      }
      Object.assign(st, {
        stage: 'result', lastCleared: cleared, lastPoints: points, score: st.score + points,
        lives: cleared ? st.lives : st.lives - 1,
      });
      render();
      ctx.announce(cleared ? `Cleared! Plus ${points}.` : `Not quite. ${st.lives} lives left.`);
      // A miss stays up longer so the player can see the full pattern.
      await ctx.wait(cleared ? 900 : 1800);
      if (st.lives <= 0 || st.round >= MATRIX_MAX_ROUNDS) {
        ctx.finish({
          score: st.score, correct: clearedRounds, total: played, durationMs: ctx.activePlayMs,
          bestCombo: bestLength, answerPattern: results,
        });
      } else {
        length = nextLength(rules, length, cleared);
        st.round++;
        playRound();
      }
    }

    buildGrid();
    render();
    ui.status('');

    return {
      start: playRound,
      hintAvailable: () => st.stage === 'input',
      applyHint() {
        if (st.stage !== 'input') return false;
        hintThisRound = true;
        showSequence();
        return true;
      },
    };
  },
};
