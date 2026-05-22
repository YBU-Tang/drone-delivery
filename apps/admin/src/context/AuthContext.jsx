/**
 * ============================================================
 * 认证上下文（Authentication Context）
 * ============================================================
 *
 * 【什么是 Context（上下文）？】
 * React Context 是 React 16.3 引入的一种组件树级数据传递机制。
 * 它允许数据在组件树中"穿透"传递，无需手动通过每一层组件的 props 层层传递。
 *
 * 【为什么需要认证上下文？】
 * 认证状态（user, login, logout）需要在多个组件中使用：
 *   - 登录页：需要调用 login()
 *   - 导航栏：需要显示用户名、退出按钮
 *   - 受保护路由：需要检查 user 是否存在
 *   - 各个页面：可能需要判断用户角色
 *
 * 【不使用 Context 的替代方案】
 * - Prop Drilling：将 login/logout/user 通过 props 层层传递（繁琐、耦合高）
 * - Redux/Zustand：使用全局状态管理库（功能强大但学习成本高）
 * - 对于简单的认证状态，Context 已经足够
 *
 * 【Context 的工作原理】
 *   Provider（提供者）        Consumer（消费者）
 *        ↓ 数据                    ↑
 *   所有子组件  ────────────→ 可以读取数据
 *
 * 我们将 AuthProvider 放在组件树根部（App），所有子组件都可以访问认证状态。
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@shared/api/client.js';

/**
 * 创建认证上下文
 *
 * createContext() 创建一个 Context 对象。
 * 该对象包含两个组件：
 *   - Provider：提供数据
 *   - Consumer：消费数据（在新版 React 推荐使用 useContext hook）
 *
 * 传入 null 作为默认值。
 * 当组件树中没有对应的 Provider 时，会使用这个默认值。
 */
const AuthContext = createContext(null);

/**
 * 认证状态提供者组件
 *
 * 【职责】
 * 1. 管理认证相关的状态（user, loading）
 * 2. 提供登录/登出方法
 * 3. 初始化时检查是否已有有效的登录会话
 *
 * 【Props】
 * - children：子组件（会包裹在 Provider 中）
 *
 * 【为什么用 useCallback 包装 checkAuth？】
 * useCallback 创建的函数具有稳定的引用（依赖不变时不会重新创建）。
 * 这在传递给子组件作为回调时很重要，可以避免子组件不必要的重新渲染。
 * 在 checkAuth 中我们使用了它作为依赖，所以需要用 useCallback 包装。
 */
export function AuthProvider({ children }) {
  // 用户信息状态，初始为 null（表示未登录）
  const [user, setUser] = useState(null);

  // 加载状态，初始为 true（页面加载时需要检查登录状态）
  const [loading, setLoading] = useState(true);

  /**
   * 检查当前登录状态
   *
   * 【执行时机】
   * 1. 页面首次加载时（在 useEffect 中调用）
   * 2. 用户刷新页面后
   *
   * 【检查流程】
   * 1. 从 localStorage 读取 Token（由 api.login() 存储）
   * 2. 如果没有 Token，说明从未登录过，跳过
   * 3. 如果有 Token，调用 /api/auth/me 验证 Token 有效性
   * 4. 如果验证成功，恢复用户登录状态
   * 5. 如果验证失败（Token 过期/无效），清除本地存储的 Token
   */
  const checkAuth = useCallback(async () => {
    // 从 API 模块获取 Token（可能存储在 localStorage 中）
    const token = api.getToken();

    // 如果没有 Token，说明用户从未登录过，无需检查
    if (!token) {
      setLoading(false); // 结束加载状态
      return;
    }

    try {
      // 调用 /api/auth/me 接口验证 Token
      const { user } = await api.getMe();
      // 验证成功，恢复用户登录状态
      setUser(user);
    } catch {
      // 验证失败（Token 过期或被篡改）
      // 清除本地存储的 Token，防止使用无效 Token 继续请求
      api.logout();
    } finally {
      // 无论成功还是失败，都结束加载状态
      // 这样页面可以正常渲染
      setLoading(false);
    }
  }, []); // 空依赖数组：checkAuth 引用稳定，只创建一次

  /**
   * 页面加载时自动检查登录状态
   *
   * 【useEffect 的执行时机】
   * React 会在组件首次渲染到 DOM 后执行 useEffect 中的回调。
   *
   * 【为什么需要这个 effect？】
   * 用户刷新页面时，React 组件会重新挂载，
   * 所有状态都会重置为初始值（user = null, loading = true）。
   * 我们需要从 localStorage 中恢复用户的登录状态。
   */
  useEffect(() => {
    checkAuth();
  }, [checkAuth]); // 依赖 checkAuth 函数（由 useCallback 创建，引用稳定）

  /**
   * 登录方法
   *
   * 【参数】
   * - username：用户名
   * - password：密码
   *
   * 【返回值】
   * 成功时返回 user 对象，失败时抛出异常
   *
   * 【登录后发生了什么？】
   * 1. 调用 /api/auth/login 接口
   * 2. 服务端验证凭证，签发 JWT Token
   * 3. 客户端收到 Token，存储到 localStorage（由 api.login() 处理）
   * 4. 更新 user 状态，触发组件重新渲染
   * 5. 页面跳转到仪表盘
   */
  const login = async (username, password) => {
    const { user } = await api.login(username, password);
    setUser(user); // 更新用户状态，触发 UI 更新
    return user;
  };

  /**
   * 登出方法
   *
   * 【执行步骤】
   * 1. 调用 api.logout() 清除本地存储的 Token
   * 2. 将 user 状态设为 null
   *
   * 【为什么要清除 user 状态？】
   * user 状态决定了页面显示登录状态还是已登录状态。
   * 登出后，必须将 user 设为 null，页面才会正确显示登录页。
   */
  const logout = () => {
    api.logout(); // 清除 localStorage 中的 Token
    setUser(null); // 清除用户状态
  };

  /**
   * 提供给子组件的值
   *
   * 【value 对象的内容】
   * - user：当前登录用户信息（null 表示未登录）
   * - loading：是否正在检查登录状态
   * - login：登录方法
   * - logout：登出方法
   * - isAdmin：是否为管理员（computed 属性，简化子组件判断）
   *
   * 【为什么 isAdmin 不用 useMemo？】
   * 因为 user 本身就是响应式状态，每次变化都会重新渲染使用 AuthContext 的组件。
   * 即使用 useMemo 缓存，性能差异也不明显。
   */
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        // 派生状态：user?.role === 'admin'
        // 使用可选链 ?.，当 user 为 null 时不会报错，返回 undefined
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 使用认证上下文的 Hook
 *
 * 【为什么要封装成 Hook？】
 * React 官方推荐的 Context 消费方式是 useContext hook。
 * 我们再次封装一层，提供更有语义的函数名。
 *
 * 【使用示例】
 * ```jsx
 * import { useAuth } from './context/AuthContext';
 *
 * function NavBar() {
 *   const { user, logout } = useAuth();
 *
 *   if (!user) return <LoginLink />;
 *   return (
 *     <div>
 *       欢迎，{user.name}
 *       <button onClick={logout}>退出</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * 【为什么 useAuth 比 useContext(AuthContext) 更好？】
 * 1. 更简洁，不需要每次都传入 AuthContext
 * 2. 如果以后要修改 context 结构，只需要改这里
 * 3. 语义更清晰，代码可读性更好
 */
export function useAuth() {
  return useContext(AuthContext);
}
