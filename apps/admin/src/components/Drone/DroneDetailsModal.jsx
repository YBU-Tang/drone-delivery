/**
 * ============================================================
 * 无人机详情弹窗组件（Drone Details Modal）
 * ============================================================
 *
 * 【功能】
 * 以弹窗形式展示无人机的完整详细信息，并支持快速状态切换。
 *
 * 【弹窗模式的优势】
 * 相比页面跳转，弹窗可以让用户在查看详情的同时保持当前页面的上下文，
 * 尤其适合"详情查看 + 快速操作"的场景。
 *
 * 【状态切换功能】
 * 允许管理员快速将无人机设为特定状态：
 *   - 设为空闲 / 充电中 / 维护中
 *   配送中状态不可直接切换（需要任务完成）
 */

import { X, Battery, Zap, MapPin, Clock, Navigation } from 'lucide-react';

/** 状态对应的颜色样式 */
const statusColors = {
  idle: 'bg-green-100 text-green-800 border-green-200',
  dispatching: 'bg-blue-100 text-blue-800 border-blue-200',
  returning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  charging: 'bg-gray-100 text-gray-800 border-gray-200',
  maintenance: 'bg-red-100 text-red-800 border-red-200',
};

/** 状态对应的中文文本 */
const statusText = {
  idle: '空闲',
  dispatching: '配送中',
  returning: '返航中',
  charging: '充电中',
  maintenance: '维护中',
};

/**
 * 无人机详情弹窗
 *
 * @param {Object} props
 * @param {Object|null} props.drone - 无人机数据，null 时不渲染
 * @param {Function} props.onClose - 关闭弹窗的回调
 * @param {Function} props.onStatusChange - 状态切换的回调 (droneId, newStatus)
 */
export default function DroneDetailsModal({ drone, onClose, onStatusChange }) {
  // 如果 drone 为 null（未选中），不渲染任何内容
  if (!drone) return null;

  /**
   * 电量条颜色
   * 根据电量值选择绿色/黄色/红色：
   *   > 50% → 绿色（电量充足）
   *   > 20% → 黄色（电量偏低）
   *   ≤ 20% → 红色（电量不足）
   */
  const batteryColor =
    drone.battery > 50 ? 'bg-green-500' :
    drone.battery > 20 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    /**
     * 遮罩层
     * fixed inset-0 + bg-black/50：固定全屏半透明黑色遮罩
     * flex items-center justify-center：内容居中
     * z-50：确保在最上层
     */
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      {/**
       * 弹窗主体
       * w-full max-w-lg：最大宽度 32rem（512px），小屏幕占满宽度
       * onClick 阻止冒泡，防止点击弹窗内容时关闭弹窗
       */}
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── 头部：标题 + 关闭按钮 ─── */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">{drone.name}</h3>
            {/* 显示 ID 和型号 */}
            <p className="text-blue-200 text-sm">{drone.id} · {drone.model}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── 状态徽章 ─── */}
        <div className="px-6 py-3 border-b flex items-center gap-3">
          {/**
           * 状态徽章
           * 根据当前状态显示不同颜色
           */}
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${statusColors[drone.status] || statusColors.idle}`}>
            {statusText[drone.status] || drone.status}
          </span>
          {/**
           * 当前任务
           * 如果有执行中的任务，显示任务 ID
           */}
          {drone.currentTask && (
            <span className="text-sm text-gray-500">任务: {drone.currentTask}</span>
          )}
        </div>

        {/* ─── 数据网格 ─── */}
        <div className="px-6 py-4">
          {/**
           * 2×2 网格布局
           * 展示电池、速度、位置、基站四个关键指标
           */}
          <div className="grid grid-cols-2 gap-4 mb-4">

            {/* 电池 */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Battery className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">电量</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${batteryColor} transition-all`}
                    style={{ width: `${drone.battery}%` }}
                  />
                </div>
                <span className="text-sm font-bold">{drone.battery}%</span>
              </div>
            </div>

            {/* 速度 */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">飞行速度</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {drone.currentSpeed} <span className="text-sm font-normal text-gray-400">m/s</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">最大 {drone.maxSpeed} m/s</p>
            </div>

            {/* 位置 */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">当前位置</span>
              </div>
              <p className="text-sm font-mono text-gray-700">
                {drone.position.latitude.toFixed(6)}, {drone.position.longitude.toFixed(6)}
              </p>
            </div>

            {/* 基站 */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Navigation className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">基站</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{drone.baseStation}</p>
            </div>
          </div>

          {/* 注册时间 */}
          <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-50 rounded-lg px-4 py-3">
            <Clock className="w-4 h-4" />
            <span>注册时间: {new Date(drone.createdAt).toLocaleString('zh-CN')}</span>
          </div>
        </div>

        {/* ─── 操作按钮 ─── */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
          {/**
           * 状态切换按钮
           * 过滤掉当前状态，显示可切换的状态选项
           */}
          <div className="flex gap-2">
            {['idle', 'charging', 'maintenance'].map((s) => (
              drone.status !== s && (
                <button
                  key={s}
                  onClick={() => onStatusChange?.(drone.id, s)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
                >
                  设为 {statusText[s]}
                </button>
              )
            ))}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
