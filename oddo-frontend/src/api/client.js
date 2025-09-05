import axios from "axios";

const API = axios.create({
  baseURL: "http://192.168.1.63:8000",
});

// Add Authorization header automatically if token exists
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
