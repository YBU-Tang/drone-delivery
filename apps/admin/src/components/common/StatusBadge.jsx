/**
 * ============================================================
 * 状态徽章组件（Status Badge）
 * ============================================================
 *
 * 【功能】
 * 统一显示无人机和订单的状态。
 * 每个状态对应一种颜色，使用户一眼就能识别状态类型。
 *
 * 【设计原则】
 * - 颜色语义化：不同状态使用不同颜色，用户无需阅读文字即可理解
 * - 圆角药丸形状：视觉上更柔和，也更符合现代 UI 设计趋势
 * - Tailwind CSS：使用原子化 CSS 类快速构建样式
 */

import { DRONE_STATUS_TEXT } from '@shared/constants.js';

/**
 * 无人机状态到颜色的映射
 *
 * 【为什么用 Tailwind 的 text/bg 类？】
 * Tailwind 的颜色类（如 bg-green-100）会被编译成具体的 CSS 类。
 * 组合使用 text-*（文字颜色）和 bg-*（背景颜色）实现层次感。
 */
const statusColors = {
  idle: 'bg-green-100 text-green-800',         // 绿色背景 + 深绿文字
  dispatching: 'bg-blue-100 text-blue-800',     // 蓝色
  returning: 'bg-yellow-100 text-yellow-800',   // 黄色
  charging: 'bg-gray-100 text-gray-800',       // 灰色
  maintenance: 'bg-red-100 text-red-800',       // 红色
};

/**
 * 订单状态到颜色的映射
 */
const orderStatusColors = {
  pending: 'bg-gray-100 text-gray-800',     // 灰色 - 待处理
  assigned: 'bg-blue-100 text-blue-800',    // 蓝色 - 已分配
  pickingUp: 'bg-yellow-100 text-yellow-800', // 黄色 - 取货中
  delivering: 'bg-blue-100 text-blue-800',  // 蓝色 - 配送中
  delivered: 'bg-green-100 text-green-800',  // 绿色 - 已完成
  cancelled: 'bg-red-100 text-red-800',     // 红色 - 已取消
};

/**
 * 无人机状态徽章
 *
 * @param {string} status - 无人机状态
 * @returns {JSX.Element} 状态徽章组件
 */
export function DroneStatusBadge({ status }) {
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        statusColors[status] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {DRONE_STATUS_TEXT[status] || status}
    </span>
  );
}

/**
 * 订单状态徽章
 *
 * @param {string} status - 订单状态
 * @returns {JSX.Element} 状态徽章组件
 */
export function OrderStatusBadge({ status }) {
  const statusText = {
    pending: '待分配',
    assigned: '已分配',
    pickingUp: '取货中',
    delivering: '配送中',
    delivered: '已送达',
    cancelled: '已取消',
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        orderStatusColors[status] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {statusText[status] || status}
    </span>
  );
}
