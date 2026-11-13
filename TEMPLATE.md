# Writing blocks on the site

Every block is a `<div>` with a class. Numbering, labels, collapsing and math rendering happen automatically (`assets/notes.js`). Math: `$...$` inline, `$$...$$` display. Macros: `\AC \ACC \TC \NC \P \NP \L \NL \CL \TIME \SPACE \TreeEval \N \st \enc{} \MAJ \MOD \PARITY \AND \OR \NOT \poly`.

| LaTeX (`panda_notes_style.sty`) | HTML |
|---|---|
| `\begin{gram}` | `<div class="gram"><p>…</p></div>` |
| `\begin{definition}[Title]` | `<div class="definition" data-title="Title" id="def-x">…</div>` |
| `theorem`, `lemma`, `corollary`, `proposition`, `claim`, `fact` | same pattern, shaded box |
| `notation`, `algorithm` | same pattern, white box |
| `remark`, `note`, `important`, `example`, `goal` | same pattern, no box, grey ■ |
| `guidingquestion`, `idea`, `greatidea` | same pattern, unnumbered |
| `\begin{proof} \COLLAPSED` | `<div class="proof">…</div>` (put right after the theorem) |
| `\begin{exercise}` + `\begin{solution}` | `<div class="exercise">…</div>` then `<div class="solution">…</div>` |
| `\fullref{thm:x}` | `<a class="ref" href="#thm-x"></a>` → "Theorem 7 (Title)" |
| `\img{file}{1}` | `<figure><img src="assets/file.png" style="width:100%"><figcaption>…</figcaption></figure>` |

Placeholders carry `data-draft` (dashed orange outline). Delete the attribute once the block is written.
Add `data-open` to a proof to show it expanded by default.

Demos: `<div class="demo" data-demo="stepper|commutator|builder"></div>`.
