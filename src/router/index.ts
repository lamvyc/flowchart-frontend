// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const routes = [
  {
    path: '/login',
    name: 'Login',
    // 稍后我们会创建这个视图组件
    component: () => import('@/views/LoginView.vue'),
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/RegisterView.vue'),
  },
  {
    path: '/',
    name: 'Dashboard',
    // 稍后我们会创建这个视图组件
    component: () => import('@/views/DashboardView.vue'),
    meta: {
      requiresAuth: true, // ✨ 添加元信息，表示这个路由需要认证
    },
  },
  // 在这里可以添加其他路由，比如 /register
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// --- 全局前置守卫 (Navigation Guard) ---
router.beforeEach(async (to, _, next) => {
  const authStore = useAuthStore();

  // 1. 检查路由是否需要认证
  if (to.meta.requiresAuth) {
    // 2. 检查用户是否已认证 (token 是否存在)
    // 如果 store 中还没有用户信息，但有 token，尝试获取一次
    if (authStore.token && !authStore.isAuthenticated) {
      await authStore.fetchUser();
    }

    // 3. 再次检查认证状态
    if (authStore.isAuthenticated) {
      // 如果已认证，则放行
      next();
    } else {
      // 如果未认证，则重定向到登录页
      next({ name: 'Login' });
    }
  } else {
    // 如果路由不需要认证，则直接放行
    next();
  }
});

export default router;
