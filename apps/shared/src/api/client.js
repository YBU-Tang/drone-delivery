/**
 * ============================================================
 * API 客户端（API Client）
 * ============================================================
 *
 * 【功能】
 * 封装所有与后端 API 的 HTTP 通信，提供统一的数据接口。
 *
 * 【为什么需要 API Client？】
 * 1. 避免重复代码：每个 API 调用都要处理 Token、请求头、错误解析
 * 2. 统一错误处理：所有 API 失败都抛出统一格式的错误
 * 3. 集中管理 API 地址：环境变量控制，便于切换开发/生产环境
 * 4. Token 管理：自动在请求中注入认证 Token
 *
 * 【设计模式：Singleton】
 * 我们导出的是 ApiClient 的单例实例（export const api = new ApiClient()）。
 * 这样在项目中任何地方 import { api } from '@shared/api/client.js' 都能获取同一个实例，
 * 无需每次都 new ApiClient()。
 *
 * 【Fetch API vs Axios】
 * 本项目使用原生 Fetch API（无需额外依赖），
 * 封装成类后使用体验与 Axios 类似。
 */

class ApiClient {
  /**
   * 构造函数
   *
   * 【环境变量】
   * Vite 项目中使用 import.meta.env 访问环境变量：
   *   - import.meta.env.VITE_API_URL：自定义 API 地址
   *   - 如果未设置，使用默认地址 http://localhost:3001/api
   */
  constructor() {
    // API 基础地址（会自动拼接路径，如 /api/drones）
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

    // 初始化 Token（从 localStorage 读取）
    // localStorage 在页面刷新后仍然保留数据
    this.token = localStorage.getItem('drone_delivery_token');
  }

  /**
   * 设置认证 Token
   *
   * 【Token 存储策略】
   * Token 存储在 localStorage 中：
   *   - 页面刷新后仍然保留
   *   - 用户关闭浏览器后也保留（除非手动清除）
   *
   * 【安全性说明】
   * localStorage 有 XSS 攻击风险（恶意脚本可读取）。
   * 敏感应用应使用 httpOnly Cookie（由服务端设置）。
   *
   * @param {string|null} token - JWT Token，或 null 表示清除
   */
  setToken(token) {
    this.token = token;
    if (token) {
      // 存入 localStorage，键名：drone_delivery_token
      localStorage.setItem('drone_delivery_token', token);
    } else {
      // 清除 Token（登出时调用）
      localStorage.removeItem('drone_delivery_token');
    }
  }

  /**
   * 获取当前 Token
   *
   * 【双重获取策略】
   * 1. 优先使用内存中的 token（this.token）
   * 2. 如果内存中没有（页面刷新后），从 localStorage 读取
   */
  getToken() {
    if (!this.token) {
      this.token = localStorage.getItem('drone_delivery_token');
    }
    return this.token;
  }

  /**
   * 通用请求方法
   *
   * 这是 API Client 的核心，所有具体 API 方法都基于此实现。
   *
   * @param {string} method - HTTP 方法：GET, POST, PATCH, DELETE
   * @param {string} path   - API 路径，如 '/drones'
   * @param {Object|null} body - 请求体数据（GET 请求忽略）
   *
   * @returns {Promise<Object>} 解析后的响应数据
   * @throws {Error} HTTP 状态码非 2xx 时抛出
   */
  async request(method, path, body = null) {
    // ─────────────────────────────────────────────────────────
    // 构造请求头
    // ─────────────────────────────────────────────────────────
    const headers = {
      // JSON 格式的请求体
      'Content-Type': 'application/json',
    };

    // 如果有 Token，添加到 Authorization 头
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // ─────────────────────────────────────────────────────────
    // 构造请求选项
    // ─────────────────────────────────────────────────────────
    const options = { method, headers };

    // GET 请求不应该有请求体，其他方法如果有 body 就添加
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    // ─────────────────────────────────────────────────────────
    // 发送请求
    // ─────────────────────────────────────────────────────────
    const res = await fetch(`${this.baseUrl}${path}`, options);

    // ─────────────────────────────────────────────────────────
    // 解析响应
    // ─────────────────────────────────────────────────────────
    // 即使 HTTP 状态码是错误（如 404、500），
    // fetch 也不会抛出异常，我们需要手动检查并处理。
    const data = await res.json();

    // ─────────────────────────────────────────────────────────
    // 错误处理
    // ─────────────────────────────────────────────────────────
    // HTTP 状态码在 200-299 范围内表示成功
    if (!res.ok) {
      // 抛出统一格式的错误对象
      // 错误信息从响应体的 error 字段获取
      throw new Error(data.error || `请求失败: ${res.status}`);
    }

    // 返回解析后的数据
    return data;
  }

  // ═════════════════════════════════════════════════════════════
  // 认证相关 API
  // ═════════════════════════════════════════════════════════════

  /**
   * 用户登录
   *
   * 【登录流程】
   * 1. POST /api/auth/login 发送用户名密码
   * 2. 服务端验证凭证，签发 JWT Token
   * 3. 客户端存储 Token
   * 4. 返回用户信息
   */
  async login(username, password) {
    const data = await this.request('POST', '/auth/login', { username, password });
    // 自动存储 Token，供后续请求使用
    this.setToken(data.token);
    return data;
  }

  /** 退出登录：清除本地存储的 Token */
  async logout() {
    this.setToken(null);
  }

  /**
   * 获取当前登录用户信息
   *
   * 【用途】
   * 页面刷新后，使用此接口验证 Token 是否有效，
   * 如果有效则恢复用户的登录状态。
   */
  async getMe() {
    return this.request('GET', '/auth/me');
  }

  // ═════════════════════════════════════════════════════════════
  // 无人机相关 API
  // ═════════════════════════════════════════════════════════════

  /** 获取所有无人机列表 */
  async getDrones() {
    return this.request('GET', '/drones');
  }

  /** 获取单个无人机详情 */
  async getDrone(id) {
    return this.request('GET', `/drones/${id}`);
  }

  /** 创建新无人机 */
  async createDrone(data) {
    return this.request('POST', '/drones', data);
  }

  /** 更新无人机信息 */
  async updateDrone(id, data) {
    return this.request('PATCH', `/drones/${id}`, data);
  }

  /** 删除无人机 */
  async deleteDrone(id) {
    return this.request('DELETE', `/drones/${id}`);
  }

  // ═════════════════════════════════════════════════════════════
  // 商家相关 API
  // ═════════════════════════════════════════════════════════════

  /** 获取所有商家列表 */
  async getMerchants() {
    return this.request('GET', '/merchants');
  }

  /** 获取单个商家详情 */
  async getMerchant(id) {
    return this.request('GET', `/merchants/${id}`);
  }

  /** 创建新商家 */
  async createMerchant(data) {
    return this.request('POST', '/merchants', data);
  }

  /** 更新商家信息 */
  async updateMerchant(id, data) {
    return this.request('PATCH', `/merchants/${id}`, data);
  }

  /** 删除商家 */
  async deleteMerchant(id) {
    return this.request('DELETE', `/merchants/${id}`);
  }

  // ═════════════════════════════════════════════════════════════
  // 订单相关 API
  // ═════════════════════════════════════════════════════════════

  /** 获取所有订单列表 */
  async getOrders() {
    return this.request('GET', '/orders');
  }

  /** 获取单个订单详情 */
  async getOrder(id) {
    return this.request('GET', `/orders/${id}`);
  }

  /** 创建新订单（商家调用） */
  async createOrder(data) {
    return this.request('POST', '/orders', data);
  }

  /** 更新订单信息 */
  async updateOrder(id, data) {
    return this.request('PATCH', `/orders/${id}`, data);
  }

  // ═════════════════════════════════════════════════════════════
  // 模拟控制 API
  // ═════════════════════════════════════════════════════════════

  /** 获取模拟服务运行状态 */
  async getSimulationStatus() {
    return this.request('GET', '/simulation/status');
  }

  /** 切换模拟服务状态 */
  async toggleSimulation(running) {
    return this.request('POST', '/simulation/toggle', { running });
  }
}

/**
 * 创建并导出单例实例
 *
 * 【为什么导出实例而不是类？】
 * 导出实例意味着整个应用中只有一个 api 对象，
 * 它的状态（token）在所有组件间共享。
 *
 * 【使用示例】
 * import { api } from '@shared/api/client.js';
 * const { drones } = await api.getDrones();
 */
export const api = new ApiClient();
