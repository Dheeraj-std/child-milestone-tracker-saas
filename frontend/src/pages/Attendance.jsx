import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getStudents, markAttendance, getAttendanceSummary, getStudentAttendance } from "../services/studentService";
import { toast } from "react-hot-toast";

const Attendance = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceData, setAttendanceData] = useState({}); // { studentId: { status, remarks } }
  const [summary, setSummary] = useState({ present: 0, absent: 0, late: 0, halfDay: 0 });
  const [history, setHistory] = useState([]);
  const [personalStats, setPersonalStats] = useState({ total: 0, present: 0, absent: 0, percentage: 100 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load teacher or parent data
  const loadData = async () => {
    setLoading(true);
    try {
      if (user.role === "TEACHER" || user.role === "ADMIN") {
        // Load class list
        const studentData = await getStudents();
        const activeStudents = studentData.students || [];
        setStudents(activeStudents);

        // Fetch existing attendance logs for selected date
        const logsRes = await getAttendanceSummary(selectedDate);
        const existingData = {};
        
        // Initialize with default PRESENT status
        activeStudents.forEach((s) => {
          existingData[s.id] = { status: "PRESENT", remarks: "" };
        });

        // Override with database logs
        if (logsRes.success && logsRes.logs) {
          logsRes.logs.forEach((log) => {
            existingData[log.studentId] = {
              status: log.status,
              remarks: log.remarks || "",
            };
          });
          setSummary(logsRes.summary || { present: 0, absent: 0, late: 0, halfDay: 0 });
        }
        setAttendanceData(existingData);
      } else if (user.role === "PARENT") {
        // Load child attendance history
        if (user.studentId) {
          const res = await getStudentAttendance(user.studentId);
          if (res.success) {
            setHistory(res.attendances || []);
            setPersonalStats(res.stats || { total: 0, present: 0, absent: 0, percentage: 100 });
          }
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load attendance records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, user]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleRemarksChange = (studentId, remarks) => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      },
    }));
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      let successCount = 0;
      for (const studentId of Object.keys(attendanceData)) {
        const payload = {
          studentId,
          date: selectedDate,
          status: attendanceData[studentId].status,
          remarks: attendanceData[studentId].remarks,
        };
        const res = await markAttendance(payload);
        if (res.success) successCount++;
      }
      toast.success(`Successfully saved attendance for ${successCount} students.`);
      // Reload stats
      const logsRes = await getAttendanceSummary(selectedDate);
      if (logsRes.success) {
        setSummary(logsRes.summary || { present: 0, absent: 0, late: 0, halfDay: 0 });
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update daily attendance register.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin"></div>
        <p className="mt-4 text-slate-400 font-medium">Opening attendance registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl">
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-950/40 to-indigo-950/30 border border-orange-500/20 rounded-3xl p-6 md:p-8">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-orange-500/10 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <span className="text-[10px] uppercase font-bold tracking-widest text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-md">
            Preschool Operations
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-2">
            Attendance Registry
          </h1>
          <p className="text-slate-300 text-xs mt-1.5 leading-relaxed max-w-xl">
            {user.role === "PARENT"
              ? "Monitor your child's attendance rate, view history, and check monthly reports."
              : "Mark daily classroom logs, track absent trends, and monitor student attendance stats."}
          </p>
        </div>
      </div>

      {(user.role === "TEACHER" || user.role === "ADMIN") && (
        <>
          {/* Summary Stats Widgets */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Present</span>
              <h3 className="text-2xl font-black text-emerald-400 mt-2">{summary.present}</h3>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Absent</span>
              <h3 className="text-2xl font-black text-rose-400 mt-2">{summary.absent}</h3>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Late Arrivals</span>
              <h3 className="text-2xl font-black text-amber-400 mt-2">{summary.late}</h3>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Half Day</span>
              <h3 className="text-2xl font-black text-blue-400 mt-2">{summary.halfDay}</h3>
            </div>
          </div>

          {/* Date Selector & Save Control Panel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Select Registry Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={handleSaveAttendance}
              disabled={saving || students.length === 0}
              className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold rounded-xl py-2 px-5 text-xs transition-all transform active:scale-[0.98] shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center"
            >
              {saving ? "Saving Register..." : "💾 Save Attendance"}
            </button>
          </div>

          {/* Student Grid */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-white mb-4">Classroom Attendance Grid</h2>
            
            {students.length === 0 ? (
              <p className="text-slate-500 text-xs italic py-4">No enrolled students found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3 pr-4">Student Name</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 pl-4">Remarks / Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => {
                      const data = attendanceData[s.id] || { status: "PRESENT", remarks: "" };
                      return (
                        <tr key={s.id} className="border-b border-slate-850 hover:bg-slate-950/20 transition-all">
                          <td className="py-4 pr-4 font-bold text-white leading-tight">
                            {s.name}
                            <span className="block text-[10px] text-slate-500 font-normal mt-0.5">{s.classroom}</span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="inline-flex p-1 bg-slate-950/80 border border-slate-850 rounded-xl">
                              {["PRESENT", "ABSENT", "LATE", "HALF_DAY"].map((st) => {
                                const isSelected = data.status === st;
                                const colors = {
                                  PRESENT: "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30",
                                  ABSENT: "bg-rose-600/20 text-rose-400 border border-rose-500/30",
                                  LATE: "bg-amber-600/20 text-amber-400 border border-amber-500/30",
                                  HALF_DAY: "bg-blue-600/20 text-blue-400 border border-blue-500/30",
                                };
                                return (
                                  <button
                                    key={st}
                                    onClick={() => handleStatusChange(s.id, st)}
                                    className={`px-2 py-1 text-[9px] font-bold rounded-lg transition-all cursor-pointer ${
                                      isSelected
                                        ? colors[st]
                                        : "text-slate-500 hover:text-slate-300"
                                    }`}
                                  >
                                    {st.replace("_", " ")}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td className="py-4 pl-4">
                            <input
                              type="text"
                              value={data.remarks}
                              onChange={(e) => handleRemarksChange(s.id, e.target.value)}
                              placeholder="Remarks e.g. sick leave, late bus"
                              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-1.5 px-3 outline-none focus:border-indigo-500 text-xs placeholder:text-slate-650"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {user.role === "PARENT" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats Summary */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-white mb-4">Child Attendance Stats</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Total Tracked Days</span>
                  <span className="text-white font-bold">{personalStats.total}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Present / Late / Half Day</span>
                  <span className="text-white font-bold">{personalStats.present}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Absent Days</span>
                  <span className="text-white font-bold">{personalStats.absent}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-850/60 text-center">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Monthly Attendance Rate</span>
              <span className="text-4xl font-black text-orange-400 mt-1 block">{personalStats.percentage}%</span>
            </div>
          </div>

          {/* Timeline History */}
          <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-white mb-4">Attendance History Feed</h2>
            
            {history.length === 0 ? (
              <p className="text-slate-500 text-xs italic py-4">No attendance history logged yet.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {history.map((h) => {
                  const colors = {
                    PRESENT: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                    ABSENT: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
                    LATE: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
                    HALF_DAY: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
                  };
                  return (
                    <div
                      key={h.id}
                      className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl flex justify-between items-center gap-4 hover:border-slate-800 transition-all"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-white">{new Date(h.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", weekday: "long" })}</h4>
                        {h.remarks && <p className="text-[10px] text-slate-500 mt-1">{h.remarks}</p>}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${colors[h.status] || "bg-slate-800"}`}>
                        {h.status.replace("_", " ")}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
