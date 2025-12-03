import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx'; // 👈 导入 JSX 插件
import Components from 'unplugin-vue-components/vite';
import path from 'path';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(), // 👈 启用 JSX 插件，现在你的项目可以识别 .tsx 文件了

    // antd 按需加载配置
    Components({
      resolvers: [
        AntDesignVueResolver({
          importStyle: false, // 我们将使用 css-in-js，所以设置为 false
        }),
      ],
    }),
  ],

  // 开发服务器代理，解决跨域问题
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000', // 你的 FastAPI 后端地址
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
