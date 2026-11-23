// Lecture 2 demo: what each level of recursion stores.
// Left: depth-first TreeEval keeps the left child's ℓ-bit value in its frame while it computes the right child.
// Right: Cook–Mertz keeps only a loop counter and a step number per frame; values live in three
// register groups X, Y, Z that every level shares. Both sides follow the same root-to-leaf path
// (Cook–Mertz's first loop iteration, j = 1, visits children in the same order).

(function () {
  const H = 3, ELL = 4; // tree height and value width shown in the picture

  const leafVal = (u) => { let h = 7; for (const c of u) h = (h * 31 + (c === "1" ? 5 : 3)) % 16; return h; };
  const combine = (a, b) => (a + b) % 16; // a stand-in f_u
  const bits = (v) => v.toString(2).padStart(ELL, "0");
  const name = (u) => (u === "" ? "root" : u);

  // Precompute every snapshot of the depth-first traversal.
  function trace() {
    const events = [], stack = [], done = {};
    const snap = (cur, note) => events.push({ cur, note, done: { ...done }, stack: stack.map((f) => ({ ...f })) });
    function dfs(u, target) {
      const frame = { u, target, phase: "enter", left: null };
      stack.push(frame);
      if (u.length === H) {
        frame.phase = "leaf";
        const v = leafVal(u);
        done[u] = v;
        snap(u, `${name(u)} is a leaf: its value is read straight from the input`);
        stack.pop();
        return v;
      }
      const others = ["X", "Y", "Z"].filter((g) => g !== target);
      frame.phase = "left";
      snap(u, `at ${name(u)}: recurse into the left child ${u}0`);
      const a = dfs(u + "0", others[0]);
      frame.left = a;
      frame.phase = "right";
      snap(u, `back at ${name(u)}: depth-first must now hold the left value while it recurses into ${u}1`);
      const b = dfs(u + "1", others[1]);
      frame.phase = "combine";
      done[u] = combine(a, b);
      snap(u, `at ${name(u)}: both children known, combine with f<sub>${name(u)}</sub>`);
      stack.pop();
      return done[u];
    }
    dfs("", "Z");
    events.push({ cur: null, note: "done: the root's value is the output", done: { ...done }, stack: [] });
    return events;
  }

  function nextPrime(n) { for (let p = n + 1; ; p++) { let ok = p > 1; for (let d = 2; d * d <= p; d++) if (p % d === 0) { ok = false; break; } if (ok) return p; } }
  function bigScale(h, l) {
    const p = nextPrime(2 * l + 2), m = p - 1, lg = (x) => Math.ceil(Math.log2(x));
    return { plain: h * l, cm: 3 * l * lg(p) + h * lg(m), p };
  }

  const CSS = `
    .stackdemo .cols { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 12px; }
    .stackdemo .col { flex: 1 1 280px; min-width: 0; background: #fff; border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; }
    .stackdemo .col-h { font-family: var(--mono); font-size: 11.5px; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 8px; }
    .stackdemo .frame { display: flex; align-items: center; gap: 8px; font-family: var(--mono); font-size: 13px; padding: 5px 8px; border: 1px solid var(--line); border-radius: 6px; margin: 4px 0; background: var(--panel); }
    .stackdemo .frame.top { border-color: var(--accent); }
    .stackdemo .cells { display: inline-flex; gap: 2px; }
    .stackdemo .cell { width: 16px; height: 18px; border: 1px solid #cfd4dc; border-radius: 3px; font-size: 11.5px; display: inline-flex; align-items: center; justify-content: center; background: #fff; }
    .stackdemo .cell.full { background: #b00201; color: #fff; border-color: #b00201; }
    .stackdemo .cell.reg { background: #0f766e; color: #fff; border-color: #0f766e; }
    .stackdemo .small { background: #e6f4f1; color: var(--accent); border-radius: 4px; padding: 0 6px; }
    .stackdemo .meter { font-family: var(--mono); font-size: 12.5px; margin-top: 8px; color: var(--muted); }
    .stackdemo .meter b { color: var(--ink); }
    .stackdemo .empty { color: #c0c4cc; font-family: var(--mono); font-size: 12.5px; }`;

  function make(root) {
    if (!document.getElementById("stackdemo-css")) {
      const s = document.createElement("style"); s.id = "stackdemo-css"; s.textContent = CSS; document.head.appendChild(s);
    }
    root.classList.add("stackdemo");
    const events = trace();
    const big = bigScale(1024, 1024);
    root.innerHTML = `
      <div class="demo-title">What each level of recursion stores</div>
      <div class="row out" style="color:var(--muted)">h = ${H} · ℓ = ${ELL}</div>
      <div class="row">
        <button data-k="back">◀ step</button>
        <input data-k="slider" type="range" min="0" max="${events.length - 1}" value="0" style="flex:1;min-width:120px">
        <button data-k="fwd">step ▶</button>
        <button data-k="play" class="primary">play</button>
      </div>
      <div class="scroll-x" data-k="tree"></div>
      <div class="cols">
        <div class="col">
          <div class="col-h">Depth-first evaluation</div>
          <div data-k="plain"></div>
          <div class="meter" data-k="plainMeter"></div>
        </div>
        <div class="col">
          <div class="col-h">Cook–Mertz (first pass)</div>
          <div data-k="regs"></div>
          <div data-k="cm"></div>
          <div class="meter" data-k="cmMeter"></div>
        </div>
      </div>
      <div class="out" style="margin-top:10px;font-size:13px;color:var(--muted)">
        h = ℓ = 1024: depth-first <b style="color:var(--ink)">${big.plain.toLocaleString()}</b> bits · Cook–Mertz <b style="color:var(--ink)">${big.cm.toLocaleString()}</b> bits
      </div>`;

    const $ = (k) => root.querySelector(`[data-k="${k}"]`);
    let i = 0, timer = null;

    function drawTree(ev) {
      const W = 620, rowH = 58, padT = 22, nodes = [];
      for (let d = 0; d <= H; d++) {
        const count = 1 << d;
        for (let k = 0; k < count; k++) {
          const u = d === 0 ? "" : k.toString(2).padStart(d, "0");
          nodes.push({ u, d, x: ((k + 0.5) / count) * W, y: padT + d * rowH });
        }
      }
      const pos = Object.fromEntries(nodes.map((n) => [n.u, n]));
      const onPath = new Set(ev.stack.map((f) => f.u));
      let svg = `<svg width="${W}" height="${padT + H * rowH + 26}" viewBox="0 0 ${W} ${padT + H * rowH + 26}" font-family="IBM Plex Mono, monospace" font-size="11">`;
      for (const n of nodes) if (n.d > 0) {
        const par = pos[n.u.slice(0, -1)];
        const hot = onPath.has(n.u) && onPath.has(par.u);
        svg += `<line x1="${par.x}" y1="${par.y}" x2="${n.x}" y2="${n.y}" stroke="${hot ? "#0f766e" : "#d6d9de"}" stroke-width="${hot ? 2.5 : 1.2}"/>`;
      }
      for (const n of nodes) {
        const cur = ev.cur === n.u, on = onPath.has(n.u), isDone = n.u in ev.done;
        const fill = cur ? "#0f766e" : on ? "#e6f4f1" : isDone ? "#f2f2f2" : "#fff";
        svg += `<circle cx="${n.x}" cy="${n.y}" r="12" fill="${fill}" stroke="${on || cur ? "#0f766e" : "#b8bdc6"}" stroke-width="1.5"/>`;
        svg += `<text x="${n.x}" y="${n.y + 4}" text-anchor="middle" fill="${cur ? "#fff" : "#1a1d23"}">${n.u === "" ? "·" : n.u}</text>`;
        if (isDone) svg += `<text x="${n.x}" y="${n.y + 26}" text-anchor="middle" fill="#6b7280" font-size="10">${bits(ev.done[n.u])}</text>`;
      }
      return svg + "</svg>";
    }

    const cells = (v, cls) => `<span class="cells">${bits(v).split("").map((b) => `<span class="cell ${cls}">${b}</span>`).join("")}</span>`;
    const emptyCells = () => `<span class="cells">${"<span class=\"cell\"></span>".repeat(ELL)}</span>`;
    const stepOf = { enter: "—", left: "step (2)", right: "step (3)", combine: "step (4)", leaf: "add v<sub>u</sub>" };

    function render() {
      const ev = events[i];
      $("slider").value = i;
      $("tree").innerHTML = drawTree(ev);

      const top = ev.stack.length - 1;
      const plainFrames = ev.stack.map((f, k) =>
        `<div class="frame ${k === top ? "top" : ""}"><span style="min-width:3.2em">${name(f.u)}</span>` +
        (f.phase === "leaf" ? `<span class="empty">leaf</span>` : `left: ${f.left === null ? emptyCells() : cells(f.left, "full")}`) +
        `</div>`).join("");
      const held = ev.stack.filter((f) => f.left !== null).length;
      $("plain").innerHTML = plainFrames || `<div class="empty">stack empty</div>`;
      $("plainMeter").innerHTML = `stored: <b>${held * ELL}</b> bits`;

      const grp = (g) => `<span style="white-space:nowrap">${g} ${cells(0, "reg").replace(/>0</g, "><")}</span>`;
      $("regs").innerHTML = `<div class="frame" style="background:#fff;border-style:dashed;flex-wrap:wrap">shared: ${grp("X")} ${grp("Y")} ${grp("Z")}</div>`;
      const cmFrames = ev.stack.map((f, k) =>
        `<div class="frame ${k === top ? "top" : ""}"><span style="min-width:3.2em">${name(f.u)}</span>` +
        `<span>target ${f.target}</span>` +
        (f.phase === "leaf" ? `<span class="small">${stepOf.leaf}</span>` : `<span class="small">j = 1</span><span class="small">${stepOf[f.phase]}</span>`) +
        `</div>`).join("");
      $("cm").innerHTML = cmFrames || `<div class="empty">stack empty</div>`;
      $("cmMeter").innerHTML = "";
    }

    const stop = () => { clearInterval(timer); timer = null; $("play").textContent = "play"; };
    $("slider").oninput = (e) => { stop(); i = +e.target.value; render(); };
    $("back").onclick = () => { stop(); i = Math.max(0, i - 1); render(); };
    $("fwd").onclick = () => { stop(); i = Math.min(events.length - 1, i + 1); render(); };
    $("play").onclick = () => {
      if (timer) return stop();
      if (i === events.length - 1) i = 0;
      $("play").textContent = "pause";
      timer = setInterval(() => { if (i >= events.length - 1) return stop(); i++; render(); }, 900);
    };
    render();
  }

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
      document.querySelectorAll(".demo[data-demo=stack]").forEach(make);
    });
  }
})();
