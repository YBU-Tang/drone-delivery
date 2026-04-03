/**
 * ============================================
 * App.jsx - 商家端应用路由配置
 * ============================================
 * 
 * 【商家端的路由结构】
 * 
 * 商家端比后台端简单，只有两个页面：
 * - /dashboard    → 订单列表（首页）
 * - /create-order  → 创建订单
 * 
 * 【与后台端的关系】
 * 虽然商家端也有自己的 App.jsx 和路由配置
 * 但它和后台端是两个独立的应用
 * 
 * 它们：
 * - 独立运行在不同端口
 * - 独立打包部署
 * - 共享数据通过 JSON 文件（或未来的 API）
 */

// 从 react-router-dom 导入
import { Routes, Route, Navigate } from 'react-router-dom';

// 导入布局组件
import MerchantLayout from './components/Layout/MerchantLayout';

// 导入页面组件
import Dashboard from './pages/Dashboard';       // 订单列表
import CreateOrder from './pages/CreateOrder';   // 创建订单

/**
 * App 组件
 */
function App() {
  return (
    <Routes>
      {/**
       * 父路由：MerchantLayout
       * 所有商家端页面都在这个布局中
       */}
      <Route path="/" element={<MerchantLayout />}>
        
        {/**
         * 默认重定向到 /dashboard
         */}
        <Route 
          index 
          element={<Navigate to="/dashboard" replace />} 
        />
        
        {/**
         * 订单列表页面
         */}
        <Route 
          path="dashboard" 
          element={<Dashboard />} 
        />
        
        {/**
         * 创建订单页面
         */}
        <Route 
          path="create-order" 
          element={<CreateOrder />} 
        />
        
      </Route>
    </Routes>
  );
}

export default App;
