/**
 * ============================================================
 * 订单详情弹窗组件（Order Details Modal）
 * ============================================================
 *
 * 【功能】
 * 展示订单的完整信息，包括配送进度时间线。
 *
 * 【时间线设计】
 * 使用垂直时间线展示订单的四个关键节点：
 *   订单创建 → 分配无人机 → 取货完成 → 配送完成
 * 每个节点显示是否已完成（绿色勾选 vs 灰色圆点），
 * 让用户一目了然地看到订单当前处于哪个阶段。
 */

import { X, Package, MapPin, Clock, Plane, CheckCircle } from 'lucide-react';
import { OrderStatusBadge } from '../common/StatusBadge';

/**
 * 订单详情弹窗
 *
 * @param {Object} props
 * @param {Object|null} props.order - 订单数据
 * @param {Function} props.onClose - 关闭弹窗
 * @param {Array} props.merchants - 商家列表（用于查找商家名）
 * @param {Array} props.drones - 无人机列表（用于查找无人机名）
 */
export default function OrderDetailsModal({ order, onClose, merchants, drones }) {
  if (!order) return null;

  // 根据 ID 查找关联的商家和无人机
  const merchant = merchants?.find((m) => m.id === order.merchantId);
  const drone = drones?.find((d) => d.id === order.assignedDroneId);

  /**
   * 时间线数据
   * 定义订单的四个关键节点
   */
  const timeline = [
    { key: 'created', label: '订单创建', time: order.timeline?.created },
    { key: 'assigned', label: '分配无人机', time: order.timeline?.assigned },
    { key: 'pickedUp', label: '取货完成', time: order.timeline?.pickedUp },
    { key: 'delivered', label: '配送完成', time: order.timeline?.delivered },
  ];

  /**
   * 格式化时间显示
   * 将 ISO 时间字符串转为本地可读格式
   */
  const formatTime = (ts) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('zh-CN');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── 头部 ─── */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">{order.id}</h3>
            <p className="text-purple-200 text-sm">{order.merchantName}</p>
          </div>
          <div className="flex items-center gap-3">
            <OrderStatusBadge status={order.status} />
            <button onClick={onClose} className="text-white/70 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─── 内容区 ─── */}
        <div className="p-6 space-y-5">

          {/* 基本信息：重量 + 预计时长 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">物品重量</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{order.weight} kg</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">预计时长</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {Math.floor((order.estimatedDuration || 0) / 60)}:{String((order.estimatedDuration || 0) % 60).padStart(2, '0')}
              </p>
            </div>
          </div>

          {/* 取货和配送位置 */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">配送信息</h4>
            <div className="grid grid-cols-2 gap-3">
              {/* 取货地点（绿色标识） */}
              <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                <p className="text-xs text-green-600 font-medium mb-1">取货地点</p>
                <p className="text-sm font-medium text-gray-800">{merchant?.name || order.merchantName}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {order.pickupPosition?.latitude.toFixed(6)}, {order.pickupPosition?.longitude.toFixed(6)}
                </p>
              </div>
              {/* 配送地点（蓝色标识） */}
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                <p className="text-xs text-blue-600 font-medium mb-1">配送地点</p>
                <p className="text-sm font-medium text-gray-800">{order.customerAddress}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {order.deliveryPosition?.latitude.toFixed(6)}, {order.deliveryPosition?.longitude.toFixed(6)}
                </p>
              </div>
            </div>
          </div>

          {/* 配送无人机信息 */}
          {drone && (
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <div className="flex items-center gap-2 mb-2">
                <Plane className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold text-gray-700">配送无人机</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">名称</p>
                  <p className="font-medium text-gray-800">{drone.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">型号</p>
                  <p className="font-medium text-gray-800">{drone.model}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">电量</p>
                  <p className="font-medium text-gray-800">{drone.battery}%</p>
                </div>
              </div>
            </div>
          )}

          {/* 配送进度时间线 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">配送进度</h4>
            <div className="space-y-0">
              {timeline.map((item, idx) => {
                const isLast = idx === timeline.length - 1;
                // 如果有完成时间，说明该节点已完成
                const isDone = !!item.time;
                return (
                  <div key={item.key} className="flex items-start gap-3">
                    {/* 时间线圆点和连接线 */}
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isDone ? 'bg-green-500' : 'bg-gray-200'
                      }`}>
                        {isDone
                          ? <CheckCircle className="w-3 h-3 text-white" />
                          : <div className="w-2 h-2 bg-gray-400 rounded-full" />
                        }
                      </div>
                      {/* 连接线（最后一项不需要） */}
                      {!isLast && (
                        <div className={`w-0.5 flex-1 min-h-[24px] ${isDone ? 'bg-green-300' : 'bg-gray-200'}`} />
                      )}
                    </div>
                    {/* 标签和时间 */}
                    <div className="pb-4">
                      <p className={`text-sm font-medium ${isDone ? 'text-gray-800' : 'text-gray-400'}`}>
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-400">{formatTime(item.time)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── 底部 ─── */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
