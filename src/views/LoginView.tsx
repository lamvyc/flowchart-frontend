/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineComponent, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { Form, Input, Button, message } from 'ant-design-vue';
import { useAuthStore } from '@/store/auth';

export default defineComponent({
  name: 'LoginView',
  setup() {
    const authStore = useAuthStore();
    const router = useRouter();

    // 创建响应式的表单数据对象
    const formState = reactive({
      username: '',
      password: '',
    });

    // 登录按钮的加载状态
    const loading = reactive({
      value: false,
    });

    /**
     * 表单提交成功后的处理函数
     */
    const onFinish = async (values: any) => {
      console.log('表单提交:', values);
      loading.value = true;

      try {
        // 创建 FormData
        const formData = new FormData();
        formData.append('username', formState.username);
        formData.append('password', formState.password);

        // 调用 store 中的 login action
        await authStore.login(formData);

        message.success('登录成功！');

        // 登录成功后，跳转到仪表盘页面
        router.push({ name: 'Dashboard' });
      } catch (error) {
        console.error('登录失败:', error);
        // 错误消息已在 api/request.ts 中全局处理，这里无需重复提示
      } finally {
        loading.value = false;
      }
    };

    // setup 函数返回一个渲染函数
    return () => (
      <div class="min-h-screen flex items-center justify-center bg-gray-100">
        <div class="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
          <h1 class="text-2xl font-bold text-center mb-6">用户登录</h1>
          <Form model={formState} onFinish={onFinish} layout="vertical">
            <Form.Item
              label="用户名"
              name="username"
              rules={[{ required: true, message: '请输入用户名！' }]}
            >
              <Input v-model:value={formState.username} />
            </Form.Item>

            <Form.Item
              label="密码"
              name="password"
              rules={[{ required: true, message: '请输入密码！' }]}
            >
              <Input.Password v-model:value={formState.password} />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading.value} class="w-full">
                登 录
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    );
  },
});
