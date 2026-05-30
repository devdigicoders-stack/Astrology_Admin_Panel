import api from "./api";

// Get Global App Settings
export const getSettings = async () => {
  try {
    const response = await api.get("/api/admin/settings");
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Failed to fetch settings";
  }
};

// Update Global App Settings
export const updateSettings = async (settingsData) => {
  try {
    const response = await api.put("/api/admin/settings", settingsData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Failed to update settings";
  }
};
