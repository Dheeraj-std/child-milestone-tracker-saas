import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { validateOnboardingCode } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";

const ParentOnboarding = () => {
  const { accessCode } = useParams();
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const [studentInfo, setStudentInfo] = useState(null);
  const [emailVerification, setEmailVerification] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkCode = async () => {
      try {
        const res = await validateOnboardingCode(accessCode);
        if (res.success && res.student) {
          setStudentInfo(res.student);
        } else {
          setError("Invalid parent access link. Please verify the code or request a new invite.");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Invalid or expired access link.");
      } finally {
        setLoading(false);
      }
    };
    checkCode();
  }, [accessCode]);

  const handleActivate = async (e) => {
    e.preventDefault();
    if (!emailVerification.trim()) return;

    setSubmitting(true);
    try {
      const data = await loginUser({
        email: emailVerification.toLowerCase().trim(),
        role: "PARENT",
        accessCode: accessCode.trim(),
      });

      if (data.success && data.user) {
        toast.success(`Onboarding Complete! Welcome, ${data.user.name}`);
        navigate("/parent/dashboard");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Email validation failed. Make sure it matches your registered school email.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-emerald-500 animate-spin"></div>
        <p className="mt-4 text-slate-400 font-medium">Loading school invitation details...</p>
      </div>
    );
  }

  if (error || !studentInfo) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-rose-500/20 rounded-3xl p-8 shadow-2xl text-center">
          <div className="inline-flex p-3 rounded-2xl bg-rose-500/10 text-rose-450 mb-4 border border-rose-500/20">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white">Invalid Access Link</h2>
          <p className="text-slate-400 text-xs mt-2 leading-relaxed">{error || "This invitation link is invalid or expired."}</p>
          <button
            onClick={() => navigate("/login")}
            className="mt-6 w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative preschool themed color blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>

      <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl z-10 transition-all hover:border-slate-700/50">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-indigo-500/10 text-emerald-400 mb-3 border border-emerald-500/20">
            <span className="text-2xl">🌱</span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 block mb-1">FirstCry Intellitots</span>
          <h1 className="text-xl font-black text-white tracking-tight">Parent Onboarding</h1>
          <p className="text-slate-400 text-xs mt-1">Activate your parent tracking profile</p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl mb-6 text-xs space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-slate-500 font-medium">Child Name</span>
            <span className="text-white font-bold">{studentInfo.name}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-slate-500 font-medium">Classroom</span>
            <span className="text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
              {studentInfo.classroom}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Invited Parent</span>
            <span className="text-white font-semibold">{studentInfo.parentName}</span>
          </div>
        </div>

        <form onSubmit={handleActivate} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-[10px] font-bold uppercase tracking-wider mb-2">
              Confirm Registered Parent Email
            </label>
            <input
              type="email"
              value={emailVerification}
              onChange={(e) => setEmailVerification(e.target.value)}
              placeholder="e.g. parent@tracker.com"
              required
              className="w-full bg-slate-950/60 border border-slate-800 text-slate-100 rounded-xl py-2.5 px-4 outline-none focus:border-emerald-500 transition-all text-xs placeholder:text-slate-500"
            />
            <p className="text-slate-500 text-[9px] mt-1.5 leading-relaxed">
              * Must match the parent email provided to the school during child registration.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting || !emailVerification}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl py-3 text-xs transition-all transform active:scale-[0.98] shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:pointer-events-none mt-2 flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? "Activating Session..." : "Verify & Open Dashboard"}
          </button>
        </form>

        <div className="text-center mt-6 pt-5 border-t border-slate-800/60">
          <button
            onClick={() => navigate("/login")}
            className="text-xs text-slate-400 hover:text-white font-bold transition-all cursor-pointer"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParentOnboarding;
