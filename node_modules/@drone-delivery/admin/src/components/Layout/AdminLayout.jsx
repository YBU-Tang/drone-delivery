/**
 * ============================================
 * AdminLayout.jsx - 后台管理系统布局组件
 * ============================================
 * 
 * 【什么是布局组件？】
 * 布局组件是用来包裹页面的"外壳"
 * 
 * 典型结构：
 * ┌─────────────────────────────────┐
 * │          Header (头部)           │
 * ├───────────┬─────────────────────┤
 * │  Sidebar  │                     │
 * │  (侧边栏) │   Main Content      │
 * │           │   (主内容区)         │
 * │  - 导航1  │                     │
 * │  - 导航2  │   <Outlet />        │
 * │  - 导航3  │   路由页面在这里      │
 * │           │                     │
 * ├───────────┴─────────────────────┤
 * │          Footer (底部)           │
 * └─────────────────────────────────┘
 * 
 * 【Outlet 是什么？】
 * Outlet 是 React Router 提供的组件
 * 它是一个"插槽"，用于渲染子路由的内容
 * 
 * 就像 PowerPoint 的占位符：
 * - 幻灯片模板（Layout）定义好整体布局
 * - 具体内容（子路由页面）放到预留的位置（Outlet）
 * 
 * 【NavLink 是什么？】
 * NavLink 是 Link 的升级版
 * - Link: 点击跳转到指定路径
 * - NavLink: 点击跳转 + 自动添加"选中"样式（isActive）
 */

// 从 react-router-dom 导入路由相关组件
import { NavLink, Outlet } from 'react-router-dom';

// 导入 Lucide 图标库
import { Map, Plane, Store } from 'lucide-react';

/**
 * 导航配置数组
 * 定义了后台系统的三个导航项
 * 
 * 结构说明：
 * - to: 点击后跳转的路径
 * - icon: 显示的图标组件
 * - label: 显示的文字
 */
const navItems = [
  { to: '/dashboard', icon: Map, label: '地图总览' },
  { to: '/drones', icon: Plane, label: '无人机管理' },
  { to: '/merchants', icon: Store, label: '商家管理' },
];

/**
 * AdminLayout 组件
 * 后台系统的整体布局
 */
export default function AdminLayout() {
  return (
    /**
     * flex 布局
     * - 外层 div: 使用 flexbox，左右布局
     * - aside: 左侧导航栏，固定宽度 256px (w-64)
     * - main: 右侧主内容区，flex-1 占满剩余空间
     */
    <div className="min-h-screen flex">
      
      {/**
       * <aside> - 侧边栏
       * - 固定在左侧
       * - 深色背景 (bg-gray-900)
       * - 包含：
       *   1. Logo 区域
       *   2. 导航菜单
       *   3. 底部信息
       */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        
        {/**
         * Logo 区域
         * 包含系统名称和副标题
         */}
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold flex items-center gap-2">
            {/* Plane 图标 */}
            <Plane className="w-6 h-6" />
            无人机配送平台
          </h1>
          <p className="text-sm text-gray-400 mt-1">后台管理系统</p>
        </div>

        {/**
         * 导航菜单
         * 使用 map 遍历 navItems 数组生成导航链接
         */}
        <nav className="flex-1 p-4">
          {navItems.map(({ to, icon: Icon, label }) => (
            /**
             * NavLink - 导航链接组件
             * 
             * isActive 参数：
             * - 当当前 URL 匹配 to 属性时，isActive 为 true
             * - 当 isActive 为 true 时，添加蓝色背景
             * - 否则添加悬停效果
             */
            <NavLink
              key={to}//用路径作为唯一ID
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'           // 选中状态
                    : 'text-gray-300 hover:bg-gray-800' // 未选中状态
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/**
         * 底部信息
         * 显示当前登录用户信息
         */}
        <div className="p-4 border-t border-gray-700 text-sm text-gray-400">
          <p>管理员</p>
          <p className="text-xs mt-1">v1.0.0</p>
        </div>
      </aside>

      {/**
       * <main> - 主内容区
       * flex-1 占满剩余空间
       * bg-gray-100 设置浅灰色背景
       * 
       * <Outlet /> - 子路由渲染位置
       * 
       * 工作原理：
       * 1. 用户访问 /dashboard
       * 2. React Router 匹配到 App.jsx 中的 Route
       * 3. 渲染 AdminLayout
       * 4. AdminLayout 中的 <Outlet /> 渲染 Dashboard 组件
       * 
       * 简单理解：Outlet 就是"挖好的坑"，等着子路由来填
       */}
      <main className="flex-1 bg-gray-100">
        <Outlet />
      </main>
      
    </div>
  );
}

/**
 * 【组件层级示例】
 * 
 * <AdminLayout>
 *   ├── <aside> (侧边栏)
 *   │     └── <nav> (导航)
 *   │           ├── <NavLink to="/dashboard"> 地图总览 </NavLink>
 *   │           ├── <NavLink to="/drones"> 无人机管理 </NavLink>
 *   │           └── <NavLink to="/merchants"> 商家管理 </NavLink>
 *   │
 *   └── <main> (主内容区)
 *         └── <Outlet> ← 这里渲染子路由页面
 *               ├── 访问 /dashboard → <Dashboard />
 *               ├── 访问 /drones → <DroneManagement />
 *               └── 访问 /merchants → <MerchantManagement />
 */
