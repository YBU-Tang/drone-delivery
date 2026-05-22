/**
 * ============================================================
 * 无人机飞行模拟服务（Drone Simulation Service）
 * ============================================================
 *
 * 【模拟服务的必要性】
 * 在无人机配送系统中，最核心的体验是"实时看到无人机在地图上移动"。
 * 但在没有真实无人机硬件的情况下，我们需要用代码模拟这个过程。
 *
 * 【模拟什么？】
 * 每隔一定时间（如 2 秒），我们需要：
 *   1. 计算每架无人机的新位置（从当前位置向目标位置移动一小段距离）
 *   2. 更新无人机的电量（飞行消耗电量，充电恢复电量）
 *   3. 检测无人机是否到达目的地
 *   4. 如果到达，更新订单状态和无人机状态
 *   5. 通过 WebSocket 推送更新给所有在线客户端
 *
 * 【定时器 vs 动画帧】
 * - setInterval：按固定时间间隔执行，适合服务器端模拟
 * - requestAnimationFrame：在浏览器中按屏幕刷新率执行，适合客户端动画
 * 这里使用 setInterval，因为是服务端模拟
 */

import { store } from '../store.js';
import { broadcastUpdate } from './websocket.js';

/**
 * 模拟运行状态的引用
 * 注意：这是模块级变量，服务启动后一直存在
 * null 表示模拟未启动，否则存储 setInterval 返回的 timer ID
 */
let simulationInterval = null;

/**
 * 默认飞行速度（单位：米/秒）
 * 当订单没有指定速度时，使用这个默认值
 *
 * 【速度参考】
 * - DJI M300：最大速度 15 m/s（约 54 km/h）
 * - DJI Mavic3：最大速度 20 m/s（约 72 km/h）
 * - DJI FPV：最大速度 18 m/s（约 65 km/h）
 * 这里使用 10 m/s 作为默认速度，是综合考虑的值
 */
const DEFAULT_FLIGHT_SPEED = 10;

/**
 * 模拟步长（毫秒）
 * 每次 tick 之间的时间间隔
 *
 * 【为什么是 2000ms？】
 * - 太短（< 500ms）：CPU 开销大，位置变化太快难以观察
 * - 太长（> 5000ms）：更新不及时，用户体验差
 * - 2000ms（2秒）：每秒 0.5 次更新，位置平滑移动，体验较好
 */
const SIMULATION_INTERVAL_MS = 2000;

/**
 * ─────────────────────────────────────────────────────────────
 * 位置计算函数
 * ─────────────────────────────────────────────────────────────
 *
 * 【功能】
 * 根据当前位置、目标位置和速度，计算下一步的位置。
 *
 * 【算法思路】
 * 1. 计算当前位置到目标位置的总直线距离
 * 2. 计算本次 tick 内能飞行的距离（速度 × 时间）
 * 3. 如果本次飞行就能到达目标，直接返回目标位置
 * 4. 否则，计算移动方向上的一个小步长
 *
 * 【Haversine 距离修正】
 * 经纬度坐标系中，1° 纬度对应的距离是固定的（约 111 km），
 * 但 1° 经度对应的距离随纬度变化（赤道最大，两极最小）。
 * 所以需要用 cos(latitude) 来修正经度距离。
 *
 * @param {Object} currentPos  - 当前 GPS 坐标 { latitude, longitude }
 * @param {Object} targetPos  - 目标 GPS 坐标 { latitude, longitude }
 * @param {number} speed       - 飞行速度（米/秒）
 * @returns {Object}           - { position, remainingDistance, isArrived }
 */
function calculateNextPosition(currentPos, targetPos, speed) {
  // 地球半径（米），用于 Haversine 公式
  const R = 6371000;

  // 计算经纬度差值
  // 这些是角度值，需要转换为弧度才能用于三角函数
  const deltaLon = targetPos.longitude - currentPos.longitude;
  const deltaLat = targetPos.latitude - currentPos.latitude;

  // ─────────────────────────────────────────────────────────
  // 步骤 1：计算总距离
  // ─────────────────────────────────────────────────────────
  // 使用简化的平面距离公式（适用于小范围区域）
  // deltaLat * R       = 纬度方向的距离（米）
  // deltaLon * R * cos = 经度方向的距离（米），需要用 cos(latitude) 修正
  //
  // 【为什么不用完整的 Haversine 公式？】
  // 因为我们已经知道 deltaLat 和 deltaLon，直接乘以系数更简单。
  // Haversine 是为了处理大圆距离，对于上海地区几公里范围，这个近似足够准确。
  const totalDistance = Math.sqrt(
    // 纬度方向距离的平方
    (deltaLat * R) ** 2 +
    // 经度方向距离的平方（需要 cos 修正，因为经度线在极点汇聚）
    (deltaLon * R * Math.cos(currentPos.latitude * Math.PI / 180)) ** 2
  );

  // ─────────────────────────────────────────────────────────
  // 步骤 2：计算本次 tick 能飞行的距离
  // ─────────────────────────────────────────────────────────
  // 距离 = 速度 × 时间
  // SIMULATION_INTERVAL_MS / 1000 将毫秒转换为秒
  const distanceThisStep = speed * (SIMULATION_INTERVAL_MS / 1000);

  // ─────────────────────────────────────────────────────────
  // 步骤 3：判断是否到达目的地
  // ─────────────────────────────────────────────────────────
  const remainingDistance = totalDistance - distanceThisStep;

  // 如果剩余距离 <= 0，说明本次飞行就能到达（或刚好到达）
  if (remainingDistance <= 0) {
    return {
      position: targetPos,           // 精确到达目标位置
      remainingDistance: 0,          // 无剩余距离
      isArrived: true,               // 标记为已到达
    };
  }

  // ─────────────────────────────────────────────────────────
  // 步骤 4：计算本次移动后的新位置
  // ─────────────────────────────────────────────────────────
  // 使用线性插值（Linear Interpolation）
  // 原理：在两点之间按比例取点
  // ratio = distanceThisStep / totalDistance = 本次飞行占总距离的比例
  // 如果飞行 1/10 的距离，新位置的纬度 = 起点纬度 + 差值 × 1/10
  const ratio = distanceThisStep / totalDistance;

  return {
    // 线性插值计算新坐标
    position: {
      latitude: currentPos.latitude + deltaLat * ratio,
      longitude: currentPos.longitude + deltaLon * ratio,
    },
    remainingDistance,  // 剩余距离（米）
    isArrived: false,    // 尚未到达
  };
}

/**
 * 启动模拟服务
 *
 * 【幂等性设计】
 * if (simulationInterval) return;
 * 这行代码确保即使多次调用 startSimulation，也不会创建多个定时器。
 * 这叫"幂等性"（Idempotency）：多次执行和一次执行的效果相同。
 */
export function startSimulation() {
  if (simulationInterval) return; // 防止重复启动

  // 标记模拟为运行状态
  store.simulationRunning = true;

  // 创建定时器，每隔 SIMULATION_INTERVAL_MS 毫秒执行一次 tick
  // setInterval 返回一个 timer ID，可用于 later 清除定时器
  simulationInterval = setInterval(tick, SIMULATION_INTERVAL_MS);

  console.log('[Simulation] Started');
}

/**
 * 停止模拟服务
 *
 * 【内存泄漏防护】
 * 当不再需要定时器时，必须调用 clearInterval 来停止它。
 * 否则定时器会继续运行，阻止 Node.js 进程退出（对于守护进程）或造成 CPU 浪费。
 */
export function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval); // 停止定时器
    simulationInterval = null;         // 重置引用，防止误用
  }
  store.simulationRunning = false;
  console.log('[Simulation] Stopped');
}

/**
 * 模拟主循环
 * 每次 tick 的执行逻辑
 *
 * 【为什么叫 "tick"？】
 * 这是游戏开发中的常用术语，意思是"每帧"或"每个时间步"。
 * 类似于心脏跳动（tick-tock），每个 tick 代表一次模拟推进。
 */
function tick() {
  // 如果模拟被暂停，跳过本次 tick
  if (!store.simulationRunning) return;

  let hasUpdate = false; // 标记本次 tick 是否有数据变化

  // ─────────────────────────────────────────────────────────
  // 遍历所有无人机，更新位置和状态
  // ─────────────────────────────────────────────────────────
  for (const drone of store.drones) {
    // 只处理正在飞行（配送中或返航中）的无人机
    // idle（空闲）、charging（充电）、maintenance（维护）的无人机不需要移动
    if (drone.status !== 'dispatching' && drone.status !== 'returning') {
      continue;
    }

    // ─────────────────────────────────────────────────────────
    // 查找该无人机正在执行的订单
    // ─────────────────────────────────────────────────────────
    // 可能存在状态不一致的情况（如订单已取消但无人机仍在执行），
    // 所以要同时检查订单状态
    const activeOrder = store.orders.find(
      (o) =>
        o.id === drone.currentTask &&  // 订单 ID 匹配
        (o.status === 'pickingUp' || o.status === 'delivering' || o.status === 'assigned')
        // 订单必须处于这三个状态之一（正在取货或配送中）
    );

    // 如果没有找到匹配的订单，跳过这架无人机
    if (!activeOrder) continue;

    // ─────────────────────────────────────────────────────────
    // 确定目标位置
    // ─────────────────────────────────────────────────────────
    // 配送流程：
    //   assigned  → 去取货点 → pickingUp → 去配送点 → delivering → delivered
    // 当订单状态是 assigned 或 pickingUp 时，无人机飞向取货点
    // 当订单状态是 delivering 时，无人机飞向配送点
    const targetPos =
      activeOrder.status === 'assigned' || activeOrder.status === 'pickingUp'
        ? activeOrder.pickupPosition     // 去商家取货
        : activeOrder.deliveryPosition;  // 去客户处配送

    // 获取飞行速度（优先使用无人机当前速度，否则使用默认值）
    const speed = drone.currentSpeed || DEFAULT_FLIGHT_SPEED;

    // ─────────────────────────────────────────────────────────
    // 计算新位置
    // ─────────────────────────────────────────────────────────
    const result = calculateNextPosition(drone.position, targetPos, speed);

    // 更新无人机的位置
    drone.position = result.position;
    // 如果到达目的地，速度设为 0；否则保持当前速度
    drone.currentSpeed = result.isArrived ? 0 : speed;

    // ─────────────────────────────────────────────────────────
    // 处理到达事件
    // ─────────────────────────────────────────────────────────
    if (result.isArrived) {
      hasUpdate = true;

      if (activeOrder.status === 'assigned') {
        // 状态：assigned → pickingUp
        // 含义：无人机到达商家位置，准备取货
        activeOrder.status = 'pickingUp';
        activeOrder.timeline.pickedUp = new Date().toISOString();
      } else if (activeOrder.status === 'pickingUp') {
        // 状态：pickingUp → delivering
        // 含义：取货完成，开始配送
        // 注意：这里也设置 pickedUp 时间（如果之前没有设置的话）
        activeOrder.timeline.pickedUp = activeOrder.timeline.pickedUp || new Date().toISOString();
        activeOrder.status = 'delivering';
        drone.status = 'dispatching'; // 无人机继续配送
      } else if (activeOrder.status === 'delivering') {
        // 状态：delivering → delivered
        // 含义：配送完成！
        activeOrder.status = 'delivered';
        activeOrder.timeline.delivered = new Date().toISOString();
        // 无人机任务完成，回归空闲状态
        drone.status = 'idle';
        drone.currentTask = null; // 清除当前任务
      }
    }

    hasUpdate = true;
  }

  // ─────────────────────────────────────────────────────────
  // 更新无人机电量
  // ─────────────────────────────────────────────────────────
  for (const drone of store.drones) {
    // 飞行中的无人机消耗电量（每 tick 减少 0.2%）
    // 注意：这个消耗速度是任意的，实际应根据飞行距离和载重计算
    if (drone.status === 'dispatching' || drone.status === 'returning') {
      // Math.max(0, ...) 确保电量不会降到 0 以下
      drone.battery = Math.max(0, drone.battery - 0.2);
      hasUpdate = true;
    }
    // 充电中的无人机恢复电量（每 tick 增加 2%）
    // 注意：实际充电速度取决于充电器功率
    if (drone.status === 'charging' && drone.battery < 100) {
      // Math.min(100, ...) 确保电量不会超过 100%
      drone.battery = Math.min(100, drone.battery + 2);
      hasUpdate = true;
    }
  }

  // ─────────────────────────────────────────────────────────
  // 推送更新给客户端
  // ─────────────────────────────────────────────────────────
  // 只有当有数据变化时才推送，减少不必要的网络传输
  if (hasUpdate) {
    broadcastUpdate('state_update', {
      drones: store.drones,   // 最新的无人机状态
      orders: store.orders,   // 最新的订单状态
    });
  }
}
