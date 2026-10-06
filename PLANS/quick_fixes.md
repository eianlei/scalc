# SCALC: quick fixes before Vue conversion

This is a **vanilla JS / HTML / CSS** checklist. The **must-fix (M*)** and **nice-to-fix (N*)** batches are **complete** in the current static site. Remaining work is **leave until Vue (L*)**.

It is **not** an implementation. Do not start Vite from this file.

Primary source of issues: `PLANS/convert2vue.md` (architecture + §11), plus items that were checked in the repo. Vue conversion should **not** re-do M1–M10 or N1–N6 as if they were still broken.

**jQuery:** gone in the **current vanilla code**. There is no CDN script to `code.jquery.com`, no vendored `jquery*.js`, and no `$` / `.val()` / `.on()` jQuery API usage in HTML/JS. MOD, Blender, and Planner use `document.getElementById`, `querySelectorAll`, and `addEventListener`. Do not vendor or re-add jQuery.

---

## 1. Purpose

Vue will replace the radio-tab + iframe shell with a SPA, then convert About → MOD → Blender → Planner.

The cheap vanilla hygiene that blocked a clean copy (invalid `index.html`, HTTP fonts, About sniff, implicit globals, unused `Diveplan` module, blender table/script order, `calcHeight`, fake `import` comments, try/catch, log flags, leftover markup) is **done**. What is left:

- **L\*** — items that belong in Vue (router, canvas refs, `v-for` table, scoped CSS)

There is **no remaining vanilla checklist** in this file.

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

### M5. Implicit globals that will throw under ES modules — **done**

**Status.** Closed for the sites listed below, including the former leftover in `getPointText`.

| File | Leak | Now |
|------|------|-----|
| `source/model.js` | `pressure`, `depth` | `let` in `depth2pressure` / `pressure2depth` / `depth2absolutePressure` |
| `source/plan_txt.js` | `idx` | `for (let idx = 0; …)` |
| `source/calculate_plan.js` | `wp_txt` | `let wp_txt` in `calculatePlan` |
| `source/blender.js` | `result_txt`, `dropval` | `let` |
| `source/planner.js` | `txt` | `let txt` after `plan_txt(...)` |
| `source/mod.html` inline | `o2_pct`, `ppo2` | `let` in `calculateMOD()` |
| `source/planner.js` `getPointText` | undeclared `idx` | `let pointIdx` in the mouse-readout loop |

**Verify (already true for listed leaks).** Do not “clean up” `Object.create` in the same pass (see L1).

---

### M6. Unused `diveplan.js` vs canonical `runPlan()` object — **done**

**Status.** Closed. Option A.

`source/diveplan.js` is a **classic** (non-module) `function createDiveplan()` returning the same keys `runPlan()` uses (`desc_steps`, `wayPoints`, `tankBottom`, GF 30/80, depth 50, `currentTank: null`, …). `planner.html` loads it before `planner.js`. `runPlan()` calls `const myDP = createDiveplan()` then fills tanks/inputs. No `import`/`export`.

**Verify (already true).** Planner still classic scripts. Default plan object shape includes `desc_steps`, `wayPoints`, `tankBottom`.

---

### M7. Dead `planner_table.html` + sidenav new-tab — **done**

**Status.** Closed.

`source/planner_table.html` is **gone**. Sidenav “Table” calls `openTable()` (in-page `#table_panel` + CSV). Unused `#mySidenav` / `openNav`/`closeNav` were removed in **N6**.

**Verify (already true).** Planner **table** button still shows the in-page table and CSV. No new tab to an empty stub.

---

### M8. Blender: unclosed table + script order — **done**

**Status.** Closed.

Compressor `<table class="t1">` is closed before `#blender_sources` `</div>`. Script order: `tmxcalc.js` → `vanderwaals.js` → `vdw_temp.js` → `blender.js`. Initial `calculateBlend()` is on `DOMContentLoaded`. Extra `"` on `#ddl_ft` and `#ddl_algorithm` is fixed. Remaining dropdown quotes were fixed in **N4**.

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

## 4. Nice-to-fix (vanilla, not blockers) — **done** (N1–N6)

These were optional vanilla cleanups. **All six are closed** in current vanilla code. Vue should copy the cleaned markup/JS, not the old leftovers.

### N1. Uncomment `try/catch` around `calculatePlan` — **done**

**Status.** Closed.

`planner.js` `runPlan()` wraps `calculatePlan(myDP)` in a live `try/catch`. On throw (including `MAX_index = 500` in `convert2vue` §11): alert, reset depth/time to 30 m / 20 min, return. No duplicate bare `calculatePlan(myDP)` above the catch.

**Verify (already true).** Default plan still runs. Catch is present; happy path is unchanged.

---

### N2. Gate planner `LOG_*` flags — **done**

**Status.** Closed.

`calculate_plan.js`: `const DEBUG = false;` and `LOG_LOOP` / `LOG_ASC` / `LOG_catd` / `LOG_MODOUT` / `LOG_states` follow `DEBUG`. Vue can still use `import.meta.env.DEV` when modularizing.

**Verify (already true).** Default plan: console quiet unless `DEBUG` is flipped.

---

### N3. Planner stray `<td>` buttons; empty `#profile` — **done**

**Status.** Closed.

Calculate / table buttons sit in a `<div>`, not stray `<td>`s. Empty `#profile` / `#profile_big` stub is gone. Dual canvas remains `.profile2` (`#profileCanvas` / `#profileCanvas_txt`).

**Verify (already true).** Buttons still run `runPlan()` / `openTable()`. No invented “big profile” view.

---

### N4. Extra `"` on `onmousedown` dropdowns — **done**

**Status.** Closed.

MOD (`#ddl`, `#ddl_pp`), blender gas/bar/`#ddl_ft`/`#ddl_algorithm`, and planner (`#dd_gf`, `#dd_bGas`) use `onmousedown="this.value='';"` (one closing quote).

**Verify (already true).** Dropdowns still clear-on-mousedown and fill O2/He or GF.

---

### N5. MOD extra `<tr>` and commented dropdown — **done**

**Status.** Closed.

`mod.html` has the live table only (standard gas, O2, slider, use case, ppO2, result). Empty extra `<tr>` and commented custom dropdown are gone.

**Verify (already true).** MOD 21% / 1.4 still shows **56.7**. Slider + both dropdowns remain.

---

### N6. Dead sidenav chrome — **done**

**Status.** Closed.

`#mySidenav`, `openNav`/`closeNav`, and unused Controls/Profile/Debug chrome are gone from `planner.html` / `planner.js`. Table remains in-page `#table_panel` + CSV.

**Verify (already true).** Table + CSV still work. No dead sidenav to copy into Vue.

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
| **L11. Planner algorithm / `MAX_index`** | Same engine. UI catch is already in vanilla (`runPlan` try/catch, N1). Do not raise the cap or rewrite stops. Port the same catch in Vue. |
| **L12. Duplicate inline CSS** (`blender.html` / `planner.html` `<style>`) | Move when extracting Vue components. Canvas stacking rules must survive. |
| **L13. Golden Vitest fixtures** | `convert2vue` phase 0 — record **after** P0 HTML/JS hygiene if outputs might change; store under the future `web/` tree, not this checklist’s implementation. Vanilla P0 + N\* hygiene is done; fixtures can be recorded now. |

---

## 6. Suggested order of work

Must-fix **M1–M10** and nice-to-fix **N1–N6 are done**. Skip them.

Remaining is **L\*** in Vue (`convert2vue.md` phases). Do not start Vite from this checklist.

---

## 7. How to verify (whole pass)

Manual, no test runner today (`convert2vue` §10).

| After | Check |
|-------|--------|
| M1–M10 | **Done.** Valid `index.html`; HTTPS font; no jQuery; no About sniff; listed globals use `let` (including `getPointText` `pointIdx`); `createDiveplan()`; no `planner_table.html`; blender table closed + VdW before `blender.js`; no `calcHeight`; no fake `import` / `tanksCheck` |
| N1 | **Done.** Happy-path plan unchanged; live catch; no duplicate bare `calculatePlan` |
| N2 | **Done.** Console not flooded on planner load (`DEBUG = false`) |
| N3, N6 | **Done.** Buttons in a `div`; no `#profile` stub; no dead sidenav; table + CSV still work |
| N4 | **Done.** Dropdowns still clear-on-mousedown; no extra `"` |
| N5 | **Done.** MOD 21% / 1.4 → **56.7**; slider + both dropdowns; no empty extra row |
| Regression | EMPTY blender; Cost/Sources back; planner deco checkboxes; default blender PP+IDG; planner default 50 m / 30 min, GF 30/80 |

If any default numeric/text output changes, **stop**. Algorithm drift is out of scope.

---

## 8. Count

**Must-fix items still open: 0** (M1–M10 **done**).

**Nice-to-fix still open: 0** (N1–N6 **done**). **Leave-until-Vue still open: L1–L13** (L7 jQuery already done in vanilla).

File written: `PLANS/quick_fixes.md`.
