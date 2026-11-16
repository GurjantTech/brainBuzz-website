/**
 * Strategy guides: original articles, one or more per game. Every number in them was measured with this
 * site's own engine (assets/js/engine), so keep them in sync if the rules or word lists change.
 *
 * `published` (YYYY-MM-DD) is the day a guide goes live: the build leaves out guides dated after the build
 * date, and the daily scheduled deploy (.github/workflows/deploy.yml) publishes them on the day. To schedule
 * a new guide, add it here with a future date and push. Set `updated` when you revise a guide's content.
 */

/** A row of Word Detective tiles. `pattern` uses G (right place), Y (in the word) and . (not in the word). */
function tiles(word, pattern) {
  const names = { G: 'right place', Y: 'in the word, wrong place', '.': 'not in the word' };
  const cls = { G: 'g', Y: 'y', '.': 'x' };
  const label = [...word].map((c, i) => `${c} ${names[pattern[i]]}`).join(', ');
  return `<span class="gx-tiles" role="img" aria-label="${label}">${[...word].map((c, i) => `<span class="${cls[pattern[i]]}">${c}</span>`).join('')}</span>`;
}

/** A 9×9 Sudoku grid from an 81-digit string (0 = empty). `marks` maps "r1c3" to a digit to show highlighted. */
function sudokuGrid(puzzle, marks = {}, caption = '') {
  let rows = '';
  for (let r = 0; r < 9; r++) {
    let cells = '';
    for (let c = 0; c < 9; c++) {
      const v = Number(puzzle[r * 9 + c]);
      const mark = marks[`r${r + 1}c${c + 1}`];
      cells += mark ? `<td class="mark">${mark}</td>` : `<td>${v || ''}</td>`;
    }
    rows += `<tr>${cells}</tr>`;
  }
  return `<figure class="gx-figure"><table class="gx-sudoku" aria-label="Sudoku grid">${rows}</table>${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`;
}

function table(head, rows, caption = '') {
  return `<div class="gx-table"><table class="compare">${caption ? `<caption class="visually-hidden">${caption}</caption>` : ''}
<thead><tr>${head.map((h) => `<th scope="col">${h}</th>`).join('')}</tr></thead>
<tbody>${rows.map((r) => `<tr>${r.map((v, i) => (i === 0 ? `<th scope="row">${v}</th>` : `<td>${v}</td>`)).join('')}</tr>`).join('')}</tbody></table></div>`;
}

const tip = (text) => `<p class="gx-tip"><strong>Tip:</strong> ${text}</p>`;

/** The Level 1 puzzle of Sudoku Daily (S.generate(1, S.levelSeed(1))), kept as text so the walkthrough never drifts. */
const SUDOKU_L1 = '090007300400205089073914060625170498010000020947062135030458210250301004004700050';

export const GUIDES = [
  {
    slug: 'best-starting-words-word-detective',
    game: 'DETECTIVE',
    published: '2026-11-16',
    title: 'The Best Starting Words for Word Detective, Tested on Every Answer',
    metaTitle: 'Best Starting Words for Five-Letter Word Puzzles',
    description: 'We tested 3,124 opening words against all 686 Word Detective answers. See which starters leave the fewest words, and why ADIEU isn’t one of them.',
    summary: 'We scored 3,124 opening words against every one of Word Detective’s 686 answers. CRATE, TRACE and ORATE come out on top; ADIEU ranks 920th.',
    body: `
<p>Most advice about five-letter word puzzles is based on general English. Word Detective uses its own list of 686 answer words, so we measured the starters against that list directly. For every valid opening word with five different letters (3,124 of them), we played it against all 686 answers using the game’s own colouring rules and counted how many answers were still possible afterwards.</p>
<p>The result is a ranking you can actually use, plus a few facts about the answer list that are worth knowing before you type your first guess.</p>

<h2>How we measured a “good” starter</h2>
<p>A first guess is useful when it splits the 686 possible answers into lots of small groups. If the tiles come back <em>teal, grey, amber, grey, grey</em>, only the answers that would produce exactly that colouring are left. A good starter makes that leftover group small on average, whatever the answer turns out to be.</p>
<p>So for each starter we worked out the <strong>expected number of answers remaining</strong> after it: the average size of the group you land in. Lower is better. We also counted how many different colour patterns the word can produce, because more patterns means finer splits.</p>

<h2>The ranking</h2>
${table(['Starting word', 'Answers left on average', 'Different patterns', 'Rank of 3,124'], [
    ['CRATE', '15.9', '120', '3'],
    ['TRACE', '16.1', '121', '4'],
    ['ORATE', '15.9', '103', '1'],
    ['IRATE', '15.9', '102', '2'],
    ['RAISE', '16.8', '100', '5'],
    ['ARISE', '16.9', '95', '6'],
    ['STARE', '17.8', '108', '8'],
    ['CRANE', '18.5', '113', '11'],
    ['SLATE', '18.9', '108', '13'],
    ['ADIEU', '38.4', '59', '920'],
    ['AUDIO', '57.1', '63', '2,097'],
  ], 'How well each starting word narrows down the 686 Word Detective answers')}
<p>ORATE, IRATE and CRATE are effectively tied at about 16 answers left. CRATE and TRACE produce the most distinct patterns, so they’re slightly more likely to leave you with a very small group. Any word in the top ten is an excellent choice, and the differences between them are smaller than the difference a good second guess makes.</p>

<h2>Why vowel-heavy starters disappoint</h2>
<p>ADIEU and AUDIO are popular because they test four vowels at once. On this answer list they’re poor openers: after ADIEU you’re left with about 38 possible answers on average, more than twice as many as after CRATE. After AUDIO it’s 57.</p>
<p>The reason is simple. Almost every answer contains a vowel, so learning <em>which</em> vowels it has tells you less than you’d think. Common consonants such as R, T, C and S split the list far more evenly. The best starters combine one or two strong vowels (A and E) with the most common consonants.</p>

<h2>What the 686 answers look like</h2>
<p>Here’s the share of answers that contain each letter at least once:</p>
${table(['Letter', 'Answers containing it'], [
    ['E', '47.5%'], ['A', '42.7%'], ['R', '39.9%'], ['T', '30.9%'], ['O', '28.9%'], ['L', '28.4%'], ['I', '28.3%'], ['S', '27.3%'], ['C', '22.9%'], ['N', '22.6%'],
  ], 'Most common letters in Word Detective answers')}
<p>At the other end, J, Q, X and Z each appear in fewer than 2% of answers. Don’t spend early guesses on them.</p>
<p>Position matters too:</p>
<ul>
  <li><strong>First letter:</strong> S is by far the most common (15.9% of answers), followed by C (9.5%), P and B (7.1% each).</li>
  <li><strong>Second letter:</strong> O (14.0%), R (13.1%), A (12.0%) and L (10.3%). Many answers start with a consonant pair such as ST-, SH-, CH-, GR-, BR- or CL-.</li>
  <li><strong>Last letter:</strong> E ends 20.8% of answers, then T (13.4%), Y (10.3%), R (9.5%) and H (7.7%).</li>
  <li><strong>Endings:</strong> the most common last two letters are -ER (38 answers), -CH (26), -ST (21), -CK (19), -SE (19) and -LE (18).</li>
</ul>
${tip('more than one answer in four (194 of 686, or 28.3%) repeats a letter, as in SALAD, TRUST, SPEED or STILL. If you’re running out of new letters, try a repeat.')}

<h2>A worked example</h2>
<p>Suppose the hidden word is GRAIN. Here’s how a CRATE opener plays out, with the number of possible answers after each guess:</p>
<p>${tiles('CRATE', '.GG..')} <strong>9 answers left:</strong> BRAIN, BRAND, DRAIN, DRAMA, GRAIN, GRAND, GRAPH, GRASS and GRAVY.</p>
<p>Nine candidates share _RA__. Rather than guessing one of them at random, pick a word that tests the letters that separate them. GRAND checks G (first letter of five candidates) as well as N and D:</p>
<p>${tiles('GRAND', 'GGGY.')} <strong>1 answer left:</strong> G, R and A are in place, N is in the word but not fifth, and there’s no D. Only GRAIN fits.</p>
<p>${tiles('GRAIN', 'GGGGG')} Solved in three.</p>
<p>Even an all-grey first row is useful. If the answer is SOUND, CRATE comes back completely grey, which still cuts 686 answers to 41: you now know the word has no C, R, A, T or E.</p>

<h2>Two-word openings</h2>
<p>If you like to play the same two words every day, ORATE followed by CLIPS is the strongest pair we found among second words that use five new letters: together they leave about 2.1 answers on average. CHILD (2.2) and CLING (2.3) are close behind. A fixed pair is easy to remember, but choosing your second guess based on the first row’s colours, as in the GRAIN example, is usually better.</p>

<h2>Five habits that save guesses</h2>
<ol>
  <li><strong>Use your second guess to test new letters,</strong> not to repeat the ones you already know. A teal letter is already found; you don’t need to spend a slot confirming it.</li>
  <li><strong>Never put an amber letter back in the same spot.</strong> Amber means “in the word, but not here”.</li>
  <li><strong>Watch out for word families.</strong> BATCH, CATCH, HATCH, LATCH, MATCH, PATCH and WATCH are all answers. If you have _ATCH with three guesses left, guessing them one by one can fail. A word like CLAMP tests C, L, M and P together.</li>
  <li><strong>Read grey repeats carefully.</strong> If you guess a word with two Es and one turns grey, the answer has exactly one E.</li>
  <li><strong>Save hints for the end.</strong> The daily word has two free hints, each revealing a letter in place. They’re most valuable when you’re down to a few close candidates.</li>
</ol>
<p>Word Detective has one daily word that’s the same for everyone, and unlimited practice words for trying out new openers without affecting your streak.</p>`,
  },

  {
    slug: 'sudoku-for-beginners',
    game: 'SUDOKU',
    published: '2026-11-16',
    title: 'Sudoku for Beginners: Solve Your First Puzzle With Two Simple Techniques',
    metaTitle: 'Sudoku for Beginners: A Step-by-Step Worked Example',
    description: 'Learn to solve Sudoku step by step with naked and hidden singles, using a real puzzle from Sudoku Daily level 1. No guessing needed.',
    summary: 'Two techniques, naked singles and hidden singles, solve every easy Sudoku. We walk through them on the real level 1 puzzle.',
    body: `
<p>Sudoku looks like a maths puzzle, but there’s no arithmetic in it at all. The numbers 1 to 9 are just nine different symbols. What you need is a way of spotting which symbol must go where, and on easier puzzles two techniques are enough to fill the entire grid. This guide teaches both using the real level 1 puzzle from Sudoku Daily.</p>

<h2>The rules in one sentence</h2>
<p>Fill every empty cell so that each <strong>row</strong>, each <strong>column</strong> and each of the nine <strong>3×3 boxes</strong> contains the numbers 1 to 9 exactly once. A well-made puzzle has exactly one solution, and every puzzle on BrainBuzz is checked to make sure it does.</p>
<p>In this guide, “r1c3” means row 1, column 3, counting rows from the top and columns from the left.</p>

${sudokuGrid(SUDOKU_L1, {}, 'Sudoku Daily, level 1: 46 clues.')}

<h2>Technique 1: the naked single</h2>
<p>A <strong>naked single</strong> is a cell where only one number is possible, because the other eight already appear in its row, column or box.</p>
<p>The quickest kind to spot is a row, column or box with just one gap. Row 4 reads 6, 2, 5, 1, 7, _, 4, 9, 8. The only number missing is 3, so r4c6 is 3.</p>
<p>Most naked singles take a little more looking. Take r1c5, in the top row:</p>
<ul>
  <li>Row 1 already has 9, 7 and 3.</li>
  <li>Column 5 already has 1, 7, 6 and 5.</li>
  <li>Its box (the top-middle one) already has 2, 4, 5, 7, 9 and 1.</li>
</ul>
<p>Put those together and 1, 2, 3, 4, 5, 6, 7 and 9 are all taken. The only number left for r1c5 is <strong>8</strong>.</p>

<h2>Technique 2: the hidden single</h2>
<p>A <strong>hidden single</strong> works the other way round. Instead of asking “what can go in this cell?”, pick a number and ask “where can it go in this row, column or box?” If there’s only one place, it goes there, even if that cell could hold other numbers on its own.</p>
<p>Look at the top-left box and the number 2. The box has five empty cells: r1c1, r1c3, r2c2, r2c3 and r3c1.</p>
<ul>
  <li>Row 2 already has a 2 (at r2c4), so r2c2 and r2c3 can’t be 2.</li>
  <li>Column 1 already has a 2 (at r8c1), so r1c1 and r3c1 can’t be 2.</li>
</ul>
<p>That leaves one place for the 2 in this box: <strong>r1c3</strong>. On its own, r1c3 could be 1, 2, 6 or 8, so you’d never find it by looking at the cell alone. You find it by looking at the number.</p>

${sudokuGrid(SUDOKU_L1, { r4c6: 3, r1c5: 8, r1c3: 2 }, 'The three cells solved above: r4c6 = 3, r1c5 = 8 and r1c3 = 2.')}

<h2>A routine that solves easy puzzles</h2>
<ol>
  <li><strong>Sweep the numbers.</strong> Take each number from 1 to 9 in turn and look for hidden singles in every box. Numbers that already appear many times are the easiest, because they rule out the most cells.</li>
  <li><strong>Finish nearly full units.</strong> Any row, column or box with one or two gaps is quick to complete.</li>
  <li><strong>Repeat.</strong> Every number you place creates new singles nearby, so go back to step 1.</li>
</ol>
<p>On this level 1 puzzle there are 13 naked singles available before you’ve placed anything, so the grid opens up quickly. Every Sudoku Daily puzzle up to level 70 can be solved with steps like these, without guessing.</p>

<h2>When singles run out: use notes</h2>
<p>On harder puzzles you’ll reach a point where no single is visible. That’s the time to switch on notes (pencil marks) and write the possible numbers into the cells that have only two or three options. Sudoku Daily removes a number from the notes in its row, column and box automatically when you place it, so your notes stay accurate.</p>
<p>Notes let you see patterns such as a <strong>naked pair</strong>: two cells in the same row, column or box that can only hold the same two numbers, say 4 and 7. One must be 4 and the other 7, so you can remove 4 and 7 from every other cell in that unit. That often creates a new single.</p>
${tip('don’t fill in notes for every cell from the start. On easy and medium puzzles it’s slower than scanning, and it hides the patterns under clutter.')}

<h2>Common beginner mistakes</h2>
<ul>
  <li><strong>Guessing.</strong> If you place a number because it “looks right”, a wrong guess can sit unnoticed for twenty moves. Only place a number when you can say why no other number fits.</li>
  <li><strong>Forgetting the box.</strong> It’s easy to check the row and column and miss the 3×3 box. Check all three every time.</li>
  <li><strong>Stopping at the cell.</strong> If a cell has several options, switch to the number view and look for hidden singles instead.</li>
</ul>

<h2>How Sudoku Daily scores you</h2>
<p>Level 1 has about 46 clues and each level after it has fewer, down to about 24 at level 100. You earn three stars for a solve with no mistakes and no hints, two stars with up to three mistakes and one hint, and one star otherwise. Wrong numbers are marked straight away, and there’s also a daily puzzle that’s the same for everyone on the same date.</p>`,
  },

  {
    slug: '2048-strategy',
    game: 'MERGE',
    published: '2026-11-16',
    title: '2048 Strategy: What 6,000 Simulated Games Teach About the Corner Method',
    metaTitle: '2048 Strategy: The Corner Method, Tested',
    description: 'We played 6,000 games of 2048 with our own engine to test the corner strategy. Here’s what it gets right, where it fails, and how to reach 2048.',
    summary: 'A simple corner rule more than doubles the average score compared with random moves, but on its own it never reaches 2048. Here’s what fills the gap.',
    body: `
<p>Almost every 2048 guide says the same thing: keep your biggest tile in a corner. We wanted to know how much that advice is actually worth, so we ran 6,000 games with the same engine that powers 2048 Merge Challenge on this site, 2,000 for each of three simple strategies, and recorded how far each got.</p>

<h2>How 2048 works</h2>
<p>The board is 4×4. Each move slides every tile as far as it can go in one direction, and two tiles with the same number merge into one with double the value. A tile made by a merge can’t merge again in the same move, so 2, 2, 4 slid left becomes 4, 4, not 8. After every move that shifts something, a new tile appears in a random empty cell: a 2 nine times out of ten, a 4 otherwise. A move that shifts nothing does nothing at all, so it never costs you a tile.</p>
<p>Your score goes up by the value of each new merged tile: merging two 64s adds 128.</p>

<h2>The experiment</h2>
<p>We compared three ways of choosing moves, none of which looks ahead:</p>
<ul>
  <li><strong>Random:</strong> pick any direction.</li>
  <li><strong>Corner rule:</strong> always slide down if possible, otherwise left, otherwise right, and up only when nothing else moves. This keeps the big tiles in the bottom-left corner.</li>
  <li><strong>Corner rule with merges:</strong> the same, but when both down and left are possible, choose whichever merges more.</li>
</ul>
${table(['Strategy', 'Average score', 'Reached 256', 'Reached 512', 'Reached 1024'], [
    ['Random moves', '1,093', '7.8%', '0.1%', '0%'],
    ['Corner rule', '2,563', '51.9%', '4.3%', '0%'],
    ['Corner rule with merges', '3,066', '61.0%', '13.0%', '0.1%'],
  ], '2048 results for three simple strategies, 2,000 games each')}
<p>The corner rule more than doubles the average score and makes a 256 tile likely instead of rare. Adding a preference for bigger merges helps again, tripling the number of games that reach 512.</p>
<p>But look at the last column. None of these fixed rules reached 2048, and only one game in 2,000 reached 1024. The corner idea is the foundation, but a rule you follow blindly isn’t enough. The rest comes from planning the board, which is what the next sections are about.</p>

<h2>Why the corner works</h2>
<p>A big tile in the middle of the board is a problem: small tiles appear on both sides of it, and it blocks merges in every direction. A big tile in a corner has only two neighbours, so you can line up the next-biggest tiles beside it and merge them in.</p>
<p>The ideal shape is a <strong>chain</strong>: biggest tile in the corner, then the next biggest beside it, and so on along the edge, like 512, 256, 128, 64 along the bottom row. When a 64 is made next to the 64, the whole chain collapses into the corner in a few moves.</p>

<h2>Six habits that get you past 1024</h2>
<ol>
  <li><strong>Keep your edge row full.</strong> If the bottom row has no gaps, sliding left or right can’t move your corner tile out of position. Most corner disasters start with a gap in the anchor row.</li>
  <li><strong>Use three directions, not four.</strong> With the corner at the bottom left, use down and left most of the time and right when needed. Treat up as an emergency move, because it pulls your corner tile away and lets a 2 drop into its place.</li>
  <li><strong>Build the chain in order.</strong> Keep the tiles in the anchor row decreasing away from the corner. A small tile stuck between two big ones is the most common reason a run ends.</li>
  <li><strong>Merge small tiles early.</strong> 2s and 4s left lying around take up space. Clear them while there’s room to manoeuvre.</li>
  <li><strong>Think one spawn ahead.</strong> Before a move, ask where the new tile could appear. If the only empty cell after the move is in your corner, choose a different move.</li>
  <li><strong>Don’t chase a merge across the board.</strong> A merge that breaks your chain usually costs more than it gains.</li>
</ol>
${tip('if you’re forced to press up, press down again straight after if you can. With luck the corner tile slides back before anything settles in its place.')}

<h2>How big is 2048, really?</h2>
<p>Building a tile from 2s scores more than its face value, because every merge on the way counts. Making a 2048 tile entirely from 2s adds 20,480 points (ten levels of merging, each worth 2,048 in total). It also takes about a thousand new tiles, so reaching 2048 is a game of several hundred moves. That’s why patience and a steady corner matter more than quick merges.</p>

<h2>After 2048</h2>
<p>Reaching 2048 wins the game, but you can keep going for a bigger tile and a higher score. The same chain keeps working: 2048 in the corner, 1024 beside it, and so on. In 2048 Merge Challenge your board is saved after every move, so you can stop and come back to a long game later.</p>`,
  },

  {
    slug: 'number-sequence-patterns',
    game: 'SEQUENCE',
    published: '2026-11-16',
    title: 'How to Solve Number Sequence Puzzles: 11 Patterns and How to Spot Them',
    metaTitle: 'Number Sequence Puzzles: 11 Patterns to Know',
    description: 'A practical guide to number sequences: steady steps, doubling, squares, cubes, Fibonacci-style sums, primes and more, with a method for spotting each.',
    summary: 'Every puzzle in Number Sequence Master follows one of 11 kinds of rule. Learn to recognise each one, and a three-step method for when you’re stuck.',
    body: `
<p>Number sequence puzzles show you a few numbers and ask what comes next. They feel like they could follow any rule at all, but in practice a small set of patterns covers almost every puzzle. Number Sequence Master uses 11 kinds of rule. This guide shows each one with an example and gives you a method that finds the rule quickly, even under a timer.</p>

<h2>The method: differences, then ratios</h2>
<p>When you see a new sequence, work through these three questions in order:</p>
<ol>
  <li><strong>What are the gaps?</strong> Subtract each number from the next. If the gaps are all the same, you have a steady step.</li>
  <li><strong>If the gaps change, what are the gaps between the gaps?</strong> Steadily growing gaps point to growing steps, square numbers or triangular numbers.</li>
  <li><strong>If the numbers grow very fast, what are the ratios?</strong> Divide each number by the one before. A constant ratio means multiplying.</li>
</ol>
<p>If none of those fit, look for the special families: zig-zags, sums of the previous two, cubes and primes.</p>

<h2>The 11 patterns</h2>
<h3>1. Steady step</h3>
<p><strong>7, 11, 15, 19, 23, … 27.</strong> Every gap is +4. Steps can be negative too: 50, 43, 36, 29 goes down by 7.</p>
<h3>2. Doubling</h3>
<p><strong>3, 6, 12, 24, 48, … 96.</strong> Each number is twice the one before. The gaps (3, 6, 12, 24) double too, which is a quick way to recognise it.</p>
<h3>3. Multiplying</h3>
<p><strong>2, 6, 18, 54, 162, … 486.</strong> Each number is three times the last. When numbers grow this fast, check the ratio straight away.</p>
<h3>4. Growing steps</h3>
<p><strong>2, 3, 5, 8, 12, … 17.</strong> The gaps are 1, 2, 3, 4, so the next gap is 5. The gaps between the gaps are all 1.</p>
<h3>5. Square numbers</h3>
<p><strong>4, 9, 16, 25, 36, … 49.</strong> These are 2², 3², 4², 5², 6². The gaps are odd numbers (5, 7, 9, 11), which is a giveaway. It’s worth knowing the squares up to 15² = 225 by heart.</p>
<h3>6. Alternating steps</h3>
<p><strong>10, 13, 11, 14, 12, … 15.</strong> The numbers zig-zag: +3, −2, +3, −2. When a sequence goes up and down, split it into two rules taking turns. You can also read it as two interleaved sequences: 10, 11, 12 and 13, 14.</p>
<h3>7. Fibonacci-style sums</h3>
<p><strong>3, 4, 7, 11, 18, … 29.</strong> Each number is the sum of the two before it: 3 + 4 = 7, 4 + 7 = 11, 7 + 11 = 18, so 11 + 18 = 29. The gaps (1, 3, 4, 7) are the sequence itself shifted, which is a handy check.</p>
<h3>8. Cubes</h3>
<p><strong>1, 8, 27, 64, 125, … 216.</strong> These are 1³ to 5³, so the next is 6³ = 216. Cubes grow faster than squares but not as fast as doubling.</p>
<h3>9. Triangular numbers</h3>
<p><strong>1, 3, 6, 10, 15, … 21.</strong> The gaps are 2, 3, 4, 5. Triangular numbers count the dots in a triangle (1, then 1 + 2, then 1 + 2 + 3), so they look like growing steps that start from 1.</p>
<h3>10. Prime numbers</h3>
<p><strong>11, 13, 17, 19, 23, … 29.</strong> Numbers with no divisors except 1 and themselves. The gaps look irregular (2, 4, 2, 4), which is the clue: if the gaps don’t follow any rule and every number is odd, check for primes. The primes below 50 are 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43 and 47.</p>
<h3>11. Mixed operations</h3>
<p><strong>3, 7, 15, 31, 63, … 127.</strong> Each number is double the last plus one. The gaps (4, 8, 16, 32) double, so it looks like doubling, but the numbers are one less than a power of two. When a sequence almost fits a pattern, try “times something, plus or minus something”.</p>

<h2>Which patterns appear at which level</h2>
${table(['Levels', 'Patterns', 'Time per puzzle'], [
    ['1 to 33', 'Steady steps and doubling', '30 seconds at level 1'],
    ['34 to 66', 'Adds multiplying, growing steps, squares and alternating steps', 'Shorter as you climb'],
    ['67 to 100', 'Adds Fibonacci-style sums, cubes, triangular numbers, primes and mixed operations', 'Down to 10 seconds at level 100'],
  ], 'Number Sequence Master patterns by level')}
<p>Every round has 10 puzzles with four choices each. After each answer the game shows you the rule, which is the best way to learn the patterns you don’t know yet.</p>

<h2>Speed tips for the timed game</h2>
<ul>
  <li><strong>Use the answer choices.</strong> You have four options. Sometimes checking which one continues the gaps is faster than working the rule out from scratch.</li>
  <li><strong>Look at the size of the jump.</strong> Small, steady growth means adding; explosive growth means multiplying, doubling or cubes.</li>
  <li><strong>Up-and-down means two rules.</strong> Don’t look for one formula when the numbers zig-zag.</li>
  <li><strong>Use hints wisely.</strong> A hint removes two wrong answers and shows the rule. It’s best on a high-level puzzle where the rule is one you haven’t met yet.</li>
</ul>
<p>Correct answers score 100 points at level 1, rising to 200 at level 100, with up to 50% more for the time you have left and a bonus for answers in a row.</p>`,
  },

  {
    slug: 'mental-math-tricks',
    game: 'MATH',
    published: '2026-11-23',
    title: 'Mental Maths Tricks for Faster Answers in Quick Math Rush',
    metaTitle: 'Mental Maths Tricks: Add, Multiply and Square Faster',
    description: 'Practical mental arithmetic shortcuts for addition, subtraction, times tables, division and squares, with examples, matched to Quick Math Rush levels.',
    summary: 'Round and adjust, multiply by 9 and 11 in your head, square numbers ending in 5, and use the last digit to rule out answers.',
    body: `
<p>Quick Math Rush gives you 60 seconds to answer as many sums as you can. Being fast at mental arithmetic isn’t about being a “maths person”; it’s mostly about knowing a handful of shortcuts that turn hard sums into easy ones. Here are the ones that make the biggest difference, in the order the game introduces each kind of sum.</p>

<h2>How the game ramps up</h2>
<p>Level 1 is small additions and subtractions. Times tables join at level 8, division at level 20, two-step sums at level 45 and squares at level 60, and the numbers keep growing up to level 100. The game also adapts as you play: four correct answers in a row make the sums 5 levels harder, and two misses in a row make them 5 levels easier, never more than 10 levels from the level you chose.</p>

<h2>Addition and subtraction</h2>
<h3>Round and adjust</h3>
<p>Numbers ending in 8 or 9 are awkward. Round them to the next ten, then fix the difference: <strong>49 + 36</strong> is 50 + 36 = 86, minus 1 = <strong>85</strong>. <strong>83 − 38</strong> is 83 − 40 = 43, plus 2 = <strong>45</strong>.</p>
<h3>Add from the left</h3>
<p>At school we add from the right, carrying as we go. In your head it’s easier from the left: <strong>47 + 35</strong> is 40 + 30 = 70, then 7 + 5 = 12, so <strong>82</strong>. You start with the most important digit, which also helps you rule out wrong answers early.</p>
<h3>Subtract by counting up</h3>
<p>For <strong>72 − 46</strong>, count up from 46: 4 gets you to 50, then 22 more to 72, so the answer is <strong>26</strong>. This avoids borrowing altogether.</p>

<h2>Times tables</h2>
<ul>
  <li><strong>×9:</strong> multiply by 10 and subtract once. 9 × 7 = 70 − 7 = <strong>63</strong>.</li>
  <li><strong>×5:</strong> multiply by 10 and halve. 5 × 14 = 140 ÷ 2 = <strong>70</strong>.</li>
  <li><strong>×4:</strong> double, then double again. 4 × 17 = 34, then <strong>68</strong>.</li>
  <li><strong>×11 with two digits:</strong> add the two digits and put the result in the middle. 11 × 43: 4, (4 + 3), 3 = <strong>473</strong>. If the middle is 10 or more, carry: 11 × 68 is 6, 14, 8, which becomes <strong>748</strong>.</li>
  <li><strong>×25:</strong> divide by 4 and multiply by 100. 25 × 16 = 4 × 100 = <strong>400</strong>.</li>
</ul>
${tip('if you’re unsure of one times-table fact, build it from one you know. 7 × 8 is 7 × 7 = 49, plus 7 = 56.')}

<h2>Division</h2>
<p>Think of every division as a multiplication with a gap: <strong>72 ÷ 8</strong> is “8 times what is 72?”, which is <strong>9</strong>. The faster your times tables, the faster your division. For bigger numbers, split them: <strong>96 ÷ 4</strong> is 80 ÷ 4 = 20 plus 16 ÷ 4 = 4, so <strong>24</strong>.</p>

<h2>Two-step sums</h2>
<p>From level 45 you’ll see sums like <strong>6 × 7 − 12</strong> or <strong>9 × 4 + 15</strong>. Do the multiplication first (42), then the addition or subtraction: <strong>30</strong>. Read the whole sum before you start so you don’t add before you multiply.</p>

<h2>Squares</h2>
<ul>
  <li><strong>Numbers ending in 5:</strong> multiply the tens digit by the next number up, then write 25 after it. 25²: 2 × 3 = 6, so <strong>625</strong>. 35²: 3 × 4 = 12, so <strong>1,225</strong>.</li>
  <li><strong>Numbers next to a round number:</strong> 19² = (20 − 1)² = 400 − 40 + 1 = <strong>361</strong>. That’s the round number squared, minus twice the round number times the distance, plus the distance squared. 31² = 900 + 60 + 1 = <strong>961</strong> works the same way upwards.</li>
  <li><strong>Learn 11² to 20².</strong> 121, 144, 169, 196, 225, 256, 289, 324, 361 and 400 come up often enough to be worth memorising.</li>
</ul>

<h2>Answer faster with the four choices</h2>
<ul>
  <li><strong>Check the last digit first.</strong> 27 × 8 must end in 6, because 7 × 8 = 56 ends in 6, so any choice that doesn’t can be ruled out at once. This works for addition, subtraction and multiplication.</li>
  <li><strong>Estimate the size.</strong> 48 × 6 is about 50 × 6 = 300, so 188 and 488 are clearly wrong.</li>
  <li><strong>Even or odd.</strong> An even number times anything is even; two odd numbers multiply to an odd number.</li>
</ul>

<h2>How scoring rewards speed</h2>
<p>Each correct answer scores at the level it was asked: 100 points at level 1, rising to 200 at level 100. Answering within about 6 seconds earns up to 50% more, and each answer in a row adds +10 (up to +100). A miss only resets your combo, so it’s better to answer quickly and occasionally be wrong than to freeze on one sum. To pass a level you need at least 8 right answers and 60% accuracy.</p>`,
  },

  {
    slug: 'memory-techniques',
    game: 'MATRIX',
    published: '2026-11-30',
    title: 'How to Remember Patterns and Pairs: Memory Techniques for Memory Matrix and Memory Match',
    metaTitle: 'Memory Game Techniques: Chunking, Shapes and Pairs',
    description: 'Practical techniques for visual memory games: chunk tiles into shapes, label positions, remember order, and find card pairs in fewer moves.',
    summary: 'Your short-term memory only holds a few things at once. Chunking tiles into shapes and naming positions lets you hold far more.',
    body: `
<p>Visual memory games feel like a test of something fixed: either you remember the pattern or you don’t. In practice, how you look at the pattern matters as much as how much you can hold. This guide covers the techniques that help most in BrainBuzz’s two memory games, Memory Matrix and Memory Match.</p>
<p>A note before we start: these are puzzles for enjoyment and practice. Getting better at them makes you better at them; we don’t claim they improve memory in everyday life.</p>

<h2>Why “just remembering” runs out</h2>
<p>Short-term memory can only hold a handful of separate things at once. Psychologists often put the limit at around four “chunks”. If you try to remember seven lit tiles as seven separate squares, you’ll lose some. The trick is to make each chunk carry more information, so seven tiles become two or three things to remember instead of seven.</p>

<h2>Memory Matrix: remember shapes, not squares</h2>
<p>In Memory Matrix, tiles light up one at a time. When they go dark, you tap the same tiles. Level 1 starts with 2 tiles on a 3×3 grid; patterns get longer and grids get bigger as you go, and from level 41 you must also repeat the tiles in the order they lit up.</p>
<h3>Chunk into shapes</h3>
<p>Instead of noticing individual tiles, look for the shapes they make: a line of three, an L, a corner, a diagonal, a square. “An L in the top left and a pair in the bottom right” is two chunks, even though it’s six tiles.</p>
<h3>Anchor to the edges</h3>
<p>Corners and edges are easy to remember; the middle of a big grid is not. Describe middle tiles relative to an edge: “second from the left on the bottom row” is easier to hold than an anonymous square in the centre.</p>
<h3>Say the order out loud in your head</h3>
<p>From level 41, order matters. A short spoken label for each tile (“top left, middle, bottom right”) uses a different kind of memory from the visual picture, and the two work together. Keep the labels short and consistent.</p>
<h3>Learn from misses</h3>
<p>When you miss, the full pattern stays on screen for a moment. Use it: was it a tile in the middle, or the last one in the sequence? Most people consistently forget the same kind of tile. Once you know yours, you can pay extra attention to it.</p>
${tip('a miss costs a life but makes the next pattern one tile shorter, so a bad round is a chance to recover rather than the end of the game. You have three lives and up to ten rounds.')}

<h2>Memory Match: find pairs in fewer moves</h2>
<p>Memory Match shows every card face up for a short preview, 2.6 seconds at level 1 and down to 0.8 seconds at level 100, then turns them over. You flip two at a time to find all the pairs: 3 pairs at level 1, up to 12 at level 100. Extra moves and time cost points.</p>
<h3>Lock in a few pairs during the preview</h3>
<p>Don’t try to memorise the whole board in two seconds. Pick two or three pairs and remember those firmly. Matching them first clears space and gives you a fast start.</p>
<h3>Name the symbols</h3>
<p>Silently name what you see in reading order: “sun, rocket, bee, sun”. Words are easier to keep than images, and saying them in order links each symbol to its position.</p>
<h3>Flip new cards first</h3>
<p>When you’re not sure where a card’s partner is, turn over a card you haven’t seen yet as your first flip. If it matches something you remember, you get a pair. If not, you’ve learned a new card without wasting a guess on one you half remember.</p>
<h3>Work in rows</h3>
<p>Scanning the board in a fixed order (left to right, top to bottom) helps you remember where cards are. Random flipping makes positions much harder to recall.</p>

<h2>Scoring at a glance</h2>
${table(['', 'Memory Matrix', 'Memory Match'], [
    ['Points', '25 per tile in a cleared round', '120 per pair, minus costs'],
    ['Level bonus', '×1 at level 1 to ×2 at level 100', '×1 at level 1 to ×2 at level 100'],
    ['Costs', 'A hint halves that round’s points', '15 per extra move, 3 per second, 50 per hint'],
    ['Hints', '3, each replays the pattern', '2, each shows every card for 1.5 seconds'],
  ], 'Scoring in Memory Matrix and Memory Match')}
<p>In Memory Match you always keep at least 20 points per pair, so finishing always scores something, however many moves it takes.</p>`,
  },

  {
    slug: 'logic-path-pipe-puzzle-strategy',
    game: 'LOGIC_PATH',
    published: '2026-12-07',
    title: 'Logic Path Strategy: Solve Pipe Rotation Puzzles in Fewer Taps',
    metaTitle: 'Pipe Puzzle Strategy: Solve in Fewer Taps',
    description: 'How to solve pipe rotation puzzles quickly: read the board, work from both ends, ignore T-pieces, and count taps before you tap. With Logic Path rules.',
    summary: 'In Logic Path the solution path is made only of straights and corners, so T-pieces are always decoys. That and four other rules make boards much faster.',
    body: `
<p>Logic Path is a pipe-rotation puzzle. Tap a tile to turn it a quarter turn clockwise, and link the arrow on the left edge to the flag on the right. Pipes connected to the start light up, so you can always see how far your path reaches. This guide covers how the boards are built and how to solve them in as few taps as possible, which is where most of your score comes from.</p>

<h2>Know your pieces</h2>
<ul>
  <li><strong>Straight:</strong> connects two opposite sides. It only has two useful positions, so it never needs more than one tap.</li>
  <li><strong>Corner:</strong> connects two neighbouring sides. It has four positions, so it can need up to three taps, because tiles only turn clockwise.</li>
  <li><strong>T-junction:</strong> connects three sides. These appear from level 16.</li>
</ul>
<p>Here’s the most useful fact about Logic Path: <strong>the solution path is made only of straights and corners.</strong> T-junctions are always decoys placed off the path to mislead you. If you see a T, you can ignore it completely.</p>

<h2>How the boards grow</h2>
${table(['Levels', 'Board size'], [['1 to 25', '4×4'], ['26 to 60', '5×5'], ['61 to 90', '6×6'], ['91 to 100', '7×7']], 'Logic Path board sizes by level')}
<p>You solve three boards per round against the clock, and the clock gets shorter as you climb. Each board in a round has a longer, twistier path than the one before, and the share of decoy T-pieces grows at higher levels.</p>

<h2>Five rules for fewer taps</h2>
<ol>
  <li><strong>Work from both ends.</strong> The tile next to the start arrow must connect to the left edge, and the tile next to the flag must connect to the right edge. Fix those first, then work inwards from both sides until the routes meet.</li>
  <li><strong>Corners decide the route.</strong> A path changes direction only at corners. Find where the path must turn, and the straights in between follow naturally.</li>
  <li><strong>Count before you tap.</strong> Because tiles only turn clockwise, a corner that needs to turn “one step back” takes three taps. Work out the number of taps in your head first; tapping to see what happens costs points.</li>
  <li><strong>Ignore tiles off the path.</strong> Tiles away from the route don’t matter, so don’t spend taps tidying them up.</li>
  <li><strong>Watch the lit pipes.</strong> The glow tells you exactly where your path currently ends. If the lit section stops, the problem is the first unlit tile after it.</li>
</ol>
${tip('the path never leaves the board except at the start arrow and the flag. A pipe on the border pointing off the edge is either in the wrong position or not on the path.')}

<h2>How Logic Path scores</h2>
<p>Each board is worth 12 points per tile, multiplied by the level bonus (×1 at level 1, rising to ×2 at level 100). A level 1 board has 16 tiles, so it’s worth 192 points. You lose 4 points for each tap beyond the fewest needed, 2 points per second, and a quarter of the board’s value for each hint, but you always keep at least a quarter.</p>
<p>That makes taps expensive. Three unnecessary taps on a level 1 board cost 12 points, the same as six seconds of thinking. Pausing to plan a corner is usually worth it.</p>
<p>You have three hints per round. Each one turns a tile on the solution path into place and locks it, which is most useful on a big board when you can’t see where the route crosses the middle.</p>`,
  },

  {
    slug: 'word-scramble-unscramble-tips',
    game: 'WORD_SCRAMBLE',
    published: '2026-12-14',
    title: 'How to Unscramble Words Faster: Tips for Word Scramble',
    metaTitle: 'How to Unscramble Words Faster: 8 Practical Tips',
    description: 'Unscramble words faster with common endings, letter pairs, vowel patterns and smart use of shuffle and skip. Tips for every Word Scramble level.',
    summary: 'Look for endings like -ER and -ING, pair up letters that belong together, and shuffle when you’re stuck. Eight tips for faster unscrambling.',
    body: `
<p>Unscrambling a word is a search problem: five letters can be arranged in 120 orders, and eight letters in over 40,000. You can’t try them all, so the skill is cutting the search down fast. These tips are what experienced players do without thinking. They’re written for Word Scramble, but they work for any anagram puzzle.</p>

<h2>How Word Scramble levels work</h2>
${table(['Levels', 'Word length', 'Clues'], [
    ['1 to 12', '4 letters', 'Always shown'],
    ['13 to 33', '4 to 5 letters', 'Always shown'],
    ['34 to 66', '6 letters', 'Always shown'],
    ['67 to 79', '7 to 8 letters', 'Always shown'],
    ['80 to 100', '7 to 8 letters', 'Hidden until you use a hint'],
  ], 'Word Scramble word length and clues by level')}
<p>A round has 5 words on the first levels and 8 from level 25, shortest first. The clock is shared by every word in the round.</p>

<h2>Eight tips</h2>
<h3>1. Read the clue first</h3>
<p>Up to level 79 every word comes with a clue. Read it before you look at the letters: once you have a meaning in mind, the right word often jumps out of the jumble.</p>
<h3>2. Look for common endings</h3>
<p>Many English words end in a familiar group. If you see the letters for one of these, set them aside at the end and solve the rest: <strong>-ER, -ED, -ING, -LY, -LE, -ET, -EST, -TION</strong>. The jumble RETNIW gets easier once you spot -ER: WINTER.</p>
<h3>3. Look for common beginnings</h3>
<p>The same works at the front: <strong>RE-, UN-, DE-, PRE-, ST-, TR-, SH-, CH-</strong>. Pull them to the front and see what’s left.</p>
<h3>4. Pair letters that belong together</h3>
<p>Some letters almost always appear together: <strong>TH, CH, SH, PH, WH, CK, QU, NG</strong>. If you have a Q, there’s almost certainly a U next to it. If you have a K and a C, try CK.</p>
<h3>5. Alternate consonants and vowels</h3>
<p>Most words mix consonants and vowels. Try placing them in a rough consonant-vowel-consonant rhythm, and see which arrangements look like words.</p>
<h3>6. Use Shuffle</h3>
<p>Seeing the same letters in a new order really does help: your eye stops fixing on the arrangement you first saw. If nothing comes after a few seconds, shuffle.</p>
<h3>7. Skip and come back</h3>
<p>The clock is shared by the whole round. Spending twenty seconds on one word can cost you two others. Skip early, and you can come back to a hard word with fresh eyes.</p>
<h3>8. Type instead of tapping</h3>
<p>On a computer you can type the letters straight away instead of tapping tiles. It’s much faster once you know the word, and a placed letter can be sent back with one tap if you change your mind.</p>

<h2>Using hints well</h2>
<p>You have 6 hints for the round. A hint shows the clue if it’s hidden; otherwise it places the next letter for you (never the last one). On high levels with hidden clues, using a hint to see the clue is often the best value, because the meaning narrows the search more than any single letter.</p>

<h2>Scoring</h2>
<p>Each word is worth 20 points per letter, multiplied by the level bonus (×1 at level 1, rising to ×2 at level 100), with up to 30% more for solving it quickly. Each hint costs a quarter of the word’s value and each wrong try costs 10 points, with a minimum of a fifth of the value. Skipped words score nothing, so it’s worth coming back to them if you have time left.</p>`,
  },
];

/** Guides that are live on [date] (YYYY-MM-DD), newest first. */
export function publishedGuides(date) {
  return GUIDES.filter((g) => g.published <= date).sort((a, b) => (a.published < b.published ? 1 : a.published > b.published ? -1 : 0));
}

/** "16 November 2026" from "2026-11-16". */
export function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${d} ${months[m - 1]} ${y}`;
}

/** Rough reading time in minutes, at 220 words a minute. */
export function readingMinutes(html) {
  const words = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(words / 220));
}
