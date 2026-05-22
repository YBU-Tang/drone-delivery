/**
 * ============================================================
 * 无人机管理页面（Drone Management Page）
 * ============================================================
 *
 * 【功能】
 * 展示所有无人机列表，支持筛选、添加、编辑、删除操作。
 *
 * 【页面特性】
 * - 状态筛选标签（全部/空闲/配送中/返航中/充电中/维护中）
 * - 无人机列表表格
 * - 添加/查看详情/删除操作
 */

import { useState, useEffect } from 'react';
import { Plus, Plane, Trash2, Eye } from 'lucide-react';
import { DroneStatusBadge } from '../components/common/StatusBadge';
import AddDroneModal from '../components/Drone/AddDroneModal';
import DroneDetailsModal from '../components/Drone/DroneDetailsModal';
import useStore from '../hooks/useDrones';
import { useNotification } from '../context/NotificationContext';

/**
 * 状态筛选配置
 *
 * 【设计考量】
 * 状态筛选用"胶囊标签"形式，比下拉菜单更直观，
 * 可以一眼看到各状态的无人机数量。
 */
const statusFilters = [
  { key: 'all', label: '全部' },
  { key: 'idle', label: '空闲' },
  { key: 'dispatching', label: '配送中' },
  { key: 'returning', label: '返航中' },
  { key: 'charging', label: '充电中' },
  { key: 'maintenance', label: '维护中' },
];

/**
 * 无人机管理页面
 */
export default function DroneManagement() {
  const { drones, addDrone, removeDrone, updateDrone, fetchDrones, loading } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDrone, setSelectedDrone] = useState(null);
  const [filter, setFilter] = useState('all');
  const { notify } = useNotification();

  // 页面加载时获取无人机数据
  useEffect(() => {
    fetchDrones();
  }, [fetchDrones]);

  // 根据筛选条件过滤无人机列表
  const filteredDrones = filter === 'all'
    ? drones
    : drones.filter((d) => d.status === filter);

  // 添加无人机
  const handleAddDrone = async (droneData) => {
    try {
      await addDrone(droneData);
      notify('无人机添加成功', 'success');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  // 删除无人机
  const handleDeleteDrone = async (droneId, droneName) => {
    if (!confirm(`确定要删除无人机 "${droneName}" 吗？`)) return;
    try {
      await removeDrone(droneId);
      notify('无人机已删除', 'success');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  // 快速切换无人机状态
  const handleStatusChange = async (droneId, status) => {
    updateDrone(droneId, { status });
    notify('状态已更新', 'success');
  };

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">无人机管理</h2>
            <p className="text-gray-500 mt-0.5">管理所有无人机设备</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            添加无人机
          </button>
        </div>
      </header>

      {/* 状态筛选标签 */}
      <div className="mb-5 flex gap-2">
        {statusFilters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {label}
            {key !== 'all' && (
              <span className="ml-1.5 text-xs opacity-70">
                ({drones.filter((d) => d.status === key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 无人机列表表格 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">无人机</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">型号</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">电量</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">位置</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">当前任务</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredDrones.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-5 py-12 text-center text-gray-400">
                  {loading ? '加载中...' : '暂无数据'}
                </td>
              </tr>
            ) : (
              filteredDrones.map((drone) => (
                <tr key={drone.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Plane className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{drone.name}</p>
                        <p className="text-xs text-gray-400">{drone.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{drone.model}</td>
                  <td className="px-5 py-3.5"><DroneStatusBadge status={drone.status} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            drone.battery > 50 ? 'bg-green-500' : drone.battery > 20 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${drone.battery}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{drone.battery}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 font-mono">
                    {drone.position.latitude.toFixed(4)}, {drone.position.longitude.toFixed(4)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">
                    {drone.currentTask || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedDrone(drone)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDrone(drone.id, drone.name)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 添加无人机弹窗 */}
      {showAddModal && (
        <AddDroneModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddDrone}
        />
      )}

      {/* 无人机详情弹窗 */}
      {selectedDrone && (
        <DroneDetailsModal
          drone={selectedDrone}
          onClose={() => setSelectedDrone(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
