// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const routes = [
  {
    path: '/login',
    name: 'Login',
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
    component: () => import('@/views/DashboardView.vue'),
    meta: {
      requiresAuth: true, // 需要登录
    },
  },
  {
    path: '/diagrams/:id',
    name: 'Editor',
    component: () => import('@/views/EditorView.vue'),
    meta: {
      requiresAuth: true, // 需要登录
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// --- 全局前置守卫 (Navigation Guard) ---
router.beforeEach(async (to, _, next) => {
  const authStore = useAuthStore();

  // [判断依据]: 从 LocalStorage 读取当前是否处于离线演示模式
  // 这个标记由 Login 页面在点击“离线登录”时写入
  const isOffline = localStorage.getItem('isOffline') === 'true';

  // =========================================================
  // 场景 A: 访问受保护的页面 (如 Dashboard, Editor)
  // =========================================================
  if (to.meta.requiresAuth) {
    // 1. 检查 Token 是否存在
    // (无论是离线还是在线，Login 页面都会负责存入一个 Token)
    if (authStore.token) {
      // 2. 检查内存中是否有用户信息
      // 如果页面刚刚刷新，Pinia 中的 currentUser 会变成 null，需要重新恢复
      if (!authStore.isAuthenticated) {
        // --- 分支路口: 决定如何恢复用户信息 ---

        if (isOffline) {
          // =================================================
          // [🔴 离线模式分支]
          // =================================================
          // 逻辑: 不发网络请求，直接在内存中构造一个符合 User 类型的假用户。
          // 目的: 骗过 authStore.isAuthenticated 的校验，防止组件因数据缺失报错。
          authStore.currentUser = {
            id: -1,
            username: 'OfflineUser',
          };
          console.log('🚀 [Router] 离线模式: 已跳过后端验证，注入模拟用户。');
        } else {
          // =================================================
          // [🟢 后端模式分支]
          // =================================================
          // 逻辑: 发起真实的 Axios 请求 (GET /users/me)。
          // 目的: 验证 Token 有效性并获取真实用户数据。
          try {
            await authStore.fetchUser();
          } catch (error) {
            console.error('❌ [Router] 后端模式: Token 无效或服务不可用', error);
            // 验证失败，通常意味着 Token 过期，这里可以选择清除 Token
            // authStore.logout();
          }
        }
      }

      // 3. 最终放行检查
      // 无论走哪条分支，只要 currentUser 成功被赋值，isAuthenticated 就会为 true
      if (authStore.isAuthenticated) {
        next(); // ✅ 放行：进入页面
      } else {
        next({ name: 'Login' }); // ⛔ 拦截：认证恢复失败，踢回登录页
      }
    } else {
      // 没有 Token，直接踢回登录页
      next({ name: 'Login' });
    }

    // =========================================================
    // 场景 B: 访问公开页面 (如 Login, Register)
    // =========================================================
  } else {
    next(); // ✅ 放行
  }
});

export default router;
