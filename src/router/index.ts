import { createRouter, createWebHistory } from 'vue-router';
import { useAppStore } from '@/store/appStore';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/MainView.vue'),
    },
    {
      path: '/app/:id',
      name: 'chat',
      component: () => import('@/views/MainView.vue'),
    }
  ],
});

// Since the whole app is inside App.vue and managed by Pinia, 
// we use the router mainly to sync the URL state.
router.beforeEach((to, from, next) => {
  next();
});

export default router;
