import { useState } from "react";
import api from "../../services/api";
import { toast } from "react-hot-toast";

function ParentFeedback({ studentId, onFeedbackAdded }) {
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) {
      toast.error("Feedback notes cannot be empty.");
      return;
    }
    setLoading(true);

    try {
      await api.post("/parent-feedback", {
        feedback,
        studentId,
      });

      toast.success("Feedback submitted successfully!");
      setFeedback("");
      if (onFeedbackAdded) {
        onFeedbackAdded();
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit feedback.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-4">
      <div>
        <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
          New Feedback Note
        </label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="e.g. Liam has been practicing his spelling words at home and is making great progress."
          className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-indigo-500 transition-all text-xs placeholder:text-slate-605 resize-none"
          rows="3"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading || !feedback.trim()}
        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl py-2 px-4 text-xs transition-all transform active:scale-[0.98] shadow-lg shadow-indigo-500/20 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
      >
        {loading ? "Submitting..." : "Submit Feedback"}
      </button>
    </form>
  );
}

export default ParentFeedback;