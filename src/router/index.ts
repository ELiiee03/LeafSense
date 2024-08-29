// Creating the router instance

import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import Tabs from '../components/Tabs.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '',
    redirect: '/folder/Home'
  },
  {
    path: '/folder/:id',
    component: () => import ('../components/Tabs.vue')
  },
  {
    path: '/',
    component: Tabs,
    children: [
      {
        path: '',
        redirect: '/home',
      },
      {
        path: 'signup',
        component: () => import('../views/SIgnup.vue'),
      },
      {
        path: 'camera',
        component: () => import('../views/CameraCapture.vue'),
      },
      {
        path: 'library',
        component: () => import('../views/Login.vue'),
      },
      {
        path: 'search',
        component: () => import('../views/FolderPage.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router