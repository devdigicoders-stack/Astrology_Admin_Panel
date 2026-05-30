import api from "./api";

const userService = {
  getAllUsers: async () => {
    const response = await api.get("/api/user");
    return response.data;
  },
  getUserById: async (id) => {
    const response = await api.get(`/api/user/${id}`);
    return response.data;
  },
  updateUser: async (id, userData) => {
    const response = await api.put(`/api/user/${id}`, userData);
    return response.data;
  },
  toggleUserStatus: async (id, isActive) => {
    const response = await api.patch(`/api/user/${id}/status`, { isActive });
    return response.data;
  },
  deleteUser: async (id) => {
    const response = await api.delete(`/api/user/${id}`);
    return response.data;
  }
};

export default userService;
