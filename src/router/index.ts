// Creating the router instance

import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import Tabs from '../components/Tabs.vue';


const routes: Array<RouteRecordRaw> = [
  {
    path: '/preview',
    component: () => import ('@/views/Preview.vue')
  },
  {
    path: '/login',
    component: () => import ('@/views/Login.vue')
  },
  {
    path: '/logcomponent',
    component: () => import ('@/components/LogsComponent.vue')
  },
  // {
  //   path: '/signup',
  //   component: () => import ('@/views/SIgnup.vue')
  // },
  // {
  //   path: '/logs',
  //   component: () => import ('@/views/Logs.vue')
  // },
  {
    path: '/leafinfo',
    component: () => import ('@/components/LeafInfoModal.vue')
  },
  {
    path: '/',
    redirect: '/home' // Redirect to /home when no path is provided
  },
  {
    path: '/home',
    component: Tabs, // Show Tabs.vue on the /home route
    children: [
      {
        path: '',
        redirect: '/home/home', // Default tab for the home route (can be adjusted)
      },
      {
        path: 'home',
        component: () => import('@/views/CameraCapture.vue'), // Camera tab
      },
      {
        path: 'logs',
        component: () => import('@/views/Logs.vue'), // Search tab
      },
      {
        path: 'signup',
        component: () => import('@/views/SIgnup.vue'), // Folder tab
      },
    ],
  },
  
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  // history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router