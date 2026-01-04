import service from './request';

// ==========================================
// 1. 类型定义 (保持不变)
// ==========================================

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

// ==========================================
// 2. Mock 引擎 (新增部分)
// ==========================================

const MOCK_STORAGE_KEY = 'offline_diagrams_data';
const MOCK_DELAY = 500; // 模拟网络延迟 500ms

// 辅助函数：是否处于离线模式
const isOffline = () => localStorage.getItem('isOffline') === 'true';

// 辅助函数：模拟延迟
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 辅助函数：读取本地数据
function getMockStore(): Diagram[] {
  const json = localStorage.getItem(MOCK_STORAGE_KEY);
  return json ? JSON.parse(json) : [];
}

// 辅助函数：写入本地数据
function setMockStore(data: Diagram[]) {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(data));
}

// ==========================================
// 3. API 实现 (改造部分)
// ==========================================

/**
 * 获取当前用户的所有流程图
 */
export async function getDiagrams(): Promise<Diagram[]> {
  // 🔴 离线分支
  if (isOffline()) {
    await delay(MOCK_DELAY);
    const data = getMockStore();
    // 按更新时间倒序排列 (模拟后端行为)
    return data.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  // 🟢 在线分支
  return service({
    url: '/diagrams',
    method: 'get',
  });
}

/**
 * 创建一个新的流程图
 * @param data { title: string, content: object }
 */
export async function createDiagram(data: CreateDiagramData): Promise<Diagram> {
  // 🔴 离线分支
  if (isOffline()) {
    await delay(MOCK_DELAY);
    const store = getMockStore();

    // 构造新对象 (模拟后端生成 ID 和 时间)
    const newDiagram: Diagram = {
      id: Date.now(), // 使用时间戳作为临时 ID
      title: data.title,
      content: (data.content as Record<string, any>) || {},
      user_id: -1, // 离线用户 ID
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 存入本地
    store.unshift(newDiagram);
    setMockStore(store);

    return newDiagram;
  }

  // 🟢 在线分支
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
export async function deleteDiagram(diagramId: number): Promise<any> {
  // 🔴 离线分支
  if (isOffline()) {
    await delay(MOCK_DELAY);
    const store = getMockStore();
    // 过滤掉要删除的 ID
    const newStore = store.filter((d) => d.id !== Number(diagramId));
    setMockStore(newStore);
    return { success: true };
  }

  // 🟢 在线分支
  return service({
    url: `/diagrams/${diagramId}`,
    method: 'delete',
  });
}

/**
 * 获取单个流程图的详细信息（包含 content）
 * @param diagramId 流程图的 ID
 */
export async function getDiagramById(diagramId: number): Promise<Diagram> {
  // 🔴 离线分支
  if (isOffline()) {
    await delay(MOCK_DELAY);
    const store = getMockStore();
    const item = store.find((d) => d.id === Number(diagramId));

    if (!item) {
      // 模拟 404 错误
      throw new Error('流程图不存在 (Mock 404)');
    }
    return item;
  }

  // 🟢 在线分支
  return service({
    url: `/diagrams/${diagramId}`,
    method: 'get',
  });
}

/**
 * 更新一个流程图（主要是更新 content）
 * @param diagramId 流程图的 ID
 * @param data { title?: string, content?: object }
 */
export async function updateDiagram(diagramId: number, data: Partial<Diagram>): Promise<Diagram> {
  // 🔴 离线分支
  if (isOffline()) {
    await delay(MOCK_DELAY);
    const store = getMockStore();
    const index = store.findIndex((d) => d.id === Number(diagramId));

    if (index === -1) {
      throw new Error('流程图不存在 (Mock 404)');
    }

    // 修复点 1: 提取当前项，并使用 "!" 断言它一定存在
    // (因为上面已经检查过 index !== -1 了，所以这里是安全的)
    const currentItem = store[index]!;

    // 修复点 2: 使用 currentItem 构造新对象，并使用 "as Diagram" 修正最终类型
    const updatedItem = {
      ...currentItem, // 展开旧数据
      ...data, // 展开新数据 (可能会覆盖 title 或 content)
      updated_at: new Date().toISOString(),
      id: currentItem.id, // 明确赋值 ID，防止丢失
    } as Diagram;

    // 更新数组并保存
    store[index] = updatedItem;
    setMockStore(store);

    return updatedItem;
  }

  // 🟢 在线分支
  return service({
    url: `/diagrams/${diagramId}`,
    method: 'put',
    data,
  });
}
