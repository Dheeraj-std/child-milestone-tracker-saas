import { useEffect, useState } from "react";
import { getUsers, deleteUser, getTeachers } from "../services/authService";
import { getStudents, getAllFeedback, getAdminStatistics } from "../services/studentService";
import TeacherForm from "../Components/forms/TeacherForm";
import { toast } from "react-hot-toast";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  
  // Dynamic statistics state
  const [statistics, setStatistics] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalParents: 0,
    totalMeetings: 0,
    totalMilestones: 0,
    totalAttendance: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  
  const [activeTab, setActiveTab] = useState("OVERVIEW"); // OVERVIEW or TEACHERS
  const [editingTeacher, setEditingTeacher] = useState(null);

  const loadData = async () => {
    try {
      const uData = await getUsers();
      setUsers(uData.users || []);

      const sData = await getStudents();
      setStudents(sData.students || []);

      const fData = await getAllFeedback();
      setFeedbacks(fData.feedbacks || []);

      const tData = await getTeachers();
      setTeachers(tData.teachers || []);
    } catch (error) {
      console.error("Failed to load admin metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const res = await getAdminStatistics();
      if (res.success) {
        setStatistics(res.statistics);
      }
    } catch (error) {
      console.error("Failed to load dynamic statistics:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadData();
    loadStats();
  }, []);

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete user "${name}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await deleteUser(id);
      if (res.success) {
        setUsers(users.filter((u) => u.id !== id));
        setTeachers(teachers.filter((t) => t.id !== id));
        if (editingTeacher && editingTeacher.id === id) {
          setEditingTeacher(null);
        }
        toast.success(`User "${name}" deleted successfully.`);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to delete user. Please try again.";
      toast.error(errMsg);
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin"></div>
        <p className="mt-4 text-slate-400 font-medium">Opening administrator console...</p>
      </div>
    );
  }

  // Calculate statistics
  const totalUsers = users.length;
  const totalStudents = students.length;
  const totalFeedbacks = feedbacks.length;
  const totalMilestones = students.reduce(
    (sum, s) => sum + (s.milestones?.length || 0),
    0
  );

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "ADMIN":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "TEACHER":
        return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
      case "PARENT":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-rose-950/40 to-slate-900/30 border border-rose-500/20 rounded-3xl p-6 md:p-8">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-rose-500/10 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <span className="text-[10px] uppercase font-bold tracking-widest text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
            System Administration
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-2">
            Admin Control Center
          </h1>
          <p className="text-slate-300 mt-2 text-sm max-w-xl">
            Overview system-wide metrics, audit user registration roles, and manage active parent and teacher accounts.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Metric 1: Students */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 hover:border-slate-700/50 transition-all flex flex-col justify-between">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[9px] font-bold uppercase tracking-wider">Students</span>
            <span className="p-1 rounded bg-slate-800 text-indigo-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </span>
          </div>
          {loadingStats ? (
            <div className="h-8 w-16 bg-slate-800 animate-pulse rounded-md mt-3"></div>
          ) : (
            <h3 className="text-2xl font-black text-white mt-3">{statistics.totalStudents}</h3>
          )}
        </div>

        {/* Metric 2: Teachers */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 hover:border-slate-700/50 transition-all flex flex-col justify-between">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[9px] font-bold uppercase tracking-wider">Teachers</span>
            <span className="p-1 rounded bg-slate-800 text-purple-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
            </span>
          </div>
          {loadingStats ? (
            <div className="h-8 w-16 bg-slate-800 animate-pulse rounded-md mt-3"></div>
          ) : (
            <h3 className="text-2xl font-black text-white mt-3">{statistics.totalTeachers}</h3>
          )}
        </div>

        {/* Metric 3: Parents */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 hover:border-slate-700/50 transition-all flex flex-col justify-between">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[9px] font-bold uppercase tracking-wider">Parents</span>
            <span className="p-1 rounded bg-slate-800 text-emerald-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </span>
          </div>
          {loadingStats ? (
            <div className="h-8 w-16 bg-slate-800 animate-pulse rounded-md mt-3"></div>
          ) : (
            <h3 className="text-2xl font-black text-white mt-3">{statistics.totalParents}</h3>
          )}
        </div>

        {/* Metric 4: Meetings */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 hover:border-slate-700/50 transition-all flex flex-col justify-between">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[9px] font-bold uppercase tracking-wider">Meetings</span>
            <span className="p-1 rounded bg-slate-800 text-rose-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path>
              </svg>
            </span>
          </div>
          {loadingStats ? (
            <div className="h-8 w-16 bg-slate-800 animate-pulse rounded-md mt-3"></div>
          ) : (
            <h3 className="text-2xl font-black text-white mt-3">{statistics.totalMeetings}</h3>
          )}
        </div>

        {/* Metric 5: Milestones */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 hover:border-slate-700/50 transition-all flex flex-col justify-between">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[9px] font-bold uppercase tracking-wider">Milestones</span>
            <span className="p-1 rounded bg-slate-800 text-amber-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </span>
          </div>
          {loadingStats ? (
            <div className="h-8 w-16 bg-slate-800 animate-pulse rounded-md mt-3"></div>
          ) : (
            <h3 className="text-2xl font-black text-white mt-3">{statistics.totalMilestones}</h3>
          )}
        </div>

        {/* Metric 6: Attendance */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 hover:border-slate-700/50 transition-all flex flex-col justify-between">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[9px] font-bold uppercase tracking-wider">Attendance</span>
            <span className="p-1 rounded bg-slate-800 text-teal-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
              </svg>
            </span>
          </div>
          {loadingStats ? (
            <div className="h-8 w-16 bg-slate-800 animate-pulse rounded-md mt-3"></div>
          ) : (
            <h3 className="text-2xl font-black text-white mt-3">{statistics.totalAttendance}</h3>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-6 border-b border-slate-850 pb-px">
        <button
          onClick={() => setActiveTab("OVERVIEW")}
          className={`pb-4 text-sm font-bold tracking-tight border-b-2 transition-all cursor-pointer ${
            activeTab === "OVERVIEW"
              ? "border-rose-500 text-rose-400 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Overview Database
        </button>
        <button
          onClick={() => setActiveTab("TEACHERS")}
          className={`pb-4 text-sm font-bold tracking-tight border-b-2 transition-all cursor-pointer ${
            activeTab === "TEACHERS"
              ? "border-rose-500 text-rose-400 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Manage Teachers
        </button>
      </div>

      {activeTab === "OVERVIEW" ? (
        /* Users Audit Table */
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white">Registered User Database</h2>
            <p className="text-slate-550 text-xs mt-1">Review accounts, roles, and child associations.</p>
          </div>

          <div className="overflow-x-auto">
            {users.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                No users registered in the database.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="py-3 px-4 font-bold">User</th>
                    <th className="py-3 px-4 font-bold">Email</th>
                    <th className="py-3 px-4 font-bold text-center">Role</th>
                    <th className="py-3 px-4 font-bold">Linked Child</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center font-bold text-indigo-400">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          {u.name}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{u.email}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${getRoleBadgeColor(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {u.role === "PARENT" ? (
                          u.studentName ? (
                            <span className="text-slate-200 font-medium">{u.studentName}</span>
                          ) : (
                            <span className="text-rose-400/85 italic">Orphan (No child)</span>
                          )
                        ) : (
                          <span className="text-slate-650">N/A</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          disabled={deletingId === u.id}
                          className="py-1.5 px-3 rounded-lg bg-slate-950/40 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {deletingId === u.id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        /* Teacher Management Section */
        <div className="space-y-6">
          <TeacherForm
            onTeacherAdded={loadData}
            editingTeacher={editingTeacher}
            setEditingTeacher={setEditingTeacher}
          />

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white">Registered Teacher Directory</h2>
              <p className="text-slate-550 text-xs mt-1">Manage credentials and permissions for teaching staff.</p>
            </div>

            <div className="overflow-x-auto">
              {teachers.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  No teachers registered in the system.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="py-3 px-4 font-bold">Teacher</th>
                      <th className="py-3 px-4 font-bold">Email</th>
                      <th className="py-3 px-4 font-bold text-center">Employee ID</th>
                      <th className="py-3 px-4 font-bold text-center">Classroom</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-xs">
                    {teachers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-white">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center font-bold text-indigo-400">
                              {t.name.charAt(0).toUpperCase()}
                            </div>
                            {t.name}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">{t.email}</td>
                        <td className="py-3.5 px-4 text-center text-slate-400 font-mono">
                          {t.employeeId || "—"}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {t.classroom ? (
                            <span className="inline-block text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {t.classroom}
                            </span>
                          ) : (
                            <span className="text-slate-600 italic">None Assigned</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => setEditingTeacher(t)}
                            className="py-1.5 px-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(t.id, t.name)}
                            disabled={deletingId === t.id}
                            className="py-1.5 px-3 rounded-lg bg-slate-950/40 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all disabled:opacity-50 cursor-pointer"
                          >
                            {deletingId === t.id ? "Deleting..." : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
