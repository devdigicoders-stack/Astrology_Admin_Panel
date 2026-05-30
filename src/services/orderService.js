import api from "./api";

const orderService = {
  getAllOrders: async () => {
    const response = await api.get("/api/orders/admin");
    return response.data;
  },

  updateOrderStatus: async (id, orderStatus) => {
    const response = await api.put(`/api/orders/${id}/status`, { orderStatus });
    return response.data;
  }
};

export default orderService;
