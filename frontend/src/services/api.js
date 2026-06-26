import axios from "axios";

const API = axios.create({
  baseURL: "https://child-milestone-tracker-backend.onrender.com/api",
  withCredentials: true,
});

export default API;