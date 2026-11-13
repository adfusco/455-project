// Permutation utilities + the interactive demos for Lecture 1.
// Convention: permutations act on {1..w}, stored 0-indexed as arrays p with p[i] = image of i.
// Products are read LEFT TO RIGHT, as in a branching program: (a·b)(i) = b(a(i)).

const Perm = {
  id: (w) => Array.from({ length: w }, (_, i) => i),
  mul: (a, b) => a.map((x) => b[x]),
  inv: (a) => { const r = new Array(a.length); a.forEach((x, i) => (r[x] = i)); return r; },
  isId: (a) => a.every((x, i) => x === i),
  eq: (a, b) => a.every((x, i) => x === b[i]),
  conj: (theta, p) => Perm.mul(Perm.mul(Perm.inv(theta), p), theta), // θ⁻¹ p θ
  comm: (a, b) => Perm.mul(Perm.mul(Perm.mul(a, b), Perm.inv(a)), Perm.inv(b)), // a b a⁻¹ b⁻¹

  // "(1 2 3 4 5)(6 7)", "(12345)", "e", "" -> array of length w
  parse(str, w) {
    const p = Perm.id(w);
    const s = str.trim();
    if (s === "" || s === "e" || s === "()") return p;
    const cycles = s.match(/\(([^)]*)\)/g);
    if (!cycles || cycles.join("") !== s.replace(/\s+(?=\()|(?<=\))\s+/g, "")) throw new Error("use cycle notation, e.g. (1 2 3 4 5)");
    for (const c of cycles) {
      const inner = c.slice(1, -1).trim();
      const pts = (/\s|,/.test(inner) ? inner.split(/[\s,]+/) : inner.split("")).filter(Boolean).map(Number);
      if (pts.some((x) => !Number.isInteger(x) || x < 1 || x > w)) throw new Error(`points must be 1..${w}`);
      if (new Set(pts).size !== pts.length) throw new Error("repeated point in a cycle");
      const q = Perm.id(w);
      pts.forEach((x, k) => (q[x - 1] = pts[(k + 1) % pts.length] - 1));
      Object.assign(p, Perm.mul(p, q));
    }
    return p;
  },

  fmt(p) {
    const seen = new Set();
    let out = "";
    for (let i = 0; i < p.length; i++) {
      if (seen.has(i) || p[i] === i) continue;
      const c = [];
      let j = i;
      do { c.push(j + 1); seen.add(j); j = p[j]; } while (j !== i);
      out += "(" + c.join(" ") + ")";
    }
    return out || "e";
  },

  cycleType: (p) => {
    const seen = new Set(), t = [];
    for (let i = 0; i < p.length; i++) {
      if (seen.has(i)) continue;
      let j = i, len = 0;
      do { seen.add(j); j = p[j]; len++; } while (j !== i);
      t.push(len);
    }
    return t.sort((a, b) => b - a);
  },
  isFullCycle: (p) => Perm.cycleType(p)[0] === p.length,

  all(w) {
    const out = [];
    const rec = (arr, rest) => {
      if (!rest.length) return out.push(arr);
      rest.forEach((x, k) => rec(arr.concat(x), rest.filter((_, j) => j !== k)));
    };
    rec([], Perm.id(w));
    return out;
  },

  // θ with θ⁻¹ c θ = a, for two full cycles c, a of the same length
  conjugator(c, a) {
    const order = (p) => { const r = [0]; while (r.length < p.length) r.push(p[r[r.length - 1]]); return r; };
    const oc = order(c), oa = order(a), th = new Array(c.length);
    oc.forEach((x, k) => (th[x] = oa[k]));
    return th;
  },
};

/* ------------------------------------------------------------------ */
/* Branching program evaluation                                         */
/* A program is { n, w, ins: [{ v, p0, p1 }] } with v a 0-indexed variable. */
/* ------------------------------------------------------------------ */
const BP = {
  run(prog, x, upto = prog.ins.length) {
    let p = Perm.id(prog.w);
    for (let k = 0; k < upto; k++) {
      const I = prog.ins[k];
      p = Perm.mul(p, x[I.v] ? I.p1 : I.p0);
    }
    return p;
  },
};

/* ------------------------------------------------------------------ */
/* Demo: branching-program stepper (wiring diagram)                     */
/* ------------------------------------------------------------------ */
function makeStepper(root) {
  const PRESETS = {
    parity: () => {
      const w = 2, n = 4, swap = Perm.parse("(1 2)", w);
      return { name: "Parity, width 2", n, w, ins: Array.from({ length: n }, (_, v) => ({ v, p0: Perm.id(w), p1: swap })) };
    },
    mod3: () => {
      const w = 3, n = 4, c = Perm.parse("(1 2 3)", w);
      return { name: "MOD₃, width 3", n, w, ins: Array.from({ length: n }, (_, v) => ({ v, p0: Perm.id(w), p1: c })) };
    },
    and: () => {
      const w = 5, s = Perm.parse("(1 2 3 4 5)", w), t = Perm.parse("(1 3 5 4 2)", w), e = Perm.id(w);
      return {
        name: "x₁ ∧ x₂ via commutator, width 5", n: 2, w,
        ins: [{ v: 0, p0: e, p1: s }, { v: 1, p0: e, p1: t }, { v: 0, p0: e, p1: Perm.inv(s) }, { v: 1, p0: e, p1: Perm.inv(t) }],
      };
    },
  };

  root.innerHTML = `
    <div class="demo-title">Branching program stepper</div>
    <div class="row">
      <label>Program</label>
      <select data-k="preset">
        <option value="parity">Parity, width 2</option>
        <option value="mod3">MOD₃, width 3</option>
        <option value="and">x₁ ∧ x₂ (commutator), width 5</option>
        <option value="built" disabled>From formula builder</option>
      </select>
    </div>
    <div class="row"><label>Input x</label><span data-k="bits" class="row" style="margin:0"></span></div>
    <div class="row">
      <button data-k="back">◀</button>
      <input data-k="slider" type="range" min="0" value="0" style="flex:1;min-width:120px">
      <button data-k="fwd">▶</button>
      <button data-k="end">run all</button>
    </div>
    <div class="scroll-x wiring" data-k="svgwrap"></div>
    <div class="row out" data-k="out"></div>`;

  const $ = (k) => root.querySelector(`[data-k="${k}"]`);
  let prog, x, step;

  function load(p) {
    prog = p;
    x = new Array(p.n).fill(0);
    if (p.n <= 6) x = x.map((_, i) => (i % 2 === 0 ? 1 : 0));
    step = p.ins.length;
    $("slider").max = p.ins.length;
    renderBits();
    render();
  }

  function renderBits() {
    const box = $("bits");
    box.innerHTML = "";
    x.forEach((b, i) => {
      const btn = document.createElement("button");
      btn.className = "bit" + (b ? " on" : "");
      btn.textContent = b;
      btn.title = `x${i + 1}`;
      btn.onclick = () => { x[i] ^= 1; renderBits(); render(); };
      box.appendChild(btn);
    });
  }

  function render() {
    $("slider").value = step;
    const w = prog.w, L = prog.ins.length;
    const colW = L > 64 ? 22 : 54, padL = 30, padT = 26, rowH = 26;
    const W = padL + L * colW + 30, H = padT + (w - 1) * rowH + 18;
    const y = (r) => padT + r * rowH;
    // track where each element sits after each instruction
    let pos = Perm.id(w); // pos[e] = current wire of element e
    let paths = Array.from({ length: w }, (_, e) => [y(e)]);
    let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="IBM Plex Mono, monospace" font-size="11">`;
    for (let r = 0; r < w; r++) svg += `<text x="4" y="${y(r) + 4}" fill="#6b7280">${r + 1}</text>`;
    const segs = [];
    prog.ins.forEach((I, k) => {
      const p = x[I.v] ? I.p1 : I.p0;
      const x0 = padL + k * colW, x1 = x0 + colW;
      const active = k < step;
      if (colW >= 40) svg += `<text x="${x0 + colW / 2}" y="12" text-anchor="middle" fill="${active ? "#1a1d23" : "#c0c4cc"}">x${I.v + 1}=${x[I.v]}</text>`;
      for (let e = 0; e < w; e++) {
        const from = pos[e], to = active ? p[from] : from;
        segs.push({ e, x0, x1, y0: y(from), y1: y(to), active });
      }
      if (active) pos = pos.map((r) => p[r]);
    });
    const colors = ["#0f766e", "#b00201", "#4f46e5", "#b45309", "#7c3aed"];
    for (const s of segs) {
      const c = s.active ? colors[s.e % colors.length] : "#e5e7eb";
      const mx = (s.x0 + s.x1) / 2;
      svg += `<path d="M${s.x0} ${s.y0} C${mx} ${s.y0} ${mx} ${s.y1} ${s.x1} ${s.y1}" stroke="${c}" stroke-width="${s.active ? 2 : 1.5}" fill="none" opacity="${s.active ? 0.9 : 1}"/>`;
    }
    if (step < L) {
      const xs = padL + step * colW;
      svg += `<line x1="${xs}" x2="${xs}" y1="${padT - 8}" y2="${H - 4}" stroke="#1a1d23" stroke-dasharray="3 3"/>`;
    }
    svg += "</svg>";
    $("svgwrap").innerHTML = svg;

    const partial = BP.run(prog, x, step);
    const full = BP.run(prog, x);
    $("out").innerHTML =
      `<span>after ${step}/${L} steps: <b>${Perm.fmt(partial)}</b></span>` +
      (step === L ? `<span>· P(x) ${Perm.isId(full) ? "= e" : "≠ e"}</span>` : "");
  }

  $("preset").onchange = (ev) => { if (PRESETS[ev.target.value]) load(PRESETS[ev.target.value]()); else if (root._built) load(root._built); };
  $("slider").oninput = (ev) => { step = +ev.target.value; render(); };
  $("back").onclick = () => { step = Math.max(0, step - 1); render(); };
  $("fwd").onclick = () => { step = Math.min(prog.ins.length, step + 1); render(); };
  $("end").onclick = () => { step = prog.ins.length; render(); };

  root.loadProgram = (p) => {
    root._built = p;
    const opt = $("preset").querySelector('option[value="built"]');
    opt.disabled = false;
    $("preset").value = "built";
    load(p);
    root.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  load(PRESETS[root.dataset.preset || "parity"]());
  $("preset").value = root.dataset.preset || "parity";
}

/* ------------------------------------------------------------------ */
/* Demo: commutator playground                                          */
/* ------------------------------------------------------------------ */
function makeCommutator(root) {
  root.innerHTML = `
    <div class="demo-title">Commutator playground (S₅)</div>
    <div class="row">
      <label>σ</label><input data-k="s" type="text" value="(1 2 3 4 5)" size="14">
      <label>τ</label><input data-k="t" type="text" value="(1 3 5 4 2)" size="14">
    </div>
    <div class="row out" data-k="res"></div>
    <div class="scroll-x" data-k="table"></div>
    <div class="row" style="margin-top:14px">
      <button data-k="count">Count good pairs of 5-cycles</button>
      <button data-k="s4">Try the same trick in S₄</button>
    </div>
    <div class="out" data-k="extra"></div>`;
  const $ = (k) => root.querySelector(`[data-k="${k}"]`);

  function render() {
    let s, t;
    try { s = Perm.parse($("s").value, 5); t = Perm.parse($("t").value, 5); }
    catch (e) { $("res").innerHTML = `<span class="bad">${e.message}</span>`; $("table").innerHTML = ""; return; }
    const c = Perm.comm(s, t), e = Perm.id(5);
    $("res").innerHTML = `στσ⁻¹τ⁻¹ = <b>${Perm.fmt(c)}</b> ` +
      (Perm.isFullCycle(c) ? `<span class="ok">✓ a 5-cycle</span>` : `<span class="bad">✗ not a 5-cycle</span>`);
    let rows = "";
    for (const f of [0, 1]) for (const g of [0, 1]) {
      const a = f ? s : e, b = g ? t : e;
      const out = Perm.mul(Perm.mul(Perm.mul(a, b), Perm.inv(a)), Perm.inv(b));
      rows += `<tr><td>${f}</td><td>${g}</td><td>${f ? "σ" : "e"} · ${g ? "τ" : "e"} · ${f ? "σ⁻¹" : "e"} · ${g ? "τ⁻¹" : "e"}</td><td><b>${Perm.fmt(out)}</b></td></tr>`;
    }
    $("table").innerHTML = `<table><tr><th>f</th><th>g</th><th>product</th><th>=</th></tr>${rows}</table>`;
  }

  $("count").onclick = () => {
    const cyc = Perm.all(5).filter(Perm.isFullCycle);
    let good = 0;
    for (const a of cyc) for (const b of cyc) if (Perm.isFullCycle(Perm.comm(a, b))) good++;
    $("extra").innerHTML = `${good} of ${cyc.length * cyc.length} ordered pairs (σ, τ) of 5-cycles have a 5-cycle commutator.`;
  };

  // In S₄ (solvable), look for α ≠ e and β, γ conjugate to α with [β, γ] = α.
  $("s4").onclick = () => {
    const G = Perm.all(4);
    const classOf = (a) => {
      const k = Perm.cycleType(a).join(",");
      return G.filter((g) => Perm.cycleType(g).join(",") === k);
    };
    const hits = [];
    for (const a of G) {
      if (Perm.isId(a)) continue;
      const C = classOf(a);
      if (C.some((b) => C.some((c) => Perm.eq(Perm.comm(b, c), a)))) hits.push(Perm.fmt(a));
    }
    $("extra").innerHTML = hits.length
      ? `S₄: works for ${hits.join(", ")}`
      : `S₄: no α ≠ e is a commutator [β, γ] of two conjugates of itself.`;
  };

  root.addEventListener("input", render);
  render();
}

/* ------------------------------------------------------------------ */
/* Demo: formula -> width-5 branching program (Barrington construction) */
/* ------------------------------------------------------------------ */
const Formula = {
  // grammar: or := and ('∨' and)* ; and := un ('∧' un)* ; un := '¬' un | '(' or ')' | x<k>
  parse(src) {
    const toks = src.replace(/\bAND\b|&&?|\/\\|\*/gi, "∧").replace(/\bOR\b|\|\|?|\\\/|\+/gi, "∨").replace(/\bNOT\b|[!~]/gi, "¬")
      .match(/x\d+|[∧∨¬()]|\S/g) || [];
    let i = 0;
    const peek = () => toks[i], eat = (t) => { if (toks[i] !== t) throw new Error(`expected ${t}`); i++; };
    const un = () => {
      const t = peek();
      if (t === "¬") { i++; return { op: "not", a: un() }; }
      if (t === "(") { i++; const e = or(); eat(")"); return e; }
      if (t && /^x\d+$/.test(t)) { i++; const v = +t.slice(1); if (v < 1) throw new Error("variables start at x1"); return { op: "var", v: v - 1 }; }
      throw new Error(t ? `unexpected "${t}"` : "unexpected end");
    };
    const and = () => { let e = un(); while (peek() === "∧") { i++; e = { op: "and", a: e, b: un() }; } return e; };
    const or = () => { let e = and(); while (peek() === "∨") { i++; e = { op: "or", a: e, b: and() }; } return e; };
    const e = or();
    if (i < toks.length) throw new Error(`unexpected "${toks[i]}"`);
    return e;
  },
  vars: (f) => (f.op === "var" ? f.v + 1 : f.op === "not" ? Formula.vars(f.a) : Math.max(Formula.vars(f.a), Formula.vars(f.b))),
  depth: (f) => (f.op === "var" ? 0 : f.op === "not" ? Formula.depth(f.a) : 1 + Math.max(Formula.depth(f.a), Formula.depth(f.b))),
  eval: (f, x) => (f.op === "var" ? x[f.v] : f.op === "not" ? 1 - Formula.eval(f.a, x)
    : f.op === "and" ? Formula.eval(f.a, x) & Formula.eval(f.b, x) : Formula.eval(f.a, x) | Formula.eval(f.b, x)),
};

const Barrington = {
  SIGMA: Perm.parse("(1 2 3 4 5)", 5),
  TAU: Perm.parse("(1 3 5 4 2)", 5),

  // returns instructions that alpha-compute f (alpha a 5-cycle)
  build(f, alpha) {
    const e = Perm.id(5);
    if (f.op === "var") return [{ v: f.v, p0: e, p1: alpha }];
    if (f.op === "not") {
      // program for f with target α⁻¹, then multiply by α at the end (merged into last instruction)
      const P = Barrington.build(f.a, Perm.inv(alpha));
      const last = P[P.length - 1];
      P[P.length - 1] = { v: last.v, p0: Perm.mul(last.p0, alpha), p1: Perm.mul(last.p1, alpha) };
      return P;
    }
    if (f.op === "or") return Barrington.build({ op: "not", a: { op: "and", a: { op: "not", a: f.a }, b: { op: "not", a: f.b } } }, alpha);
    // AND: relabel the fixed pair (σ, τ) so their commutator becomes α
    const th = Perm.conjugator(Perm.comm(Barrington.SIGMA, Barrington.TAU), alpha);
    const b = Perm.conj(th, Barrington.SIGMA), c = Perm.conj(th, Barrington.TAU);
    return [
      ...Barrington.build(f.a, b), ...Barrington.build(f.b, c),
      ...Barrington.build(f.a, Perm.inv(b)), ...Barrington.build(f.b, Perm.inv(c)),
    ];
  },
};

function makeBuilder(root) {
  root.innerHTML = `
    <div class="demo-title">Formula → width-5 program</div>
    <div class="row">
      <label>f =</label>
      <input data-k="f" type="text" value="(x1 ∧ x2) ∨ ¬x3" style="flex:1;min-width:180px">
      <button data-k="go" class="primary">Build</button>
    </div>
    <div class="row" style="font-size:12.5px;color:#6b7280">
      <span>use x1, x2, …; ∧ (or &amp;), ∨ (or |), ¬ (or !), parentheses</span>
    </div>
    <div class="out" data-k="res"></div>
    <div class="scroll-x" data-k="table" style="margin-top:10px"></div>
    <div class="row" data-k="actions"></div>`;
  const $ = (k) => root.querySelector(`[data-k="${k}"]`);

  function go() {
    let f;
    try { f = Formula.parse($("f").value); }
    catch (e) { $("res").innerHTML = `<span class="bad">${e.message}</span>`; $("table").innerHTML = $("actions").innerHTML = ""; return; }
    const n = Formula.vars(f), d = Formula.depth(f);
    if (n > 8) { $("res").innerHTML = `<span class="bad">at most 8 variables</span>`; return; }
    const ins = Barrington.build(f, Barrington.SIGMA);
    const prog = { name: "built", n, w: 5, ins };
    let ok = true, rows = "";
    for (let m = 0; m < 1 << n; m++) {
      const x = Array.from({ length: n }, (_, i) => (m >> i) & 1);
      const fx = Formula.eval(f, x), px = BP.run(prog, x);
      const good = fx ? Perm.eq(px, Barrington.SIGMA) : Perm.isId(px);
      ok = ok && good;
      if (m < 16) rows += `<tr><td>${x.join("")}</td><td>${fx}</td><td>${Perm.fmt(px)}</td><td class="${good ? "ok" : "bad"}">${good ? "✓" : "✗"}</td></tr>`;
    }
    $("res").innerHTML =
      `AND/OR depth d = ${d} · program length <b>${ins.length}</b> (≤ 4<sup>d</sup> = ${4 ** d}) · ` +
      `σ = (1 2 3 4 5) · ` + (ok ? `<span class="ok">σ-computes f on all ${1 << n} inputs ✓</span>` : `<span class="bad">mismatch</span>`);
    $("table").innerHTML = `<table><tr><th>x₁…x${n > 1 ? "ₙ" : "₁"}</th><th>f(x)</th><th>P(x)</th><th></th></tr>${rows}</table>` +
      (1 << n > 16 ? `<div style="font-size:12.5px;color:#6b7280;margin-top:4px">first 16 of ${1 << n} inputs shown</div>` : "");
    $("actions").innerHTML = "";
    const stepper = document.querySelector(root.dataset.stepper || "");
    if (stepper && ins.length <= 256) {
      const b = document.createElement("button");
      b.textContent = "Load into the stepper";
      b.onclick = () => stepper.loadProgram(prog);
      $("actions").appendChild(b);
    }
  }
  $("go").onclick = go;
  $("f").addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
  go();
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".demo[data-demo=stepper]").forEach(makeStepper);
  document.querySelectorAll(".demo[data-demo=commutator]").forEach(makeCommutator);
  document.querySelectorAll(".demo[data-demo=builder]").forEach(makeBuilder);
});

if (typeof module !== "undefined") module.exports = { Perm, BP, Formula, Barrington };
