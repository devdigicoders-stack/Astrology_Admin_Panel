import api from "./api";

const adminService = {
  getAllAdmins: async () => {
    const response = await api.get("/api/admin/all");
    return response.data;
  },
  getAdminById: async (id) => {
    const response = await api.get(`/api/admin/${id}`);
    return response.data;
  },
  createAdmin: async (adminData) => {
    const response = await api.post("/api/admin/register", adminData);
    return response.data;
  },
  updateAdmin: async (id, adminData) => {
    const response = await api.put(`/api/admin/${id}`, adminData);
    return response.data;
  },
  toggleAdminStatus: async (id, isActive) => {
    const response = await api.patch(`/api/admin/${id}/status`, { isActive });
    return response.data;
  },
  deleteAdmin: async (id) => {
    const response = await api.delete(`/api/admin/${id}`);
    return response.data;
  },
  getAdminProfile: async () => {
    const response = await api.get("/api/admin/profile");
    return response.data;
  },
  updateAdminProfile: async (profileData) => {
    const response = await api.put("/api/admin/profile", profileData);
    return response.data;
  },
  changePassword: async (passwordData) => {
    const response = await api.patch("/api/admin/change-password", passwordData);
    return response.data;
  }
};

export default adminService;
