/**
 * ============================================================
 * 共享常量定义（Constants）
 * ============================================================
 *
 * 【功能】
 * 集中管理全系统使用的常量值：
 *   - 无人机/订单/商家的状态枚举
 *   - 可枚举值列表（如商家类别、无人机型号）
 *   - 地图默认参数
 *   - 飞行模拟参数
 *
 * 【为什么需要常量文件？】
 * 1. 避免"魔法值"（Magic Number/String）
 *    例如：status === 'dispatching' 改为 status === DRONE_STATUS.DISPATCHING
 *    后者语义更清晰，一看就知道代表什么意思
 *
 * 2. 统一管理，方便修改
 *    如果需要添加新的无人机状态，只需修改这里一处
 *
 * 3. IDE 自动补全
 *    使用 DRONE_STATUS.IDLE 比输入 'idle' 更不容易出错
 */

/**
 * 无人机状态枚举
 *
 * 【为什么用对象而不是 const？】
 * 对象可以动态计算属性名，且能用作 Map 的 key。
 * 如果用多个 const 定义，遍历或动态访问会很不方便。
 *
 * 【各状态含义】
 * - idle：空闲，可接受新任务
 * - dispatching：配送中，正在执行配送任务
 * - returning：返航中，任务完成后返回基站
 * - charging：充电中，电量不足需要充电
 * - maintenance：维护中，检修中不可用
 */
export const DRONE_STATUS = {
  IDLE: 'idle',
  DISPATCHING: 'dispatching',
  RETURNING: 'returning',
  CHARGING: 'charging',
  MAINTENANCE: 'maintenance',
};

/**
 * 无人机状态中文文本映射
 *
 * 【为什么需要这个？】
 * JavaScript 代码中使用英文状态码（如 'idle'），
 * 但用户界面需要显示中文（如"空闲"）。
 * 通过对象映射，英文→中文转换变得简洁高效。
 *
 * 【计算属性名的妙用】
 * DRONE_STATUS_TEXT[DRONE_STATUS.IDLE] 等于 DRONE_STATUS_TEXT['idle']
 */
export const DRONE_STATUS_TEXT = {
  [DRONE_STATUS.IDLE]: '空闲',
  [DRONE_STATUS.DISPATCHING]: '配送中',
  [DRONE_STATUS.RETURNING]: '返航中',
  [DRONE_STATUS.CHARGING]: '充电中',
  [DRONE_STATUS.MAINTENANCE]: '维护中',
};

/**
 * 订单状态枚举
 *
 * 【订单的生命周期】
 * pending → assigned → pickingUp → delivering → delivered
 *    ↓（可取消）
 * cancelled
 *
 * - pending：待分配，等待系统分配无人机
 * - assigned：已分配，无人机已接受任务，正在前往取货点
 * - pickingUp：取货中，无人机已到达商家，正在取货
 * - delivering：配送中，货物已取走，正在飞往目的地
 * - delivered：已送达，配送完成
 * - cancelled：已取消，订单被取消
 */
export const ORDER_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  PICKING_UP: 'pickingUp',
  DELIVERING: 'delivering',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

/** 订单状态中文文本映射 */
export const ORDER_STATUS_TEXT = {
  [ORDER_STATUS.PENDING]: '待分配',
  [ORDER_STATUS.ASSIGNED]: '已分配',
  [ORDER_STATUS.PICKING_UP]: '取货中',
  [ORDER_STATUS.DELIVERING]: '配送中',
  [ORDER_STATUS.DELIVERED]: '已送达',
  [ORDER_STATUS.CANCELLED]: '已取消',
};

/**
 * 商家类别列表
 *
 * 【为什么用数组而不是对象？】
 * 数组可以用于下拉选择框的选项列表，
 * 而对象更适合键值映射。
 */
export const MERCHANT_CATEGORIES = ['快餐', '咖啡茶饮', '生鲜', '药品', '文件', '其他'];

/**
 * 无人机型号列表
 *
 * 【不同型号的性能差异】
 * 这些信息在 store.js 中也有对应：
 * - DJI-M300：最大速度 15 m/s，载重能力强
 * - DJI-Mavic3：最大速度 20 m/s，轻便灵活
 * - DJI-FPV：最大速度 18 m/s，竞速型，飞行速度快
 */
export const DRONE_MODELS = ['DJI-M300', 'DJI-Mavic3', 'DJI-FPV'];

/**
 * 地图默认参数
 *
 * 【DEFAULT_MAP_CENTER】
 * 上海市浦东新区的坐标（纬度 31.2304，经度 121.4737）。
 * 作为地图的初始中心点和添加无人机/商家时的默认位置。
 *
 * 【DEFAULT_MAP_ZOOM】
 * 缩放级别，范围 1-18：
 *   - 1：最小缩放，世界视图
 *   - 18：最大缩放，单栋建筑级别
 *   - 13：适合显示一个城市的缩放级别
 */
export const DEFAULT_MAP_CENTER = [31.2304, 121.4737];
export const DEFAULT_MAP_ZOOM = 13;

/**
 * 飞行模拟参数
 *
 * 【DEFAULT_FLIGHT_SPEED】
 * 默认飞行速度 10 m/s（米/秒）。
 * 约等于 36 km/h，这是一个安全适中的速度。
 *
 * 【SIMULATION_INTERVAL】
 * 模拟更新间隔 1000 ms（1秒）。
 * 每秒更新一次无人机位置，让动画看起来平滑流畅。
 */
export const DEFAULT_FLIGHT_SPEED = 10;  // 米/秒
export const SIMULATION_INTERVAL = 1000;  // 毫秒
