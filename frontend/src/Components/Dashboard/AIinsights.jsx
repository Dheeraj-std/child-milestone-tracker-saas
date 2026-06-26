import { useState } from "react";
import api from "../../services/api";
import { toast } from "react-hot-toast";

function AIInsights({ students = [] }) {
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const generateSummary = async () => {
    if (!selectedStudentId) {
      toast.error("Please select a student first.");
      return;
    }

    setLoading(true);
    const targetStudent = students.find((s) => s.id === selectedStudentId);

    try {
      const response = await api.post("/ai/suggestions", {
        student: targetStudent,
      });

      if (response.data.success) {
        setSummary(response.data.suggestion);
        toast.success("AI Insights generated successfully!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate AI insights.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span>🤖</span> AI Insights
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedStudentId}
            onChange={(e) => {
              setSelectedStudentId(e.target.value);
              setSummary("");
            }}
            className="bg-slate-950/60 border border-slate-800 text-white rounded-xl py-2 px-4 outline-none focus:border-indigo-500 transition-all text-xs"
          >
            <option value="">-- Select Student --</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>

          <button
            onClick={generateSummary}
            disabled={loading || !selectedStudentId}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl py-2 px-4 text-xs transition-all transform active:scale-[0.98] shadow-lg shadow-purple-500/20 cursor-pointer disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      {summary && (
        <div className="mt-4 p-4 bg-slate-950/60 border border-slate-800/60 rounded-xl text-slate-300 text-xs leading-relaxed animate-fade-in">
          {summary}
        </div>
      )}
    </div>
  );
}

export default AIInsights;