/**
 * ============================================================
 * 数据分析页面（Analytics Page）
 * ============================================================
 *
 * 【功能】
 * 展示平台运营数据的统计和分析，包括：
 * - KPI 指标卡片
 * - 无人机状态分布（水平条形图）
 * - 订单状态分布（水平条形图）
 * - 各品类订单量
 */

import { useMemo } from 'react';
import { BarChart3, Plane, Package, TrendingUp, Clock } from 'lucide-react';
import useStore from '../hooks/useDrones';

/**
 * 数据分析页面
 */
export default function Analytics() {
  const { drones, orders, merchants } = useStore();

  /**
   * 使用 useMemo 缓存计算结果
   *
   * 【useMemo 的作用】
   * 当依赖数组中的值（drones, orders）未变化时，
   * 不会重新计算，直接返回缓存的结果。
   * 这样可以避免在每次渲染时都执行昂贵的计算。
   */
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const todayOrders = orders.filter((o) => o.timeline?.created?.startsWith(todayStr));

    const avgBattery = drones.length
      ? Math.round(drones.reduce((s, d) => s + d.battery, 0) / drones.length)
      : 0;

    const completionRate = orders.length
      ? Math.round((orders.filter((o) => o.status === 'delivered').length / orders.length) * 100)
      : 0;

    return {
      totalDrones: drones.length,
      activeDrones: drones.filter((d) => d.status !== 'maintenance' && d.status !== 'charging').length,
      avgBattery,
      totalOrders: orders.length,
      todayOrders: todayOrders.length,
      completedOrders: orders.filter((o) => o.status === 'delivered').length,
      completionRate,
    };
  }, [drones, orders]);

  // 无人机状态数据
  const droneStatusData = useMemo(() => [
    { label: '空闲', value: drones.filter((d) => d.status === 'idle').length, color: 'bg-green-500' },
    { label: '配送中', value: drones.filter((d) => d.status === 'dispatching').length, color: 'bg-blue-500' },
    { label: '返航中', value: drones.filter((d) => d.status === 'returning').length, color: 'bg-yellow-500' },
    { label: '充电中', value: drones.filter((d) => d.status === 'charging').length, color: 'bg-gray-400' },
    { label: '维护中', value: drones.filter((d) => d.status === 'maintenance').length, color: 'bg-red-500' },
  ], [drones]);

  // 订单状态数据
  const orderStatusData = useMemo(() => [
    { label: '待分配', value: orders.filter((o) => o.status === 'pending').length, color: 'bg-gray-400' },
    { label: '已分配', value: orders.filter((o) => o.status === 'assigned').length, color: 'bg-blue-400' },
    { label: '取货中', value: orders.filter((o) => o.status === 'pickingUp').length, color: 'bg-yellow-400' },
    { label: '配送中', value: orders.filter((o) => o.status === 'delivering').length, color: 'bg-blue-600' },
    { label: '已送达', value: orders.filter((o) => o.status === 'delivered').length, color: 'bg-green-500' },
    { label: '已取消', value: orders.filter((o) => o.status === 'cancelled').length, color: 'bg-red-400' },
  ], [orders]);

  // 各品类订单数据
  const categoryData = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      const cat = merchants.find((m) => m.id === o.merchantId)?.category || '其他';
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.entries(map).map(([label, value]) => ({ label, value }));
  }, [orders, merchants]);

  // 计算条形图最大值（用于百分比计算）
  const maxStatusValue = Math.max(...droneStatusData.map((d) => d.value), 1);
  const maxOrderValue = Math.max(...orderStatusData.map((d) => d.value), 1);
  const maxCatValue = Math.max(...categoryData.map((d) => d.value), 1);

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">数据分析</h2>
        <p className="text-gray-500 mt-1">平台运营数据概览</p>
      </header>

      {/* KPI 指标卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: '无人机总数', value: stats.totalDrones, sub: `活跃 ${stats.activeDrones} 台`, icon: Plane, color: 'blue' },
          { label: '订单总数', value: stats.totalOrders, sub: `今日 ${stats.todayOrders} 单`, icon: Package, color: 'purple' },
          { label: '平均电量', value: `${stats.avgBattery}%`, sub: '所有无人机', icon: TrendingUp, color: stats.avgBattery > 50 ? 'green' : 'red' },
          { label: '完成率', value: `${stats.completionRate}%`, sub: `${stats.completedOrders} 单已完成`, icon: Clock, color: 'green' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{label}</span>
              <div className={`p-2 rounded-xl bg-${color}-100`}>
                <Icon className={`w-4 h-4 text-${color}-600`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* 图表区域：两列布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 无人机状态分布 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            无人机状态分布
          </h3>
          <div className="space-y-3">
            {droneStatusData.map(({ label, value, color }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-16">{label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className={`${color} h-full rounded-full flex items-center justify-end pr-2 transition-all duration-700`}
                    style={{ width: `${(value / maxStatusValue) * 100}%` }}
                  >
                    {value > 0 && <span className="text-xs text-white font-bold">{value}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 订单状态分布 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-600" />
            订单状态分布
          </h3>
          <div className="space-y-3">
            {orderStatusData.map(({ label, value, color }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-16">{label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className={`${color} h-full rounded-full flex items-center justify-end pr-2 transition-all duration-700`}
                    style={{ width: `${(value / maxOrderValue) * 100}%` }}
                  >
                    {value > 0 && <span className="text-xs text-white font-bold">{value}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 各品类订单量 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border">
        <h3 className="font-semibold text-gray-900 mb-5">各品类订单量</h3>
        {categoryData.length === 0 ? (
          <p className="text-center text-gray-400 py-8">暂无订单数据</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {categoryData.map(({ label, value }) => {
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500', 'bg-orange-500'];
              const color = colors[categoryData.indexOf(categoryData.find((d) => d.label === label)) % colors.length];
              return (
                <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className={`${color} h-2 rounded-full mb-2`} style={{ width: `${(value / maxCatValue) * 100}%`, marginLeft: 'auto', marginRight: 'auto' }} />
                  <p className="text-lg font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
