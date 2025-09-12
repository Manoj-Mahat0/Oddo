import axios from "axios";

const API = axios.create({
  // baseURL: "http://127.0.0.1:8000",//local server
  baseURL: "https://oddo-bhe0.onrender.com",//online server
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
