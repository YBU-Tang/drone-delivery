/**
 * ============================================================
 * WebSocket Hook（实时通信 Hook）
 * ============================================================
 *
 * 【功能】
 * 提供 WebSocket 连接的 React Hook，支持：
 *   - 自动连接与重连
 *   - 消息接收回调
 *   - 消息发送接口
 *
 * 【设计思路】
 * 作为 React Hook 封装 WebSocket，有几个关键考虑：
 *   1. 生命周期管理：组件挂载时连接，卸载时断开
 *   2. 自动重连：连接断开后自动尝试重连
 *   3. 状态同步：使用 useRef 避免不必要的重渲染
 *
 * 【为什么用 useRef 而不是 useState？】
 * WebSocket 实例、重连定时器等不需要触发重渲染的数据，
 * 用 useRef 存储更合适（修改 ref 不会导致组件重新渲染）。
 */

import { useEffect, useRef, useCallback } from 'react';

/**
 * WebSocket 服务地址
 * 从环境变量读取，允许在不同环境使用不同地址。
 */
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';

/**
 * WebSocket Hook
 *
 * @param {Function} onMessage - 收到消息时的回调函数
 * @returns {Object} { send } - send 方法用于发送消息
 *
 * 【使用示例】
 * ```jsx
 * function MyComponent() {
 *   const { send } = useWebSocket((data) => {
 *     console.log('收到消息:', data);
 *   });
 *
 *   useEffect(() => {
 *     send({ type: 'ping' }); // 发送心跳
 *   }, [send]);
 *
 *   return <div>WebSocket Demo</div>;
 * }
 * ```
 */
export function useWebSocket(onMessage) {
  // WebSocket 实例引用（避免触发重渲染）
  const wsRef = useRef(null);

  // 重连定时器引用
  const reconnectTimeoutRef = useRef(null);

  /**
   * 建立 WebSocket 连接
   *
   * 【防重复连接】
   * 检查 wsRef.current?.readyState：
   *   WebSocket.OPEN = 1（已连接）
   *   如果已经连接，直接返回，不创建新连接
   */
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      // 创建新的 WebSocket 连接
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      // ─────────────────────────────────────────────────────────
      // 连接成功事件
      // ─────────────────────────────────────────────────────────
      ws.onopen = () => {
        console.log('[WS] Connected');
      };

      // ─────────────────────────────────────────────────────────
      // 收到消息事件
      // ─────────────────────────────────────────────────────────
      ws.onmessage = (event) => {
        try {
          // 解析 JSON 消息
          const data = JSON.parse(event.data);
          // 调用回调函数处理消息
          onMessage?.(data);
        } catch {
          // JSON 解析失败，忽略该消息
        }
      };

      // ─────────────────────────────────────────────────────────
      // 连接断开事件
      // ─────────────────────────────────────────────────────────
      ws.onclose = () => {
        console.log('[WS] Disconnected, reconnecting in 3s...');
        // 3 秒后尝试重连
        // 注意：必须使用箭头函数，否则 this 会指向 window
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      // ─────────────────────────────────────────────────────────
      // 连接错误事件
      // ─────────────────────────────────────────────────────────
      // WebSocket 错误通常会导致连接关闭，
      // onclose 会负责重连逻辑，这里只需要关闭连接
      ws.onerror = () => {
        ws.close();
      };

    } catch {
      // 创建 WebSocket 失败（如 URL 无效），也尝试重连
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    }
  }, [onMessage]);

  /**
   * 组件挂载时建立连接
   *
   * 【依赖项】
   * connect 函数依赖 onMessage，当 onMessage 变化时需要重建连接。
   * 这是 useCallback 的第二个参数 [] 的原因——
   * 我们希望只在组件首次挂载时连接一次。
   *
   * 【清理函数】
   * 返回的清理函数在组件卸载时执行：
   *   - 清除重连定时器
   *   - 关闭 WebSocket 连接
   */
  useEffect(() => {
    connect();
    return () => {
      // 清除可能存在的重连定时器
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      // 关闭 WebSocket 连接
      wsRef.current?.close();
    };
  }, [connect]);

  /**
   * 发送消息
   *
   * 【为什么用 useCallback？】
   * send 方法会被传递给子组件或 useEffect。
   * 用 useCallback 缓存后，可以确保函数引用稳定，
   * 避免子组件因引用变化而重新渲染。
   */
  const send = useCallback((data) => {
    // 只在连接打开时发送
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  // 返回发送方法，供外部使用
  return { send };
}
