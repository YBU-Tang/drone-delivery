/**
 * ============================================================
 * 商家弹窗组件（Merchant Modal）
 * ============================================================
 *
 * 【功能】
 * 商家表单弹窗，支持添加新商家和编辑已有商家。
 *
 * 【复用模式】
 * 通过 merchant prop 区分两种模式：
 *   - merchant === null   → 添加模式（显示"添加商家"）
 *   - merchant !== null   → 编辑模式（显示"编辑商家"，包含删除按钮）
 *
 * 【表单字段】
 * 商家名称、类别、联系电话、地址、经纬度坐标
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { MERCHANT_CATEGORIES } from '@shared/constants.js';

/**
 * 商家弹窗组件
 *
 * @param {Object} props
 * @param {Object|null} props.merchant - 商家数据（null 表示添加模式）
 * @param {Function} props.onClose - 关闭弹窗
 * @param {Function} props.onSave - 保存回调 (data, merchantId)
 * @param {Function} props.onDelete - 删除回调 (merchantId)，仅编辑模式可用
 */
export default function MerchantModal({ merchant, onClose, onSave, onDelete }) {
  /**
   * 表单状态
   *
   * 【初始化逻辑】
   * 如果是编辑模式（merchant 有值），用已有数据填充表单；
   * 如果是添加模式，用空值/默认值填充。
   */
  const [form, setForm] = useState({
    name: merchant?.name || '',
    category: merchant?.category || MERCHANT_CATEGORIES[0],
    address: merchant?.address || '',
    phone: merchant?.phone || '',
    status: merchant?.status || 'active',
    latitude: merchant?.position?.latitude?.toString() || '31.2300',
    longitude: merchant?.position?.longitude?.toString() || '121.4700',
  });

  const [loading, setLoading] = useState(false);

  /** 判断是添加还是编辑模式 */
  const isEdit = !!merchant;

  /**
   * 处理表单提交
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 基础验证
    if (!form.name || !form.latitude || !form.longitude) return;

    setLoading(true);
    try {
      // 构造完整数据
      const data = {
        name: form.name,
        category: form.category,
        address: form.address,
        phone: form.phone,
        status: form.status,
        // 经纬度从字符串转为数字
        position: {
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
        },
      };

      // 调用保存回调
      // 如果是编辑模式，传入商家 ID；添加模式不传
      await onSave(data, merchant?.id);

      // 保存成功，关闭弹窗
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">
            {isEdit ? '编辑商家' : '添加商家'}
          </h3>
          <button onClick={onClose} className="text-white/70 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 商家名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">商家名称 *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="例如：瑞幸咖啡-浦东店"
              required
            />
          </div>

          {/* 类别 + 状态 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">类别 *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {MERCHANT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="active">营业中</option>
                <option value="inactive">休息中</option>
              </select>
            </div>
          </div>

          {/* 联系电话 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="021-58880000"
            />
          </div>

          {/* 地址 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">地址</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="上海市浦东新区..."
            />
          </div>

          {/* 经纬度 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">纬度 *</label>
              <input
                type="number"
                step="0.000001"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="31.2300"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">经度 *</label>
              <input
                type="number"
                step="0.000001"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="121.4700"
                required
              />
            </div>
          </div>

          {/* 底部操作区 */}
          <div className="flex justify-between pt-4 border-t">
            {/* 左侧：删除按钮（仅编辑模式显示） */}
            <div>
              {isEdit && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('确定要删除该商家吗？')) {
                      onDelete(merchant.id);
                    }
                  }}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm transition"
                >
                  删除商家
                </button>
              )}
            </div>
            {/* 右侧：取消 + 保存 */}
            <div className="flex gap-3">
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
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
              >
                {loading ? '保存中...' : isEdit ? '保存修改' : '添加商家'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
