/**
 * ============================================================
 * 管理后台布局组件（Admin Layout）
 * ============================================================
 *
 * 【功能】
 * 提供整个后台管理系统的页面框架：
 *   - 左侧固定导航栏
 *   - 右侧内容区域（通过 Outlet 渲染子路由）
 *
 * 【React Router 的嵌套路由】
 * 布局组件（Layout）配合 <Outlet /> 实现嵌套路由：
 *
 *   <Route path="/" element={<AdminLayout />}>
 *     <Route path="dashboard" element={<Dashboard />} />
 *     <Route path="drones" element={<DroneManagement />} />
 *   </Route>
 *
 *   渲染结果：
 *   <AdminLayout>
 *     <Outlet /> ← 这里渲染 Dashboard 或 DroneManagement
 *   </AdminLayout>
 *
 * 【设计考量】
 * - 左侧导航固定，不随内容滚动
 * - 内容区域填满剩余空间，支持内部滚动
 * - 深色侧边栏提供视觉分隔，突出内容区域
 */

import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Map, Plane, Store, Package, BarChart3, Settings, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * 导航菜单配置
 *
 * 【为什么用配置数组而不是硬编码？】
 * 1. 便于维护，新增/删除页面只需修改配置
 * 2. 减少重复代码，每个菜单项的结构一致
 * 3. 便于动态渲染（如根据权限显示不同菜单）
 *
 * 【to、icon、label 的分工】
 * - to：路由路径（用于 NavLink）
 * - icon：图标组件（React 组件，传入后渲染）
 * - label：显示文字
 */
const navItems = [
  { to: '/dashboard', icon: Map, label: '地图总览' },
  { to: '/drones', icon: Plane, label: '无人机管理' },
  { to: '/merchants', icon: Store, label: '商家管理' },
  { to: '/orders', icon: Package, label: '订单管理' },
  { to: '/analytics', icon: BarChart3, label: '数据分析' },
  { to: '/settings', icon: Settings, label: '系统设置' },
];

/**
 * 管理后台布局
 *
 * 【组件结构】
 * <div>                  ← 外层容器，最小高度 100vh
 *   <aside>              ← 左侧导航栏，固定宽度
 *     <logo区域>
 *     <nav>              ← 导航链接列表
 *     <user区域>
 *   <main>               ← 主内容区，撑满剩余空间
 *     <Outlet />         ← 子路由渲染位置
 */
export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  /**
   * 处理退出登录
   *
   * 【为什么要用 navigate？】
   * logout() 清除用户状态后，需要导航回登录页。
   * 使用 navigate 可以确保 URL 和页面状态同步。
   */
  const handleLogout = () => {
    logout();    // 清除用户状态和 Token
    navigate('/login'); // 跳转到登录页
  };

  return (
    /**
     * 外层容器
     *
     * min-h-screen：最小高度为视口高度（100vh）
     * flex：将容器设为弹性盒，子元素水平排列
     * bg-gray-100：浅灰色背景，让内容区更突出
     */
    <div className="min-h-screen flex bg-gray-100">

      {/**
       * 左侧导航栏
       *
       * w-64：固定宽度 256px（16rem）
       * bg-gray-900：深灰色背景，与白色内容区形成对比
       * text-white：白色文字
       * flex flex-col：垂直排列子元素
       * flex-shrink-0：不允许收缩，保持固定宽度
       */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col flex-shrink-0">

        {/**
         * Logo 区域
         * 包含平台名称和副标题。
         */}
        <div className="p-5 border-b border-gray-700">
          <h1 className="text-lg font-bold flex items-center gap-2.5">
            {/**
             * Logo 图标
             * 深蓝色圆形背景 + 无人机图标。
             */}
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Plane className="w-4 h-4" />
            </div>
            无人机配送平台
          </h1>
          <p className="text-xs text-gray-400 mt-1.5 ml-10">后台管理系统</p>
        </div>

        {/**
         * 导航菜单
         *
         * flex-1：占据剩余所有空间
         * p-3：内边距
         * space-y-0.5：菜单项之间的间距
         */}
        <nav className="flex-1 p-3 space-y-0.5">
          {/**
           * 遍历 navItems，渲染每个导航链接
           */}
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              /**
               * NavLink 的 className 函数
               *
               * isActive 参数表示当前路由是否匹配。
               * 根据 isActive 返回不同的样式：
               *   - 激活态：蓝色背景 + 白色文字 + 阴影
               *   - 非激活态：透明背景 + 灰色文字 + 悬停效果
               */
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/**
         * 用户信息和退出按钮
         * 固定在导航栏底部。
         */}
        <div className="p-3 border-t border-gray-700">
          {/**
           * 用户信息卡片
           */}
          <div className="bg-gray-800 rounded-lg p-3 mb-2">
            <p className="text-xs text-gray-400 mb-0.5">当前用户</p>
            <p className="text-sm font-medium text-white">{user?.name || '管理员'}</p>
            <p className="text-xs text-gray-500">{user?.role === 'admin' ? '管理员' : '商家'}</p>
          </div>

          {/**
           * 退出登录按钮
           */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-red-400 rounded-lg text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      {/**
       * 主内容区域
       *
       * flex-1：占据剩余空间
       * overflow-auto：内容超出时出现滚动条（而非撑开页面）
       * min-h-0：允许 flex 子元素收缩到小于内容尺寸
       */}
      <main className="flex-1 overflow-auto">
        {/**
         * <Outlet /> 是 React Router 的占位组件
         *
         * 它会根据当前 URL，渲染匹配的子路由组件：
         *   /dashboard → Dashboard
         *   /drones → DroneManagement
         *   /merchants → MerchantManagement
         *   ...
         *
         * 这样布局组件（导航栏）保持不变，
         * 右侧内容区域动态切换。
         */}
        <Outlet />
      </main>
    </div>
  );
}
