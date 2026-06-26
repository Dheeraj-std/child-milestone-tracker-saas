import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getParentStudents, switchActiveChild } from "../services/authService";
import {
  getStudentById,
  getParentFeedback,
  getStudentGoals,
  getStudentAttendance,
  getStudentMedia,
  getEvents,
  submitRSVP,
} from "../services/studentService";
import api from "../services/api";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { toast } from "react-hot-toast";

const ParentDashboard = () => {
  const { user, setUser } = useAuth();
  const [student, setStudent] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackInput, setFeedbackInput] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [linkedStudents, setLinkedStudents] = useState([]);

  // Additional preview states
  const [goals, setGoals] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({ total: 0, present: 0, absent: 0, percentage: 100 });
  const [mediaFeed, setMediaFeed] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [processingRsvp, setProcessingRsvp] = useState({});

  const fetchChildData = async () => {
    if (!user?.studentId) {
      setError("No child linked to this parent account.");
      setLoading(false);
      return;
    }

    try {
      // 1. Basic student profile
      const studentData = await getStudentById(user.studentId);
      setStudent(studentData.student);

      // 2. Feedback listing
      const feedbackData = await getParentFeedback(user.studentId);
      setFeedbacks(feedbackData.feedbacks || []);

      // 3. Child target goals
      const goalsRes = await getStudentGoals(user.studentId);
      if (goalsRes.success) {
        setGoals(goalsRes.goals?.slice(0, 4) || []);
      }

      // 4. Attendance rate
      const attRes = await getStudentAttendance(user.studentId);
      if (attRes.success && attRes.stats) {
        setAttendanceStats(attRes.stats);
      }

      // 5. Memories media feed
      const mediaRes = await getStudentMedia(user.studentId);
      if (mediaRes.success) {
        setMediaFeed(mediaRes.media?.slice(0, 3) || []);
      }

      // 6. Upcoming school events
      const eventsRes = await getEvents();
      if (eventsRes.success) {
        // Filter future events and show top 3
        const sorted = (eventsRes.events || []).sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );
        setUpcomingEvents(sorted.slice(0, 3));
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load child development records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildData();
  }, [user?.studentId]);

  useEffect(() => {
    const loadLinkedStudents = async () => {
      if (user?.email) {
        try {
          const res = await getParentStudents(user.email);
          if (res.success && res.students) {
            setLinkedStudents(res.students);
          }
        } catch (err) {
          console.error("Failed to load linked students:", err);
        }
      }
    };
    loadLinkedStudents();
  }, [user?.email]);

  const handleSwitchChild = async (studentId) => {
    const loadToast = toast.loading("Switching child profile...");
    try {
      const res = await switchActiveChild(studentId);
      if (res.success && res.user) {
        setUser(res.user);
        toast.success(`Switched view to ${res.user.studentId ? "selected child" : "child"}`, { id: loadToast });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to switch child profile.", { id: loadToast });
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackInput.trim() || !user?.studentId) return;

    setSubmittingFeedback(true);
    try {
      const res = await api.post("/parent-feedback", {
        studentId: user.studentId,
        feedback: feedbackInput,
      });

      if (res.data.success) {
        setFeedbackInput("");
        toast.success("Feedback shared with teacher!");
        // Reload feedbacks
        const feedbackData = await getParentFeedback(user.studentId);
        setFeedbacks(feedbackData.feedbacks || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to share feedback.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleQuickRSVP = async (eventId, status) => {
    setProcessingRsvp((prev) => ({ ...prev, [eventId]: true }));
    try {
      const res = await submitRSVP(eventId, status);
      if (res.success) {
        toast.success(`RSVP updated: ${status.toLowerCase()}`);
        // Reload events
        const eventsRes = await getEvents();
        if (eventsRes.success) {
          const sorted = (eventsRes.events || []).sort(
            (a, b) => new Date(a.date) - new Date(b.date)
          );
          setUpcomingEvents(sorted.slice(0, 3));
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to send RSVP.");
    } finally {
      setProcessingRsvp((prev) => ({ ...prev, [eventId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin"></div>
        <p className="mt-4 text-slate-400 font-medium">Opening parent portal...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl mb-4">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">Access Error</h2>
        <p className="text-slate-400 text-sm mt-2 max-w-md">{error || "Could not retrieve student info."}</p>
      </div>
    );
  }

  const radarData = (student.milestones || []).map((m) => ({
    subject: m.category.split(" ")[0],
    Score: m.score * 10,
  }));

  const getStatusColor = (score) => {
    if (score >= 8) return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    if (score >= 5) return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
  };

  const getStatusText = (score) => {
    if (score >= 8) return "On Track";
    if (score >= 5) return "Developing";
    return "Needs Focus";
  };

  const displayGrowth = student ? (student.growth > 10 ? student.growth / 10 : student.growth) : 0;

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950/40 to-indigo-950/30 border border-emerald-500/20 rounded-3xl p-6 md:p-8">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
              Parent Portal Dashboard
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mt-2">
              Welcome, {user.name} 👋
            </h1>
            <p className="text-slate-300 mt-2 text-xs">
              Linked Child: <strong className="text-white font-bold">{student.name}</strong> ({student.classroom})
            </p>
            {linkedStudents.length > 1 && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Switch Profile:</span>
                <select
                  value={student.id}
                  onChange={(e) => handleSwitchChild(e.target.value)}
                  className="bg-slate-950/80 border border-slate-800 text-white text-[11px] rounded-xl px-2.5 py-1 outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {linkedStudents.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.name} ({child.classroom})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl px-6 py-4 text-center shrink-0">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
              Development growth score
            </span>
            <span className="text-3xl font-black text-emerald-400 mt-1 block">
              {(displayGrowth || 0).toFixed(1)}/10
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Development Metrics, Right charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Child Milestones List */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl flex flex-col">
          <h2 className="text-base font-bold text-white mb-4">Recorded Observations</h2>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 flex-1">
            {!student.milestones || student.milestones.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs py-12">
                No milestones recorded yet. Contact teacher for details.
              </div>
            ) : (
              student.milestones.map((m) => (
                <div
                  key={m.id}
                  className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-slate-700/50"
                >
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white">{m.category}</h4>
                    {m.notes && <p className="text-slate-400 text-[11px] leading-relaxed">{m.notes}</p>}
                  </div>
                  <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${getStatusColor(m.score)}`}>
                      {getStatusText(m.score)} ({m.score}/10)
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Development Shape (Radar Chart) */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <h2 className="text-base font-bold text-white mb-4">Development Profile</h2>
          <div className="h-60 w-full flex items-center justify-center">
            {radarData.length < 3 ? (
              <div className="text-slate-500 text-center text-xs px-6">
                <svg className="w-10 h-10 mx-auto text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.003 9.003 0 1020.945 13H11V3.055z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path>
                </svg>
                Radar chart requires at least 3 categories logged. Currently showing milestones status listing.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={10} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={9} />
                  <Radar name={student.name} dataKey="Score" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "12px",
                      color: "#f8fafc",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
          <p className="text-slate-500 text-[9px] text-center leading-relaxed mt-2">
            This graph highlights strength vectors across language, cognitive, social, and physical domains.
          </p>
        </div>
      </div>

      {/* Second Row: Previews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Attendance Ring Card */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 shadow-xl flex flex-col justify-between text-center min-h-[220px]">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Attendance Rate</h3>
            <p className="text-slate-400 text-[10px]">Tracked child preschool registers</p>
          </div>
          <div className="my-3 flex justify-center items-center">
            <div className="relative w-24 h-24 rounded-full border-4 border-slate-800 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin-slow"></div>
              <span className="text-xl font-black text-emerald-400">{attendanceStats.percentage}%</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-500">
            Total days logged: {attendanceStats.total}
          </span>
        </div>

        {/* Goals Tracker Card */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 shadow-xl flex flex-col justify-between min-h-[220px]">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Active Learning Targets</h3>
            
            {goals.length === 0 ? (
              <p className="text-slate-500 text-[10px] italic py-2">No active goals listed.</p>
            ) : (
              <div className="space-y-2.5">
                {goals.map((g) => (
                  <div key={g.id} className="text-[10px] space-y-1">
                    <div className="flex justify-between items-center text-slate-300">
                      <span className="font-bold truncate max-w-[100px]">{g.title}</span>
                      <span className="font-semibold text-indigo-400">{g.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1 border border-slate-800">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${g.progress}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <a
            href="/attendance"
            className="text-[10px] font-bold text-indigo-400 hover:text-white mt-4 block text-center border border-slate-800/80 rounded-xl py-1"
          >
            Check Progress Detail →
          </a>
        </div>

        {/* Memory Gallery Preview */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 shadow-xl flex flex-col justify-between min-h-[220px]">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Classroom Memories</h3>
            
            {mediaFeed.length === 0 ? (
              <p className="text-slate-500 text-[10px] italic py-2">No picture memories uploaded.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {mediaFeed.map((media) => (
                  <div key={media.id} className="aspect-square bg-slate-950 rounded-lg overflow-hidden border border-slate-800" title={media.caption}>
                    <img src={media.url} alt="Memory" className="w-full h-full object-cover hover:scale-110 transition-all" />
                  </div>
                ))}
              </div>
            )}
          </div>
          <a
            href="/gallery"
            className="text-[10px] font-bold text-indigo-400 hover:text-white mt-4 block text-center border border-slate-800/80 rounded-xl py-1"
          >
            Open Media Gallery →
          </a>
        </div>

        {/* Events Page Preview */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 shadow-xl flex flex-col justify-between min-h-[220px]">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">School Activities</h3>
                  {upcomingEvents.length === 0 ? (
              <p className="text-slate-500 text-[10px] italic py-2">No upcoming events listed.</p>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map((evt) => {
                  const parentRsvp = evt.rsvps?.find((r) => r.parentId === user.id);
                  return (
                    <div key={evt.id} className="text-[10px] bg-slate-950/60 border border-slate-800 p-1.5 rounded-lg flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-200 block truncate max-w-[80px]">{evt.title}</span>
                        <span className="text-[8px] text-slate-500">{new Date(evt.date).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => handleQuickRSVP(evt.id, "YES")}
                          disabled={processingRsvp[evt.id]}
                          className={`p-1 rounded cursor-pointer transition-all ${
                            parentRsvp?.status === "YES"
                              ? "bg-emerald-600 text-white font-bold"
                              : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600 hover:text-white"
                          }`}
                          title="Going"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => handleQuickRSVP(evt.id, "NO")}
                          disabled={processingRsvp[evt.id]}
                          className={`p-1 rounded cursor-pointer transition-all ${
                            parentRsvp?.status === "NO"
                              ? "bg-rose-600 text-white font-bold"
                              : "bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-600 hover:text-white"
                          }`}
                          title="Decline"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <a
            href="/events"
            className="text-[10px] font-bold text-indigo-400 hover:text-white mt-4 block text-center border border-slate-800/80 rounded-xl py-1"
          >
            See Calendar & RSVPs →
          </a>
        </div>
      </div>

      {/* Feedback submission */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Left: Submit parent feedback */}
          <div className="md:col-span-3 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white mb-2">Message Classroom Teacher</h2>
              <p className="text-slate-400 text-xs mb-4">Share progress reports or questions with early educators.</p>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <textarea
                value={feedbackInput}
                onChange={(e) => setFeedbackInput(e.target.value)}
                placeholder="Hi teacher, Aarav has been matching shapes at home too! He talks about sunflowers every afternoon..."
                required
                rows={4}
                className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-xl py-3 px-4 outline-none focus:border-emerald-500 transition-all text-xs placeholder:text-slate-600 resize-none"
              />
              <button
                type="submit"
                disabled={submittingFeedback || !feedbackInput.trim()}
                className="w-full sm:w-auto px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl py-2.5 text-xs transition-all transform active:scale-[0.98] shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
              >
                {submittingFeedback ? "Sending..." : "Submit Feedback"}
              </button>
            </form>
          </div>

          {/* Right: Previous Feedbacks */}
          <div className="md:col-span-2 flex flex-col h-full border-t md:border-t-0 md:border-l border-slate-800/60 pt-6 md:pt-0 md:pl-8">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-4">
              Previous Feedbacks ({feedbacks.length})
            </span>
            <div className="flex-1 max-h-48 overflow-y-auto space-y-2 pr-1">
              {feedbacks.length === 0 ? (
                <span className="text-slate-500 text-[10px] italic">No previous comments.</span>
              ) : (
                feedbacks.map((f) => (
                  <div
                    key={f.id}
                    className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 flex justify-between items-center gap-2 hover:border-slate-800 transition-all"
                  >
                    <p className="text-slate-400 text-[10px] truncate flex-1">"{f.feedback}"</p>
                    <span className="text-[8px] text-slate-500 whitespace-nowrap">
                      {new Date(f.createdAt).toLocaleDateString(undefined, {
                        month: "numeric",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
