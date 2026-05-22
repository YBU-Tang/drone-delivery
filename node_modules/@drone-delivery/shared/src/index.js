/**
 * ============================================================
 * 共享包入口文件（Shared Package Index）
 * ============================================================
 *
 * 【功能】
 * 统一导出共享包的所有模块，方便其他应用导入。
 *
 * 【导入方式】
 * 导入此文件后，可以使用简短的别名：
 *   import { api, DRONE_STATUS, calculateDistance } from '@shared/api/client.js';
 *
 * 【为什么需要 index 文件？】
 * 如果没有 index 文件，每次导入都需要指定完整路径：
 *   import { api } from '@shared/api/client.js';
 *   import { DRONE_STATUS } from '@shared/constants.js';
 *   import { calculateDistance } from '@shared/utils/distance.js';
 *
 * 有了 index 文件，可以统一导出：
 *   import { api, DRONE_STATUS, calculateDistance } from '@shared/index.js';
 *
 * 【模块划分】
 * - api/：HTTP 客户端（client）和 WebSocket（websocket）
 * - constants.js：枚举值和常量定义
 * - utils/：工具函数
 *     - distance.js：距离计算
 *     - flight.js：飞行计算
 *     - assignment.js：派单算法
 */

// API 相关
export * from './api/client.js';
export * from './api/websocket.js';

// 常量
export * from './constants.js';

// 工具函数
export * from './utils/distance.js';
export * from './utils/flight.js';
export * from './utils/assignment.js';
