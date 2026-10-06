import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

const repoRoot = fileURLToPath(new URL('../..', import.meta.url))
const distDir = fileURLToPath(new URL('./dist', import.meta.url))

function isInside(root, candidate) {
  const rel = path.relative(root, candidate)
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))
}

/** Serve / copy vanilla `source/` + `index.css` so strangler iframes work. */
function vanillaLegacyPlugin() {
  const mime = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
  }

  return {
    name: 'vanilla-legacy',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const urlPath = (req.url || '').split('?')[0]
        let file
        if (urlPath === '/index.css') {
          file = path.join(repoRoot, 'index.css')
        } else if (urlPath.startsWith('/source/')) {
          file = path.join(repoRoot, urlPath.slice(1))
        } else {
          return next()
        }
        const resolved = path.resolve(file)
        if (!isInside(repoRoot, resolved) || !fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
          return next()
        }
        const type = mime[path.extname(resolved)] || 'application/octet-stream'
        res.setHeader('Content-Type', type)
        fs.createReadStream(resolved).pipe(res)
      })
    },
    writeBundle() {
      const sourceDest = path.join(distDir, 'source')
      fs.cpSync(path.join(repoRoot, 'source'), sourceDest, { recursive: true })
      fs.copyFileSync(path.join(repoRoot, 'index.css'), path.join(distDir, 'index.css'))
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    vueJsx(),
    ...(process.env.VITEST ? [] : [vueDevTools()]),
    vanillaLegacyPlugin(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
