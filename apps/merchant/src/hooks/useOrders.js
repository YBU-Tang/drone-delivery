/**
 * ============================================
 * useOrders.js - 商家端订单状态管理
 * ============================================
 * 
 * 【商家端 vs 后台端】
 * 
 * 后台端 (useDrones.js)：
 * - 需要管理所有无人机
 * - 需要地图可视化
 * - 需要启动飞行模拟
 * 
 * 商家端 (useOrders.js)：
 * - 管理当前商家的订单
 * - 创建新订单时自动分配无人机
 * - 查看订单状态
 * 
 * 【订单创建流程】
 * 
 * 1. 用户填写配送信息
 *    - 配送地址
 *    - 纬度、经度（GPS 坐标）
 *    - 物品重量
 * 
 * 2. 系统计算
 *    - 计算商家到配送点的距离
 *    - 估算配送时间
 *    - 查找最近的空闲无人机
 * 
 * 3. 分配无人机
 *    - 如果有空闲无人机，立即分配
 *    - 如果没有，订单状态为"待分配"
 * 
 * 4. 创建订单
 *    - 生成订单号
 *    - 记录订单信息
 *    - 更新无人机状态
 */

// 1. 导入 zustand
import { create } from 'zustand';

// 2. 导入数据
import merchantsData from '@shared/data/merchants.json';
import ordersData from '@shared/data/orders.json';
import dronesData from '@shared/data/drones.json';

// 3. 导入工具函数
import { assignNearestDrone } from '@shared/utils/assignment.js';  // 分配无人机
import { calculateDistance } from '@shared/utils/distance.js';      // 计算距离

// 4. 导入常量
import { DEFAULT_FLIGHT_SPEED } from '@shared/constants.js';

/**
 * 商家端 Store
 */
const useStore = create((set, get) => ({
  
  // ==========================================
  // 【状态】
  // ==========================================
  
  /** 当前登录的商家（模拟第一个商家） */
  currentMerchant: merchantsData.merchants[0],
  
  /** 所有商家列表 */
  merchants: merchantsData.merchants,
  
  /** 所有订单列表 */
  orders: ordersData.orders,
  
  /** 所有无人机列表 */
  drones: dronesData.drones,
  
  // ==========================================
  // 【方法】
  // ==========================================
  
  /**
   * 创建新订单
   * 
   * @param {Object} orderData - 订单数据
   * @param {string} orderData.address - 配送地址
   * @param {number} orderData.latitude - 配送点纬度
   * @param {number} orderData.longitude - 配送点经度
   * @param {number} orderData.weight - 物品重量
   * 
   * @returns {Object} { order, assignedDrone } 创建的订单和分配的无人机
   */
  addOrder: (orderData) => {
    // 从 state 获取数据
    const { currentMerchant, orders, drones, addOrderToList, updateDrone } = get();
    
    /**
     * 生成订单号
     * 格式：ORD-YYYYMMDD-XXX
     * 例如：ORD-20260331-001
     */
    const orderId = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(orders.length + 1).padStart(3, '0')}`;

    /**
     * 创建订单对象
     */
    const newOrder = {
      id: orderId,                                    // 订单号
      merchantId: currentMerchant.id,                // 商家 ID
      merchantName: currentMerchant.name,             // 商家名称
      status: 'pending',                             // 默认状态：待分配
      pickupPosition: currentMerchant.position,       // 取货位置 = 商家位置
      deliveryPosition: {
        latitude: orderData.latitude,                 // 配送位置
        longitude: orderData.longitude,
      },
      customerAddress: orderData.address,             // 配送地址
      weight: parseFloat(orderData.weight) || 0.5,   // 重量
      assignedDroneId: null,                          // 分配的无人机（初始为空）
      timeline: {                                     // 订单时间线
        created: new Date().toISOString(),            // 创建时间
        assigned: null,                               // 分配时间
        pickedUp: null,                               // 取货时间
        delivered: null,                              // 送达时间
      },
      estimatedDuration: 0,                           // 预计配送时长
    };

    /**
     * 计算配送距离和预计时间
     */
    const distance = calculateDistance(currentMerchant.position, newOrder.deliveryPosition);
    // 预计时间 = 距离 / 速度 * 2（去程 + 回程）
    newOrder.estimatedDuration = Math.ceil((distance / DEFAULT_FLIGHT_SPEED) * 2);

    /**
     * 为订单分配最近的无人机
     * assignNearestDrone 是我们写的工具函数
     * 它会：
     * 1. 筛选出空闲的无人机
     * 2. 计算每个无人机到商家的距离
     * 3. 返回距离最近的那个
     */
    const selectedDrone = assignNearestDrone(newOrder, drones);

    /**
     * 如果找到了空闲无人机
     * 更新订单状态和无人机状态
     */
    if (selectedDrone) {
      newOrder.status = 'assigned';                   // 改为"已分配"
      newOrder.assignedDroneId = selectedDrone.id;    // 记录分配的无人机
      newOrder.timeline.assigned = new Date().toISOString(); // 记录分配时间
      
      // 更新无人机状态
      // 设为配送中，关联当前订单
      updateDrone(selectedDrone.id, {
        status: 'dispatching',
        currentTask: orderId,                        // 关联订单
        currentSpeed: selectedDrone.maxSpeed,        // 设置飞行速度
      });
    }

    /**
     * 将新订单添加到列表
     */
    addOrderToList(newOrder);
    
    // 返回结果，供 UI 显示
    return { order: newOrder, assignedDrone: selectedDrone };
  },

  /**
   * 将订单添加到列表（内部方法）
   */
  addOrderToList: (order) =>
    set((state) => ({
      orders: [...state.orders, order],
    })),

  /**
   * 更新无人机状态（内部方法）
   */
  updateDrone: (droneId, updates) =>
    set((state) => ({
      drones: state.drones.map((d) =>
        d.id === droneId ? { ...d, ...updates } : d
      ),
    })),

  // ==========================================
  // 【计算属性】
  // ==========================================
  
  /**
   * 获取订单统计
   */
  getOrderStats: () => {
    const { orders } = get();
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      assigned: orders.filter((o) => o.status === 'assigned').length,
      delivering: orders.filter((o) => o.status === 'delivering').length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
    };
  },

  /**
   * 获取可用的无人机列表
   */
  getAvailableDrones: () => {
    const { drones } = get();
    return drones.filter((d) => d.status === 'idle');
  },
}));

export default useStore;
