// Turns <div class="theorem" data-title="..."> etc. into styled, numbered blocks
// (mirroring panda_notes_style.sty), makes proofs/solutions collapsible, fills
// cross-references, then renders math with KaTeX.

(function () {
  // Environments sharing one counter (sibling=theorem in the .sty).
  const NUMBERED = {
    definition: "Definition", notation: "Notation", algorithm: "Algorithm",
    theorem: "Theorem", lemma: "Lemma", corollary: "Corollary", proposition: "Proposition",
    fact: "Fact", claim: "Claim", exercise: "Exercise", example: "Example",
    remark: "Remark", note: "Note", important: "Important", goal: "Goal",
    psp: "Problem-Solving Principle", observation: "Observation",
  };
  const UNNUMBERED = { guidingquestion: "Guiding Question", idea: "Idea", greatidea: "Great Idea" };
  const COLLAPSIBLE = { proof: "Proof", solution: "Solution", hint: "Hint" };

  const MACROS = {
    "\\AC": "\\mathsf{AC}", "\\ACC": "\\mathsf{ACC}", "\\TC": "\\mathsf{TC}", "\\NC": "\\mathsf{NC}",
    "\\P": "\\mathsf{P}", "\\NP": "\\mathsf{NP}", "\\L": "\\mathsf{L}", "\\NL": "\\mathsf{NL}", "\\NEXP": "\\mathsf{NEXP}",
    "\\CL": "\\mathsf{CL}", "\\TIME": "\\mathsf{TIME}", "\\SPACE": "\\mathsf{SPACE}", "\\TreeEval": "\\mathrm{TreeEval}",
    "\\N": "\\mathbb{N}", "\\Z": "\\mathbb{Z}", "\\R": "\\mathbb{R}",
    "\\st": "\\mid", "\\enc": "\\langle #1 \\rangle", "\\poly": "\\mathrm{poly}",
    "\\MAJ": "\\mathrm{MAJ}", "\\MOD": "\\mathrm{MOD}", "\\PARITY": "\\mathrm{PARITY}",
    "\\AND": "\\mathrm{AND}", "\\OR": "\\mathrm{OR}", "\\NOT": "\\mathrm{NOT}",
    "\\id": "e", "\\Sym": "S",
  };

  function headHTML(label, el) {
    const title = el.getAttribute("data-title");
    return `<span class="env-head">${label}${title ? ` <span class="env-note">(${title})</span>` : ""}.</span>`;
  }

  function wrapBody(el) {
    const body = document.createElement("div");
    body.className = "env-body";
    while (el.firstChild) body.appendChild(el.firstChild);
    return body;
  }

  function build() {
    let counter = 0;
    const all = Object.keys(NUMBERED).concat(Object.keys(UNNUMBERED));
    document.querySelectorAll(all.map((c) => ".notes div." + c).join(",")).forEach((el) => {
      const kind = all.find((c) => el.classList.contains(c));
      let label = NUMBERED[kind] || UNNUMBERED[kind];
      if (NUMBERED[kind]) {
        counter += 1;
        label += " " + counter;
        el.dataset.number = counter;
        el.dataset.label = NUMBERED[kind];
      }
      const body = wrapBody(el);
      el.classList.add("env");
      el.innerHTML = headHTML(label, el);
      el.appendChild(body);
    });

    // Proofs / solutions become <details>, collapsed by default.
    document.querySelectorAll(Object.keys(COLLAPSIBLE).map((c) => ".notes div." + c).join(",")).forEach((el) => {
      const kind = Object.keys(COLLAPSIBLE).find((c) => el.classList.contains(c));
      const det = document.createElement("details");
      det.className = "env " + el.className;
      if (el.id) det.id = el.id;
      for (const a of el.attributes) if (a.name.startsWith("data-")) det.setAttribute(a.name, a.value);
      if (el.hasAttribute("data-open")) det.open = true;
      const title = el.getAttribute("data-title");
      det.innerHTML = `<summary><span>${COLLAPSIBLE[kind]}${title ? ` <span class="env-note">(${title})</span>` : ""}.</span> <span class="hint">click to expand</span></summary>`;
      det.appendChild(wrapBody(el));
      el.replaceWith(det);
    });

    // Cross-references: <a class="ref" href="#id"></a> -> "Theorem 7 (Title)" like \fullref.
    document.querySelectorAll(".notes a.ref").forEach((a) => {
      if (a.textContent.trim()) return;
      const target = document.querySelector(a.getAttribute("href"));
      if (!target || !target.dataset.label) return;
      const t = target.getAttribute("data-title");
      a.innerHTML = `${target.dataset.label} ${target.dataset.number}${t ? ` (${t})` : ""}`;
    });
  }

  function renderMath() {
    if (!window.renderMathInElement) return;
    window.renderMathInElement(document.body, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "\\[", right: "\\]", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\(", right: "\\)", display: false },
      ],
      macros: MACROS,
      throwOnError: false,
      ignoredClasses: ["demo"],
    });
  }

  window.NotesMacros = MACROS;
  document.addEventListener("DOMContentLoaded", () => { build(); renderMath(); });
})();
