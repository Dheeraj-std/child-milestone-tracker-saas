import axios from "axios";

const API = axios.create({
  baseURL: "https://child-milestone-tracker-backend.onrender.com/api",
});

export default API;