/**
 * Word Scramble rounds (WordScramble.kt). No two bank words are anagrams of each other and none
 * has a common English anagram, so each scramble has one intended answer.
 */
import { EASY, MEDIUM, HARD } from './word-bank.js';

export const WORDS_PER_ROUND = 8;
export const wordRoundTimeMs = (difficulty) => ({ EASY: 150000, MEDIUM: 165000, HARD: 180000 })[difficulty.name];

/** Hard hides the clue until the first hint; Easy and Medium show it up front. */
export const clueVisibleByDefault = (difficulty) => difficulty.name !== 'HARD';

const toEntries = (list) => list.map(([word, clue]) => ({ word, clue }));
const BANK = { EASY: toEntries(EASY), MEDIUM: toEntries(MEDIUM), HARD: toEntries(HARD) };
const ALL_WORDS = new Set([...EASY, ...MEDIUM, ...HARD].map(([w]) => w));

export const bank = (difficulty) => BANK[difficulty.name];

/** Words for one round, shortest first so the round ramps up gently. */
export function wordRound(difficulty, random) {
  return random.shuffled(bank(difficulty)).slice(0, WORDS_PER_ROUND)
    .sort((a, b) => a.word.length - b.word.length)
    .map((entry) => ({ entry, answer: entry.word, letters: scramble(entry.word, random) }));
}

/** Shuffles until the letters no longer spell the word (or any other word in the bank). */
export function scramble(word, random) {
  const letters = word.split('');
  if (new Set(letters).size === 1) return letters;
  for (let i = 0; i < 100; i++) {
    const shuffled = random.shuffled(letters);
    const text = shuffled.join('');
    // Also avoid leaving most letters in place, which gives the answer away.
    const inPlace = shuffled.filter((ch, idx) => ch === letters[idx]).length;
    if (text !== word && !ALL_WORDS.has(text) && inPlace <= Math.trunc(word.length / 2)) return shuffled;
  }
  const reversed = letters.slice().reverse();
  return reversed.join('') !== word ? reversed : random.shuffled(letters);
}

const signature = (s) => s.toUpperCase().split('').sort().join('');

/** True if [guess] spells the word, or a bank word that is an anagram of it. */
export function isCorrect(target, guess) {
  const g = guess.toUpperCase();
  if (g === target.toUpperCase()) return true;
  return ALL_WORDS.has(g) && signature(g) === signature(target);
}
