/**
 * ============================================================
 * 认证路由（Authentication Routes）
 * ============================================================
 *
 * 【功能】
 * 处理用户登录、登出和身份验证相关的 HTTP 请求。
 *
 * 【RESTful API 设计】
 * - POST   /api/auth/login  → 用户登录，验证凭证并发放 JWT Token
 * - GET    /api/auth/me     → 获取当前登录用户的信息
 *
 * 【为什么叫"路由"？】
 * 路由（Route）是 URL 路径与处理函数之间的映射关系。
 * 客户端通过 HTTP 方法 + URL 路径来"找到"对应的处理逻辑。
 *
 * 【与中间件的关系】
 * 路由处理器本身就是一种"末端中间件"——它们是请求处理的最后一环，
 * 负责实际执行业务逻辑并返回响应。
 */

import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { store } from '../store.js';
import { JWT_SECRET } from '../middleware/auth.js';

/**
 * 创建路由实例
 *
 * 【什么是 Router？】
 * Express.Router() 创建一个"子路由"实例，可以：
 *   - 拥有独立的中间件和路由规则
 *   - 被挂载到主应用的特定路径下
 *   - 保持代码模块化（每个资源类型一个 Router）
 *
 * 例如：router.post('/login') 实际响应 POST /api/auth/login
 *       （因为在 index.js 中使用了 app.use('/api/auth', authRoutes)）
 */
const router = Router();

/**
 * 演示环境凭证表
 *
 * 【为什么在演示环境中硬编码凭证？】
 * 在教学/演示项目中，我们用简单的方式模拟用户认证：
 *   - 用户名 → 查找预设凭证 → 验证密码 → 签发 Token
 *
 * 【生产环境的做法】
 * 生产环境中，凭证应存储在数据库中，密码应使用 bcrypt 哈希：
 *   const isValid = await bcrypt.compare(password, user.passwordHash);
 *
 * 【用户角色】
 * - admin     → 系统管理员（可管理所有资源）
 * - merchant  → 商家用户（只能管理自己的订单）
 */
const DEMO_CREDENTIALS = {
  // 管理员账号：admin / admin123
  admin: {
    password: 'admin123',
    role: 'admin',
    userId: 'admin-001',
    name: '系统管理员',
  },
  // 商家账号：starbucks / starbucks123
  starbucks: {
    password: 'starbucks123',
    role: 'merchant',
    merchantId: 'MCH-001',
    name: '星巴克管理员',
  },
  // 商家账号：mcdonalds / mcdonalds123
  mcdonalds: {
    password: 'mcdonalds123',
    role: 'merchant',
    merchantId: 'MCH-002',
    name: '麦当劳管理员',
  },
};

/**
 * POST /api/auth/login
 * 用户登录接口
 *
 * 【请求体格式】
 * {
 *   "username": "admin",
 *   "password": "admin123"
 * }
 *
 * 【登录流程】
 *  1. 接收用户名和密码
 *  2. 验证凭证是否匹配
 *  3. 生成 JWT Token（包含用户身份信息）
 *  4. 返回 Token 给客户端
 *
 * 【客户端如何使用 Token】
 * 后续请求需要在请求头中携带：
 *   Authorization: Bearer <token>
 * 客户端通常将 Token 存储在 localStorage 或 Cookie 中。
 */
router.post('/login', (req, res) => {
  // 从请求体中解构出用户名和密码
  // req.body 由 express.json() 中间件解析（将 JSON 转为对象）
  const { username, password } = req.body;

  // 基础验证：用户名和密码不能为空
  // 防御性编程：永远不要相信客户端传来的数据
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  // 在凭证表中查找用户
  const cred = DEMO_CREDENTIALS[username];

  // 验证失败的两重检查：
  // 1. 用户不存在（cred 为 undefined）
  // 2. 密码不匹配
  // 注意：即使用户不存在，也返回相同的错误信息（防止用户名枚举攻击）
  if (!cred || cred.password !== password) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  // 凭证验证成功，开始签发 JWT Token
  //
  // jwt.sign(payload, secret, options) 签发一个新的 Token
  //
  // payload（载荷）：包含在 Token 中的用户信息
  //   - userId   → 用户唯一标识
  //   - username → 用户名
  //   - role     → 角色（admin 或 merchant）
  //   - name     → 显示名称
  //   - merchantId → 商家用户的关联商家 ID（管理员无此字段）
  //
  // options：
  //   - expiresIn: '24h' → Token 在 24 小时后自动过期
  //     这样即使用户忘记登出，Token 也会在一天后失效
  //     过期时间应根据安全性需求权衡（越短越安全，但用户体验越差）
  //
  // 【为什么要在 Token 中存储这些信息？】
  // JWT 的核心优势是"自包含"——验证 Token 时不需要查数据库。
  // 这些信息会在每次请求的认证中间件中被解码出来，直接使用。
  const token = jwt.sign(
    {
      userId: cred.userId,
      username,
      role: cred.role,
      name: cred.name,
      // 只有商家用户才有 merchantId
      merchantId: cred.merchantId,
    },
    JWT_SECRET, // 签名密钥（与验证时使用同一个密钥）
    { expiresIn: '24h' } // Token 有效期
  );

  // 返回成功响应，包含 Token 和用户基本信息
  // 注意：不要返回密码相关的任何信息！
  res.json({
    token,
    user: {
      userId: cred.userId,
      username,
      role: cred.role,
      name: cred.name,
      merchantId: cred.merchantId,
    },
  });
});

/**
 * GET /api/auth/me
 * 获取当前登录用户的信息
 *
 * 【用途】
 * 客户端在刷新页面后，可以通过这个接口恢复用户的登录状态：
 *   1. 检查 localStorage 中是否有 Token
 *   2. 带着 Token 调用 /api/auth/me
 *   3. 服务端解码 Token，返回用户信息
 *   4. 客户端根据返回信息恢复登录状态
 *
 * 【无需认证的原因】
 * 这个接口本身不需要额外的认证检查，因为：
 *   - 它依赖于请求头中的 Authorization
 *   - 如果没有有效的 Token，服务端会返回 401
 *   - 这本身就是一种"认证"
 */
router.get('/me', (req, res) => {
  // 从请求头中获取 Authorization 字段
  // 格式应为：Bearer <token>
  const authHeader = req.headers.authorization;

  // 检查是否有 Authorization 头
  // 注意：使用可选链 ?. 可以安全地处理 undefined（不会报错）
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权' });
  }

  // 提取 Token 字符串
  const token = authHeader.split(' ')[1];

  try {
    // 验证 Token 并解码
    // jwt.verify(token, secret) 会：
    //   1. 检查签名是否正确
    //   2. 检查是否过期
    //   3. 如果验证失败，抛出异常
    //   4. 如果成功，返回解码后的 payload 对象
    const decoded = jwt.verify(token, JWT_SECRET);

    // 返回解码后的用户信息
    res.json({ user: decoded });
  } catch {
    // 验证失败（可能是过期或被篡改）
    res.status(401).json({ error: 'Token 无效' });
  }
});

export default router;
