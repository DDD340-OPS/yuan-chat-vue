import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue')
  },
  {
    path: '/workbench',
    name: 'workbench',
    component: () => import('../views/WorkbenchView.vue')
  },
  {
    path: '/archive',
    name: 'archive',
    component: () => import('../views/ArchiveView.vue')
  },
  {
    path: '/system',
    name: 'system',
    component: () => import('../views/SystemView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
