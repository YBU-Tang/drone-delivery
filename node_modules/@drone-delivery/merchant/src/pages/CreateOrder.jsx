import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Package, Navigation, CheckCircle, XCircle, Clock } from 'lucide-react';
import useStore from '../hooks/useOrders';
import { calculateDistance } from '@shared/utils/distance.js';
import { DEFAULT_FLIGHT_SPEED } from '@shared/constants.js';

/**
 * ============================================
 * CreateOrder.jsx - 创建订单页面
 * ============================================
 * 
 * 【页面功能】
 * 商家创建新的配送订单
 * 
 * 【表单流程】
 * 1. 填写配送信息（地址、经纬度、重量）
 * 2. 点击"创建订单"按钮
 * 3. 系统自动分配最近的无人机
 * 4. 显示分配结果
 * 5. 2秒后自动跳转到订单列表
 * 
 * 【核心 Hook】
 * - useState: 管理表单数据
 * - useNavigate: 编程式路由跳转
 * - useStore: 状态管理（创建订单、获取可用无人机）
 */

/**
 * CreateOrder 组件
 */
export default function CreateOrder() {
  // useNavigate - 路由跳转 Hook
  // navigate('/xxx') 可以跳转到指定路径
  const navigate = useNavigate();
  
  // 从 Store 获取数据和方法
  const { currentMerchant, addOrder, getAvailableDrones } = useStore();
  
  /**
   * useState - React Hook，用于在函数组件中添加状态
   * 
   * 语法：const [变量名, set函数] = useState(初始值)
   * 
   * - formData: 表单数据对象
   * - setFormData: 更新表单数据的函数
   * 
   * 当 formData 变化时，React 会自动重新渲染组件
   */
  const [formData, setFormData] = useState({
    address: '',    // 配送地址
    latitude: '',   // 纬度
    longitude: '',  // 经度
    weight: '0.5',  // 物品重量
  });
  
  /**
   * result - 订单创建结果
   * null 表示尚未创建
   * { order, assignedDrone } 表示创建成功
   */
  const [result, setResult] = useState(null);

  /**
   * handleSubmit - 表单提交处理函数
   * 
   * @param {Event} e - 表单提交事件
   */
  const handleSubmit = async (e) => {
    // 阻止表单默认提交行为（防止页面刷新）
    e.preventDefault();

    // 表单验证
    if (!formData.address || !formData.latitude || !formData.longitude) {
      alert('请填写完整的配送信息');
      return;
    }

    // 将字符串转换为数字
    const lat = parseFloat(formData.latitude);
    const lon = parseFloat(formData.longitude);

    // 验证经纬度范围
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      alert('请输入有效的经纬度');
      return;
    }

    // 调用 Store 的 addOrder 方法创建订单
    // 这个方法会：
    // 1. 生成订单号
    // 2. 计算距离和预计时间
    // 3. 分配最近的无人机
    // 4. 返回订单信息和分配的无人机
    const { order, assignedDrone } = addOrder(formData);
    
    // 保存结果，用于显示成功/失败界面
    setResult({ order, assignedDrone });

    // 2秒后自动跳转到订单列表页面
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  // 获取当前可用的无人机数量
  const availableDrones = getAvailableDrones();
  
  /**
   * 计算配送距离
   * 只有当经纬度都填写了才计算
   */
  const distance = formData.latitude && formData.longitude
    ? calculateDistance(currentMerchant.position, {
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      })
    : 0;

  /**
   * 计算预计配送时间
   * 时间 = 距离 / 速度 * 2（去程 + 回程）
   */
  const estimatedTime = distance > 0 ? Math.ceil((distance / DEFAULT_FLIGHT_SPEED) * 2) : 0;

  return (
    <div className="p-6">
      <header className="mb-6">
        <h2 className="text-2xl font-bold">创建配送订单</h2>
        <p className="text-gray-500">填写配送信息，系统将自动分配最近空闲无人机</p>
      </header>

      {/**
       * 条件渲染：显示结果还是表单
       * 
       * result !== null → 显示创建结果
       * result === null → 显示表单
       */}
      {result ? (
        // ==================================
        // 【结果展示界面】
        // ==================================
        <div className="bg-white rounded-lg shadow p-6 max-w-lg mx-auto">
          <div className="text-center">
            {result.assignedDrone ? (
              // 成功分配无人机
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-green-600 mb-2">订单创建成功</h3>
                <p className="text-gray-600 mb-4">
                  已分配无人机 <span className="font-bold">{result.assignedDrone.name}</span>
                </p>
                <p className="text-sm text-gray-500">
                  订单号: {result.order.id}
                </p>
                <p className="text-sm text-gray-500">
                  预计送达: {Math.floor(result.order.estimatedDuration / 60)}:{String(result.order.estimatedDuration % 60).padStart(2, '0')}
                </p>
              </>
            ) : (
              // 没有可用无人机
              <>
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-yellow-600 mb-2">订单已创建</h3>
                <p className="text-gray-600 mb-4">
                  暂无空闲无人机，订单将进入排队等待
                </p>
                <p className="text-sm text-gray-500">
                  订单号: {result.order.id}
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        // ==================================
        // 【表单填写界面】
        // ==================================
        <div className="grid grid-cols-2 gap-6">
          {/* 商家信息卡片 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-600" />
              商家信息
            </h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">商家:</span> {currentMerchant.name}</p>
              <p><span className="text-gray-500">地址:</span> {currentMerchant.address}</p>
              <p><span className="text-gray-500">位置:</span> {currentMerchant.position.latitude.toFixed(6)}, {currentMerchant.position.longitude.toFixed(6)}</p>
            </div>
          </div>

          {/* 可用无人机卡片 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              可用无人机
            </h3>
            <p className="text-3xl font-bold text-blue-600">{availableDrones.length}</p>
            <p className="text-sm text-gray-500">台空闲无人机可用</p>
          </div>

          {/* 配送信息表单 */}
          <div className="col-span-2 bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">配送信息</h3>
            
            {/**
             * <form> 表单
             * onSubmit={handleSubmit} - 表单提交时调用 handleSubmit
             */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 配送地址 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  配送地址
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="请输入详细配送地址"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* 经纬度（两列布局） */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    纬度 (Latitude)
                  </label>
                  <input
                    type="text"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="例如: 31.2400"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    经度 (Longitude)
                  </label>
                  <input
                    type="text"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="例如: 121.4750"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* 物品重量 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  物品重量 (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/**
               * 距离和预计时间提示
               * 条件渲染：只有填写了经纬度才显示
               */}
              {distance > 0 && (
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Navigation className="w-5 h-5 text-orange-600" />
                      <span className="font-medium">距离: {(distance / 1000).toFixed(2)} 公里</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-orange-600" />
                      <span className="font-medium">预计: {Math.floor(estimatedTime / 60)}:{String(estimatedTime % 60).padStart(2, '0')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 提交按钮 */}
              <button
                type="submit"
                className="w-full py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
              >
                创建订单
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
