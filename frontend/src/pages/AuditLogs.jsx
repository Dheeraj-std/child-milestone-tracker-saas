import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getAuditLogs } from "../services/studentService";
import { toast } from "react-hot-toast";

const AuditLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await getAuditLogs();
      if (res.success) {
        setLogs(res.logs || []);
        setFilteredLogs(res.logs || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load system activity logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.role === "ADMIN") {
      loadLogs();
    }
  }, [user]);

  // Apply filters
  useEffect(() => {
    let result = [...logs];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (l) =>
          l.details?.toLowerCase().includes(term) ||
          l.user?.name?.toLowerCase().includes(term) ||
          l.user?.email?.toLowerCase().includes(term)
      );
    }

    if (actionFilter) {
      result = result.filter((l) => l.action === actionFilter);
    }

    if (roleFilter) {
      result = result.filter((l) => l.user?.role === roleFilter);
    }

    setFilteredLogs(result);
  }, [searchTerm, actionFilter, roleFilter, logs]);

  const getActionColor = (action) => {
    if (action.includes("CREATE")) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (action.includes("DELETE")) return "text-rose-400 bg-rose-500/10 border-rose-500/20";
    if (action.includes("UPDATE")) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    if (action.includes("LOGIN")) return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    return "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "ADMIN":
        return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      case "TEACHER":
        return "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
      case "PARENT":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      default:
        return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    }
  };

  // Extract unique actions for filter list
  const uniqueActions = Array.from(new Set(logs.map((l) => l.action)));

  if (user.role !== "ADMIN") {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center">
        <span className="text-3xl">🛡️</span>
        <h3 className="text-white font-bold text-base mt-2">Access Denied</h3>
        <p className="text-xs text-slate-500 mt-1">This page is reserved for system administrators only.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-rose-500 animate-spin"></div>
        <p className="mt-4 text-slate-400 font-medium">Opening security audit logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl">
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-rose-950/40 to-indigo-950/30 border border-rose-500/20 rounded-3xl p-6 md:p-8">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-rose-500/10 rounded-full blur-2xl"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
              Security & Operations Compliance
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mt-2">
              System Audit Logs
            </h1>
            <p className="text-slate-300 text-xs mt-1.5 leading-relaxed max-w-xl">
              Inspect developer and teacher actions, record creation events, modifications, and credential updates for administrative safety compliance.
            </p>
          </div>
          <button
            onClick={loadLogs}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
          >
            🔄 Refresh Records
          </button>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Search Audit</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search details or user..."
            className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-1.5 outline-none focus:border-rose-500 placeholder:text-slate-600"
          />
        </div>

        <div>
          <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Filter by Action</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-1.5 outline-none focus:border-rose-500"
          >
            <option value="">-- All Actions --</option>
            {uniqueActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Filter by Role</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-1.5 outline-none focus:border-rose-500"
          >
            <option value="">-- All Roles --</option>
            <option value="ADMIN">ADMIN</option>
            <option value="TEACHER">TEACHER</option>
            <option value="PARENT">PARENT</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl">
        <h2 className="text-base font-bold text-white mb-4">Activity Audit Stream</h2>

        {filteredLogs.length === 0 ? (
          <p className="text-slate-500 text-xs italic py-8 text-center">No logs match your filter queries.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-850 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 pr-4">Timestamp</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 pl-4 text-right">Context</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-850 hover:bg-slate-950/20 transition-all">
                    <td className="py-4 pr-4 font-mono text-[10px] text-slate-500 leading-tight">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-4">
                      {log.user ? (
                        <>
                          <span className="font-bold text-white block">{log.user.name}</span>
                          <span className={`inline-block text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md border mt-0.5 ${getRoleColor(log.user.role)}`}>
                            {log.user.role}
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-550 italic text-[10px]">Anonymous / System</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-block text-[8px] font-mono font-bold uppercase px-2 py-1 rounded-md border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-250 leading-relaxed max-w-sm">
                      {log.details}
                    </td>
                    <td className="py-4 pl-4 text-right text-[10px] font-mono text-slate-600 leading-tight">
                      IP: {log.ipAddress || "local"}<br />
                      <span className="text-[8px] text-slate-700 truncate block max-w-[120px] ml-auto" title={log.userAgent}>
                        {log.userAgent || "N/A"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
