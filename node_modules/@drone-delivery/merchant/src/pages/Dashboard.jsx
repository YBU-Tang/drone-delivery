import { useEffect, useState } from 'react';
import { Package, Clock, Truck, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import useStore from '../hooks/useOrders';
import { useNotification } from '../context/NotificationContext';
import OrderDetailsModal from '../components/Order/OrderDetailsModal';

export default function Dashboard() {
  const { orders, fetchOrders, getOrderStats, loading } = useStore();
  const { notify } = useNotification();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders, refreshKey]);

  const stats = getOrderStats();

  const statusConfig = {
    pending: { label: '待分配', icon: AlertCircle, color: 'gray', bg: 'bg-gray-100' },
    assigned: { label: '已分配', icon: Truck, color: 'blue', bg: 'bg-blue-100' },
    pickingUp: { label: '取货中', icon: Truck, color: 'yellow', bg: 'bg-yellow-100' },
    delivering: { label: '配送中', icon: Truck, color: 'blue', bg: 'bg-blue-50' },
    delivered: { label: '已送达', icon: CheckCircle, color: 'green', bg: 'bg-green-100' },
    cancelled: { label: '已取消', icon: AlertCircle, color: 'red', bg: 'bg-red-100' },
  };

  return (
    <div className="p-6">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">订单列表</h2>
            <p className="text-gray-500 mt-1">管理您的配送订单</p>
          </div>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: '全部订单', value: stats.total, icon: Package, color: 'gray' },
          { label: '待分配', value: stats.pending, icon: Clock, color: 'gray' },
          { label: '配送中', value: stats.delivering + stats.assigned + stats.pickingUp, icon: Truck, color: 'blue' },
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

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">订单号</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">配送地址</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">重量</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">无人机</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">创建时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-5 py-12 text-center text-gray-400">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  暂无订单
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const cfg = statusConfig[order.status] || statusConfig.pending;
                const Icon = cfg.icon;
                return (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 cursor-pointer transition"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.bg}`}>
                          <Icon className={`w-4 h-4 text-${cfg.color}-600`} />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{order.id}</p>
                          <p className="text-xs text-gray-400">
                            预计 {Math.floor((order.estimatedDuration || 0) / 60)}:{String((order.estimatedDuration || 0) % 60).padStart(2, '0')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} text-${cfg.color}-700`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 max-w-xs truncate">{order.customerAddress}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{order.weight} kg</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{order.assignedDroneId || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {new Date(order.timeline?.created).toLocaleString('zh-CN')}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
