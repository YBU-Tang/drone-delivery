/**
 * ============================================================
 * 仪表盘页面（Dashboard Page）
 * ============================================================
 *
 * 【功能】
 * 系统首页，提供地图总览、关键指标和实时状态。
 *
 * 【页面布局】
 * 左侧：Leaflet 交互式地图（无人机 + 商家位置）
 * 右侧：统计面板（KPI、状态分布、活跃任务）
 *
 * 【数据来源】
 * 通过 useDrones hook 从 Zustand store 获取数据，
 * WebSocket 推送更新时自动同步。
 */

import { useEffect, useState } from 'react';
import { Plane, Package, Store, TrendingUp, Play, Pause, RefreshCw } from 'lucide-react';
import MapContainer from '../components/Map/MapContainer';
import useStore from '../hooks/useDrones';
import { useNotification } from '../context/NotificationContext';

/**
 * 仪表盘
 *
 * 【核心功能】
 * 1. 加载初始数据（useEffect）
 * 2. 计算统计数据（无人机/订单状态分布）
 * 3. 处理交互（点击无人机/商家 → 地图居中）
 */
export default function Dashboard() {
  /**
   * 从全局 store 获取状态和方法
   *
   * 【为什么用解构而不是一个个获取？】
   * 代码更简洁，一次性获取所有需要的状态和方法。
   */
  const {
    drones, merchants, orders, simulationRunning, selectedDrone, selectedMerchant,
    setSelectedDrone, setSelectedMerchant, getDroneStats, getOrderStats, fetchAll,
  } = useStore();

  const { notify } = useNotification();

  /**
   * 地图中心点状态
   * 当用户点击无人机或商家时，设置为该对象的位置。
   * MapContainer 组件会响应这个变化，自动平移地图。
   */
  const [mapCenter, setMapCenter] = useState(null);

  /**
   * 页面加载时获取数据
   *
   * 【为什么用 useEffect？】
   * fetchAll 是异步操作，应该在组件挂载后执行。
   * useEffect 的依赖数组为空，表示只在首次渲染时执行。
   */
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /**
   * 计算统计数据
   * 这些计算每次渲染都会执行，但开销很小（只是数组 filter）。
   * 如果数据量很大，可以用 useMemo 缓存。
   */
  const droneStats = getDroneStats();
  const orderStats = getOrderStats();

  /**
   * 处理无人机点击
   *
   * 【交互流程】
   * 1. 将无人机设为选中状态（高亮显示）
   * 2. 如果无人机有位置，将地图平移到该位置
   */
  const handleDroneClick = (drone) => {
    setSelectedDrone(drone);
    if (drone?.position) {
      setMapCenter([drone.position.latitude, drone.position.longitude]);
    }
  };

  /**
   * 处理商家点击
   */
  const handleMerchantClick = (merchant) => {
    setSelectedMerchant(merchant);
    if (merchant?.position) {
      setMapCenter([merchant.position.latitude, merchant.position.longitude]);
    }
  };

  /**
   * 筛选出正在配送的无人机
   * 用于在侧边栏显示活跃任务列表。
   */
  const dispatchingDrones = drones.filter((d) => d.status === 'dispatching');

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/**
       * 页面头部
       */}
      <header className="bg-white border-b px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">地图总览</h2>
            <p className="text-gray-400 text-sm">实时监控无人机和商家位置</p>
          </div>
          <div className="flex items-center gap-3">
            {/* 刷新按钮 */}
            <button
              onClick={() => fetchAll()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              刷新
            </button>

            {/* 模拟状态指示器 */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
              simulationRunning ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              <div className={`w-2 h-2 rounded-full ${simulationRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              {simulationRunning ? '模拟运行中' : '模拟已停止'}
            </div>
          </div>
        </div>
      </header>

      {/**
       * 主体区域：地图 + 侧边栏
       */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/**
         * 地图区域
         */}
        <div className="flex-1 relative min-h-0" style={{ height: '100%' }}>
          <MapContainer
            drones={drones}
            merchants={merchants}
            center={mapCenter}
            onDroneClick={handleDroneClick}
            onMerchantClick={handleMerchantClick}
          />
        </div>

        {/**
         * 右侧统计面板
         *
         * w-80：固定宽度 320px
         * bg-white：白色背景
         * border-l：左侧分隔线
         * overflow-y-auto：内容超出时可滚动
         */}
        <aside className="w-80 bg-white border-l flex flex-col overflow-y-auto flex-shrink-0">
          <div className="p-4 space-y-4">

            {/**
             * KPI 统计卡片
             * 显示关键业务指标。
             */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Plane, label: '无人机总数', value: droneStats.total, color: 'blue' },
                { icon: Store, label: '商家总数', value: merchants.length, color: 'red' },
                { icon: TrendingUp, label: '配送中', value: droneStats.dispatching, color: 'green' },
                { icon: Package, label: '订单总数', value: orderStats.total, color: 'purple' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`p-1.5 rounded-lg bg-${color}-500`}>
                      <Icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-xs text-gray-500">{label}</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{value}</p>
                </div>
              ))}
            </div>

            {/**
             * 无人机状态分布
             */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-sm text-gray-700 mb-3">无人机状态分布</h3>
              <div className="space-y-1.5">
                {[
                  { label: '空闲', count: droneStats.idle, color: 'bg-green-500' },
                  { label: '配送中', count: droneStats.dispatching, color: 'bg-blue-500' },
                  { label: '返航中', count: droneStats.returning, color: 'bg-yellow-500' },
                  { label: '充电中', count: droneStats.charging, color: 'bg-gray-400' },
                  { label: '维护中', count: droneStats.maintenance, color: 'bg-red-500' },
                ].map(({ label, count, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                      <span className="text-xs text-gray-600">{label}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-800">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/**
             * 订单状态分布
             */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-sm text-gray-700 mb-3">订单状态分布</h3>
              <div className="space-y-1.5">
                {[
                  { label: '待分配', count: orderStats.pending, color: 'bg-gray-400' },
                  { label: '配送中', count: orderStats.delivering, color: 'bg-blue-500' },
                  { label: '已完成', count: orderStats.delivered, color: 'bg-green-500' },
                ].map(({ label, count, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                      <span className="text-xs text-gray-600">{label}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-800">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/**
             * 活跃任务列表
             */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-sm text-gray-700 mb-3">配送中的无人机</h3>
              <div className="space-y-2">
                {dispatchingDrones.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-3">暂无配送中的无人机</p>
                ) : (
                  dispatchingDrones.map((drone) => (
                    <div
                      key={drone.id}
                      className="p-3 bg-blue-50 rounded-xl cursor-pointer hover:bg-blue-100 transition"
                      onClick={() => handleDroneClick(drone)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Plane className="w-3.5 h-3.5 text-blue-600" />
                        <p className="font-medium text-sm text-gray-900">{drone.name}</p>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>任务: {drone.currentTask || '无'}</span>
                        <span>⚡ {drone.battery}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
