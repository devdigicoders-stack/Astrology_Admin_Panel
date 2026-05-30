import api from "./api";

const astrologerService = {
  getAllAstrologers: async () => {
    const response = await api.get("/api/astrologer");
    return response.data;
  },
  
  getAstrologerById: async (id) => {
    const response = await api.get(`/api/astrologer/${id}`);
    return response.data;
  },
  
  createAstrologer: async (formData) => {
    // We expect formData to be a browser FormData object (for multipart/form-data)
    const response = await api.post("/api/astrologer/register", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  updateAstrologer: async (id, formData) => {
    // formData can be JSON or FormData object
    // Axios will automatically set Content-Type based on what we pass.
    // If it's FormData, it will send multipart. If it's a plain object, it sends JSON.
    const isFormData = formData instanceof FormData;
    const response = await api.put(`/api/astrologer/${id}`, formData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
    });
    return response.data;
  },
  
  toggleVerification: async (id, isVerified) => {
    const response = await api.patch(`/api/astrologer/${id}/verify`, { isVerified });
    return response.data;
  },
  
  deleteAstrologer: async (id) => {
    const response = await api.delete(`/api/astrologer/${id}`);
    return response.data;
  },
  
  setGlobalCommission: async (commissionPercentage) => {
    const response = await api.patch("/api/astrologer/commission", { commissionPercentage });
    return response.data;
  }
};

export default astrologerService;
