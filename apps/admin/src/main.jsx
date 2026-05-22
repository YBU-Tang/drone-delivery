/**
 * ============================================================
 * React 入口文件（Entry Point）
 * ============================================================
 *
 * 【功能】
 * 启动 React 应用，将组件挂载到 DOM 中。
 *
 * 【文件职责】
 * 这是一切的起点 —— 浏览器加载 HTML 后，
 * 这段代码负责启动 React，渲染 App 组件。
 *
 * 【React 18 的变化】
 * React 18 引入了新的创建根节点方式：
 *   旧版：ReactDOM.render(<App />, document.getElementById('root'))
 *   新版：ReactDOM.createRoot(root).render(<App />)
 *
 * 新 API 支持 Concurrent Mode（并发模式），带来更好的性能。
 */

/**
 * React 入口
 *
 * 【createRoot】
 * 创建 React 根节点。React 18 开始使用双 API：
 *   1. createRoot() 创建根节点
 *   2. root.render() 渲染内容
 *
 * 这样做的原因：
 *   - 支持 concurrent rendering（并发渲染）
 *   - 支持 automatic batching（自动批处理）
 *   - 更清晰的 API 边界
 */
import React from 'react';
import ReactDOM from 'react-dom/client';

/**
 * 路由管理
 * react-router-dom 提供客户端路由功能：
 *   - BrowserRouter：基于 HTML5 History API 的路由
 *   - 允许单页面应用（SPA）实现无刷新跳转
 */
import { BrowserRouter } from 'react-router-dom';

/**
 * 应用根组件
 */
import App from './App';

/**
 * 上下文提供者
 * AuthProvider：管理用户登录状态
 * NotificationProvider：管理全局通知
 */
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

/**
 * 全局样式
 * 引入 Tailwind CSS 的入口文件
 */
import './index.css';

/**
 * 获取 DOM 根节点
 *
 * 【为什么是 'root'？】
 * 在 public/index.html 中有一个 <div id="root"></div>。
 * React 会把整个应用挂载到这个 div 中。
 *
 * 【注意】
 * 这个文件路径相对于 public/ 文件夹，而不是 src/。
 */
const root = ReactDOM.createRoot(document.getElementById('root'));

/**
 * 渲染应用
 *
 * <React.StrictMode>
 * React 严格模式是一个开发工具，帮助发现潜在问题：
 *   - 检测不推荐的 API 使用
 *   - 双重调用某些函数以发现副作用问题
 *   - 只在开发模式下生效，生产环境自动禁用
 *
 * 包裹顺序很重要：
 *   <BrowserRouter>         ← 最外层，提供路由功能
 *     <AuthProvider>         ← 提供认证状态
 *       <NotificationProvider> ← 提供通知功能
 *         <App />            ← 应用根组件
 *       </NotificationProvider>
 *     </AuthProvider>
 *   </BrowserRouter>
 */
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

/**
 * 【应用启动流程】
 *
 * 1. 浏览器加载 index.html
 * 2. 执行 main.jsx
 * 3. ReactDOM.createRoot() 创建 React 根节点
 * 4. root.render() 开始渲染
 * 5. React 创建虚拟 DOM
 * 6. AuthProvider 检查 localStorage 中的 Token
 * 7. 如果有 Token，调用 /api/auth/me 验证
 * 8. App 根据用户状态决定显示登录页还是管理后台
 */
