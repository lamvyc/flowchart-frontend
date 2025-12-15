<!-- src/views/EditorView.vue -->
<template>
  <div v-if="isLoading" class="flex items-center justify-center h-screen">
    <a-spin size="large" tip="正在加载流程图..." />
  </div>
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
  <div v-else class="h-screen flex flex-col">
    <!-- 头部工具栏 -->
    <header class="h-16 bg-white shadow-md flex justify-between items-center px-4 flex-shrink-0">
      <div>
        <router-link :to="{ name: 'Dashboard' }">
          <a-button type="link"> &lt; 返回 </a-button>
        </router-link>
        <span class="ml-4 text-xl font-bold align-middle">{{ currentDiagram.name }}</span>
      </div>
      <div>
        <a-button type="primary" :loading="isSaving" @click="handleSave">保存</a-button>
      </div>
    </header>

    <!-- 编辑器主区域 -->
    <main class="flex-1 flex overflow-hidden">
      <!-- 1. 左侧组件面板 (Stencil) -->
      <aside class="w-56 bg-white border-r border-gray-200 flex-shrink-0">
        <h2 class="text-center text-lg font-semibold py-3 border-b">组件</h2>
        <!-- Stencil 的容器 -->
        <div id="stencil-container" ref="stencilContainer"></div>
      </aside>

      <!-- 2. 右侧画布区域 -->
      <div class="flex-1 relative">
        <!-- 画布的容器 -->
        <div id="canvas-container" ref="canvasContainer" class="w-full h-full"></div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { Spin, Result, Button, message } from 'ant-design-vue';
import { Graph } from '@antv/x6';
import { Stencil } from '@antv/x6-plugin-stencil';
import { getDiagramById, updateDiagram } from '@/api/diagram';
import type { Diagram } from '@/api/diagram';

const ASpin = Spin;
const AResult = Result;
const AButton = Button;
const route = useRoute();
const isLoading = ref(true);
const isSaving = ref(false);
const currentDiagram = ref<Diagram | null>(null);
const canvasContainer = ref<HTMLElement | null>(null);
const stencilContainer = ref<HTMLElement | null>(null);
let graph: Graph | null = null;

/**
 * 初始化 X6 画布
 */
const initGraph = () => {
  if (!canvasContainer.value) return;
  graph = new Graph({
    container: canvasContainer.value,
    grid: true,
    autoResize: true,
    interacting: { nodeMovable: true },
  });

  if (stencilContainer.value && graph) {
    const stencil = new Stencil({
      title: '基础节点',
      target: graph,
      stencilGraphWidth: 200,
      stencilGraphHeight: 300,
      groups: [{ name: 'basic', title: '基础流程图' }],
    });
    stencilContainer.value.appendChild(stencil.container);

    // ✨ v2: 使用 graph.createNode() 创建节点
    const rect = graph.createNode({
      shape: 'rect',
      width: 100,
      height: 40,
      label: '矩形',
    });
    const circle = graph.createNode({
      shape: 'circle',
      width: 60,
      height: 60,
      label: '圆形',
    });
    const rhombus = graph
      .createNode({
        shape: 'rect',
        width: 80,
        height: 80,
        label: '判断',
        attrs: { body: { rx: 10, ry: 10 } },
      })
      .rotate(45);

    stencil.load([rect.clone(), circle.clone(), rhombus.clone()], 'basic');
  }

  if (currentDiagram.value?.content && Object.keys(currentDiagram.value.content).length > 0) {
    graph.fromJSON(currentDiagram.value.content);
  }
};

/**
 * 处理保存
 */
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

// onBeforeUnmount 保持不变
onBeforeUnmount(() => {
  graph?.dispose();
});
</script>
