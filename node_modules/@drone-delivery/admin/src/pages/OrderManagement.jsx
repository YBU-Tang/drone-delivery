/**
 * ============================================================
 * 订单管理页面（Order Management Page）
 * ============================================================
 *
 * 【功能】
 * 展示所有订单列表，支持状态筛选和详情查看。
 */

import { useState, useEffect } from 'react';
import { Package, Clock, Truck, CheckCircle, XCircle, Filter, RefreshCw } from 'lucide-react';
import { OrderStatusBadge } from '../components/common/StatusBadge';
import OrderDetailsModal from '../components/Order/OrderDetailsModal';
import useStore from '../hooks/useDrones';
import { useNotification } from '../context/NotificationContext';

/** 订单状态筛选配置 */
const statusFilters = [
  { key: 'all', label: '全部', icon: Package },
  { key: 'pending', label: '待分配', icon: Clock },
  { key: 'assigned', label: '已分配', icon: Truck },
  { key: 'pickingUp', label: '取货中', icon: Truck },
  { key: 'delivering', label: '配送中', icon: Truck },
  { key: 'delivered', label: '已送达', icon: CheckCircle },
  { key: 'cancelled', label: '已取消', icon: XCircle },
];

/**
 * 订单管理页面
 */
export default function OrderManagement() {
  const { orders, merchants, drones, fetchAll } = useStore();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const { notify } = useNotification();

  // 页面加载时获取订单数据
  useEffect(() => {
    fetchAll();
  }, [fetchAll, refreshKey]);

  // 根据状态筛选订单
  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter((o) => o.status === filter);

  // 计算统计数据
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    delivering: orders.filter((o) => ['assigned', 'pickingUp', 'delivering'].includes(o.status)).length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
  };

  // 根据 ID 查找商家名称
  const getMerchantName = (merchantId) => {
    return merchants.find((m) => m.id === merchantId)?.name || merchantId;
  };

  // 根据 ID 查找无人机名称
  const getDroneName = (droneId) => {
    return drones.find((d) => d.id === droneId)?.name || droneId || '—';
  };

  // 格式化时长显示
  const formatTime = (seconds) => {
    if (!seconds) return '—';
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  };

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">订单管理</h2>
            <p className="text-gray-500 mt-0.5">实时监控所有配送订单</p>
          </div>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 font-medium shadow-sm transition"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
        </div>
      </header>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label: '订单总数', value: stats.total, icon: Package, color: 'blue' },
          { label: '待分配', value: stats.pending, icon: Clock, color: 'gray' },
          { label: '配送中', value: stats.delivering, icon: Truck, color: 'yellow' },
          { label: '已完成', value: stats.delivered, icon: CheckCircle, color: 'green' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg bg-${color}-100`}>
                <Icon className={`w-4 h-4 text-${color}-600`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 状态筛选 */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {statusFilters.map(({ key, label, icon: Icon }) => {
          const count = key === 'all' ? orders.length : orders.filter((o) => o.status === key).length;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                filter === key
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
              <span className="opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* 订单表格 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">订单号</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">商家</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">配送地址</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">重量</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">无人机</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">创建时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-5 py-12 text-center text-gray-400">
                  <Filter className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  暂无订单数据
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Package className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{order.id}</p>
                        <p className="text-xs text-gray-400">预计 {formatTime(order.estimatedDuration)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{getMerchantName(order.merchantId)}</td>
                  <td className="px-5 py-3.5"><OrderStatusBadge status={order.status} /></td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 max-w-xs truncate">{order.customerAddress}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{order.weight} kg</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{getDroneName(order.assignedDroneId)}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">
                    {new Date(order.timeline.created).toLocaleString('zh-CN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 订单详情弹窗 */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          merchants={merchants}
          drones={drones}
        />
      )}
    </div>
  );
}
