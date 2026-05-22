/**
 * ============================================================
 * 系统设置页面（Settings Page）
 * ============================================================
 *
 * 【功能】
 * 提供系统运行参数的配置界面。
 */

import { useState } from 'react';
import { Settings as SettingsIcon, Database, Bell, Shield, Map, Zap, Save } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export default function Settings() {
  const { notify } = useNotification();
  const [settings, setSettings] = useState({
    simulationInterval: '1000',
    flightSpeed: '10',
    batteryThreshold: '20',
    maxOrders: '50',
    wsEnabled: 'true',
    mapZoom: '13',
  });

  const handleSave = () => {
    notify('设置已保存', 'success');
  };

  return (
    <div className="p-6 max-w-3xl">
      {/* 页面标题 */}
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">系统设置</h2>
        <p className="text-gray-500 mt-1">配置平台运行参数</p>
      </header>

      <div className="space-y-6">
        {/* 模拟参数 */}
        <SettingSection icon={Zap} title="模拟参数" description="飞行模拟相关配置">
          <div className="grid grid-cols-2 gap-4">
            <SettingField
              label="模拟间隔 (ms)"
              value={settings.simulationInterval}
              onChange={(v) => setSettings({ ...settings, simulationInterval: v })}
              description="每帧间隔，越小越快"
            />
            <SettingField
              label="默认飞行速度 (m/s)"
              value={settings.flightSpeed}
              onChange={(v) => setSettings({ ...settings, flightSpeed: v })}
              description="无人机匀速飞行速度"
            />
          </div>
        </SettingSection>

        {/* 无人机参数 */}
        <SettingSection icon={SettingsIcon} title="无人机参数" description="无人机运行阈值配置">
          <div className="grid grid-cols-2 gap-4">
            <SettingField
              label="电量预警阈值 (%)"
              value={settings.batteryThreshold}
              onChange={(v) => setSettings({ ...settings, batteryThreshold: v })}
              description="低于此值强制充电"
            />
            <SettingField
              label="最大并发订单数"
              value={settings.maxOrders}
              onChange={(v) => setSettings({ ...settings, maxOrders: v })}
              description="系统同时处理的订单上限"
            />
          </div>
        </SettingSection>

        {/* 地图设置 */}
        <SettingSection icon={Map} title="地图设置" description="地图显示参数">
          <div className="grid grid-cols-2 gap-4">
            <SettingField
              label="默认缩放级别"
              value={settings.mapZoom}
              onChange={(v) => setSettings({ ...settings, mapZoom: v })}
              description="1-18，数字越大越近"
            />
          </div>
        </SettingSection>

        {/* 实时通信 */}
        <SettingSection icon={Bell} title="实时通信" description="WebSocket 相关配置">
          <div className="grid grid-cols-2 gap-4">
            <SettingField
              label="WebSocket 启用"
              value={settings.wsEnabled}
              onChange={(v) => setSettings({ ...settings, wsEnabled: v })}
              description="开启实时数据推送"
            />
          </div>
        </SettingSection>

        {/* 安全设置 */}
        <SettingSection icon={Shield} title="安全设置" description="系统安全相关">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-sm font-medium text-yellow-800 mb-1">JWT 密钥</p>
              <p className="text-xs text-yellow-600 mb-2">当前使用默认密钥，生产环境请修改环境变量</p>
              <code className="text-xs bg-yellow-100 px-2 py-1 rounded">JWT_SECRET</code>
            </div>
          </div>
        </SettingSection>

        {/* 数据管理 */}
        <SettingSection icon={Database} title="数据管理" description="数据导入导出">
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
              导出数据 (JSON)
            </button>
            <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
              导入数据
            </button>
            <button
              onClick={() => {
                if (confirm('确定要重置所有数据吗？此操作不可恢复！')) {
                  notify('数据已重置', 'warning');
                }
              }}
              className="px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition"
            >
              重置数据
            </button>
          </div>
        </SettingSection>

        {/* 保存按钮 */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-md transition"
          >
            <Save className="w-4 h-4" />
            保存设置
          </button>
        </div>
      </div>
    </div>
  );
}

/** 设置区块组件 */
function SettingSection({ icon: Icon, title, description, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      <div className="px-6 py-4 border-b bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Icon className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-400">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

/** 设置字段组件 */
function SettingField({ label, value, onChange, description }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
    </div>
  );
}
