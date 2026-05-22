/**
 * ============================================================
 * 内存数据存储（In-Memory Data Store）
 * ============================================================
 *
 * 【什么是内存存储？】
 * 这是一个纯 JavaScript 对象（Plain Object），用作应用程序的数据仓库。
 * 所有数据都存储在内存（RAM）中，服务重启后数据会丢失。
 *
 * 【为什么不用数据库？】
 * 对于教学演示项目来说：
 *   - 简单直接，无需配置数据库连接
 *   - 启动速度快（没有连接池初始化等开销）
 *   - 代码结构清晰，便于理解核心业务逻辑
 *
 * 【生产环境的选择】
 * 真实项目通常使用：
 *   - 关系型数据库：PostgreSQL、MySQL（适合结构化数据、事务支持）
 *   - 文档数据库：MongoDB（适合灵活结构的数据）
 *   - 缓存层：Redis（高速读写，常配合主数据库使用）
 *
 * 【数据结构设计思路】
 * 本系统包含以下核心实体（Entity）：
 *   drones（无人机）：配送的执行者
 *   merchants（商家）：配送服务的客户
 *   orders（订单）：连接商家与消费者的配送任务
 *   users（用户）：系统的登录账号（管理员或商家）
 *
 * 【为什么用 Set 存储 tokenBlacklist？】
 * Set 是 ES6 新增的数据结构，与数组相比：
 *   - 查询效率：O(1) vs O(n)（token 是否在黑名单中）
 *   - 自动去重：同一 Token 多次加入不会重复
 *   - 适合存储"唯一性"数据
 */

/**
 * ─────────────────────────────────────────────────────────────
 * 数据结构说明
 * ─────────────────────────────────────────────────────────────
 *
 * 【无人机（Drone）】
 * 属性：
 *   id              - 唯一标识（格式：DRONE-XXX）
 *   name            - 中文名称（如"无人机-001"）
 *   model           - 机型型号（影响最大飞行速度）
 *   status          - 运行状态：idle | dispatching | returning | charging | maintenance
 *   position        - 当前 GPS 坐标 { latitude, longitude }
 *   battery         - 电量百分比 0-100
 *   maxSpeed        - 最大飞行速度（m/s），由机型决定
 *   currentSpeed    - 当前飞行速度（m/s）
 *   currentTask     - 当前执行中的订单 ID（无任务时为 null）
 *   baseStation     - 所属基站
 *   createdAt       - 注册时间（ISO 8601 格式）
 *
 * 【商家（Merchant）】
 * 属性：
 *   id              - 唯一标识（格式：MCH-XXX）
 *   name            - 商家名称
 *   category        - 品类：咖啡茶饮 | 快餐 | 生鲜 | 药品 | 文件 | 其他
 *   position        - 店铺 GPS 坐标
 *   address         - 文字地址
 *   phone           - 联系电话
 *   status          - 营业状态：active | inactive
 *   rating          - 评分（1.0 - 5.0）
 *   createdAt       - 注册时间
 *   password        - 登录密码（bcrypt 哈希值，生产环境绝不明文存储）
 *
 * 【订单（Order）】
 * 属性：
 *   id              - 唯一标识（格式：ORD-YYYYMMDD-XXX）
 *   merchantId       - 关联商家 ID
 *   merchantName     - 商家名称（冗余存储，避免关联查询）
 *   status          - 订单状态：pending → assigned → pickingUp → delivering → delivered
 *   pickupPosition  - 取货地点坐标（商家位置）
 *   deliveryPosition- 配送目的坐标（消费者位置）
 *   customerAddress - 消费者文字地址
 *   weight          - 物品重量（kg）
 *   assignedDroneId - 分配的无人机 ID
 *   timeline        - 关键时间节点记录
 *   estimatedDuration - 预计配送时长（秒）
 *
 * 【用户（User）】
 * 属性：
 *   id              - 唯一标识
 *   username        - 登录用户名
 *   role            - 角色：admin | merchant
 *   name            - 显示名称
 *   merchantId      - 商家用户的关联商家 ID（管理员无此字段）
 *   createdAt       - 创建时间
 */

// 创建全局数据存储对象
// 注意：这是一个可变（Mutable）对象，所有路由都可以直接修改
// 在真实项目中，数据变更应通过 ORM/数据库进行，并保证原子性
export const store = {
  /**
   * ─── 无人机数据 ───
   * 初始包含 8 架不同型号、不同状态的无人机
   * 覆盖了所有可能的状态，便于测试各种场景
   */
  drones: [
    // 空闲状态的 DJI-M300，电池充足，可立即派单
    {
      id: 'DRONE-001',
      name: '无人机-001',
      model: 'DJI-M300',
      status: 'idle', // 空闲，随时可接受任务
      position: { latitude: 31.2304, longitude: 121.4737 },
      battery: 95,
      maxSpeed: 15,
      currentSpeed: 0,
      currentTask: null, // 无执行中的任务
      baseStation: 'BS-001',
      createdAt: '2026-01-15T08:00:00Z',
    },
    // 正在执行配送任务的无人机，currentTask 指向当前订单
    {
      id: 'DRONE-002',
      name: '无人机-002',
      model: 'DJI-M300',
      status: 'dispatching', // 配送中
      position: { latitude: 31.2350, longitude: 121.4800 },
      battery: 78,
      maxSpeed: 15,
      currentSpeed: 10,
      currentTask: 'ORD-202603310001', // 正在执行该订单
      baseStation: 'BS-001',
      createdAt: '2026-01-16T10:00:00Z',
    },
    // 空闲的 DJI-Mavic3，电池满格，性能更好
    {
      id: 'DRONE-003',
      name: '无人机-003',
      model: 'DJI-Mavic3',
      status: 'idle',
      position: { latitude: 31.2250, longitude: 121.4650 },
      battery: 100,
      maxSpeed: 20, // Mavic3 速度更快
      currentSpeed: 0,
      currentTask: null,
      baseStation: 'BS-002',
      createdAt: '2026-01-20T14:00:00Z',
    },
    // 充电中的无人机，电量低（25%），等待充电完成
    {
      id: 'DRONE-004',
      name: '无人机-004',
      model: 'DJI-Mavic3',
      status: 'charging', // 充电中，暂时不可用
      position: { latitude: 31.2280, longitude: 121.4700 },
      battery: 25, // 电量低于警戒值
      maxSpeed: 20,
      currentSpeed: 0,
      currentTask: null,
      baseStation: 'BS-001',
      createdAt: '2026-02-01T09:00:00Z',
    },
    // 返航中的无人机，任务完成后正在返回基站
    {
      id: 'DRONE-005',
      name: '无人机-005',
      model: 'DJI-FPV',
      status: 'returning', // 返航中
      position: { latitude: 31.2400, longitude: 121.4750 },
      battery: 45,
      maxSpeed: 18,
      currentSpeed: 8,
      currentTask: null,
      baseStation: 'BS-001',
      createdAt: '2026-02-10T11:00:00Z',
    },
    // 另一架空闲的 M300，位于第三个基站
    {
      id: 'DRONE-006',
      name: '无人机-006',
      model: 'DJI-M300',
      status: 'idle',
      position: { latitude: 31.2200, longitude: 121.4850 },
      battery: 88,
      maxSpeed: 15,
      currentSpeed: 0,
      currentTask: null,
      baseStation: 'BS-003',
      createdAt: '2026-02-15T08:30:00Z',
    },
    // 正在配送的 Mavic3，执行第二个配送任务
    {
      id: 'DRONE-007',
      name: '无人机-007',
      model: 'DJI-Mavic3',
      status: 'dispatching',
      position: { latitude: 31.2380, longitude: 121.4680 },
      battery: 65,
      maxSpeed: 20,
      currentSpeed: 12,
      currentTask: 'ORD-202603310002',
      baseStation: 'BS-002',
      createdAt: '2026-03-01T10:00:00Z',
    },
    // 维护中的无人机，电量为 0，不能执行任何任务
    {
      id: 'DRONE-008',
      name: '无人机-008',
      model: 'DJI-FPV',
      status: 'maintenance', // 维护中，可能正在检修
      position: { latitude: 31.2280, longitude: 121.4700 },
      battery: 0, // 电量 0，不适合飞行
      maxSpeed: 18,
      currentSpeed: 0,
      currentTask: null,
      baseStation: 'BS-001',
      createdAt: '2026-03-05T15:00:00Z',
    },
  ],

  /**
   * ─── 商家数据 ───
   * 8 个不同品类的商家，覆盖各类配送场景
   * 所有商家初始状态均为 active（营业中）
   */
  merchants: [
    {
      id: 'MCH-001',
      name: '星巴克-浦东店',
      category: '咖啡茶饮',
      position: { latitude: 31.2350, longitude: 121.4800 },
      address: '上海市浦东新区世纪大道100号',
      phone: '021-58880001',
      status: 'active',
      rating: 4.8,
      createdAt: '2026-01-10T09:00:00Z',
      // 密码已哈希化（bcrypt），'$2b$10$dummy' 只是占位符，不是真实哈希
      password: '$2b$10$dummy',
    },
    {
      id: 'MCH-002',
      name: '麦当劳-陆家嘴店',
      category: '快餐',
      position: { latitude: 31.2400, longitude: 121.4900 },
      address: '上海市浦东新区陆家嘴环路88号',
      phone: '021-58880002',
      status: 'active',
      rating: 4.5,
      createdAt: '2026-01-12T10:30:00Z',
      password: '$2b$10$dummy',
    },
    {
      id: 'MCH-003',
      name: '盒马鲜生-浦东店',
      category: '生鲜',
      position: { latitude: 31.2250, longitude: 121.4650 },
      address: '上海市浦东新区张江高科技园区',
      phone: '021-58880003',
      status: 'active',
      rating: 4.6,
      createdAt: '2026-01-15T08:00:00Z',
      password: '$2b$10$dummy',
    },
    {
      id: 'MCH-004',
      name: '叮当快药-浦东店',
      category: '药品',
      position: { latitude: 31.2320, longitude: 121.4780 },
      address: '上海市浦东新区世纪公园附近',
      phone: '021-58880004',
      status: 'active',
      rating: 4.9, // 评分最高，药品配送服务好
      createdAt: '2026-02-01T14:00:00Z',
      password: '$2b$10$dummy',
    },
    {
      id: 'MCH-005',
      name: '顺丰速运-浦东站',
      category: '文件',
      position: { latitude: 31.2280, longitude: 121.4700 },
      address: '上海市浦东新区丁香路500号',
      phone: '021-58880005',
      status: 'active',
      rating: 4.7,
      createdAt: '2026-02-10T09:00:00Z',
      password: '$2b$10$dummy',
    },
    {
      id: 'MCH-006',
      name: '肯德基-张江店',
      category: '快餐',
      position: { latitude: 31.2200, longitude: 121.4850 },
      address: '上海市浦东新区张江镇科苑路88号',
      phone: '021-58880006',
      status: 'active',
      rating: 4.4,
      createdAt: '2026-02-15T11:00:00Z',
      password: '$2b$10$dummy',
    },
    {
      id: 'MCH-007',
      name: '瑞幸咖啡-张江店',
      category: '咖啡茶饮',
      position: { latitude: 31.2180, longitude: 121.4820 },
      address: '上海市浦东新区张江高科技园区碧波路',
      phone: '021-58880007',
      status: 'active',
      rating: 4.6,
      createdAt: '2026-03-01T10:00:00Z',
      password: '$2b$10$dummy',
    },
    {
      id: 'MCH-008',
      name: '7-Eleven-世纪大道店',
      category: '其他',
      position: { latitude: 31.2380, longitude: 121.4680 },
      address: '上海市浦东新区世纪大道2000号',
      phone: '021-58880008',
      status: 'active',
      rating: 4.3,
      createdAt: '2026-03-10T08:00:00Z',
      password: '$2b$10$dummy',
    },
  ],

  /**
   * ─── 订单数据 ───
   * 初始包含 2 个进行中的配送订单
   * 订单状态为 delivering，表示正在配送
   */
  orders: [
    // 订单 1：星巴克咖啡配送，从浦东店送往陆家嘴
    {
      id: 'ORD-202603310001',
      merchantId: 'MCH-001',
      merchantName: '星巴克-浦东店',
      status: 'delivering', // 配送中（已取货，正在飞往目的地）
      pickupPosition: { latitude: 31.2350, longitude: 121.4800 }, // 商家位置
      deliveryPosition: { latitude: 31.2400, longitude: 121.4750 }, // 客户位置
      customerAddress: '上海市浦东新区陆家嘴环路1000号',
      weight: 0.5, // 咖啡约 0.5kg
      assignedDroneId: 'DRONE-002', // 已分配给 DRONE-002
      timeline: {
        created: '2026-03-31T10:00:00Z',   // 创建时间
        assigned: '2026-03-31T10:00:05Z',  // 分配时间（5秒内完成）
        pickedUp: '2026-03-31T10:05:00Z',  // 取货时间（5分钟后到达商家）
        delivered: null, // 尚未送达
      },
      estimatedDuration: 300, // 预计 300 秒（5分钟）
    },
    // 订单 2：叮当快药配送，从药店送往张江
    {
      id: 'ORD-202603310002',
      merchantId: 'MCH-004',
      merchantName: '叮当快药-浦东店',
      status: 'delivering',
      pickupPosition: { latitude: 31.2320, longitude: 121.4780 },
      deliveryPosition: { latitude: 31.2250, longitude: 121.4900 },
      customerAddress: '上海市浦东新区张江高科碧波路690号',
      weight: 0.3, // 药品通常较轻
      assignedDroneId: 'DRONE-007',
      timeline: {
        created: '2026-03-31T10:30:00Z',
        assigned: '2026-03-31T10:30:08Z',
        pickedUp: '2026-03-31T10:35:00Z',
        delivered: null,
      },
      estimatedDuration: 420, // 预计 420 秒（7分钟）
    },
  ],

  /**
   * ─── 用户数据 ───
   * 系统中的登录账号
   * 注意：实际生产环境中，密码绝不能明文存储！
   *       应使用 bcrypt/argon2 等算法进行哈希处理
   *
   * 【角色说明】
   * admin     - 系统管理员，拥有全部权限
   * merchant  - 商家用户，只能管理自己的订单和数据
   */
  users: [
    // 管理员账号：可管理所有无人机、商家，可控制模拟服务
    {
      id: 'admin-001',
      username: 'admin',
      role: 'admin',
      name: '系统管理员',
      createdAt: '2026-01-01T00:00:00Z',
    },
    // 商家账号：星巴克管理员，只能查看和管理自己店铺的订单
    {
      id: 'merchant-001',
      username: 'starbucks',
      role: 'merchant',
      merchantId: 'MCH-001', // 关联到 MCH-001 商家
      name: '星巴克管理员',
      createdAt: '2026-01-10T00:00:00Z',
    },
    // 商家账号：麦当劳管理员
    {
      id: 'merchant-002',
      username: 'mcdonalds',
      role: 'merchant',
      merchantId: 'MCH-002', // 关联到 MCH-002 商家
      name: '麦当劳管理员',
      createdAt: '2026-01-12T00:00:00Z',
    },
  ],

  /**
   * ─── Token 黑名单 ───
   * 用于存储已失效的 JWT Token。
   *
   * 【为什么需要黑名单？】
   * JWT 是无状态的——服务端不存储会话信息。
   * 但有时我们需要主动让某个 Token 失效（如用户主动登出）。
   * 解决方案：
   *   方案 A（短 Token）：Token 有效期设得很短（如 15 分钟），过期自动失效
   *   方案 B（黑名单）：登出时将 Token 加入黑名单，服务端检查黑名单
   *
   * 【为什么不直接删除 Token？】
   * 因为 JWT 是无状态的，服务端没有存储 Token。
   * 用户侧的 Token 仍然有效（在过期之前），
   * 所以需要在服务端维护一个黑名单来"撤销"已登出的 Token。
   *
   * 【性能考虑】
   * 长期运行会导致黑名单越来越大。
   * 优化方案：使用 Redis 存储黑名单，并设置过期时间（与 Token 同步）
   */
  tokenBlacklist: new Set(),
};
