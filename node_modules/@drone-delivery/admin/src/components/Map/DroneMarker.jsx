/**
 * ============================================
 * DroneMarker.jsx - 无人机地图标记组件
 * ============================================
 * 
 * 【Marker 在 Leaflet 中的工作原理】
 * 
 * Leaflet Marker = 位置 + 图标
 * 
 * 位置：经纬度坐标 [latitude, longitude]
 * 图标：可以是默认的蓝色水滴，也可以自定义 SVG
 * 
 * 【为什么要自定义图标？】
 * 默认图标是 Leaflet 提供的蓝色水滴
 * 但我们的项目需要：
 * - 用不同颜色表示无人机状态
 * - 用飞机形状表示无人机
 * 
 * 所以使用 L.divIcon 创建自定义图标
 * 
 * 【L.divIcon vs L.icon】
 * 
 * L.icon - 使用图片文件作为图标
 *   const icon = L.icon({
 *     iconUrl: '/path/to/image.png',
 *     iconSize: [32, 32],
 *   });
 * 
 * L.divIcon - 使用 HTML/CSS 作为图标
 *   const icon = L.divIcon({
 *     html: '<div class="my-icon">🛸</div>',
 *     iconSize: [32, 32],
 *   });
 * 
 * 我们使用 SVG 内联 HTML 的方式，更加灵活
 */

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { DRONE_STATUS } from '@shared/constants.js';

/**
 * 无人机状态对应的图标颜色
 * 
 * 颜色语义：
 * - 绿色 (green) - 空闲，可以接单
 * - 蓝色 (blue) - 配送中，正在执行任务
 * - 黄色 (yellow) - 返航中，空载返回
 * - 灰色 (gray) - 充电中
 * - 红色 (red) - 维护中，不可使用
 */
const droneIcons = {
  [DRONE_STATUS.IDLE]: createDroneIcon('#22c55e'),        // 绿色 - 空闲
  [DRONE_STATUS.DISPATCHING]: createDroneIcon('#3b82f6'), // 蓝色 - 配送中
  [DRONE_STATUS.RETURNING]: createDroneIcon('#f59e0b'),   // 黄色 - 返航中
  [DRONE_STATUS.CHARGING]: createDroneIcon('#6b7280'),    // 灰色 - 充电中
  [DRONE_STATUS.MAINTENANCE]: createDroneIcon('#ef4444'), // 红色 - 维护中
};

/**
 * 创建无人机图标
 * @param {string} color - 图标颜色（十六进制）
 * @returns {L.DivIcon} Leaflet DivIcon 对象
 */
function createDroneIcon(color) {
  /**
   * SVG 图形 - 一个八角星形状，代表无人机
   * 
   * fill="${color}" - 使用传入的颜色填充
   */
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32">
      <path d="M12 2L8 6H4L6 8L2 12L6 16L4 18H8L12 22L16 18H20L18 16L22 12L18 8L20 6H16L12 2Z"/>
    </svg>
  `;
  
  /**
   * L.divIcon - 创建自定义 HTML 图标
   * 
   * html: SVG 字符串
   * className: CSS 类名，用于样式定制
   * iconSize: 图标大小 [宽, 高]
   * iconAnchor: 图标锚点位置 [x, y]
   *   锚点定义了图标的哪个点对齐到地图坐标
   *   [16, 16] 表示图标中心对齐坐标点
   * popupAnchor: 弹出框的锚点位置
   *   [0, -16] 表示弹出框在图标上方 16 像素
   */
  return L.divIcon({
    html: svgIcon,
    className: 'drone-marker',  // CSS 类名
    iconSize: [32, 32],        // 图标尺寸
    iconAnchor: [16, 16],       // 锚点在中心
    popupAnchor: [0, -16],      // 弹出框在图标上方
  });
}

/**
 * DroneMarker 组件
 * 在地图上渲染单个无人机的标记
 * 
 * @param {Object} drone - 无人机数据对象
 * @param {Function} onClick - 点击回调函数
 */
export default function DroneMarker({ drone, onClick }) {
  /**
   * 根据无人机状态选择对应颜色的图标
   * 如果状态不在映射中，使用默认的空闲状态图标
   */
  const icon = droneIcons[drone.status] || droneIcons[DRONE_STATUS.IDLE];
  
  return (
    /**
     * <Marker> - Leaflet 标记点组件
     * 
     * position: 标记位置 [纬度, 经度]
     * icon: 自定义图标
     * eventHandlers: 事件处理器
     *   click: 点击事件
     */
    <Marker
      position={[drone.position.latitude, drone.position.longitude]}
      icon={icon}
      eventHandlers={{ click: onClick }}
    >
      {/**
       * <Popup> - 点击标记后弹出的信息框
       * 
       * 内容是一段 HTML，展示无人机的详细信息
       */}
      <Popup>
        <div className="min-w-[200px]">
          <h3 className="font-bold text-lg mb-2">{drone.name}</h3>
          <div className="space-y-1 text-sm">
            <p><span className="text-gray-500">ID:</span> {drone.id}</p>
            <p><span className="text-gray-500">型号:</span> {drone.model}</p>
            <p><span className="text-gray-500">电量:</span> {drone.battery}%</p>
            <p><span className="text-gray-500">状态:</span> {
              drone.status === 'idle' ? '空闲' :
              drone.status === 'dispatching' ? '配送中' :
              drone.status === 'returning' ? '返航中' :
              drone.status === 'charging' ? '充电中' :
              drone.status === 'maintenance' ? '维护中' : drone.status
            }</p>
            <p><span className="text-gray-500">速度:</span> {drone.currentSpeed} m/s</p>
            <p><span className="text-gray-500">位置:</span> {drone.position.latitude.toFixed(6)}, {drone.position.longitude.toFixed(6)}</p>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

/**
 * 【组件使用示例】
 * 
 * const drone = {
 *   id: 'DRONE-001',
 *   name: '无人机-001',
 *   status: 'dispatching',
 *   position: { latitude: 31.2304, longitude: 121.4737 },
 *   battery: 85,
 *   ...
 * };
 * 
 * <DroneMarker drone={drone} onClick={() => console.log('点击了无人机')} />
 * 
 * 渲染结果：
 * 地图上显示一个蓝色八角星图标
 * 点击后弹出信息框，显示无人机详情
 */
