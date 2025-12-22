/* eslint-disable @typescript-eslint/no-explicit-any */
// src/api/diagram.ts

import service from './request';

// 根据后端简报，定义 Diagram 对象的核心类型
// 'content' 可以是任何东西，但我们知道它是一个 JSON 对象，所以用 Record<string, any>
export interface Diagram {
  id: number;
  title: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  content: Record<string, any>;
}

// 创建新图时，我们只需要一个名字
export interface CreateDiagramData {
  title: string;
  content: object;
}

/**
 * 获取当前用户的所有流程图
 */
export function getDiagrams(): Promise<Diagram[]> {
  return service({
    url: '/diagrams',
    method: 'get',
  });
}

/**
 * 创建一个新的流程图
 * @param data { name: string }
 */
export function createDiagram(data: CreateDiagramData): Promise<Diagram> {
  return service({
    url: '/diagrams',
    method: 'post',
    data,
  });
}

/**
 * 删除一个流程图
 * @param diagramId 流程图的 ID
 */
export function deleteDiagram(diagramId: number): Promise<any> {
  return service({
    url: `/diagrams/${diagramId}`,
    method: 'delete',
  });
}

// --- 稍后我们会用到的 API ---

/**
 * 获取单个流程图的详细信息（包含 content）
 * @param diagramId 流程图的 ID
 */
export function getDiagramById(diagramId: number): Promise<Diagram> {
  return service({
    url: `/diagrams/${diagramId}`,
    method: 'get',
  });
}

/**
 * 更新一个流程图（主要是更新 content）
 * @param diagramId 流程图的 ID
 * @param data { name?: string, content?: object }
 */
export function updateDiagram(diagramId: number, data: Partial<Diagram>): Promise<Diagram> {
  return service({
    url: `/diagrams/${diagramId}`,
    method: 'put',
    data,
  });
}
