# scalc: Tauri 2 desktop app (after Vue)

This plan is for **this repository**, not a generic Tauri tutorial. It assumes the **Vue 3 + Vite conversion in `PLANS/convert2vue.md` is finished** (SPA, static `web/dist`, Vue Router, no Pinia unless that plan later changed). The desktop app is a **native window around that same frontend**, not a rewrite of MOD / blender / Bühlmann math.

**Do not treat this as an implementation.** Do not convert vanilla JS, do not add Tauri crates, and do not mix a Tauri shell with the current iframe + jQuery site.

README long-term item this replaces: *“desktop version will run on Electron and include Windows installer.”* Cordova (Android/iOS) remains out of scope.

---

## 1. Goal and non-goals

### Goal

Ship **SCALC as a normal desktop application** (Windows first) so a technical diver can run About, MOD, Blender, and Planner **offline**, without a browser tab or a local HTTP server, while:

- Reusing the **one Vue 3 codebase** produced by `convert2vue.md`.
- Keeping calculations **in the WebView** (same JS engines as GitHub Pages).
- Providing a **Windows installer** (README already asked for this).
- Leaving Apache / GitHub Pages / `python3 -m http.server` as the **web** target.

### Non-goals

- Do **not** rewrite `tmxcalc`, Van der Waals, or `calculatePlan`. Desktop is a **wrapper**, not FillCalcWin/pydplan reborn in Rust.
- Do **not** add a calculation backend, Python API, or Tauri command that reimplements gas math. There is no server today; there should not be one for desktop.
- Do **not** implement Electron, Cordova, or a mobile wrapper in this effort.
- Do **not** wrap the **current** vanilla `index.html` + four iframes + CDN jQuery. That shell is incompatible with offline Tauri (see §8).
- Do **not** add Pinia, user accounts, or cloud sync.
- Do **not** add filesystem “save dive plan” / “open plan” unless you first add that as a **product** feature in Vue. **Today there is no save/open** (`localStorage` / `sessionStorage` unused; planner CSV is a **browser download** of a Blob, not a file picker).
- Do **not** “fix planner bugs” as part of packaging.
- Do **not** change GitHub Pages behavior except shared Vue `base: './'` (already required by the Vue plan).

---

## 2. Prerequisite: Vue conversion first

**Hard dependency:** complete `PLANS/convert2vue.md` through **Phase 7 cutover** before starting this plan.

You need all of the following to be true:

| Check | Why Tauri needs it |
|-------|-------------------|
| Vue 3 + Vite + vue-router live in `web/` | Tauri loads `web/dist` (prod) or Vite `devUrl` (dev). |
| Engines are ES modules under `web/src/lib/` | Same JS runs in WebView2; no extra IPC. |
| **No jQuery CDN** | WebView with a locked CSP cannot fetch `code.jquery.com`. |
| **No Google Fonts `@import` over HTTP/HTTPS** | `source/tabs.css` today uses `http://fonts.googleapis.com/...`. Vue conversion must **bundle a font** (or system stack) so desktop is fully offline. Switching the URL to HTTPS is enough for GitHub Pages; **it is not enough for Tauri**. |
| Hash or history router works from `base: './'` | Tauri custom protocol is not GitHub’s `/scalc/` path; relative `base` serves both. |
| `npm run build` produces a self-contained `web/dist/` | `beforeBuildCommand` copies nothing from `source/*.html`. |
| Golden Vitest fixtures still pass | Packaging must not be blamed for numeric drift. |

**Do not** start a Tauri window that `<iframe>`s `source/mod.html` / `blender.html` / `planner.html`. That would reintroduce CDN jQuery, mixed-content fonts, and iframe height hacks (`calcHeight()`), and it fights the Vue strangler instead of succeeding it.

If Vue is only at convert2vue Phase 3 (shell + legacy iframes), **stop**. Finish Phases 4–7 first.

---

## 3. Prerequisites (toolchain and OS)

Implementer machine (this workspace is **Windows 10/11**, `win32`):

| Tool | Role |
|------|------|
| Node.js (LTS) + npm | Same as Vue; `@tauri-apps/cli` |
| Rust (stable) via `rustup` | `src-tauri` crate |
| Microsoft C++ Build Tools / MSVC | `tauri build` on Windows |
| **WebView2 Runtime** | Tauri 2 UI on Windows (Edge WebView2). Win11 and current Win10 usually already have it; the NSIS/MSI bundle should still offer a bootstrapper for older PCs. |
| Tauri CLI 2 | `npm exec tauri` / `@tauri-apps/cli@^2` |

macOS/Linux builds are **optional later** (§11). They need Xcode / WebKitGTK respectively and are not required to ship the Windows installer README asked for.

Confirm after Vue exists:

```text
cd web
npm run build
npm run test        # Vitest engines
```

Then add Tauri; do not invent a second frontend.

---

## 4. Why Tauri 2 vs Electron (this app)

README’s desktop idea was Electron + Windows installer. For **this** project that is a poor fit:

| Fact about SCALC | Electron | Tauri 2 |
|------------------|----------|---------|
| Tiny static calculator, four screens, canvas + tables | Ships a full Chromium (~100+ MB) | Uses **WebView2** already on the user’s Windows box |
| No Node backend, no `fetch` API, no auth | Electron’s Node/IPC is unused surface | Default is **no** FS/shell/HTTP plugins |
| GPL-3, scuba disclaimers, “use at your own risk” | Extra Chromium CVE stream to track | Smaller binary, fewer bundled engines |
| Same UI as GitHub Pages | Two Chromium stacks (browser + Electron) | Web = any browser; desktop = OS webview |
| Offline after load is already the product model | Works, but heavy | Matches “kill the python http.server after first load” |

**Use Tauri 2, not Tauri 1.** This repo has no existing `src-tauri`. Tauri 2 is the current capability/ACL model (`capabilities/*.json`), Vue/Vite docs, and Windows bundlers. Do not scaffold v1 `allowlist` in `tauri.conf.json`.

Keep Electron in README history as the old idea; the implementation target is Tauri 2.

---

## 5. Recommended stack

| Layer | Choice | Tied to this repo |
|-------|--------|-------------------|
| UI | Existing **Vue 3** (`<script setup>`), **JavaScript**, **vue-router**, **no Pinia** | `convert2vue.md` §3 and §5 |
| Bundler | **Vite** in `web/` | `web/dist` is the Tauri `frontendDist` |
| Desktop | **Tauri 2** (`src-tauri`) | Window + installer only |
| JS `@tauri-apps/api` | **Do not add until a capability needs it** | No save/open, no notifications, no HTTP |
| Plugins | **None** in v1 of desktop | CSV stays `Blob` + `<a download>` like `planner.js` `table_save2csv` |
| Fonts | Self-hosted **Open Sans** (or drop webfont and use `sans-serif`) | Replaces `tabs.css` Google Fonts |
| Tests | Vitest on `web/src/lib` (unchanged) | Desktop does not re-test Bühlmann in Rust |

Frontend integration (when implementing):

1. Keep Vite as the only frontend build.
2. Add `@tauri-apps/cli` (and later only `@tauri-apps/api` if you open a real plugin).
3. Point Tauri at Vite:
   - **dev:** `devUrl` = Vite server (`http://localhost:5173` or Tauri’s usual `1420` with `strictPort: true`).
   - **prod:** `frontendDist` = `../web/dist`.
4. Optional but recommended: official Vite `server.watch.ignored: ['**/src-tauri/**']` so Rust rebuilds do not loop HMR.
5. There is **no** separate “Tauri Vue plugin” required beyond CLI + `beforeDevCommand` / `beforeBuildCommand`. Do not add `vite-plugin-electron`.

`web/vite.config.js` must keep **`base: './'`** from the Vue plan so hashed assets load from the Tauri custom protocol **and** from GitHub Pages `/scalc/`.

---

## 6. Project layout after Vue exists

`convert2vue.md` puts Vite in `web/` and keeps git root as GitHub Pages root until cutover. After Vue cutover, recommended **dual-target** layout:

```text
scalc/                          git root
  README.md
  LICENSE                       GPL-3.0
  PLANS/
    convert2vue.md
    tauri_desktop.md            this file
  web/                          Vue 3 + Vite (only UI source)
    package.json
    vite.config.js
    index.html
    public/
    src/                        views, composables, lib engines
    dist/                       gitignored; `npm run build`
  src-tauri/                    Tauri 2 crate (not deployed to Pages)
    Cargo.toml
    tauri.conf.json
    build.rs
    capabilities/
      default.json
    src/
      main.rs
      lib.rs                    generated `run()`; keep commands empty
    icons/                      generated PNGs/ICO/ICNS
    target/                     gitignored
```

**Put `src-tauri/` at the git root, not inside `web/`.** Reasons specific to this repo:

- GitHub Pages / Apache should never publish `Cargo.toml` or `target/`.
- Vue plan already isolated the SPA in `web/`.
- Root `.gitignore` can ignore `web/dist`, `web/node_modules`, `src-tauri/target`.

`tauri.conf.json` (conceptual; implement later):

| Key | Value for SCALC |
|-----|-----------------|
| `productName` | `SCALC` (matches `<title>SCALC</title>` in current `index.html`) |
| `identifier` | `com.ianleiman.scalc` (matches `scalc.ianleiman.com`) |
| `version` | Same as `web/package.json` (single source of truth; bump both or generate) |
| `build.frontendDist` | `../web/dist` |
| `build.devUrl` | `http://localhost:5173` (or 1420 if you pin Vite to that port) |
| `build.beforeDevCommand` | `npm run dev` with `cwd` = `web` |
| `build.beforeBuildCommand` | `npm run build` with `cwd` = `web` |
| `app.windows[0].title` | `SCALC` |
| `app.windows[0].url` | default (`/` of the frontend) |
| `bundle.active` | `true` |
| `bundle.targets` | Windows: `nsis` (user-friendly installer). Optionally also `msi`. |

Do **not** set `frontendDist` to repo-root vanilla files or to `source/`.

Root `package.json` is optional. Prefer scripts on `web/package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  }
}
```

CLI can live in `web/devDependencies`; `src-tauri` stays a sibling. Document `cd web` as the working directory for `npm run tauri:dev`.

---

## 7. Capabilities / permissions (Tauri 2)

Tauri 2 does **not** use v1 `allowlist`. Default windows get a **capability** JSON that grants core window APIs. SCALC should stay at the **minimum**.

### What the app actually needs

| Need | Today in repo | Tauri 2 |
|------|---------------|---------|
| Show a window, resize, close | Browser tab | `core:default` (window) |
| Run Vue + canvas + `alert()` validation | In-page JS | No IPC |
| Planner CSV `planner_table.csv` | `Blob` + `a.download` in `table_save2csv` | **No `fs` plugin.** WebView2 download of a Blob is enough. Verify in WebView (downloads folder / Save As). If WebView2 blocks Blob downloads, **then** add `dialog` + `fs` — do not add them speculatively. |
| Save blender mix / last planner | **Does not exist** | Do **not** enable `fs` or `store` |
| About → GitHub / GPL URLs (`target="_blank"`) | Browser opens a tab | May need `opener` **or** leave links as `https://` and let WebView navigate. Prefer **in-app** license text (already in About) and opener **only** if blank-target links do nothing. Grant `opener:allow-open-url` only for `https://github.com/eianlei/scalc` and `https://www.gnu.org` if you add the plugin. |
| Network for calculations | None | **Deny** HTTP plugin; no `http:default` |
| Shell / OS commands | None | **Deny** |
| Clipboard | None | **Deny** unless you later add “copy plan text” |

### Capability file intent (`src-tauri/capabilities/default.json`)

- Attach to the main window label only (`main`).
- Include core window permissions required to start.
- **Omit** `fs:default`, `http:default`, `shell:default`, `os:default`, `process:default`.
- Do **not** add custom `#[tauri::command]` handlers for `calculateMod`, `tmxcalc_num`, or `calculatePlan`. Those stay in `web/src/lib`.

If `tauri init` generates extra permissions, **delete them** before the first release.

---

## 8. Offline / no-network (mandatory)

Product behavior today: README says after the app is loaded you can kill `python3 -m http.server` because files are cached. Desktop must be **stricter**: **zero network required after install**, including first launch on an airplane.

Blockers in the **current** vanilla app (why Vue must finish first):

1. `https://code.jquery.com/jquery-3.6.0.min.js` in `mod.html`, `blender.html`, `planner.html`.
2. `http://fonts.googleapis.com/css?family=Open+Sans:...` in `source/tabs.css` (also mixed content on GitHub Pages HTTPS).
3. About page optional navigation to GitHub/GPL (not required to calculate).

Tauri checklist:

- [ ] CSP disallows `https://code.jquery.com` and `http(s)://fonts.googleapis.com`.
- [ ] Open Sans (if kept) is a file under `web/src/assets/fonts/` imported from CSS, not a CDN.
- [ ] No `import` from Skypack/unpkg in Vue.
- [ ] DevTools Network panel on a built app (Wi-Fi off) shows **no** failed font/script requests for the four tools.
- [ ] MOD 21% / 1.4 still shows **56.7**; blender IDG pp and planner defaults match Vue fixtures.

Do not rely on “WebView cache of a previous online visit.”

---

## 9. Window, icons, app name, identifier

| Item | Recommendation |
|------|----------------|
| Display name | **SCALC** |
| Bundle / exe | `SCALC.exe` (NSIS) |
| Identifier | `com.ianleiman.scalc` |
| Title bar | `SCALC` — same as current document title. Optional later: `SCALC — Planner` from vue-router; not required for v1. |
| Size | Start **1024 × 768**. Blender/planner canvases are **600×310** and **600×200**; tables are wide. `minWidth: 800`, `minHeight: 600`, `resizable: true`. Do not restore iframe `height: 1000px`. |
| Maximize | Allowed. |
| Decorations | Native OS chrome (default). |
| Theme | Unspecified; keep Vue CSS (`#2F2556` tab bar from `tabs.css`). |
| Icons | **Repo has no favicon** (README short-term todo). `scalc-planner.jpg` is referenced from GitHub README, not shipped in this tree as an app icon. Generate a simple icon set with `npm run tauri icon path/to/source.png` once a 1024² PNG exists. Placeholder is OK for first `tauri dev`; replace before public installer. |
| File associations | None (no `.plan` files). |

GPL: keep LICENSE in the installer (NSIS license page) and About view. Desktop does not change the scuba disclaimers.

---

## 10. How this relates to the web / GitHub Pages version

**One Vue codebase, two targets.**

```text
                    web/src  (Vue + lib engines)
                         |
          +--------------+--------------+
          |                             |
   Vite `base: './'`              Vite `base: './'`
   npm run build                  npm run build
          |                             |
     web/dist  ──copy/CI──►     web/dist
     GitHub Pages                 src-tauri frontendDist
     Apache DocumentRoot          tauri build → NSIS
     python3 -m http.server
```

| Concern | Web | Desktop |
|---------|-----|---------|
| Router | Hash mode default (`/#/planner`) for Pages without `404.html`; history OK if Apache `FallbackResource` | Hash **or** history both work on `tauri://` / `https://tauri.localhost`; **keep hash** so you do not maintain two router builds |
| `base` | `'./'` | `'./'` |
| Pinia | No | No |
| `alert()` | Browser | WebView (OK) |
| CSV download | Blob | Blob (verify WebView2) |
| About links | New browser tab | See §7 |
| Version sniff in `about.html` | Dropped in Vue | Dropped |

Do **not** fork `ModView.vue` into a Tauri-specific copy. Detect desktop only if you must (`import.meta.env.TAURI_ENV_PLATFORM` or user-agent) — v1 should need **zero** `if (tauri)` branches.

GitHub Action that publishes `web/dist` to Pages stays independent of `tauri build` (Rust in CI is optional; Windows installer can be a manual or tagged job).

---

## 11. Packaging

### Windows (primary — this user’s OS)

| Artifact | Use |
|----------|-----|
| **NSIS** `.exe` installer | Default. Matches README “Windows installer.” |
| MSI | Optional for org deployment; not required for v1. |
| Portable `.exe` | Optional; NSIS is enough. |

`bundle.windows.webviewInstallMode`: prefer `embedBootstrapper` or `downloadBootstrapper` so a machine **without** WebView2 can still install. Document: “Windows 10 1809+ / Windows 11.”

Signing: not in-repo. Unsigned installs will SmartScreen-warn; call that out in README when you ship. Do not commit certificates.

Installer metadata: GPL-3 license file, publisher **Ian Leiman**, URL `https://github.com/eianlei/scalc`.

### macOS / Linux (reasonable but second)

Only after Windows `tauri build` is green.

- **macOS:** `.dmg` / `.app`. Apple WebKit. Notarization is a later product decision.
- **Linux:** `.deb` and/or AppImage. Needs WebKitGTK 4.1. Not the README’s stated installer goal.

Cross-compiling macOS from Windows is not supported in practice. Linux `.deb` from Windows is painful. Plan: **build Windows on this PC**; macOS/Linux on those OSes or CI runners.

Android/iOS: README Cordova item is **not** this plan. Tauri 2 mobile is a different project.

---

## 12. Dev workflow (`tauri dev` + Vite)

Two processes, one window:

1. `beforeDevCommand` starts Vite in `web/` (HMR).
2. Tauri opens a native window pointed at `devUrl`.

```text
cd web
npm run tauri:dev
```

Rules:

- Do **not** use `python3 -m http.server` for Tauri. That server is the **vanilla/web** workflow.
- Do **not** point `devUrl` at `http://127.0.0.1:8000` (repo-root iframes).
- Vite `strictPort: true` so Tauri does not attach to a random port.
- Ignore `src-tauri` in Vite watch.
- Rust changes restart the shell; Vue changes HMR inside the webview.
- If HMR fails in WebView2, hard-reload the window; do not “fix” it by embedding iframes.

Debug: WebView2 allows DevTools in debug builds. Use them to confirm **no CDN**. Keep `LOG_*` in `calculate_plan.js` gated with `import.meta.env.DEV` as the Vue plan already says.

---

## 13. Build / release workflow

### Local Windows release

```text
cd web
npm ci
npm run test
npm run tauri:build
```

`beforeBuildCommand` runs `vite build` → `web/dist`. Output typically:

`src-tauri/target/release/bundle/nsis/SCALC_*_x64-setup.exe`

Smoke the installer on a second Windows user profile if possible.

### Versioning

- Bump `web/package.json` and `src-tauri/tauri.conf.json` `version` together (or generate conf from package.json when you add tooling).
- Git tag `vX.Y.Z`.
- GitHub Release: attach NSIS exe; Pages still serves the web app from the same tag’s `web/dist` if you already automated Pages.

### CI (optional later)

- Job A: `web` — `npm test` + `npm run build` (Pages).
- Job B: Windows runner — `tauri build` (needs Rust + WebView2 + NSIS). Do not block Pages deploy on Rust.

---

## 14. Security

SCALC processes **no secrets** and **no user accounts**, but it is still a native app loading HTML.

| Control | What to do |
|---------|------------|
| Unused APIs | Empty command list; no plugins in v1 (§7). |
| IPC | Do not `invoke('calculate')`. Math stays in JS. |
| CSP | Set `app.security.csp` in `tauri.conf.json`. Allow `'self'` for scripts/styles/fonts/img/connect. **Disallow** `https://code.jquery.com`, `fonts.googleapis.com`, `fonts.gstatic.com`, `http:`. Avoid `unsafe-eval`. Vue/Vite production hashes do not need `unsafe-inline` for scripts; if style CSP fights Vue scoped CSS, prefer hashing/`'self'` over opening the world. |
| `dangerousDisableAssetCspModification` | Leave **false**. |
| Dev vs prod | `tauri dev` may be looser; **release CSP must fail** if a CDN slips back in. |
| `withGlobalTauri` | Prefer **false**. No `window.__TAURI__` unless you add API usage. |
| External nav | Restrict or use opener allowlist (§7). Do not `shell.open` arbitrary strings from planner text output. |
| `innerHTML` | Vue plan already drops planner table `innerHTML`; keep it that way in the webview. |
| Downloads | CSV is user-initiated; do not grant recursive `fs:allow-write`. |

Freeze Rust/npm lockfiles (`Cargo.lock`, `package-lock.json`).

---

## 15. Risks

| Risk | Why it is real here | Mitigation |
|------|---------------------|------------|
| **Vue not done** | Vanilla iframes + jQuery CDN cannot be a secure offline desktop app | Gate on convert2vue Phase 7 |
| **Google Fonts / jQuery** | Explicit network deps in current CSS/HTML | Bundle fonts; no jQuery |
| **WebView2 missing or old** | Tauri 2 on Windows **is** Edge WebView2, not Chromium | Bootstrapper in NSIS; document Win10/11 |
| **WebView2 vs Chrome canvas** | Planner/blender use 2D canvas overlay (`profileCanvas_txt`, `bProfCanvas`) | Manual check of both canvases + mousemove readout after `tauri dev` |
| **Blob CSV download** | `table_save2csv` never used a file dialog | Test in WebView2; add `dialog`+`fs` only if broken |
| **`frontendDist` path** | `src-tauri` is sibling of `web/`, not of `src/` | `../web/dist`; fail the build if `index.html` missing |
| **Wrong `devUrl`** | Easy to point at python `:8000` vanilla shell | Config review in Phase 2 checklist |
| **Dual web + desktop** | `base` `/scalc/` would 404 in Tauri | `base: './'` only |
| **Hash vs history** | Pages needs hash or `404.html` | One hash router for both targets |
| **Capability creep** | `tauri init` templates enable extras | Audit `capabilities/default.json` |
| **SmartScreen / unsigned exe** | Personal GPL project | Document warning; optional later signing |
| **GPL + bundled WebView2** | App is GPL-3 | Keep LICENSE in installer; do not relicense engines |
| **Identifier mismatch** | Domain is ianleiman.com, repo eianlei/scalc | Stick to `com.ianleiman.scalc` |
| **No icon asset** | No `favicon.ico` in tree | Create PNG before public NSIS |
| **Planner `alert()`** | Vue plan allows keeping `alert` | Works in WebView; do not replace with Tauri dialogs in v1 |
| **Mixing iframe shell** | convert2vue Phase 3 temptation | Explicitly forbidden (§2) |

---

## 16. Phased checklist

**8 phases (0–7).** Phase 0 is a gate, not Tauri work.

### Phase 0 — Gate on Vue conversion

- [ ] `PLANS/convert2vue.md` Phase 7 done: SPA is the only UI; `source/*.html` iframes gone or archived.
- [ ] No jQuery in `web/`.
- [ ] Fonts are local or system; no `fonts.googleapis.com`.
- [ ] `web` Vitest fixtures pass (MOD 56.7, blender pp/IDG, planner defaults).
- [ ] `npm run build` → `web/dist` served by `python3 -m http.server` still works for Pages/Apache.

**Stop here if any box is unchecked.**

### Phase 1 — Toolchain and `src-tauri` scaffold

- [ ] Install Rust stable, MSVC Build Tools, WebView2.
- [ ] From `web/`: add `@tauri-apps/cli@^2` (Tauri **2**, not 1).
- [ ] `npm run tauri init` (or equivalent) with:
  - identifier `com.ianleiman.scalc`
  - frontend `../web/dist`
  - dev server matching Vite
- [ ] Confirm `src-tauri/` at **repo root**, not inside Pages publish dir.
- [ ] Gitignore `src-tauri/target`, `web/dist`, `node_modules`.
- [ ] Do not generate Tauri commands for dive math.

### Phase 2 — Integrate Vue / Vite

- [ ] `beforeDevCommand` / `beforeBuildCommand` `cwd` = `web`.
- [ ] Vite `strictPort` + ignore `src-tauri`.
- [ ] `base: './'` unchanged.
- [ ] `npm run tauri:dev` opens SCALC; tabs ABOUT / MOD / Blender / Planner match Vue routes (`/#/mod`, `/#/blender`, `/#/planner`, nested cost/sources/table).
- [ ] DevTools: Vue app, **not** `source/planner.html`.
- [ ] `npm run tauri:build` completes and runs the exe from `target/release`.

### Phase 3 — Window, icons, capabilities, CSP

- [ ] Window 1024×768, min 800×600, title `SCALC`.
- [ ] Trim `capabilities/default.json` to window core only.
- [ ] No fs/http/shell plugins.
- [ ] CSP blocks CDNs (§14).
- [ ] `withGlobalTauri` false.
- [ ] Icon PNG → `tauri icon` (placeholder acceptable internally).
- [ ] About still shows GPL text.

### Phase 4 — Dual-target and offline

- [ ] Airplane mode (or disable NIC): built exe runs all four tools.
- [ ] Same `web/dist` still usable via `python3 -m http.server` and (after deploy) GitHub Pages.
- [ ] No Tauri-only Vue forks.
- [ ] Document in README: `npm run dev` = web; `npm run tauri:dev` = desktop.

### Phase 5 — Windows packaging

- [ ] NSIS installer: name SCALC, license GPL-3, WebView2 bootstrapper policy set.
- [ ] Install → Start Menu / desktop shortcut → app launches.
- [ ] Uninstall removes the app.
- [ ] CSV download from Planner table produces `planner_table.csv` (EU `;` format unchanged).
- [ ] Unsigned SmartScreen note in README.

### Phase 6 — Optional macOS / Linux

- [ ] Only after Phase 5.
- [ ] Build on those OSes or CI; do not block Windows release.
- [ ] Same `frontendDist` and capabilities.

### Phase 7 — Verification (implementer)

**Web (regression):** GitHub Pages / Apache path still serves Vue `dist`.

**Desktop — every tool (not a screenshot-only check):**

- [ ] About: copy, GitHub link behavior, license.
- [ ] MOD: O2 slider/select, ppO2, result **56.7** at 21% / 1.4; other gases.
- [ ] Blender: fill types `air`/`nx`/`tmx`/`pp`/`cfm`; `top` still disabled; IDG vs VdW1 vs VdW2; EMPTY; Cost; Sources; fill-profile canvas not blank; ERROR path if `status_code != 0`.
- [ ] Planner: depth/time/GF/tanks; canvas + mouse readout; table; CSV; O2/He validation alerts.
- [ ] Routes: `/#/blender/cost`, `/#/planner/table`.
- [ ] Resize/maximize does not clip the 600px canvases beyond what Vue already does in a browser.
- [ ] With network disabled, no console errors for missing scripts/fonts.

---

## 17. Implementation notes (for the future implementer)

1. **Order of work:** Vue cutover → Tauri scaffold → capabilities/CSP → NSIS. Never “quick Electron/Tauri around `index.html`.”
2. **Canonical math** remains `web/src/lib/**` as extracted from `source/`. Desktop must not duplicate `runPlan()` in Rust.
3. **CSV** is EU format (semicolon, comma decimals) per current `createTableCSV`. Do not “fix” that in the installer effort.
4. **`calcHeight()`** dies with iframes; native window scrolling is Vue’s layout problem, not Tauri’s.
5. **Identifier** `com.ianleiman.scalc` should not change after the first signed/unsigned public install (Windows treats it as the app identity).
6. If you later persist blender prices, that is a **Vue** `localStorage` (or Pinia) feature first; Tauri `fs` is still unnecessary.
7. If Blob download fails in WebView2, the smallest fix is the **dialog** plugin to pick a path plus **fs write** for that one CSV file — not a general document manager.
8. Update README “long term: Electron” to “desktop: Tauri 2 (see `PLANS/tauri_desktop.md`)” **when implementing**, not in this planning-only change.

---

## 18. Summary

SCALC is a **static, browser-only** dive/gas calculator. After Vue 3 + Vite lives in `web/` with **no CDN**, Tauri 2 should add `src-tauri/` at the repo root, load that SPA in a WebView2 window, grant **almost no capabilities**, and ship an **NSIS installer** for Windows. GitHub Pages stays the same Vue `dist`. Do not reimplement math, do not add a backend, and do not wrap the vanilla iframe/jQuery shell.
