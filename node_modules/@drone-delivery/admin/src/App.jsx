/**
 * ============================================================
 * 应用根组件（App Component）
 * ============================================================
 *
 * 【功能】
 * 定义应用的路由结构，包括：
 *   - 登录页（/login）
 *   - 管理后台（含多个子页面）
 *
 * 【React Router v6 的路由配置】
 * 使用 <Routes> 和 <Route> 组件定义路由：
 *   <Routes>
 *     <Route path="/login" element={<LoginPage />} />
 *     <Route path="/" element={<AdminLayout />}>
 *       <Route path="dashboard" element={<Dashboard />} />
 *       ...
 *     </Route>
 *   </Routes>
 *
 * 【嵌套路由】
 * AdminLayout 是一个"布局路由"：
 *   - 它渲染导航栏（始终显示）
 *   - <Outlet /> 是子路由的渲染位置
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AdminLayout from './components/Layout/AdminLayout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import DroneManagement from './pages/DroneManagement';
import MerchantManagement from './pages/MerchantManagement';
import OrderManagement from './pages/OrderManagement';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';

/**
 * 受保护的路由组件
 *
 * 【功能】
 * 检查用户是否已登录：
 *   - 已登录 → 渲染子组件（children）
 *   - 未登录 → 重定向到 /login
 *   - 加载中 → 显示加载状态
 *
 * 【Props】
 * - children：通过 props.children 传入的子组件
 *   通常是一个布局组件（如 AdminLayout）
 *
 * 【为什么需要这个组件？】
 * 管理后台的所有页面都需要用户登录后才能访问。
 * 使用受保护路由可以统一处理权限检查，无需在每个页面重复写逻辑。
 */
function ProtectedRoute({ children }) {
  // 从认证上下文获取用户状态和加载状态
  const { user, loading } = useAuth();

  // 加载中状态：显示一个加载指示器
  // 这样用户在网络较慢时不会看到一闪而过的登录页
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          {/**
           * 加载动画
           * 使用 Tailwind 绘制一个旋转的圆环。
           * animate-spin：CSS 动画，使元素旋转
           */}
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  // 未登录状态：重定向到登录页
  // Navigate 是 React Router 的组件，用于编程式导航
  // replace 属性：用新路由替换当前历史记录（避免按返回键回到受保护页面）
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 已登录：渲染子组件
  return children;
}

/**
 * 应用根组件
 *
 * 【路由结构】
 *
 * /login              → LoginPage（登录页，公开访问）
 * /                   → AdminLayout（受保护，嵌套路由）
 *   /dashboard        → Dashboard（地图总览）
 *   /drones           → DroneManagement（无人机管理）
 *   /merchants        → MerchantManagement（商家管理）
 *   /orders           → OrderManagement（订单管理）
 *   /analytics        → Analytics（数据分析）
 *   /settings         → Settings（系统设置）
 */
export default function App() {
  return (
    /**
     * <Routes> 容器
     *
     * Routes 是 React Router v6 的组件：
     *   - 接收一组 <Route> 作为子元素
     *   - 根据当前 URL 匹配并渲染对应的 Route
     *   - 只渲染第一个匹配的 Route（不像 v5 那样支持多个匹配）
     */
    <Routes>
      {/**
       * 登录页路由
       * path="/login" 匹配 /login 路径
       * element 指定渲染的组件
       */}
      <Route path="/login" element={<LoginPage />} />

      {/**
       * 管理后台路由（受保护）
       *
       * path="/" 是基础路径
       * element 使用 ProtectedRoute 包裹 AdminLayout
       *   → 检查用户是否登录
       *   → 未登录则重定向到 /login
       *   → 已登录则渲染 AdminLayout
       */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        {/**
         * 嵌套路由
         * 这些 Route 的 element 会渲染在 AdminLayout 的 <Outlet /> 位置
         *
         * index 路由：父路径 "/" 的默认子路由
         * 访问 "/" 时，自动重定向到 "/dashboard"
         */}
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/**
         * 各功能页面路由
         */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="drones" element={<DroneManagement />} />
        <Route path="merchants" element={<MerchantManagement />} />
        <Route path="orders" element={<OrderManagement />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/**
       * 404 处理
       * 如果 URL 不匹配上面的任何路由，React Router 默认不渲染任何内容
       * （也可以添加一个 NotFoundPage 组件来显示友好提示）
       */}
    </Routes>
  );
}

/**
 * 【路由匹配流程】
 *
 * 用户访问 "/dashboard" 时：
 *   1. React Router 检查 Routes 中的 Route
 *   2. 先匹配 "/" → 匹配成功，渲染 ProtectedRoute
 *   3. ProtectedRoute 检查 user：
 *      - 如果已登录，渲染 AdminLayout
 *      - 如果未登录，重定向到 /login
 *   4. AdminLayout 渲染后，检测到有嵌套路由
 *   5. 继续匹配嵌套的 <Route path="dashboard" />
 *   6. Dashboard 被渲染到 <Outlet /> 位置
 *
 * 【URL vs 组件渲染位置】
 *
 *   URL: /dashboard
 *
 *   ┌─────────────────────────────────────────────────────────┐
 *   │  AdminLayout（始终显示）                               │
 *   │  ┌─────────────────────────────────────────────────┐  │
 *   │  │  左侧导航栏（始终显示）                         │  │
 *   │  └─────────────────────────────────────────────────┘  │
 *   │  ┌─────────────────────────────────────────────────┐  │
 *   │  │  <Outlet> → 这里渲染 Dashboard                  │  │
 *   │  │                                                 │  │
 *   │  │  Dashboard 包含地图、统计面板等                 │  │
 *   │  │                                                 │  │
 *   │  └─────────────────────────────────────────────────┘  │
 *   └─────────────────────────────────────────────────────────┘
 */
