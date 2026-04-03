/**
 * ============================================
 * 入口文件 - 整个应用的启动点
 * ============================================
 * 
 * 这个文件是 React 应用加载的第一个 JavaScript 文件
 * 
 * 执行流程：
 * 1. ReactDOM.createRoot() - 创建一个 React 根容器，绑定到 HTML 中的 #root 元素
 * 2. render() - 渲染整个应用到根容器中
 * 
 * 组件层级：
 * StrictMode (开发环境检查工具)
 *   └── BrowserRouter (路由管理器)
 *         └── App (应用主组件)
 *               └── AdminLayout (后台布局)
 *                     └── 各页面组件 (Dashboard, DroneManagement, etc.)
 */

import React from 'react';
// ReactDOM 是 React 的 DOM 操作库，createRoot 是创建渲染根节点的方法
import ReactDOM from 'react-dom/client';

// BrowserRouter: React Router 的路由容器组件
// 作用：管理 URL 和组件的对应关系，实现单页应用(SPA)的路由切换
// 当 URL 变化时，不会刷新页面，只会更新对应的组件
import { BrowserRouter } from 'react-router-dom';

// 导入主应用组件
import App from './App';

// 导入全局样式（Tailwind CSS 的基础样式在这里）
import './index.css';

/**
 * createRoot() - 创建一个 React 根实例
 * 参数：DOM 中的一个元素（通常 id="root"）
 * 这个元素在 index.html 中定义
 */
const root = ReactDOM.createRoot(
  document.getElementById('root')
);

/**
 * render() - 将 React 组件渲染到 DOM 中
 * 
 * StrictMode 是一个开发工具组件，会帮助检测：
 * - 过时的 API 使用
 * - 不安全的生命周期方法
 * - 副作用的问题
 * 
 * BrowserRouter 包裹整个应用，使其支持路由功能
 */
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
