/**
 * ============================================
 * App.jsx - 应用主路由配置文件
 * ============================================
 * 
 * 【什么是路由？】
 * 路由就是 URL 路径和页面的对应关系
 * 比如：
 *   /dashboard -> 显示仪表盘页面
 *   /drones    -> 显示无人机管理页面
 * 
 * 【路由的作用】
 * - 实现单页应用（SPA），不刷新页面切换内容
 * - 用户访问不同 URL，看到不同的页面
 * 
 * 【React Router 核心概念】
 * 
 * 1. Routes - 路由容器，所有 Route 必须包在里面
 *    类似于一个 switch 语句，匹配第一个符合的路由
 * 
 * 2. Route - 定义单个路由规则
 *    属性：
 *    - path: URL 路径，如 "/dashboard"
 *    - element: 匹配时显示的组件，如 <Dashboard />
 * 
 * 3. Navigate - 编程式导航，用于跳转
 *    to="/xxx" 跳转到指定路径
 *    replace=true 表示替换当前历史记录
 * 
 * 4. Outlet - 嵌套路由的插槽
 *    用于在父组件中渲染子路由组件
 * 
 * 【嵌套路由】
 * 当访问 /dashboard 时：
 * 1. Routes 找到 path="/" 的 Route
 * 2. 渲染 AdminLayout 组件
 * 3. AdminLayout 中的 <Outlet /> 插槽会渲染 path="dashboard" 的 Dashboard 组件
 */

// 从 react-router-dom 导入路由相关组件
import { Routes, Route, Navigate } from 'react-router-dom';

// 导入布局组件（包含侧边栏和主内容区）
import AdminLayout from './components/Layout/AdminLayout';

// 导入各个页面组件
import Dashboard from './pages/Dashboard';           // 地图总览页面
import DroneManagement from './pages/DroneManagement'; // 无人机管理页面
import MerchantManagement from './pages/MerchantManagement'; // 商家管理页面

/**
 * App 组件 - 应用的根组件
 * 这里定义了整个应用的路由规则
 */
function App() {
  return (
    /**
     * Routes 组件 - 路由容器
     * 它会根据当前 URL 找到匹配的 Route 并渲染对应的组件
     */
    <Routes>
      {/**
       * Route 组件 - 定义路由规则
       * 
       * path="/" 表示根路径（首页）
       * element={<AdminLayout />} 指定这个路径渲染的组件
       * 
       * AdminLayout 是一个"布局组件"，包含：
       * - 左侧的导航栏
       * - 右侧的内容区域 (<Outlet>)
       * 
       * 所有后台管理的子路由都会在这个布局中显示
       */}
      <Route path="/" element={<AdminLayout />}>
        
        {/**
         * index Route - 默认显示的页面
         * 当访问 "/" 时，会重定向到 "/dashboard"
         * replace=true 表示替换浏览器历史记录中的当前条目
         */}
        <Route 
          index 
          element={<Navigate to="/dashboard" replace />} 
        />
        
        {/**
         * 子路由 - 在 AdminLayout 的 <Outlet> 位置渲染
         * 
         * path="dashboard" 对应 URL "/dashboard"
         * element={<Dashboard />} 指定渲染的组件
         */}
        <Route 
          path="dashboard" 
          element={<Dashboard />} 
        />
        
        <Route 
          path="drones" 
          element={<DroneManagement />} 
        />
        
        <Route 
          path="merchants" 
          element={<MerchantManagement />} 
        />
        
      </Route>
    </Routes>
  );
}

export default App;

/**
 * 【路由匹配示例】
 * 
 * 用户访问 URL → 匹配的 Route → 渲染的组件
 * 
 * "/"         → path="/"        → AdminLayout
 *                              → Outlet 位置渲染 Navigate (跳转到 /dashboard)
 * 
 * "/dashboard"→ path="/"        → AdminLayout
 *                              → path="dashboard" → Dashboard
 * 
 * "/drones"   → path="/"        → AdminLayout
 *                              → path="drones" → DroneManagement
 * 
 * "/merchants"→ path="/"        → AdminLayout
 *                              → path="merchants" → MerchantManagement
 */
