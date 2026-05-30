import api from "./api";

const productService = {
  // Use isolated admin route to get all products (including inactive)
  getAdminProducts: async () => {
    const response = await api.get("/api/products/admin/all");
    return response.data;
  },

  createProduct: async (formData) => {
    const response = await api.post("/api/products", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  updateProduct: async (id, formData) => {
    const response = await api.put(`/api/products/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await api.delete(`/api/products/${id}`);
    return response.data;
  }
};

export default productService;
