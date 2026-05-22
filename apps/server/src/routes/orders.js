/**
 * ============================================================
 * 订单路由（Order Routes）
 * ============================================================
 *
 * 【功能】
 * 处理订单的创建、查询、状态更新等操作。
 *
 * 【订单的生命周期】
 * 订单从创建到完成，会经历多个状态：
 *
 *   pending → assigned → pickingUp → delivering → delivered
 *   (待分配) → (已分配) → (取货中)  → (配送中)   → (已送达)
 *                         ↓
 *                      cancelled
 *                      (已取消)
 *
 * 【权限控制】
 * - admin：可以查看和管理所有订单
 * - merchant：只能查看和管理自己店铺的订单
 *
 * 【自动派单逻辑】
 * 创建订单时，系统会自动分配最近的空闲无人机。
 * 这体现了配送系统的核心价值：减少人工干预，提高效率。
 */

import { Router } from 'express';
import { store } from '../store.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * 生成订单 ID
 *
 * 【ID 格式】
 * ORD-YYYYMMDD-XXX
 * 例如：ORD-20260331001
 *
 * 【设计思路】
 * 将日期嵌入 ID 中有什么好处？
 *   1. 便于人工识别和检索（看到 ID 就知道是哪天的订单）
 *   2. 按日期分区存储时，ID 天然有序
 *   3. 方便统计每日订单量
 *
 * 【自增计数的局限】
 * 如果服务重启，内存中的计数器会重置。
 * 生产环境应使用数据库的自增 ID 或分布式 ID 生成器（如 Snowflake）。
 */
function generateOrderId() {
  // 获取当前日期，格式化为 YYYYMMDD
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  // 统计今天已有的订单数量，作为序号
  const count = store.orders.filter((o) => o.id.includes(dateStr)).length + 1;
  // 拼接为完整的订单 ID
  return `ORD-${dateStr}-${String(count).padStart(3, '0')}`;
}

/**
 * 计算两点之间的直线距离
 * 使用 Haversine 公式（半正矢公式）
 *
 * 【适用场景】
 * Haversine 公式用于计算地球表面两点之间的最短距离（大圆距离）。
 * 它假设地球是一个完美的球体（虽然实际是椭球体，但误差很小）。
 *
 * 【公式原理】
 * 1. 将经纬度转换为弧度
 * 2. 计算纬度的差异（dLat）和经度的差异（dLon）
 * 3. 使用半正矢公式计算圆心角：
 *    a = sin²(dLat/2) + cos(lat1) × cos(lat2) × sin²(dLon/2)
 *    c = 2 × atan2(√a, √(1-a))
 *    d = R × c（其中 R = 6371 km 是地球半径）
 *
 * 【返回值单位】
 * 公式中地球半径 R 使用 6371000 米（6371 km）
 * 所以返回值 d 的单位是"米"
 */
function calculateDistance(pos1, pos2) {
  // 地球平均半径（米）
  const R = 6371000;

  // 将角度转换为弧度（度数 × π / 180）
  const lat1 = pos1.latitude * Math.PI / 180;
  const lat2 = pos2.latitude * Math.PI / 180;
  const dLat = (pos2.latitude - pos1.latitude) * Math.PI / 180;
  const dLon = (pos2.longitude - pos1.longitude) * Math.PI / 180;

  // Haversine 公式
  // a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  // c = 2 × atan2(√a, √(1-a))
  // d = R × c
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * GET /api/orders
 * 获取订单列表
 *
 * 【商家权限控制】
 * 如果当前用户是商家（role === 'merchant'），只返回该商家的订单。
 * 这是数据隔离的体现：商家不能查看其他商家的订单。
 *
 * 【为什么用 filter 而非数据库查询？】
 * 在内存存储中，我们直接遍历数组并过滤。
 * 在真实数据库中，SQL 查询会是：WHERE merchant_id = ?
 */
router.get('/', authenticate, (req, res) => {
  let orders = store.orders;

  // 商家用户只能看到自己的订单
  if (req.user.role === 'merchant' && req.user.merchantId) {
    // filter 返回满足条件的元素组成的新数组
    orders = orders.filter((o) => o.merchantId === req.user.merchantId);
  }

  res.json({ orders, total: orders.length });
});

/**
 * GET /api/orders/:id
 * 获取指定订单的详情
 */
router.get('/:id', authenticate, (req, res) => {
  const order = store.orders.find((o) => o.id === req.params.id);

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  // 商家用户只能查看自己的订单
  if (req.user.role === 'merchant' && order.merchantId !== req.user.merchantId) {
    return res.status(403).json({ error: '无权访问此订单' });
  }

  res.json(order);
});

/**
 * POST /api/orders
 * 创建新订单
 *
 * 【核心业务流程】
 * 1. 验证必填字段
 * 2. 获取商家信息（用于设置取货位置）
 * 3. 计算配送距离和预计时长
 * 4. 自动分配最近的空闲无人机（如果有）
 * 5. 创建订单记录
 *
 * 【自动派单算法】
 * 选择空闲且电量充足（>20%）的无人机，
 * 计算每架无人机到商家的距离，
 * 选择距离最近的那一架。
 *
 * 【为什么选择最近的？】
 *   - 减少飞行时间 → 更快的配送
 *   - 减少电池消耗 → 更多飞行次数
 *   - 降低中途没电的风险
 */
router.post('/', authenticate, (req, res) => {
  const { customerAddress, latitude, longitude, weight } = req.body;

  // 必填字段验证
  // 注意：latitude 和 longitude 是小数，需要用 == null 来检测（不能用 !）
  // 因为 latitude === 0 是合法的，而 !latitude 会错误地拒绝它
  if (!customerAddress || latitude == null || longitude == null) {
    return res.status(400).json({ error: '配送地址和位置不能为空' });
  }

  // 权限检查：只有商家可以创建订单
  // 这是业务逻辑层面的限制，而非仅仅依赖路由配置
  if (req.user.role !== 'merchant') {
    return res.status(403).json({ error: '只有商家才能创建订单' });
  }

  // 获取当前商家的信息（用于设置取货位置）
  const merchant = store.merchants.find((m) => m.id === req.user.merchantId);
  if (!merchant) {
    return res.status(404).json({ error: '商家信息不存在' });
  }

  // 生成订单 ID
  const orderId = generateOrderId();

  // 解析配送位置
  // parseFloat 确保传入的是数字字符串（如 "31.23"）时能正确转为数字
  const deliveryPosition = {
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
  };

  // 计算配送距离
  // 使用 Haversine 公式计算商家到配送点的直线距离
  const distance = calculateDistance(merchant.position, deliveryPosition);

  // 计算预计配送时长
  // 公式：(distance / 10) * 2
  // 含义：以 10m/s 的速度飞行，加上启动/降落时间
  // 实际生产中会考虑更多因素：天气、航线、空域管制等
  const estimatedDuration = Math.ceil((distance / 10) * 2);

  // 构建订单对象
  const newOrder = {
    id: orderId,
    merchantId: merchant.id,        // 商家 ID
    merchantName: merchant.name,    // 商家名称（冗余存储，避免关联查询）
    status: 'pending',              // 初始状态为"待分配"
    pickupPosition: merchant.position, // 取货位置 = 商家位置
    deliveryPosition,               // 配送位置 = 消费者位置
    customerAddress,                // 消费者文字地址
    weight: parseFloat(weight) || 0.5, // 物品重量，默认 0.5kg
    assignedDroneId: null,          // 初始未分配无人机
    timeline: {
      created: new Date().toISOString(), // 创建时间
      assigned: null,                    // 分配时间（分配后填充）
      pickedUp: null,                   // 取货时间
      delivered: null,                  // 送达时间
    },
    estimatedDuration,              // 预计时长（秒）
  };

  // ─────────────────────────────────────────────────────────
  // 自动派单逻辑
  // ─────────────────────────────────────────────────────────
  // 查找所有空闲且电量充足的无人机
  // 电量阈值设为 20%，防止电量不足导致中途降落
  const idleDrones = store.drones.filter((d) => d.status === 'idle' && d.battery > 20);

  if (idleDrones.length > 0) {
    // 找到最近的那架无人机
    let nearest = null;
    let minDist = Infinity;

    // 遍历所有空闲无人机，找出距离商家最近的那架
    for (const d of idleDrones) {
      const dist = calculateDistance(d.position, merchant.position);
      if (dist < minDist) {
        minDist = dist;
        nearest = d;
      }
    }

    // 如果找到了合适的无人机，自动分配
    if (nearest) {
      // 更新无人机状态
      nearest.status = 'dispatching';  // 状态改为"配送中"
      nearest.currentTask = orderId;   // 记录当前任务
      nearest.currentSpeed = nearest.maxSpeed; // 以最大速度飞行

      // 更新订单状态
      newOrder.status = 'assigned';    // 订单状态改为"已分配"
      newOrder.assignedDroneId = nearest.id; // 记录分配的无人机
      newOrder.timeline.assigned = new Date().toISOString(); // 记录分配时间
    }
  }

  // 将订单存入数据存储
  store.orders.push(newOrder);

  // 返回 201 Created 和新创建的订单
  res.status(201).json(newOrder);
});

/**
 * PATCH /api/orders/:id
 * 更新订单信息
 *
 * 【常见用途】
 * - 更新订单状态（取消、标记送达等）
 * - 修改配送信息
 *
 * 【allowed 白名单】
 * 只允许更新状态、分配的无人机和时间线字段。
 */
router.patch('/:id', authenticate, (req, res) => {
  const order = store.orders.find((o) => o.id === req.params.id);

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  // 允许更新的字段
  // 注意：这里没有包含 id、merchantId 等关键字段
  // 防止通过 API 修改订单的归属
  const allowed = ['status', 'assignedDroneId', 'timeline'];

  allowed.forEach((key) => {
    if (req.body[key] !== undefined) {
      order[key] = req.body[key];
    }
  });

  res.json(order);
});

export default router;
