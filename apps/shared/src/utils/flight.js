/**
 * ============================================================
 * 飞行计算工具（Flight Utilities）
 * ============================================================
 *
 * 【功能】
 * 提供无人机飞行相关的计算函数：
 *   1. 计算下一个位置（匀速飞行模型）
 *   2. 计算预计飞行时间
 *   3. 格式化时间显示
 */

import { DEFAULT_FLIGHT_SPEED } from '../constants.js';

/**
 * 计算匀速飞行后的下一个位置
 *
 * 【飞行模型】
 * 假设无人机以恒定速度沿直线飞行，
 * 每隔一段时间（如 1 秒）计算一次新位置。
 *
 * 【算法步骤】
 * 1. 计算总距离（当前位置到目标位置）
 * 2. 计算本次飞行能覆盖的距离（速度 × 时间）
 * 3. 如果能到达目标，直接返回目标位置
 * 4. 否则，按比例计算新位置（线性插值）
 *
 * @param {Object} currentPos - 当前位置 { latitude, longitude }
 * @param {Object} targetPos - 目标位置 { latitude, longitude }
 * @param {number} speed - 飞行速度（米/秒），默认 10 m/s
 * @param {number} timeInterval - 时间间隔（毫秒），默认 1000 ms
 *
 * @returns {Object} 飞行结果
 * @returns {Object} result.position - 新位置 { latitude, longitude }
 * @returns {number} result.remainingDistance - 剩余距离（米）
 * @returns {boolean} result.isArrived - 是否已到达目的地
 *
 * @example
 * const result = calculateNextPosition(
 *   { latitude: 31.2304, longitude: 121.4737 },
 *   { latitude: 31.2400, longitude: 121.4900 },
 *   10,  // 10 m/s
 *   1000 // 1 秒后
 * );
 * console.log(result);
 * // { position: { latitude: 31.2313, longitude: 121.4749 }, remainingDistance: 1580, isArrived: false }
 */
export function calculateNextPosition(
  currentPos,
  targetPos,
  speed = DEFAULT_FLIGHT_SPEED,
  timeInterval = 1000
) {
  const R = 6371000; // 地球半径（米）

  // 计算经纬度差值
  const deltaLon = targetPos.longitude - currentPos.longitude;
  const deltaLat = targetPos.latitude - currentPos.latitude;

  // ─────────────────────────────────────────────────────────
  // 步骤 1：计算总距离
  // ─────────────────────────────────────────────────────────
  // 使用简化的平面距离公式（适用于小范围区域，几公里内误差很小）
  // 纬度方向的 1° 对应约 111 km
  // 经度方向的 1° 对应 111 km × cos(纬度)
  const totalDistance = Math.sqrt(
    Math.pow(deltaLat * R, 2) +
    Math.pow(deltaLon * R * Math.cos(currentPos.latitude * Math.PI / 180), 2)
  );

  // ─────────────────────────────────────────────────────────
  // 步骤 2：计算本次飞行能覆盖的距离
  // ─────────────────────────────────────────────────────────
  // 距离 = 速度 × 时间
  // timeInterval 是毫秒，需要除以 1000 转为秒
  const distanceThisStep = (speed * timeInterval) / 1000;

  // ─────────────────────────────────────────────────────────
  // 步骤 3：判断是否到达
  // ─────────────────────────────────────────────────────────
  const remainingDistance = totalDistance - distanceThisStep;

  // 如果剩余距离 <= 0，说明本次飞行就能到达
  if (remainingDistance <= 0) {
    return {
      position: targetPos,
      remainingDistance: 0,
      isArrived: true,
    };
  }

  // ─────────────────────────────────────────────────────────
  // 步骤 4：线性插值计算新位置
  // ─────────────────────────────────────────────────────────
  // ratio = 本次飞行距离 / 总距离
  // 新纬度 = 起点纬度 + 纬度差 × ratio
  const ratio = distanceThisStep / totalDistance;
  const newLat = currentPos.latitude + deltaLat * ratio;
  const newLon = currentPos.longitude + deltaLon * ratio;

  return {
    position: { latitude: newLat, longitude: newLon },
    remainingDistance,
    isArrived: false,
  };
}

/**
 * 计算预计飞行时间
 *
 * @param {number} distance - 飞行距离（米）
 * @param {number} speed - 飞行速度（米/秒），默认 10 m/s
 *
 * @returns {number} 预计时间（秒）
 *
 * @example
 * calculateEstimatedTime(1000);  // 100 秒（约 1 分 40 秒）
 * calculateEstimatedTime(5000, 20);  // 250 秒（约 4 分 10 秒）
 */
export function calculateEstimatedTime(distance, speed = DEFAULT_FLIGHT_SPEED) {
  // 向上取整，避免时间显示为 0
  return Math.ceil(distance / speed);
}

/**
 * 格式化时间为 MM:SS 格式
 *
 * @param {number} seconds - 秒数
 *
 * @returns {string} 格式化后的时间字符串
 *
 * @example
 * formatTime(65);   // "01:05"
 * formatTime(3600); // "60:00"
 * formatTime(125);  // "02:05"
 */
export function formatTime(seconds) {
  // 计算分钟和秒数
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  // 不足两位前面补 0
  // padStart(2, '0')：如果字符串长度不足 2，用 '0' 补齐
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
