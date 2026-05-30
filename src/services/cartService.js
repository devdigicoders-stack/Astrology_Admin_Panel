import api from "./api";

const cartService = {
  getAllCarts: async () => {
    const response = await api.get("/api/cart/admin");
    return response.data;
  },

  getCartById: async (id) => {
    const response = await api.get(`/api/cart/admin/${id}`);
    return response.data;
  },

  deleteCart: async (id) => {
    const response = await api.delete(`/api/cart/admin/${id}`);
    return response.data;
  },

  updateCartStatus: async (id, isActive) => {
    const response = await api.patch(`/api/cart/admin/${id}/status`, { isActive });
    return response.data;
  }
};

export default cartService;
