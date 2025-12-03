// src/store/auth.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { login as apiLogin, getMe as apiGetMe } from '@/api/auth';
import type { User } from '@/api/auth';

// 定义 store
// 第一个参数是 store 的唯一 ID
export const useAuthStore = defineStore('auth', () => {
  // --- state ---
  // 使用 ref 定义 state 属性
  const token = ref(localStorage.getItem('token') || '');
  const currentUser = ref<User | null>(null);

  // --- getters ---
  // 使用 computed 定义 getters
  const isAuthenticated = computed(() => !!token.value && !!currentUser.value);

  // --- actions ---
  /**
   * 设置 Token
   */
  function setToken(newToken: string) {
    token.value = newToken;
    localStorage.setItem('token', newToken);
  }

  /**
   * 登录 Action
   */
  async function login(loginData: FormData) {
    // 1. 调用登录 API
    const response = await apiLogin(loginData);
    if (response.access_token) {
      // 2. 登录成功，设置 token
      setToken(response.access_token);
      // 3. 获取用户信息
      await fetchUser();
    }
  }

  /**
   * 获取当前用户信息 Action
   */
  async function fetchUser() {
    if (token.value) {
      try {
        const user = await apiGetMe();
        currentUser.value = user;
      } catch (error) {
        // 如果获取失败（例如 token 过期），则清空状态
        console.error('获取用户信息失败:', error);
        await logout();
      }
    }
  }

  /**
   * 登出 Action
   */
  async function logout() {
    token.value = '';
    currentUser.value = null;
    localStorage.removeItem('token');
    // 在这里重定向到登录页
    // 注意：在 store 中直接操作 router 不方便，我们将在路由守卫中处理重定向
  }

  // 返回 state, getters, 和 actions
  return {
    token,
    currentUser,
    isAuthenticated,
    login,
    logout,
    fetchUser,
    setToken,
  };
});
