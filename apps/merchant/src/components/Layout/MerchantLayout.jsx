import { NavLink, Outlet } from 'react-router-dom';
import { Store, PlusCircle, Package } from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: Package, label: '订单列表' },
  { to: '/create-order', icon: PlusCircle, label: '创建订单' },
];

export default function MerchantLayout() {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-orange-600 text-white flex flex-col">
        <div className="p-6 border-b border-orange-500">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Store className="w-6 h-6" />
            商家端
          </h1>
          <p className="text-sm text-orange-200 mt-1">无人机配送服务</p>
        </div>

        <nav className="flex-1 p-4">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                  isActive
                    ? 'bg-orange-500 text-white'
                    : 'text-orange-100 hover:bg-orange-500'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-orange-500 text-sm text-orange-200">
          <p>星巴克-浦东店</p>
          <p className="text-xs mt-1">在线</p>
        </div>
      </aside>

      <main className="flex-1 bg-gray-100">
        <Outlet />
      </main>
    </div>
  );
}
