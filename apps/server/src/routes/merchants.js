/**
 * ============================================================
 * 商家路由（Merchant Routes）
 * ============================================================
 *
 * 【功能】
 * 提供商家的 CRUD（增删改查）接口。
 *
 * 【RESTful API 设计】
 * - GET    /api/merchants       → 获取所有商家列表
 * - GET    /api/merchants/:id   → 获取指定商家的详情
 * - POST   /api/merchants       → 添加新商家（仅管理员）
 * - PATCH  /api/merchants/:id   → 更新商家信息（仅管理员）
 * - DELETE /api/merchants/:id   → 删除商家（仅管理员）
 *
 * 【商家数据敏感性】
 * 商家的密码（password）字段绝对不能返回给客户端。
 * 我们在返回数据时使用对象解构来排除该字段。
 *
 * 【对象解构的妙用】
 * const { password, ...safeMerchant } = merchant;
 * 这行代码：
 *   1. 从 merchant 对象中提取 password 字段
 *   2. 将剩余的所有字段存入 safeMerchant 对象
 * 这是从响应中排除敏感字段的简洁方式。
 */

import { Router } from 'express';
import { store } from '../store.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/merchants
 * 获取所有商家列表
 *
 * 【密码保护】
 * 我们在返回商家列表之前，使用对象解构 { password, ...m } 将密码字段排除。
 * 这是防止敏感数据泄露的基本原则：永远假设返回的数据会被记录或展示。
 *
 * 【为什么不用深拷贝？】
 * 这里使用了解构语法，相当于浅拷贝，对于商家对象来说足够了。
 * 因为 password 字段是字符串，不会被引用污染。
 */
router.get('/', authenticate, (req, res) => {
  // 返回商家列表（排除密码字段）
  // 遍历所有商家，将每个商家的 password 字段剔除
  const merchants = store.merchants.map(({ password, ...m }) => m);
  res.json({ merchants, total: merchants.length });
});

/**
 * GET /api/merchants/:id
 * 获取指定商家的详情
 */
router.get('/:id', authenticate, (req, res) => {
  // 在商家数组中查找匹配项
  const merchant = store.merchants.find((m) => m.id === req.params.id);

  if (!merchant) {
    return res.status(404).json({ error: '商家不存在' });
  }

  // 排除密码字段后再返回
  const { password, ...safeMerchant } = merchant;
  res.json(safeMerchant);
});

/**
 * POST /api/merchants
 * 添加新商家
 *
 * 【商家注册流程】
 * 1. 接收商家基本信息（名称、品类、位置等）
 * 2. 自动生成商家 ID
 * 3. 初始化营业状态和评分
 * 4. 存入数据存储
 *
 * 【ID 生成策略】
 * 与无人机类似，使用自增 + 前缀格式：MCH-001, MCH-002, ...
 */
router.post('/', authenticate, requireAdmin, (req, res) => {
  const { name, category, position, address, phone } = req.body;

  // 必填字段验证
  // 商家必须有名称、品类和位置（因为要计算配送距离）
  if (!name || !category || !position) {
    return res.status(400).json({ error: '名称、类别和位置不能为空' });
  }

  // 自动生成商家 ID
  const id = `MCH-${String(store.merchants.length + 1).padStart(3, '0')}`;

  // 构建新商家对象
  const newMerchant = {
    id,
    name,
    category,
    position, // 位置信息必须提供，用于计算配送距离
    address: address || '', // 地址可选
    phone: phone || '',     // 电话可选
    status: 'active',       // 新商家默认开始营业
    rating: 5.0,            // 新商家初始评分为 5.0（满分）
    createdAt: new Date().toISOString(),
    // 设置一个占位密码，生产环境中商家应自行修改
    password: '$2b$10$dummy',
  };

  // 存入数据存储
  store.merchants.push(newMerchant);

  // 返回时排除密码字段
  const { password, ...safeMerchant } = newMerchant;
  res.status(201).json(safeMerchant);
});

/**
 * PATCH /api/merchants/:id
 * 更新商家信息
 *
 * 【allowed 白名单】
 * 只能更新基本信息，不允许通过 API 修改密码或 ID。
 */
router.patch('/:id', authenticate, requireAdmin, (req, res) => {
  const merchant = store.merchants.find((m) => m.id === req.params.id);

  if (!merchant) {
    return res.status(404).json({ error: '商家不存在' });
  }

  // 允许更新的字段
  // 注意：没有包含 password，防止通过 API 重置密码（应有单独的密码修改流程）
  const allowed = ['name', 'category', 'position', 'address', 'phone', 'status', 'rating'];

  allowed.forEach((key) => {
    if (req.body[key] !== undefined) {
      merchant[key] = req.body[key];
    }
  });

  // 返回时排除密码
  const { password, ...safeMerchant } = merchant;
  res.json(safeMerchant);
});

/**
 * DELETE /api/merchants/:id
 * 删除商家
 *
 * 【删除注意事项】
 * 实际项目中，删除商家前应检查：
 *   1. 是否有进行中的订单（不应删除有未完成订单的商家）
 *   2. 是否有历史数据需要保留
 */
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  const idx = store.merchants.findIndex((m) => m.id === req.params.id);

  if (idx === -1) {
    return res.status(404).json({ error: '商家不存在' });
  }

  // 从数组中删除
  store.merchants.splice(idx, 1);
  res.json({ message: '删除成功' });
});

export default router;
