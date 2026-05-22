import { X, Package, MapPin, Clock, Plane, CheckCircle } from 'lucide-react';

export default function OrderDetailsModal({ order, onClose }) {
  if (!order) return null;

  const timeline = [
    { key: 'created', label: '订单创建', time: order.timeline?.created },
    { key: 'assigned', label: '分配无人机', time: order.timeline?.assigned },
    { key: 'pickedUp', label: '取货完成', time: order.timeline?.pickedUp },
    { key: 'delivered', label: '配送完成', time: order.timeline?.delivered },
  ];

  const statusText = {
    pending: '待分配',
    assigned: '已分配',
    pickingUp: '取货中',
    delivering: '配送中',
    delivered: '已送达',
    cancelled: '已取消',
  };

  const formatTime = (ts) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('zh-CN');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">{order.id}</h3>
            <p className="text-orange-200 text-sm">{order.merchantName}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 bg-white/20 text-white text-xs rounded-full font-medium">
              {statusText[order.status] || order.status}
            </span>
            <button onClick={onClose} className="text-white/70 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">物品重量</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{order.weight} kg</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">预计时长</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {Math.floor((order.estimatedDuration || 0) / 60)}:{String((order.estimatedDuration || 0) % 60).padStart(2, '0')}
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">配送信息</h4>
            <div className="space-y-2">
              <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                <p className="text-xs text-green-600 font-medium mb-0.5">取货地点</p>
                <p className="text-sm font-medium text-gray-800">{order.merchantName}</p>
                <p className="text-xs text-gray-400">
                  {order.pickupPosition?.latitude.toFixed(6)}, {order.pickupPosition?.longitude.toFixed(6)}
                </p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                <p className="text-xs text-blue-600 font-medium mb-0.5">配送地点</p>
                <p className="text-sm font-medium text-gray-800">{order.customerAddress}</p>
                <p className="text-xs text-gray-400">
                  {order.deliveryPosition?.latitude.toFixed(6)}, {order.deliveryPosition?.longitude.toFixed(6)}
                </p>
              </div>
            </div>
          </div>

          {order.assignedDroneId && (
            <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
              <div className="flex items-center gap-2 mb-1">
                <Plane className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold text-gray-700">配送无人机</span>
              </div>
              <p className="text-sm font-medium text-gray-800">{order.assignedDroneId}</p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">配送进度</h4>
            <div className="space-y-0">
              {timeline.map((item, idx) => {
                const isLast = idx === timeline.length - 1;
                const isDone = !!item.time;
                return (
                  <div key={item.key} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        isDone ? 'bg-green-500' : 'bg-gray-200'
                      }`}>
                        {isDone ? <CheckCircle className="w-3 h-3 text-white" /> : <div className="w-2 h-2 bg-gray-400 rounded-full" />}
                      </div>
                      {!isLast && (
                        <div className={`w-0.5 flex-1 min-h-[20px] ${isDone ? 'bg-green-300' : 'bg-gray-200'}`} />
                      )}
                    </div>
                    <div className="pb-3">
                      <p className={`text-sm font-medium ${isDone ? 'text-gray-800' : 'text-gray-400'}`}>{item.label}</p>
                      <p className="text-xs text-gray-400">{formatTime(item.time)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 bg-gray-50 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium transition"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
