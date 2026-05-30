import api from "./api";

const poojaService = {
  getAdminPoojas: async () => {
    const response = await api.get("/api/pooja/admin/all");
    return response.data;
  },

  createPooja: async (formData) => {
    const response = await api.post("/api/pooja", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  updatePooja: async (id, formData) => {
    const response = await api.put(`/api/pooja/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  deletePooja: async (id) => {
    const response = await api.delete(`/api/pooja/${id}`);
    return response.data;
  }
};

export default poojaService;
