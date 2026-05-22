import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Store, PlusCircle, Package, History, LogOut, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import { api } from '@shared/api/client.js';

const navItems = [
  { to: '/dashboard', icon: Package, label: '订单列表' },
  { to: '/create-order', icon: PlusCircle, label: '创建订单' },
  { to: '/orders', icon: History, label: '订单历史' },
];

export default function MerchantLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [merchantName, setMerchantName] = useState('');

  useEffect(() => {
    if (user?.merchantId) {
      api.getMerchant(user.merchantId)
        .then((m) => setMerchantName(m.name))
        .catch(() => setMerchantName(user.name));
    } else {
      setMerchantName(user?.name || '商家');
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-64 bg-orange-600 text-white flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-orange-500">
          <h1 className="text-lg font-bold flex items-center gap-2.5">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            商家端
          </h1>
          <p className="text-xs text-orange-200 mt-1.5 ml-10">无人机配送服务</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-orange-100 hover:bg-orange-500'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-orange-500">
          <div className="bg-orange-700/30 rounded-lg p-3 mb-2">
            <p className="text-xs text-orange-200 mb-0.5">当前商家</p>
            <p className="text-sm font-medium text-white truncate">{merchantName}</p>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              <span className="text-xs text-orange-200">在线</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-orange-200 hover:bg-orange-500 hover:text-white rounded-lg text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
