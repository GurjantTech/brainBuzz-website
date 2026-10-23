/**
 * Per-game page copy. Every number here follows the game rules in assets/js/engine
 * (ported from the Android app), so keep them in sync if the rules change.
 */
export const GAME_COPY = {
  DAILY: {
    metaTitle: 'Daily Challenge: 12 Free Hard Brain Puzzles Every Day',
    description: 'Play today’s BrainBuzz Daily Challenge free in your browser: 12 hard puzzles from all seven brain games, with a new set every midnight.',
    intro: [
      'The Daily Challenge is a fresh set of 12 Hard puzzles every day, taken from all seven games and shuffled so the same game never comes twice in a row: two quick maths sums, two number patterns, two Odd One Out grids, two 7–8 letter Word Scrambles with the clue hidden, two Memory Matrix patterns of 6 tiles to repeat in order, one Memory Match board of 6 pairs and one 5×5 Logic Path board.',
      'Each puzzle has its own clock: 20 seconds for sums, patterns, odd ones out and memory tiles (the clock starts after the tiles have flashed), 40 seconds for a word, 45 seconds for the card pairs (after the preview) and 60 seconds for the pipe board.',
      'Everyone gets the same puzzles on the same date, including players in the BrainBuzz Android app, so it’s a fair way to compare scores with friends. A new set arrives at midnight, your local time.',
    ],
    scoring: 'Each solved puzzle is worth 200 points. You get up to 50% more the more time you have left, plus +10 for every answer in a row (up to +100).',
    hint: 'You have 2 hints for the whole challenge. A hint helps with the puzzle in front of you: it removes two wrong answers (and shows a pattern’s rule), rules out half the odd-one-out grid, shows the hidden clue or places a letter, replays the tiles, shows every card, or turns one pipe into place.',
    tips: [
      'Save your hints for the puzzles you find hardest; they’re shared across all 12.',
      'A miss resets your combo, so a careful answer beats a rushed guess.',
      'You can play the Daily Challenge once a day in each browser. Your result stays until the next set arrives.',
    ],
  },
  MATRIX: {
    metaTitle: 'Memory Matrix: Free Visual Memory Game Online',
    description: 'Play Memory Matrix free: watch the tiles light up, then tap them back. Patterns grow every round. 3 lives, 10 rounds, 100 levels. No sign-up.',
    intro: [
      'Memory Matrix tests your visual short-term memory. Tiles light up one at a time; when they go dark, tap the same tiles. Clear a round and the next pattern is one tile longer, and the grid grows as the patterns do.',
      'Miss and you lose one of your three lives, but the next pattern gets a tile shorter so you can recover. The game ends after 10 rounds or when your lives run out. Level 1 starts with 2 tiles on a 3×3 grid; higher levels start with longer patterns on bigger grids and flash faster, and from level 41 you must also repeat the tiles in the order they lit up.',
    ],
    scoring: 'A cleared round scores 25 points per tile, multiplied by the level bonus: ×1 at level 1, rising to ×2 at level 100. A missed round scores nothing. Using a hint replays the pattern but halves that round’s points.',
    hint: 'You have 3 hints. Each one plays the pattern again; tiles you’ve already found stay found.',
    tips: [
      'Group the tiles into shapes such as lines, corners or an L instead of remembering single squares.',
      'From level 41, say the order to yourself: “top left, middle, bottom right”.',
      'When you miss, the whole pattern stays on screen for a moment. Use it to see what tripped you up.',
    ],
  },
  MEMORY: {
    metaTitle: 'Memory Match: Free Card Pairs Memory Game',
    description: 'Play Memory Match free in your browser. Memorise the cards during the preview, then flip two at a time to find every pair in as few moves as you can.',
    intro: [
      'Memory Match is the classic pairs game. Every card is shown face up for a short preview (2.6 seconds at level 1, down to 0.8 seconds at level 100), then they all flip over.',
      'Turn over two cards at a time; matching cards stay face up. Find every pair as quickly as you can, in as few moves as possible: 3 pairs at level 1, growing to 12 pairs at level 100.',
    ],
    scoring: 'You start with 120 points per pair, multiplied by the level bonus (×1 at level 1, rising to ×2 at level 100). Every move beyond one per pair costs 15 points, every second costs 3 and every hint 50, but you always keep at least 20 points per pair. A move is two cards turned over.',
    hint: 'You have 2 hints. Each one shows every card for 1.5 seconds.',
    tips: [
      'During the preview, pick out two or three pairs and lock them in rather than trying to remember everything.',
      'Turn over a card you haven’t seen yet before guessing at one you half remember.',
      'Say the symbols out loud in your head (“sun, rocket, bee”) to remember positions better.',
    ],
  },
  LOGIC_PATH: {
    metaTitle: 'Logic Path: Free Pipe Rotation Puzzle Game',
    description: 'Play Logic Path free: rotate the pipe tiles to link the start arrow to the goal. 3 boards against the clock, 100 levels from 4×4 to 7×7 with decoy T-pieces.',
    intro: [
      'Logic Path is a pipe-rotation puzzle. Tap any tile to turn it a quarter turn clockwise and link the arrow on the left edge to the flag on the right. Pipes connected to the start light up and show a dot, so you can see how far your path reaches.',
      'Solve 3 boards before the clock runs out. Boards are 4×4 up to level 25, 5×5 up to level 60, 6×6 up to level 90 and 7×7 after that, and the clock gets shorter as you climb. Each board has a longer, twistier path than the one before, and from level 16 decoy T-pieces join in to mislead you, more of them the higher you go.',
    ],
    scoring: 'Each board is worth 12 points per tile, multiplied by the level bonus (×1 at level 1, rising to ×2 at level 100), so a level 1 board is worth 192 points. You lose 4 points for each tap beyond the fewest needed, 2 per second and a quarter of the board’s value per hint, but always keep at least a quarter.',
    hint: 'You have 3 hints. Each one turns a tile on the solution path into place and locks it.',
    tips: [
      'Work backwards from the exit as well as forwards from the start; the two routes meet in the middle.',
      'Corners decide where the path turns. Straights just fill the gaps between them.',
      'Tiles away from the path don’t matter, so don’t spend taps tidying them up.',
    ],
  },
  ODD_ONE_OUT: {
    metaTitle: 'Odd One Out: Free Visual Puzzle Game',
    description: 'Play Odd One Out free: spot the shape, arrow, mirrored letter or number that doesn’t belong. 12 timed grids, 100 levels, no sign-up needed.',
    intro: [
      'Odd One Out trains your visual attention. Every grid has exactly one item that doesn’t match: a different shape, size or direction, a mirrored letter, or a number that breaks the rule the others follow, such as all being even or all being multiples of 7.',
      'Find it before the timer runs out: 16 seconds per grid at level 1, down to 8 seconds at level 100. There are 12 grids, with 9 items on the first levels growing to 20 on the highest, and the second half of the round gets trickier.',
    ],
    scoring: 'A correct answer scores 100 points at level 1, rising to 200 at level 100, up to 50% more the faster you answer, plus +10 for every answer in a row (up to +100).',
    hint: 'You have 3 hints. Each one rules out about half of the remaining wrong items.',
    tips: [
      'Look at the whole grid at once rather than checking items one by one; the odd one often “pops out”.',
      'For arrows, follow the tip, not the shaft. On the highest levels the odd one may only be turned 45°.',
      'For numbers, check even or odd first, then try the times tables: 3, 4, 5, 6, 7 and 9.',
    ],
  },
  WORD_SCRAMBLE: {
    metaTitle: 'Word Scramble: Free Unscramble the Word Game',
    description: 'Play Word Scramble free: unscramble words using the clues, from 4-letter words at level 1 to 8-letter words at level 100. Tap or type to play.',
    intro: [
      'Word Scramble gives you jumbled words to unscramble, shortest first: 5 words on the first levels, 8 from level 25. Tap the letter tiles to spell the word, or just type on your keyboard. Tap a placed letter to send it back.',
      'Levels 1 to 12 use 4-letter words, up to level 33 words have 4–5 letters, up to level 66 they have 6 and after that 7–8. Every word shows a clue until level 80; from there the clue stays hidden until you use a hint. The clock for the whole round gets shorter per word as you climb.',
    ],
    scoring: 'Each word is worth 20 points per letter, multiplied by the level bonus (×1 at level 1, rising to ×2 at level 100), with up to 30% more for solving it quickly. Each hint costs a quarter of the word’s value and each wrong try 10 points, with a minimum of a fifth of the value. Skipped words score nothing.',
    hint: 'You have 6 hints for the round. A hint shows the clue if it’s hidden, otherwise it places the next letter for you (never the last one).',
    tips: [
      'Start with common endings such as -ER, -ET, -LE and -ING, or a likely first letter.',
      'Use Shuffle. Seeing the letters in a new order often makes the word jump out.',
      'Stuck for more than a few seconds? Skip, because the clock is shared by every word in the round.',
    ],
  },
  SEQUENCE: {
    metaTitle: 'Number Sequence Master: Free Number Pattern Puzzles',
    description: 'Play Number Sequence Master free: find the next number in 10 patterns, from simple steps to primes, cubes and Fibonacci. Timed, 100 levels.',
    intro: [
      'Number Sequence Master shows you five numbers that follow a rule. Work out the rule and pick the number that comes next from four choices. There are 10 patterns, with 30 seconds each at level 1, down to 10 seconds at level 100.',
      'Levels 1 to 33 use steady steps and doubling. Levels 34 to 66 add multiplying, growing gaps, square numbers and alternating steps. From level 67 come Fibonacci-style sums, cubes, triangular numbers, primes and mixed operations. After each answer you’ll see the rule.',
    ],
    scoring: 'A correct answer scores 100 points at level 1, rising to 200 at level 100, up to 50% more for the time you have left, plus +10 for every answer in a row (up to +100).',
    hint: 'You have 3 hints. Each one removes two wrong answers and shows the rule.',
    tips: [
      'Write down, or picture, the gaps between neighbours. If the gaps change, look at the gaps between the gaps.',
      'Numbers that grow very fast usually mean multiplying, squaring or cubing.',
      'If the numbers zig-zag, there are probably two rules taking turns.',
    ],
  },
  MATH: {
    metaTitle: 'Quick Math Rush: Free 60-Second Mental Maths Game',
    description: 'Play Quick Math Rush free: solve as many sums as you can in 60 seconds. 100 levels, sums that adapt to you, and combo bonuses for answers in a row.',
    intro: [
      'Quick Math Rush is a 60-second mental arithmetic sprint. Answer as many sums as you can. Level 1 is small additions and subtractions; times tables join at level 8, division at 20, two-step sums at 45 and squares at 60, and the numbers keep growing up to level 100.',
      'The sums follow you. Four correct answers in a row make them 5 levels harder and two misses in a row make them 5 levels easier, but never more than 10 levels away from the level you chose. Pass a level with at least 8 right answers and 60% accuracy.',
    ],
    scoring: 'Each correct answer scores at the level it was asked: 100 points at level 1, rising to 200 at level 100. Answer within about 6 seconds for up to 50% more, and build a combo for +10 per answer in a row (up to +100).',
    hint: 'You have 3 hints. Each one removes two wrong answers.',
    tips: [
      'Round and adjust: 49 + 36 is 50 + 36 − 1.',
      'Check the last digit first. It often rules out two of the four answers.',
      'Keep moving. The clock doesn’t stop between sums, and a miss only costs your combo.',
    ],
  },
  // Website-only games (not in the Android app).
  MERGE: {
    metaTitle: '2048 Merge Challenge: Free Number Tile Puzzle',
    description: 'Play 2048 Merge Challenge free in your browser: slide the tiles, merge equal numbers and reach 2048. Swipe or use the arrow keys. Your best score is saved.',
    intro: [
      '2048 Merge Challenge is a sliding number puzzle on a 4×4 board. Every move slides all the tiles as far as they can go in one direction, and two tiles with the same number merge into one with double the value: 2 and 2 make 4, 4 and 4 make 8, all the way up to 2048.',
      'After every move a new 2 (or sometimes a 4) appears in an empty cell. Reach the 2048 tile to win, then keep going for a bigger tile and a higher score. The game ends when the board is full and no two neighbouring tiles match.',
    ],
    scoring: 'Every merge adds the value of the new tile to your score: merging two 64s adds 128. Your best score is saved in this browser, and your current board is saved after every move so you can come back to it.',
    hint: 'There are no hints or timer. Take as long as you like over each move. A move that can’t shift any tile does nothing, so it never costs you a tile.',
    tips: [
      'Keep your biggest tile in one corner and build the row next to it in order.',
      'Use two or three directions most of the time, and the fourth only when you have to.',
      'Merge small tiles early so they don’t clog the board around your big ones.',
    ],
  },
  DETECTIVE: {
    metaTitle: 'Word Detective: Free Daily Five-Letter Word Game',
    description: 'Play Word Detective free: crack the hidden five-letter word in six guesses with letter clues. A new daily word, streaks, stats and unlimited practice.',
    intro: [
      'Word Detective hides a five-letter word, and you have six guesses to find it. Every guess must be a real word. After each one, the letters show how close you are: teal with a check means the right letter in the right place, amber with a dot means the letter is in the word but somewhere else, and grey means it isn’t in the word at all.',
      'There’s a new daily word at midnight, your local time, and everyone gets the same word on the same date. Finish it to build your streak, then play as many practice words as you like. Practice games never change your daily stats.',
    ],
    scoring: 'The daily puzzle tracks games played, your win rate, your current and best streak, and how many guesses each win took. Each daily word counts once: replaying or reloading it never adds to your stats.',
    hint: 'There are no hints, just the letter clues. Repeated letters are marked only as many times as they appear in the answer, so a grey second E means the word has just one.',
    tips: [
      'Start with a word that uses common letters, such as E, A, R, T and S.',
      'Use your second guess to test new letters rather than repeating the ones you know.',
      'Watch for double letters: words like APPLE or SHEEP repeat a letter.',
    ],
  },
  SUDOKU: {
    metaTitle: 'Sudoku Daily: Free Online Sudoku, 100 Levels',
    description: 'Play Sudoku Daily free: 100 levels from easy to expert, plus a new puzzle every day. Notes, hints, mistake checks and best times.',
    intro: [
      'Sudoku Daily is the classic 9×9 number puzzle. Fill every empty cell so that each row, each column and each 3×3 box contains the numbers 1 to 9 exactly once. Every puzzle has exactly one solution.',
      'There are 100 levels. Level 1 has about 46 clues and every level after it has fewer, down to about 24 at level 100. Up to level 70 every puzzle can be solved step by step without guessing; after that they need more advanced techniques. Solve a level to unlock the next. There’s also a daily puzzle that’s the same for everyone on the same date.',
    ],
    scoring: 'Sudoku Daily times each puzzle and counts your mistakes and hints. You earn three stars for a solve with no mistakes and no hints, two with up to 3 mistakes and 1 hint, and one otherwise. Your stars, best time for each level and the daily puzzles you’ve solved are saved in this browser, and an unfinished puzzle is saved as you play.',
    hint: 'Hints are unlimited. Each one fills in a correct number, in the selected cell if it needs one or otherwise in the cell with the fewest possibilities. Wrong numbers are marked in red straight away.',
    tips: [
      'Look for a number that can only go in one cell of a row, column or box.',
      'Use notes to pencil in candidates when a cell has only two or three options.',
      'When you place a number, notes for it in the same row, column and box are cleared for you.',
    ],
  },
};
