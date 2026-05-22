/**
 * ============================================================
 * 无人机派单算法（Assignment Algorithm）
 * ============================================================
 *
 * 【功能】
 * 实现订单到无人机的自动分配逻辑：
 *   1. 筛选可用的无人机（空闲且电量充足）
 *   2. 计算每架无人机到商家的距离
 *   3. 选择距离最近的无人机
 *
 * 【"就近原则"的意义】
 * 选择最近的无人机可以：
 *   - 减少飞行时间 → 更快的配送
 *   - 减少电池消耗 → 单次飞行耗电更少
 *   - 降低中途电量耗尽的风险
 */

import { calculateDistance } from './distance.js';
import { DRONE_STATUS } from '../constants.js';

/**
 * 为单个订单分配最近的可用无人机
 *
 * @param {Object} order - 订单对象
 * @param {Object} order.pickupPosition - 取货地点坐标 { latitude, longitude }
 *
 * @param {Array} drones - 无人机数组
 *
 * @returns {Object|null} 分配的无人机对象，或 null（无可用无人机）
 *
 * @example
 * const drone = assignNearestDrone(
 *   { pickupPosition: { latitude: 31.23, longitude: 121.47 } },
 *   drones
 * );
 * if (drone) {
 *   console.log(`分配 ${drone.name} 执行任务`);
 * }
 */
export function assignNearestDrone(order, drones) {
  // ─────────────────────────────────────────────────────────
  // 步骤 1：筛选可用无人机
  // ─────────────────────────────────────────────────────────
  // 可用条件：
  //   - 状态为"空闲"（idle）
  //   - 电量高于 20%（避免中途没电）
  const availableDrones = drones.filter(
    (drone) =>
      drone.status === DRONE_STATUS.IDLE &&
      drone.battery > 20  // 电量阈值设为 20%
  );

  // 如果没有可用无人机，返回 null
  if (availableDrones.length === 0) {
    return null;
  }

  // ─────────────────────────────────────────────────────────
  // 步骤 2：找出距离商家最近的那架
  // ─────────────────────────────────────────────────────────
  let nearestDrone = null;
  let minDistance = Infinity;

  // 遍历所有可用无人机，计算到商家的距离
  for (const drone of availableDrones) {
    // 使用 Haversine 公式计算球面距离
    const distance = calculateDistance(drone.position, order.pickupPosition);

    // 如果比当前最短距离更短，更新记录
    if (distance < minDistance) {
      minDistance = distance;
      nearestDrone = drone;
    }
  }

  // 返回找到的最近无人机
  return nearestDrone;
}

/**
 * 批量为多个待分配订单分配无人机
 *
 * @param {Array} orders - 订单数组
 * @param {Array} drones - 无人机数组
 *
 * @returns {Object} 分配结果
 * @returns {Array} result.assigned  - 成功分配的 { order, drone } 配对数组
 * @returns {Array} result.unassigned - 未能分配（无无人机）的订单数组
 *
 * @example
 * const { assigned, unassigned } = batchAssignDrones(pendingOrders, drones);
 * console.log(`成功分配 ${assigned.length} 单，${unassigned.length} 单待分配`);
 */
export function batchAssignDrones(orders, drones) {
  // 筛选出所有"待分配"状态的订单
  const pendingOrders = orders.filter((o) => o.status === 'pending');

  // 分配结果
  const assigned = [];
  const unassigned = [];

  // 逐个处理订单
  for (const order of pendingOrders) {
    // 为当前订单分配无人机
    const drone = assignNearestDrone(order, drones);

    if (drone) {
      // 分配成功
      assigned.push({ order, drone });
    } else {
      // 没有可用无人机
      unassigned.push(order);
    }
  }

  return { assigned, unassigned };
}
