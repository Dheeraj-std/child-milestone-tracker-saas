import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./Components/ProtectedRoute";
import Layout from "./Components/Layout";
import { Toaster } from "react-hot-toast";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ParentOnboarding from "./pages/ParentOnboarding";
import TeacherDashboard from "./pages/TeacherDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Students from "./pages/Students";
import StudentProfile from "./pages/StudentProfile";
import Attendance from "./pages/Attendance";
import Gallery from "./pages/Gallery";
import EventsPage from "./pages/EventsPage";
import Messaging from "./pages/Messaging";
import ClassroomsPage from "./pages/ClassroomsPage";
import AuditLogs from "./pages/AuditLogs";

// Root Route Redirection based on role
const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin"></div>
        <p className="mt-4 text-slate-400 font-medium">Restoring secure session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "TEACHER") {
    return <Navigate to="/teacher/dashboard" replace />;
  }
  if (user.role === "PARENT") {
    return <Navigate to="/parent/dashboard" replace />;
  }
  if (user.role === "ADMIN") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#0f172a",
            color: "#f8fafc",
            border: "1px solid #334155",
            borderRadius: "12px",
            fontSize: "13px",
          },
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/parent-access/:accessCode" element={<ParentOnboarding />} />

        {/* Root Redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Protected Teacher/Admin Routes */}
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
              <Layout>
                <TeacherDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/students"
          element={
            <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
              <Layout>
                <Students />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/student/:id"
          element={
            <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
              <Layout>
                <StudentProfile />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Protected Parent Routes */}
        <Route
          path="/parent/dashboard"
          element={
            <ProtectedRoute allowedRoles={["PARENT"]}>
              <Layout>
                <ParentDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/profile"
          element={
            <ProtectedRoute allowedRoles={["PARENT"]}>
              <Layout>
                <ParentDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Protected Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Layout>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Protected Shared Pages */}
        <Route
          path="/attendance"
          element={
            <ProtectedRoute allowedRoles={["TEACHER", "ADMIN", "PARENT"]}>
              <Layout>
                <Attendance />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/gallery"
          element={
            <ProtectedRoute allowedRoles={["TEACHER", "ADMIN", "PARENT"]}>
              <Layout>
                <Gallery />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/events"
          element={
            <ProtectedRoute allowedRoles={["TEACHER", "ADMIN", "PARENT"]}>
              <Layout>
                <EventsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/messaging"
          element={
            <ProtectedRoute allowedRoles={["TEACHER", "ADMIN", "PARENT"]}>
              <Layout>
                <Messaging />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/classrooms"
          element={
            <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
              <Layout>
                <ClassroomsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Layout>
                <AuditLogs />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;