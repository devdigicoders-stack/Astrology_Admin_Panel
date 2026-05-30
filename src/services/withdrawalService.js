import api from "./api";

const withdrawalService = {
  getAllWithdrawals: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const url = `/api/withdrawals/admin${queryParams ? `?${queryParams}` : ''}`;
    const response = await api.get(url);
    return response.data;
  },

  updateWithdrawalStatus: async (id, status, remarks = "") => {
    const response = await api.put(`/api/withdrawals/admin/${id}/status`, { status, remarks });
    return response.data;
  }
};

export default withdrawalService;
