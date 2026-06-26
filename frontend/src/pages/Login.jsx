import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import { forgotPassword, resetPassword } from "../services/authService";

const Login = () => {
  const [activeTab, setActiveTab] = useState("STAFF"); // STAFF or PARENT
  
  // Staff inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Parent inputs
  const [parentEmail, setParentEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Forgot Password Wizard States
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let payload = {};
      if (activeTab === "PARENT") {
        payload = {
          email: parentEmail,
          role: "PARENT",
          accessCode,
        };
      } else {
        payload = {
          email,
          password,
        };
      }

      const data = await loginUser(payload);
      if (data.success && data.user) {
        toast.success(`Welcome back, ${data.user.name}!`);
        if (data.user.role === "TEACHER") {
          navigate("/teacher/dashboard");
        } else if (data.user.role === "PARENT") {
          navigate("/parent/dashboard");
        } else if (data.user.role === "ADMIN") {
          navigate("/admin/dashboard");
        } else {
          navigate("/");
        }
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || "Authentication failed. Please check credentials.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password wizard functions
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetLoading(true);
    try {
      const data = await forgotPassword(resetEmail);
      if (data.success) {
        toast.success(`Verification code sent to ${resetEmail}!`);
        if (data.otp) {
          // Dev helper alert
          toast(`[Demo Mode] OTP Code: ${data.otp}`, {
            icon: "🔑",
            duration: 10000,
          });
        }
        setResetStep(2);
      }
    } catch (err) {
      console.error(err);
      setResetError(err.response?.data?.message || "User not found or connection error.");
      toast.error("Failed to request code.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (!resetOtp || resetOtp.trim().length !== 6) {
      setResetError("Please enter a valid 6-digit verification code.");
      return;
    }
    setResetError("");
    setResetStep(3);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError("");
    if (newPassword !== confirmPassword) {
      setResetError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setResetError("Password must be at least 6 characters.");
      return;
    }
    setResetLoading(true);
    try {
      const data = await resetPassword(resetEmail, resetOtp, newPassword);
      if (data.success) {
        toast.success("Password reset successfully!");
        setForgotModalOpen(false);
        // Autofill log in email with reset email
        setEmail(resetEmail);
        setPassword("");
        // Reset state
        setResetStep(1);
        setResetEmail("");
        setResetOtp("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      console.error(err);
      setResetError(err.response?.data?.message || "Verification code is invalid or expired.");
      toast.error("Reset password failed.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleCloseForgotModal = () => {
    setForgotModalOpen(false);
    setResetStep(1);
    setResetEmail("");
    setResetOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setResetError("");
  };

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Decorative preschool themed color blobs (Glass Background) */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl animate-pulse duration-[8000ms]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse duration-[10000ms]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-650/10 rounded-full blur-3xl animate-pulse duration-[12000ms]"></div>

      {/* Main Card (Glassmorphic Frame) */}
      <div className="w-full max-w-md bg-slate-900/35 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] z-10 transition-all duration-300 hover:border-white/15">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-indigo-500/10 to-emerald-500/5 text-indigo-400 mb-3.5 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
          </div>
          <span className="text-[10px] uppercase font-extrabold tracking-widest text-emerald-400 block mb-1">Intellitots Preschool</span>
          <h1 className="text-2xl font-black text-white tracking-tight">Milestone Tracker</h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">Growth monitoring portal</p>
        </div>

        {/* Tab Toggle Switch (Glass styling) */}
        <div className="grid grid-cols-2 p-1 bg-slate-950/65 border border-white/5 backdrop-blur-md rounded-2xl mb-6 shadow-inner">
          <button
            onClick={() => { setActiveTab("STAFF"); setError(""); }}
            className={`py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
              activeTab === "STAFF"
                ? "bg-white/10 border border-white/10 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Staff Portal
          </button>
          <button
            onClick={() => { setActiveTab("PARENT"); setError(""); }}
            className={`py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
              activeTab === "PARENT"
                ? "bg-white/10 border border-white/10 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Parent Portal
          </button>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl p-4 text-xs mb-5 flex items-start gap-3 animate-[shake_0.2s_ease-in-out_2]">
            <svg className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === "STAFF" ? (
            <>
              {/* Staff Form */}
              <div>
                <label className="block text-slate-300 text-[10px] font-extrabold uppercase tracking-widest mb-2">Staff Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teacher@intellitots.com"
                  required
                  className="w-full bg-slate-950/45 border border-white/10 text-slate-100 rounded-xl py-3 px-4 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-xs placeholder:text-slate-500 backdrop-blur-sm shadow-inner"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-[10px] font-extrabold uppercase tracking-widest mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-slate-950/45 border border-white/10 text-slate-100 rounded-xl py-3 pl-4 pr-12 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-xs placeholder:text-slate-500 backdrop-blur-sm shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white focus:outline-none p-1 rounded-lg"
                  >
                    {showPassword ? (
                      /* Eye Slash Icon */
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      /* Eye Icon */
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-slate-400 hover:text-white transition-colors text-[11px] font-semibold cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-650 hover:from-indigo-500 hover:to-purple-550 text-white font-extrabold rounded-xl py-3.5 text-xs transition-all transform active:scale-[0.98] shadow-lg shadow-indigo-650/20 disabled:opacity-50 disabled:pointer-events-none mt-2 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? "Verifying..." : "Staff Sign In"}
              </button>
            </>
          ) : (
            <>
              {/* Parent Login Experience */}
              <div className="text-center py-1">
                <h3 className="text-sm font-extrabold text-slate-200">Access Your Child's Growth Journey</h3>
                <p className="text-slate-400 text-[11px] mt-1 font-medium">Verify your child's access details to proceed</p>
              </div>

              <div>
                <label className="block text-slate-300 text-[10px] font-extrabold uppercase tracking-widest mb-2">Registered Parent Email</label>
                <input
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  placeholder="parent@tracker.com"
                  required
                  className="w-full bg-slate-950/45 border border-white/10 text-slate-100 rounded-xl py-3 px-4 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-xs placeholder:text-slate-500 backdrop-blur-sm shadow-inner"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-[10px] font-extrabold uppercase tracking-widest mb-2">Child Access Code</label>
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="e.g. AAP-7821"
                  required
                  className="w-full bg-slate-950/45 border border-white/10 text-slate-100 rounded-xl py-3 px-4 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-xs placeholder:text-slate-500 backdrop-blur-sm shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-550 text-white font-extrabold rounded-xl py-3.5 text-xs transition-all transform active:scale-[0.98] shadow-lg shadow-emerald-650/20 disabled:opacity-50 disabled:pointer-events-none mt-2 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? "Authenticating..." : "Access Portfolio"}
              </button>
            </>
          )}
        </form>
      </div>

      {/* Forgot Password Modal (OTP Verification Flow) */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900/95 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative backdrop-blur-md">
            
            {/* Close Button */}
            <button
              onClick={handleCloseForgotModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-full bg-indigo-500/10 text-indigo-400 mb-3 border border-indigo-500/20 shadow-inner">
                {resetStep === 1 && (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )}
                {resetStep === 2 && (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
                {resetStep === 3 && (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                )}
              </div>
              <h3 className="text-sm font-extrabold text-white">
                {resetStep === 1 && "Forgot Password?"}
                {resetStep === 2 && "Enter Verification Code"}
                {resetStep === 3 && "Reset Your Password"}
              </h3>
              <p className="text-slate-400 text-[10px] mt-1">
                {resetStep === 1 && "We will send an OTP to your email address"}
                {resetStep === 2 && `We sent a 6-digit OTP code to your inbox`}
                {resetStep === 3 && "Set your new account password"}
              </p>
            </div>

            {/* Error message card */}
            {resetError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl p-4 text-xs mb-5 flex items-start gap-2.5">
                <svg className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{resetError}</span>
              </div>
            )}

            {/* Step 1: Input Email Form */}
            {resetStep === 1 && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-[10px] font-extrabold uppercase tracking-widest mb-2">Registered Email Address</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="e.g. teacher@tracker.com"
                    required
                    className="w-full bg-slate-950/45 border border-white/10 text-slate-100 rounded-xl py-3 px-4 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-xs placeholder:text-slate-500 backdrop-blur-sm shadow-inner"
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-650 hover:from-indigo-500 hover:to-purple-550 text-white font-extrabold rounded-xl py-3 text-xs transition-all active:scale-[0.98] mt-3 cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {resetLoading ? "Requesting OTP..." : "Send OTP Verification"}
                </button>
              </form>
            )}

            {/* Step 2: Verification Code Input Form */}
            {resetStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-[10px] font-extrabold uppercase tracking-widest mb-2">6-Digit Verification Code</label>
                  <input
                    type="text"
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Enter code"
                    required
                    className="w-full text-center bg-slate-950/45 border border-white/10 text-slate-100 rounded-xl py-3 px-4 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-extrabold tracking-widest placeholder:text-slate-500 placeholder:tracking-normal backdrop-blur-sm shadow-inner"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-650 hover:from-indigo-500 hover:to-purple-550 text-white font-extrabold rounded-xl py-3 text-xs transition-all active:scale-[0.98] mt-3 cursor-pointer shadow-md"
                >
                  Verify Verification Code
                </button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    className="text-[11px] text-slate-450 hover:text-white transition-colors"
                  >
                    Change Email Address
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Enter New Password Form */}
            {resetStep === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-[10px] font-extrabold uppercase tracking-widest mb-2">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-slate-950/45 border border-white/10 text-slate-100 rounded-xl py-3 px-4 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-xs placeholder:text-slate-500 backdrop-blur-sm shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-[10px] font-extrabold uppercase tracking-widest mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-slate-950/45 border border-white/10 text-slate-100 rounded-xl py-3 px-4 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-xs placeholder:text-slate-500 backdrop-blur-sm shadow-inner"
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-650 hover:from-indigo-500 hover:to-purple-550 text-white font-extrabold rounded-xl py-3 text-xs transition-all active:scale-[0.98] mt-3 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {resetLoading ? "Updating Password..." : "Save New Password"}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default Login;
