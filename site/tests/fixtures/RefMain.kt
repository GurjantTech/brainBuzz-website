// Reference dump from the app's real Kotlin generators, compared against the JS port.
import com.app.dailybrainchallenge.domain.game.*
import com.app.dailybrainchallenge.domain.model.*
import kotlin.random.Random

fun q(s: String) = "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"") + "\""
fun ql(q: Question) = "{\"p\":${q(q.prompt)},\"o\":${q.options},\"a\":${q.answer},\"e\":${q(q.explanation)},\"l\":${q(q.level?.name ?: "")}}"

fun item(i: OddItem) = when (i) {
    is OddItem.Glyph -> "\"G:${i.shape.name}:${i.rotation}:${i.scale}\""
    is OddItem.Number -> "\"N:${i.value}\""
    is OddItem.Letter -> "\"L:${i.char}:${i.mirrored}\""
}

fun main() {
    val out = StringBuilder()
    fun line(key: String, v: String) { out.append("{\"k\":${q(key)},\"v\":$v}\n") }

    // Raw RNG primitives.
    for (seed in listOf(0L, 1L, 12345L, -7L, 9_876_543_210L, 104_729L + 20000L * 7919L)) {
        val r = Random(seed)
        val ints = List(8) { r.nextInt() }
        val bounded = List(8) { r.nextInt(7) }
        val ranged = List(8) { r.nextInt(1, 20) }
        val pow2 = List(8) { r.nextInt(16) }
        val bools = List(8) { r.nextBoolean() }
        val floats = List(4) { r.nextFloat() }
        val shuffled = (0 until 10).shuffled(r)
        val range = List(5) { (3..12).random(r) }
        line("rng:$seed", "{\"ints\":$ints,\"bounded\":$bounded,\"ranged\":$ranged,\"pow2\":$pow2,\"bools\":$bools,\"floats\":${floats.map { it.toDouble() }},\"shuffled\":$shuffled,\"range\":$range}")
    }

    // Daily challenge sets.
    for (day in listOf(0L, 19000L, 20000L, 20381L, 20382L, 20383L, 20400L, 20747L, 20748L, 21000L)) {
        line("daily:$day", QuizConfig.dailyQuestions(day).joinToString(",", "[", "]") { ql(it) })
    }

    for (seed in 1L..6L) for (d in Difficulty.entries) {
        val r = Random(seed * 101)
        val m = MathGenerator(r)
        line("math:$seed:${d.name}", List(6) { ql(m.next(d)) }.joinToString(",", "[", "]"))
        val s = SequenceGenerator(r)
        line("seq:$seed:${d.name}", List(6) { ql(s.next(d)) }.joinToString(",", "[", "]"))

        val ro = Random(seed * 13)
        val odd = List(OddOneOut.PUZZLES) { i ->
            val p = OddOneOut.generate(d, i, ro)
            "{\"items\":${p.items.joinToString(",", "[", "]") { item(it) }},\"odd\":${p.oddIndex},\"c\":${p.columns},\"e\":${q(p.explanation)}}"
        }
        line("odd:$seed:${d.name}", odd.joinToString(",", "[", "]"))

        val rl = Random(seed * 17)
        val boards = List(3) { i ->
            val p = LogicPath.generate(d, i, rl)
            "{\"size\":${p.size},\"sr\":${p.startRow},\"er\":${p.endRow},\"tiles\":${p.tiles.map { "\"${it.kind.name}:${it.rotation}\"" }},\"path\":${p.solutionPath},\"par\":${p.par}}"
        }
        line("logic:$seed:${d.name}", boards.joinToString(",", "[", "]"))

        val rw = Random(seed * 19)
        line("word:$seed:${d.name}", WordScramble.round(d, rw).joinToString(",", "[", "]") { "{\"w\":${q(it.answer)},\"l\":${q(it.letters.joinToString(""))}}" })

        line("deck:$seed:${d.name}", MemoryDeck.deal(d, Random(seed * 23)).map { it.symbol }.toString())

        val rules = MemoryMatrix.rules(d)
        val rm = Random(seed * 29)
        var len = rules.startLength
        val matrix = List(10) { i ->
            val level = MemoryMatrix.levelFor(rules, len)
            val pat = MemoryMatrix.pattern(level, rm)
            val res = "{\"g\":${level.gridSize},\"len\":${level.length},\"p\":$pat}"
            len = MemoryMatrix.nextLength(rules, len, cleared = i % 3 != 2)
            res
        }
        line("matrix:$seed:${d.name}", matrix.joinToString(",", "[", "]"))

        val am = AdaptiveMath(d, MathGenerator(Random(seed * 31)))
        val answers = "1111011110011111001".map { it == '1' }
        val adapt = answers.map { c -> val qq = am.next(); am.record(c); "{\"q\":${ql(qq)},\"after\":${q(am.current.name)}}" }
        line("adaptive:$seed:${d.name}", adapt.joinToString(",", "[", "]"))
    }

    // Scoring tables.
    val sc = StringBuilder("[")
    for (d in Difficulty.entries) for (sp in listOf(0f, 0.3f, 0.77f, 1f, 1.4f)) for (c in listOf(0, 1, 2, 5, 11, 15)) sc.append(Scoring.pointsFor(d, sp, c)).append(',')
    for (d in Difficulty.entries) for (len in 3..10) for (h in listOf(true, false)) sc.append(Scoring.matrixRound(d, len, h)).append(',')
    for (d in Difficulty.entries) for (taps in listOf(2, 9, 40)) for (ms in listOf(0L, 15_500L, 200_000L)) for (h in 0..2) sc.append(Scoring.logicPath(d, 5, 6, taps, ms, h)).append(',')
    for (d in Difficulty.entries) for (len in listOf(4, 6, 8)) for (h in 0..3) for (w in listOf(0, 2, 9)) for (sp in listOf(-0.5f, 0.2f, 0.9f)) sc.append(Scoring.word(d, len, h, w, sp)).append(',')
    for (d in Difficulty.entries) for (moves in listOf(6, 10, 30)) for (ms in listOf(5_000L, 42_300L, 300_000L)) for (h in 0..2) sc.append(Scoring.memoryScore(d, 8, moves, ms, h)).append(',')
    sc.setLength(sc.length - 1); sc.append("]")
    line("scoring", sc.toString())

    print(out)
}
