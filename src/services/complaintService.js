import api from "./api";

const complaintService = {
  getAllComplaints: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/api/complaint${params ? `?${params}` : ''}`);
    return response.data;
  },

  getComplaintById: async (id) => {
    const response = await api.get(`/api/complaint/${id}`);
    return response.data;
  },

  replyToComplaint: async (id, adminReply, status) => {
    const response = await api.put(`/api/complaint/${id}/reply`, { adminReply, status });
    return response.data;
  },

  updateComplaintStatus: async (id, status) => {
    const response = await api.patch(`/api/complaint/${id}/status`, { status });
    return response.data;
  },

  deleteComplaint: async (id) => {
    const response = await api.delete(`/api/complaint/${id}`);
    return response.data;
  }
};

export default complaintService;
