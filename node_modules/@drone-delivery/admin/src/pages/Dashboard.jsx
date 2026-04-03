import { useEffect } from 'react';
import { Plane, Package, Store, TrendingUp } from 'lucide-react';
import MapContainer from '../components/Map/MapContainer';
import useStore from '../hooks/useDrones';

export default function Dashboard() {
  const {
    drones,
    merchants,
    orders,
    simulationRunning,
    startSimulation,
    stopSimulation,
    setSelectedDrone,
    setSelectedMerchant,
    getDroneStats,
    getOrderStats,
  } = useStore();

  useEffect(() => {
    if (!simulationRunning) {
      startSimulation();
    }
    return () => {
      if (simulationRunning) {
        stopSimulation();
      }
    };
  }, []);

  const droneStats = getDroneStats();
  const orderStats = getOrderStats();

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">地图总览</h2>
            <p className="text-gray-500 text-sm">实时监控无人机和商家位置</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={simulationRunning ? stopSimulation : startSimulation}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                simulationRunning
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {simulationRunning ? '暂停模拟' : '开始模拟'}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        <div className="flex-1 relative">
          <MapContainer
            drones={drones}
            merchants={merchants}
            onDroneClick={setSelectedDrone}
            onMerchantClick={setSelectedMerchant}
          />
        </div>

        <aside className="w-80 bg-white border-l overflow-y-auto">
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={Plane}
                label="无人机总数"
                value={droneStats.total}
                color="blue"
              />
              <StatCard
                icon={Store}
                label="商家总数"
                value={merchants.length}
                color="red"
              />
              <StatCard
                icon={TrendingUp}
                label="配送中"
                value={droneStats.dispatching}
                color="green"
              />
              <StatCard
                icon={Package}
                label="订单总数"
                value={orderStats.total}
                color="purple"
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">无人机状态分布</h3>
              <div className="space-y-2">
                <StatusRow label="空闲" count={droneStats.idle} color="green" />
                <StatusRow label="配送中" count={droneStats.dispatching} color="blue" />
                <StatusRow label="返航中" count={droneStats.returning} color="yellow" />
                <StatusRow label="充电中" count={droneStats.charging} color="gray" />
                <StatusRow label="维护中" count={droneStats.maintenance} color="red" />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">订单状态分布</h3>
              <div className="space-y-2">
                <StatusRow label="待分配" count={orderStats.pending} color="gray" />
                <StatusRow label="配送中" count={orderStats.delivering} color="blue" />
                <StatusRow label="已完成" count={orderStats.delivered} color="green" />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">配送中的无人机</h3>
              <div className="space-y-2">
                {drones
                  .filter((d) => d.status === 'dispatching')
                  .map((drone) => (
                    <div
                      key={drone.id}
                      className="p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100"
                      onClick={() => setSelectedDrone(drone)}
                    >
                      <p className="font-medium text-sm">{drone.name}</p>
                      <p className="text-xs text-gray-500">
                        任务: {drone.currentTask || '无'}
                      </p>
                      <p className="text-xs text-gray-500">
                        电量: {drone.battery}% | 速度: {drone.currentSpeed} m/s
                      </p>
                    </div>
                  ))}
                {drones.filter((d) => d.status === 'dispatching').length === 0 && (
                  <p className="text-sm text-gray-400">暂无配送中的无人机</p>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function StatusRow({ label, count, color }) {
  const colors = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    gray: 'bg-gray-500',
    red: 'bg-red-500',
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${colors[color]}`} />
        <span className="text-sm">{label}</span>
      </div>
      <span className="font-medium">{count}</span>
    </div>
  );
}
