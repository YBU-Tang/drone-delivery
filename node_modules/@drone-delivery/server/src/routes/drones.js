/**
 * ============================================================
 * 无人机路由（Drone Routes）
 * ============================================================
 *
 * 【功能】
 * 提供无人机的 CRUD（增删改查）接口。
 *
 * 【RESTful API 设计】
 * - GET    /api/drones       → 获取所有无人机列表
 * - GET    /api/drones/:id   → 获取指定无人机的详情
 * - POST   /api/drones       → 添加新无人机（仅管理员）
 * - PATCH  /api/drones/:id   → 更新无人机信息（仅管理员）
 * - DELETE /api/drones/:id   → 删除无人机（仅管理员）
 *
 * 【CRUD 说明】
 * CRUD 是四种基本数据操作的缩写：
 *   Create（创建）→ POST
 *   Read   （读取）→ GET
 *   Update （更新）→ PATCH 或 PUT
 *   Delete （删除）→ DELETE
 *
 * 【PATCH vs PUT】
 * - PUT：替换整个资源（要求提供完整的字段）
 * - PATCH：部分更新（只提供要修改的字段）
 * 本系统使用 PATCH，因为它更灵活，客户端不需要知道所有字段
 *
 * 【路由参数 :id】
 * Express 路由中的 :id 称为"路由参数"（Route Parameter）。
 * 例如 GET /api/drones/DRONE-001 中的 "DRONE-001" 会被捕获到 req.params.id 中。
 */

import { Router } from 'express';
import { store } from '../store.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/drones
 * 获取所有无人机的列表
 *
 * 【中间件说明】
 * authenticate 中间件确保只有登录用户才能访问此接口。
 * 在真实应用中，有些接口可能不需要认证（如公开商品列表），
 * 这时就不需要加 authenticate 中间件。
 */
router.get('/', authenticate, (req, res) => {
  // 返回无人机列表和总数
  // 使用包装对象 { drones: [...], total: 8 } 而非直接返回数组
  // 好处：可以随时添加更多元数据（如分页信息、过滤条件等）而不改变接口结构
  res.json({ drones: store.drones, total: store.drones.length });
});

/**
 * GET /api/drones/:id
 * 获取指定无人机的详情
 *
 * 【路径参数】
 * req.params.id 包含 URL 中的 :id 部分
 * 例如请求 GET /api/drones/DRONE-001 时，req.params.id = 'DRONE-001'
 */
router.get('/:id', authenticate, (req, res) => {
  // 在无人机数组中查找匹配的无人机
  // Array.find() 返回第一个满足条件的元素，找不到则返回 undefined
  const drone = store.drones.find((d) => d.id === req.params.id);

  // 处理"未找到"的情况
  // 这是 API 开发中的重要原则：总是处理边界情况
  if (!drone) {
    return res.status(404).json({ error: '无人机不存在' });
  }

  // 返回无人机详情
  res.json(drone);
});

/**
 * POST /api/drones
 * 添加新的无人机
 *
 * 【权限控制】
 * requireAdmin 中间件确保只有管理员可以执行此操作。
 * 这是 RBAC（Role-Based Access Control，基于角色的访问控制）的实现方式。
 *
 * 【请求体格式】
 * {
 *   "name": "新无人机",
 *   "model": "DJI-M300",
 *   "position": { "latitude": 31.23, "longitude": 121.47 },
 *   "baseStation": "BS-001"
 * }
 */
router.post('/', authenticate, requireAdmin, (req, res) => {
  // 从请求体中解构需要的字段
  const { name, model, position, baseStation } = req.body;

  // 必填字段验证
  // 防御性编程：即使前端有验证，后端也必须验证
  if (!name || !model) {
    return res.status(400).json({ error: '名称和型号不能为空' });
  }

  // 自动生成新无人机的 ID
  // 格式：DRONE-001, DRONE-002, ...
  // String.padStart(3, '0') 将数字补齐为 3 位，不足前面补 0
  // 例如：1 → "001"，10 → "010"，100 → "100"
  const id = `DRONE-${String(store.drones.length + 1).padStart(3, '0')}`;

  // 根据机型自动设置最大飞行速度
  // 【策略模式】不同型号的无人机有不同的性能参数
  // 这种设计使得添加新型号时只需要修改这一处代码
  const maxSpeed = model === 'DJI-FPV'
    ? 18   // FPV 竞速机，速度最快
    : model === 'DJI-Mavic3'
      ? 20 // Mavic3 速度快但稳定
      : 15; // 默认 M300 速度

  // 构建新无人机对象
  const newDrone = {
    id,
    name,
    model,
    // 新无人机默认状态为"空闲"（idle）
    status: 'idle',
    // 如果未提供位置，使用上海市中心的默认位置
    position: position || { latitude: 31.2304, longitude: 121.4737 },
    // 新无人机电池满格
    battery: 100,
    maxSpeed,
    // 新无人机当前速度为 0（停机状态）
    currentSpeed: 0,
    // 新无人机暂无任务
    currentTask: null,
    // 所属基站（默认为 BS-001）
    baseStation: baseStation || 'BS-001',
    // 创建时间（ISO 8601 格式，便于前端格式化显示）
    createdAt: new Date().toISOString(),
  };

  // 将新无人机添加到数组
  // 注意：数组的 push 是同步操作，直接修改原数组
  store.drones.push(newDrone);

  // 返回 201 Created（表示成功创建了新资源）
  // 同时返回创建的资源内容，让客户端可以立即使用
  res.status(201).json(newDrone);
});

/**
 * PATCH /api/drones/:id
 * 更新无人机的部分信息
 *
 * 【为什么用 PATCH？】
 * PATCH 用于"部分更新"——只修改提供的字段，其他字段保持不变。
 * 与 PUT 的区别：PUT 会用请求体完全替换资源。
 *
 * 【allowed 白名单机制】
 * 我们只允许更新特定字段，防止客户端意外修改不该改的数据。
 * 例如：客户端不能直接修改无人机的 id、createdAt 等关键字段。
 * 这种"白名单"模式比"黑名单"更安全（除非明确允许，否则都禁止）。
 */
router.patch('/:id', authenticate, requireAdmin, (req, res) => {
  // 查找目标无人机
  const drone = store.drones.find((d) => d.id === req.params.id);

  if (!drone) {
    return res.status(404).json({ error: '无人机不存在' });
  }

  // 定义允许修改的字段白名单
  // 只有这些字段可以被客户端修改
  const allowed = ['name', 'status', 'battery', 'model', 'baseStation'];

  // 遍历白名单，逐一更新
  // 注意：只更新请求体中提供的字段（值为 undefined 时跳过）
  // 这样客户端只需要发送要修改的字段，无需发送完整对象
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) {
      drone[key] = req.body[key];
    }
  });

  // 返回更新后的完整无人机对象
  // RESTful 规范建议：PATCH 成功后返回更新后的资源
  res.json(drone);
});

/**
 * DELETE /api/drones/:id
 * 删除指定的无人机
 *
 * 【RESTful 删除规范】
 * - 成功删除：返回 200 OK（或 204 No Content）
 * - 资源不存在：返回 404 Not Found
 *
 * 【软删除 vs 硬删除】
 * 这里使用的是"硬删除"（直接从数组中移除）。
 * 实际生产环境中，通常使用"软删除"：
 *   - 给资源添加一个 deletedAt 或 isDeleted 字段
 *   - 查询时自动过滤已删除的记录
 *   - 优点：保留数据、可审计、可恢复
 */
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  // 查找要删除的无人机在数组中的索引
  // Array.findIndex() 返回第一个匹配的索引，找不到返回 -1
  const idx = store.drones.findIndex((d) => d.id === req.params.id);

  // 如果找不到（idx === -1），返回 404
  if (idx === -1) {
    return res.status(404).json({ error: '无人机不存在' });
  }

  // 从数组中删除元素
  // Array.splice(idx, 1) 从索引 idx 开始，删除 1 个元素
  store.drones.splice(idx, 1);

  // 返回成功信息
  res.json({ message: '删除成功' });
});

export default router;
