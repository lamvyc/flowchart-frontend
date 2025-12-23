<!-- src/views/EditorView.vue -->
<template>
  <!-- 1. 加载中状态 -->
  <div v-if="isLoading" class="flex items-center justify-center h-screen">
    <a-spin size="large" tip="正在加载流程图..." />
  </div>

  <!-- 2. 加载失败状态 -->
  <div v-else-if="!currentDiagram" class="flex items-center justify-center h-screen">
    <a-result
      status="404"
      title="加载失败"
      sub-title="抱歉，我们没有找到这个流程图，或者加载失败了。"
    >
      <template #extra>
        <router-link :to="{ name: 'Dashboard' }">
          <a-button type="primary">返回仪表盘</a-button>
        </router-link>
      </template>
    </a-result>
  </div>

  <!-- 3. 编辑器主界面 -->
  <div v-else class="h-screen flex flex-col overflow-hidden">
    <!-- 头部导航栏 -->
    <header
      class="h-16 bg-white shadow-sm border-b border-gray-200 flex justify-between items-center px-4 flex-shrink-0 z-10 relative"
    >
      <!-- 左侧：返回按钮 -->
      <div class="flex items-center z-20">
        <!-- z-20 确保按钮在标题之上（防止小屏幕重叠无法点击） -->

        <router-link :to="{ name: 'Dashboard' }">
          <a-button type="link" class="flex items-center px-0 text-gray-600 hover:text-blue-600">
            <template #icon>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </template>
            返回仪表盘
          </a-button>
        </router-link>
      </div>

      <!-- 中间：标题和 ID (绝对居中) -->
      <div
        class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center"
      >
        <div class="flex items-baseline gap-2">
          <h1 class="text-lg font-bold text-gray-800 m-0 truncate max-w-xs">
            {{ currentDiagram?.title }}
          </h1>
          <span class="text-xs text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
            ID: {{ currentDiagram?.id }}
          </span>
        </div>
      </div>

      <!-- 右侧：保存按钮 -->
      <div class="flex items-center z-20">
        <a-button type="primary" :loading="isSaving" @click="handleSave">
          <template #icon>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 mr-1 inline-block -mt-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
          </template>
          保存流程图
        </a-button>
      </div>
    </header>

    <!-- 主工作区 -->
    <main class="flex-1 flex overflow-hidden relative">
      <!-- 左侧组件面板 (Stencil) -->
      <aside class="w-56 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 z-10">
        <h2 class="text-center text-lg font-semibold py-3 border-b bg-gray-50">组件</h2>
        <div
          id="stencil-container"
          ref="stencilContainer"
          class="flex-1 overflow-y-auto relative"
        ></div>
      </aside>

      <!-- 右侧画布区域 -->
      <div class="flex-1 bg-gray-100 relative overflow-hidden">
        <!-- 
           ✨ 关键：给 canvas container 一个绝对定位，让它撑满父容器 
           这样 X6 的尺寸计算就会基于这个绝对定位的容器，而不是外面的 flow
        -->
        <div id="canvas-container" ref="canvasContainer" class="absolute inset-0"></div>
      </div>

      <!-- ✨ 3. 新增：右侧属性面板 (当选中节点时显示) -->
      <aside
        v-if="selectedNode"
        class="w-64 bg-white border-l border-gray-200 flex flex-col flex-shrink-0 z-10 shadow-lg transition-all"
      >
        <h2 class="text-center text-lg font-semibold py-3 border-b bg-gray-50">属性设置</h2>
        <div class="p-4 flex-1 overflow-y-auto">
          <a-form layout="vertical">
            <a-form-item label="文本内容">
              <a-input v-model:value="nodeForm.label" @change="updateNode" />
            </a-form-item>

            <a-form-item label="背景颜色">
              <input
                type="color"
                v-model="nodeForm.fill"
                class="w-full h-10 p-1 border rounded cursor-pointer"
                @input="updateNode"
              />
            </a-form-item>

            <a-form-item label="边框颜色">
              <input
                type="color"
                v-model="nodeForm.stroke"
                class="w-full h-10 p-1 border rounded cursor-pointer"
                @input="updateNode"
              />
            </a-form-item>

            <a-form-item label="边框宽度">
              <a-slider
                v-model:value="nodeForm.strokeWidth"
                :min="1"
                :max="10"
                @change="updateNode"
              />
            </a-form-item>
          </a-form>
        </div>
      </aside>
    </main>
  </div>
</template>
<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, reactive, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { Spin, Result, Button, message, Form, Input, Slider } from 'ant-design-vue';
// ✨ v2 核心导入
import { Graph, Node } from '@antv/x6';
import { Stencil } from '@antv/x6-plugin-stencil';
import { getDiagramById, updateDiagram } from '@/api/diagram';
import type { Diagram } from '@/api/diagram';

// 重命名 antd 组件
const ASpin = Spin;
const AResult = Result;
const AButton = Button;
const AForm = Form;
const AFormItem = Form.Item;
const AInput = Input;
const ASlider = Slider;

const route = useRoute();
const isLoading = ref(true);
const isSaving = ref(false);
const currentDiagram = ref<Diagram | null>(null);

// X6 相关引用
const canvasContainer = ref<HTMLElement | null>(null);
const stencilContainer = ref<HTMLElement | null>(null);
let graph: Graph | null = null;

// 属性面板状态
const selectedNode = ref<Node | null>(null);
const nodeForm = reactive({
  label: '',
  fill: '#ffffff',
  stroke: '#000000',
  strokeWidth: 1,
});

/**
 * 初始化 X6 画布
 */
const initGraph = () => {
  if (!canvasContainer.value) return;
  // 1. 创建 Graph 实例
  graph = new Graph({
    container: canvasContainer.value,
    grid: true,
    autoResize: true,
    panning: true, // 开启画布平移
    mousewheel: true, // 开启滚轮缩放

    // 交互配置
    interacting: {
      nodeMovable: true,
      edgeMovable: true,
    },

    // ✨ 连线配置 (Connecting)
    connecting: {
      snap: true, // 自动吸附
      allowBlank: false,
      allowLoop: false,
      highlight: true,
      connector: 'rounded', // 圆角连线
      connectionPoint: 'boundary',
      router: {
        name: 'manhattan', // 曼哈顿路由（直角折线）
        args: { padding: 20 },
      },
      createEdge() {
        return graph!.createEdge({
          // 使用 graph.createEdge 创建默认边
          attrs: {
            line: {
              stroke: '#5F95FF',
              strokeWidth: 2,
              targetMarker: { name: 'block', width: 12, height: 8 },
            },
          },
          zIndex: 0,
        });
      },
    },
  });
  // 2. 初始化 Stencil (组件面板)
  if (stencilContainer.value && graph) {
    const stencil = new Stencil({
      title: '基础节点',
      target: graph,
      stencilGraphWidth: 200,
      stencilGraphHeight: 300,
      groups: [{ name: 'basic', title: '基础流程图' }],
    });
    stencilContainer.value.appendChild(stencil.container);

    // ✨ 定义通用的连接桩 (Ports) 配置
    const ports = {
      groups: {
        top: {
          position: 'top',
          attrs: {
            circle: {
              r: 4,
              magnet: true,
              stroke: '#5F95FF',
              strokeWidth: 1,
              fill: '#fff',
              style: { visibility: 'hidden' },
            },
          },
        },
        right: {
          position: 'right',
          attrs: {
            circle: {
              r: 4,
              magnet: true,
              stroke: '#5F95FF',
              strokeWidth: 1,
              fill: '#fff',
              style: { visibility: 'hidden' },
            },
          },
        },
        bottom: {
          position: 'bottom',
          attrs: {
            circle: {
              r: 4,
              magnet: true,
              stroke: '#5F95FF',
              strokeWidth: 1,
              fill: '#fff',
              style: { visibility: 'hidden' },
            },
          },
        },
        left: {
          position: 'left',
          attrs: {
            circle: {
              r: 4,
              magnet: true,
              stroke: '#5F95FF',
              strokeWidth: 1,
              fill: '#fff',
              style: { visibility: 'hidden' },
            },
          },
        },
      },
      items: [{ group: 'top' }, { group: 'right' }, { group: 'bottom' }, { group: 'left' }],
    };

    // ✨ 3. 创建节点原型 (v2 API: graph.createNode)
    const rect = graph.createNode({
      shape: 'rect',
      width: 100,
      height: 40,
      label: '矩形',
      ports: { ...ports },
      attrs: { body: { fill: '#ffffff', stroke: '#000000', strokeWidth: 1 } },
    });
    const circle = graph.createNode({
      shape: 'circle',
      width: 60,
      height: 60,
      label: '圆形',
      ports: { ...ports },
      attrs: { body: { fill: '#ffffff', stroke: '#000000', strokeWidth: 1 } },
    });
    const rhombus = graph
      .createNode({
        shape: 'rect',
        width: 80,
        height: 80,
        label: '判断',
        ports: { ...ports },
        attrs: { body: { rx: 10, ry: 10, fill: '#ffffff', stroke: '#000000', strokeWidth: 1 } },
      })
      .rotate(45);

    // 加载原型到 Stencil
    stencil.load([rect.clone(), circle.clone(), rhombus.clone()], 'basic');
  }

  // --- 事件监听 ---

  graph.on('node:mouseenter', () => {
    const container = document.getElementById('canvas-container');
    // 使用 any 绕过 NodeListOf 检查，或者修改 eslintrc 关闭 no-undef
    const ports = container?.querySelectorAll('.x6-port-body') as any;
    ports.forEach((port: HTMLElement) => {
      port.style.visibility = 'visible';
    });
  });

  graph.on('node:mouseleave', () => {
    const container = document.getElementById('canvas-container');
    const ports = container?.querySelectorAll('.x6-port-body') as any;
    ports.forEach((port: HTMLElement) => {
      port.style.visibility = 'hidden';
    });
  });

  // ✨ 节点点击事件
  graph.on('node:click', ({ node }) => {
    selectedNode.value = node;

    // 1. 获取属性并断言为 Record<string, any>，避免 typescript 报错
    const attrs = node.getAttrs() as Record<string, any>;

    // 2. 获取 Label
    // 在 X6 v2 TS 定义中可能缺失 getLabel，但运行时存在。
    const labelData = (node as any).getLabel();

    // 处理 label 可能是字符串或对象的情况
    nodeForm.label = typeof labelData === 'string' ? labelData : labelData?.text || '';

    // 3. 回显样式
    nodeForm.fill = attrs.body?.fill || '#ffffff';
    nodeForm.stroke = attrs.body?.stroke || '#000000';
    nodeForm.strokeWidth = attrs.body?.strokeWidth || 1;
  });

  graph.on('blank:click', () => {
    selectedNode.value = null;
  });

  if (currentDiagram.value?.content && Object.keys(currentDiagram.value.content).length > 0) {
    graph.fromJSON(currentDiagram.value.content);
  }
};

/**
 * 更新节点属性
 */
const updateNode = () => {
  const node = selectedNode.value;
  if (!node) return;

  // ✨ 强制调用 setLabel
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (node as any).setLabel(nodeForm.label);

  node.setAttrs({
    body: {
      fill: nodeForm.fill,
      stroke: nodeForm.stroke,
      strokeWidth: nodeForm.strokeWidth,
    },
  });
};

const handleSave = async () => {
  if (!graph || !currentDiagram.value) return;

  isSaving.value = true;
  try {
    // ✨ 关键修正：获取完整的画布数据
    const graphData = graph.toJSON();

    const updatedDiagram = await updateDiagram(currentDiagram.value.id, {
      // ✨ 关键修正：确保发送的是 content 字段
      content: graphData,
    });

    // ✨ 最佳实践：保存成功后，用后端返回的最新数据更新本地状态
    if (updatedDiagram && currentDiagram.value) {
      currentDiagram.value.content = updatedDiagram.content;
      currentDiagram.value.updated_at = updatedDiagram.updated_at;
    }

    message.success('保存成功！');
  } catch (error) {
    console.error('保存失败:', error);
  } finally {
    isSaving.value = false;
  }
};

// --- 生命周期钩子 ---
onMounted(async () => {
  isLoading.value = true;
  const diagramId = Number(route.params.id);

  if (isNaN(diagramId)) {
    isLoading.value = false;
    return;
  }

  try {
    // 1. 先获取流程图的基础信息
    const data = await getDiagramById(diagramId);
    console.log('API 返回数据:', data);

    currentDiagram.value = data;
  } catch (error) {
    console.error('获取流程图详情失败:', error);
    currentDiagram.value = null; // 加载失败，设置为空
  } finally {
    // ✨ 关键修正：无论成功或失败，在 finally 中初始化画布
    // 这样能确保即使 API 失败，页面也能渲染出画布（或错误信息）
    isLoading.value = false;
    // 仅在成功获取到 diagram 数据后才初始化画布
    if (currentDiagram.value) {
      // 使用 nextTick 确保 DOM 已经更新
      await nextTick();
      initGraph();
    }
  }
});
onBeforeUnmount(() => {
  graph?.dispose();
});
</script>
