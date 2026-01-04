### **实现离线模式**

如果你在后端新增了一个接口（比如：**复制流程图** `POST /diagrams/{id}/duplicate`），在前端你需要修改的地方**只有一处核心文件**，步骤如下：

#### 核心修改点：`src/api/diagram.ts`

你需要在这个文件中导出新的函数，并严格遵守 **“一分为二”** 的代码结构。

##### 步骤演示

假设后端新增接口：`POST /diagrams/{id}/duplicate`。

你在 `src/api/diagram.ts` 中新增如下代码：

```
// src/api/diagram.ts

// ... 其他 import 和接口定义

/**
 * [新增] 复制/另存为流程图
 * @param diagramId 原流程图 ID
 */
export async function duplicateDiagram(diagramId: number): Promise<Diagram> {
  // ==========================================
  // 1. 离线模式逻辑 (Mock 实现)
  // ==========================================
  if (isOffline()) {
    await delay(MOCK_DELAY);
    const store = getMockStore();
    
    // A. 找到原数据
    const source = store.find(d => d.id === Number(diagramId));
    if (!source) throw new Error('原流程图不存在');

    // B. 模拟后端逻辑：生成新对象
    const newDiagram: Diagram = {
      ...source,
      id: Date.now(), // 生成新 ID
      title: `${source.title} - 副本`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // C. 存入 LocalStorage
    store.unshift(newDiagram);
    setMockStore(store);

    return newDiagram;
  }

  // ==========================================
  // 2. 在线模式逻辑 (真实调用)
  // ==========================================
  return service({
    url: `/diagrams/${diagramId}/duplicate`, // 你的真实后端接口地址
    method: 'post',
  });
}
```

------

#### 常见情况问答

##### Q1: 如果这个新功能无法在离线模式下实现怎么办？

**场景**：比如“生成分享链接”或“多人实时协作”，这些必须依赖服务器。

**做法**：在离线分支中直接抛出特定错误，或者返回空。

TypeScript

```
export async function generateShareLink(id: number): Promise<string> {
  if (isOffline()) {
    // 方案 A: 模拟一个假链接 (演示用)
    // return `http://localhost:3000/share/mock-${id}`;
    
    // 方案 B: 直接报错，UI 层捕获后提示用户“离线模式不支持此功能”
    return Promise.reject(new Error('离线演示模式下不支持生成分享链接'));
  }

  return service({ url: `/diagrams/${id}/share`, method: 'post' });
}
```

##### Q2: 我需要改 Store 吗？

**需要**，但这属于常规开发流程，与“离线逻辑”本身无关。 你需要在 `src/store/diagram.ts` 中添加一个 action 来调用上面那个 API 函数。Store 不需要知道现在是离线还是在线，它只管调用 API。

##### Q3: 我需要改组件 (View) 吗？

**不需要**改逻辑。 组件只管调用 `store.duplicateDiagram(id)`。如果离线模式下你抛出了错误（如上面的 Q1），组件里原本的 `try...catch` 会捕获到，你只需要决定是弹窗报错还是忽略即可。

#### 总结

每次新增接口，你只需要关注 **`src/api/xxx.ts`** 这一个文件：

1. **写 `if (isOffline())`**。
2. **写 Mock 数据操作** (LocalStorage)。
3. **写 Else (Service 调用)**。

这就是这一套架构最优雅的地方：**业务逻辑（Store/View）与 数据来源（API/Mock）彻底解耦。**

