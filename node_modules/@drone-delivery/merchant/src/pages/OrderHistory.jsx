import { useEffect, useState } from 'react';
import { History, Package, CheckCircle, XCircle, Clock } from 'lucide-react';
import useStore from '../hooks/useOrders';
import OrderDetailsModal from '../components/Order/OrderDetailsModal';

const statusConfig = {
  pending: { label: '待分配', icon: Clock, color: 'gray', bg: 'bg-gray-100' },
  assigned: { label: '已分配', icon: Package, color: 'blue', bg: 'bg-blue-100' },
  pickingUp: { label: '取货中', icon: Package, color: 'yellow', bg: 'bg-yellow-100' },
  delivering: { label: '配送中', icon: Package, color: 'blue', bg: 'bg-blue-50' },
  delivered: { label: '已送达', icon: CheckCircle, color: 'green', bg: 'bg-green-100' },
  cancelled: { label: '已取消', icon: XCircle, color: 'red', bg: 'bg-red-100' },
};

export default function OrderHistory() {
  const { orders, fetchOrders } = useStore();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filtered = statusFilter === 'all'
    ? orders
    : orders.filter((o) => o.status === statusFilter);

  const completed = orders.filter((o) => o.status === 'delivered');
  const totalWeight = completed.reduce((s, o) => s + (o.weight || 0), 0);

  return (
    <div className="p-6">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">订单历史</h2>
        <p className="text-gray-500 mt-1">查看已完成和历史订单记录</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-xs text-gray-500">已完成订单</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{completed.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-xs text-gray-500">总配送重量</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{totalWeight.toFixed(1)} kg</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-xs text-gray-500">平均评分</p>
          <p className="text-2xl font-bold text-yellow-500 mt-1">4.8 ⭐</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['all', 'delivered', 'cancelled', 'pending'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              statusFilter === s
                ? 'bg-orange-500 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s === 'all' ? '全部' : statusConfig[s]?.label || s}
          </button>
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
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">完成时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-5 py-12 text-center text-gray-400">
                  <History className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  暂无历史订单
                </td>
              </tr>
            ) : (
              filtered.map((order) => {
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
                        <span className="font-medium text-sm text-gray-900">{order.id}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} text-${cfg.color}-700`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 max-w-xs truncate">{order.customerAddress}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{order.weight} kg</td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {order.timeline?.delivered
                        ? new Date(order.timeline.delivered).toLocaleString('zh-CN')
                        : order.timeline?.created
                          ? new Date(order.timeline.created).toLocaleString('zh-CN')
                          : '—'}
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
