/** Mounts the game named by the stage's data-game attribute. */
import { mountShell } from './shell.js';
import { gameByType } from '../engine/models.js';
import { h, icon, clear } from '../lib/dom.js';

const loaders = {
  DAILY: () => import('./daily.js').then((m) => m.default),
  MATH: () => import('./quiz.js').then((m) => m.quizGame('MATH')),
  SEQUENCE: () => import('./quiz.js').then((m) => m.quizGame('SEQUENCE')),
  MATRIX: () => import('./matrix.js').then((m) => m.default),
  MEMORY: () => import('./memory.js').then((m) => m.default),
  LOGIC_PATH: () => import('./logic.js').then((m) => m.default),
  ODD_ONE_OUT: () => import('./odd.js').then((m) => m.default),
  WORD_SCRAMBLE: () => import('./word.js').then((m) => m.default),
  // Website-only games bring their own frame instead of the timed shell.
  MERGE: () => import('./merge.js').then((m) => m.default),
  DETECTIVE: () => import('./detective.js').then((m) => m.default),
  SUDOKU: () => import('./sudoku.js').then((m) => m.default),
};

const stage = document.getElementById('game');
const meta = stage && gameByType(stage.dataset.game);
if (stage && meta && loaders[meta.type]) {
  loaders[meta.type]()
    .then((impl) => (meta.web ? impl.mount(stage, meta) : mountShell(stage, meta, impl)))
    .catch((err) => {
      console.error(err);
      clear(stage).append(h('div.stage-loading', {},
        icon('cancel'),
        h('p', {}, `Sorry, ${meta.title} couldn’t load. Check your connection and try again.`),
        h('button.btn.btn-primary', { type: 'button', onclick: () => location.reload() }, icon('refresh'), h('span', {}, 'Reload'))));
    });
}
