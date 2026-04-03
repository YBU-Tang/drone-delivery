import { calculateDistance } from './distance.js';
import { DRONE_STATUS } from '../constants.js';

/**
 * 根据就近原则为订单分配无人机
 * @param {Object} order - 订单信息 {pickupPosition}
 * @param {Array} drones - 无人机列表
 * @returns {Object|null} 分配的无人机或null
 */
export function assignNearestDrone(order, drones) {
  const availableDrones = drones.filter(
    (drone) => drone.status === DRONE_STATUS.IDLE && drone.battery > 20
  );

  if (availableDrones.length === 0) {
    return null;
  }

  let nearestDrone = null;
  let minDistance = Infinity;

  for (const drone of availableDrones) {
    const distance = calculateDistance(drone.position, order.pickupPosition);
    if (distance < minDistance) {
      minDistance = distance;
      nearestDrone = drone;
    }
  }

  return nearestDrone;
}

/**
 * 为订单列表批量分配无人机
 * @param {Array} orders - 待分配订单列表
 * @param {Array} drones - 无人机列表
 * @returns {Object} 分配结果 {assigned: [], unassigned: []}
 */
export function batchAssignDrones(orders, drones) {
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const assigned = [];
  const unassigned = [];

  for (const order of pendingOrders) {
    const drone = assignNearestDrone(order, drones);
    if (drone) {
      assigned.push({ order, drone });
    } else {
      unassigned.push(order);
    }
  }

  return { assigned, unassigned };
}
