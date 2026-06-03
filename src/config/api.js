import axios from "axios";

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 30000,
  DEFAULT_HEADERS: {
    "Content-Type": "application/json",
  },
};

axios.defaults.baseURL = API_CONFIG.BASE_URL;
axios.defaults.withCredentials = true;
axios.defaults.timeout = API_CONFIG.TIMEOUT;

export { API_BASE_URL };

console.log("🔗 API Configuration:", {
  environment: import.meta.env.VITE_ENV,
  baseURL: API_CONFIG.BASE_URL,
  withCredentials: axios.defaults.withCredentials,
});