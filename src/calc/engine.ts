// A small, safe expression evaluator for the calculator (no eval).
// Symbols the keypad writes: digits . + − × ÷ ^ ( ) ! % ² π e √ ∛ C P and the functions below.

export type AngleMode = 'deg' | 'rad';

const FUNCS = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'ln', 'log', 'abs'] as const;
type Func = (typeof FUNCS)[number];

type Tok =
  | { t: 'num'; v: number }
  | { t: 'op'; v: string }
  | { t: 'fn'; v: Func }
  | { t: '('; }
  | { t: ')'; };

function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === ' ') { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      const text = src.slice(i, j);
      if ((text.match(/\./g) ?? []).length > 1 || text === '.') throw new Error('bad number');
      out.push({ t: 'num', v: parseFloat(text) });
      i = j;
      continue;
    }
    if (/[a-z]/.test(c)) {
      let j = i;
      while (j < src.length && /[a-z]/.test(src[j])) j++;
      const word = src.slice(i, j);
      if ((FUNCS as readonly string[]).includes(word)) out.push({ t: 'fn', v: word as Func });
      else if (word === 'e') out.push({ t: 'num', v: Math.E });
      else throw new Error(`unknown ${word}`);
      i = j;
      continue;
    }
    if (c === 'π') { out.push({ t: 'num', v: Math.PI }); i++; continue; }
    if (c === '(') { out.push({ t: '(' }); i++; continue; }
    if (c === ')') { out.push({ t: ')' }); i++; continue; }
    if ('+-−×*÷/^!%²√∛CP'.includes(c)) {
      const map: Record<string, string> = { '-': '−', '*': '×', '/': '÷' };
      out.push({ t: 'op', v: map[c] ?? c });
      i++;
      continue;
    }
    throw new Error(`unexpected ${c}`);
  }
  return out;
}

function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0 || n > 170) return NaN;
  let r = 1;
  for (let k = 2; k <= n; k++) r *= k;
  return r;
}

function choose(n: number, r: number, perm: boolean): number {
  if (![n, r].every(Number.isInteger) || r < 0 || n < 0 || r > n) return NaN;
  let res = 1;
  for (let k = 0; k < r; k++) res *= n - k;
  return perm ? res : res / factorial(r);
}

export function evaluate(src: string, mode: AngleMode = 'rad'): number {
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];
  const isOp = (v: string) => peek()?.t === 'op' && (peek() as { v: string }).v === v;
  const toRad = (x: number) => (mode === 'deg' ? (x * Math.PI) / 180 : x);
  const fromRad = (x: number) => (mode === 'deg' ? (x * 180) / Math.PI : x);
  const startsOperand = () => {
    const k = peek();
    return !!k && (k.t === 'num' || k.t === 'fn' || k.t === '(' || (k.t === 'op' && (k.v === '√' || k.v === '∛')));
  };

  function expr(): number {
    let v = term();
    while (isOp('+') || isOp('−')) {
      const op = (toks[p++] as { v: string }).v;
      const r = term();
      v = op === '+' ? v + r : v - r;
    }
    return v;
  }

  function term(): number {
    let v = unary();
    for (;;) {
      if (isOp('×') || isOp('÷')) {
        const op = (toks[p++] as { v: string }).v;
        const r = unary();
        v = op === '×' ? v * r : v / r;
      } else if (startsOperand()) {
        v *= unary(); // implicit multiplication: 2π, 3(4), 2sin(30)
      } else {
        return v;
      }
    }
  }

  function unary(): number {
    if (isOp('−')) { p++; return -unary(); }
    if (isOp('+')) { p++; return unary(); }
    if (isOp('√')) { p++; return Math.sqrt(unary()); }
    if (isOp('∛')) { p++; return Math.cbrt(unary()); }
    return power();
  }

  function power(): number {
    const base = combo();
    if (isOp('^')) {
      p++;
      return Math.pow(base, unary()); // right-associative
    }
    return base;
  }

  function combo(): number {
    let v = postfix();
    while (isOp('C') || isOp('P')) {
      const perm = (toks[p++] as { v: string }).v === 'P';
      v = choose(v, postfix(), perm);
    }
    return v;
  }

  function postfix(): number {
    let v = primary();
    for (;;) {
      if (isOp('!')) { p++; v = factorial(v); }
      else if (isOp('%')) { p++; v = v / 100; }
      else if (isOp('²')) { p++; v = v * v; }
      else return v;
    }
  }

  function primary(): number {
    const k = toks[p++];
    if (!k) throw new Error('incomplete');
    if (k.t === 'num') return k.v;
    if (k.t === '(') {
      const v = expr();
      if (peek()?.t === ')') p++; // allow a missing closing bracket at the end
      else if (p < toks.length) throw new Error('missing )');
      return v;
    }
    if (k.t === 'fn') {
      if (peek()?.t !== '(') throw new Error('missing (');
      const x = primary();
      switch (k.v) {
        case 'sin': return Math.sin(toRad(x));
        case 'cos': return Math.cos(toRad(x));
        case 'tan': return Math.tan(toRad(x));
        case 'asin': return fromRad(Math.asin(x));
        case 'acos': return fromRad(Math.acos(x));
        case 'atan': return fromRad(Math.atan(x));
        case 'ln': return Math.log(x);
        case 'log': return Math.log10(x);
        case 'abs': return Math.abs(x);
      }
    }
    throw new Error('unexpected');
  }

  const v = expr();
  if (p < toks.length) throw new Error('unexpected');
  return v;
}

/** Evaluates, returning null instead of throwing (used for the live preview). */
export function tryEvaluate(src: string, mode: AngleMode): number | null {
  if (!src.trim()) return null;
  try {
    const v = evaluate(src, mode);
    return Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

export function formatNumber(v: number, digits = 12): string {
  if (!Number.isFinite(v)) return 'Error';
  if (Object.is(v, -0) || Math.abs(v) < 1e-12) return '0';
  const abs = Math.abs(v);
  if (abs >= 1e12 || abs < 1e-6) return v.toExponential(6).replace(/\.?0+e/, 'e');
  return String(parseFloat(v.toPrecision(digits)));
}

/** Font size that keeps a number on one line (adjustsFontSizeToFit does nothing on web). */
export function fitFont(text: string, base: number): number {
  if (text.length <= 8) return base;
  return Math.max(22, Math.round((base * 8) / text.length));
}

/** Best fraction for v with a denominator up to maxDen, or null if none is close. */
export function toFraction(v: number, maxDen = 10000): string | null {
  if (!Number.isFinite(v) || Number.isInteger(v)) return null;
  const sign = v < 0 ? '−' : '';
  let x = Math.abs(v);
  let [h0, h1, k0, k1] = [0, 1, 1, 0];
  for (let i = 0; i < 40; i++) {
    const a = Math.floor(x);
    [h0, h1] = [h1, a * h1 + h0];
    [k0, k1] = [k1, a * k1 + k0];
    if (k1 > maxDen) return null;
    if (Math.abs(h1 / k1 - Math.abs(v)) < 1e-10) return `${sign}${h1}/${k1}`;
    x = 1 / (x - a);
    if (!Number.isFinite(x)) break;
  }
  return null;
}
