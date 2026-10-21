/**
 * Port of Kotlin's kotlin.random.Random (XorWowRandom) and the stdlib helpers the app uses
 * (nextInt ranges, IntRange.random, List.random, shuffled). Same seed, same sequence, so
 * seeded content such as the Daily Challenge matches the Android app exactly.
 */
export class KRandom {
  /** Seeds like Kotlin's Random(seed: Long). Accepts a Number (safe integer) or a BigInt. */
  static ofSeed(seed) {
    const s = BigInt(seed);
    return new KRandom(Number(BigInt.asIntN(32, s)), Number(BigInt.asIntN(32, s >> 32n)));
  }

  /** A randomly seeded generator for normal play (Kotlin's Random.Default equivalent). */
  static fresh() {
    const seeds = new Int32Array(2);
    if (globalThis.crypto && globalThis.crypto.getRandomValues) globalThis.crypto.getRandomValues(seeds);
    else { seeds[0] = (Math.random() * 2 ** 32) | 0; seeds[1] = (Math.random() * 2 ** 32) | 0; }
    return new KRandom(seeds[0], seeds[1]);
  }

  constructor(seed1, seed2) {
    this.x = seed1 | 0;
    this.y = seed2 | 0;
    this.z = 0;
    this.w = 0;
    this.v = ~seed1;
    this.addend = (seed1 << 10) ^ (seed2 >>> 4);
    // Kotlin discards the first 64 values so trivial seeds don't start with zeroes.
    for (let i = 0; i < 64; i++) this.nextInt();
  }

  nextInt() {
    let t = this.x;
    t ^= t >>> 2;
    this.x = this.y;
    this.y = this.z;
    this.z = this.w;
    const v0 = this.v;
    this.w = v0;
    t = (t ^ (t << 1)) ^ v0 ^ (v0 << 4);
    this.v = t;
    this.addend = (this.addend + 362437) | 0;
    return (t + this.addend) | 0;
  }

  nextBits(bitCount) {
    return (this.nextInt() >>> (32 - bitCount)) & (-bitCount >> 31);
  }

  /** Kotlin nextInt(until): 0 until [until]. */
  nextIntUntil(until) {
    return this.nextIntRange(0, until);
  }

  /** Kotlin nextInt(from, until): [from] inclusive to [until] exclusive. */
  nextIntRange(from, until) {
    if (until <= from) throw new RangeError(`Empty range ${from}..${until}`);
    const n = (until - from) | 0;
    if (n > 0 || n === -2147483648) {
      let rnd;
      if ((n & -n) === n) {
        rnd = this.nextBits(31 - Math.clz32(n));
      } else {
        let bits;
        let v;
        do {
          bits = this.nextInt() >>> 1;
          v = bits % n;
        } while (((bits - v + (n - 1)) | 0) < 0);
        rnd = v;
      }
      return from + rnd;
    }
    for (;;) {
      const rnd = this.nextInt();
      if (rnd >= from && rnd < until) return rnd;
    }
  }

  nextBoolean() {
    return this.nextBits(1) !== 0;
  }

  nextFloat() {
    return this.nextBits(24) / (1 << 24);
  }

  /** Kotlin IntRange.random(random) for first..last inclusive. */
  intIn(first, last) {
    return this.nextIntRange(first, last + 1);
  }

  /** Kotlin List.random(random). */
  pick(list) {
    if (list.length === 0) throw new RangeError('Collection is empty.');
    return list[this.nextIntUntil(list.length)];
  }

  /** Kotlin Iterable.shuffled(random): a shuffled copy. */
  shuffled(list) {
    const a = Array.from(list);
    for (let i = a.length - 1; i >= 1; i--) {
      const j = this.nextIntUntil(i + 1);
      const tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }
}

/** Kotlin's (0 until n) as an array. */
export const until = (n) => Array.from({ length: n }, (_, i) => i);

/** Kotlin's first..last as an array. */
export const rangeOf = (first, last) => Array.from({ length: last - first + 1 }, (_, i) => first + i);
