import { createRouter, createWebHashHistory } from 'vue-router'
import AboutView from '@/views/AboutView.vue'
import ModView from '@/views/ModView.vue'
import LegacyIframeView from '@/views/LegacyIframeView.vue'

export const routes = [
  { path: '/', redirect: '/about' },
  {
    path: '/about',
    name: 'about',
    component: AboutView,
  },
  {
    path: '/mod',
    name: 'mod',
    component: ModView,
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
