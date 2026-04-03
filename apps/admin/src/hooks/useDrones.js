/**
 * ============================================
 * useDrones.js - 全局状态管理（Zustand Store）
 * ============================================
 * 
 * 【什么是状态管理？】
 * 状态 = 数据
 * 比如：无人机列表、商家列表、订单列表、模拟是否运行...
 * 
 * 状态管理就是：集中管理这些数据，让多个组件都能方便地访问和修改
 * 
 * 【为什么需要状态管理？】
 * 
 * 没有状态管理时：
 *   App
 *   ├── PageA (需要无人机列表) → 单独加载
 *   ├── PageB (需要无人机列表) → 又单独加载
 *   └── PageC (需要无人机列表) → 再单独加载
 * 
 * 问题：
 * - 数据重复加载，浪费资源
 * - 数据不统一，可能出现不一致
 * - 修改数据很麻烦，需要层层传递
 * 
 * 有状态管理后：
 *   Store (统一的数据仓库)
 *   ├── drones: [...]
 *   ├── merchants: [...]
 *   └── orders: [...]
 * 
 * 所有组件都从这里读取和修改数据，数据统一、易于管理
 * 
 * 【Zustand 是什么？】
 * Zustand 是一个轻量级的状态管理库（类似于 Redux，但更简单）
 * 
 * 核心概念：
 * 1. create() - 创建 Store
 * 2. useStore() - 在组件中使用 Store
 * 3. set() - 更新状态
 * 4. get() - 获取状态
 * 
 * 【Zustand Store 的结构】
 * 
 * create((set, get) => ({
 * 
 *   // ========== 状态（数据）==========
 *   drones: [...],           // 无人机列表
 *   merchants: [...],        // 商家列表
 *   orders: [...],           // 订单列表
 * 
 *   // ========== 方法（更新数据的函数）==========
 *   addDrone: (drone) => { ... },
 *   updateDrone: (id, updates) => { ... },
 * 
 *   // ========== 计算属性（从现有数据派生）==========
 *   getDroneStats: () => { ... },
 * }))
 * 
 * 【为什么叫 useStore？】
 * 这是一个自定义 Hook
 * React 规定：以 "use" 开头的函数就是 Hook
 * Hook 就是"钩子"，可以让你在函数组件中使用 React 的特性
 */

// 1. 导入 zustand 的 create 函数
import { create } from 'zustand';

// 2. 导入初始数据（JSON 文件）
import dronesData from '@shared/data/drones.json';      // 无人机初始数据
import merchantsData from '@shared/data/merchants.json'; // 商家初始数据
import ordersData from '@shared/data/orders.json';      // 订单初始数据

// 3. 导入工具函数
import { calculateNextPosition } from '@shared/utils/flight.js'; // 计算飞行路径

// 4. 导入常量
import { 
  SIMULATION_INTERVAL,      // 模拟间隔（1秒）
  DEFAULT_FLIGHT_SPEED,     // 默认飞行速度
  ORDER_STATUS,             // 订单状态枚举
  DRONE_STATUS              // 无人机状态枚举
} from '@shared/constants.js';

/**
 * create() - 创建 Zustand Store
 * 
 * 参数是一个函数，接收 set 和 get 两个参数：
 * - set: 用于更新状态
 * - get: 用于获取当前状态
 */
const useStore = create((set, get) => ({
  
  // ==========================================
  // 【第一部分：初始状态（数据）】
  // ==========================================
  
  /** 无人机列表 */
  drones: dronesData.drones,
  
  /** 商家列表 */
  merchants: merchantsData.merchants,
  
  /** 订单列表 */
  orders: ordersData.orders,
  
  /** 模拟是否在运行 */
  simulationRunning: false,
  
  /** 模拟的 interval ID（用于停止模拟） */
  simulationInterval: null,
  
  /** 当前选中的无人机（用于在地图上高亮显示） */
  selectedDrone: null,
  
  /** 当前选中的商家 */
  selectedMerchant: null,
  
  // ==========================================
  // 【第二部分：更新状态的方法】
  // ==========================================
  
  /**
   * 设置选中的无人机
   * @param {Object} drone - 无人机对象
   * 
   * set() 的用法：
   * set({ 新的状态 }) - 完全替换状态
   * set((state) => ({ ... })) - 基于当前状态计算新状态
   */
  setSelectedDrone: (drone) => set({ selectedDrone: drone }),
  
  /**
   * 设置选中的商家
   */
  setSelectedMerchant: (merchant) => set({ selectedMerchant: merchant }),
  
  /**
   * 更新单个无人机的信息
   * @param {string} droneId - 无人机 ID
   * @param {Object} updates - 要更新的字段
   * 
   * 例子：updateDrone('DRONE-001', { battery: 50, status: 'charging' })
   * 
   * state.drones.map() - 遍历所有无人机
   * d.id === droneId ? { ...d, ...updates } : d
   *   如果是目标无人机，合并更新
   *   否则保持不变
   */
  updateDrone: (droneId, updates) =>
    set((state) => ({
      drones: state.drones.map((d) =>
        d.id === droneId ? { ...d, ...updates } : d
      ),
    })),
  
  /**
   * 添加新无人机
   * @param {Object} drone - 新无人机对象
   * 
   * [...state.drones, drone] - 在现有列表末尾添加新无人机
   */
  addDrone: (drone) =>
    set((state) => ({
      drones: [...state.drones, drone],
    })),
  
  /**
   * 更新单个订单的信息
   * 用法和 updateDrone 类似
   */
  updateOrder: (orderId, updates) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, ...updates } : o
      ),
    })),
  
  /**
   * 添加新订单
   */
  addOrder: (order) =>
    set((state) => ({
      orders: [...state.orders, order],
    })),
  
  // ==========================================
  // 【第三部分：业务逻辑方法】
  // ==========================================
  
  /**
   * 启动无人机飞行模拟
   * 
   * 原理：使用 setInterval 每隔一段时间（SIMULATION_INTERVAL）更新无人机位置
   * 
   * setInterval 是 JavaScript 的定时器函数：
   * setInterval(要执行的函数, 间隔时间毫秒)
   * 返回一个 ID，用于 later 停止定时器
   */
  startSimulation: () => {
    // 先检查是否已经在运行，防止重复启动
    const { simulationRunning, simulationInterval } = get();
    if (simulationRunning) return;
    
    /**
     * setInterval - 每隔一段时间重复执行
     * SIMULATION_INTERVAL = 1000ms = 1秒
     * 
     * 所以这个模拟每秒更新一次无人机位置
     */
    const interval = setInterval(() => {
      // get() 获取最新的状态（因为状态可能在不断变化）
      const { drones, orders, updateDrone, updateOrder } = get();
      
      // 遍历所有无人机
      drones.forEach((drone) => {
        
        // 只有正在飞行（配送中或返航中）的无人机需要更新位置
        if (drone.status !== DRONE_STATUS.DISPATCHING && 
            drone.status !== DRONE_STATUS.RETURNING) {
          return; // 跳过，继续下一个无人机
        }
        
        // 找到这个无人机正在执行的任务（订单）
        const activeOrder = orders.find(
          (o) => o.id === drone.currentTask && 
                 (o.status === ORDER_STATUS.PICKING_UP || 
                  o.status === ORDER_STATUS.DELIVERING)
        );
        
        if (!activeOrder) return; // 如果没有活跃订单，跳过
        
        // 确定目标位置
        // 如果订单状态是"取货中"，目标是商家位置
        // 如果订单状态是"配送中"，目标是客户位置
        const targetPos =
          activeOrder.status === ORDER_STATUS.PICKING_UP
            ? activeOrder.pickupPosition      // 商家位置
            : activeOrder.deliveryPosition;  // 客户位置
        
        // 使用工具函数计算下一秒无人机的位置
        // 参数：当前位置、目标位置、速度、时间间隔
        const speed = drone.currentSpeed || DEFAULT_FLIGHT_SPEED;
        const result = calculateNextPosition(
          drone.position, 
          targetPos, 
          speed, 
          SIMULATION_INTERVAL
        );
        
        // 更新无人机的位置
        // 如果到达目标，速度设为 0
        updateDrone(drone.id, {
          position: result.position,
          currentSpeed: result.isArrived ? 0 : speed,
        });
        
        // 如果到达目标位置，处理到达逻辑
        if (result.isArrived) {
          
          // 情况1：正在取货，到达商家位置
          if (activeOrder.status === ORDER_STATUS.PICKING_UP) {
            // 更新订单状态为"配送中"
            updateOrder(activeOrder.id, {
              status: ORDER_STATUS.DELIVERING,
              timeline: { 
                ...activeOrder.timeline,     // 保留原有时间记录
                pickedUp: new Date().toISOString() // 记录取货时间
              },
            });
            // 无人机状态改为配送中
            updateDrone(drone.id, { status: DRONE_STATUS.DISPATCHING });
            
          // 情况2：正在配送，到达客户位置
          } else if (activeOrder.status === ORDER_STATUS.DELIVERING) {
            // 更新订单状态为"已送达"
            updateOrder(activeOrder.id, {
              status: ORDER_STATUS.DELIVERED,
              timeline: { 
                ...activeOrder.timeline,
                delivered: new Date().toISOString()
              },
            });
            // 无人机状态改为空闲，清除任务
            updateDrone(drone.id, {
              status: DRONE_STATUS.IDLE,
              currentTask: null,
            });
          }
        }
      });
    }, SIMULATION_INTERVAL); // 每秒执行一次
    
    // 标记模拟为运行中，保存 interval ID
    set({ simulationRunning: true, simulationInterval: interval });
  },
  
  /**
   * 停止模拟
   * clearInterval 停止定时器
   */
  stopSimulation: () => {
    const { simulationInterval } = get();
    if (simulationInterval) {
      clearInterval(simulationInterval); // 停止定时器
      set({ simulationRunning: false, simulationInterval: null });
    }
  },
  
  // ==========================================
  // 【第四部分：计算属性（派生数据）】
  // ==========================================
  
  /**
   * 获取无人机统计信息
   * 从 drones 数组计算各种统计数据
   * 
   * 这些函数不修改状态，只读取并计算
   */
  getDroneStats: () => {
    const { drones } = get();
    return {
      total: drones.length,                                          // 总数
      idle: drones.filter((d) => d.status === DRONE_STATUS.IDLE).length,       // 空闲
      dispatching: drones.filter((d) => d.status === DRONE_STATUS.DISPATCHING).length, // 配送中
      returning: drones.filter((d) => d.status === DRONE_STATUS.RETURNING).length,   // 返航中
      charging: drones.filter((d) => d.status === DRONE_STATUS.CHARGING).length,     // 充电中
      maintenance: drones.filter((d) => d.status === DRONE_STATUS.MAINTENANCE).length, // 维护中
    };
  },
  
  /**
   * 获取订单统计信息
   */
  getOrderStats: () => {
    const { orders } = get();
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === ORDER_STATUS.PENDING).length,
      delivering: orders.filter((o) => o.status === ORDER_STATUS.DELIVERING).length,
      delivered: orders.filter((o) => o.status === ORDER_STATUS.DELIVERED).length,
    };
  },
}));

/**
 * 【如何在外组件中使用这个 Store？】
 * 
 * 1. 在组件顶部导入
 *    import useStore from './hooks/useDrones';
 * 
 * 2. 在组件中调用（像使用 Hook 一样）
 *    const { drones, addDrone } = useStore();
 * 
 * 3. 当 Store 中的数据变化时，组件会自动重新渲染
 * 
 * 【选择性地订阅状态】
 * 
 * // 订阅全部（任何状态变化都会重新渲染）
 * const { drones } = useStore();
 * 
 * // 只订阅 drones 数组（只有 drones 变化时才重新渲染）
 * const drones = useStore((state) => state.drones);
 * 
 * // 订阅计算属性
 * const stats = useStore((state) => state.getDroneStats());
 */

// 导出 Store，供其他组件使用
export default useStore;
