/**
 * ============================================================
 * 距离计算工具（Distance Utilities）
 * ============================================================
 *
 * 【功能】
 * 提供地理坐标之间的距离计算和格式化功能。
 *
 * 【Haversine 公式】
 * 这是计算地球表面两点间最短距离（大圆距离）的标准算法。
 * 假设地球是一个完美的球体（半径 6371 km），计算误差在 0.3% 以内。
 *
 * 【公式原理】
 * 设两点经纬度为 (lat1, lon1) 和 (lat2, lon2)，
 * 球面上两点间的角距离 d 由以下公式给出：
 *
 *   a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
 *   d = 2 × R × atan2(√a, √(1-a))
 *
 * 其中 R = 6371 km 是地球平均半径。
 */

const EARTH_RADIUS_METERS = 6371000; // 地球平均半径（米）

/**
 * 角度转弧度
 *
 * 【为什么需要转换？】
 * JavaScript 的三角函数（Math.sin, Math.cos 等）接受弧度制参数。
 * 而我们通常使用角度（degree），如上海纬度约 31°。
 *
 * @param {number} degrees - 角度值
 * @returns {number} 弧度值
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * 使用 Haversine 公式计算两点间的球面距离
 *
 * @param {Object} pos1 - 第一个位置的 GPS 坐标
 * @param {number} pos1.latitude  - 第一个位置的纬度（度）
 * @param {number} pos1.longitude - 第一个位置的经度（度）
 * @param {Object} pos2 - 第二个位置的 GPS 坐标（格式同上）
 *
 * @returns {number} 两点间的距离（米）
 *
 * @example
 * calculateDistance(
 *   { latitude: 31.2304, longitude: 121.4737 },  // 上海
 *   { latitude: 31.2400, longitude: 121.4900 }   // 陆家嘴
 * ); // 返回约 1580（米）
 */
export function calculateDistance(pos1, pos2) {
  // ─────────────────────────────────────────────────────────
  // 步骤 1：将所有角度转换为弧度
  // ─────────────────────────────────────────────────────────
  const lat1 = toRadians(pos1.latitude);
  const lat2 = toRadians(pos2.latitude);
  const deltaLat = toRadians(pos2.latitude - pos1.latitude);
  const deltaLon = toRadians(pos2.longitude - pos1.longitude);

  // ─────────────────────────────────────────────────────────
  // 步骤 2：计算半正矢值（a）
  // ─────────────────────────────────────────────────────────
  // sin²(x) = (1 - cos(2x)) / 2，但 Math.sin(x) ** 2 更直观
  const sinDeltaLat = Math.sin(deltaLat / 2);
  const sinDeltaLon = Math.sin(deltaLon / 2);

  const a =
    sinDeltaLat * sinDeltaLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDeltaLon * sinDeltaLon;

  // ─────────────────────────────────────────────────────────
  // 步骤 3：计算圆心角（c）
  // ─────────────────────────────────────────────────────────
  // atan2(y, x) 是 atan(y/x) 的更安全版本，能正确处理所有象限
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // ─────────────────────────────────────────────────────────
  // 步骤 4：计算弧长 = 半径 × 角距离
  // ─────────────────────────────────────────────────────────
  return EARTH_RADIUS_METERS * c;
}

/**
 * 格式化距离为可读字符串
 *
 * @param {number} meters - 距离（米）
 * @returns {string} 格式化后的字符串
 *
 * @example
 * formatDistance(150);    // "150米"
 * formatDistance(1500);   // "1.50公里"
 * formatDistance(15000);  // "15.00公里"
 */
export function formatDistance(meters) {
  if (meters < 1000) {
    // 不足 1 公里，显示米
    return `${Math.round(meters)}米`;
  }
  // 超过 1 公里，显示公里（保留 2 位小数）
  return `${(meters / 1000).toFixed(2)}公里`;
}
