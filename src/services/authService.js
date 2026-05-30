import api from "./api";

/**
 * Auth Service
 * Contains all API calls related to authentication.
 */
const authService = {
  /**
   * Login Admin
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<Object>} API response data
   */
  loginAdmin: async (email, password) => {
    const response = await api.post("/api/admin/login", { email, password });
    return response.data; // Expected format: { success, message, token, admin }
  },

  // Future auth endpoints (e.g., resetPassword, getProfile) can go here
};

export default authService;
