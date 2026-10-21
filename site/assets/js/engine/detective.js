/**
 * Word Detective (website only): find the hidden five-letter word in six guesses.
 * The daily word comes from a fixed start date and the bundled answer list, so it is the same in every
 * browser on the same local date, and never changes on reload.
 */
import { ANSWERS, GUESSES } from './detective-words.js';

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;
/** Puzzle #1 was 1 October 2026 (an epoch day, like todayEpochDay()). */
export const START_DAY = Date.UTC(2026, 9, 1) / 86400000;

export const puzzleNumber = (epochDay) => epochDay - START_DAY + 1;
export function dailyAnswer(epochDay) {
  const n = ANSWERS.length;
  return ANSWERS[(((epochDay - START_DAY) % n) + n) % n].toUpperCase();
}

let valid = null;
export function isValidGuess(word) {
  if (!valid) valid = new Set([...ANSWERS, ...GUESSES]);
  return typeof word === 'string' && word.length === WORD_LENGTH && valid.has(word.toLowerCase());
}

/** A practice word that isn't today's. `random` is () => [0, 1). */
export function practiceAnswer(random, avoid = '') {
  let w = avoid;
  for (let i = 0; i < 10 && w === avoid; i++) w = ANSWERS[Math.floor(random() * ANSWERS.length)].toUpperCase();
  return w;
}

/**
 * Marks each letter 'correct' (right place), 'present' (elsewhere in the word) or 'absent'.
 * Repeated letters only count as often as they appear in the answer, exact matches first:
 * answer ROBOT, guess FLOOR → F absent, L absent, O present, O correct, R present.
 */
export function score(answer, guess) {
  const marks = new Array(WORD_LENGTH).fill('absent');
  const left = {};
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === answer[i]) marks[i] = 'correct';
    else left[answer[i]] = (left[answer[i]] || 0) + 1;
  }
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (marks[i] !== 'correct' && left[guess[i]] > 0) {
      marks[i] = 'present';
      left[guess[i]]--;
    }
  }
  return marks;
}

const RANK = { absent: 1, present: 2, correct: 3 };
/** Best-known state of each letter for the on-screen keyboard. */
export function letterStates(answer, guesses) {
  const out = {};
  for (const g of guesses) {
    score(answer, g).forEach((m, i) => {
      if (!out[g[i]] || RANK[m] > RANK[out[g[i]]]) out[g[i]] = m;
    });
  }
  return out;
}

export const emptyStats = () => ({ played: 0, won: 0, streak: 0, maxStreak: 0, lastDay: null, lastWonDay: null, dist: [0, 0, 0, 0, 0, 0] });

/** Cleans stored stats; anything missing or odd falls back to zero. */
export function normalizeStats(s) {
  const e = emptyStats();
  if (!s || typeof s !== 'object') return e;
  const n = (v) => (Number.isInteger(v) && v >= 0 ? v : 0);
  const day = (v) => (Number.isInteger(v) ? v : null);
  return {
    played: n(s.played),
    won: Math.min(n(s.won), n(s.played)),
    streak: n(s.streak),
    maxStreak: Math.max(n(s.maxStreak), n(s.streak)),
    lastDay: day(s.lastDay),
    lastWonDay: day(s.lastWonDay),
    dist: Array.isArray(s.dist) && s.dist.length === MAX_GUESSES ? s.dist.map(n) : e.dist,
  };
}

/**
 * Adds a finished daily puzzle to the stats. A day can only count once: finishing (or replaying)
 * a day that's already recorded, or an older one, returns the stats unchanged.
 */
export function recordDaily(stats, epochDay, won, guessCount) {
  const s = normalizeStats(stats);
  if (s.lastDay !== null && epochDay <= s.lastDay) return s;
  s.played++;
  s.lastDay = epochDay;
  if (won) {
    s.won++;
    s.streak = s.lastWonDay === epochDay - 1 ? s.streak + 1 : 1;
    s.maxStreak = Math.max(s.maxStreak, s.streak);
    s.lastWonDay = epochDay;
    if (guessCount >= 1 && guessCount <= MAX_GUESSES) s.dist[guessCount - 1]++;
  } else {
    s.streak = 0;
  }
  return s;
}

/** The streak as it stands today: it lapses once a day goes by without a win. */
export const currentStreak = (stats, today) =>
  (stats.lastWonDay !== null && stats.lastWonDay >= today - 1 ? stats.streak : 0);

const EMOJI = { correct: '🟩', present: '🟨', absent: '⬜' };

/** Spoiler-free result: puzzle number, guess count and coloured squares, never the letters. */
export function shareText(epochDay, answer, guesses, won, url) {
  const rows = guesses.map((g) => score(answer, g).map((m) => EMOJI[m]).join(''));
  return `BrainBuzz Word Detective #${puzzleNumber(epochDay)} ${won ? guesses.length : 'X'}/${MAX_GUESSES}\n${rows.join('\n')}\n${url}`;
}
