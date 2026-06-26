import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true, // Enables cookie sending/receiving with cross-origin requests
});

export default api;