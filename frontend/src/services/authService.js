import api from "./api";

export const signup = async (userData) => {
  const response = await api.post("/auth/signup", userData);
  return response.data;
};

export const signupUser = signup;

export const login = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  return response.data;
};

export const logout = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};

export const getMe = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

// Fetch public student list (unprotected, only retrieves names and IDs for signup)
export const getPublicStudents = async () => {
  const response = await api.get("/students/public");
  return response.data;
};

// Fetch children linked to a parent's email address
export const getParentStudents = async (email) => {
  const response = await api.post("/auth/parent-students", { email });
  return response.data;
};

export const validateOnboardingCode = async (accessCode) => {
  const response = await api.get(`/auth/parent-onboard/${accessCode}`);
  return response.data;
};

export const switchActiveChild = async (studentId) => {
  const response = await api.post("/auth/switch-student", { studentId });
  return response.data;
};

export const getUsers = async () => {
  const response = await api.get("/auth/users");
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/auth/users/${id}`);
  return response.data;
};

export const updateUser = async (id, userData) => {
  const response = await api.put(`/auth/users/${id}`, userData);
  return response.data;
};

export const getTeachers = async () => {
  const response = await api.get("/auth/teachers");
  return response.data;
};

export const createTeacher = async (teacherData) => {
  const response = await api.post("/auth/teachers", teacherData);
  return response.data;
};

export const updateTeacher = async (id, teacherData) => {
  const response = await api.put(`/auth/teachers/${id}`, teacherData);
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

export const resetPassword = async (email, otp, newPassword) => {
  const response = await api.post("/auth/reset-password", { email, otp, newPassword });
  return response.data;
};

