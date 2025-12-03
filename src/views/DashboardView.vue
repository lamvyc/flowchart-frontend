<template>
  <div class="p-8">
    <h1 class="text-3xl font-bold">仪表盘</h1>
    <p class="mt-4">
      欢迎回来, <strong>{{ username }}</strong
      >!
    </p>

    <div class="mt-8 p-4 border rounded bg-gray-50">
      <h2 class="text-xl mb-2">用户信息</h2>
      <pre>{{ JSON.stringify(authStore.currentUser, null, 2) }}</pre>
    </div>

    <a-button type="primary" danger class="mt-8" @click="handleLogout"> 退出登录 </a-button>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { Button as AButton } from 'ant-design-vue'; // 如果 antd 组件名与 HTML 元素冲突，可以重命名导入

const authStore = useAuthStore();
const router = useRouter();

const username = computed(() => authStore.currentUser?.username || '用户');

const handleLogout = async () => {
  await authStore.logout();
  // 登出后，路由守卫会自动将未认证的用户从任何受保护页面重定向到登录页
  // 但为了更明确的用户体验，我们可以手动跳转
  router.push({ name: 'Login' });
};
</script>

<style scoped>
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
