/**
 * ============================================================
 * WebSocket 实时通信服务（WebSocket Service）
 * ============================================================
 *
 * 【什么是 WebSocket？】
 * WebSocket 是一种在单个 TCP 连接上提供全双工通信的协议。
 * 与传统的 HTTP 请求-响应模式不同，WebSocket 允许服务端主动向客户端推送数据。
 *
 * 【HTTP vs WebSocket 对比】
 *
 *            HTTP                        WebSocket
 *   ───────────────────────────────  ───────────────────────────
 *   客户端发起，服务端响应           双方都可以随时发送消息
 *   每次请求都要建立新连接           建立一次连接，持续通信
 *   无状态，每次请求独立             有状态，连接可持续
 *   适合"查询"类操作                适合"实时更新"类操作
 *   实时性差（需要轮询）            实时性强（服务端可推送）
 *
 * 【适用场景】
 * 无人机配送系统需要实时显示：
 *   - 无人机位置变化（每 2 秒更新一次）
 *   - 订单状态变更
 *   - 模拟服务启动/停止通知
 *
 * 【本项目使用的库】
 * - 服务端：ws 库（Node.js 最流行的 WebSocket 库，轻量、速度快）
 * - 客户端：浏览器原生 WebSocket API
 *
 * 【WebSocket 连接的生命周期】
 *  1. 客户端发送 HTTP 升级请求（带 Upgrade 头）
 *  2. 服务端响应 101 Switching Protocols
 *  3. TCP 连接升级为 WebSocket 连接
 *  4. 双方可以双向通信
 *  5. 任意一方 close() 或网络断开时，连接关闭
 */

import { WebSocketServer } from 'ws';
import { createServer } from 'http';

/**
 * WebSocket 服务器实例的引用
 * 注意：这是模块级变量，整个模块中都可以访问
 */
let wss = null;

/**
 * 初始化 WebSocket 服务器
 *
 * 【设置步骤】
 * 1. 保存 WebSocketServer 实例的引用
 * 2. 注册连接事件处理器（connection）
 * 3. 在连接处理器中注册消息和关闭事件
 *
 * @param {WebSocketServer} websocketServer - 从 index.js 传入的 WebSocketServer 实例
 */
export function setupWebSocket(websocketServer) {
  wss = websocketServer;

  // 注册"客户端连接"事件处理器
  // 每次有客户端连接时，'connection' 事件就会被触发
  wss.on('connection', (ws) => {
    console.log('[WS] Client connected');

    // ─────────────────────────────────────────────────────────
    // 发送连接成功消息
    // ─────────────────────────────────────────────────────────
    // 客户端刚连接时，可能还没有当前状态。
    // 我们主动发送一条"已连接"消息，让客户端知道连接成功。
    // 客户端收到后可以开始请求初始数据。
    sendToClient(ws, {
      type: 'connected',
      timestamp: new Date().toISOString()
    });

    // ─────────────────────────────────────────────────────────
    // 处理客户端发来的消息
    // ─────────────────────────────────────────────────────────
    ws.on('message', (message) => {
      try {
        // message 是 Buffer 类型（原始字节），需要转换为字符串再解析为 JSON
        // toString() 将 Buffer 转为 JSON 字符串
        // JSON.parse() 将字符串转为 JavaScript 对象
        const data = JSON.parse(message.toString());
        handleMessage(ws, data);
      } catch {
        // 如果消息格式错误（不是有效 JSON），静默忽略
        // 实际生产中应该记录日志
      }
    });

    // ─────────────────────────────────────────────────────────
    // 处理连接断开事件
    // ─────────────────────────────────────────────────────────
    ws.on('close', () => {
      console.log('[WS] Client disconnected');
    });

    // ─────────────────────────────────────────────────────────
    // 处理连接错误事件
    // ─────────────────────────────────────────────────────────
    // WebSocket 错误不会导致进程崩溃，但需要记录日志便于排查
    ws.on('error', (err) => {
      console.error('[WS] Error:', err.message);
    });
  });
}

/**
 * 处理客户端发来的消息
 *
 * 【消息类型】
 * - ping：心跳检测，用于检测连接是否还活着
 *   客户端定期发送 ping，服务端回复 pong
 *
 * 【为什么需要心跳？】
 * WebSocket 底层是 TCP，不会自然地检测连接是否断开。
 * 如果客户端崩溃或网络中断，服务端不会知道连接已失效。
 * 心跳机制可以及时发现断开的连接，释放资源。
 */
function handleMessage(ws, data) {
  switch (data.type) {
    case 'ping':
      // 收到 ping，返回 pong
      sendToClient(ws, { type: 'pong', timestamp: new Date().toISOString() });
      break;
    default:
      // 忽略未知类型的消息
      break;
  }
}

/**
 * 向所有客户端广播消息
 *
 * 【广播模式】
 * 当服务端有数据更新时，向所有连接的客户端发送相同的消息。
 * 这是一对多（1:N）的通信模式。
 *
 * 【使用场景】
 * - 无人机位置更新：所有客户端都需要看到最新的位置
 * - 订单状态变更：管理员和商家都需要看到
 *
 * @param {string} type    - 消息类型
 * @param {*} payload      - 消息数据
 */
export function broadcastUpdate(type, payload) {
  // 如果 WebSocket 服务器未初始化，直接返回
  if (!wss) return;

  // 构造消息对象
  // 包含 type（类型）、payload（数据）和 timestamp（时间戳）
  // 时间戳用于客户端判断数据的时效性
  const message = JSON.stringify({
    type,
    payload,
    timestamp: new Date().toISOString()
  });

  // 遍历所有连接的客户端
  // wss.clients 是包含所有已连接 WebSocket 客户端的 Set
  wss.clients.forEach((client) => {
    // WebSocket 的 readyState：
    //   0 = CONNECTING（正在连接）
    //   1 = OPEN（连接打开，可以通信）
    //   2 = CLOSING（正在关闭）
    //   3 = CLOSED（已关闭）
    // 只有状态为 1（OPEN）的连接才能发送消息
    if (client.readyState === 1) { // 1 = WebSocket.OPEN
      client.send(message);
    }
  });
}

/**
 * 向指定客户端发送消息
 *
 * 【与 broadcastUpdate 的区别】
 * broadcastUpdate  → 向所有客户端广播
 * sendToClient     → 向单个客户端发送（通常用于响应客户端的请求）
 *
 * @param {WebSocket} ws  - 目标 WebSocket 连接
 * @param {Object} data   - 要发送的数据
 */
function sendToClient(ws, data) {
  // 发送前检查连接状态
  // 如果连接已关闭，向它发送数据会报错
  if (ws.readyState === 1) { // 1 = WebSocket.OPEN
    ws.send(JSON.stringify(data));
  }
}
