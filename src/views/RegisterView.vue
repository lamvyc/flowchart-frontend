<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
      <h1 class="text-2xl font-bold text-center mb-6">创建新账户</h1>
      <a-form :model="formState" layout="vertical" @finish="onFinish">
        <a-form-item
          label="用户名"
          name="username"
          :rules="[{ required: true, message: '请输入用户名！' }]"
        >
          <a-input v-model:value="formState.username" />
        </a-form-item>

        <a-form-item
          label="邮箱"
          name="email"
          :rules="[
            { required: true, message: '请输入邮箱！' },
            { type: 'email', message: '请输入有效的邮箱地址！' },
          ]"
        >
          <a-input v-model:value="formState.email" />
        </a-form-item>

        <a-form-item
          label="密码"
          name="password"
          has-feedback
          :rules="[{ required: true, message: '请输入密码！' }]"
        >
          <a-input-password v-model:value="formState.password" />
        </a-form-item>

        <a-form-item
          label="确认密码"
          name="confirmPassword"
          has-feedback
          :dependencies="['password']"
          :rules="[{ required: true, validator: validateConfirmPassword }]"
        >
          <a-input-password v-model:value="formState.confirmPassword" />
        </a-form-item>

        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="loading" class="w-full">
            注 册
          </a-button>
        </a-form-item>
      </a-form>
      <div class="text-center text-sm text-gray-600 mt-4">
        已有账户？
        <router-link :to="{ name: 'Login' }" class="text-blue-500 hover:underline">
          返回登录
        </router-link>
      </div>
    </div>
  </div>
</template>
<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Form, Input, Button, message } from 'ant-design-vue';
import { register as apiRegister } from '@/api/auth';
import type { RegisterData } from '@/api/auth';

const AForm = Form;
const AFormItem = Form.Item;
const AInput = Input;
const AInputPassword = Input.Password;
const AButton = Button;

const router = useRouter();
const formState = reactive({
  username: '',
  password: '',
  email: '',
  confirmPassword: '',
});
const loading = ref(false);

const validateConfirmPassword = async (_rule: any, value: string) => {
  if (value === '') return Promise.reject('请再次输入密码！');
  if (value !== formState.password) return Promise.reject('两次输入的密码不一致！');
  return Promise.resolve();
};

const onFinish = async (values: any) => {
  loading.value = true;
  try {
    const dataToSubmit: RegisterData = {
      username: values.username,
      password: values.password,
      email: values.email,
    };
    await apiRegister(dataToSubmit);
    message.success('注册成功！将跳转到登录页面。');
    router.push({ name: 'Login' });
  } catch (error) {
    console.error('注册失败:', error);
  } finally {
    loading.value = false;
  }
};
</script>
