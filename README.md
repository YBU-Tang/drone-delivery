# 无人机配送平台 (Drone Delivery Platform)

一个功能完整的无人机配送 SaaS 平台，包含管理后台、商家端、RESTful API 和 WebSocket 实时通信。

## 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                     Client Layer                         │
│  ┌──────────────┐   ┌──────────────┐                    │
│  │  Admin Portal │   │ Merchant Portal │                  │
│  │  (port 3000)  │   │  (port 5173)   │                  │
│  └──────┬───────┘   └──────┬───────┘                    │
│         │                  │                            │
└─────────┼──────────────────┼────────────────────────────┘
          │                  │
          └────────┬─────────┘
                   │ HTTP + WS
          ┌────────▼────────┐
          │   Express API    │
          │  Server (3001)   │
          │  + WebSocket     │
          └────────┬────────┘
                   │
          ┌────────▼────────┐
          │  In-Memory Store │
          │  (drones, orders, │
          │   merchants)      │
          └──────────────────┘
```

## 项目结构

```
drone-delivery/
├── apps/
│   ├── admin/          # 管理后台 (React + Tailwind)
│   ├── merchant/       # 商家端 (React + Tailwind)
│   ├── server/         # Express API 服务器
│   └── shared/         # 共享代码包
│       └── src/
│           ├── api/         # API 客户端和 WebSocket
│           ├── constants.js # 常量定义
│           └── utils/       # 工具函数
├── docker/             # Docker 配置
├── Dockerfile
└── docker-compose.yml
```

## 快速开始

### 环境要求

- Node.js 18+
- npm 9+

### 安装依赖

```bash
npm install
```

### 启动服务

```bash
# 启动 API 服务器 (port 3001)
npm run dev:server

# 启动管理后台 (port 3000)
npm run dev:admin

# 启动商家端 (port 5173)
npm run dev:merchant
```

### 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 商家-星巴克 | starbucks | starbucks123 |
| 商家-麦当劳 | mcdonalds | mcdonalds123 |

## 功能列表

### 管理后台

- 地图总览（Leaflet 实时监控）
- 无人机管理（增删改、状态切换）
- 商家管理（增删改、分类筛选）
- 订单管理（实时状态、详情弹窗）
- 数据分析（状态分布图表）
- 系统设置（模拟参数、数据管理）
- JWT 身份认证
- Toast 通知系统

### 商家端

- 订单列表（实时状态）
- 创建订单（自动分配无人机）
- 订单历史（已完成订单）
- JWT 身份认证
- Toast 通知系统

### API 服务器

- RESTful API（无人机、商家、订单）
- JWT 认证中间件
- WebSocket 实时推送
- 飞行模拟引擎
- 数据持久化（内存）

## API 端点

### 认证

```
POST   /api/auth/login     登录
GET    /api/auth/me        获取当前用户
```

### 无人机

```
GET    /api/drones         获取所有无人机
GET    /api/drones/:id     获取单个无人机
POST   /api/drones         添加无人机 (admin)
PATCH  /api/drones/:id     更新无人机 (admin)
DELETE /api/drones/:id    删除无人机 (admin)
```

### 商家

```
GET    /api/merchants      获取所有商家
GET    /api/merchants/:id  获取单个商家
POST   /api/merchants      添加商家 (admin)
PATCH  /api/merchants/:id 更新商家 (admin)
DELETE /api/merchants/:id 删除商家 (admin)
```

### 订单

```
GET    /api/orders         获取订单列表
GET    /api/orders/:id     获取订单详情
POST   /api/orders         创建订单 (merchant)
PATCH  /api/orders/:id     更新订单
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 19 |
| 构建工具 | Vite 8 |
| 路由 | React Router 7 |
| 状态管理 | Zustand 5 |
| 样式 | Tailwind CSS 3.4 |
| 地图 | Leaflet + React-Leaflet |
| 图标 | Lucide React |
| 后端 | Express 4 |
| 实时通信 | WebSocket (ws) |
| 认证 | JWT (jsonwebtoken) |
| 部署 | Docker + Nginx |

## Docker 部署

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

服务启动后：
- 管理后台: http://localhost:3000
- 商家端: http://localhost:5173
- API 服务器: http://localhost:3001

## 开发说明

### 添加新的共享代码

在 `apps/shared/src/` 中添加新文件后，需要在 `apps/shared/src/index.js` 中导出。

### API 客户端

使用 `apps/shared/src/api/client.js` 中的 `api` 单例：

```javascript
import { api } from '@shared/api/client.js';

// 登录
await api.login('admin', 'admin123');

// 获取数据
const { drones } = await api.getDrones();

// 创建订单
const order = await api.createOrder({ address: '...', latitude: 31.0, longitude: 121.0, weight: 0.5 });
```

### WebSocket 实时更新

```javascript
import { useWebSocket } from '@shared/api/websocket.js';

function MyComponent() {
  useWebSocket((data) => {
    if (data.type === 'state_update') {
      // 更新无人机和订单状态
      store.applyWsUpdate(data.payload);
    }
  });
}
```

## License

MIT
