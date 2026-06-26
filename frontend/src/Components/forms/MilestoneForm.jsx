import { useState, useEffect } from "react";
import { createMilestone, generateAiNotes } from "../../services/studentService";
import { toast } from "react-hot-toast";

const CATEGORIES = [
  "Speech",
  "Motor Skills",
  "Social Skills",
  "Creativity",
  "Attention Span",
  "Reading",
  "Classroom Participation",
];

function MilestoneForm({ studentId, onAdded, students, onMilestoneAdded }) {
  const [selectedStudentId, setSelectedStudentId] = useState(
    studentId || (students && students.length > 0 ? students[0].id : "")
  );
  const [formData, setFormData] = useState({
    category: CATEGORIES[0],
    score: "8",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const handleGenerateAiNotes = async () => {
    const targetStudentId = studentId || selectedStudentId;
    if (!targetStudentId) {
      toast.error("Please select a student first.");
      return;
    }
    setAiLoading(true);
    try {
      const data = await generateAiNotes(formData.category, formData.score, targetStudentId);
      setFormData({
        ...formData,
        notes: data.notes,
      });
      toast.success("AI notes generated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate AI notes.");
    } finally {
      setAiLoading(false);
    }
  };

  // Keep selected student synced when prop updates
  useEffect(() => {
    if (studentId) {
      setSelectedStudentId(studentId);
    }
  }, [studentId]);

  useEffect(() => {
    if (!studentId && students && students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, studentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const targetStudentId = studentId || selectedStudentId;

    if (!targetStudentId) {
      toast.error("Please select a student.");
      setLoading(false);
      return;
    }

    try {
      await createMilestone({
        ...formData,
        studentId: targetStudentId,
      });

      toast.success(`${formData.category} observation logged!`);

      setFormData({
        category: CATEGORIES[0],
        score: "8",
        notes: "",
      });

      if (onAdded) onAdded();
      if (onMilestoneAdded) onMilestoneAdded();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to log observation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl mb-8 max-w-xl">
      <h3 className="text-base font-bold text-white mb-4">Milestones</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Render student selector if list is passed and we are on general dashboard */}
        {students && !studentId && (
          <div>
            <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              Select Student
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-indigo-500 transition-all text-xs cursor-pointer"
            >
              <option value="" disabled>Select student...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              Skill Domain Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-indigo-500 transition-all text-xs cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              Performance Score (1-10)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              placeholder="e.g. 8"
              value={formData.score}
              onChange={(e) => setFormData({ ...formData, score: e.target.value })}
              className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-indigo-500 transition-all text-xs placeholder:text-slate-600"
              required
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              Observation Notes
            </label>
            <button
              type="button"
              onClick={handleGenerateAiNotes}
              disabled={aiLoading || (!studentId && !selectedStudentId)}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              title="Generate observation notes using AI based on Category and Score"
            >
              {aiLoading ? "Generating..." : "✨ Suggest with AI"}
            </button>
          </div>
          <textarea
            placeholder="e.g. Liam showed great focus today during story reading, correctly identifying 5 different sight words."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-indigo-500 transition-all text-xs placeholder:text-slate-600 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading || (!studentId && !selectedStudentId)}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl py-2.5 px-6 text-xs transition-all transform active:scale-[0.98] shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          {loading ? "Saving..." : "Record Milestone"}
        </button>
      </form>
    </div>
  );
}

export default MilestoneForm;