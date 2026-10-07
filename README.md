# scalc
**scalc** is a Web and desktop calculation tool for interactive calculations needed for planning technical scuba dives.

[You can open the application here at GitHub pages by clicking this line](https://eianlei.github.io/scalc/index.html)

![mainwin-shorturl](https://github.com/eianlei/scalc/blob/master/scalc-planner.jpg?raw=true)


SCALC has been in development since 2012.
- the early 2012 version was implemented in plain HTML, CSS and vanilla Javascript
- 2026 a refactored version was done using the [Vue 3](https://vuejs.org/) framework
- 2026 a desktop version using [Tauri v2](https://v2.tauri.app/)

The calculation tools include:
- MOD calculation
- gas blending using several algortihms 
- dive planner using Buhlmann model with Gradient Factors

# scalc at scalc.ianleiman.com
There is a working sample of the tool running at: https://scalc.ianleiman.com/

This sample may not be as up to date as the github.io instance that syncs directly from this repo: https://eianlei.github.io/scalc/index.html

# Installing and using the 2026 Vue version for web

The 2026 web UI is a **Vue 3** single-page app built with **Vite**. It lives in `web/scalc-vue/` (not at `web/` itself — there is no `package.json` in `web/`). The original vanilla site (`index.html`, `source/`) remains at the **repository root** and is still served as-is during migration; the Vue app is being developed alongside it per `PLANS/convert2vue.md`.

Stack: Vue 3, JavaScript (no TypeScript), Vue Router, Vitest, ESLint, and Prettier. No Pinia or end-to-end test suite in the initial scaffold.

## Prerequisites

Install a current **Node.js** and **npm**. The Vue project expects Node `^22.18.0` or `>=24.12.0` (see `engines` in `web/scalc-vue/package.json`).

## Building from source

Clone this repository, then work inside the Vue app directory:

```shell
cd web/scalc-vue
```

### First-time setup

```shell
npm install
```

On Windows, `npm install` may fail on Vitest peer-dependency conflicts. If so, run:

```shell
npm install --legacy-peer-deps
```

### Development server

```shell
npm run dev
```

Open http://localhost:5173/ in your browser. Vite serves the Vue app with hot reload.

### Production build

```shell
npm run build
```

Output is written to `web/scalc-vue/dist/`. To preview the built files locally:

```shell
npm run preview
```

### Other npm scripts

- `npm run test:unit` — Vitest unit tests (calculation engines and Vue components)
- `npm run lint` — ESLint and oxlint
- `npm run format` — Prettier on `src/`

## Distribution builds

For static hosting (GitHub Pages, Apache, nginx), deploy the contents of `web/scalc-vue/dist/` after `npm run build`. The build copies the legacy `source/` tree and `index.css` into `dist/` so any remaining iframe-based tools still work until the Vue migration is complete.

The legacy vanilla app at the repo root is unchanged: you can still run `python3 -m http.server` from the repository root and open http://127.0.0.1:8000/ to use the original site. Use the Vue dev server or a `dist/` deployment when you want the new UI.


# Installing and using the 2026 Vue version for desktop

To be done once implemented

# Installing and using the legacy vanilla version
The code for the legacy version still exists but is no longer maintained.
It is advised to use the newer Vue based version.

## Installation
This is a web application so it needs to be served by a web server to a web browser. You can either install it to a "real" web server (such Apache, nginx) or use some local development solution such as VS Code Live Server extension.


### web server
Just copy all the files in source folder to a web site server root. 
Or git clone this repo to the server.
The web server will serve index.html, which will call out all the modules. 
Usually a web browser will cache the entire application as it so small. 

### example how to clone the app on linux server and make apache virtual server
Assuming you have a standard linux server and apache is installed and running, and you use certbot for SSL.
```shell
ssh yoursever
cd /var/www
sudo mkdir scalc
sudo chown www-data:www-data scalc
sudo git clone https://github.com/eianlei/scalc.git
cd scalc
ls -l
# check that you have all you need
cd /etc/apache2/sites-available
nano scalc.yourdomain.conf
# edit the virtual host file, save and exit
# see example below
sudo a2ensite scalc.yourdomain.conf
sudo systemctl restart apache2
# http://scalc.yourdomain
# now get SSL cert using certbot
sudo certbot --apache
# https://scalc.yourdomain
```
### example virtual host file 
scalc.yourdomain.conf
```
UseCanonicalName On
<VirtualHost *:80>
        ServerAdmin you@yourdomain
        ServerName scalc.yourdomain
        DocumentRoot /var/www/scalc
        <Directory /var/www/scalc/>
            Options Indexes FollowSymLinks MultiViews
            AllowOverride All
            Require all granted
        </Directory>
        ErrorLog ${APACHE_LOG_DIR}/error.log
        CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
```

## VS code & Live Server
If you have Visual Studio Code installed, then it is really easy to run any web app using the Live Server extension.

In Visual Studio Code clone this repository.
Install "Live Server" extension. Now you can launch the app from editor to your browser using a local server with live reload.

## use python built-in development server
If you have git and python3 installed, you can clone this application and use python built-in web server.
To git clone and start a webserver using Python run the commands below:
```
cd some_directory
git clone https://github.com/eianlei/scalc.git
cd scalc
python3 -m http.server
```
That will open a webserver on port 8000. You can then open your browser at http://127.0.0.1:8000/.

After the app has loaded on your browser you can actually kill the web server (Ctrl-C) beacause it is now running on your browser and no longer needs a server.

## Technology
**scalc** is made from plain vanilla HTML, CSS, Javascript and does not use any fancy JS frameworks (such as Angular, React, Vue, Svelte etc...).
The UI uses plain HTML5 elements and canvas.
Calculations are done by pure and simple Javascript functions running on your browser. There is no back-end, nothing is calculated at the server end.
## dependencies
None. The UI is vanilla HTML, CSS, and JavaScript.

# Background
The Javascript used in calculations is refactored (manually transpiled) from following Python and C# projects that I have published previously:
- https://github.com/eianlei/pydplan 
- https://github.com/eianlei/FillCalcWin 
 

The UI is a web (HTML5, CSS, JS) implementation of the respective GUIs done previously in Qt5 or WPF/.NET 4.8/XAML.

# Target users
The application is intended for certified technical divers and [Trimix](https://en.wikipedia.org/wiki/Trimix_(breathing_gas)) gas blenders, who [blend gases](https://en.wikipedia.org/wiki/Gas_blending_for_scuba_diving) and make plans for [technical scuba diving](https://en.wikipedia.org/wiki/Technical_diving).

It is assumed that anyone daring to use this application knows what they are doing.

# Disclaimers
Use this application at your own risk, the author provides no guarantees about the correctness of the application, and assumes no liability for the use of it for any purpose!

* In no event should you consider blending breathing gases without proper training!
* In no event should you consider scuba diving with mixed gases without proper training!
* Ignoring these warnings can cause your **death** or **serious and permanent injuries**!

# Development history & roadmap
- 2021-11-03 published to github a quickly hacked up demo, that needs lot of TLC
- 2021-11-08 added the dive planner prototype
- 2021-11-12 most of essential functionality in place
- 2021-11-21 big cleaning up & refactoring of very messy code in planner 
- 2021-11-23 implemented Van Der Waals gas law calculation to blender
- 2026-10-06 removed jQuery with vanilla Javascipt DOM API

## todo short term:
- some cleanup, proper structuring and commentting to the sources
- make UI mobile friendly (CSS)
- do a proper favicon
- add user documentation
- to Blender: bring up all the same functionality that exists in [FillCalcWin](https://github.com/eianlei/FillCalcWin)
  - new feature: use gas temperatures in calculations 
- Planner implementation, 
  - Bühlmann: have manually transpiled Python code to Javascript from [pydplan](https://github.com/eianlei/pydplan), 
  but the code still need some fine tuning
  - improvements on graphical web UI

## long term plans:
Updated 2026

- convert plain vanilla frontend code to Vue 3
- desktop version will run on [Tauri v2](https://v2.tauri.app/) and include Windows installer
- Android and iOS mobile versions using [Tauri v2](https://v2.tauri.app/)

# License
Copyright (C) 2026 Ian Leiman

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, version 3 of the License.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
    
See https://www.gnu.org/licenses/gpl-3.0.html</a>.

  
