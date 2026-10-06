# SCALC: quick fixes before Vue conversion

This is a **vanilla JS / HTML / CSS** checklist. Do this work in the **current** static site so the Vue migration does not copy broken markup, CDN dependencies, unused ES-module leftovers, or iframe hacks.

It is **not** an implementation. Application code stays as-is until someone executes these items.

Primary source of issues: `PLANS/convert2vue.md` §11 (Risks and mitigations), plus architecture/screens/engines notes in §§2, 9, 13–14. Every item below was **checked in the repo**, not only in that plan.

---

## 1. Purpose

Vue will replace the radio-tab + iframe shell with a SPA, then convert About → MOD → Blender → Planner. During that work it is easy to:

- paste `index.html` / `about.html` “as the content”
- copy `tabs.css` including the HTTP font URL
- `import { Diveplan }` from a file that does **not** match `runPlan()`
- uncomment fake `import` lines that name APIs that do not exist
- wrap leftover iframes in Vue (strangler) and keep jQuery CDN + `calcHeight()`

Those mistakes are cheaper to prevent **now**, while the app is still four HTML files and classic `<script src>` tags.

Fixing this set does **not** require Vite, Vue, or Tauri.

---

## 2. Non-goals

Do **not** do these as part of this checklist:

- Vue 3, Vite, vue-router, Pinia, Vitest scaffolding, `web/` tree, GitHub Pages `base: './'`
- Tauri / Electron / Cordova
- Rewrite Bühlmann, Van der Waals, or blender math
- “Fix all planner bugs” (convert2vue §1 / §11)
- Enable the disabled blender fill type `top`
- Unify blender vs planner gas lists (hypoxic TMX is blender-only on purpose)
- Replace jQuery with Vue `v-model` (that is the conversion). **Vendoring** jQuery locally is in scope; **removing** jQuery is not
- Product redesign (favicon, new tools, mobile-first UX, shared tank library)
- Change `parseInt` on euro prices (`blender.js` `calculateCost`) — bug-compatible until a separate product change

---

## 3. Must-fix before Vue

These are cheap in vanilla, and painful or pointless to migrate as-is.

### M1. Repair `index.html` (invalid document + extra `</script>`)

**Problem.** `index.html` is not a valid HTML document:

- `<html>` is **inside** `<body>` (line 8); `</html>` is **before** `</body>` (lines 67–68)
- `<title>` sits in the body, not in `<head>`
- `<div class="content" ">` and `<div id="content_ABOUT" " >` have stray quotes (lines 25–26)
- Real script for `calcHeight()` ends at line 63, then a **second** `</script>` at line 67 with no opening tag

Vue/Vite will replace this file as the SPA host (`convert2vue` §2.1). If the strangler phase still serves this shell, broken markup and a stray closer stay in production. Do not treat this file as a template for `App.vue`.

**Vanilla fix.** Rebuild a minimal valid shell: `<!DOCTYPE html><html lang="en"><head>…title, viewport, CSS…</head><body>…tabs…</body></html>`. Delete the extra `</script>`. Fix the two attribute typos. Keep the four radio tabs and four iframes until Vue exists.

**Effort / priority.** Small / **P0**.

**Verify.** Open `index.html` in DevTools → Elements: one `<html>`, head contains title, no console parse errors. Tabs still switch About / MOD / Blender / Planner.

---

### M2. Google Fonts over HTTP (`tabs.css`)

**Problem.** `source/tabs.css` line 1:

```css
@import url('http://fonts.googleapis.com/css?family=Open+Sans:400,600,700');
```

GitHub Pages is HTTPS (`convert2vue` §2, §9). Browsers block this as **mixed content**; Open Sans never loads. Vue will copy this file into app chrome unless the URL is fixed first (`convert2vue` §9, §13 phase 7).

**Vanilla fix.** Change to `https://fonts.googleapis.com/css?family=Open+Sans:400,600,700`. Do **not** bundle fonts yet (that is Tauri/`tauri_desktop.md`). Do **not** move `h1 { padding: 100px }` into tool pages (see L3).

**Effort / priority.** Tiny / **P0**.

**Verify.** Serve over HTTPS (or GitHub Pages). Network tab: font CSS is `https://`, no mixed-content warning. Tab labels still use Open Sans.

---

### M3. jQuery from CDN (MOD, Blender, Planner)

**Problem.** Classic scripts, not modules:

| File | Line |
|------|------|
| `source/mod.html` | 67 `https://code.jquery.com/jquery-3.6.0.min.js` |
| `source/blender.html` | 292 same |
| `source/planner.html` | 281 same |

About does not use jQuery. Offline-after-first-load (`convert2vue` §2) is already false for three tools. Hybrid Vue + iframe (`convert2vue` phase 3) would keep this CDN.

**Vanilla fix.** Save jQuery 3.6.0 into something like `source/vendor/jquery-3.6.0.min.js` (same min file you already load). Point all three `<script src>` at that **relative** path. Do **not** rewrite `.val()` / `.change()` yet.

**Effort / priority.** Small / **P0**.

**Verify.** Disconnect network after load (or block `code.jquery.com`). MOD slider, Blender fill, Planner `runPlan` still work. No 404 on the local jquery file.

---

### M4. About “JavaScript version” sniff (extra `<script>` tags)

**Problem.** `source/about.html` lines 49–65: `version = 1.0` then nine `language="Javascript1.x"` tags that mutate a global, then `#jsversion` innerHTML. This is 1990s UA sniffing. `convert2vue` §2.3 / §7: drop in Vue; do not port.

Also malformed nested `<p>` / `<P>` (lines 5–16). Cheap to tidy while editing this file.

**Vanilla fix.** Delete the ten version `<script>` tags. Replace `#jsversion` with a static sentence (“Calculations run in your browser”) or omit it. Optionally flatten the nested paragraphs. Do not add `navigator.userAgent` unless you want it for debugging.

**Effort / priority.** Tiny / **P0**.

**Verify.** About tab: no “javascript version 1.x” line. No extra script tags in the iframe document. Copy still readable.

---

### M5. Implicit globals that will throw under ES modules

**Problem.** Classic scripts leak assignments. `convert2vue` §11: ES modules + `"use strict"` **will throw**. Confirmed sites:

| File | Leak | Notes |
|------|------|--------|
| `source/model.js` | `pressure`, `depth` | `depth2pressure`, `pressure2depth`, `depth2absolutePressure` assign without `var`/`let` (lines 31, 41, 51) |
| `source/plan_txt.js` | `idx` | `for(idx=0; …)` three loops (lines 18, 24, 38) |
| `source/calculate_plan.js` | `wp_txt` | assigned in several phases (e.g. lines 151, 258, 281, 331, 354, 379, 388) |
| `source/blender.js` | `result_txt`, `dropval` | lines 98, 246 |
| `source/planner.js` | `txt` | `txt = plan_txt(...)` line 371 |
| `source/mod.html` inline | `o2_pct`, `ppo2` | `calculateMOD()` lines 92–93 |

**Vanilla fix.** Add `let`/`var` at each assignment (or `for (let idx = 0; …)`). **Do not** refactor the algorithms. Do not “clean up” `Object.create` in the same pass (see L1).

**Effort / priority.** Small / **P0** (blocker for `convert2vue` phase 2 modularize).

**Verify.** After the change, default MOD `56.7`, default blender PP/IDG text, default planner 50 m / 30 min text + canvas still match previous behavior. DevTools: those names are not new `window.*` properties after a run.

---

### M6. Unused `diveplan.js` vs canonical `runPlan()` object

**Problem.** `source/diveplan.js` is an **ES module** (`import { tankList } from "./tanks.js"` + `export const Diveplan`). `planner.html` does **not** load it. `planner.js` even comments `//let myDP = new Diveplan();` and builds `const myDP = new Object()` with extra fields (`convert2vue` §2.2, §11, §14.1).

`Diveplan` is missing fields the engine actually uses: `desc_rate`, `desc_steps`, `bottom_steps`, `wayPoints`, `tankBottom`, `tankDeco1`, `tankDeco2`, `tableIsGenerated`, `atBottom`, … Defaults also disagree (GF 30/85 vs UI 30/80; depth 30 vs 50). `currentTank : "BOTTOM"` is a string; runtime uses tank objects.

`tanks.js` does **not** export `tankList` (only a property on the diveplan object). If someone later `import { Diveplan } from "./diveplan.js"` in Vue, the shape and the tanks import are both wrong.

**Vanilla fix.** Treat `planner.js` `runPlan()` `myDP` as the **canonical** shape. Either:

- **A (preferred):** rewrite `diveplan.js` as a **classic** (non-module) `function createDiveplan() { return { …same keys as runPlan… }; }` with no `import`/`export`, then call it from `runPlan()`; or
- **B:** delete `diveplan.js` and add a short comment on `runPlan()` that Vue should copy that object, not a separate type file.

Do not leave a live `export const Diveplan` that does not match the engine.

**Effort / priority.** Small / **P0**.

**Verify.** Planner still not loading a module (no CORS/`type=module` errors). Default plan text unchanged. If using option A, `createDiveplan()` fields include `desc_steps`, `wayPoints`, `tankBottom`.

---

### M7. Dead `planner_table.html` + sidenav new-tab

**Problem.** `source/planner_table.html` is an incomplete stub: empty `#planner_table`, commented demo script, **wrong stylesheet** `href="index.css"` (file is under `source/`; live pages use `../index.css`). Live table is `#table_panel` **inside** `planner.html` (`convert2vue` §2.1).

`planner.html` sidenav still has `<a href="planner_table.html" target="_blank">Table</a>` (line 134). Opening it is a blank page. `openNav()` exists in `planner.js` but the “panels” button is commented out (line 246); sidenav stays `width: 0`.

Vue phase 6: “Do not port dead sidenav / `planner_table.html` stub.”

**Vanilla fix.** Point sidenav “Table” at `openTable()` (or remove the link). Delete `planner_table.html` **or** leave a one-line comment in `PLANS` that it is unused — do not copy it into Vue. Optional: remove the whole sidenav markup if nothing opens it (then also drop `openNav`/`closeNav`). Keep in-page table + CSV.

**Effort / priority.** Tiny / **P0**.

**Verify.** Planner **table** button still shows the in-page table and CSV. No new tab to an empty stub. `source/planner_table.html` gone or not linked.

---

### M8. Blender: unclosed table + script order

**Problem.**

1. `source/blender.html` compressor `<table class="t1">` (line 272) is **never closed**. The sources panel `</div>` at line 290 closes over an open table. Invalid HTML; Vue ports of this markup will inherit it.
2. Script order (lines 292–296): jQuery → `tmxcalc.js` → **`blender.js`** → `vanderwaals.js` → `vdw_temp.js`. `blender.js` **calls `calculateBlend()` at top level** (line 9) before VdW files exist. Default `algorithm = "IDG"` hides this; switching default to VdW1/VdW2 or a slow parse would throw `vdw_calc is not defined`.
3. Extra malformation: `onmousedown="this.value='';""` on `#ddl_ft` and `#ddl_algorithm` (extra `"`). Same pattern on MOD/planner dropdowns (see N4).

**Vanilla fix.** Close `</table>` before `</div>` of `#blender_sources`. Load order: jQuery → `tmxcalc.js` → `vanderwaals.js` → `vdw_temp.js` → `blender.js`. Move the initial `calculateBlend()` to `$(function(){ calculateBlend(); })` (or after DOM ready) so canvases/inputs exist. Fix the extra quote on those two selects.

**Effort / priority.** Small / **P0**.

**Verify.** Default PP + ideal gas still prints. Switch to VdW1 and VdW2 with defaults: no `ReferenceError`. Cost and Sources panels still open/back. View source / validator: compressor table closed.

---

### M9. Iframe `calcHeight()` hack

**Problem.** Only the About iframe has `onload="calcHeight();"` (`index.html` line 27). `calcHeight()` reads `about` iframe `scrollHeight` and sets `e.height`. All four iframes also have **inline `height: 1000px`**. Extra `</script>` sits after this function (M1). Vue layouts do not need this (`convert2vue` §14.6). Copying it into a strangler `App.vue` iframe is pointless.

**Vanilla fix.** Remove `onload` and the `calcHeight` script entirely. Keep a single explicit iframe height (1000px is fine until Vue). About page is short; a fixed height already matches MOD/Blender/Planner.

**Effort / priority.** Tiny / **P0**.

**Verify.** About tab: no `## calcHeight` console log. No iframe-to-parent `contentWindow` access errors. Tabs still show full tool UI without clipping the blender/planner canvases (those iframes already use 1000px).

---

### M10. Commented-out `import` lines that do not match the code

**Problem.** Classic scripts cannot use `import`. Leftover comments look like a TODO for Vue:

| File | What’s wrong |
|------|----------------|
| `source/calculate_plan.js` 6–13 | Block comments `import { Diveplan }`, `gradientFactor`, `tanksCheck, tankList`, etc. **`tanksCheck` does not exist.** `tanks.js` ends `tankUpdate` with `} // tanksCheck` (line 31) — leftover name. |
| `source/tanks.js` 1–2 | `// import { DivePhase }`, `// import { Diveplan }` |
| `source/model.js` 8–9 | `// import { ZHL16c } from "./ZHL16c.js"` — ZHL16c is already a global from a prior `<script>` |

Uncommenting these in a module pass will fail (missing exports, circular `Diveplan` / `tanks.js`).

**Vanilla fix.** Delete the commented `import` blocks. Rename the `} // tanksCheck` comment to `} // tankUpdate`. When Vue modularizes, add **real** exports that match actual function names (`calculatePlan`, `tankUpdate`, `ZHL16c`, `ModelPoint`, …).

**Effort / priority.** Tiny / **P0**.

**Verify.** `planner.html` script list unchanged; planner still runs. Grep: no `tanksCheck` except history in this plan.

---

## 4. Nice-to-fix (vanilla, not blockers)

### N1. Uncomment `try/catch` around `calculatePlan`

`planner.js` 356–369: live code calls `calculatePlan(myDP)` with the `try/catch` **commented out**. `calculate_plan.js` throws after `MAX_index = 500` (`convert2vue` §11). Vue is told to `try/catch` like that block.

**Fix now:** uncomment the try/catch and **remove** the duplicate bare `calculatePlan(myDP)` above it. Keep the alert + reset to 30 m / 20 min.

**Verify.** Normal default plan still works. (Hard to hit 500 iterations without a known bad input; at least confirm catch syntax and that happy path is unchanged.)

### N2. Gate planner `LOG_*` flags

`calculate_plan.js` lines 16–20: `LOG_LOOP`, `LOG_ASC`, `LOG_catd`, `LOG_MODOUT`, `LOG_states` are all `true`. Default 50 m / 30 min floods the console (`convert2vue` §2.4, §10.1). Vue would use `import.meta.env.DEV`; for vanilla, set them to `false` (or one master `const DEBUG = false`).

**Verify.** Default plan: console quiet. Flip DEBUG and see logs again.

### N3. Planner stray `<td>` buttons; empty `#profile`

`planner.html` 247–248: Calculate / table buttons are `<td>` **outside** any `<table>`. `#profile` / `#profile_big` is an empty stub (`convert2vue` §2.3).

**Fix:** wrap buttons in a `div`. Leave or delete `#profile` (Vue: drop it). Do not invent a big profile view.

### N4. Extra `"` on `onmousedown` dropdowns

Same typo as blender: `onmousedown="this.value='';""` in `mod.html` (lines 16, 46) and `planner.html` (`#dd_gf`, `#dd_bGas`). Harmless in many parsers; still invalid.

**Fix:** one closing quote. **Verify:** dropdowns still clear-on-mousedown and fill O2/He or GF.

### N5. MOD extra `<tr>` and commented dropdown

`mod.html` 58–60: empty `<tr>` then another `<tr>`. Lines 36–45: commented custom dropdown. Delete the empty row and the dead comment block so Vue does not port them.

### N6. Dead sidenav chrome

If M7 unlinks Table, the sidenav is unused (`width: 0`, Controls/Profile/Debug are `#`). Removing `#mySidenav` + CSS + `openNav`/`closeNav` reduces what Vue might copy. Optional.

---

## 5. Leave until Vue (or later product work)

From `convert2vue` §11 unless noted. **Do not** “fix” these in vanilla beyond the items above.

| Topic | Why wait |
|-------|----------|
| **L1. `Object.create(BlenderState)` / `DiveProfilePoint` / `DecoStop`** | Shared prototype mutations. Keep until engine tests exist; then clone if tests show pollution. |
| **L2. Planner table `innerHTML`** | XSS risk is low (numeric). Vue should `v-for`, not string HTML. Vanilla rewrite is wasted. |
| **L3. `tabs.css` `h1 { padding: 100px }` / iframe CSS isolation** | Highest CSS risk for the SPA. Iframes currently isolate `tabs.css` from tools. Do **not** import full `tabs.css` globally in Vue. No vanilla change required except not copying `h1`/`p`/`body` into tool CSS. |
| **L4. Canvas `getElementById` lifecycle** | Vue `ref` + `nextTick`. Keep 600×310 blender and 600×200 planner sizes. |
| **L5. `v-model.number` vs `parseInt`** | Keep `parseInt` at the lib boundary. Includes blender euro `parseInt` (`convert2vue` §14.4). |
| **L6. GitHub Pages Vite `base`** | Vite config, not vanilla. |
| **L7. Drop jQuery entirely** | Per converted screen in Vue. After M3, CDN is gone; `$` stays until each tool is converted. |
| **L8. Radio tabs → router** | Vue Router. Do not invent hash URLs in vanilla. |
| **L9. Shared `gases.js`** | Preserve **per-screen** lists (planner comments out hypoxic; blender allows 10/70). |
| **L10. Disabled fill `top`** | Keep `disabled` until a product decision. |
| **L11. Planner algorithm / `MAX_index`** | Same engine. UI catch is N1; do not raise the cap or rewrite stops. |
| **L12. Duplicate inline CSS** (`blender.html` / `planner.html` `<style>`) | Move when extracting Vue components. Canvas stacking rules must survive. |
| **L13. Golden Vitest fixtures** | `convert2vue` phase 0 — record **after** P0 HTML/JS hygiene if outputs might change; store under the future `web/` tree, not this checklist’s implementation. |

---

## 6. Suggested order of work

Do **one** local `python3 -m http.server` from repo root and keep the default MOD / Blender / Planner outputs in a text file **before** M5/M6/N1 (so you can diff).

1. **M1 + M9** — valid `index.html`, no `calcHeight` (same file).
2. **M2** — HTTPS font (one line).
3. **M3** — vendor jQuery, retarget three HTML files.
4. **M4** — About scripts.
5. **M8 + N4** — blender markup/script order; dropdown quotes (include MOD/planner if touching those files).
6. **M7 + N3 + N6** — planner dead pages / stray `<td>` / sidenav.
7. **M5** — `let` on globals (behavior-sensitive; diff text outputs).
8. **M6** — `createDiveplan()` or delete unused module.
9. **M10** — delete misleading `import` comments.
10. **N1 + N2** — try/catch + quiet logs.
11. **N5** — MOD leftover markup.

Stop. Do not start Vite.

---

## 7. How to verify (whole pass)

Manual, no test runner today (`convert2vue` §10).

| After | Check |
|-------|--------|
| M1, M9 | Valid document; four tabs; no extra `</script>`; About has no `calcHeight` log |
| M2 | HTTPS: no mixed-content font error |
| M3 | Tools work with `code.jquery.com` blocked |
| M4 | About has no version sniff |
| M8 | VdW1/VdW2 run; sources table not “eaten” by unclosed markup |
| M7 | In-page planner table + CSV; no stub tab |
| M5, M6, N1 | **Same numbers as pre-change notes:** MOD 21% / 1.4 → **56.7**; blender default PP+IDG text; planner default 50 m / 30 min, GF 30/80, tanks 21/35 + 50% @ 21 m + 100% @ 6 m — text + canvas + table row count |
| M10 | Planner script tags still classic; no module errors |
| N2 | Console not flooded on planner load |
| Regression | EMPTY blender; Cost/Sources back; MOD slider + both dropdowns; planner deco checkboxes |

If any default numeric/text output changes, **stop** and revert the last item (likely M5/M6). Algorithm drift is out of scope.

---

## 8. Count

**Must-fix items: 10** (M1–M10).

File written: `PLANS/quick_fixes.md`.
