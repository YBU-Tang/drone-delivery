/**
 * 使用 Haversine 公式计算两点之间的球面距离
 * @param {Object} pos1 - 第一个位置 {latitude, longitude}
 * @param {Object} pos2 - 第二个位置 {latitude, longitude}
 * @returns {number} 距离（米）
 */
export function calculateDistance(pos1, pos2) {
  const R = 6371000; // 地球半径（米）
  const lat1 = toRadians(pos1.latitude);
  const lat2 = toRadians(pos2.latitude);
  const deltaLat = toRadians(pos2.latitude - pos1.latitude);
  const deltaLon = toRadians(pos2.longitude - pos1.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * 格式化距离为可读字符串
 * @param {number} meters - 距离（米）
 * @returns {string} 格式化后的字符串
 */
export function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)}米`;
  }
  return `${(meters / 1000).toFixed(2)}公里`;
}
