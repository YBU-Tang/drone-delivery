import { DRONE_STATUS_TEXT } from '@shared/constants.js';

const statusColors = {
  idle: 'bg-green-100 text-green-800',
  dispatching: 'bg-blue-100 text-blue-800',
  returning: 'bg-yellow-100 text-yellow-800',
  charging: 'bg-gray-100 text-gray-800',
  maintenance: 'bg-red-100 text-red-800',
};

const orderStatusColors = {
  pending: 'bg-gray-100 text-gray-800',
  assigned: 'bg-blue-100 text-blue-800',
  pickingUp: 'bg-yellow-100 text-yellow-800',
  delivering: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function DroneStatusBadge({ status }) {
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        statusColors[status] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {DRONE_STATUS_TEXT[status] || status}
    </span>
  );
}

export function OrderStatusBadge({ status }) {
  const statusText = {
    pending: '待分配',
    assigned: '已分配',
    pickingUp: '取货中',
    delivering: '配送中',
    delivered: '已送达',
    cancelled: '已取消',
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        orderStatusColors[status] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {statusText[status] || status}
    </span>
  );
}
