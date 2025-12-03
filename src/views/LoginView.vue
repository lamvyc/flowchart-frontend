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
          <a-input v-model:value="formState.username" />
        </a-form-item>

        <a-form-item
          label="密码"
          name="password"
          :rules="[{ required: true, message: '请输入密码！' }]"
        >
          <a-input-password v-model:value="formState.password" />
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
// 👈 不再需要 lang="tsx"
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Form, Input, Button, message } from 'ant-design-vue';
import { useAuthStore } from '@/store/auth';

const AForm = Form;
const AFormItem = Form.Item;
const AInput = Input;
const AInputPassword = Input.Password;
const AButton = Button;

const authStore = useAuthStore();
const router = useRouter();
const formState = reactive({
  username: '',
  password: '',
});
const loading = ref(false);

const onFinish = async () => {
  loading.value = true;
  try {
    const formData = new FormData();
    formData.append('username', formState.username);
    formData.append('password', formState.password);

    await authStore.login(formData);
    message.success('登录成功！');
    router.push({ name: 'Dashboard' });
  } catch (error) {
    console.error('登录失败:', error);
  } finally {
    loading.value = false;
  }
};
</script>
