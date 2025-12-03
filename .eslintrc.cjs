// .eslintrc.cjs
module.exports = {
  // 将此文件声明为根配置文件，ESLint 将停止在父级目录中寻找
  root: true,

  // 定义代码运行的环境
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended', // ESLint 官方推荐的基本规则
    'plugin:vue/vue3-essential', // Vue 3 的核心规则
    'plugin:@typescript-eslint/recommended', // TypeScript 的推荐规则
    'plugin:prettier/recommended', // **必须是最后一个**，用于集成 Prettier 并禁用冲突规则
  ],

  // 注册需要使用的插件
  plugins: [
    'vue', // 注册 'vue' 插件
    '@typescript-eslint', // 注册 'typescript-eslint' 插件
  ],

  // ESLint 的解析器配置
  parser: 'vue-eslint-parser', // 主解析器，用于解析 .vue 文件
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    // 当 vue-eslint-parser 解析 <script> 标签时，它会使用下面这个解析器
    parser: '@typescript-eslint/parser',
  },

  // 自定义或覆盖规则
  rules: {
    // 关闭 Vue 组件名必须是多个单词的规则
    'vue/multi-word-component-names': 'off',

    // 你可以在这里添加更多自定义规则
    // 'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    // 'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
  },
};
