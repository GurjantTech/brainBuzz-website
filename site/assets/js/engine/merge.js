/**
 * 2048 Merge Challenge (website only). Tiles keep an id so the board can animate slides and merges.
 * A game is { tiles: [{ id, value, r, c }], score, nextId }. `random` is any () => [0, 1) function.
 */
export const N = 4;
export const WIN_VALUE = 2048;
export const DIRECTIONS = ['up', 'down', 'left', 'right'];

const key = (r, c) => r * N + c;

export function emptyCells(tiles) {
  const used = new Set(tiles.map((t) => key(t.r, t.c)));
  const out = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!used.has(key(r, c))) out.push({ r, c });
  return out;
}

/** Adds a 2 (90%) or a 4 (10%) on a random empty cell. Returns the new tile, or null if the board is full. */
export function spawn(game, random) {
  const free = emptyCells(game.tiles);
  if (!free.length) return null;
  const spot = free[Math.min(free.length - 1, Math.floor(random() * free.length))];
  const tile = { id: game.nextId++, value: random() < 0.9 ? 2 : 4, r: spot.r, c: spot.c };
  game.tiles.push(tile);
  return tile;
}

export function newGame(random) {
  const game = { tiles: [], score: 0, nextId: 1 };
  spawn(game, random);
  spawn(game, random);
  return game;
}

/** The cells of each line, ordered from the edge the tiles slide towards. */
function lines(dir) {
  const out = [];
  for (let i = 0; i < N; i++) {
    const line = [];
    for (let j = 0; j < N; j++) {
      if (dir === 'left') line.push([i, j]);
      if (dir === 'right') line.push([i, N - 1 - j]);
      if (dir === 'up') line.push([j, i]);
      if (dir === 'down') line.push([N - 1 - j, i]);
    }
    out.push(line);
  }
  return out;
}

/**
 * Slides every tile towards `dir`. Equal neighbours merge once per move: a tile made by a merge
 * can't merge again until the next move. Returns { moved, gained, tiles, merged, consumed } without
 * changing `game`; `consumed` are the tiles that slid into a merge (for the animation).
 */
export function slide(game, dir) {
  const at = new Map(game.tiles.map((t) => [key(t.r, t.c), t]));
  const tiles = [];
  const consumed = [];
  const merged = [];
  let nextId = game.nextId;
  let gained = 0;
  let moved = false;
  for (const line of lines(dir)) {
    const row = line.map(([r, c]) => at.get(key(r, c))).filter(Boolean);
    let slot = 0;
    let last = null; // last tile placed in this line, if it may still merge
    for (const t of row) {
      if (last && last.value === t.value) {
        const [r, c] = line[slot - 1];
        const made = { id: nextId++, value: t.value * 2, r, c };
        tiles[tiles.indexOf(last)] = made;
        consumed.push({ ...last.from, r, c }, { ...t, r, c });
        merged.push(made.id);
        gained += made.value;
        moved = true;
        last = null;
        continue;
      }
      const [r, c] = line[slot++];
      if (r !== t.r || c !== t.c) moved = true;
      const placed = { id: t.id, value: t.value, r, c, from: t };
      tiles.push(placed);
      last = placed;
    }
  }
  return {
    moved,
    gained,
    merged,
    consumed,
    tiles: tiles.map(({ id, value, r, c }) => ({ id, value, r, c })),
    nextId,
  };
}

/** Plays a move: slides, scores and, only if something moved, spawns a new tile. */
export function play(game, dir, random) {
  const res = slide(game, dir);
  if (!res.moved) return { moved: false, gained: 0, merged: [], consumed: [], spawned: null };
  game.tiles = res.tiles;
  game.nextId = res.nextId;
  game.score += res.gained;
  const spawned = spawn(game, random);
  return { moved: true, gained: res.gained, merged: res.merged, consumed: res.consumed, spawned };
}

export function canMove(tiles) {
  if (tiles.length < N * N) return true;
  const at = new Map(tiles.map((t) => [key(t.r, t.c), t.value]));
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const v = at.get(key(r, c));
      if ((c + 1 < N && at.get(key(r, c + 1)) === v) || (r + 1 < N && at.get(key(r + 1, c)) === v)) return true;
    }
  }
  return false;
}

export const maxTile = (tiles) => tiles.reduce((m, t) => Math.max(m, t.value), 0);

/** 16 numbers, row by row, 0 for empty: the saved form. */
export const toGrid = (tiles) => {
  const g = new Array(N * N).fill(0);
  for (const t of tiles) g[key(t.r, t.c)] = t.value;
  return g;
};

/** Rebuilds a game from a saved grid, or returns null if the data isn't a sensible board. */
export function fromGrid(grid, score) {
  if (!Array.isArray(grid) || grid.length !== N * N || !Number.isFinite(score) || score < 0) return null;
  const tiles = [];
  let nextId = 1;
  for (let i = 0; i < N * N; i++) {
    const v = grid[i];
    if (v === 0) continue;
    if (!Number.isInteger(v) || v < 2 || v > 131072 || (v & (v - 1)) !== 0) return null;
    tiles.push({ id: nextId++, value: v, r: Math.floor(i / N), c: i % N });
  }
  return tiles.length ? { tiles, score: Math.floor(score), nextId } : null;
}
