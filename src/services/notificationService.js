import api from "./api";

const notificationService = {
  getAllNotifications: async () => {
    const response = await api.get("/api/notification");
    return response.data;
  },

  getNotificationById: async (id) => {
    const response = await api.get(`/api/notification/${id}`);
    return response.data;
  },

  createNotification: async (data) => {
    const response = await api.post("/api/notification", data);
    return response.data;
  },

  updateNotification: async (id, data) => {
    const response = await api.put(`/api/notification/${id}`, data);
    return response.data;
  },

  deleteNotification: async (id) => {
    const response = await api.delete(`/api/notification/${id}`);
    return response.data;
  },

  toggleNotificationStatus: async (id, isActive) => {
    const response = await api.patch(`/api/notification/${id}/status`, { isActive });
    return response.data;
  }
};

export default notificationService;
