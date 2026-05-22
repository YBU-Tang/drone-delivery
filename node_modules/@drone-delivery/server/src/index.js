/**
 * ============================================================
 * 服务器入口文件（Server Entry Point）
 * ============================================================
 *
 * 【功能】
 * 这是整个后端服务器的入口文件，负责：
 *   1. 初始化 Express 应用
 *   2. 配置中间件
 *   3. 注册路由
 *   4. 启动 WebSocket 服务
 *   5. 启动飞行模拟服务
 *   6. 监听 HTTP 端口
 *
 * 【架构概览】
 *
 *   ┌─────────────────────────────────────────────────────┐
 *   │                    HTTP Server                       │
 *   │                                                      │
 *   │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
 *   │  │  CORS    │→ │ JSON     │→ │   Router         │ │
 *   │  │ Middleware│  │ Parser   │  │                  │ │
 *   │  └──────────┘  └──────────┘  │  /api/auth       │ │
 *   │                               │  /api/drones     │ │
 *   │                               │  /api/merchants  │ │
 *   │                               │  /api/orders     │ │
 *   │                               │  /api/simulation  │ │
 *   │                               └──────────────────┘ │
 *   └─────────────────────────────────────────────────────┘
 *                      ↕ 共享同一端口
 *   ┌─────────────────────────────────────────────────────┐
 *   │                 WebSocket Server                     │
 *   │  • 实时推送无人机位置                               │
 *   │  • 推送订单状态变更                                 │
 *   │  • 心跳检测                                        │
 *   └─────────────────────────────────────────────────────┘
 *
 * 【为什么使用 createServer 而非 app.listen？】
 * 我们需要让 HTTP 和 WebSocket 共用同一个端口。
 * 使用 http.createServer(app) 创建一个 HTTP 服务器，
 * 然后将这个服务器同时用于 Express 和 WebSocketServer。
 * 这样客户端只需要连接一个端口即可。
 */

import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

// ─────────────────────────────────────────────────────────────
// 导入路由模块
// ─────────────────────────────────────────────────────────────
// 每个路由文件对应一组相关的 API 接口
// 这样代码模块化，便于维护和扩展
import droneRoutes from './routes/drones.js';      // 无人机 CRUD
import merchantRoutes from './routes/merchants.js';  // 商家 CRUD
import orderRoutes from './routes/orders.js';       // 订单 CRUD + 自动派单
import authRoutes from './routes/auth.js';          // 登录认证
import simulationRoutes from './routes/simulation.js'; // 模拟控制

// 导入服务模块
import { startSimulation } from './services/simulation.js'; // 飞行模拟
import { setupWebSocket } from './services/websocket.js';   // WebSocket 服务

// ─────────────────────────────────────────────────────────────
// 初始化服务器
// ─────────────────────────────────────────────────────────────
// express() 创建一个 Express 应用实例（本质是一个请求监听函数）
const app = express();

// createServer() 用 Express 应用作为回调函数，创建原生 HTTP 服务器
// 这样做可以让 HTTP 和 WebSocket 共享同一个服务器实例和端口
const server = createServer(app);

// ─────────────────────────────────────────────────────────────
// 配置中间件（Middleware）
// ─────────────────────────────────────────────────────────────
// 中间件是 Express 的核心概念：按顺序执行，层层过滤请求

/**
 * CORS 中间件
 * ─────────────
 * CORS（Cross-Origin Resource Sharing，跨域资源共享）
 *
 * 【什么是跨域？】
 * 浏览器的同源策略（Same-Origin Policy）禁止网页向不同源的服务器发起请求。
 * 同源 = 协议 + 域名 + 端口 三者都相同。
 *
 * 【示例】
 * 前端运行在 http://localhost:5173
 * 后端运行在 http://localhost:3001
 * 它们端口不同，所以是"跨域"请求。
 *
 * 【cors 中间件的作用】
 * 它会在响应头中添加 Access-Control-Allow-Origin 等字段，
 * 告诉浏览器允许跨域请求。
 *
 * 【安全提示】
 * 生产环境中，origin 应该设置为具体的域名，而非 *：
 *   app.use(cors({ origin: 'https://your-domain.com' }))
 */
app.use(cors());

/**
 * JSON 解析中间件
 * ─────────────────
 * express.json() 是 Express 4.16+ 内置的 JSON 解析中间件。
 *
 * 【功能】
 * 自动将请求体（request body）中的 JSON 字符串解析为 JavaScript 对象，
 * 并挂载到 req.body 上。
 *
 * 【使用前提】
 * 请求头 Content-Type 必须为 application/json
 *
 * 【示例】
 * 客户端发送：
 *   POST /api/orders
 *   Content-Type: application/json
 *   Body: {"customerAddress": "浦东", "latitude": 31.23}
 *
 * 服务端接收后：
 *   req.body = { customerAddress: "浦东", latitude: 31.23 }
 */
app.use(express.json());

// ─────────────────────────────────────────────────────────────
// 定义 API 路由
// ─────────────────────────────────────────────────────────────

/**
 * 健康检查接口
 * ─────────────
 * GET /api/health
 *
 * 【用途】
 * 用于检查服务器是否正常运行。
 * 常用于：
 *   - 负载均衡器的健康探测
 *   - 容器编排系统的存活检测（Kubernetes liveness probe）
 *   - 监控系统的定期检查
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

/**
 * 注册各模块的路由
 * ─────────────────
 * app.use(path, router) 将路由模块挂载到指定路径
 * 效果：路由器的所有路由都会以指定路径为前缀
 *
 * 例如：app.use('/api/drones', droneRoutes)
 *       如果 droneRoutes 中有 router.get('/', ...)，则对应 /api/drones/
 *       如果 droneRoutes 中有 router.get('/:id', ...)，则对应 /api/drones/:id
 */
app.use('/api/auth', authRoutes);        // 认证相关：/api/auth/login, /api/auth/me
app.use('/api/drones', droneRoutes);     // 无人机：/api/drones, /api/drones/:id
app.use('/api/merchants', merchantRoutes); // 商家：/api/merchants, /api/merchants/:id
app.use('/api/orders', orderRoutes);      // 订单：/api/orders, /api/orders/:id
app.use('/api/simulation', simulationRoutes); // 模拟：/api/simulation/status, /api/simulation/toggle

// ─────────────────────────────────────────────────────────────
// 错误处理
// ─────────────────────────────────────────────────────────────

/**
 * 404 处理
 * ─────────
 * 当请求的路径没有任何路由匹配时，会执行这个中间件。
 * 注意：必须放在所有路由之后。
 */
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

/**
 * 统一错误处理
 * ─────────────
 * Express 的错误处理中间件有 4 个参数：(err, req, res, next)
 * 当任何一个路由或中间件抛出错误时，Express 会跳过普通中间件，
 * 直接执行错误处理中间件。
 *
 * 【为什么需要专门的错误处理？】
 * 1. 统一错误响应格式
 * 2. 避免错误信息泄露给用户
 * 3. 集中处理，便于日志记录和监控
 *
 * 【注意事项】
 * - 错误处理中间件必须放在所有路由之后
 * - 生产环境中不应返回 err.stack（包含代码路径等敏感信息）
 */
app.use((err, req, res, next) => {
  console.error(err.stack); // 打印错误堆栈到服务器控制台
  res.status(500).json({ error: 'Internal server error' });
});

// ─────────────────────────────────────────────────────────────
// WebSocket 服务
// ─────────────────────────────────────────────────────────────
/**
 * WebSocket 服务器初始化
 * ─────────────────────────
 * WebSocketServer 的构造函数接收两个参数：
 *   - server：共享的 HTTP 服务器实例（这样 HTTP 和 WS 用同一端口）
 *   - path：只处理此路径的 WebSocket 连接（本项目设为 /ws）
 *
 * 这样，前端可以同时使用：
 *   - HTTP API：http://localhost:3001/api/drones
 *   - WebSocket：ws://localhost:3001/ws
 */
const wss = new WebSocketServer({ server, path: '/ws' });

// 调用 setupWebSocket 初始化 WebSocket 事件处理
setupWebSocket(wss);

// ─────────────────────────────────────────────────────────────
// 启动飞行模拟服务
// ─────────────────────────────────────────────────────────────
// startSimulation() 会启动一个定时器，每 2 秒更新一次无人机位置
// 模拟服务运行在后端，通过 WebSocket 推送更新给前端
startSimulation();

// ─────────────────────────────────────────────────────────────
// 启动 HTTP 服务器
// ─────────────────────────────────────────────────────────────
// server.listen(port, callback) 启动监听端口
// PORT 从环境变量读取，如果未设置则默认为 3001

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`[Server] API running on http://localhost:${PORT}`);
  console.log(`[Server] WebSocket running on ws://localhost:${PORT}/ws`);
});

/**
 * 【总结】
 * 这个入口文件展示了典型的 Express 服务器结构：
 *
 *   1. 导入依赖（import）
 *   2. 初始化应用（createServer）
 *   3. 配置中间件（use）
 *   4. 注册路由（use）
 *   5. 错误处理（use）
 *   6. 启动服务（listen）
 *
 * 理解了这个文件，就理解了整个服务器的架构。
 */
