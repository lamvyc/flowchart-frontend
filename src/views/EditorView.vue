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
      class="h-16 bg-white shadow-sm border-b border-gray-200 flex justify-between items-center px-4 flex-shrink-0 z-20 relative"
    >
      <div class="flex items-center">
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
            返回
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

      <div class="flex items-center">
        <a-button type="primary" :loading="isSaving" @click="handleSave">保存</a-button>
      </div>
    </header>

    <!-- ✨ 新增：顶部工具栏 (Toolbar) -->
    <div
      class="h-10 bg-gray-50 border-b border-gray-200 flex items-center px-4 flex-shrink-0 gap-2"
    >
      <!-- 撤销/重做 -->
      <a-button-group size="small">
        <a-button @click="onUndo" :disabled="!canUndo" title="撤销">
          <template #icon>↺</template>
        </a-button>
        <a-button @click="onRedo" :disabled="!canRedo" title="重做">
          <template #icon>↻</template>
        </a-button>
      </a-button-group>

      <div class="w-px h-4 bg-gray-300 mx-2"></div>

      <!-- 缩放控制 -->
      <a-button-group size="small">
        <a-button @click="zoomIn" title="放大">+</a-button>
        <a-button @click="zoomOut" title="缩小">-</a-button>
        <a-button @click="zoomToFit" title="适应画布">Fit</a-button>
        <a-button @click="zoomReset" title="100%">1:1</a-button>
      </a-button-group>

      <span class="text-xs text-gray-500 ml-2">{{ Math.round(zoomScale * 100) }}%</span>
    </div>

    <!-- 主工作区 -->
    <main class="flex-1 flex overflow-hidden relative">
      <!-- 左侧组件面板 -->
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
        <div id="canvas-container" ref="canvasContainer" class="absolute inset-0"></div>
      </div>

      <!-- 右侧属性面板 -->
      <aside
        v-if="selectedNode"
        class="w-64 bg-white border-l border-gray-200 flex flex-col flex-shrink-0 z-10 shadow-lg"
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

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, reactive, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { Spin, Result, Button, message, Form, Input, Slider } from 'ant-design-vue';
// ✨ 引入 History 插件
import { Graph, Node } from '@antv/x6';
import { Stencil } from '@antv/x6-plugin-stencil';
import { History } from '@antv/x6-plugin-history';
import { getDiagramById, updateDiagram } from '@/api/diagram';
import type { Diagram } from '@/api/diagram';

// 组件重命名
const ASpin = Spin;
const AResult = Result;
const AButton = Button;
const AButtonGroup = Button.Group; // ✨ 新增按钮组
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
// ✨ 工具栏状态
const canUndo = ref(false);
const canRedo = ref(false);
const zoomScale = ref(1);
/**
 * 初始化 X6 画布
 */
const initGraph = () => {
  if (!canvasContainer.value) return;

  graph = new Graph({
    container: canvasContainer.value,
    grid: true,
    autoResize: true,
    panning: true, // 开启画布平移
    mousewheel: {
      enabled: true, // 开启滚轮缩放
      modifiers: ['ctrl', 'meta'], // 按住 Ctrl/Meta 滚动缩放
    },
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

  // ✨ 集成 History 插件
  graph.use(
    new History({
      enabled: true,
    })
  );

  // ✨ 监听历史记录变化，更新按钮状态
  graph.on('history:change', () => {
    canUndo.value = graph!.canUndo();
    canRedo.value = graph!.canRedo();
  });

  // ✨ 监听缩放变化
  graph.on('scale', ({ sx }) => {
    zoomScale.value = sx;
  });

  // Stencil 初始化
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

    // 创建节点原型
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

  // 事件监听
  graph.on('node:mouseenter', () => {
    const container = document.getElementById('canvas-container');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ports = container?.querySelectorAll('.x6-port-body') as any;
    ports.forEach((port: HTMLElement) => {
      port.style.visibility = 'visible';
    });
  });

  graph.on('node:mouseleave', () => {
    const container = document.getElementById('canvas-container');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ports = container?.querySelectorAll('.x6-port-body') as any;
    ports.forEach((port: HTMLElement) => {
      port.style.visibility = 'hidden';
    });
  });

  // ✨ 节点点击事件
  graph.on('node:click', ({ node }) => {
    selectedNode.value = node;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const attrs = node.getAttrs() as Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const labelData = (node as any).getLabel();
    nodeForm.label = typeof labelData === 'string' ? labelData : labelData?.text || '';
    // 回显样式
    nodeForm.fill = attrs.body?.fill || '#ffffff';
    nodeForm.stroke = attrs.body?.stroke || '#000000';
    nodeForm.strokeWidth = attrs.body?.strokeWidth || 1;
  });

  graph.on('blank:click', () => {
    selectedNode.value = null;
  });

  if (currentDiagram.value?.content && Object.keys(currentDiagram.value.content).length > 0) {
    graph.fromJSON(currentDiagram.value.content);
    // ✨ 加载完成后，清除初始的历史记录栈，防止用户撤销到空白状态
    graph.cleanHistory();
  }
};

// ✨ 工具栏操作函数
const onUndo = () => graph?.undo();
const onRedo = () => graph?.redo();
const zoomIn = () => graph?.zoom(0.1);
const zoomOut = () => graph?.zoom(-0.1);
const zoomToFit = () => graph?.zoomToFit({ padding: 20 });
const zoomReset = () => graph?.zoomTo(1);

const updateNode = () => {
  const node = selectedNode.value;
  if (!node) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (node as any).setLabel(nodeForm.label);
  node.setAttrs({
    body: { fill: nodeForm.fill, stroke: nodeForm.stroke, strokeWidth: nodeForm.strokeWidth },
  });
};

const handleSave = async () => {
  if (!graph || !currentDiagram.value) return;
  isSaving.value = true;
  try {
    const graphData = graph.toJSON();
    const updatedDiagram = await updateDiagram(currentDiagram.value.id, { content: graphData });
    if (updatedDiagram) {
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
