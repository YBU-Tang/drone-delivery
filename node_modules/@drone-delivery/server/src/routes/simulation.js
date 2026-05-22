/**
 * ============================================================
 * 模拟控制路由（Simulation Routes）
 * ============================================================
 *
 * 【功能】
 * 提供模拟服务（无人机实时移动模拟）的控制接口。
 *
 * 【什么是模拟服务？】
 * 在没有真实无人机硬件的情况下，我们需要模拟无人机的飞行过程：
 *   - 无人机位置随时间变化（从取货点飞向配送点）
 *   - 电量随飞行消耗
 *   - 订单状态随进度更新
 *
 * 【为什么需要控制接口？】
 * - 开发测试时需要启动/停止模拟
 * - 可能需要调整模拟速度
 * - 管理员可能需要在某些情况下暂停模拟
 */

import { Router } from 'express';
import { store } from '../store.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/simulation/status
 * 获取模拟服务的运行状态
 *
 * 【用途】
 * 前端可以通过这个接口显示模拟是否在运行，
 * 并据此显示不同的 UI 状态（如"模拟运行中"的绿色指示灯）。
 */
router.get('/status', authenticate, (req, res) => {
  // store.simulationRunning 由 simulation.js 中的 startSimulation/stopSimulation 控制
  res.json({ running: store.simulationRunning });
});

/**
 * POST /api/simulation/toggle
 * 切换模拟服务的运行状态
 *
 * 【为什么用 POST 而非 PUT/PATCH？】
 * 因为这是一个"动作"（toggle），而不是"更新资源"。
 * 虽然从技术上讲这更新了 store.simulationRunning，
 * 但语义上这是一个"触发操作"，所以用 POST 更合适。
 *
 * 【请求体格式】
 * {
 *   "running": true   // true = 启动，false = 停止
 * }
 *
 * 【权限控制】
 * requireAdmin 确保只有管理员可以控制模拟服务。
 */
router.post('/toggle', authenticate, requireAdmin, (req, res) => {
  const { running } = req.body;
  store.simulationRunning = running;
  // 返回新的状态，让客户端可以确认操作成功
  res.json({ running });
});

export default router;
