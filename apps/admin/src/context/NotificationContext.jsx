/**
 * ============================================================
 * 通知上下文（Notification Context）
 * ============================================================
 *
 * 【什么是通知系统？】
 * 通知是用户界面中向用户传达操作结果的重要机制。
 * 良好的通知系统应该：
 *   - 即时反馈：操作后立即显示结果
 *   - 非阻塞：不打断用户的当前操作流程
 *   - 自动消失：不需要用户手动关闭
 *
 * 【通知类型】
 * - success（成功）：操作成功完成，如"订单已创建"
 * - error（错误）：操作失败，如"网络连接失败"
 * - warning（警告）：需要用户注意，如"电量过低"
 * - info（信息）：一般性提示，如"数据已刷新"
 *
 * 【设计选择】
 * 本实现采用"toast"风格的即时通知：
 *   - 出现在屏幕右上角
 *   - 自动在几秒后消失
 *   - 可手动关闭
 *
 * 【为什么不使用 Alert/Dialog？】
 * Alert/Dialog 需要用户主动确认，会打断操作流程。
 * toast 通知则是非侵入式的，用户可以继续操作，系统在后台提示。
 */

import { createContext, useContext, useState, useCallback } from 'react';

// 创建通知上下文
const NotificationContext = createContext(null);

/**
 * 全局通知 ID 计数器
 *
 * 【为什么需要 ID？】
 * 通知是数组存储的，每条通知需要有唯一标识：
 *   1. 用于关闭时查找（dismiss 函数需要知道关闭哪一条）
 *   2. 用于 React 的 key prop（提高列表渲染性能）
 *
 * 【为什么用 ++ 而不是 --？】
 * 自增 ID，随着时间推移 ID 会越来越大。
 * 如果用 setTimeout 清除通知，多个通知不会冲突。
 */
let notifId = 0;

/**
 * 通知提供者组件
 *
 * 【职责】
 * 1. 管理通知列表状态
 * 2. 提供显示通知的方法（notify）
 * 3. 提供关闭通知的方法（dismiss）
 * 4. 渲染通知 Toast 组件
 */
export function NotificationProvider({ children }) {
  // 通知列表状态，每项包含 { id, message, type }
  const [notifications, setNotifications] = useState([]);

  /**
   * 显示通知
   *
   * 【参数】
   * - message：通知内容
   * - type：通知类型（success | error | warning | info），默认为 info
   * - duration：显示时长（毫秒），默认为 4000ms，设为 0 则不自动关闭
   *
   * 【返回值】
   * 返回该通知的 ID，可用于手动关闭
   *
   * 【实现原理】
   * 1. 生成唯一 ID 并递增
   * 2. 将新通知添加到数组（使用函数式更新，保持状态最新）
   * 3. 设置定时器，到期后自动移除该通知
   *
   * 【useCallback 的作用】
   * notify 函数会被传递给多个子组件，如果每次渲染都创建新函数，
   * 会导致不必要的重新渲染。用 useCallback 缓存函数引用。
   */
  const notify = useCallback((message, type = 'info', duration = 4000) => {
    // 生成唯一 ID
    const id = ++notifId;

    // 添加到通知列表
    // prev 是当前状态，展开后加上新通知
    setNotifications((prev) => [...prev, { id, message, type }]);

    // 设置自动关闭定时器
    if (duration > 0) {
      setTimeout(() => {
        // 定时器到期后，从数组中移除该通知
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, duration);
    }

    // 返回 ID，可选用于手动关闭
    return id;
  }, []); // 空依赖：notify 函数引用稳定

  /**
   * 手动关闭通知
   *
   * 【为什么需要手动关闭？】
   * 用户可能想立即关闭通知，而不是等待自动消失。
   * 比如通知内容太多，用户想快速清理。
   */
  const dismiss = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  /**
   * 渲染逻辑
   *
   * 【组件结构】
   * <NotificationProvider>
   *   {children}           ← 业务组件
   *   <NotificationToast /> ← 通知组件
   * </NotificationProvider>
   *
   * NotificationToast 放在 children 后面，
   * 这样它在 DOM 中会渲染在业务组件之后，
   * 但通过 CSS 定位（fixed）可以显示在屏幕任意位置。
   */
  return (
    <NotificationContext.Provider value={{ notify, dismiss }}>
      {children}
      {/* 通知 Toast 组件，接收 notifications 和 dismiss 作为 props */}
      <NotificationToast notifications={notifications} onDismiss={dismiss} />
    </NotificationContext.Provider>
  );
}

/**
 * 使用通知上下文的 Hook
 *
 * 【使用示例】
 * ```jsx
 * import { useNotification } from './context/NotificationContext';
 *
 * function SaveButton() {
 *   const { notify } = useNotification();
 *
 *   const handleSave = async () => {
 *     try {
 *       await saveData();
 *       notify('保存成功', 'success');
 *     } catch (e) {
 *       notify('保存失败', 'error');
 *     }
 *   };
 *
 *   return <button onClick={handleSave}>保存</button>;
 * }
 * ```
 */
export function useNotification() {
  return useContext(NotificationContext);
}

/**
 * 通知 Toast 组件
 *
 * 【渲染逻辑】
 * 如果通知列表为空，直接返回 null（不渲染任何 DOM），
 * 这是 React 的常见优化手段。
 *
 * 【样式定位】
 * 使用 fixed 定位，固定在屏幕右上角：
 *   - top: 1rem（16px）
 *   - right: 1rem（16px）
 *   - z-index: 9999（确保在最上层）
 *
 * 【动画效果】
 * 使用 CSS @keyframes 实现 slide-in 动画：
 *   - 初始状态：从右侧滑入（translateX: 100%）
 *   - 最终状态：正常位置（translateX: 0）
 *   - 过渡时间：0.3s ease-out
 *
 * 【无障碍考虑】
 * 通知使用固定的背景颜色区分类型（而不是仅用图标或颜色），
 * 让色盲用户也能区分通知类型。
 */
function NotificationToast({ notifications, onDismiss }) {
  // 没有通知时，不渲染任何东西
  if (notifications.length === 0) return null;

  /**
   * 通知类型到背景颜色的映射
   *
   * 【颜色语义】
   * - success：绿色 → 表示积极、正面的结果
   * - error：红色 → 表示错误、失败
   * - warning：黄色 → 表示需要注意但不紧急
   * - info：蓝色 → 一般性信息
   *
   * 【Tailwind CSS 颜色】
   * bg-green-500、bg-red-500 等是 Tailwind 的预设颜色类。
   * 它们会被编译成具体的 CSS，如 rgb(34, 197, 94)。
   */
  const bgColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  };

  return (
    /**
     * 通知容器
     *
     * 使用 flex-col 垂直排列通知（先显示的在上面）。
     * max-w-sm 限制最大宽度，防止通知在宽屏上占太多空间。
     * pointer-events-none 让容器本身不响应鼠标事件，
     * 这样点击页面时不会误触到通知容器（通知使用 pointer-events-auto）。
     */
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map((n) => (
        <div
          key={n.id}
          /**
           * 单条通知
           *
           * bgColors[n.type] || bgColors.info：
           *   如果找不到对应的颜色类型，使用默认的蓝色。
           *
           * pointer-events-auto：
           *   虽然外层容器设置了 pointer-events-none，
           *   但这一层重新启用鼠标事件，这样按钮可以点击。
           */
          className={`${bgColors[n.type] || bgColors.info} text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between gap-3 pointer-events-auto animate-slide-in`}
          style={{ animation: 'slideIn 0.3s ease-out' }}
        >
          {/* 通知文本 */}
          <span className="text-sm font-medium">{n.message}</span>

          {/* 关闭按钮 */}
          <button
            onClick={() => onDismiss(n.id)}
            className="text-white/80 hover:text-white text-lg leading-none"
            aria-label="关闭通知"
          >
            {/* 使用 × 符号作为关闭图标 */}
            ×
          </button>
        </div>
      ))}

      {/* 动画样式定义 */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
