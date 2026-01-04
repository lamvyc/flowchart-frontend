<!-- src/views/LoginView.vue -->
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
      <h1 class="text-2xl font-bold text-center mb-6">用户登录</h1>
      <a-form :model="formState" layout="vertical" @finish="onFinish">
        <a-form-item
          label="用户名"
          name="username"
          :rules="[{ required: true, message: '请输入用户名！' }]"
        >
          <a-input v-model:value="formState.username" placeholder="输入任意用户名" />
        </a-form-item>

        <a-form-item
          label="密码"
          name="password"
          :rules="[{ required: true, message: '请输入密码！' }]"
        >
          <a-input-password v-model:value="formState.password" placeholder="输入任意密码" />
        </a-form-item>

        <a-form-item>
          <a-checkbox v-model:checked="isOfflineMode"> 离线演示模式 (无需后端服务) </a-checkbox>
        </a-form-item>

        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="loading" class="w-full">
            登 录
          </a-button>
        </a-form-item>
      </a-form>
      <div class="text-center text-sm text-gray-600 mt-4">
        还没有账户？
        <router-link :to="{ name: 'Register' }" class="text-blue-500 hover:underline">
          立即注册
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Form, Input, Button, Checkbox, message } from 'ant-design-vue'; // 引入 Checkbox
import { useAuthStore } from '@/store/auth';

const AForm = Form;
const AFormItem = Form.Item;
const AInput = Input;
const AInputPassword = Input.Password;
const AButton = Button;
const ACheckbox = Checkbox; // 注册组件

const authStore = useAuthStore();
const router = useRouter();

// 表单数据
const formState = reactive({
  username: '',
  password: '',
});

// 状态控制
const loading = ref(false);
const isOfflineMode = ref(false); // ✨ 控制是否离线

const onFinish = async () => {
  loading.value = true;

  // =========================================================
  // 🔴 离线模式分支
  // =========================================================
  if (isOfflineMode.value) {
    // 1. 设置全局离线标记 (给路由守卫看)
    localStorage.setItem('isOffline', 'true');

    // 2. 模拟设置 Token (给路由守卫放行)
    authStore.setToken('mock-token-offline-mode');

    // 3. 手动设置 Store 中的用户信息 (避免进入页面后 user 为 null)
    // 注意：这里构造的对象要符合 User 接口
    authStore.currentUser = {
      id: -1,
      username: formState.username || 'OfflineUser',
    };

    message.success('已进入离线演示模式 🚀');
    loading.value = false;
    router.push({ name: 'Dashboard' });
    return; // 结束执行，不再调用后端
  }

  // =========================================================
  // 🟢 在线模式分支
  // =========================================================

  // 务必清除离线标记，防止用户之前勾选过后来又取消
  localStorage.removeItem('isOffline');

  try {
    const formData = new FormData();
    formData.append('username', formState.username);
    formData.append('password', formState.password);

    await authStore.login(formData);
    message.success('登录成功！');
    router.push({ name: 'Dashboard' });
  } catch (error) {
    console.error('登录失败:', error);
    // 这里全局拦截器通常会弹出错误提示，如果没配，可以手动 message.error
  } finally {
    loading.value = false;
  }
};
</script>
