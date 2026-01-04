<!-- src/views/DashboardView.vue -->
<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
      <!-- 头部区域 -->
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-2xl font-bold">我的流程图</h1>
        <div class="flex items-center gap-x-4">
          <a-button type="primary" @click="showCreateModal"> 新建流程图 </a-button>
          <a-button type="default" @click="handleLogout"> 退出登录 </a-button>
        </div>
      </div>

      <!-- 流程图表格 -->
      <div class="mt-8 bg-white p-6 rounded-lg shadow">
        <a-table
          :columns="columns"
          :data-source="diagramStore.diagrams"
          :loading="diagramStore.isLoading"
          :row-key="'id'"
        >
          <template #bodyCell="{ column, record }">
            <!-- 自定义“最后更新时间”列的渲染 -->
            <template v-if="column.key === 'updated_at'">
              <span>{{ new Date(record.updated_at).toLocaleString() }}</span>
            </template>

            <!-- 自定义“操作”列的渲染 -->
            <template v-if="column.key === 'action'">
              <div class="flex gap-x-2">
                <a-button type="link" size="small" @click="handleEdit(record.id)"> 编辑 </a-button>
                <a-popconfirm
                  title="确定要删除这个流程图吗？"
                  ok-text="确定"
                  cancel-text="取消"
                  @confirm="handleDelete(record.id)"
                >
                  <a-button type="link" danger size="small"> 删除 </a-button>
                </a-popconfirm>
              </div>
            </template>
          </template>
        </a-table>
      </div>

      <!-- 新建流程图的模态弹窗 -->
      <a-modal
        v-model:visible="isModalVisible"
        title="新建流程图"
        ok-text="确认"
        cancel-text="取消"
        :confirm-loading="diagramStore.isLoading"
        @ok="handleModalOk"
      >
        <a-input
          v-model:value="newDiagramName"
          placeholder="请输入新流程图的名称"
          @pressEnter="handleModalOk"
        />
      </a-modal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { useDiagramStore } from '@/store/diagram';
import { Button, Table, Popconfirm, Modal, Input, message } from 'ant-design-vue';

// 为了模板清晰，可以重命名
const AButton = Button;
const ATable = Table;
const APopconfirm = Popconfirm;
const AModal = Modal;
const AInput = Input;

const authStore = useAuthStore();
const diagramStore = useDiagramStore();
const router = useRouter();

// --- 表格列定义 ---
const columns = [
  {
    title: '名称',
    dataIndex: 'title',
    key: 'title',
    width: '200px',
  },
  {
    title: '最后更新时间',
    dataIndex: 'updated_at',
    key: 'updated_at',
    width: '200px', // 给一个宽度，避免列宽变化
  },
  {
    title: '操作',
    key: 'action',
    width: '120px', // 给一个固定的宽度
  },
];

// --- 弹窗控制 ---
const isModalVisible = ref(false);
const newDiagramName = ref('');

const showCreateModal = () => {
  newDiagramName.value = '';
  isModalVisible.value = true;
};

const handleModalOk = async () => {
  const name = newDiagramName.value.trim();
  if (!name) {
    return message.error('名称不能为空！');
  }

  await diagramStore.createNewDiagram({
    title: name,
    content: {},
  });

  isModalVisible.value = false;
};

// --- 核心操作 ---

const handleEdit = (id: number) => {
  // 使用 router.push 进行编程式导航
  // 跳转到名为 'Editor' 的路由，并带上 id 作为路由参数
  router.push({
    name: 'Editor',
    params: { id },
  });
};

const handleDelete = (id: number) => {
  diagramStore.deleteDiagramById(id);
};

const handleLogout = async () => {
  await authStore.logout();
  router.push({ name: 'Login' });
};

// --- 生命周期 ---
onMounted(() => {
  diagramStore.fetchDiagrams();
});
</script>
