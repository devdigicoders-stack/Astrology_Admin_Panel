import api from "./api";

const poojaBookingService = {
  getAllBookings: async () => {
    const response = await api.get("/api/booking/pooja/admin");
    return response.data;
  },

  updateBookingStatus: async (id, status) => {
    const response = await api.put(`/api/booking/pooja/${id}/status`, { status });
    return response.data;
  },

  deleteBooking: async (id) => {
    const response = await api.delete(`/api/booking/pooja/${id}`);
    return response.data;
  }
};

export default poojaBookingService;
