// src/api/request.ts
import axios from 'axios';
import { message } from 'ant-design-vue';
// 我们将在下一步创建这个 authStore，现在先引入，让代码结构完整
import { useAuthStore } from '@/store/auth';

const service = axios.create({
  // 我们的 Vite 代理配置会将 /api 转发到 http://127.0.0.1:8000
  baseURL: '/api',
  timeout: 10000, // 请求超时时间
});

// --- 请求拦截器 (Request Interceptor) ---
// 在每个请求发送出去之前，执行此函数
service.interceptors.request.use(
  (config) => {
    // 1. 获取 Pinia store
    // 注意：不能在这里直接 useAuthStore()，因为 Pinia 实例此时可能还未挂载
    // 正确的做法是在函数内部获取
    const authStore = useAuthStore();

    // 2. 检查是否存在 token
    if (authStore.token) {
      // 3. 如果有，则为每个请求头添加 Authorization 字段
      config.headers['Authorization'] = `Bearer ${authStore.token}`;
    }
    return config;
  },
  (error) => {
    // 对请求错误做些什么
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// --- 响应拦截器 (Response Interceptor) ---
// 在收到服务器响应后，执行此函数
service.interceptors.response.use(
  // 状态码为 2xx 的响应会进入这里
  (response) => {
    // 直接返回响应体中的 `data` 部分，简化后续操作
    return response.data;
  },

  // 状态码非 2xx 的响应会进入这里
  (error) => {
    // 统一处理错误，并弹出 antd 的全局提示
    const errorMsg = error.response?.data?.detail || '请求失败，请检查网络或联系管理员';
    message.error(errorMsg);

    // 重点：处理 401 Unauthorized 错误 (Token 无效或过期)
    if (error.response?.status === 401) {
      const authStore = useAuthStore();
      // 调用 store 的 action 来清空 token 并重定向到登录页
      authStore.logout();
      // 这里可以添加更友好的提示，或直接在 logout action 中处理跳转
      message.error('身份验证失败，请重新登录');
    }

    return Promise.reject(error);
  }
);

export default service;
