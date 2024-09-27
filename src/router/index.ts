// Creating the router instance

import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import Tabs from '../components/Tabs.vue';
// import Login from '../views/Login.vue';
// import Signup from '../views/SIgnup.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    component: () => import ('@/views/Login.vue')
  },
  {
    path: '/signup',
    component: () => import ('@/views/SIgnup.vue')
  },
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
        redirect: '/Home',
      },
      // {
      //   path: 'login',
      //   component: () => import('../views/Login.vue'),
      // },
      {
        path: 'camera',
        component: () => import('../views/CameraCapture.vue'),
      },
      {
        path: 'login',
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