# scalc: convert vanilla JS to Vue

This plan is for **this repository**, not a generic Vue starter. It describes how SCALC actually works today, what to keep, and a phased path to Vue 3 without a big-bang rewrite.

**Do not treat this as an implementation.** Application code stays as-is until a later change.

**Vanilla P0 hygiene (M1–M10 in `PLANS/quick_fixes.md`) is done.** Do not re-fix those as if they were still broken: valid `index.html`, HTTPS fonts in `tabs.css`, no jQuery, no About JS-version sniff, `let` on the listed implicit globals, classic `createDiveplan()` loaded by the planner, no `planner_table.html` stub, blender compressor table closed and VdW scripts before `blender.js`, no `calcHeight()`, no commented fake `import` lines. Remaining vanilla work is N1–N6 in that file (try/catch, `LOG_*`, leftover markup). One residual leak: `planner.js` `getPointText` still uses `for (idx = 0; …)` without `let`.

---

## 1. Goal and non-goals

### Goal

Replace the current vanilla HTML + iframe shell (native DOM; **jQuery is already gone**) with a **Vue 3 single-page app**, while keeping:

- The same four tools: About, MOD, Blender, Planner.
- The same dive/gas **math** (ideal-gas blend, Van der Waals, Bühlmann ZHL-16C planner).
- The same **browser-only** model: no server-side calculation.
- Deployability as **static files** (GitHub Pages, Apache/`DocumentRoot`, `python3 -m http.server`).

### Non-goals (this conversion)

- Do not rewrite the decompression or blending algorithms.
- Do not add a Python/API backend.
- Do not implement Electron, Cordova, or a mobile native wrapper (README long-term items).
- Do not redesign the product (new tools, new gases, mobile-first UX), except where Vue structure makes small cleanups cheap (shared gas lists, real URLs for tabs).
- Do not “fix all planner bugs” as part of Vue migration. Capture regressions; fix algorithms in a separate effort.
- Do not add jQuery. Vanilla already uses native DOM; Vue should use `v-model`.

---

## 2. Current architecture (this repo)

SCALC is a **static website**. There is **no Python application server**, no `package.json`, no bundler, no tests, and no `fetch` / REST layer. The workspace name `python/scalc` is historical: the JS was manually ported from Python/C# (`pydplan`, FillCalcWin). Python is used only as a **dev static server**:

```text
python3 -m http.server
```

Production today: copy the repo to a web root (Apache example in `README.md`) or GitHub Pages (`https://eianlei.github.io/scalc/index.html`). After first load, the app can run fully offline in the browser.

### 2.1 Entry points and “routing”

| File | Role |
|------|------|
| `index.html` | Shell. CSS radio tabs (`tab_ABOUT`, `tab_MOD`, `tab_Blender`, `tab_Planner`) + four **iframes**. |
| `index.css` | Shared tables, dropdowns, sliders. |
| `source/tabs.css` | Tab chrome (`#tab_*:checked ~ .content #content_*`). Google Fonts via **HTTPS** (`fonts.googleapis.com`). |
| `source/about.html` | About iframe. |
| `source/mod.html` | MOD iframe. |
| `source/blender.html` | Blender iframe. |
| `source/planner.html` | Planner iframe. In-page table is `#table_panel`. |

`planner_table.html` is **deleted**. Sidenav “Table” calls `openTable()` (same in-page panel). There is **no URL routing**. The visible tool is whichever radio is checked. Iframes do not share JS state. Refreshing the parent always lands on **ABOUT** (`checked` on `tab_ABOUT`).

`index.html` is a **valid** document (head/title, four iframes at 1000px, no `calcHeight`). Vue + Vite will still replace this file as the SPA host — copy layout intent, not iframe hacks.

### 2.2 How the UI works today

```text
index.html (tabs + iframes)
 ├── about.html     (static copy; no version sniff)
 ├── mod.html       (native DOM + inline calculateMOD)
 ├── blender.html   (tmxcalc.js → vanderwaals.js → vdw_temp.js → blender.js)
 └── planner.html   (gradient_factor.js + ZHL16c.js + model.js + diveplan.js
                     + tanks.js + profile_point.js + plan_txt.js
                     + calculate_plan.js + planner.js)
```

Scripts are classic `<script src>` (global functions), **not** ES modules. Fake commented `import` lines were **removed**. `diveplan.js` is a classic `createDiveplan()` factory; `planner.html` loads it; `runPlan()` uses that object then fills tanks/inputs.

**jQuery is not used.** DOM glue is `getElementById` / `addEventListener` (`inputVal` helpers in blender/planner). Do not add a CDN or vendor file.

**No `localStorage` / `sessionStorage`.** All state lives in DOM inputs and a few globals.

### 2.3 Screens and in-page navigation

**About** (`source/about.html`)

- Static license/GitHub copy. States that calculations run in the browser.
- No JS version sniff (removed in vanilla). Vue: keep the copy; do not reintroduce sniffing.

**MOD** (`source/mod.html`)

- Inputs: `#ddl` (standard gas), `#o2_pct`, `#o2range`, `#ddl_pp` (ppO2 use case), `#ppo2`.
- Output: `#mod_result`.
- Formula in `calculateMOD()`: `10 * ((ppo2 / (o2_pct / 100)) - 1)`.
- Recalc on change. Entirely self-contained.

**Blender** (`source/blender.html` + `blender.js`)

Three exclusive panels via `display: none|block`:

1. `#blender_main` — mix/pressure/temps, `#ddl_ft` fill method, `#ddl_algorithm`, `#text_output`.
2. `#blender_cost` — tank size and prices, `#cost_output`.
3. `#blender_sources` — He/O2 storage + compressor spans.

Canvas overlay (always in DOM, even when cost/sources shown):

- `#bProfCanvas` (fill profile)
- `#pProfCanvas_txt` (text overlay; currently unused for mouse)

Globals: `global_result`, `filltype` (default `"pp"`), `algorithm` (default `"IDG"`). `calculateBlend()` on load and on `.input2` change.

Fill methods: `air`, `nx`, `tmx`, `pp`, `cfm` (`top` option is **disabled**). Algorithms: `IDG` → `tmxcalc_num` / `tmxcalc_text`; `VdW1` → `vdw_calc`; `VdW2` → `vdw_calc_temp` (temps from `#temp_*`).

**Planner** (`source/planner.html` + `planner.js`)

- `#main` — depth/time, GF, three tanks (bottom + deco1/deco2 checkboxes), `runPlan()`, dual canvas, `#planner_textout`.
- `#table_panel` — HTML table from `globalDP.profileSampled`, CSV download (`createTableCSV`, EU `;` and comma decimals).
- `#profile` — empty stub (`#profile_big`).
- `#mySidenav` — mostly unused (`openNav` exists; Controls/Profile/Debug are `#` links).

`runPlan()` reads `.input3` fields, builds tank objects, calls `calculatePlan(myDP)`, then `plan_txt(...)` and `drawSmallProfile(myDP)`. Mouse move on `#profileCanvas_txt` shows a readout.

### 2.4 Calculation modules (keep as logic, not Vue)

Treat these as **pure-ish JS libraries**. Vue should call them; it should not embed the math in components.

| File | What it is | Vue note |
|------|------------|----------|
| `source/tmxcalc.js` | `BlenderState`, `tmxcalc_num`, `tmxcalc_text` | Export; blender composable |
| `source/vanderwaals.js` | `vdw_calc`, `VdW_equation`, `RootFindingBisect`, constants | Export; used by VdW1 and `vdw_temp.js` |
| `source/vdw_temp.js` | `vdw_calc_temp` | Depends on `BlenderState` + VdW solvers |
| `source/blender.js` | DOM (native), canvas `drawFillProfile`; `calculateBlend()` on `DOMContentLoaded` | Split: UI → Vue, canvas → helper, cost/storage → functions |
| `source/ZHL16c.js` | Coefficient table `ZHL16c[16]` | Export constant |
| `source/model.js` | `ModelPoint`, `Compartment`, `depth2absolutePressure` | Used by planner + `tanks.js` |
| `source/gradient_factor.js` | `class gradientFactor` | Used by `calculatePlan` |
| `source/tanks.js` | `tankUpdate`, `changeTanks`, `initTanks` | Keep with planner engine |
| `source/profile_point.js` | `DiveProfilePoint` template object | Engine internal |
| `source/plan_txt.js` | `DecoStop`, `plan_txt()` | Engine / view-model |
| `source/calculate_plan.js` | `DivePhase`, `calculatePlan(diveplan)` | Core planner; `LOG_*` flags spam console |
| `source/diveplan.js` | Classic `createDiveplan()` matching `runPlan()` | Reuse / export that factory in Vue |
| `source/planner.js` | DOM (native), canvas, table HTML, CSV | Vue views + `drawSmallProfile` helper |

### 2.5 Build / serve / assets today

- **No build.** Browsers load HTML/JS/CSS as files.
- **No tests.**
- **Images:** `scalc-planner.jpg` is referenced from README/GitHub, not from the app UI. No favicon in-repo (README todo).
- **CSS:** duplicated layout in `blender.html` / `planner.html` `<style>` blocks plus `index.css`.
- **Standard gas dropdowns** are copy-pasted in `blender.html` and `planner.html` (planner comments out hypoxic mixes).

---

## 3. Recommended Vue version and tooling

**Choose Vue 3 + Vite + Vue Router, JavaScript (not TypeScript) for the first conversion.**

| Choice | Why for *this* repo |
|--------|---------------------|
| **Vue 3** (Composition API, `<script setup>`) | Current standard; small app; `v-model` replaces remaining `getElementById` field wiring. Vue 2 is EOL. |
| **Vite** | Native ES modules, fast HMR, static `dist/` that still deploys like today’s Apache/GitHub Pages tree. Matches “no backend” exactly. |
| **vue-router** | Replaces radio+iframe tabs with real URLs (`/`, `/mod`, `/blender`, `/planner`) so refresh/bookmark work. Nested routes replace blender/planner `display:none` panels. |
| **JavaScript, not TS first** | Existing code is untyped. Listed implicit globals were given `let` in vanilla; residual `idx` in `planner.js` `getPointText`. Typing `calculatePlan` is a later hardening pass, not a migration blocker. |
| **Vitest** for engine tests | The valuable part of SCALC is numeric. Unit-test `tmxcalc_num` / `vdw_calc` / `calculatePlan` without mounting Vue. |
| **No Pinia in phase 1** | See §5. |
| **No jQuery** | Already gone in vanilla; Vue bindings replace remaining `getElementById` wiring. |
| **No Vuex** | Unnecessary. |

Optional later: TypeScript on `src/lib/` only; `@vueuse/core` if you persist blender prices.

**Vite `base`:** GitHub Pages is `https://eianlei.github.io/scalc/`, so production build **must** use `base: '/scalc/'` (or a relative `base: './'` if you also deploy at domain root `scalc.ianleiman.com`). Prefer `base: './'` so the same `dist/` works at both `/` and `/scalc/`.

Scaffold (when implementing, not now):

```text
npm create vue@latest
# Vue 3, Vue Router yes, Pinia no, Vitest yes, ESLint yes, TypeScript no
```

---

## 4. Incremental strategy (preferred)

Do **not** rewrite all four iframes in one PR. The math must stay comparable to today’s globals-on-`<script>` behavior.

**Strategy: extract engines first, then replace the shell, then convert one tool at a time.** During migration, the old `index.html` + iframes can keep shipping until the Vue shell is feature-complete.

```text
Phase 0  Baseline + golden numbers
Phase 1  Vite app beside existing static site
Phase 2  ES-module the calculation files (still callable from vanilla if needed)
Phase 3  Vue shell + router; iframe remaining tools
Phase 4  About + MOD in Vue
Phase 5  Blender in Vue
Phase 6  Planner in Vue
Phase 7  Cut over: GitHub Pages / Apache serve dist/; delete iframe pages
```

Iframe-in-Vue (phase 3) is the **strangler** step: `App.vue` tabs/router still load `source/blender.html` until that tool is converted. That keeps GitHub Pages usable if you deploy a hybrid, and lets you verify routing without touching `calculate_plan.js`.

---

## 5. State management

**Recommendation: no Pinia for the conversion.** Use **per-tool composables**.

Reasons from actual state:

- Tools **do not share state**. Blender `global_result` never feeds Planner. MOD is three numbers.
- No persistence, no user session, no API cache.
- Blender “multi-screen” state is one object plus `filltype` / `algorithm` (today: module globals).
- Planner “table vs main” is a view flag plus `globalDP`.

| Today | Vue |
|-------|-----|
| MOD DOM | `useMod()` or local `ref`s in `ModView.vue` |
| `filltype`, `algorithm`, `global_result` | `useBlender()` composable |
| Blender cost/sources inputs | same composable (or nested `useBlenderCost`) |
| `globalDP` | `usePlanner()` holding last `diveplan` |
| Table / main / sidenav | `usePlanner().panel` or nested route |

**Add Pinia later** only if you persist blender prices, last-used mixes, or share a tank library across Blender and Planner. That is a product feature, not required to leave vanilla JS.

Do **not** put Bühlmann `ModelPoint` tissue arrays in a store. They are outputs of `calculatePlan`.

---

## 6. Routing

**Use Vue Router in history mode** (GitHub Pages needs a `404.html` copy of `index.html`, or hash mode).

Because this host is often a **subdirectory** (`/scalc/`) and Apache may not rewrite SPA routes, **hash mode is the safer default** for this repo (`createWebHashHistory()` → `/#/planner`). History mode is nicer if you control Apache `FallbackResource` / `try_files`.

| Route | Replaces |
|-------|----------|
| `/` or `/about` | `#content_ABOUT` iframe `about.html` |
| `/mod` | `#content_MOD` / `mod.html` |
| `/blender` | `#blender_main` |
| `/blender/cost` | `#blender_cost` |
| `/blender/sources` | `#blender_sources` |
| `/planner` | `#main` in `planner.html` |
| `/planner/table` | `#table_panel` |

Drop or defer: unused sidenav (`openNav`), empty `#profile`. `planner_table.html` is already gone. CSV stays a button on the table view.

Tab UI: keep visual tabs (port `tabs.css`) as `router-link`s, not radio inputs.

---

## 7. Mapping: current files → Vue

### Shell

| Current | Vue |
|---------|-----|
| `index.html` tabs + iframes (no `calcHeight`) | `src/App.vue` layout + `router-view` |
| `source/tabs.css` | `src/assets/tabs.css` or scoped App styles |
| `index.css` | `src/assets/index.css` imported once |

### About

| Current | Vue |
|---------|-----|
| `source/about.html` copy | `src/views/AboutView.vue` |
| Version sniff (already removed) | omit; do not re-add |

### MOD

| Current | Vue |
|---------|-----|
| `mod.html` table | `src/views/ModView.vue` |
| `calculateMOD()` | `src/lib/mod.js` `export function calculateMod(o2Pct, ppo2)` |
| Native slider/select | `v-model` + `@input` |

### Blender

| Current | Vue |
|---------|-----|
| `blender.html` main table | `src/views/blender/BlenderMain.vue` |
| Cost panel | `src/views/blender/BlenderCost.vue` |
| Sources panel | `src/views/blender/BlenderSources.vue` |
| `blender.js` `calculateBlend` / `doCost` / storage | `src/composables/useBlender.js` calling lib |
| `tmxcalc.js` | `src/lib/blender/tmxcalc.js` |
| `vanderwaals.js` | `src/lib/blender/vanderwaals.js` |
| `vdw_temp.js` | `src/lib/blender/vdw_temp.js` |
| `drawFillProfile` / `drawRamp` | `src/components/blender/FillProfileCanvas.vue` + `src/lib/blender/drawFillProfile.js` |
| Gas `<option>` lists | `src/lib/gases.js` shared with planner |

### Planner

| Current | Vue |
|---------|-----|
| Input tables | `src/views/planner/PlannerMain.vue` |
| `runPlan()` input gathering | `src/composables/usePlanner.js` |
| `calculate_plan.js` | `src/lib/planner/calculatePlan.js` |
| `model.js`, `ZHL16c.js`, `gradient_factor.js`, `tanks.js`, `profile_point.js`, `plan_txt.js` | `src/lib/planner/*` |
| `diveplan.js` `createDiveplan()` | Same factory used by `usePlanner` |
| `drawSmallProfile` + mouse overlay | `src/components/planner/ProfileCanvas.vue` |
| Table HTML string | `src/views/planner/PlannerTable.vue` with `v-for` (no `innerHTML`) |
| `createTableCSV` | `src/lib/planner/exportCsv.js` |
| Howto popup | small `PlannerHowto.vue` or native `<dialog>` |

---

## 8. Keeping “the backend” working during migration

There is no calculation backend. “Keep the server working” means **keep static hosting working**.

### During hybrid phase

Leave the repo root as today (`index.html` at `/`). Put the Vue app in a subdirectory, e.g. `web/` or `frontend/`, **or** keep Vue at repo root and move vanilla files to `legacy/`. Recommended layout:

```text
scalc/                  (git root, still GitHub Pages root)
  index.html            (current shell — until cutover)
  source/               (current iframes)
  web/                  (Vite project)
    package.json
    vite.config.js
    src/
    public/
```

- **Local vanilla:** `python3 -m http.server` from repo root still serves the old app.
- **Local Vue:** `cd web && npm run dev` (Vite, typically `:5173`).
- **Apache / ianleiman.com:** unchanged until you copy `web/dist` over the site root.
- **GitHub Pages:** still serves `index.html` until you replace it with Vite’s `dist/index.html` and assets.

Do not mix Vite HMR and `python3 -m http.server` as one process. They are two servers pointing at two trees.

### After cutover

`npm run build` → `web/dist/` (or `dist/` if Vite lives at repo root).

- Apache `DocumentRoot` points at `dist` **or** you copy `dist/*` into `/var/www/scalc`.
- GitHub Pages: either publish `dist` (GitHub Action) or commit built files (not ideal). Document `base: './'`.
- `python3 -m http.server` should be run **inside `dist`**, not the source tree, after cutover. Update `README.md` Installation accordingly.

SPA fallback: hash routing needs none. History mode needs Apache:

```apache
FallbackResource /index.html
```

or nginx `try_files $uri $uri/ /index.html`.

---

## 9. Build, assets, CSS, static files

### Build

- Vite bundles Vue + `src/lib/*`.
- Keep calculation files **side-effect free** after extraction (today `blender.js` calls `calculateBlend()` on `DOMContentLoaded`; `planner.js` still runs `runPlan()` on input change / load as vanilla UI).
- Turn off or gate `LOG_LOOP` etc. in `calculate_plan.js` in production (`import.meta.env.DEV`).

### CSS

1. Import `index.css` globally (tables `.t1`, `.ddl`, `.slider`).
2. Move `tabs.css` to the app chrome. Font URL is **already HTTPS** (`https://fonts.googleapis.com/...`). Do not revert to `http://`. Tauri still must **bundle** fonts later (`tauri_desktop.md`); HTTPS CDN is enough for GitHub Pages.
3. Move inline styles from `blender.html` (`.wrap-flex`, `.div_bProf`) and `planner.html` (`.sidenav`, `.profile2`, `.popup`) into scoped component CSS or `src/assets/planner.css`.
4. Canvas stacking (`.profile2 canvas { position: absolute }`) must survive the move or profiles will not overlay.

### Static / public

- `public/` for favicon (still missing) and `scalc-planner.jpg` if the About page should show it.
- No other binary assets in the app today.

### jQuery

Already removed from vanilla. Do not add jQuery to Vite.

---

## 10. Testing / verification

There are **no tests today**. Add them around engines **before** changing UI, so Vue cannot silently change mixes or deco stops.

### 10.1 Golden fixtures (phase 0)

From the **current** app, record outputs:

**MOD:** O2 21%, ppO2 1.4 → `56.7` (already the default in `mod.html`).

**Blender (IDG, pp):** current 100 bar 21/35 → 200 bar 21/35. Save `#text_output` and key fields of `global_result` (`add_he`, `add_o2`, `add_air`, `tbar_2`, `tbar_3`). Repeat for `nx`, `air`, `VdW1`, `VdW2` with default temps.

**Planner defaults:** 50 m / 30 min, GF 30/80, bottom 21/35 24 L 200 bar, deco1 50% @ 21 m, deco2 100% @ 6 m. Save `#planner_textout` and CSV (or `profileSampled.length`, last runtime, deco stop list). Vanilla `LOG_*` flags are still `true` (N2 in `quick_fixes.md`) — expect console noise until gated.

Store fixtures as `web/src/lib/**/__fixtures__/*.json`.

### 10.2 Vitest

- `tmxcalc_num('pp', ...)` vs fixture.
- `vdw_calc` / `vdw_calc_temp` vs fixture (floating tolerance).
- `calculatePlan` on a constructed `myDP` matching `runPlan()` defaults vs fixture (`decoStopsCalculated`, `wayPoints`).

### 10.3 Manual UI (each Vue screen)

- MOD: slider, dropdowns, typing O2 and ppO2; compare to vanilla iframe.
- Blender: every fill type; algorithm switch; EMPTY; Cost and Sources numbers; canvas not blank; error path (`status_code != 0` red ERROR on canvas).
- Planner: change depth/time/GF/tanks/checkboxes; canvas + mouse readout; table; CSV download; invalid O2/He alerts (today `alert()`).
- Tabs: deep-link `/#/blender/cost` if using hash.

### 10.4 Hosting smoke

- `python3 -m http.server` on `dist`.
- Open `index.html` as GitHub Pages would (`/scalc/` if applicable).
- Confirm no mixed-content font errors (vanilla already uses HTTPS fonts).

Browser verification of Vue UI belongs to the implementation phase; this plan does not convert the app.

---

## 11. Risks and mitigations

| Risk | Why it is real here | Mitigation |
|------|---------------------|------------|
| Implicit globals | Listed leaks (`pressure`/`depth`, `plan_txt` `idx`, `wp_txt`, blender `result_txt`/`dropval`, planner `txt`, MOD `o2_pct`/`ppo2`) already have `let` in vanilla. Residual: `planner.js` `getPointText` still `for (idx = 0; …)`. ES modules + `"use strict"` will throw on that loop. | Add `let` **only** on remaining leaks while modularizing; do not “clean up” algorithms. Do not re-declare the already-fixed sites as a Vue task. |
| `Object.create(BlenderState)` / `DiveProfilePoint` | Shared prototype mutations can leak between runs. | Keep the same pattern in lib until tests exist; then clone with `{...BlenderState}` if tests show pollution. |
| Diveplan shape | Vanilla now uses `createDiveplan()` (classic script) from `runPlan()`. Do not invent a second `export const Diveplan` with GF 30/85 or `currentTank: "BOTTOM"`. | Copy `createDiveplan()` into `src/lib/planner/createDiveplan.js`; keep `runPlan()` field assignments. |
| Canvas in Vue | `getElementById` at wrong lifecycle; overlay canvas size. | `ref` + `watch` + `nextTick`; keep width/height 600×310 and 600×200. |
| `innerHTML` table | XSS is low (numeric), but Vue should use `v-for`. | Rebuild table as components; compare row count to fixture. |
| Numeric drift | Vue `v-model.number` vs `parseInt` of strings. | Keep `parseInt` at the lib boundary; test integers. |
| Iframe CSS isolation lost | Each iframe had its own `index.css` + inline styles. One SPA shares CSS; `h1 { padding: 100px }` in `tabs.css` will wreck inner pages if applied globally. | **Do not import `tabs.css` rules for `h1`/`p` globally.** Scope chrome styles to the tab bar. This is the highest CSS risk. Font URL is already HTTPS — do not “fix” it again except bundling for Tauri. |
| GitHub Pages base path | Absolute `/assets/...` 404s under `/scalc/`. | `base: './'`. |
| jQuery | **Already removed** from vanilla. | Do not add jQuery to Vite. Native/`v-model` only. |
| Planner iteration cap | `MAX_index = 500` throws. Vanilla still has a **commented** try/catch (N1). | Same engine; Vue should `try/catch` like that commented block in `runPlan()`. |
| Disabled fill type `top` | Easy to “enable” accidentally. | Keep disabled until product work. |
| Hypoxic gases | Planner HTML comments them out; blender allows 10/70. | Preserve per-screen lists in `gases.js`. |
| Extra blender scripts / unclosed table | **Fixed** in vanilla (table closed; VdW before `blender.js`; `calculateBlend` on `DOMContentLoaded`). | Lib copies stay side-effect free; do not restore the old script order. |
| About version sniff / `calcHeight` / fake imports / `planner_table.html` | **Fixed** in vanilla. | Do not port them. |

---

## 12. Suggested Vue folder structure

```text
web/
  index.html
  vite.config.js
  package.json
  public/
    favicon.ico                 (when you add one)
  src/
    main.js
    App.vue
    router/index.js
    assets/
      index.css                 (from repo root index.css)
      chrome.css                (tab bar only; not full tabs.css body/h1)
    lib/
      gases.js
      mod.js
      blender/
        tmxcalc.js
        vanderwaals.js
        vdw_temp.js
        drawFillProfile.js
        calculateCost.js        (from blender.js calculateCost)
      planner/
        ZHL16c.js
        model.js
        gradientFactor.js
        tanks.js
        profilePoint.js
        planTxt.js
        calculatePlan.js
        createDiveplan.js
        drawSmallProfile.js
        exportCsv.js
    composables/
      useBlender.js
      usePlanner.js
    components/
      AppTabs.vue
      blender/FillProfileCanvas.vue
      planner/ProfileCanvas.vue
      planner/TankRow.vue
    views/
      AboutView.vue
      ModView.vue
      blender/BlenderView.vue      (layout + child routes)
      blender/BlenderMain.vue
      blender/BlenderCost.vue
      blender/BlenderSources.vue
      planner/PlannerView.vue
      planner/PlannerMain.vue
      planner/PlannerTable.vue
```

Repo root until cutover keeps current `index.html` and `source/`.

---

## 13. Phased checklist

### Phase 0 — Baseline (no Vue)

- [ ] Record MOD / Blender / Planner golden outputs (defaults + a few extra cases). Vanilla P0 HTML/JS hygiene (M1–M10) is already done.
- [ ] Note `tabs.css` `h1 { padding: 100px }` so it is not applied inside tools.
- [ ] Decide deploy `base`: `'./'` recommended.

### Phase 1 — Scaffold Vite beside the site

- [ ] Create `web/` with Vue 3 + Vite + vue-router + Vitest.
- [ ] Confirm `npm run dev` and `npm run build`.
- [ ] Confirm original `python3 -m http.server` from **repo root** still serves vanilla scalc.

### Phase 2 — Modularize engines (still no UI rewrite)

- [ ] Copy calc files into `web/src/lib/` with `export` on public functions/classes/constants. Use `createDiveplan()`, not an unused `Diveplan` export.
- [ ] Listed implicit globals already have `let` in vanilla. Add `let` on residual `idx` in `planner.js` `getPointText` when that helper is copied. Do not “re-fix” `model.js` / `plan_txt.js` / `wp_txt` as if still leaking.
- [ ] Keep lib copies side-effect free (`calculateBlend` / `runPlan` stay in UI/composables). Vanilla already moved blender init to `DOMContentLoaded`.
- [ ] Vitest: `tmxcalc_num`, `vdw_calc`, `calculatePlan` vs fixtures.
- [ ] Vanilla `source/*.html` unchanged and still working.

### Phase 3 — Vue shell (strangler)

- [ ] `App.vue` + routes for about/mod/blender/planner.
- [ ] Hash history unless Apache rewrite is guaranteed.
- [ ] Temporarily embed legacy tools as `<iframe src="/source/mod.html">` etc. from the Vue app **or** keep using root `index.html` until phase 4–6 land.
- [ ] Tab labels match today: ABOUT, MOD, Blender, Planner.

### Phase 4 — About + MOD

- [ ] `AboutView.vue` content from `about.html` (version sniff already gone; do not re-add).
- [ ] `ModView.vue` + `calculateMod`; `v-model` on O2, slider, ppO2, both `<select>`s.
- [ ] Match `56.7` for 21% / 1.4.
- [ ] Keep native/`v-model` (jQuery already gone on MOD).

### Phase 5 — Blender

- [ ] `useBlender()`: filltype, algorithm, mix/pressure/temps, last result.
- [ ] Main / cost / sources as nested routes or in-view panels (same exclusivity as today).
- [ ] Wire `tmxcalc_*`, `vdw_calc`, `vdw_calc_temp`.
- [ ] Port `doCost`, `do_O2_storage`, `do_He_storage`, `do_compressor`.
- [ ] `FillProfileCanvas` from `drawFillProfile` / `drawRamp` / `drawVertLines`.
- [ ] EMPTY button; disabled `top` option.
- [ ] Compare text output and canvas stages to vanilla for `pp` + IDG and `pp` + VdW2.

### Phase 6 — Planner

- [ ] `usePlanner()` builds the same tank objects and `myDP` fields as `runPlan()`.
- [ ] Recalc on input change (today `.input3` `change`).
- [ ] `ProfileCanvas` + mousemove readout.
- [ ] Table view without `innerHTML`; CSV blob download `planner_table.csv`.
- [ ] Preserve `alert()` validation for O2/He or replace with inline error (behavior change — call it out in the PR).
- [ ] Do not port unused sidenav. `planner_table.html` stub is already deleted; table is in-page `#table_panel`.
- [ ] Compare `plan_txt` and stop list to fixture.

### Phase 7 — Cut over and cleanup

- [ ] Vue app is the only UI; delete or archive `source/*.html` iframes and root tab shell.
- [ ] Confirm jQuery stays absent (already gone in vanilla; do not add it to Vite).
- [ ] Update `README.md`: Vite build, serve `dist`, GitHub Pages `base`, Apache still static.
- [ ] Keep fonts HTTPS in chrome CSS (already true in `tabs.css`); Tauri still bundles fonts later.
- [ ] GitHub Action or documented copy of `dist` to Pages.
- [ ] Smoke: GitHub Pages, `python3 -m http.server` in `dist`, Apache virtual host.

---

## 14. Implementation notes (for the future implementer)

1. **Canonical planner input object** is `createDiveplan()` in `diveplan.js` plus the field assignments in `planner.js` `runPlan()` (`desc_rate`, `desc_steps`, `bottom_steps`, `tankBottom`, …). Do not resurrect a separate unused `export const Diveplan`.
2. **GF in the engine is a fraction** (`parseInt(inputVal("gf_low")) / 100.0`). UI shows 30/80.
3. **Times are minutes** (comment in `planner.js` / `calculate_plan.js`, 2021-11-19).
4. **`calculateCost` uses `parseInt` on euro prices** — `4.6` O2 price becomes `4`. Replicating that is “bug-compatible”; fixing it is a separate change.
5. Shared gases: blender includes hypoxic TMX; planner bottom-gas dropdown does not. Keep two lists or a `hypoxic: true` flag.
6. `calcHeight()` is **gone**. Iframes still use a fixed `height: 1000px`. Vue layouts do not need either. Do not copy a height-sync script into `App.vue`.

---

## 15. Summary

SCALC is four isolated browser tools behind CSS tabs and iframes, with native DOM glue and substantial JS math (vanilla P0 hygiene in `quick_fixes.md` is done; jQuery is gone). Vue 3 + Vite should wrap that math as ES modules, replace tabs with the router, and convert MOD → Blender → Planner. No Pinia and no backend. Static hosting stays the deployment model.
