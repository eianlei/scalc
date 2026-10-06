# SCALC: quick fixes before Vue conversion

This is a **vanilla JS / HTML / CSS** checklist. The **must-fix (M*) batch is complete** in the current static site. Remaining work is **nice-to-fix (N*)** or **leave until Vue (L*)**.

It is **not** an implementation. Do not start Vite from this file.

Primary source of issues: `PLANS/convert2vue.md` (architecture + §11), plus items that were checked in the repo. Vue conversion should **not** re-do M1–M10 as if they were still broken.

**jQuery:** gone in the **current vanilla code**. There is no CDN script to `code.jquery.com`, no vendored `jquery*.js`, and no `$` / `.val()` / `.on()` jQuery API usage in HTML/JS. MOD, Blender, and Planner use `document.getElementById`, `querySelectorAll`, and `addEventListener`. Do not vendor or re-add jQuery.

---

## 1. Purpose

Vue will replace the radio-tab + iframe shell with a SPA, then convert About → MOD → Blender → Planner.

The cheap vanilla hygiene that blocked a clean copy (invalid `index.html`, HTTP fonts, About sniff, implicit globals, unused `Diveplan` module, blender table/script order, `calcHeight`, fake `import` comments) is **done**. What is left:

- **N\*** — optional vanilla cleanups (try/catch, log flags, leftover markup typos)
- **L\*** — items that belong in Vue (router, canvas refs, `v-for` table, scoped CSS)

Fixing N\* still does **not** require Vite, Vue, or Tauri.

---

## 2. Non-goals

Do **not** do these as part of this checklist:

- Vue 3, Vite, vue-router, Pinia, Vitest scaffolding, `web/` tree, GitHub Pages `base: './'`
- Tauri / Electron / Cordova
- Rewrite Bühlmann, Van der Waals, or blender math
- “Fix all planner bugs” (convert2vue §1 / §11)
- Enable the disabled blender fill type `top`
- Unify blender vs planner gas lists (hypoxic TMX is blender-only on purpose)
- Re-introduce jQuery (CDN or vendor). It is already removed.
- Product redesign (favicon, new tools, mobile-first UX, shared tank library)
- Change `parseInt` on euro prices (`blender.js` `calculateCost`) — bug-compatible until a separate product change

---

## 3. Must-fix before Vue — **done** (M1–M10)

These were cheap in vanilla and painful to migrate as-is. **All ten are closed** in current vanilla code. Status style matches M3.

### M1. Repair `index.html` (invalid document + extra `</script>`) — **done**

**Status.** Closed.

`index.html` is a valid shell: `<!DOCTYPE html><html lang="en">`, `<title>` in `<head>`, no stray quotes on `.content` / `#content_ABOUT`, no extra `</script>`, no `calcHeight`. Four radio tabs and four iframes remain until Vue.

**Verify (already true).** One `<html>`; head contains title. Tabs still switch About / MOD / Blender / Planner.

---

### M2. Google Fonts over HTTP (`tabs.css`) — **done**

**Status.** Closed.

`source/tabs.css` uses `https://fonts.googleapis.com/css?family=Open+Sans:400,600,700`. Do **not** bundle fonts yet (that is Tauri/`tauri_desktop.md`). Do **not** move `h1 { padding: 100px }` into tool pages (see L3).

**Verify (already true).** Font CSS is `https://`. Tab labels still use Open Sans.

---

### M3. jQuery — **done** in current vanilla code

**Status.** Closed. Not an open P0.

The previous item was: vendor jQuery 3.6.0 locally and stop loading `https://code.jquery.com/jquery-3.6.0.min.js` from `mod.html`, `blender.html`, and `planner.html`, without rewriting `.val()` / `.change()`.

That is obsolete. The live tools no longer load jQuery at all. DOM glue is vanilla (`inputVal` / `setInputVal` / `setText` in `blender.js`; `getElementById` / `addEventListener` in `mod.html` and `planner.js`). There is no `source/vendor/jquery-*.js`.

**Do not** vendor jQuery. **Do not** add it back for Vue. Remaining work here is **none**.

**Verify (already true).** Grep `source/` and `index.html`: no `jquery`, no `code.jquery.com`, no `$("#…")`. Tools do not need the network for a JS library.

---

### M4. About “JavaScript version” sniff (extra `<script>` tags) — **done**

**Status.** Closed.

The ten `language="Javascript1.x"` tags and `#jsversion` sniff are gone. About copy includes a static line: “Calculations run in your browser.” Nested paragraph markup was flattened.

**Verify (already true).** About tab: no “javascript version 1.x” line. No extra version-sniff scripts.

---

### M5. Implicit globals that will throw under ES modules — **done** (with residual)

**Status.** Closed for the sites listed below.

| File | Leak | Now |
|------|------|-----|
| `source/model.js` | `pressure`, `depth` | `let` in `depth2pressure` / `pressure2depth` / `depth2absolutePressure` |
| `source/plan_txt.js` | `idx` | `for (let idx = 0; …)` |
| `source/calculate_plan.js` | `wp_txt` | `let wp_txt` in `calculatePlan` |
| `source/blender.js` | `result_txt`, `dropval` | `let` |
| `source/planner.js` | `txt` | `let txt` after `plan_txt(...)` |
| `source/mod.html` inline | `o2_pct`, `ppo2` | `let` in `calculateMOD()` |

**Residual (not in the original table).** `planner.js` `getPointText` still has `for (idx = 0; idx < prof.length; idx++)` without `let`/`var`. That can still throw under ES modules + `"use strict"`. Treat as leftover N-item / Vue modularize work, not a reopened M5.

**Verify (already true for listed leaks).** Do not “clean up” `Object.create` in the same pass (see L1).

---

### M6. Unused `diveplan.js` vs canonical `runPlan()` object — **done**

**Status.** Closed. Option A.

`source/diveplan.js` is a **classic** (non-module) `function createDiveplan()` returning the same keys `runPlan()` uses (`desc_steps`, `wayPoints`, `tankBottom`, GF 30/80, depth 50, `currentTank: null`, …). `planner.html` loads it before `planner.js`. `runPlan()` calls `const myDP = createDiveplan()` then fills tanks/inputs. No `import`/`export`.

**Verify (already true).** Planner still classic scripts. Default plan object shape includes `desc_steps`, `wayPoints`, `tankBottom`.

---

### M7. Dead `planner_table.html` + sidenav new-tab — **done**

**Status.** Closed.

`source/planner_table.html` is **gone**. Sidenav “Table” calls `openTable()` (in-page `#table_panel` + CSV). `#mySidenav` / `openNav`/`closeNav` still exist unused (`width: 0`; panels button commented) — that leftover is **N6**, not a reopened M7.

**Verify (already true).** Planner **table** button still shows the in-page table and CSV. No new tab to an empty stub.

---

### M8. Blender: unclosed table + script order — **done**

**Status.** Closed.

Compressor `<table class="t1">` is closed before `#blender_sources` `</div>`. Script order: `tmxcalc.js` → `vanderwaals.js` → `vdw_temp.js` → `blender.js`. Initial `calculateBlend()` is on `DOMContentLoaded`. Extra `"` on `#ddl_ft` and `#ddl_algorithm` is fixed.

**Residual (N4, not M8).** Other blender/MOD/planner dropdowns still have `onmousedown="this.value='';""`.

**Verify (already true).** Default PP + IDG still prints. VdW files load before `blender.js`.

---

### M9. Iframe `calcHeight()` hack — **done**

**Status.** Closed.

No `onload="calcHeight();"` and no `calcHeight` script. Iframes keep explicit `height: 1000px`.

**Verify (already true).** About tab: no `## calcHeight` console log.

---

### M10. Commented-out `import` lines that do not match the code — **done**

**Status.** Closed.

Commented `import` blocks are gone from `calculate_plan.js`, `tanks.js`, `model.js`. `tanks.js` ends `tankUpdate` with `} // tankUpdate`. When Vue modularizes, add **real** exports that match actual function names (`calculatePlan`, `tankUpdate`, `ZHL16c`, `ModelPoint`, …).

**Verify (already true).** `planner.html` script list is classic; grep: no `tanksCheck` except history in this plan / convert2vue notes.

---

## 4. Nice-to-fix (vanilla, not blockers) — **still open**

### N1. Uncomment `try/catch` around `calculatePlan`

`planner.js`: live code still has a path that can throw after `MAX_index = 500` (`convert2vue` §11). Vue is told to `try/catch` like the commented block around `calculatePlan(myDP)`. There is still a **bare** `calculatePlan(myDP)` above the commented try/catch.

**Fix now:** uncomment the try/catch and **remove** any duplicate bare `calculatePlan(myDP)` above it. Keep the alert + reset to 30 m / 20 min.

**Verify.** Normal default plan still works. (Hard to hit 500 iterations without a known bad input; at least confirm catch syntax and that happy path is unchanged.)

### N2. Gate planner `LOG_*` flags

`calculate_plan.js` lines 16–20: `LOG_LOOP`, `LOG_ASC`, `LOG_catd`, `LOG_MODOUT`, `LOG_states` are all `true`. Default 50 m / 30 min floods the console (`convert2vue` §2.4, §10.1). Vue would use `import.meta.env.DEV`; for vanilla, set them to `false` (or one master `const DEBUG = false`).

**Verify.** Default plan: console quiet. Flip DEBUG and see logs again.

### N3. Planner stray `<td>` buttons; empty `#profile`

`planner.html`: Calculate / table buttons are `<td>` **outside** any `<table>`. `#profile` / `#profile_big` is an empty stub (`convert2vue` §2.3).

**Fix:** wrap buttons in a `div`. Leave or delete `#profile` (Vue: drop it). Do not invent a big profile view.

### N4. Extra `"` on `onmousedown` dropdowns

`#ddl_ft` and `#ddl_algorithm` were fixed with M8. Remaining: `mod.html` (`#ddl`, `#ddl_pp`), other blender gas/bar selects, and `planner.html` (`#dd_gf`, `#dd_bGas`). Harmless in many parsers; still invalid.

**Fix:** one closing quote. **Verify:** dropdowns still clear-on-mousedown and fill O2/He or GF.

### N5. MOD extra `<tr>` and commented dropdown

`mod.html`: empty extra `<tr>` and/or commented custom dropdown. Delete the empty row and the dead comment block so Vue does not port them.

### N6. Dead sidenav chrome

M7 unlinked Table from the stub page; the sidenav is still unused (`width: 0`, Controls/Profile/Debug are `#`). Removing `#mySidenav` + CSS + `openNav`/`closeNav` reduces what Vue might copy. Optional.

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
| **L7. jQuery** | **Done in vanilla.** Vue should keep native/`v-model` bindings. Never add jQuery to Vite. |
| **L8. Radio tabs → router** | Vue Router. Do not invent hash URLs in vanilla. |
| **L9. Shared `gases.js`** | Preserve **per-screen** lists (planner comments out hypoxic; blender allows 10/70). |
| **L10. Disabled fill `top`** | Keep `disabled` until a product decision. |
| **L11. Planner algorithm / `MAX_index`** | Same engine. UI catch is N1; do not raise the cap or rewrite stops. |
| **L12. Duplicate inline CSS** (`blender.html` / `planner.html` `<style>`) | Move when extracting Vue components. Canvas stacking rules must survive. |
| **L13. Golden Vitest fixtures** | `convert2vue` phase 0 — record **after** P0 HTML/JS hygiene if outputs might change; store under the future `web/` tree, not this checklist’s implementation. Vanilla P0 hygiene is done; fixtures can be recorded now. |

---

## 6. Suggested order of work

Must-fix **M1–M10 are done**. Skip them. Remaining vanilla (optional):

Keep a local `python3 -m http.server` from repo root and default MOD / Blender / Planner outputs in a text file **before** N1 (so you can diff).

1. **N1 + N2** — try/catch + quiet logs.
2. **N4** — remaining dropdown quotes (MOD / blender gas-bar / planner).
3. **N3 + N6** — stray `<td>` / empty `#profile` / unused sidenav.
4. **N5** — MOD leftover markup.

Stop. Do not start Vite from this checklist (`convert2vue.md` phases start after that).

---

## 7. How to verify (whole pass)

Manual, no test runner today (`convert2vue` §10).

| After | Check |
|-------|--------|
| M1–M10 | **Done.** Valid `index.html`; HTTPS font; no jQuery; no About sniff; listed globals use `let`; `createDiveplan()`; no `planner_table.html`; blender table closed + VdW before `blender.js`; no `calcHeight`; no fake `import` / `tanksCheck` |
| N1 | Happy-path plan unchanged; catch present; no duplicate bare `calculatePlan` |
| N2 | Console not flooded on planner load |
| N3, N6 | Buttons valid markup; table + CSV still work; no dead sidenav if removed |
| N4 | Dropdowns still clear-on-mousedown |
| N5 | MOD 21% / 1.4 → **56.7**; slider + both dropdowns |
| Regression | EMPTY blender; Cost/Sources back; planner deco checkboxes; default blender PP+IDG; planner default 50 m / 30 min, GF 30/80 |

If any default numeric/text output changes, **stop** and revert the last item (likely N1). Algorithm drift is out of scope.

---

## 8. Count

**Must-fix items still open: 0** (M1–M10 **done**).

**Nice-to-fix still open: 6** (N1–N6). **Leave-until-Vue: L1–L13** (L7 jQuery already done in vanilla).

**Residual vs M5 list:** `planner.js` `getPointText` `for (idx = 0; …)` still undeclared.

File written: `PLANS/quick_fixes.md`.
