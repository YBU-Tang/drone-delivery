import { Package, Clock, Truck, CheckCircle, AlertCircle } from 'lucide-react';
import useStore from '../hooks/useOrders';

const statusText = {
  pending: '待分配',
  assigned: '已分配',
  pickingUp: '取货中',
  delivering: '配送中',
  delivered: '已送达',
  cancelled: '已取消',
};

const statusColors = {
  pending: 'bg-gray-100 text-gray-800',
  assigned: 'bg-blue-100 text-blue-800',
  pickingUp: 'bg-yellow-100 text-yellow-800',
  delivering: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

function OrderStatusBadge({ status }) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
      {statusText[status] || status}
    </span>
  );
}

export default function Dashboard() {
  const { orders, getOrderStats, currentMerchant } = useStore();
  const stats = getOrderStats();

  const merchantOrders = orders.filter((o) => o.merchantId === currentMerchant.id);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
      case 'assigned':
        return <Truck className="w-5 h-5 text-blue-500" />;
      case 'delivering':
        return <Truck className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="p-6">
      <header className="mb-6">
        <h2 className="text-2xl font-bold">订单列表</h2>
        <p className="text-gray-500">管理您的配送订单</p>
      </header>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Package className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">全部订单</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">待分配</p>
              <p className="text-xl font-bold">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">配送中</p>
              <p className="text-xl font-bold">{stats.delivering + stats.assigned}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">已完成</p>
              <p className="text-xl font-bold">{stats.delivered}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">订单号</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">配送地址</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">重量</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">无人机</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {merchantOrders.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  暂无订单
                </td>
              </tr>
            ) : (
              merchantOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(order.status)}
                      <div>
                        <p className="font-medium">{order.id}</p>
                        <p className="text-xs text-gray-400">
                          预计 {Math.floor(order.estimatedDuration / 60)}:{String(order.estimatedDuration % 60).padStart(2, '0')} 完成
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                    {order.customerAddress}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {order.weight} kg
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {order.assignedDroneId || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(order.timeline.created).toLocaleString('zh-CN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
