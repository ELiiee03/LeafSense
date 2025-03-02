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
        component: () => import('@/views/HomePage.vue'),
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
        path: 'pins',
        component: () => import('../views/Pins.vue'),
      },
    ],
  },
  {
    path: '/signup',
    name: 'signup',
    component: () => import('../views/SIgnup.vue'),
  },
  {
    path: '/preview',
    component: () => import('../views/Preview.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login.vue'),
  },
  {
    path: '/leafinfo',
    name: 'leafinfo',
    component: () => import('../views/LeafInfoPage.vue'),
    props: true,
  },
  {
    path: '/homecontent',
    name: 'homecontent',
    component: () => import('../components/HomeContent.vue'),
  },
  {
    path: '/modal',
    name: 'modal',
    component: () => import('../components/ModalSheet.vue'),
  }
];

const router = createRouter({
  // Use: createWebHistory(process.env.BASE_URL) in your app
  history: createWebHistory(),
  routes,
});

export default router;