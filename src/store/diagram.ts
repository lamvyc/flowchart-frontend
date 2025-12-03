// src/store/diagram.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import {
  getDiagrams as apiGetDiagrams,
  createDiagram as apiCreateDiagram,
  deleteDiagram as apiDeleteDiagram,
} from '@/api/diagram';
import type { Diagram, CreateDiagramData } from '@/api/diagram';

export const useDiagramStore = defineStore('diagram', () => {
  // --- state ---
  const diagrams = ref<Diagram[]>([]);
  const isLoading = ref(false);

  // --- actions ---

  /**
   * 获取所有流程图
   */
  async function fetchDiagrams() {
    isLoading.value = true;
    try {
      const data = await apiGetDiagrams();
      diagrams.value = data;
    } catch (error) {
      console.error('获取流程图列表失败:', error);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 创建一个新的流程图
   */
  async function createNewDiagram(data: CreateDiagramData) {
    isLoading.value = true;
    try {
      const newDiagram = await apiCreateDiagram(data);
      // 创建成功后，直接在列表前面添加新图，以获得即时反馈
      diagrams.value.unshift(newDiagram);
      message.success('创建成功！');
    } catch (error) {
      console.error('创建流程图失败:', error);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 删除一个流程图
   */
  async function deleteDiagramById(diagramId: number) {
    isLoading.value = true;
    try {
      await apiDeleteDiagram(diagramId);
      // 删除成功后，从列表中移除
      const index = diagrams.value.findIndex((d) => d.id === diagramId);
      if (index !== -1) {
        diagrams.value.splice(index, 1);
      }
      message.success('删除成功！');
    } catch (error) {
      console.error('删除流程图失败:', error);
    } finally {
      isLoading.value = false;
    }
  }

  return {
    diagrams,
    isLoading,
    fetchDiagrams,
    createNewDiagram,
    deleteDiagramById,
  };
});
