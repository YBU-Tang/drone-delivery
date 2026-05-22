/**
 * ============================================================
 * 登录页面（Login Page）
 * ============================================================
 *
 * 【功能】
 * 用户登录界面，包含账号密码输入和登录验证。
 *
 * 【登录流程】
 * 1. 用户输入用户名和密码
 * 2. 点击登录按钮
 * 3. 调用 /api/auth/login 接口
 * 4. 服务端验证后返回 JWT Token
 * 5. 客户端存储 Token，跳转到仪表盘
 *
 * 【安全性考量】
 * - 密码使用 type="password"，防止旁人窥视
 * - 提供显示/隐藏密码切换
 * - 显示测试账号信息，方便演示
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

/**
 * 登录页面组件
 *
 * 【组件状态】
 * - username/password：表单输入值
 * - showPassword：是否显示密码（切换用）
 * - loading：是否正在提交（防止重复点击）
 */
export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();

  /**
   * 处理表单提交
   *
   * 【表单提交流程】
   * 1. e.preventDefault() 阻止默认提交（页面刷新）
   * 2. 前端验证（用户名密码不能为空）
   * 3. 调用 login() 进行认证
   * 4. 成功 → 显示成功提示 → 跳转仪表盘
   * 5. 失败 → 显示错误提示
   * 6. finally → 无论成功失败，都关闭 loading
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // 阻止表单默认提交行为（避免页面刷新）

    // 前端基础验证
    if (!username || !password) {
      notify('请输入用户名和密码', 'warning');
      return;
    }

    setLoading(true); // 开始加载状态
    try {
      // 调用认证上下文的 login 方法
      await login(username, password);

      // 登录成功
      notify('登录成功', 'success');
      navigate('/dashboard'); // 跳转到仪表盘
    } catch (err) {
      // 登录失败，显示错误信息
      // 错误信息由 API 响应提供
      notify(err.message, 'error');
    } finally {
      // 无论成功还是失败，都要关闭加载状态
      setLoading(false);
    }
  };

  return (
    /**
     * 页面容器
     *
     * 使用渐变背景，营造现代科技感。
     * bg-gradient-to-br：从下左到上右的渐变方向
     * from-slate-900 via-blue-900 to-slate-900：三色渐变
     * flex items-center justify-center：内容居中
     * p-4：内边距，防止小屏幕贴边
     */
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/**
         * Logo 区域
         */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Plane className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">无人机配送平台</h1>
          <p className="text-blue-300 mt-2">后台管理系统</p>
        </div>

        {/**
         * 登录表单卡片
         *
         * bg-white/10：半透明白色背景
         * backdrop-blur-lg：背景模糊效果（毛玻璃）
         * rounded-2xl：大圆角
         * border border-white/10：细微边框
         * shadow-2xl：较大阴影，增加层次感
         */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-6">管理员登录</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/**
             * 用户名输入
             */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-1.5">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                autoComplete="username"
              />
            </div>

            {/**
             * 密码输入
             * 使用相对定位包裹输入框和切换按钮。
             */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-1.5">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/**
             * 提交按钮
             *
             * disabled={loading}：提交中禁用按钮，防止重复提交
             */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 disabled:cursor-not-allowed"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          {/**
           * 测试账号信息
           * 方便演示时使用。
           */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-blue-200/60 text-sm text-center mb-3">测试账号</p>
            <div className="grid grid-cols-1 gap-2 text-sm text-blue-100">
              <div className="flex justify-between bg-white/5 rounded-lg px-3 py-2">
                <span className="text-blue-300">管理员</span>
                <span>admin / admin123</span>
              </div>
              <div className="flex justify-between bg-white/5 rounded-lg px-3 py-2">
                <span className="text-blue-300">商家-星巴克</span>
                <span>starbucks / starbucks123</span>
              </div>
              <div className="flex justify-between bg-white/5 rounded-lg px-3 py-2">
                <span className="text-blue-300">商家-麦当劳</span>
                <span>mcdonalds / mcdonalds123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
