/**
 * ============================================================
 * 添加无人机弹窗组件（Add Drone Modal）
 * ============================================================
 *
 * 【功能】
 * 弹窗表单，用于添加新的无人机到系统中。
 *
 * 【弹窗实现方式】
 * 使用"遮罩 + 弹窗"模式：
 *   - 遮罩层（overlay）：半透明黑色背景，click 关闭弹窗
 *   - 弹窗层（modal）：居中显示的白色卡片
 *   - e.stopPropagation()：阻止点击弹窗时触发遮罩的关闭事件
 *
 * 【表单处理】
 * 使用受控组件模式：
 *   - 每个表单字段绑定到 state（如 formData.name）
 *   - onChange 事件更新 state
 *   - 提交时从 state 获取数据
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { DRONE_MODELS, DEFAULT_MAP_CENTER } from '@shared/constants.js';

/**
 * 添加无人机弹窗
 *
 * @param {Object} props
 * @param {Function} props.onClose - 关闭弹窗的回调
 * @param {Function} props.onAdd - 确认添加的回调，接收无人机数据对象
 */
export default function AddDroneModal({ onClose, onAdd }) {
  /**
   * 表单数据状态
   *
   * 【为什么要用对象存储？】
   * 多个表单字段统一管理，避免每个字段一个 state。
   * 提交时一次性获取所有数据，代码更简洁。
   */
  const [formData, setFormData] = useState({
    name: '',                                    // 无人机名称
    model: DRONE_MODELS[0],                     // 型号（默认第一个）
    latitude: DEFAULT_MAP_CENTER[0].toString(), // 纬度（默认上海市中心）
    longitude: DEFAULT_MAP_CENTER[1].toString(), // 经度
    baseStation: 'BS-001',                      // 所属基站（默认 BS-001）
  });

  /**
   * 提交状态
   * 防止重复提交：在请求完成前禁用提交按钮
   */
  const [loading, setLoading] = useState(false);

  /**
   * 处理表单提交
   *
   * 【流程】
   * 1. 阻止默认表单提交行为
   * 2. 验证必填字段
   * 3. 解析经纬度为数字
   * 4. 调用 onAdd 回调，传入完整数据
   * 5. 关闭弹窗
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // 阻止表单自动提交（会导致页面刷新）

    // 验证名称不能为空
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      // 构造位置对象
      const position = {
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      };

      // 调用父组件传入的 onAdd
      await onAdd({
        name: formData.name.trim(),
        model: formData.model,
        position,
        baseStation: formData.baseStation,
      });

      // 添加成功后关闭弹窗
      onClose();
    } finally {
      // 无论成功失败，都要结束 loading 状态
      setLoading(false);
    }
  };

  return (
    /**
     * 遮罩层
     *
     * fixed inset-0：固定定位，覆盖整个视口
     * bg-black/50：半透明黑色背景
     * flex items-center justify-center：内容居中
     * z-50：较高的 z-index，确保在最上层
     * onClick={onClose}：点击遮罩关闭弹窗
     */
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      {/**
       * 弹窗主体
       *
       * onClick={(e) => e.stopPropagation()}：
       * 阻止事件冒泡，这样点击弹窗本身不会触发遮罩层的 onClick。
       * 否则点击弹窗内容就会意外关闭弹窗。
       */}
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/**
         * 弹窗头部
         * 包含标题和关闭按钮。
         */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">添加无人机</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/**
         * 表单
         */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 名称输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">无人机名称 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如：无人机-009"
              required
            />
          </div>

          {/* 型号选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">型号 *</label>
            <select
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DRONE_MODELS.map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>

          {/* 基站选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">基站</label>
            <select
              value={formData.baseStation}
              onChange={(e) => setFormData({ ...formData, baseStation: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {['BS-001', 'BS-002', 'BS-003'].map((bs) => (
                <option key={bs} value={bs}>{bs}</option>
              ))}
            </select>
          </div>

          {/* 经纬度 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">纬度</label>
              <input
                type="number"
                step="0.000001"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">经度</label>
              <input
                type="number"
                step="0.000001"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? '添加中...' : '添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
