import { Link } from "react-router-dom";

const Signup = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative preschool themed color blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse duration-5000"></div>

      <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl z-10 text-center transition-all hover:border-slate-700/50">
        <div className="inline-flex p-3 rounded-2xl bg-rose-500/10 text-rose-450 mb-5 border border-rose-500/20">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
          </svg>
        </div>

        <h1 className="text-xl font-extrabold text-white tracking-tight">Registration Managed</h1>
        <p className="text-slate-400 text-xs mt-1.5 leading-relaxed max-w-xs mx-auto">
          IntelliTots accounts cannot be created publicly. All accounts must be provisioned securely by school administrators.
        </p>

        <div className="mt-6 space-y-3 text-left">
          <div className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-2xl flex gap-3 items-start">
            <span className="text-sm shrink-0 mt-0.5">🧒</span>
            <div>
              <h4 className="text-xs font-bold text-white leading-tight">For Parents</h4>
              <p className="text-slate-400 text-[10px] mt-1 leading-normal">
                Use your child's access code and your registered email on the login page, or follow the custom invitation link shared by your teacher.
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-2xl flex gap-3 items-start">
            <span className="text-sm shrink-0 mt-0.5">💼</span>
            <div>
              <h4 className="text-xs font-bold text-white leading-tight">For Staff & Educators</h4>
              <p className="text-slate-400 text-[10px] mt-1 leading-normal">
                Educator and teaching accounts are seeded and managed by administrators. Please contact the administrative department for your credentials.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-slate-800/60">
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-1.5 w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-650 hover:to-purple-750 text-white font-bold rounded-xl py-3 text-xs transition-all transform active:scale-[0.98] shadow-lg shadow-indigo-500/20"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
