import axios from "axios";

const API_URL = "https://voyagehub-backend.onrender.com";

export const getTravelSuggestions = async (
  destination,
  days,
  interests,
  numPeople,
  budget,
) => {
  try {
    const response = await axios.post(`${API_URL}/generate-trip`, {
      destination,
      days,
      interests,
      numPeople,
      budget,
    });
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const checkHealth = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/health`);
    return response.data;
  } catch (error) {
    console.error("Health check failed:", error);
    throw error;
  }
};
