/**
 * ============================================
 * MapContainer.jsx - 地图容器组件
 * ============================================
 * 
 * 【Leaflet 是什么？】
 * Leaflet 是一个开源的 JavaScript 地图库
 * - 轻量级，容易使用
 * - 支持多种地图瓦片源（OpenStreetMap, Google Maps 等）
 * - 支持标记、折线、多边形等地图元素
 * 
 * 【React-Leaflet 是什么？】
 * React-Leaflet 是 Leaflet 的 React 封装
 * - 把 Leaflet 的 JS API 转成 React 组件
 * - 更符合 React 的开发习惯
 * 
 * 【核心组件】
 * 
 * 1. MapContainer - 地图容器
 *    所有地图组件必须包在它里面
 *    属性：
 *    - center: 地图中心点 [纬度, 经度]
 *    - zoom: 缩放级别 (1-18)
 * 
 * 2. TileLayer - 地图瓦片层
 *    就是我们看到的地图图片
 *    url 格式：{z}/{x}/{y}
 *    - z: 缩放级别
 *    - x: 瓦片列号
 *    - y: 瓦片行号
 * 
 * 3. Marker - 标记点
 *    在地图上显示一个位置
 *    - position: 位置 [纬度, 经度]
 *    - icon: 自定义图标
 * 
 * 4. Popup - 弹出信息框
 *    点击 Marker 后显示的信息
 * 
 * 【useMap 是什么？】
 * useMap 是一个 Hook，用于获取地图实例
 * 可以调用地图的方法，如 setView(), panTo() 等
 */

import { MapContainer as LeafletMap, TileLayer, useMap } from 'react-leaflet';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@shared/constants.js';
import DroneMarker from './DroneMarker';
import MerchantMarker from './MerchantMarker';

/**
 * MapController 组件
 * 用于程序化控制地图
 * 
 * 为什么需要这个组件？
 * Leaflet 的 MapContainer 的 center 属性只在初始化时生效
 * 如果需要动态更新地图中心，就需要用 useMap 来设置
 * 
 * @param {Array} center - 地图中心点 [纬度, 经度]
 * @param {number} zoom - 缩放级别
 */
function MapController({ center, zoom }) {
  // useMap() - 获取地图实例
  // 这是 react-leaflet 提供的 Hook
  const map = useMap();
  
  // 如果传入了 center，就更新地图视图
  if (center) {
    // setView(center, zoom) - 设置地图中心和缩放级别
    map.setView(center, zoom || map.getZoom());
  }
  
  // MapController 不渲染任何 DOM 元素
  // 它只是通过 Hook 控制地图
  return null;
}

/**
 * MapContainer 主组件
 * 封装了整个地图功能
 * 
 * @param {Array} center - 地图中心点，默认上海市浦东新区
 * @param {number} zoom - 缩放级别，默认 13
 * @param {Array} drones - 无人机列表
 * @param {Array} merchants - 商家列表
 * @param {Function} onDroneClick - 点击无人机回调
 * @param {Function} onMerchantClick - 点击商家回调
 */
export default function MapContainer({ 
  center = DEFAULT_MAP_CENTER,    // 默认中心：[31.2304, 121.4737] 上海市浦东新区
  zoom = DEFAULT_MAP_ZOOM,        // 默认缩放级别：13
  drones = [],                     // 无人机列表
  merchants = [],                  // 商家列表
  onDroneClick,                   // 点击无人机回调
  onMerchantClick,                // 点击商家回调
}) {
  return (
    /**
     * LeafletMap - Leaflet 的 MapContainer 封装
     * 
     * className="h-full w-full" - 让地图占满父容器
     * scrollWheelZoom={true} - 允许鼠标滚轮缩放
     */
    <LeafletMap
      center={center}
      zoom={zoom}
      className="h-full w-full"
      scrollWheelZoom={true}  // 滚轮缩放
    >
      {/**
       * TileLayer - 地图瓦片层
       * 
       * OpenStreetMap 瓦片源：
       * https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
       * 
       * {s} 会被替换成 a, b, c 等，用于负载均衡
       * 
       * attribution - 地图右下角的版权信息
       */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/**
       * MapController - 地图控制器
       * 用于响应式更新地图中心点
       */}
      <MapController center={center} zoom={zoom} />
      
      {/**
       * 遍历商家列表，渲染每个商家的标记点
       * 
       * key={merchant.id} - React 的列表渲染要求每个元素有唯一 key
       * 这有助于 React 高效地更新列表
       */}
      {merchants.map((merchant) => (
        <MerchantMarker
          key={merchant.id}
          merchant={merchant}
          onClick={() => onMerchantClick?.(merchant)}
        />
      ))}
      
      {/**
       * 遍历无人机列表，渲染每个无人机的标记点
       */}
      {drones.map((drone) => (
        <DroneMarker
          key={drone.id}
          drone={drone}
          onClick={() => onDroneClick?.(drone)}
        />
      ))}
      
    </LeafletMap>
  );
}

/**
 * 【地图缩放级别参考】
 * 
 * zoom: 1  - 世界地图
 * zoom: 5  - 大洲
 * zoom: 10 - 城市
 * zoom: 13 - 城区（我们默认使用的级别）
 * zoom: 15 - 街道
 * zoom: 18 - 具体建筑
 */

/**
 * 【组件层级结构】
 * 
 * <MapContainer>
 *   ├── <TileLayer />              地图底图
 *   ├── <MapController />          地图控制器
 *   ├── <MerchantMarker /> × N     商家标记（多个）
 *   │     └── <Popup>             点击弹出的信息
 *   └── <DroneMarker /> × N       无人机标记（多个）
 *         └── <Popup>             点击弹出的信息
 */
