import { DEFAULT_FLIGHT_SPEED } from '../constants.js';

/**
 * 计算匀速飞行的下一个位置
 * @param {Object} currentPos - 当前位置 {latitude, longitude}
 * @param {Object} targetPos - 目标位置 {latitude, longitude}
 * @param {number} speed - 速度（米/秒）
 * @param {number} timeInterval - 时间间隔（毫秒）
 * @returns {Object} 新位置 {latitude, longitude, remainingDistance, isArrived}
 */
export function calculateNextPosition(currentPos, targetPos, speed = DEFAULT_FLIGHT_SPEED, timeInterval = 1000) {
  const R = 6371000;
  const deltaLon = targetPos.longitude - currentPos.longitude;
  const deltaLat = targetPos.latitude - currentPos.latitude;

  const totalDistance = Math.sqrt(
    Math.pow(deltaLat * R, 2) + Math.pow(deltaLon * R * Math.cos(currentPos.latitude * Math.PI / 180), 2)
  );

  const distanceThisStep = (speed * timeInterval) / 1000;
  const remainingDistance = totalDistance - distanceThisStep;

  if (remainingDistance <= 0) {
    return {
      position: targetPos,
      remainingDistance: 0,
      isArrived: true,
    };
  }

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
 * @param {number} distance - 距离（米）
 * @param {number} speed - 速度（米/秒）
 * @returns {number} 预计时间（秒）
 */
export function calculateEstimatedTime(distance, speed = DEFAULT_FLIGHT_SPEED) {
  return Math.ceil(distance / speed);
}

/**
 * 格式化时间为 MM:SS 格式
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时间字符串
 */
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
