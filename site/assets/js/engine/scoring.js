/**
 * Scoring rules from QuizConfig.kt (object Scoring). Kotlin does this maths in 32-bit floats,
 * so every float step goes through Math.fround to land on exactly the same points.
 */
const f = Math.fround;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const idiv = (a, b) => Math.trunc(a / b);

const BASE_POINTS = 100;

/** Base (scaled by difficulty) + speed bonus (up to +50%) + combo bonus (+10 per streak, capped). */
export function pointsFor(difficulty, speedFraction, combo) {
  const base = f(BASE_POINTS * difficulty.multiplier);
  const speed = f(f(base * f(0.5)) * f(clamp01(f(speedFraction))));
  const comboBonus = Math.min(Math.max(combo, 1) - 1, 10) * 10;
  return Math.trunc(f(base + speed)) + comboBonus;
}

/** Memory Matrix: each cleared round is worth more the longer the sequence; a hint halves it. */
export function matrixRound(difficulty, length, usedHint) {
  const points = Math.trunc(f(length * 25 * difficulty.multiplier));
  return usedHint ? idiv(points, 2) : points;
}

/** Logic Path: bigger grids score more, minus taps beyond par, slow solves and hints. */
export function logicPath(difficulty, size, par, taps, durationMs, hintsUsed) {
  const base = Math.trunc(f(size * size * 12 * difficulty.multiplier));
  const extraTaps = Math.max(taps - par, 0);
  const seconds = idiv(durationMs, 1000);
  const raw = base - extraTaps * 4 - seconds * 2 - idiv(hintsUsed * base, 4);
  return Math.max(raw, idiv(base, 4));
}

/** Word Scramble: longer words score more; hints and wrong tries reduce it, with a floor. */
export function word(difficulty, length, hintsUsed, wrongAttempts, speedFraction) {
  const base = f(length * 20 * difficulty.multiplier);
  const speed = f(f(base * f(0.3)) * f(clamp01(f(speedFraction))));
  let raw = f(base + speed);
  raw = f(raw - f(f(hintsUsed * base) * f(0.25)));
  raw = f(raw - wrongAttempts * 10);
  return Math.max(Math.trunc(raw), Math.trunc(f(base / 5)));
}

/** Memory Match: rewards few moves and fast completion, never below a floor per pair. */
export function memoryScore(difficulty, pairs, moves, durationMs, hintsUsed) {
  const base = f(pairs * 120 * difficulty.multiplier);
  const extraMoves = Math.max(moves - pairs, 0);
  const seconds = f(f(durationMs) / 1000);
  let raw = f(base - extraMoves * 15);
  raw = f(raw - f(seconds * 3));
  raw = f(raw - hintsUsed * 50);
  return Math.max(Math.trunc(raw), pairs * 20);
}
