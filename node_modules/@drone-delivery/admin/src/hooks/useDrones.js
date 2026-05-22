/**
 * ============================================================
 * 全局状态管理 Hook（useDrones - Zustand Store）
 * ============================================================
 *
 * 【什么是 Zustand？】
 * Zustand 是一个轻量级的 React 状态管理库。
 * 相比 Redux，它的 API 更简洁，概念更少，学习曲线更平缓。
 *
 * 【Zustand vs Redux 对比】
 *
 *   Zustand                    Redux
 * ──────────────────────────  ─────────────────────────────
 * 单一 store（可拆分）         单一 store + 多 reducer
 * 无 Provider 包裹             需要 <Provider>
 * 直接修改状态                  不可变更新（immer/手写）
 * 更少的样板代码                 更多模板代码
 * 中等规模的理想选择            大型复杂应用的理想选择
 *
 * 【为什么选择 Zustand？】
 * 本系统状态不算复杂：
 *   - drones、merchants、orders 数据
 *   - 一些 UI 状态（selectedDrone, loading 等）
 *   - WebSocket 实时更新
 * Zustand 已经足够满足需求，代码量也少很多。
 *
 * 【Zustand 的核心概念】
 * - create()：创建 store
 * - getState()：获取当前状态
 * - setState()：更新状态
 * - subscribe()：订阅状态变化
 */

import { create } from 'zustand';
import { api } from '@shared/api/client.js';
import { useWebSocket } from '@shared/api/websocket.js';

// 导入初始数据（JSON 文件）
// 这些数据在 API 请求失败时作为兜底数据
import dronesData from '@shared/data/drones.json';
import merchantsData from '@shared/data/merchants.json';
import ordersData from '@shared/data/orders.json';

/**
 * 创建全局状态存储
 *
 * 【create() 的参数】
 * 是一个函数，接收 set 和 get 两个参数：
 *   - set：用于更新状态，类似于 React 的 setState
 *   - get：用于获取当前状态
 *
 * 【返回值】
 * create() 返回一个自定义 Hook（useStore），
 * 组件中调用 useStore() 即可访问状态和方法。
 */
const useStore = create((set, get) => ({
  // ─────────────────────────────────────────────────────────
  // 状态（State）
  // ─────────────────────────────────────────────────────────

  /**
   * 无人机列表
   * 初始从 JSON 文件加载，作为 API 请求失败时的兜底数据。
   * 数据结构：Array<Drone>
   */
  drones: dronesData.drones,

  /**
   * 商家列表
   * 初始从 JSON 文件加载。
   */
  merchants: merchantsData.merchants,

  /**
   * 订单列表
   * 初始从 JSON 文件加载。
   */
  orders: ordersData.orders,

  /**
   * 模拟服务运行状态
   * 由服务端控制，前端通过 WebSocket 同步此状态。
   * true = 模拟运行中，false = 模拟已停止
   */
  simulationRunning: false,

  /**
   * 模拟定时器引用
   * 存储 setInterval 返回的 timer ID，用于清理定时器。
   * 注意：在本项目中，实际的模拟运行在后端，这里是前端轮询用的（如果有）。
   */
  simulationInterval: null,

  /**
   * 选中的无人机（用于地图高亮、详情弹窗等）
   * null 表示没有选中任何无人机
   */
  selectedDrone: null,

  /**
   * 选中的商家（用于地图高亮、详情弹窗等）
   * null 表示没有选中任何商家
   */
  selectedMerchant: null,

  /**
   * 加载状态
   * true 表示正在从 API 获取数据
   */
  loading: false,

  /**
   * 错误信息
   * 如果 API 请求失败，存储错误消息
   */
  error: null,

  // ─────────────────────────────────────────────────────────
  // 操作方法（Actions）
  // 这些方法用于更新状态，类似于 Redux 中的 action
  // ─────────────────────────────────────────────────────────

  /**
   * 设置选中的无人机
   *
   * 【用法】
   * 在地图上点击无人机时，调用此方法高亮显示。
   *
   * 【为什么用 set({ ... }) 语法？】
   * set() 可以接受一个函数或对象。
   * 使用对象时，会将提供的属性合并到现有状态中（类似 Object.assign）。
   */
  setSelectedDrone: (drone) => set({ selectedDrone: drone }),
  setSelectedMerchant: (merchant) => set({ selectedMerchant: merchant }),

  // ─────────────────────────────────────────────────────────
  // 数据获取方法（API 交互）
  // ─────────────────────────────────────────────────────────

  /**
   * fetchAll：获取所有数据
   *
   * 【功能】
   * 同时请求无人机、商家、订单数据，更新状态。
   * 使用 Promise.all 并行请求，减少等待时间。
   *
   * 【Promise.all 的优势】
   * 如果分开调用：
   *   const drones = await api.getDrones();
   *   const merchants = await api.getMerchants();
   *   const orders = await api.getOrders();
   * 总耗时 = t1 + t2 + t3（串行）
   *
   * 使用 Promise.all：
   *   const [drones, merchants, orders] = await Promise.all([...]);
   * 总耗时 = max(t1, t2, t3)（并行）
   */
  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      // 并行请求三个 API
      const [dronesRes, merchantsRes, ordersRes] = await Promise.all([
        api.getDrones(),
        api.getMerchants(),
        api.getOrders(),
      ]);

      // 更新状态
      set({
        drones: dronesRes.drones,
        merchants: merchantsRes.merchants,
        orders: ordersRes.orders,
        loading: false,
      });
    } catch (err) {
      // 请求失败，保存错误信息
      // UI 可以根据 error 状态显示错误提示
      set({ error: err.message, loading: false });
    }
  },

  /**
   * fetchDrones：只获取无人机数据
   *
   * 【使用场景】
   * 无人机管理页面只需要无人机数据，不需要商家和订单。
   * 使用单独的 fetch 方法可以减少不必要的网络请求。
   */
  fetchDrones: async () => {
    try {
      const { drones } = await api.getDrones();
      set({ drones });
    } catch (err) {
      set({ error: err.message });
    }
  },

  // ─────────────────────────────────────────────────────────
  // CRUD 操作方法
  // ─────────────────────────────────────────────────────────

  /**
   * addDrone：添加新无人机
   *
   * 【实现】
   * 1. 调用 API 创建无人机
   * 2. 将新无人机添加到状态数组
   * 3. 返回新创建的对象，让调用者可以使用
   *
   * 【为什么用展开运算符？】
   * set((state) => ({ drones: [...state.drones, newDrone] }))
   * 展开现有数组 + 新元素，创建新数组。
   * 这是 React 的不可变更新原则：永远不直接修改状态。
   */
  addDrone: async (droneData) => {
    try {
      const newDrone = await api.createDrone(droneData);
      set((state) => ({ drones: [...state.drones, newDrone] }));
      return newDrone;
    } catch (err) {
      set({ error: err.message });
      throw err; // 重新抛出，让调用者可以 catch
    }
  },

  /**
   * updateDrone：更新无人机信息（本地状态）
   *
   * 【注意】
   * 这个方法只更新本地状态，不调用 API。
   * 用于 WebSocket 推送更新时同步状态。
   *
   * 【为什么用 map 而不是直接修改？】
   * React 通过引用比较来判断状态是否变化。
   * map 返回新数组，触发组件重新渲染。
   * 直接修改数组不会触发更新。
   */
  updateDrone: (droneId, updates) =>
    set((state) => ({
      drones: state.drones.map((d) =>
        d.id === droneId ? { ...d, ...updates } : d
      ),
    })),

  /**
   * removeDrone：删除无人机
   *
   * 【为什么先调 API 再更新状态？】
   * 如果 API 调用失败（如无权限），不应该更新本地状态。
   * 这是乐观更新 vs 悲观更新的选择。
   * 这里采用"悲观更新"：先确认成功，再更新 UI。
   */
  removeDrone: async (droneId) => {
    try {
      await api.deleteDrone(droneId);
      set((state) => ({ drones: state.drones.filter((d) => d.id !== droneId) }));
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  // ─────────────────────────────────────────────────────────
  // 商家管理方法
  // ─────────────────────────────────────────────────────────

  /**
   * updateMerchant：更新商家信息（本地状态）
   * 与 updateDrone 类似，用于同步 WebSocket 推送的更新。
   */
  updateMerchant: (merchantId, updates) =>
    set((state) => ({
      merchants: state.merchants.map((m) =>
        m.id === merchantId ? { ...m, ...updates } : m
      ),
    })),

  /**
   * addMerchant：添加新商家
   */
  addMerchant: async (merchantData) => {
    try {
      const newMerchant = await api.createMerchant(merchantData);
      set((state) => ({ merchants: [...state.merchants, newMerchant] }));
      return newMerchant;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  /**
   * removeMerchant：删除商家
   */
  removeMerchant: async (merchantId) => {
    try {
      await api.deleteMerchant(merchantId);
      set((state) => ({ merchants: state.merchants.filter((m) => m.id !== merchantId) }));
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  // ─────────────────────────────────────────────────────────
  // 订单管理方法
  // ─────────────────────────────────────────────────────────

  /**
   * addOrder：添加新订单
   * 注意：这里没有调用 API，因为创建订单在商家端进行。
   */
  addOrder: (order) =>
    set((state) => ({ orders: [...state.orders, order] })),

  /**
   * updateOrder：更新订单信息
   * 主要用于 WebSocket 推送更新。
   */
  updateOrder: (orderId, updates) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, ...updates } : o
      ),
    })),

  // ─────────────────────────────────────────────────────────
  // WebSocket 更新处理
  // ─────────────────────────────────────────────────────────

  /**
   * applyWsUpdate：处理 WebSocket 推送的更新
   *
   * 【WebSocket 推送的数据格式】
   * { type: 'state_update', payload: { drones, orders } }
   *
   * 【为什么单独写一个方法？】
   * WebSocket 的回调函数需要访问 store 的 set 方法。
   * 封装成方法后，代码更清晰，也便于复用。
   */
  applyWsUpdate: (payload) => {
    if (payload.drones) {
      set({ drones: payload.drones });
    }
    if (payload.orders) {
      set({ orders: payload.orders });
    }
  },

  // ─────────────────────────────────────────────────────────
  // 统计计算方法
  // ─────────────────────────────────────────────────────────

  /**
   * getDroneStats：获取无人机统计信息
   *
   * 【为什么写成方法而不是派生状态？】
   * 派生状态（computed properties）可以用 useMemo 缓存：
   *   const stats = useMemo(() => getDroneStats(), [drones]);
   *
   * 这里直接写成方法，调用时使用 useMemo 可以避免重复计算。
   */
  getDroneStats: () => {
    const { drones } = get(); // 获取当前状态的 drones
    return {
      total: drones.length, // 总数
      idle: drones.filter((d) => d.status === 'idle').length,         // 空闲
      dispatching: drones.filter((d) => d.status === 'dispatching').length, // 配送中
      returning: drones.filter((d) => d.status === 'returning').length, // 返航中
      charging: drones.filter((d) => d.status === 'charging').length,  // 充电中
      maintenance: drones.filter((d) => d.status === 'maintenance').length, // 维护中
    };
  },

  /**
   * getOrderStats：获取订单统计信息
   */
  getOrderStats: () => {
    const { orders } = get();
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,   // 待分配
      delivering: orders.filter((o) => o.status === 'delivering').length, // 配送中
      delivered: orders.filter((o) => o.status === 'delivered').length, // 已完成
      assigned: orders.filter((o) => o.status === 'assigned').length, // 已分配
    };
  },
}));

// ─────────────────────────────────────────────────────────────
// WebSocket 初始化
// ─────────────────────────────────────────────────────────────
/**
 * 初始化 WebSocket 连接
 *
 * 【时机】
 * 这段代码在模块加载时执行（不在组件中）。
 * 使用 useStore.getState() 获取初始状态。
 *
 * 【为什么在模块级别初始化？】
 * WebSocket 连接只需要建立一次，应该在应用启动时就建立。
 * 在组件中初始化会导致每次组件挂载都建立新连接。
 *
 * 【错误处理】
 * 如果 WebSocket 不可用（如 SSR 环境），静默失败。
 * 降级方案是使用 HTTP 轮询。
 */
function initWebSocket() {
  const store = useStore.getState();
  useWebSocket((data) => {
    if (data.type === 'state_update') {
      store.applyWsUpdate(data.payload);
    }
  });
}

// 仅在浏览器环境中初始化 WebSocket
if (typeof window !== 'undefined') {
  try {
    initWebSocket();
  } catch {
    // WebSocket 不可用，使用 HTTP 轮询作为降级方案
  }
}

export default useStore;
