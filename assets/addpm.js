// Interactive demo for Lecture 2: one call of Add⁺(u) at a height-1 node.
// Fixed parameters: p = 5, m = p − 1 = 4, ω = 2 (a primitive root mod 5), ℓ = 1.
// The reader picks f_u, the two leaf bits, and arbitrary junk in X, Y, Z, then
// steps through the 4 × 7 steps of the algorithm and watches the junk cancel.
// The layout mirrors Algorithm Add± and the trace table in the Cook–Mertz proof.

(function () {
  const P = 5, M = 4, OMEGA = 2;
  const mod = (a) => ((a % P) + P) % P;
  const pow = (b, e) => { let r = 1; for (let i = 0; i < e; i++) r = mod(r * b); return r; };
  const inv = (a) => pow(a, P - 2);

  const FUNCS = {
    and: { tilde: "f̃(a, b) = ab", f: (a, b) => a & b, ext: (a, b) => mod(a * b) },
    or: { tilde: "f̃(a, b) = a + b − ab", f: (a, b) => a | b, ext: (a, b) => mod(a + b - a * b) },
    xor: { tilde: "f̃(a, b) = a + b − 2ab", f: (a, b) => a ^ b, ext: (a, b) => mod(a + b - 2 * a * b) },
  };

  const PER = 7, TOTAL = M * PER;
  const sub = (s) => `<sub>${s}</sub>`;
  const U0 = "v" + sub("u0"), U1 = "v" + sub("u1");

  // Run the first k steps. Returns the registers, the values seen at each step (4),
  // and a description of the last step that ran.
  function simulate(st, k) {
    let X = st.x, Y = st.y, Z = st.z;
    const at4 = [];
    let last = null;
    for (let t = 0; t < k; t++) {
      const j = Math.floor(t / PER) + 1, s = t % PER, wj = pow(OMEGA, j), before = { X, Y, Z };
      let calc = "", changed = [];
      switch (s) {
        case 0:
          X = mod(wj * X); Y = mod(wj * Y); changed = ["X", "Y"];
          calc = `X ← ${wj}·${before.X} = ${X},  Y ← ${wj}·${before.Y} = ${Y}`;
          break;
        case 1:
          X = mod(X + st.v0); changed = ["X"];
          calc = `X ← X + ${U0} = ${before.X} + ${st.v0} = ${X}`;
          break;
        case 2:
          Y = mod(Y + st.v1); changed = ["Y"];
          calc = `Y ← Y + ${U1} = ${before.Y} + ${st.v1} = ${Y}`;
          break;
        case 3: {
          const fv = FUNCS[st.fn].ext(X, Y), add = mod(fv * inv(M));
          Z = mod(Z + add); changed = ["Z"];
          at4.push({ j, wj, X, Y, fv, add, Z });
          calc = `f̃(${X}, ${Y}) = ${fv},  Z ← Z + ${fv}/4 = ${before.Z} + ${add} = ${Z}`;
          break;
        }
        case 4:
          X = mod(X - st.v0); changed = ["X"];
          calc = `X ← X − ${U0} = ${before.X} − ${st.v0} = ${X}`;
          break;
        case 5:
          Y = mod(Y - st.v1); changed = ["Y"];
          calc = `Y ← Y − ${U1} = ${before.Y} − ${st.v1} = ${Y}`;
          break;
        case 6: {
          const wi = inv(wj);
          X = mod(wi * X); Y = mod(wi * Y); changed = ["X", "Y"];
          calc = `X ← ${wi}·${before.X} = ${X},  Y ← ${wi}·${before.Y} = ${Y}`;
          break;
        }
      }
      last = { j, s, calc, changed };
    }
    return { X, Y, Z, at4, last };
  }

  // What each register holds symbolically after the given step, matching the proof's trace table.
  function symbolic(last) {
    if (!last) return { X: "x", Y: "y", Z: "z" };
    const wj = "ω" + `<sup>${last.j}</sup>`;
    const zDone = last.s >= 3 ? last.j : last.j - 1;
    const Z = zDone === 0 ? "z" : `z + Σ<sub>i≤${zDone}</sub> f̃<sub>i</sub> / m`;
    const X = [`${wj}x`, `${wj}x + ${U0}`, `${wj}x + ${U0}`, `${wj}x + ${U0}`, `${wj}x`, `${wj}x`, "x"][last.s];
    const Y = [`${wj}y`, `${wj}y`, `${wj}y + ${U1}`, `${wj}y + ${U1}`, `${wj}y + ${U1}`, `${wj}y`, "y"][last.s];
    return { X, Y, Z };
  }

  const CSS = `
    .addpm .cols { display: flex; flex-wrap: wrap; gap: 16px; margin: 12px 0; }
    .addpm .col { flex: 1 1 300px; min-width: 0; }
    .addpm .panel { background: #fff; border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; }
    .addpm .panel-h { font-family: var(--mono); font-size: 11.5px; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 6px; }
    .addpm .code div { font-family: var(--mono); font-size: 13.5px; line-height: 1.75; padding: 0 6px; border-radius: 4px; white-space: nowrap; }
    .addpm .code .i1 { padding-left: 1.6em; } .addpm .code .i2 { padding-left: 3.2em; }
    .addpm .code .cur { background: #e6f4f1; color: var(--accent); font-weight: 600; }
    .addpm .code .tag { float: right; color: var(--muted); font-weight: 400; margin-left: 12px; }
    .addpm .code .jbadge { color: var(--accent); font-weight: 600; }
    .addpm .regs td.hl { background: #e6f4f1; font-weight: 600; }
    .addpm .regs td.sym { text-align: left; font-size: 13px; white-space: nowrap; }
    .addpm .calc { font-family: var(--mono); font-size: 13px; margin-top: 10px; line-height: 1.6; }
    .addpm .iters tr.cur td { background: #f0faf8; }
`;

  function make(root) {
    if (!document.getElementById("addpm-css")) {
      const s = document.createElement("style"); s.id = "addpm-css"; s.textContent = CSS; document.head.appendChild(s);
    }
    root.classList.add("addpm");
    root.innerHTML = `
      <div class="demo-title">Add⁺ on a height-1 tree</div>
      <div class="row out" style="color:var(--muted)">ℓ = 1 · p = 5 · m = 4 · ω = 2</div>
      <div class="row">
        <label>f<sub>u</sub></label>
        <select data-k="fn"><option value="and">AND</option><option value="or">OR</option><option value="xor">XOR</option></select>
        <span class="mono" data-k="tilde"></span>
      </div>
      <div class="row">
        <label>leaves ${U0}, ${U1}</label>
        <button class="bit" data-k="v0"></button><button class="bit" data-k="v1"></button>
        <label style="margin-left:12px">junk x, y, z ∈ ℤ₅</label>
        <input type="text" inputmode="numeric" data-k="x" style="width:3em">
        <input type="text" inputmode="numeric" data-k="y" style="width:3em">
        <input type="text" inputmode="numeric" data-k="z" style="width:3em">
        <button data-k="rand">random junk</button>
      </div>
      <div class="row">
        <button data-k="back">◀ step</button>
        <input data-k="slider" type="range" min="0" max="${TOTAL}" value="0" style="flex:1;min-width:120px">
        <button data-k="fwd">step ▶</button>
        <button data-k="end">run all</button>
        <button data-k="reset">reset</button>
      </div>
      <div class="cols">
        <div class="col panel">
          <div class="panel-h">Algorithm</div>
          <div class="code" data-k="code"></div>
        </div>
        <div class="col panel">
          <div class="panel-h">Registers</div>
          <div class="scroll-x" data-k="regs"></div>
          <div class="calc" data-k="calc"></div>
        </div>
      </div>
      <div class="panel-h" style="margin-top:4px">At step (4)</div>
      <div class="scroll-x iters" data-k="iters"></div>
      <div class="out" data-k="out" style="margin-top:10px"></div>`;

    const $ = (k) => root.querySelector(`[data-k="${k}"]`);
    const st = { fn: "and", v0: 1, v1: 1, x: 3, y: 1, z: 2 };
    let step = 0;

    function readJunk() {
      for (const k of ["x", "y", "z"]) {
        const n = parseInt($(k).value, 10);
        st[k] = Number.isFinite(n) ? mod(n) : 0;
      }
    }

    function render() {
      $("fn").value = st.fn;
      $("tilde").textContent = FUNCS[st.fn].tilde;
      for (const k of ["v0", "v1"]) { $(k).textContent = st[k]; $(k).classList.toggle("on", !!st[k]); }
      for (const k of ["x", "y", "z"]) if (document.activeElement !== $(k)) $(k).value = st[k];
      $("slider").value = step;

      const r = simulate(st, step), L = r.last;
      const cur = (s) => (L && L.s === s ? "cur" : "");
      const jText = L ? `<span class="jbadge">j = ${L.j}</span>` : `<span class="jbadge">not started</span>`;
      $("code").innerHTML = `
        <div>Add⁺(u):</div>
        <div class="i1">for j = 1 … m: <span class="tag">${jText}</span></div>
        <div class="i2 ${cur(0)}">multiply X and Y by ω<sup>j</sup> <span class="tag">(1)</span></div>
        <div class="i2 ${cur(1)}">Add⁺(u0) with target X <span class="tag">(2)</span></div>
        <div class="i2 ${cur(2)}">Add⁺(u1) with target Y <span class="tag">(3)</span></div>
        <div class="i2 ${cur(3)}">add f̃(X, Y) / m to Z <span class="tag">(4)</span></div>
        <div class="i2 ${cur(4)}">Add⁻(u0) with target X <span class="tag">(5)</span></div>
        <div class="i2 ${cur(5)}">Add⁻(u1) with target Y <span class="tag">(6)</span></div>
        <div class="i2 ${cur(6)}">multiply X and Y by ω<sup>−j</sup> <span class="tag">(7)</span></div>`;

      const sym = symbolic(L);
      const row = (name, role) => {
        const hl = L && L.changed.includes(name) ? "hl" : "";
        return `<tr><td class="${hl}">${name} <span style="color:var(--muted);font-weight:400;font-size:11.5px">${role}</span></td><td class="sym ${hl}">${sym[name]}</td><td class="${hl}">${r[name]}</td></tr>`;
      };
      $("regs").innerHTML = `<table class="regs"><tr><th>register</th><th>holds</th><th>value</th></tr>
        ${row("X", "scratch")}${row("Y", "scratch")}${row("Z", "target")}</table>`;
      $("calc").innerHTML = L
        ? L.calc
        : "";

      let rows = "";
      for (let i = 1; i <= M; i++) {
        const it = r.at4.find((a) => a.j === i);
        const c = L && L.j === i ? "cur" : "";
        rows += it
          ? `<tr class="${c}"><td>${i}</td><td>${it.wj}</td><td>${it.X}</td><td>${it.Y}</td><td>${it.fv}</td><td>+${it.add}</td><td>${it.Z}</td></tr>`
          : `<tr class="${c}"><td>${i}</td><td>${pow(OMEGA, i)}</td><td colspan="5" style="color:#c0c4cc">—</td></tr>`;
      }
      const want = FUNCS[st.fn].f(st.v0, st.v1);
      $("iters").innerHTML =
        `<table><tr><th>j</th><th>ω<sup>j</sup></th><th>X = ω<sup>j</sup>x + ${U0}</th><th>Y = ω<sup>j</sup>y + ${U1}</th><th>f̃(X, Y)</th><th>added to Z</th><th>Z</th></tr>${rows}</table>`;

      const naive = FUNCS[st.fn].ext(mod(st.x + st.v0), mod(st.y + st.v1));
      let out = `naive: f̃(x + ${U0}, y + ${U1}) = ${naive} ` +
        (naive === want ? `<span class="ok">= f(${U0}, ${U1})</span>` : `<span class="bad">≠ f(${U0}, ${U1}) = ${want}</span>`);
      if (step === TOTAL) {
        const gain = mod(r.Z - st.z);
        const okZ = gain === want, okXY = r.X === st.x && r.Y === st.y;
        out = `Z − z = ${gain} ` +
          (okZ ? `<span class="ok">= f(${U0}, ${U1}) ✓</span>` : `<span class="bad">≠ ${want}</span>`) +
          ` · X, Y ` + (okXY ? `<span class="ok">restored ✓</span>` : `<span class="bad">not restored</span>`) +
          `<br>` + out;
      }
      $("out").innerHTML = out;
    }

    $("fn").onchange = (e) => { st.fn = e.target.value; render(); };
    $("v0").onclick = () => { st.v0 ^= 1; render(); };
    $("v1").onclick = () => { st.v1 ^= 1; render(); };
    for (const k of ["x", "y", "z"]) $(k).oninput = () => { readJunk(); render(); };
    $("rand").onclick = () => { for (const k of ["x", "y", "z"]) st[k] = Math.floor(Math.random() * P); render(); };
    $("slider").oninput = (e) => { step = +e.target.value; render(); };
    $("back").onclick = () => { step = Math.max(0, step - 1); render(); };
    $("fwd").onclick = () => { step = Math.min(TOTAL, step + 1); render(); };
    $("end").onclick = () => { step = TOTAL; render(); };
    $("reset").onclick = () => { step = 0; render(); };
    render();
  }

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
      document.querySelectorAll(".demo[data-demo=addpm]").forEach(make);
    });
  }

  if (typeof module !== "undefined") module.exports = { simulate, FUNCS };
})();
