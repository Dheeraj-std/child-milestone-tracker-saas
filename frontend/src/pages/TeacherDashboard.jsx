import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getStudents, getAllFeedback } from "../services/studentService";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Link } from "react-router-dom";

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const studentData = await getStudents();
        setStudents(studentData.students || []);

        const feedbackData = await getAllFeedback();
        setFeedbacks(feedbackData.feedbacks || []);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin"></div>
        <p className="mt-4 text-slate-400 font-medium">Gathering classroom analytics...</p>
      </div>
    );
  }

  // Aggregations
  const totalStudents = students.length;
  
  const totalMilestones = students.reduce(
    (sum, student) => sum + (student.milestones?.length || 0),
    0
  );

  const scaledStudents = students.map((s) => {
    let growth = s.growth || 0;
    if (growth > 10) {
      growth = growth / 10;
    }
    return { ...s, growth };
  });

  const averageGrowth = scaledStudents.length > 0
    ? (scaledStudents.reduce((sum, s) => sum + s.growth, 0) / scaledStudents.length).toFixed(1)
    : 0;

  const totalFeedback = feedbacks.length;

  // Chart 1: Growth by Student
  const growthData = scaledStudents.map((s) => ({
    name: s.name.split(" ")[0], // short name
    Growth: s.growth,
  }));

  // Chart 2: Milestone Category Distribution
  const categoryCounts = {};
  students.forEach((s) => {
    (s.milestones || []).forEach((m) => {
      categoryCounts[m.category] = (categoryCounts[m.category] || 0) + 1;
    });
  });

  const COLORS = ["#6366f1", "#a855f7", "#ec4899", "#10b981", "#f59e0b", "#3b82f6"];
  const pieData = Object.keys(categoryCounts).map((cat) => ({
    name: cat,
    value: categoryCounts[cat],
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900/40 to-purple-900/30 border border-indigo-500/20 rounded-3xl p-6 md:p-8">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl"></div>
        <div className="relative z-10 max-w-xl">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user.name} 👋
          </h1>
          <p className="text-slate-300 mt-2 text-sm leading-relaxed">
            Monitor child milestone progression, assess growth analytics, and collaborate with parents to track early education success.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Card 1: Total Students */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/50 transition-all flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Class Size</span>
            <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-white">{totalStudents}</h3>
            <p className="text-slate-400 text-xs mt-1">Students enrolled</p>
          </div>
        </div>

        {/* Card 2: Total Milestones */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/50 transition-all flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Observations</span>
            <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-white">{totalMilestones}</h3>
            <p className="text-slate-400 text-xs mt-1">Milestones logged</p>
          </div>
        </div>

        {/* Card 3: Avg Growth */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/50 transition-all flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Avg Growth</span>
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-white">{averageGrowth}/10</h3>
            <p className="text-slate-400 text-xs mt-1">Development average</p>
          </div>
        </div>

        {/* Card 4: Feedback Received */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/50 transition-all flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Feedback</span>
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
              </svg>
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-white">{totalFeedback}</h3>
            <p className="text-slate-400 text-xs mt-1">Comments submitted</p>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Comparison Chart */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-6">Student Growth Comparison (scale 1-10)</h2>
          <div className="h-80 w-full">
            {growthData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500">
                No student records to compare.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growthData}>
                  <defs>
                    <linearGradient id="barColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[0, 10]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "12px",
                      color: "#f8fafc",
                    }}
                  />
                  <Bar dataKey="Growth" fill="url(#barColor)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Milestone Distribution Chart */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-6">Milestones by Category</h2>
          <div className="h-80 w-full flex flex-col justify-between">
            {pieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500">
                No milestones logged yet.
              </div>
            ) : (
              <>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          borderRadius: "12px",
                          color: "#f8fafc",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 justify-center text-[10px] text-slate-400 mt-2 max-h-16 overflow-y-auto">
                  {pieData.map((d, index) => (
                    <span key={d.name} className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      {d.name.split(" ")[0]} ({d.value})
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Feed & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Parent Feedback Feed */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white">Recent Parent Feedbacks</h2>
            <span className="text-[10px] bg-slate-800 text-indigo-400 font-bold px-2 py-0.5 rounded-md border border-slate-700">Latest</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {feedbacks.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                No feedback received from parents.
              </div>
            ) : (
              feedbacks.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-4 transition-all hover:bg-slate-900/30"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-indigo-400">{item.student?.name || "Student"}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs italic leading-relaxed">"{item.feedback}"</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Quick actions & shortcut panel */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between h-[400px]">
          <div>
            <h2 className="text-lg font-bold text-white mb-2">Quick Actions</h2>
            <p className="text-slate-400 text-xs mb-6">Frequently used tools for classroom management.</p>

            <div className="space-y-3">
              <Link
                to="/teacher/students"
                className="w-full flex items-center justify-between p-4 bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 rounded-xl text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                    </svg>
                  </span>
                  <div>
                    <h4 className="text-white text-xs font-bold group-hover:text-indigo-300">Add New Student</h4>
                    <p className="text-slate-500 text-[10px] mt-0.5">Register a child into the program</p>
                  </div>
                </div>
                <svg className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </Link>

              <Link
                to="/teacher/students"
                className="w-full flex items-center justify-between p-4 bg-slate-950/60 border border-slate-800 hover:border-purple-500/50 hover:bg-purple-500/5 rounded-xl text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                  </span>
                  <div>
                    <h4 className="text-white text-xs font-bold group-hover:text-purple-300">Record Observations</h4>
                    <p className="text-slate-500 text-[10px] mt-0.5">Log new development milestones</p>
                  </div>
                </div>
                <svg className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </Link>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-indigo-950/40 to-slate-950/40 border border-slate-800 rounded-xl">
            <h4 className="text-indigo-400 text-xs font-bold">Classroom Activity Status</h4>
            <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">
              {totalStudents > 0
                ? `${totalMilestones} developmental observations have been recorded for ${totalStudents} students. Overall average is ${averageGrowth}/10.`
                : "No students registered yet. Click 'Add New Student' to begin."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
