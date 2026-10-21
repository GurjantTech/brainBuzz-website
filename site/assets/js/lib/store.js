/**
 * Browser-only progress: best scores, last difficulty, Daily Challenge results and, under `web`,
 * the website-only games' records (2048 board, Word Detective days and stats, Sudoku progress).
 * Lives in localStorage on this device only; it never syncs with the Android app.
 * Every access is guarded so private windows or blocked storage just mean "no saved data".
 */
const KEY = 'bb-progress-v1';
const DAILY_DAYS_KEPT = 14;

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : null;
    if (data && typeof data === 'object') {
      const out = { bests: {}, last: {}, daily: {}, web: {}, ...data };
      if (!out.web || typeof out.web !== 'object' || Array.isArray(out.web)) out.web = {};
      return out;
    }
  } catch (e) { /* unavailable or corrupt: start fresh */ }
  return { bests: {}, last: {}, daily: {}, web: {} };
}

function write(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    return false;
  }
}

export function bestScore(type, difficulty) {
  const v = read().bests[type];
  return v && Number.isFinite(v[difficulty]) ? v[difficulty] : null;
}

/** Highest best across difficulties, for game cards. */
export function topScore(type) {
  const v = read().bests[type] || {};
  const scores = Object.values(v).filter(Number.isFinite);
  return scores.length ? Math.max(...scores) : null;
}

/** Records a finished game. Returns { isBest, previous }. */
export function recordScore(type, difficulty, score) {
  const data = read();
  const forType = data.bests[type] || (data.bests[type] = {});
  const previous = Number.isFinite(forType[difficulty]) ? forType[difficulty] : null;
  const isBest = previous === null || score > previous;
  if (isBest) forType[difficulty] = score;
  write(data);
  return { isBest, previous };
}

export function lastDifficulty(type) {
  return read().last[type] || null;
}

export function rememberDifficulty(type, difficulty) {
  const data = read();
  data.last[type] = difficulty;
  write(data);
}

export function dailyResult(epochDay) {
  return read().daily[epochDay] || null;
}

export function recordDaily(epochDay, result) {
  const data = read();
  data.daily[epochDay] = result;
  // Keep only recent days so storage stays tiny.
  for (const day of Object.keys(data.daily)) if (Number(day) < epochDay - DAILY_DAYS_KEPT) delete data.daily[day];
  return write(data);
}

/**
 * A website-only game's own record (always an object). Each game validates what it reads,
 * so missing, old or hand-edited data just means starting fresh.
 */
export function webData(game) {
  const v = read().web[game];
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
}

export function saveWebData(game, value) {
  const data = read();
  data.web[game] = value;
  return write(data);
}
