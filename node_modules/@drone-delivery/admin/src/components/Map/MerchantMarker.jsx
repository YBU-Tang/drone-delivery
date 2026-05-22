/**
 * ============================================================
 * 商家地图标记组件（Merchant Marker）
 * ============================================================
 *
 * 【功能】
 * 在 Leaflet 地图上渲染商家的位置标记。
 * 标记使用红色圆形图标，带有一个房屋 SVG 图标。
 *
 * 【与无人机标记的区别】
 * - 商家标记是静态的（颜色不随状态变化）
 * - 商家使用单一的红色图标，区分于其他类型的标记
 * - 标记不可旋转（无人机有朝向概念）
 */

import { memo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

/**
 * 商家图标
 *
 * 【设计说明】
 * 使用圆形背景 + 房屋图标：
 *   - 红色背景（#ef4444）与品牌色呼应
 *   - 白色边框和图标，保证在红色背景上的可读性
 *   - 36×36 的尺寸，比无人机图标稍大，便于点击
 *
 * 【L.divIcon 的参数】
 * - html：自定义 HTML 内容
 * - className：CSS 类名（用于 Leaflet 定位）
 * - iconSize：图标尺寸 [宽, 高]
 * - iconAnchor：锚点位置（[18, 18] 表示中心点）
 * - popupAnchor：弹出框相对图标的位置（向上偏移 18px）
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
      <!-- 房屋 SVG 图标 -->
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
        <!-- 房屋屋顶和墙体路径 -->
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <!-- 门 -->
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    </div>
  `,
  className: 'merchant-marker',  // 用于自定义样式（如调整 z-index）
  iconSize: [36, 36],          // 图标尺寸
  iconAnchor: [18, 18],        // 锚点在中心
  popupAnchor: [0, -18],       // 弹出框向上偏移一个图标高度
});

/**
 * 商家标记组件
 *
 * 【memo 的作用】
 * 当父组件重渲染时，如果 merchants 数组没有变化，
 * memo 包装的子组件不会重新渲染，提升性能。
 */
function MerchantMarkerInner({ merchant, onClick }) {
  return (
    /**
     * Marker：Leaflet 标记
     *
     * position 使用 [纬度, 经度] 格式。
     * 商家位置存储在 merchant.position 对象中。
     */
    <Marker
      position={[merchant.position.latitude, merchant.position.longitude]}
      icon={merchantIcon}
      eventHandlers={{ click: onClick }}
    >
      {/**
       * Popup：商家信息弹出框
       *
       * 显示内容：
       * - 商家名称
       * - ID、类别、评分
       * - 联系电话、地址
       * - 营业状态
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
            <p>
              <span className="text-gray-500">状态:</span>{' '}
              {merchant.status === 'active' ? '营业中' : '休息中'}
            </p>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export default memo(MerchantMarkerInner);
