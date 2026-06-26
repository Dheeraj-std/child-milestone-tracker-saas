import api from "./api";

export const getStudents = async (all = false) => {
  const response = await api.get(`/students${all ? "?all=true" : ""}`);
  return response.data;
};

export const createStudent = async (student) => {
  const response = await api.post("/students", student);
  return response.data;
};

export const deleteStudent = async (id) => {
  const response = await api.delete(`/students/${id}`);
  return response.data;
};

export const updateStudent = async (id, student) => {
  const response = await api.put(`/students/${id}`, student);
  return response.data;
};
export const getStudentById = async (id) => {
  const response = await api.get(`/students/${id}`);
  return response.data;
};

export const getParentFeedback = async (studentId) => {
  const response = await api.get(
    `/parent-feedback/${studentId}`
  );

  return response.data;
};

export const getAISuggestions = async (student) => {
  const response = await api.post(
    "/ai/suggestions",
    { student }
  );

  return response.data;
};

export const createMilestone = async (
  milestoneData
) => {
  const response = await api.post(
    "/milestones",
    milestoneData
  );

  return response.data;
};

export const deleteMilestone = async (id) => {
  const response = await api.delete(`/milestones/${id}`);
  return response.data;
};

export const getAllFeedback = async () => {
  const response = await api.get("/parent-feedback");
  return response.data;
};

export const generateAiNotes = async (category, score, studentId) => {
  const response = await api.post("/ai/generate-notes", {
    category,
    score,
    studentId,
  });
  return response.data;
};

// Classroom API
export const getClassrooms = async () => {
  const res = await api.get("/classrooms");
  return res.data;
};
export const getMyClassroom = async () => {
  const res = await api.get("/classrooms/my-classroom");
  return res.data;
};
export const createClassroom = async (data) => {
  const res = await api.post("/classrooms", data);
  return res.data;
};
export const updateClassroom = async (id, data) => {
  const res = await api.put(`/classrooms/${id}`, data);
  return res.data;
};
export const deleteClassroom = async (id) => {
  const res = await api.delete(`/classrooms/${id}`);
  return res.data;
};

// Attendance API
export const markAttendance = async (data) => {
  const res = await api.post("/attendance", data);
  return res.data;
};
export const getAttendanceSummary = async (date) => {
  const res = await api.get(`/attendance/summary?date=${date}`);
  return res.data;
};
export const getStudentAttendance = async (studentId) => {
  const res = await api.get(`/attendance/student/${studentId}`);
  return res.data;
};

// Media Gallery API
export const uploadMedia = async (data) => {
  const res = await api.post("/media", data);
  return res.data;
};
export const getGallery = async () => {
  const res = await api.get("/media/gallery");
  return res.data;
};
export const getStudentMedia = async (studentId) => {
  const res = await api.get(`/media/student/${studentId}`);
  return res.data;
};
export const deleteMedia = async (id) => {
  const res = await api.delete(`/media/${id}`);
  return res.data;
};

// Goals API
export const createGoal = async (data) => {
  const res = await api.post("/goals", data);
  return res.data;
};
export const getStudentGoals = async (studentId) => {
  const res = await api.get(`/goals/student/${studentId}`);
  return res.data;
};
export const updateGoal = async (id, data) => {
  const res = await api.put(`/goals/${id}`, data);
  return res.data;
};
export const deleteGoal = async (id) => {
  const res = await api.delete(`/goals/${id}`);
  return res.data;
};

// Observations API
export const createObservation = async (data) => {
  const res = await api.post("/observations", data);
  return res.data;
};
export const getStudentObservations = async (studentId) => {
  const res = await api.get(`/observations/student/${studentId}`);
  return res.data;
};
export const getAiWeeklySummary = async (studentId) => {
  const res = await api.post("/observations/ai-weekly-summary", { studentId });
  return res.data;
};
export const deleteObservation = async (id) => {
  const res = await api.delete(`/observations/${id}`);
  return res.data;
};

// Messaging API
export const sendMessage = async (data) => {
  const res = await api.post("/messages", data);
  return res.data;
};
export const getMessageThread = async (otherUserId) => {
  const res = await api.get(`/messages/thread/${otherUserId}`);
  return res.data;
};
export const getMessageContacts = async () => {
  const res = await api.get("/messages/contacts");
  return res.data;
};
export const getAdminMonitorMessages = async () => {
  const res = await api.get("/messages/monitor");
  return res.data;
};

// Events API
export const getEvents = async () => {
  const res = await api.get("/events");
  return res.data;
};
export const createEvent = async (data) => {
  const res = await api.post("/events", data);
  return res.data;
};
export const submitRSVP = async (eventId, status) => {
  const res = await api.post(`/events/${eventId}/rsvp`, { status });
  return res.data;
};
export const deleteEvent = async (id) => {
  const res = await api.delete(`/events/${id}`);
  return res.data;
};

// Notifications API
export const getNotifications = async () => {
  const res = await api.get("/notifications");
  return res.data;
};
export const markNotificationRead = async (id) => {
  const res = await api.put(`/notifications/${id}/read`);
  return res.data;
};
export const markAllNotificationsRead = async () => {
  const res = await api.put("/notifications/read-all");
  return res.data;
};

// Reports API
export const getStudentReports = async (studentId) => {
  const res = await api.get(`/reports/student/${studentId}`);
  return res.data;
};
export const generateMeetingReport = async (studentId, period) => {
  const res = await api.post("/reports/generate-meeting-report", { studentId, period });
  return res.data;
};
export const detectDevelopmentalRisk = async (studentId) => {
  const res = await api.post("/reports/risk-detection", { studentId });
  return res.data;
};

// Audit Logs API
export const getAuditLogs = async () => {
  const res = await api.get("/audit-logs");
  return res.data;
};

// Users API
export const getUsers = async () => {
  const res = await api.get("/auth/users");
  return res.data;
};

export const getAdminStatistics = async () => {
  const res = await api.get("/admin/statistics");
  return res.data;
};

export const deleteProgressReport = async (id) => {
  const res = await api.delete(`/reports/${id}`);
  return res.data;
};

export const updateProgressReport = async (id, summary) => {
  const res = await api.put(`/reports/${id}`, { summary });
  return res.data;
};

export const generateAiJournalNotes = async (category, behavior, emotional, studentId) => {
  const res = await api.post("/ai/generate-journal-notes", {
    category,
    behavior,
    emotional,
    studentId,
  });
  return res.data;
};