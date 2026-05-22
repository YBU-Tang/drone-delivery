/**
 * ============================================================
 * 地图容器组件（Map Container）
 * ============================================================
 *
 * 【功能】
 * 使用 Leaflet（通过 react-leaflet）渲染交互式地图，
 * 显示无人机和商家的实时位置。
 *
 * 【使用的地图技术】
 * - Leaflet：开源的移动端友好交互式地图库
 * - OpenStreetMap：免费的地图瓦片数据源
 * - react-leaflet：Leaflet 的 React 封装
 *
 * 【Leaflet 核心概念】
 * - MapContainer：地图容器，类似于 <div> 包裹地图
 * - TileLayer：地图瓦片图层（显示街道、地形等背景图）
 * - Marker：在地图上标注点位
 * - Popup：点击标注后弹出的信息框
 * - useMap：子组件访问地图实例的 Hook
 *
 * 【地图坐标系】
 * Leaflet 使用 EPSG:3857（Web Mercator）投影坐标系，
 * 但在 React-Leaflet 中，位置用 [纬度, 经度] 数组表示。
 */

import { MapContainer as LeafletMap, TileLayer, useMap } from 'react-leaflet';
import { useEffect, useRef } from 'react';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@shared/constants.js';
import DroneMarker from './DroneMarker';
import MerchantMarker from './MerchantMarker';

/**
 * 地图视图更新器组件
 *
 * 【功能】
 * 当 props.center 变化时，自动将地图视图平移到指定位置。
 *
 * 【为什么需要这个组件？】
 * Leaflet 的 MapContainer 本身不响应外部的位置变化。
 * 我们需要使用 useMap hook 获取地图实例，然后手动调用 setView()。
 *
 * 【useRef 的使用】
 * useRef 用于存储"不需要触发重新渲染"的值。
 * prevCenter 用于比较新旧位置，避免重复设置（性能优化）。
 */
function MapUpdater({ center, zoom }) {
  // 获取 Leaflet 地图实例
  const map = useMap();

  // 记录上一次的位置，避免重复更新
  const prevCenter = useRef(null);

  /**
   * 当 center 或 zoom 变化时，更新地图视图
   *
   * 【为什么要比较新旧值？】
   * React 的 useEffect 在 props 变化时会执行。
   * 如果新旧值相同，重复调用 setView 会导致不必要的地图动画。
   * 使用 useRef 记录旧值，可以避免这种开销。
   */
  useEffect(() => {
    const lat = center?.[0];
    const lng = center?.[1];

    // 只有提供了有效坐标时才更新
    if (lat != null && lng != null) {
      const same =
        prevCenter.current?.[0] === lat && prevCenter.current?.[1] === lng;

      // 如果位置变化了，才更新视图
      if (!same) {
        prevCenter.current = [lat, lng];
        // map.setView(center, zoom, options)
        // center: [lat, lng] 新中心点
        // zoom: 缩放级别
        // { animate: true }: 是否使用平滑动画
        map.setView([lat, lng], zoom ?? DEFAULT_MAP_ZOOM, { animate: true });
      }
    }
  }, [center, zoom, map]);

  // MapUpdater 不渲染任何 DOM，只负责逻辑控制
  return null;
}

/**
 * 地图容器组件
 *
 * @param {Object} props
 * @param {Array} props.center - 地图中心点 [纬度, 经度]
 * @param {number} props.zoom - 缩放级别（1-18）
 * @param {Array} props.drones - 无人机数据列表
 * @param {Array} props.merchants - 商家数据列表
 * @param {Function} props.onDroneClick - 无人机点击回调
 * @param {Function} props.onMerchantClick - 商家点击回调
 */
export default function MapContainer({
  center,
  zoom = DEFAULT_MAP_ZOOM,
  drones = [],
  merchants = [],
  onDroneClick,
  onMerchantClick,
}) {
  return (
    <div style={{ height: '100%', width: '100%' }}>
      {/**
       * LeafletMap：地图容器
       *
       * 【必须设置的属性】
       * - center：初始中心点坐标 [纬度, 经度]
       * - zoom：初始缩放级别
       * - style：地图的宽高（必须设置，否则不显示）
       *
       * 【可选属性】
       * - scrollWheelZoom：是否允许滚轮缩放
       * - zoomControl：是否显示缩放控制按钮
       */}
      <LeafletMap
        center={DEFAULT_MAP_CENTER}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        {/**
         * TileLayer：地图瓦片图层
         *
         * 【什么是瓦片？】
         * 地图被切成无数小图片（256×256 像素），按层级和坐标加载。
         * 这就是为什么缩放地图时会看到图片"闪烁"加载。
         *
         * 【OpenStreetMap 瓦片服务器】
         * url 模板：https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
         *   - {s}：子域名（a, b, c），用于绕过浏览器并发限制
         *   - {z}：缩放级别
         *   - {x}, {y}：瓦片坐标
         *
         * 【attribution】
         * 必须添加地图数据来源的版权信息，遵守 OpenStreetMap 许可。
         */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/**
         * MapUpdater：地图视图控制器
         * 响应 center prop 的变化，自动平移地图。
         */}
        <MapUpdater center={center} zoom={zoom} />

        {/**
         * MerchantMarker：商家标记
         * 遍历所有商家，渲染对应的地图标记。
         *
         * 【React 列表渲染的 key】
         * key 必须唯一，用于 React 识别每个元素。
         * 这里用 `merchant-${merchant.id}` 确保唯一性。
         */}
        {merchants.map((merchant) => (
          <MerchantMarker
            key={`merchant-${merchant.id}`}
            merchant={merchant}
            onClick={() => onMerchantClick?.(merchant)}
          />
        ))}

        {/**
         * DroneMarker：无人机标记
         * 遍历所有无人机，渲染对应的地图标记。
         */}
        {drones.map((drone) => (
          <DroneMarker
            key={`drone-${drone.id}`}
            drone={drone}
            onClick={() => onDroneClick?.(drone)}
          />
        ))}
      </LeafletMap>
    </div>
  );
}
