/**
 * ============================================================
 * 身份认证与权限验证中间件
 * ============================================================
 *
 * 【核心概念】
 * 在现代 Web 应用中，并非所有接口都是公开的。很多接口需要验证请求者的身份（Authentication），
 * 甚至需要确认请求者拥有特定权限（Authorization）。这两个步骤通常通过中间件（Middleware）来实现。
 *
 * 【工作原理】
 * 中间件是在请求到达最终路由处理器之前的一层"拦截器"。Express 按顺序执行每个中间件：
 *   请求 → middleware1 → middleware2 → 路由处理器 → 响应
 * 中间件可以：
 *   1. 检查请求头（如 Authorization）
 *   2. 解析并验证 Token
 *   3. 将用户信息挂载到 req 对象上，供后续处理器使用
 *   4. 如验证失败，直接返回错误响应，阻止请求继续
 *
 * 【JWT（JSON Web Token）】
 * JWT 是一种开放标准（RFC 7519），用于在各方之间安全地传输信息。
 * 结构：header.payload.signature（由服务端密钥签名）
 * 特点：
 *   - 自包含（Self-contained）：Token 本身包含了用户信息，无需查库验证
 *   - 防篡改：任何修改都会导致签名验证失败
 *   - 无状态：服务端不存储会话，适合分布式系统
 *
 * 【使用场景】
 * - authenticate：验证用户已登录（任何登录用户可访问）
 * - requireAdmin：验证用户是管理员（仅管理员可访问）
 */

import jwt from 'jsonwebtoken';

/**
 * 【重要】JWT 密钥
 * 用于对 Token 进行签名和验证。实际生产环境中：
 *   - 必须通过环境变量（process.env.JWT_SECRET）注入
 *   - 密钥应足够长、足够随机（如 32+ 字符）
 *   - 切勿将密钥硬编码在代码中，更不能提交到 Git
 */
const JWT_SECRET = process.env.JWT_SECRET || 'drone-delivery-secret-key-2026';

/**
 * ─────────────────────────────────────────────────────────────
 * authenticate：身份认证中间件
 * ─────────────────────────────────────────────────────────────
 *
 * 【功能】
 * 验证请求是否携带有效的 JWT Token。
 *
 * 【HTTP 授权头格式】
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *   - "Bearer" 是一个约定前缀，表明令牌的类型
 *   - 后面跟着的就是实际的 JWT 字符串
 *
 * 【验证流程】
 * 1. 从请求头中提取 Authorization 字段
 * 2. 检查是否以 "Bearer " 开头（防止传入其他类型的令牌）
 * 3. 截取 Token 字符串
 * 4. 用 JWT_SECRET 进行解密验证
 *    - 如果 Token 被篡改或过期，jwt.verify() 会抛出异常
 * 5. 验证通过后，将解密得到的用户信息挂载到 req.user
 * 6. 调用 next() 将控制权交给下一个中间件或路由处理器
 *
 * 【为什么叫 "authenticate"？】
 * authenticate = 确认"你是谁"（身份验证）
 * authorize    = 确认"你有什么权限"（权限验证）
 */
export function authenticate(req, res, next) {
  // 第1步：从请求头中获取 Authorization 字段
  // req.headers.authorization 的格式为："Bearer <token>"
  const authHeader = req.headers.authorization;

  // 第2步：检查是否提供了 Token
  // 如果没有 Authorization 头，或不是以 "Bearer " 开头，说明用户未登录
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // 直接返回 401 未授权，阻止请求继续
    return res.status(401).json({ error: '未授权，请先登录' });
  }

  // 第3步：提取 Token 字符串（去掉 "Bearer " 前缀）
  const token = authHeader.split(' ')[1];

  try {
    // 第4步：验证 Token 的签名和有效期
    // jwt.verify(token, secret) 会：
    //   - 检查签名是否匹配（防篡改）
    //   - 检查 Token 是否在有效期内（exp 字段）
    //   - 返回解码后的 payload（即登录时 sign() 传入的数据）
    const decoded = jwt.verify(token, JWT_SECRET);

    // 第5步：将解码后的用户信息挂载到 req 对象上
    // 后续的路由处理器可以通过 req.user 访问当前登录用户的信息
    // 这是一种常见的"请求级状态传递"模式
    req.user = decoded;

    // 第6步：调用 next()，将控制权移交给下一个中间件或路由处理器
    // 如果忘记调用 next()，请求会一直挂起，最终超时
    next();
  } catch {
    // 第7步：Token 验证失败（可能是过期、被篡改、格式错误等）
    // jwt.verify() 在验证失败时会抛出 JsonWebTokenError 或 TokenExpiredError
    // 这里统一返回 401，表示"身份验证失败"
    return res.status(401).json({ error: 'Token 无效或已过期' });
  }
}

/**
 * ─────────────────────────────────────────────────────────────
 * requireAdmin：权限验证中间件
 * ─────────────────────────────────────────────────────────────
 *
 * 【功能】
 * 确保当前请求者具有管理员角色。
 *
 * 【使用场景】
 * 管理员专用操作，如：
 *   - 添加/删除无人机
 *   - 添加/删除商家
 *   - 开启/关闭模拟服务
 *
 * 【与 authenticate 的关系】
 * requireAdmin 必须在 authenticate 之后使用！
 * 因为它依赖于 req.user 的存在（由 authenticate 填充）。
 * 执行顺序：请求 → authenticate（验证身份） → requireAdmin（验证权限） → 路由处理器
 *
 * 【为什么不把两个功能合并成一个？】
 * 单一职责原则（SRP）：
 *   - authenticate 负责"你是谁"
 *   - requireAdmin 负责"你有什么权限"
 * 拆分后更灵活，例如某些接口只需要登录但不需要管理员权限
 */
export function requireAdmin(req, res, next) {
  // 检查 req.user 是否存在（由 authenticate 中间件设置）
  // 同时检查 role 字段是否为 'admin'
  if (req.user?.role !== 'admin') {
    // 403 Forbidden：用户已登录，但权限不足
    return res.status(403).json({ error: '需要管理员权限' });
  }

  // 权限验证通过，继续处理请求
  next();
}

/**
 * 将 JWT_SECRET 导出给 auth.js 路由使用
 * 【为什么要导出？】
 * auth.js 中的 /login 端点需要使用同一个密钥来签发 Token
 * jwt.sign() 和 jwt.verify() 必须使用相同的密钥，否则验证会失败
 *
 * 【更好的做法】
 * 在生产环境中，应使用 dotenv 从 .env 文件加载密钥：
 *   import dotenv from 'dotenv';
 *   dotenv.config();
 *   const JWT_SECRET = process.env.JWT_SECRET;
 */
export { JWT_SECRET };
