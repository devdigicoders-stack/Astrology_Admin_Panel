import api from "./api";

const transactionService = {
  getAllTransactions: async (filters = {}) => {
    // Convert filters object to query string if needed
    const queryParams = new URLSearchParams(filters).toString();
    const url = `/api/transactions/admin${queryParams ? `?${queryParams}` : ''}`;
    const response = await api.get(url);
    return response.data;
  },

  deleteTransaction: async (id) => {
    const response = await api.delete(`/api/transactions/admin/${id}`);
    return response.data;
  }
};

export default transactionService;
