import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getStudentById,
  getParentFeedback,
  getAISuggestions,
  deleteMilestone,
  createGoal,
  getStudentGoals,
  updateGoal,
  deleteGoal,
  createObservation,
  getStudentObservations,
  getAiWeeklySummary,
  deleteObservation,
  getStudentAttendance,
  generateMeetingReport,
  detectDevelopmentalRisk,
  getStudentReports,
  deleteProgressReport,
  generateAiJournalNotes,
  updateProgressReport,
} from "../services/studentService";
import MilestoneForm from "../Components/forms/MilestoneForm";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

function StudentProfile() {
  const { id } = useParams();
  const { user } = useAuth();

  const [student, setStudent] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [generatingAi, setGeneratingAi] = useState(false);

  // Active Tab
  const [activeProfileTab, setActiveProfileTab] = useState("portfolio"); // portfolio, timeline, journal, goals, reports

  // Goals states
  const [goals, setGoals] = useState([]);
  const [loadingGoals, setLoadingGoals] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTargetDate, setGoalTargetDate] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);

  // Observations states
  const [observations, setObservations] = useState([]);
  const [loadingObs, setLoadingObs] = useState(false);
  const [journalNotes, setJournalNotes] = useState("");
  const [journalBehavior, setJournalBehavior] = useState("COOPERATIVE");
  const [journalEmotional, setJournalEmotional] = useState("HAPPY");
  const [journalLearning, setJournalLearning] = useState("COGNITIVE");
  const [savingJournal, setSavingJournal] = useState(false);
  const [aiWeeklySummaryText, setAiWeeklySummaryText] = useState("");
  const [generatingWeeklySummary, setGeneratingWeeklySummary] = useState(false);
  const [generatingJournalNotes, setGeneratingJournalNotes] = useState(false);

  // Timeline state
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // Reports states
  const [period, setPeriod] = useState("June 2026");
  const [generatedReport, setGeneratedReport] = useState("");
  const [activeReportId, setActiveReportId] = useState(null);
  const [isEditingReport, setIsEditingReport] = useState(false);
  const [editedReportText, setEditedReportText] = useState("");
  const [savingReportEdit, setSavingReportEdit] = useState(false);
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [riskAssessment, setRiskAssessment] = useState("");
  const [detectingRisk, setDetectingRisk] = useState(false);
  const [attendanceRate, setAttendanceRate] = useState(100);

  const fetchStudent = async () => {
    try {
      const data = await getStudentById(id);
      setStudent(data.student);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchFeedback = async () => {
    try {
      const data = await getParentFeedback(id);
      setFeedbacks(data.feedbacks || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchGoals = async () => {
    try {
      setLoadingGoals(true);
      const res = await getStudentGoals(id);
      if (res.success) {
        setGoals(res.goals || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingGoals(false);
    }
  };

  const fetchObservations = async () => {
    try {
      setLoadingObs(true);
      const res = await getStudentObservations(id);
      if (res.success) {
        setObservations(res.observations || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingObs(false);
    }
  };

  const fetchTimeline = async () => {
    try {
      setLoadingTimeline(true);
      // Fetch milestones, observations, and attendance logs
      const obsRes = await getStudentObservations(id);
      const attRes = await getStudentAttendance(id);
      const studentData = await getStudentById(id);

      const events = [];

      // Add milestones
      if (studentData.student?.milestones) {
        studentData.student.milestones.forEach((m) => {
          events.push({
            id: `milestone-${m.id}`,
            date: new Date(m.createdAt),
            type: "Milestone",
            title: `⭐ Milestone Tracked: ${m.category}`,
            desc: m.notes || "Recorded a developmental achievement.",
            badge: `Score: ${m.score}/10`,
            color: "border-indigo-500 text-indigo-400 bg-indigo-500/10",
          });
        });
      }

      // Add observations
      if (obsRes.success && obsRes.observations) {
        obsRes.observations.forEach((o) => {
          events.push({
            id: `obs-${o.id}`,
            date: new Date(o.createdAt),
            type: "Daily Journal",
            title: `📝 Daily Log: ${o.learning || "General"}`,
            desc: o.notes,
            badge: `${o.behavior || "COOPERATIVE"} • ${o.emotional || "HAPPY"}`,
            color: "border-purple-500 text-purple-400 bg-purple-500/10",
          });
        });
      }

      // Add attendance logs
      if (attRes.success && attRes.attendances) {
        // Compute attendance rate
        const stats = attRes.stats;
        if (stats) {
          setAttendanceRate(stats.percentage);
        }

        attRes.attendances.forEach((a) => {
          const colors = {
            PRESENT: "border-emerald-500 text-emerald-400 bg-emerald-500/10",
            ABSENT: "border-rose-500 text-rose-400 bg-rose-500/10",
            LATE: "border-amber-500 text-amber-400 bg-amber-500/10",
            HALF_DAY: "border-blue-500 text-blue-400 bg-blue-500/10",
          };
          events.push({
            id: `att-${a.id}`,
            date: new Date(a.date),
            type: "Attendance",
            title: `📅 Attendance: ${a.status}`,
            desc: a.remarks || "No remarks entered.",
            badge: a.status.replace("_", " "),
            color: colors[a.status] || "border-slate-500 text-slate-400 bg-slate-500/10",
          });
        });
      }

      // Sort events newest first
      events.sort((a, b) => b.date - a.date);
      setTimelineEvents(events);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      const res = await getStudentReports(id);
      if (res.success) {
        setReports(res.reports || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchStudent();
    fetchFeedback();
    fetchGoals();
    fetchObservations();
    fetchTimeline();
    fetchReports();
  }, [id]);

  const handleGenerateAI = async () => {
    setGeneratingAi(true);
    try {
      const data = await getAISuggestions(student);
      setAiSuggestion(data.suggestion);
    } catch (error) {
      console.error(error);
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleDeleteMilestone = async (milestoneId) => {
    if (!window.confirm("Are you sure you want to delete this developmental observation?")) {
      return;
    }

    try {
      await deleteMilestone(milestoneId);
      toast.success("Observation deleted successfully.");
      fetchStudent();
      fetchTimeline();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete observation.");
    }
  };

  // Goals handlers
  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;

    setSavingGoal(true);
    try {
      const payload = {
        studentId: id,
        title: goalTitle.trim(),
        targetDate: goalTargetDate ? new Date(goalTargetDate).toISOString() : null,
      };
      const res = await createGoal(payload);
      if (res.success) {
        toast.success("Goal set successfully!");
        setGoalTitle("");
        setGoalTargetDate("");
        fetchGoals();
      } else {
        toast.error("Failed to set goal.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to set goal.");
    } finally {
      setSavingGoal(false);
    }
  };

  const handleToggleGoalComplete = async (goalId, currentStatus) => {
    try {
      const nextStatus = currentStatus === "COMPLETED" ? "IN_PROGRESS" : "COMPLETED";
      const payload = {
        status: nextStatus,
        progress: nextStatus === "COMPLETED" ? 100 : 50,
      };
      const res = await updateGoal(goalId, payload);
      if (res.success) {
        toast.success(`Goal marked as ${nextStatus.toLowerCase()}`);
        fetchGoals();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update goal.");
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm("Delete this learning target goal?")) return;
    try {
      const res = await deleteGoal(goalId);
      if (res.success) {
        toast.success("Goal deleted.");
        fetchGoals();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete goal.");
    }
  };

  // Observations handlers
  const handleAddJournal = async (e) => {
    e.preventDefault();
    if (!journalNotes.trim()) return;

    setSavingJournal(true);
    try {
      const payload = {
        studentId: id,
        notes: journalNotes.trim(),
        behavior: journalBehavior,
        emotional: journalEmotional,
        learning: journalLearning,
      };
      const res = await createObservation(payload);
      if (res.success) {
        toast.success("Journal log added.");
        setJournalNotes("");
        fetchObservations();
        fetchTimeline();
      } else {
        toast.error("Failed to save observation.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save observation.");
    } finally {
      setSavingJournal(false);
    }
  };

  const handleSuggestJournalNotes = async () => {
    setGeneratingJournalNotes(true);
    try {
      const res = await generateAiJournalNotes(
        journalLearning,
        journalBehavior,
        journalEmotional,
        id
      );
      if (res.success) {
        setJournalNotes(res.notes);
        toast.success("AI suggestion generated!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate suggestion.");
    } finally {
      setGeneratingJournalNotes(false);
    }
  };

  const handleDeleteObs = async (obsId) => {
    if (!window.confirm("Delete this journal entry?")) return;
    try {
      const res = await deleteObservation(obsId);
      if (res.success) {
        toast.success("Observation deleted.");
        fetchObservations();
        fetchTimeline();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete observation.");
    }
  };

  const handleGenerateWeeklySummary = async () => {
    setGeneratingWeeklySummary(true);
    try {
      const res = await getAiWeeklySummary(id);
      if (res.success) {
        setAiWeeklySummaryText(res.summary);
        toast.success("AI weekly summary generated.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not generate AI summary.");
    } finally {
      setGeneratingWeeklySummary(false);
    }
  };

  // AI Reports handlers
  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await generateMeetingReport(id, period);
      if (res.success) {
        setGeneratedReport(res.report?.summary || res.reportContent);
        setActiveReportId(res.report?.id || null);
        setIsEditingReport(false);
        toast.success("AI Progress Card generated!");
        fetchReports();
      }
    } catch (err) {
      console.error(err);
      toast.error("Report generation failed.");
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleSaveReportEdit = async () => {
    if (!activeReportId) return;
    setSavingReportEdit(true);
    try {
      const res = await updateProgressReport(activeReportId, editedReportText);
      if (res.success) {
        setGeneratedReport(editedReportText);
        setIsEditingReport(false);
        toast.success("Report updated successfully!");
        fetchReports();
      } else {
        toast.error("Failed to update report.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update report.");
    } finally {
      setSavingReportEdit(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm("Are you sure you want to delete this progress report?")) return;
    try {
      const res = await deleteProgressReport(reportId);
      if (res.success) {
        toast.success("Meeting report deleted successfully.");
        fetchReports();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete report.");
    }
  };

  const handleDetectRisks = async () => {
    setDetectingRisk(true);
    try {
      const res = await detectDevelopmentalRisk(id);
      if (res.success) {
        setRiskAssessment(res.analysis);
        toast.success("Risk assessment completed.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Developmental analysis failed.");
    } finally {
      setDetectingRisk(false);
    }
  };

  const handlePrintPDF = () => {
    // Open a beautiful print dialog for progress report card
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>${student.name} - Progress Card</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              color: #0f172a;
              background-color: #ffffff;
              padding: 40px;
              line-height: 1.6;
            }
            .header {
              border-bottom: 3px double #e2e8f0;
              padding-bottom: 20px;
              margin-bottom: 30px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .title {
              font-size: 24px;
              font-weight: 800;
              color: #4f46e5;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .student-info {
              display: grid;
              grid-cols: 2;
              gap: 15px;
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 20px;
              margin-bottom: 30px;
            }
            .student-info-item {
              margin-bottom: 8px;
            }
            .section-title {
              font-size: 16px;
              font-weight: 700;
              color: #1e293b;
              border-bottom: 1.5px solid #4f46e5;
              padding-bottom: 6px;
              margin-top: 30px;
              margin-bottom: 15px;
              text-transform: uppercase;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 13px;
            }
            .table th, .table td {
              border: 1px solid #e2e8f0;
              padding: 10px;
              text-align: left;
            }
            .table th {
              background-color: #f1f5f9;
              font-weight: bold;
            }
            .report-box {
              background-color: #fdf4ff;
              border: 1px solid #f0abfc;
              border-radius: 12px;
              padding: 20px;
              font-size: 13px;
              line-height: 1.7;
              color: #581c87;
              margin-top: 15px;
            }
            .footer {
              margin-top: 60px;
              border-top: 1px solid #e2e8f0;
              padding-top: 20px;
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              color: #64748b;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">FirstCry Intellitots</div>
              <div style="font-size:12px;color:#64748b;">Official Child Development Progress Card</div>
            </div>
            <div style="text-align:right;">
              <div style="font-weight:bold;font-size:14px;">Date: ${new Date().toLocaleDateString()}</div>
              <div style="font-size:11px;color:#64748b;">Period: ${period}</div>
            </div>
          </div>

          <div class="student-info">
            <div style="display:flex; justify-content:space-between;">
              <div>
                <strong>Student Name:</strong> ${student.name}<br/>
                <strong>Classroom Assignment:</strong> ${student.classroom}<br/>
                <strong>Age Group:</strong> ${student.age} Years Old
              </div>
              <div style="text-align:right;">
                <strong>Primary Parent:</strong> ${student.parentName}<br/>
                <strong>Attendance Rate:</strong> ${attendanceRate}%<br/>
                <strong>Overall Growth Index:</strong> ${student.growth}/10
              </div>
            </div>
          </div>

          <div class="section-title">Developmental Observations Log</div>
          <table class="table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Achievement Score</th>
                <th>Teacher Diagnostic Notes</th>
              </tr>
            </thead>
            <tbody>
              ${
                student.milestones?.map(
                  (m) => `
                <tr>
                  <td><strong>${m.category}</strong></td>
                  <td>${m.score}/10</td>
                  <td>${m.notes || "N/A"}</td>
                </tr>
              `
                ).join("") || "<tr><td colspan='3'>No observation notes logged.</td></tr>"
              }
            </tbody>
          </table>

          <div class="section-title">Target Goal Milestones</div>
          <table class="table">
            <thead>
              <tr>
                <th>Goal Description</th>
                <th>Target Date</th>
                <th>Current Status</th>
              </tr>
            </thead>
            <tbody>
              ${
                goals?.map(
                  (g) => `
                <tr>
                  <td>${g.title}</td>
                  <td>${g.targetDate ? new Date(g.targetDate).toLocaleDateString() : "Flexible Target"}</td>
                  <td><strong>${g.status}</strong></td>
                </tr>
              `
                ).join("") || "<tr><td colspan='3'>No goals active.</td></tr>"
              }
            </tbody>
          </table>

          <div class="section-title">AI Parent-Teacher Meeting Summary</div>
          <div class="report-box">
            ${generatedReport || "No summary report has been compiled for this period yet."}
          </div>

          <div class="footer">
            <div>FirstCry Intellitots Preschool Management App</div>
            <div>Sign: ___________________________ (Lead Instructor)</div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!student) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin"></div>
        <p className="mt-4 text-slate-400 font-medium">Loading child profile...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-8 animate-fade-in max-w-6xl">
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-950/40 to-slate-900/30 border border-indigo-500/20 rounded-3xl p-6 md:p-8">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
              Child Portfolio Profile
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mt-2">
              {student.name}
            </h1>
            <p className="text-slate-350 text-xs mt-1.5 leading-relaxed">
              Enrolled Class: <span className="text-white font-bold">{student.classroom}</span> • Parent Name: <span className="text-white font-bold">{student.parentName}</span>
            </p>
          </div>

          <div className="flex bg-slate-950/80 border border-slate-800 p-1 rounded-xl scrollbar-none overflow-x-auto">
            {[
              { id: "portfolio", label: "📂 Portfolio" },
              { id: "timeline", label: "⏱️ Timeline" },
              { id: "journal", label: "📝 Daily Log" },
              { id: "goals", label: "🎯 Goals" },
              { id: "reports", label: "✨ AI Reports" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveProfileTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer ${
                  activeProfileTab === tab.id
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-650/30"
                    : "text-slate-450 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeProfileTab === "portfolio" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Details & AI Insights */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl">
              <h2 className="text-base font-bold text-white mb-4">Student Information</h2>
              <div className="grid grid-cols-2 gap-6 text-xs">
                <div className="space-y-1">
                  <p className="text-slate-500 font-medium">Age</p>
                  <p className="text-slate-200 font-bold text-sm">{student.age} years old</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500 font-medium">Classroom Assignment</p>
                  <p className="text-slate-200 font-bold text-sm">{student.classroom}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500 font-medium">Primary Parent</p>
                  <p className="text-slate-200 font-bold text-sm">{student.parentName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500 font-medium">Growth Index</p>
                  <p className="text-indigo-400 font-black text-sm">
                    {student.growth !== undefined && student.growth !== null ? student.growth : 0}/10
                  </p>
                </div>
              </div>

              <button
                onClick={handleGenerateAI}
                disabled={generatingAi}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl py-2.5 px-5 text-xs transition-all transform active:scale-[0.98] shadow-lg shadow-purple-500/20 cursor-pointer mt-6 disabled:opacity-50"
              >
                {generatingAi ? "Analyzing Portfolio..." : "✨ Generate AI Observations Suggestions"}
              </button>

              {aiSuggestion && (
                <div className="mt-4 p-4 bg-purple-950/40 border border-purple-800/40 rounded-2xl text-purple-200 text-xs leading-relaxed">
                  <h3 className="font-bold text-purple-300 mb-2.5 flex items-center gap-1.5">
                    <span>🤖</span> AI Suggestions Insight
                  </h3>
                  <p>{aiSuggestion}</p>
                </div>
              )}
            </div>

            {/* Developmental Milestone Observations List */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl">
              <h2 className="text-base font-bold text-white mb-4">Development Observations</h2>

              {!student.milestones || student.milestones.length === 0 ? (
                <p className="text-slate-500 text-xs italic py-4">No developmental observations recorded yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {student.milestones.map((m) => (
                    <div
                      key={m.id}
                      className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl text-xs space-y-2 text-slate-300 relative hover:border-slate-800 transition-all"
                    >
                      <div className="flex justify-between items-center border-b border-slate-850 pb-2 mb-2">
                        <span className="font-extrabold text-white">{m.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-400 font-black px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                            Score: {m.score}/10
                          </span>
                          <button
                            onClick={() => handleDeleteMilestone(m.id)}
                            className="text-slate-550 hover:text-rose-400 p-1.5 rounded-xl hover:bg-rose-500/10 transition-all cursor-pointer"
                            title="Delete Observation"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p className="leading-relaxed text-slate-400">{m.notes}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Milestone Logger Form */}
            <MilestoneForm studentId={student.id} onAdded={fetchStudent} />

            {/* Feedbacks Box */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl">
              <h2 className="text-base font-bold text-white mb-4">Parent Feedback</h2>
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {feedbacks.length === 0 ? (
                  <p className="text-slate-500 text-xs italic py-2">No feedback submitted yet.</p>
                ) : (
                  feedbacks.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl text-slate-300 text-xs leading-relaxed relative hover:border-slate-800 transition-all"
                    >
                      <div className="flex justify-between items-center mb-2.5 border-b border-slate-800/50 pb-1.5">
                        <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-slate-650 text-[10px]">💬 Parent</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed pr-2">{item.feedback}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeProfileTab === "timeline" && (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl max-w-4xl mx-auto">
          <h2 className="text-base font-bold text-white mb-6">Child Developmental Timeline Feed</h2>

          {loadingTimeline ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 rounded-full border-4 border-slate-850 border-t-indigo-500 animate-spin"></div>
              <p className="mt-2 text-slate-500 text-[10px]">Assembling historical feed...</p>
            </div>
          ) : timelineEvents.length === 0 ? (
            <p className="text-slate-500 text-xs italic py-8 text-center">No logs logged for this student yet.</p>
          ) : (
            <div className="relative border-l-2 border-slate-800 ml-4 space-y-6">
              {timelineEvents.map((evt) => (
                <div key={evt.id} className="relative pl-6">
                  {/* Dot Indicator */}
                  <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-slate-950 border-2 border-indigo-500"></div>

                  <div className="bg-slate-950/40 border border-slate-855 rounded-2xl p-4 hover:border-slate-800 transition-all max-w-2xl text-xs space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850 pb-2">
                      <div>
                        <h4 className="text-white font-bold">{evt.title}</h4>
                        <span className="text-[9px] text-slate-500 mt-0.5 block">
                          {evt.date.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border inline-block ${evt.color}`}>
                        {evt.badge}
                      </span>
                    </div>
                    <p className="text-slate-400 leading-relaxed whitespace-pre-wrap">{evt.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeProfileTab === "journal" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Observation Logger Form */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-white mb-4">Record Daily Journal Log</h2>

            <form onSubmit={handleAddJournal} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Development Category
                </label>
                <select
                  value={journalLearning}
                  onChange={(e) => setJournalLearning(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
                >
                  <option value="COGNITIVE">Cognitive & Mental Skills</option>
                  <option value="MOTOR">Motor & Hand Skills</option>
                  <option value="SPEECH">Speech & Language</option>
                  <option value="SOCIAL">Social Interaction</option>
                  <option value="EMOTIONAL">Emotional State</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Behavior Rating
                  </label>
                  <select
                    value={journalBehavior}
                    onChange={(e) => setJournalBehavior(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
                  >
                    <option value="COOPERATIVE">Cooperative</option>
                    <option value="QUIET">Quiet</option>
                    <option value="RESTLESS">Restless</option>
                    <option value="DISTRACTED">Distracted</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Emotional State
                  </label>
                  <select
                    value={journalEmotional}
                    onChange={(e) => setJournalEmotional(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
                  >
                    <option value="HAPPY">Happy</option>
                    <option value="CALM">Calm</option>
                    <option value="ANXIOUS">Anxious</option>
                    <option value="EXCITED">Excited</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    Journal Observation Notes *
                  </label>
                  <button
                    type="button"
                    onClick={handleSuggestJournalNotes}
                    disabled={generatingJournalNotes}
                    className="text-[9px] font-bold text-purple-400 hover:text-white flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded"
                  >
                    {generatingJournalNotes ? "Generating..." : "✨ Suggest with AI"}
                  </button>
                </div>
                <textarea
                  value={journalNotes}
                  onChange={(e) => setJournalNotes(e.target.value)}
                  placeholder="Describe activities, achievements, reactions, vocabulary additions..."
                  required
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-500 placeholder:text-slate-650"
                />
              </div>

              <button
                type="submit"
                disabled={savingJournal}
                className="w-full bg-indigo-650 hover:bg-indigo-750 text-white font-bold rounded-xl py-2 px-4 text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {savingJournal ? "Saving log..." : "💾 Save Daily Log"}
              </button>
            </form>
          </div>

          {/* Observations List & AI Summary */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-white">Daily Journal Notes Log</h2>
                <button
                  onClick={handleGenerateWeeklySummary}
                  disabled={generatingWeeklySummary}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold rounded-lg px-3 py-1.5 transition-all cursor-pointer"
                >
                  {generatingWeeklySummary ? "Analyzing with AI..." : "✨ Summarize Journal with AI"}
                </button>
              </div>

              {aiWeeklySummaryText && (
                <div className="mb-4 p-4 bg-purple-950/40 border border-purple-800/40 rounded-2xl text-purple-200 text-xs leading-relaxed">
                  <h3 className="font-bold text-purple-300 mb-1.5 flex items-center gap-1">
                    <span>🤖</span> AI Weekly Journal Insights
                  </h3>
                  <p>{aiWeeklySummaryText}</p>
                </div>
              )}

              {loadingObs ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="w-6 h-6 rounded-full border-4 border-slate-850 border-t-indigo-500 animate-spin"></div>
                </div>
              ) : observations.length === 0 ? (
                <p className="text-slate-500 text-xs italic py-4">No daily logs recorded yet.</p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {observations.map((obs) => (
                    <div
                      key={obs.id}
                      className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl text-xs space-y-2 text-slate-350 relative hover:border-slate-800 transition-all"
                    >
                      <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white">{obs.learning || "General"}</span>
                          <span className="text-[8px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-slate-500 uppercase font-mono">
                            {obs.behavior} • {obs.emotional}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-[10px]">
                            {new Date(obs.createdAt).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => handleDeleteObs(obs.id)}
                            className="text-slate-600 hover:text-red-400 p-1 hover:bg-slate-900 rounded-lg cursor-pointer"
                            title="Delete log"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{obs.notes}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeProfileTab === "goals" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Goal Creator */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-white mb-4">Set Learning Target Goal</h2>

            <form onSubmit={handleAddGoal} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Goal Title / Description *
                </label>
                <input
                  type="text"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="e.g. Master single-digit counting"
                  required
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-500 placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Target Completion Date
                </label>
                <input
                  type="date"
                  value={goalTargetDate}
                  onChange={(e) => setGoalTargetDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={savingGoal || !goalTitle.trim()}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-750 text-white font-bold rounded-xl py-2.5 px-4 text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {savingGoal ? "Setting goal..." : "🎯 Set Goal"}
              </button>
            </form>
          </div>

          {/* Active Goals Board */}
          <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-white mb-4">Target Goals Board</h2>

            {loadingGoals ? (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="w-6 h-6 rounded-full border-4 border-slate-850 border-t-indigo-500 animate-spin"></div>
              </div>
            ) : goals.length === 0 ? (
              <p className="text-slate-500 text-xs italic py-4">No developmental target goals set yet.</p>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {goals.map((g) => {
                  const isCompleted = g.status === "COMPLETED";
                  return (
                    <div
                      key={g.id}
                      className={`border p-4 rounded-2xl text-xs space-y-3 transition-all relative ${
                        isCompleted
                          ? "bg-slate-950/20 border-slate-855 opacity-60"
                          : "bg-slate-950/40 border-slate-850 hover:border-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleGoalComplete(g.id, g.status)}
                            className={`w-4 h-4 rounded-full border transition-all cursor-pointer flex items-center justify-center text-[10px] ${
                              isCompleted
                                ? "bg-emerald-500 border-emerald-500 text-white font-black"
                                : "border-slate-600 hover:border-indigo-500"
                            }`}
                          >
                            {isCompleted && "✓"}
                          </button>
                          <h4 className={`text-white text-xs font-bold ${isCompleted ? "line-through text-slate-500" : ""}`}>
                            {g.title}
                          </h4>
                        </div>
                        <button
                          onClick={() => handleDeleteGoal(g.id)}
                          className="text-slate-650 hover:text-red-400 transition-all cursor-pointer"
                          title="Delete goal"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-slate-500 font-medium">
                        <span>Target Date: {g.targetDate ? new Date(g.targetDate).toLocaleDateString() : "Flexible Target"}</span>
                        <span className={`font-bold ${isCompleted ? "text-emerald-400" : "text-amber-400"}`}>
                          {g.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeProfileTab === "reports" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Action Trigger Box */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white">AI Progress Reports & Diagnostics</h2>

            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                Report Term Period
              </label>
              <input
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="e.g. June 2026, Term 1"
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2 outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleGenerateReport}
              disabled={generatingReport}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-xl py-2.5 px-4 text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              {generatingReport ? "Creating Report..." : "✨ Generate Parent-Meeting Summary"}
            </button>

            <button
              onClick={handleDetectRisks}
              disabled={detectingRisk}
              className="w-full bg-red-950/20 hover:bg-red-500/10 border border-red-500/30 hover:border-red-500/50 disabled:opacity-50 text-red-400 font-bold rounded-xl py-2.5 px-4 text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              {detectingRisk ? "Analyzing..." : "⚠️ Run Developmental Risk Detection"}
            </button>

            <button
              onClick={handlePrintPDF}
              className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-850 text-indigo-400 hover:text-white font-bold rounded-xl py-2.5 px-4 text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              📥 Download Progress Card PDF
            </button>
          </div>

          {/* Report Display Box */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl min-h-[300px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-white">Progress Card Preview ({period})</h2>
                {generatedReport && activeReportId && (user?.role === "TEACHER" || user?.role === "ADMIN") && !isEditingReport && (
                  <button
                    onClick={() => {
                      setIsEditingReport(true);
                      setEditedReportText(generatedReport);
                    }}
                    className="px-3 py-1.5 bg-slate-950 border border-slate-800 text-indigo-400 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  >
                    ✏️ Edit Report
                  </button>
                )}
              </div>

              {generatedReport ? (
                isEditingReport ? (
                  <div className="space-y-4">
                    <textarea
                      value={editedReportText}
                      onChange={(e) => setEditedReportText(e.target.value)}
                      rows={12}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-2xl p-4 outline-none focus:border-indigo-500 font-mono leading-relaxed"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={handleSaveReportEdit}
                        disabled={savingReportEdit}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-750 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        {savingReportEdit ? "Saving..." : "💾 Save Changes"}
                      </button>
                      <button
                        onClick={() => setIsEditingReport(false)}
                        className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        ✕ Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-950/40 border border-slate-855 rounded-2xl text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">
                      {generatedReport}
                    </div>
                  </div>
                )
              ) : (
                <p className="text-slate-500 text-xs italic py-12 text-center">
                  No progress summary report compiled yet. Click "Generate Parent-Meeting Summary" to trigger AI analysis.
                </p>
              )}
            </div>

            {riskAssessment && (
              <div className="bg-slate-900/40 border border-red-500/30 rounded-3xl p-6 shadow-xl">
                <h3 className="text-base font-bold text-rose-450 mb-3 flex items-center gap-1.5">
                  <span>⚠️</span> Developmental Risk Assessment
                </h3>
                <div className="p-4 bg-red-950/15 border border-red-500/20 rounded-2xl text-red-300 text-xs leading-relaxed whitespace-pre-wrap">
                  {riskAssessment}
                </div>
              </div>
            )}

            {/* Saved Reports History */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white">Saved Progress Reports History</h2>
              {loadingReports ? (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : reports.length === 0 ? (
                <p className="text-slate-505 text-xs italic py-2">No saved reports history found.</p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {reports.map((rep) => (
                    <div key={rep.id} className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl text-xs flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">Period: {rep.period}</span>
                          <span className="text-[10px] text-slate-500">{new Date(rep.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-400 line-clamp-2 leading-relaxed">{rep.summary}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setPeriod(rep.period);
                            setGeneratedReport(rep.summary);
                            setActiveReportId(rep.id);
                            setIsEditingReport(false);
                            toast.success("Loaded report to preview!");
                          }}
                          className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 text-indigo-400 rounded-lg hover:text-white transition-all cursor-pointer"
                        >
                          👁️ Load
                        </button>
                        <button
                          onClick={() => handleDeleteReport(rep.id)}
                          className="px-2.5 py-1.5 bg-red-950/20 border border-red-500/20 text-red-450 rounded-lg hover:bg-red-500/10 hover:text-white transition-all cursor-pointer"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentProfile;