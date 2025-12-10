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
    <main class="flex-1 bg-gray-200">
      <!-- AntV X6 的画布将在这里渲染 -->
      <div id="canvas-container" ref="canvasContainer" class="w-full h-full"></div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { Spin, Result, Button, message } from 'ant-design-vue';
import { Graph } from '@antv/x6';
import { getDiagramById, updateDiagram } from '@/api/diagram';
import type { Diagram } from '@/api/diagram';

// 重命名 antd 组件
const ASpin = Spin;
const AResult = Result;
const AButton = Button;

const route = useRoute();
const isLoading = ref(true);
const isSaving = ref(false);
const currentDiagram = ref<Diagram | null>(null);

// X6 相关引用
const canvasContainer = ref<HTMLElement | null>(null);
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
    // 开启节点和边的移动、缩放等交互
    interacting: {
      nodeMovable: true,
    },
  });

  // ✨ 关键修正：检查 content 是否有效
  if (
    currentDiagram.value &&
    currentDiagram.value.content &&
    Object.keys(currentDiagram.value.content).length > 0
  ) {
    // 如果 content 有效，则从 JSON 加载
    graph.fromJSON(currentDiagram.value.content);
  } else {
    // 如果是新图或 content 为空，添加一个默认节点
    graph.addNode({
      x: 300,
      y: 200,
      width: 120,
      height: 60,
      label: '开始',
      shape: 'rect',
    });
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
