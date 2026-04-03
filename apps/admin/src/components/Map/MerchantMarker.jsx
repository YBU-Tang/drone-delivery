/**
 * ============================================
 * MerchantMarker.jsx - 商家地图标记组件
 * ============================================
 * 
 * 【组件功能】
 * 在地图上显示商家的位置标记
 * 点击标记可以查看商家详细信息
 * 
 * 【与 DroneMarker 的区别】
 * - 商家标记：红色房子图标，固定不变
 * - 无人机标记：根据状态变色，模拟飞行
 */

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

/**
 * 商家图标
 * 使用 L.divIcon 创建自定义 HTML 图标
 * 
 * 结构：红色圆形背景 + 白色房子 SVG 图标
 */
const merchantIcon = L.divIcon({
  html: `
    <div style="
      background: #ef4444;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    </div>
  `,
  className: 'merchant-marker',
  iconSize: [36, 36],
  iconAnchor: [18, 18],   // 锚点在圆形中心
  popupAnchor: [0, -18],  // 弹出框在图标上方
});

/**
 * MerchantMarker 组件
 * 
 * @param {Object} merchant - 商家数据对象
 * @param {Function} onClick - 点击回调函数
 */
export default function MerchantMarker({ merchant, onClick }) {
  return (
    /**
     * <Marker> - 地图标记点
     * 
     * position: [纬度, 经度]
     * icon: 自定义商家图标
     * eventHandlers: 绑定点击事件
     */
    <Marker
      position={[merchant.position.latitude, merchant.position.longitude]}
      icon={merchantIcon}
      eventHandlers={{ click: onClick }}
    >
      {/**
       * <Popup> - 信息弹窗
       * 显示商家详细信息
       */}
      <Popup>
        <div className="min-w-[200px]">
          <h3 className="font-bold text-lg mb-2">{merchant.name}</h3>
          <div className="space-y-1 text-sm">
            <p><span className="text-gray-500">ID:</span> {merchant.id}</p>
            <p><span className="text-gray-500">类别:</span> {merchant.category}</p>
            <p><span className="text-gray-500">评分:</span> {merchant.rating}</p>
            <p><span className="text-gray-500">电话:</span> {merchant.phone}</p>
            <p><span className="text-gray-500">地址:</span> {merchant.address}</p>
            <p><span className="text-gray-500">状态:</span> {merchant.status === 'active' ? '营业中' : '休息中'}</p>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
