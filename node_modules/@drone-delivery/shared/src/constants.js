// 无人机状态
export const DRONE_STATUS = {
  IDLE: 'idle',
  DISPATCHING: 'dispatching',
  RETURNING: 'returning',
  CHARGING: 'charging',
  MAINTENANCE: 'maintenance',
};

export const DRONE_STATUS_TEXT = {
  [DRONE_STATUS.IDLE]: '空闲',
  [DRONE_STATUS.DISPATCHING]: '配送中',
  [DRONE_STATUS.RETURNING]: '返航中',
  [DRONE_STATUS.CHARGING]: '充电中',
  [DRONE_STATUS.MAINTENANCE]: '维护中',
};

// 订单状态
export const ORDER_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  PICKING_UP: 'pickingUp',
  DELIVERING: 'delivering',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

export const ORDER_STATUS_TEXT = {
  [ORDER_STATUS.PENDING]: '待分配',
  [ORDER_STATUS.ASSIGNED]: '已分配',
  [ORDER_STATUS.PICKING_UP]: '取货中',
  [ORDER_STATUS.DELIVERING]: '配送中',
  [ORDER_STATUS.DELIVERED]: '已送达',
  [ORDER_STATUS.CANCELLED]: '已取消',
};

// 商家类别
export const MERCHANT_CATEGORIES = ['快餐', '咖啡茶饮', '生鲜', '药品', '文件', '其他'];

// 无人机型号
export const DRONE_MODELS = ['DJI-M300', 'DJI-Mavic3', 'DJI-FPV'];

// 默认地图中心 (上海市浦东新区)
export const DEFAULT_MAP_CENTER = [31.2304, 121.4737];
export const DEFAULT_MAP_ZOOM = 13;

// 飞行参数 (米/秒)
export const DEFAULT_FLIGHT_SPEED = 10;
export const SIMULATION_INTERVAL = 1000; // 毫秒
