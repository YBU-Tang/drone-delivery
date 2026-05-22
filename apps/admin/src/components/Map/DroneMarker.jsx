/**
 * ============================================================
 * 无人机地图标记组件（Drone Marker）
 * ============================================================
 *
 * 【功能】
 * 在 Leaflet 地图上渲染无人机的位置标记。
 * 标记的颜色根据无人机状态变化，点击可查看详情。
 *
 * 【Leaflet 自定义图标】
 * Leaflet 默认的蓝色图标不够直观，我们用 divIcon 自定义：
 *   - 使用 SVG 绘制一个四轴无人机的形状
 *   - 根据状态改变颜色（空闲绿、配送蓝、返航黄等）
 *
 * 【memo 优化】
 * React.memo() 包装组件，可以避免无人机数据未变化时的重新渲染。
 * 这是 React 的性能优化技巧，尤其在列表渲染中很重要。
 */

import { useMemo, memo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { DRONE_STATUS } from '@shared/constants.js';

/**
 * 状态到颜色的映射
 *
 * 【为什么用对象而不是 switch？】
 * 对象映射更简洁，查找效率是 O(1)。
 * 适合状态数量固定、不会动态变化的场景。
 *
 * 【颜色语义】
 * - 绿色（idle）：一切正常，可以接受任务
 * - 蓝色（dispatching）：正在执行配送任务
 * - 黄色（returning）：任务完成或电量不足，正在返航
 * - 灰色（charging）：正在充电，暂时不可用
 * - 红色（maintenance）：维护中，完全不可用
 */
const STATUS_COLORS = {
  [DRONE_STATUS.IDLE]: '#22c55e',          // 绿色 - 空闲
  [DRONE_STATUS.DISPATCHING]: '#3b82f6',   // 蓝色 - 配送中
  [DRONE_STATUS.RETURNING]: '#f59e0b',     // 黄色 - 返航中
  [DRONE_STATUS.CHARGING]: '#6b7280',       // 灰色 - 充电中
  [DRONE_STATUS.MAINTENANCE]: '#ef4444',    // 红色 - 维护中
};

/**
 * 创建无人机图标
 *
 * 【Leaflet divIcon】
 * divIcon 允许使用 HTML/CSS 而非图片作为图标标记。
 * 适合动态样式（如根据状态改变颜色）。
 *
 * 【SVG 无人机图标】
 * 使用 SVG 绘制一个简化的四轴飞行器形状：
 *   - 中心是机身
 *   - 四个方向是旋翼臂
 *   - fill 属性决定颜色
 *
 * 【参数】
 * @param {string} color - 图标颜色（十六进制）
 * @returns {L.DivIcon} Leaflet 图标实例
 */
function createDroneIcon(color) {
  // SVG 视图：24×24 的正方形区域
  // d 属性定义四轴飞行器的路径
  // fill="${color}" 使用传入的颜色
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32">
      <path d="M12 2L8 6H4L6 8L2 12L6 16L4 18H8L12 22L16 18H20L18 16L22 12L18 8L20 6H16L12 2Z"/>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'drone-marker',      // CSS 类名，可用于自定义样式
    iconSize: [32, 32],             // 图标尺寸
    iconAnchor: [16, 16],           // 图标锚点（相对于 iconSize 的比例）
    popupAnchor: [0, -16],          // 弹出窗口相对于图标的位置
  });
}

/**
 * 状态文本映射（用于显示）
 */
const STATUS_TEXT = {
  idle: '空闲',
  dispatching: '配送中',
  returning: '返航中',
  charging: '充电中',
  maintenance: '维护中',
};

/**
 * 无人机标记组件
 *
 * 【memo 的作用】
 * memo() 包装后，只有当 props.drone 或 props.onClick 变化时，
 * 组件才会重新渲染。
 * 在地图上可能有几十个无人机标记，这个优化很有必要。
 *
 * 【useMemo 的作用】
 * 图标对象的创建是相对昂贵的操作（涉及 SVG 解析、DOM 创建）。
 * 用 useMemo 缓存后，只有 drone.status 变化时才重新创建图标。
 */
function DroneMarkerInner({ drone, onClick }) {
  // 根据无人机状态选择颜色，创建对应的图标
  // 依赖只有 drone.status，所以只有状态变化时才重新创建图标
  const icon = useMemo(() => {
    const color = STATUS_COLORS[drone.status] || STATUS_COLORS[DRONE_STATUS.IDLE];
    return createDroneIcon(color);
  }, [drone.status]);

  return (
    /**
     * Marker：Leaflet 标记组件
     *
     * position: [纬度, 经度]
     * Leaflet 使用 [lat, lng] 顺序，与 GeoJSON 的 [lng, lat] 相反！
     *
     * icon: 自定义图标，替代默认的蓝色针形标记
     *
     * eventHandlers: 事件处理器
     * click: 点击事件，调用 onClick 回调
     */
    <Marker
      position={[drone.position.latitude, drone.position.longitude]}
      icon={icon}
      eventHandlers={{ click: onClick }}
    >
      {/**
       * Popup：点击标记后弹出的信息框
       *
       * Popup 是 Marker 的子组件，会在点击标记时显示。
       * 内容是普通的 HTML/JSX 渲染。
       */}
      <Popup>
        <div className="min-w-[200px]">
          {/* 标题：无人机名称 */}
          <h3 className="font-bold text-lg mb-2">{drone.name}</h3>

          {/* 详情列表 */}
          <div className="space-y-1 text-sm">
            <p><span className="text-gray-500">ID:</span> {drone.id}</p>
            <p><span className="text-gray-500">型号:</span> {drone.model}</p>
            <p><span className="text-gray-500">电量:</span> {drone.battery}%</p>
            <p><span className="text-gray-500">状态:</span> {STATUS_TEXT[drone.status] || drone.status}</p>
            <p><span className="text-gray-500">速度:</span> {drone.currentSpeed} m/s</p>
            <p>
              <span className="text-gray-500">位置:</span>{' '}
              {/* toFixed(6) 保留 6 位小数，约 0.1 米的精度 */}
              {drone.position.latitude.toFixed(6)}, {drone.position.longitude.toFixed(6)}
            </p>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

// 使用 memo 包装，避免不必要的重新渲染
// DroneMarkerInner 本身不接收 children，所以可以直接用 memo
export default memo(DroneMarkerInner);
