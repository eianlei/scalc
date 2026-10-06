import { createRouter, createWebHashHistory } from 'vue-router'
import LegacyIframeView from '@/views/LegacyIframeView.vue'

export const routes = [
  { path: '/', redirect: '/about' },
  {
    path: '/about',
    name: 'about',
    component: LegacyIframeView,
    meta: { iframe: 'source/about.html', title: 'about' },
  },
  {
    path: '/mod',
    name: 'mod',
    component: LegacyIframeView,
    meta: { iframe: 'source/mod.html', title: 'mod' },
  },
  {
    path: '/blender/:panel?',
    name: 'blender',
    component: LegacyIframeView,
    meta: { iframe: 'source/blender.html', title: 'blender' },
  },
  {
    path: '/planner/:panel?',
    name: 'planner',
    component: LegacyIframeView,
    meta: { iframe: 'source/planner.html', title: 'planner' },
  },
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
