import { useState } from 'react';
import { Plus, Plane } from 'lucide-react';
import { DroneStatusBadge } from '../components/common/StatusBadge';
import AddDroneModal from '../components/Drone/AddDroneModal';
import useStore from '../hooks/useDrones';
import { DRONE_MODELS, DEFAULT_MAP_CENTER } from '@shared/constants.js';

export default function DroneManagement() {
  const { drones, addDrone } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState('all');

  const filteredDrones = filter === 'all'//基于状态筛选无人机
    ? drones
    : drones.filter((d) => d.status === filter);

  const handleAddDrone = (droneData) => {
    const newDrone = {
      id: `DRONE-${String(drones.length + 1).padStart(3, '0')}`,
      name: droneData.name,
      model: droneData.model,
      status: 'idle',
      position: {
        latitude: DEFAULT_MAP_CENTER[0] + (Math.random() - 0.5) * 0.02,
        longitude: DEFAULT_MAP_CENTER[1] + (Math.random() - 0.5) * 0.02,
      },
      battery: 100,
      maxSpeed: droneData.model === 'DJI-FPV' ? 18 : droneData.model === 'DJI-Mavic3' ? 20 : 15,
      currentSpeed: 0,
      currentTask: null,
      baseStation: 'BS-001',
      createdAt: new Date().toISOString(),
    };
    addDrone(newDrone);
    setShowAddModal(false);
  };

  return (
    <div className="p-6">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">无人机管理</h2>
            <p className="text-gray-500">管理所有无人机设备</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            添加无人机
          </button>
        </div>
      </header>

      <div className="mb-4 flex gap-2">
        {['all', 'idle', 'dispatching', 'returning', 'charging', 'maintenance'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? '全部' : status === 'idle' ? '空闲' : status === 'dispatching' ? '配送中' : status === 'returning' ? '返航中' : status === 'charging' ? '充电中' : '维护中'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">名称</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">型号</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">电量</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">位置</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">当前任务</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredDrones.map((drone) => (
              <tr key={drone.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Plane className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{drone.name}</p>
                      <p className="text-xs text-gray-400">{drone.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">{drone.model}</td>
                <td className="px-6 py-4">
                  <DroneStatusBadge status={drone.status} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          drone.battery > 50 ? 'bg-green-500' : drone.battery > 20 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${drone.battery}%` }}
                      />
                    </div>
                    <span className="text-sm">{drone.battery}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {drone.position.latitude.toFixed(4)}, {drone.position.longitude.toFixed(4)}
                </td>
                <td className="px-6 py-4 text-sm">
                  {drone.currentTask || '-'}
                </td>
                <td className="px-6 py-4">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">
                    查看详情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <AddDroneModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddDrone}
        />
      )}
    </div>
  );
}
