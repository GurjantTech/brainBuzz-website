/**
 * Per-game page copy. Every number here follows the game rules in assets/js/engine
 * (ported from the Android app), so keep them in sync if the rules change.
 */
export const GAME_COPY = {
  DAILY: {
    metaTitle: 'Daily Challenge: 12 Free Maths & Pattern Puzzles',
    description: 'Play today’s BrainBuzz Daily Challenge free in your browser: 12 quick maths and number pattern puzzles, from Easy to Hard, with a new set every midnight.',
    intro: [
      'The Daily Challenge is a fresh set of 12 puzzles every day, mixing quick maths with number patterns. The first four are Easy, the next four Medium and the last four Hard, and you get 20 seconds for each one.',
      'Everyone gets the same puzzles on the same date, including players in the BrainBuzz Android app, so it’s a fair way to compare scores with friends. A new set arrives at midnight, your local time.',
    ],
    scoring: 'Each correct answer is worth 100 points if it’s an Easy puzzle, 150 for Medium and 200 for Hard. You get up to 50% more for answering quickly, plus +10 for every answer in a row (up to +100).',
    hint: 'You have 2 hints. Each one removes two wrong answers; on a pattern it also shows the rule.',
    tips: [
      'Read the whole sequence before you answer. Some patterns alternate between two rules.',
      'A miss resets your combo, so a careful answer beats a rushed guess on the Hard puzzles at the end.',
      'You can play the Daily Challenge once a day in each browser. Your result stays until the next set arrives.',
    ],
  },
  MATRIX: {
    metaTitle: 'Memory Matrix: Free Visual Memory Game Online',
    description: 'Play Memory Matrix free: watch the tiles light up, then tap them back. Patterns grow every round. 3 lives, 10 rounds, Easy to Hard. No sign-up.',
    intro: [
      'Memory Matrix tests your visual short-term memory. Tiles light up one at a time; when they go dark, tap the same tiles. Clear a round and the next pattern is one tile longer, and the grid grows as the patterns do.',
      'Miss and you lose one of your three lives, but the next pattern gets a tile shorter so you can recover. The game ends after 10 rounds or when your lives run out. On Hard you must also repeat the tiles in the order they lit up.',
    ],
    scoring: 'A cleared round scores 25 points per tile, ×1.5 on Medium and ×2 on Hard. A missed round scores nothing. Using a hint replays the pattern but halves that round’s points.',
    hint: 'You have 3 hints. Each one plays the pattern again; tiles you’ve already found stay found.',
    tips: [
      'Group the tiles into shapes such as lines, corners or an L instead of remembering single squares.',
      'On Hard, say the order to yourself: “top left, middle, bottom right”.',
      'When you miss, the whole pattern stays on screen for a moment. Use it to see what tripped you up.',
    ],
  },
  MEMORY: {
    metaTitle: 'Memory Match: Free Card Pairs Memory Game',
    description: 'Play Memory Match free in your browser. Memorise the cards during the preview, then flip two at a time to find every pair in as few moves as you can.',
    intro: [
      'Memory Match is the classic pairs game. Every card is shown face up for a short preview (2 seconds on Easy, 1.5 on Medium and 1 on Hard), then they all flip over.',
      'Turn over two cards at a time; matching cards stay face up. Find all 6, 8 or 10 pairs as quickly as you can, in as few moves as possible.',
    ],
    scoring: 'You start with 120 points per pair (×1.5 on Medium, ×2 on Hard). Every move beyond one per pair costs 15 points, every second costs 3 and every hint 50, but you always keep at least 20 points per pair. A move is two cards turned over.',
    hint: 'You have 2 hints. Each one shows every card for 1.5 seconds.',
    tips: [
      'During the preview, pick out two or three pairs and lock them in rather than trying to remember everything.',
      'Turn over a card you haven’t seen yet before guessing at one you half remember.',
      'Say the symbols out loud in your head (“sun, rocket, bee”) to remember positions better.',
    ],
  },
  LOGIC_PATH: {
    metaTitle: 'Logic Path: Free Pipe Rotation Puzzle Game',
    description: 'Play Logic Path free: rotate the pipe tiles to link the start arrow to the goal. 3 boards against the clock, from 4×4 to 6×6 with decoy T-pieces.',
    intro: [
      'Logic Path is a pipe-rotation puzzle. Tap any tile to turn it a quarter turn clockwise and link the arrow on the left edge to the flag on the right. Pipes connected to the start light up and show a dot, so you can see how far your path reaches.',
      'Solve 3 boards before the clock runs out: 4×4 boards on Easy, 5×5 on Medium and 6×6 on Hard. Each board has a longer, twistier path than the one before, and on Medium and Hard decoy T-pieces join in to mislead you.',
    ],
    scoring: 'Each board is worth 12 points per tile, ×1.5 on Medium and ×2 on Hard (192 points for an Easy board). You lose 4 points for each tap beyond the fewest needed, 2 per second and a quarter of the board’s value per hint, but always keep at least a quarter.',
    hint: 'You have 3 hints. Each one turns a tile on the solution path into place and locks it.',
    tips: [
      'Work backwards from the exit as well as forwards from the start; the two routes meet in the middle.',
      'Corners decide where the path turns. Straights just fill the gaps between them.',
      'Tiles away from the path don’t matter, so don’t spend taps tidying them up.',
    ],
  },
  ODD_ONE_OUT: {
    metaTitle: 'Odd One Out: Free Visual Puzzle Game',
    description: 'Play Odd One Out free: spot the shape, arrow, mirrored letter or number that doesn’t belong. 12 timed grids, Easy to Hard, no sign-up needed.',
    intro: [
      'Odd One Out trains your visual attention. Every grid has exactly one item that doesn’t match: a different shape, size or direction, a mirrored letter, or a number that breaks the rule the others follow, such as all being even or all being multiples of 7.',
      'Find it before the timer runs out: 15 seconds per grid on Easy, 13 on Medium and 12 on Hard. There are 12 grids, with 9 items on Easy, 12 on Medium and 16 on Hard, and the second half of the round gets trickier.',
    ],
    scoring: 'A correct answer scores 100 points (150 on Medium, 200 on Hard), up to 50% more the faster you answer, plus +10 for every answer in a row (up to +100).',
    hint: 'You have 3 hints. Each one rules out about half of the remaining wrong items.',
    tips: [
      'Look at the whole grid at once rather than checking items one by one; the odd one often “pops out”.',
      'For arrows, follow the tip, not the shaft. On Hard the odd one may only be turned 45°.',
      'For numbers, check even or odd first, then try the times tables: 3, 4, 5, 6, 7 and 9.',
    ],
  },
  WORD_SCRAMBLE: {
    metaTitle: 'Word Scramble: Free Unscramble the Word Game',
    description: 'Play Word Scramble free: unscramble 8 words using the clues, from 4-letter words on Easy to 8-letter words on Hard. Tap or type to play.',
    intro: [
      'Word Scramble gives you 8 jumbled words to unscramble, shortest first. Tap the letter tiles to spell the word, or just type on your keyboard. Tap a placed letter to send it back.',
      'Easy words are 4–5 letters long, Medium words have 6 and Hard words 7–8. Easy and Medium show a clue for every word, while on Hard the clue stays hidden until you use a hint. You have 150, 165 or 180 seconds for the whole round.',
    ],
    scoring: 'Each word is worth 20 points per letter (×1.5 on Medium, ×2 on Hard), with up to 30% more for solving it quickly. Each hint costs a quarter of the word’s value and each wrong try 10 points, with a minimum of a fifth of the value. Skipped words score nothing.',
    hint: 'You have 6 hints for the round. A hint shows the clue if it’s hidden, otherwise it places the next letter for you (never the last one).',
    tips: [
      'Start with common endings such as -ER, -ET, -LE and -ING, or a likely first letter.',
      'Use Shuffle. Seeing the letters in a new order often makes the word jump out.',
      'Stuck for more than a few seconds? Skip, because the clock is shared by all 8 words.',
    ],
  },
  SEQUENCE: {
    metaTitle: 'Number Sequence Master: Free Number Pattern Puzzles',
    description: 'Play Number Sequence Master free: find the next number in 10 patterns, from simple steps to primes, cubes and Fibonacci. Timed, Easy to Hard.',
    intro: [
      'Number Sequence Master shows you five numbers that follow a rule. Work out the rule and pick the number that comes next from four choices. There are 10 patterns, with 25 seconds each on Easy, 20 on Medium and 15 on Hard.',
      'Easy uses steady steps and doubling. Medium adds multiplying, growing gaps, square numbers and alternating steps. Hard brings Fibonacci-style sums, cubes, triangular numbers, primes and mixed operations. After each answer you’ll see the rule.',
    ],
    scoring: 'A correct answer scores 100 points (150 on Medium, 200 on Hard), up to 50% more for the time you have left, plus +10 for every answer in a row (up to +100).',
    hint: 'You have 3 hints. Each one removes two wrong answers and shows the rule.',
    tips: [
      'Write down, or picture, the gaps between neighbours. If the gaps change, look at the gaps between the gaps.',
      'Numbers that grow very fast usually mean multiplying, squaring or cubing.',
      'If the numbers zig-zag, there are probably two rules taking turns.',
    ],
  },
  MATH: {
    metaTitle: 'Quick Math Rush: Free 60-Second Mental Maths Game',
    description: 'Play Quick Math Rush free: solve as many sums as you can in 60 seconds. The difficulty adapts to you, with combo bonuses for answers in a row.',
    intro: [
      'Quick Math Rush is a 60-second mental arithmetic sprint. Answer as many sums as you can: addition, subtraction, multiplication and division, with two-step sums and squares on Hard.',
      'The difficulty follows you. Four correct answers in a row move you up a level and two misses in a row move you down, but never more than one level away from the difficulty you chose.',
    ],
    scoring: 'Each correct answer scores at the level it was asked: 100, 150 or 200 points. Answer within about 6 seconds for up to 50% more, and build a combo for +10 per answer in a row (up to +100).',
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
    metaTitle: 'Sudoku Daily: Free Online Sudoku, Easy to Hard',
    description: 'Play Sudoku Daily free: a new puzzle every day at Easy, Medium and Hard, plus unlimited random ones. Notes, hints, mistake checks and best times.',
    intro: [
      'Sudoku Daily is the classic 9×9 number puzzle. Fill every empty cell so that each row, each column and each 3×3 box contains the numbers 1 to 9 exactly once. Every puzzle has exactly one solution.',
      'Each level has a daily puzzle that’s the same for everyone on the same date, and you can play unlimited random puzzles too. Easy and Medium can always be solved step by step without guessing; Hard has fewer clues and needs more advanced techniques.',
    ],
    scoring: 'Sudoku Daily times each puzzle and counts your mistakes and hints. Your best time for each level and the daily puzzles you’ve solved are saved in this browser, and an unfinished puzzle is saved as you play.',
    hint: 'Hints are unlimited. Each one fills in a correct number, in the selected cell if it needs one or otherwise in the cell with the fewest possibilities. Wrong numbers are marked in red straight away.',
    tips: [
      'Look for a number that can only go in one cell of a row, column or box.',
      'Use notes to pencil in candidates when a cell has only two or three options.',
      'When you place a number, notes for it in the same row, column and box are cleared for you.',
    ],
  },
};
