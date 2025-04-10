import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import Tabs from '@/components/Tabs.vue';
import { supabase } from '@/supabaseClient';

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
        meta: { requiresAuth: true }
      },
      {
        path: 'radio',
        component: () => import('../views/Preview.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'logs',
        component: () => import('../views/Logs.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'pins',
        component: () => import('../views/Pins.vue'),
        meta: { requiresAuth: true }
      },
    ],
  },

  {
    path: '/auth-callback',
    name: 'AuthCallback',
    component: () => import('@/views/AuthCallback.vue'),
  },

  {
    path: '/verify-email',
    name: 'VerifyEmail',
    component: () => import('@/views/VerifyEmail.vue'),
  },

  {
    path: '/signup',
    name: 'signup',
    component: () => import('../views/SIgnup.vue'),
  },
  {
    path: '/preview',
    name: 'preview',
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
    meta: { requiresAuth: true }
  },
  {
    path: '/homecontent',
    name: 'homecontent',
    component: () => import('../components/HomeContent.vue'),
    meta: { requiresAuth: true }
  },
  // {
  //   path: '/modal',
  //   name: 'modal',
  //   component: () => import('../components/ModalSheet.vue'),
  // }
];

const router = createRouter({
  // Use: createWebHistory(process.env.BASE_URL) in your app
  history: createWebHistory(),
  routes,
});

// Route guard for authenticated routes
router.beforeEach(async (to, from, next) => {
  // Check if route requires auth
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  
  // If route doesn't require auth, allow access
  if (!requiresAuth) {
    return next();
  }
  
  // Get current session
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Auth check error:', error);
    return next({ path: '/login', query: { redirect: to.fullPath } });
  }
  
  if (session) {
    // User is authenticated, allow access
    return next();
  } else {
    // Not authenticated, redirect to login with the intended destination
    return next({ path: '/login', query: { redirect: to.fullPath } });
  }
});

export default router;