import { create } from 'zustand';
import { api } from '@shared/api/client.js';
import merchantsData from '@shared/data/merchants.json';
import ordersData from '@shared/data/orders.json';
import dronesData from '@shared/data/drones.json';

const useStore = create((set, get) => ({
  currentMerchant: null,
  merchants: merchantsData.merchants,
  orders: ordersData.orders,
  drones: dronesData.drones,
  loading: false,
  error: null,

  setCurrentMerchant: (merchant) => set({ currentMerchant: merchant }),

  fetchOrders: async () => {
    set({ loading: true, error: null });
    try {
      const { orders } = await api.getOrders();
      set({ orders, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchMerchants: async () => {
    try {
      const { merchants } = await api.getMerchants();
      set({ merchants });
    } catch (err) {
      set({ error: err.message });
    }
  },

  addOrder: async (orderData) => {
    try {
      const newOrder = await api.createOrder({
        customerAddress: orderData.address,
        latitude: orderData.latitude,
        longitude: orderData.longitude,
        weight: orderData.weight,
      });
      set((state) => ({ orders: [...state.orders, newOrder] }));
      return { order: newOrder, assignedDrone: null };
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  updateOrder: (orderId, updates) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, ...updates } : o
      ),
    })),

  getOrderStats: () => {
    const { orders } = get();
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      assigned: orders.filter((o) => o.status === 'assigned').length,
      pickingUp: orders.filter((o) => o.status === 'pickingUp').length,
      delivering: orders.filter((o) => o.status === 'delivering').length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    };
  },

  getAvailableDrones: () => {
    const { drones } = get();
    return drones.filter((d) => d.status === 'idle');
  },
}));

export default useStore;
