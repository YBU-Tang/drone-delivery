/**
 * ============================================================
 * 商家管理页面（Merchant Management Page）
 * ============================================================
 *
 * 【功能】
 * 展示商家卡片列表，支持搜索、分类筛选、添加、编辑、删除。
 *
 * 【页面特性】
 * - 卡片式布局，比表格更直观展示商家信息
 * - 分类标签筛选
 * - 搜索框按商家名称过滤
 */

import { useState, useEffect } from 'react';
import { Store, Star, Phone, MapPin, Edit2, Trash2, Plus, Filter } from 'lucide-react';
import MerchantModal from '../components/Merchant/MerchantModal';
import useStore from '../hooks/useDrones';
import { useNotification } from '../context/NotificationContext';

/** 品类颜色映射 */
const CATEGORY_COLORS = {
  '快餐': 'bg-orange-100 text-orange-700',
  '咖啡茶饮': 'bg-amber-100 text-amber-700',
  '生鲜': 'bg-green-100 text-green-700',
  '药品': 'bg-red-100 text-red-700',
  '文件': 'bg-blue-100 text-blue-700',
  '其他': 'bg-gray-100 text-gray-700',
};

/**
 * 商家管理页面
 */
export default function MerchantManagement() {
  const { merchants, addMerchant, updateMerchant, removeMerchant, fetchAll } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('全部');
  const [search, setSearch] = useState('');
  const { notify } = useNotification();

  // 页面加载时获取商家数据
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // 从商家列表中提取所有品类（用于筛选标签）
  const categories = ['全部', ...new Set(merchants.map((m) => m.category))];

  // 根据筛选条件和搜索关键词过滤商家
  const filteredMerchants = merchants.filter((m) => {
    const matchCat = categoryFilter === '全部' || m.category === categoryFilter;
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // 保存商家（新增或编辑）
  const handleSave = async (data, merchantId) => {
    try {
      if (merchantId) {
        await updateMerchant(merchantId, data);
        notify('商家信息已更新', 'success');
      } else {
        await addMerchant(data);
        notify('商家添加成功', 'success');
      }
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  // 删除商家
  const handleDelete = async (merchantId) => {
    try {
      await removeMerchant(merchantId);
      notify('商家已删除', 'success');
      setShowModal(false);
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  // 打开添加弹窗
  const openAdd = () => {
    setSelectedMerchant(null);
    setShowModal(true);
  };

  // 打开编辑弹窗
  const openEdit = (merchant) => {
    setSelectedMerchant(merchant);
    setShowModal(true);
  };

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">商家管理</h2>
            <p className="text-gray-500 mt-0.5">管理所有合作商家</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            添加商家
          </button>
        </div>
      </header>

      {/* 搜索和分类筛选 */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索商家名称..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                categoryFilter === cat
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: '商家总数', value: merchants.length, color: 'text-red-600' },
          { label: '营业中', value: merchants.filter((m) => m.status === 'active').length, color: 'text-green-600' },
          { label: '平均评分', value: merchants.length ? (merchants.reduce((s, m) => s + m.rating, 0) / merchants.length).toFixed(1) : '0', color: 'text-yellow-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* 商家卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMerchants.map((merchant) => (
          <div key={merchant.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all">
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Store className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{merchant.name}</h3>
                    <p className="text-xs text-gray-400">{merchant.id}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                  merchant.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {merchant.status === 'active' ? '营业中' : '休息中'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 mb-2.5">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[merchant.category] || 'bg-gray-100 text-gray-700'}`}>
                  {merchant.category}
                </span>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-semibold text-gray-700">{merchant.rating}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-300" />
                  <span className="text-xs">{merchant.phone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-300 mt-0.5" />
                  <span className="text-xs line-clamp-2">{merchant.address}</span>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t bg-gray-50/50 flex justify-end gap-1">
              <button
                onClick={() => openEdit(merchant)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition"
              >
                <Edit2 className="w-3 h-3" />
                编辑
              </button>
              <button
                onClick={() => {
                  if (confirm(`确定要删除商家 "${merchant.name}" 吗？`)) handleDelete(merchant.id);
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <Trash2 className="w-3 h-3" />
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredMerchants.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>暂无商家数据</p>
        </div>
      )}

      {showModal && (
        <MerchantModal
          merchant={selectedMerchant}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          onDelete={selectedMerchant ? handleDelete : undefined}
        />
      )}
    </div>
  );
}
