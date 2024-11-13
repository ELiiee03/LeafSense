import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import Tabs from '@/components/Tabs.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home',
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
        path: 'home',
        component: () => import('../views/HomePage.vue'),
      },
      {
        path: 'radio',
        component: () => import('../views/Preview.vue'),
      },
      {
        path: 'logs',
        component: () => import('../views/Logs.vue'),
      },
      {
        path: 'geo',
        component: () => import('../views/SIgnup.vue'),
      },
    ],
  },
  {
    path: '/signup',
    component: () => import('../views/SIgnup.vue'),
  },
  {
    path: '/preview',
    component: () => import('../views/Preview.vue'),
  },
  {
    path: '/login',
    component: () => import('../views/Login.vue'),
  },
];

const router = createRouter({
  // Use: createWebHistory(process.env.BASE_URL) in your app
  history: createWebHistory(),
  routes,
});

export default router;