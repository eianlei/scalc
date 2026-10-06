import { createRouter, createWebHashHistory } from 'vue-router'
import AboutView from '@/views/AboutView.vue'
import ModView from '@/views/ModView.vue'
import BlenderView from '@/views/blender/BlenderView.vue'
import BlenderMain from '@/views/blender/BlenderMain.vue'
import BlenderCost from '@/views/blender/BlenderCost.vue'
import BlenderSources from '@/views/blender/BlenderSources.vue'
import PlannerView from '@/views/planner/PlannerView.vue'
import PlannerMain from '@/views/planner/PlannerMain.vue'
import PlannerTable from '@/views/planner/PlannerTable.vue'

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
    path: '/blender',
    component: BlenderView,
    children: [
      { path: '', name: 'blender', component: BlenderMain },
      { path: 'cost', name: 'blender-cost', component: BlenderCost },
      { path: 'sources', name: 'blender-sources', component: BlenderSources },
    ],
  },
  {
    path: '/planner',
    component: PlannerView,
    children: [
      { path: '', name: 'planner', component: PlannerMain },
      { path: 'table', name: 'planner-table', component: PlannerTable },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
