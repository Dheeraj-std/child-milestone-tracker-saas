import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="relative w-20 h-20">
          {/* Pulsing glow */}
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse"></div>
          {/* Glassy Spinner */}
          <div className="absolute inset-0 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin"></div>
        </div>
        <p className="mt-6 text-slate-400 font-medium tracking-wide animate-pulse">
          Verifying security access...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // User does not have access. Redirect to their role-appropriate dashboard
    if (user.role === "TEACHER") {
      return <Navigate to="/teacher/dashboard" replace />;
    } else if (user.role === "PARENT") {
      return <Navigate to="/parent/dashboard" replace />;
    } else if (user.role === "ADMIN") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
