import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Package, Navigation, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import useStore from '../hooks/useOrders';
import { useNotification } from '../context/NotificationContext';
import { api } from '@shared/api/client.js';

export default function CreateOrder() {
  const navigate = useNavigate();
  const { addOrder, fetchOrders, merchants } = useStore();
  const { notify } = useNotification();
  const [merchant, setMerchant] = useState(null);
  const [formData, setFormData] = useState({
    address: '',
    latitude: '',
    longitude: '',
    weight: '0.5',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = api.getToken();
    if (!token) {
      navigate('/login');
      return;
    }
    api.getMe().then(({ user }) => {
      const m = merchants.find((mer) => mer.id === user.merchantId) || merchants[0];
      setMerchant(m);
    }).catch(() => navigate('/login'));
  }, []);

  const availableDrones = useStore.getState().getAvailableDrones();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.address || !formData.latitude || !formData.longitude) {
      notify('请填写完整的配送信息', 'warning');
      return;
    }
    const lat = parseFloat(formData.latitude);
    const lon = parseFloat(formData.longitude);
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      notify('请输入有效的经纬度', 'error');
      return;
    }
    setLoading(true);
    try {
      const { order } = await addOrder(formData);
      const assignedDrone = order.assignedDroneId
        ? useStore.getState().drones.find((d) => d.id === order.assignedDroneId)
        : null;
      setResult({ order, assignedDrone });
      await fetchOrders();
      setTimeout(() => navigate('/orders'), 2500);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const distance = formData.latitude && formData.longitude
    ? calculateDistance(merchant?.position, { latitude: parseFloat(formData.latitude), longitude: parseFloat(formData.longitude) })
    : 0;

  const estimatedTime = distance > 0 ? Math.ceil((distance / 10) * 2) : 0;

  return (
    <div className="p-6">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">创建配送订单</h2>
        <p className="text-gray-500 mt-1">填写配送信息，系统将自动分配最近空闲无人机</p>
      </header>

      {result ? (
        <div className="bg-white rounded-2xl shadow p-8 max-w-lg mx-auto text-center">
          {result.assignedDrone ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-green-600 mb-2">订单创建成功</h3>
              <p className="text-gray-600 mb-2">
                已分配无人机 <span className="font-bold">{result.assignedDrone.name}</span>
              </p>
              <p className="text-sm text-gray-400">订单号: {result.order.id}</p>
              <p className="text-sm text-gray-400">
                预计送达: {Math.floor(result.order.estimatedDuration / 60)}:{String(result.order.estimatedDuration % 60).padStart(2, '0')}
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-yellow-600 mb-2">订单已创建</h3>
              <p className="text-gray-600 mb-2">暂无空闲无人机，订单将进入排队等待</p>
              <p className="text-sm text-gray-400">订单号: {result.order.id}</p>
            </>
          )}
          <p className="text-xs text-gray-400 mt-4">页面将在 2.5 秒后跳转...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {/* Merchant Info */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-500" />
              商家信息
            </h3>
            <div className="space-y-1.5 text-sm">
              <p><span className="text-gray-400">商家:</span> {merchant?.name || '加载中...'}</p>
              <p><span className="text-gray-400">地址:</span> {merchant?.address || ''}</p>
              <p className="text-gray-400 text-xs">
                位置: {merchant?.position.latitude.toFixed(6)}, {merchant?.position.longitude.toFixed(6)}
              </p>
            </div>
          </div>

          {/* Available Drones */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-500" />
              可用无人机
            </h3>
            <p className="text-3xl font-bold text-blue-600">{availableDrones.length}</p>
            <p className="text-sm text-gray-400">台空闲无人机可用</p>
          </div>

          {/* Form */}
          <div className="col-span-2 bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-sm text-gray-700 mb-4">配送信息</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">配送地址 *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="请输入详细配送地址"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">纬度 *</label>
                  <input
                    type="text"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="例如: 31.2400"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">经度 *</label>
                  <input
                    type="text"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="例如: 121.4750"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">物品重量 (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
              </div>
              {distance > 0 && (
                <div className="bg-orange-50 rounded-xl p-4 flex items-center gap-5">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-orange-500" />
                    <span className="font-medium">{(distance / 1000).toFixed(2)} 公里</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-500" />
                    <span className="font-medium">
                      预计 {Math.floor(estimatedTime / 60)}:{String(estimatedTime % 60).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 font-semibold shadow-md transition"
              >
                {loading ? '创建中...' : '创建订单'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function calculateDistance(pos1, pos2) {
  if (!pos1 || !pos2) return 0;
  const R = 6371000;
  const lat1 = pos1.latitude * Math.PI / 180;
  const lat2 = pos2.latitude * Math.PI / 180;
  const dLat = (pos2.latitude - pos1.latitude) * Math.PI / 180;
  const dLon = (pos2.longitude - pos1.longitude) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
