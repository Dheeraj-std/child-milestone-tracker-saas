import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useRef } from "react";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/studentService";
import { toast } from "react-hot-toast";

const Layout = ({ children }) => {
  const { user, logoutUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifs = async () => {
    if (!user) return;
    try {
      const res = await getNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifs();
    // Poll for notifications every 12 seconds
    const interval = setInterval(fetchNotifs, 12000);
    return () => clearInterval(interval);
  }, [user]);

  // Click outside notification dropdown to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await markAllNotificationsRead();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        toast.success("All notifications marked as read.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update notifications.");
    }
  };

  const handleMarkOneRead = async (id) => {
    try {
      const res = await markNotificationRead(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return <>{children}</>;

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Define sidebar links based on user role
  const getNavLinks = () => {
    const role = user.role;
    const links = [];

    // Dashboard Links
    if (role === "TEACHER") {
      links.push({
        path: "/teacher/dashboard",
        label: "Dashboard",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"></path>
          </svg>
        ),
      });
      links.push({
        path: "/teacher/students",
        label: "Manage Students",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
          </svg>
        ),
      });
    } else if (role === "PARENT") {
      links.push({
        path: "/parent/dashboard",
        label: "Child Dashboard",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
        ),
      });
    } else if (role === "ADMIN") {
      links.push({
        path: "/admin/dashboard",
        label: "Admin Controls",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
        ),
      });
    }

    // Shared Operations Pages
    if (role === "ADMIN" || role === "TEACHER") {
      links.push({
        path: "/classrooms",
        label: "Classrooms Directory",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
        ),
      });
    }

    // Attendance (Everyone gets customized view)
    links.push({
      path: "/attendance",
      label: "Attendance Registry",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
        </svg>
      ),
    });

    // Gallery (Everyone gets customized view)
    links.push({
      path: "/gallery",
      label: "Memories Gallery",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
      ),
    });

    // Events (Everyone gets customized view)
    links.push({
      path: "/events",
      label: "Scheduled Activities",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
      ),
    });

    // Messaging (Everyone gets customized view)
    links.push({
      path: "/messaging",
      label: "Messages Hub",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
        </svg>
      ),
    });

    // Audit logs (Admin only)
    if (role === "ADMIN") {
      links.push({
        path: "/admin/audit-logs",
        label: "System Audit Logs",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
          </svg>
        ),
      });
    }

    return links;
  };

  const navLinks = getNavLinks();

  const getRoleColor = (role) => {
    switch (role) {
      case "ADMIN":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "TEACHER":
        return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
      case "PARENT":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row relative">
      {/* Mobile Top Navigation Header */}
      <header className="md:hidden w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 py-4 px-6 flex justify-between items-center z-30 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-sm">
            M
          </div>
          <span className="font-extrabold text-white text-sm tracking-tight">MilestoneTracker</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Notification Bell (Mobile) */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="text-slate-350 hover:text-white p-1 rounded-xl hover:bg-slate-800/60 transition-all cursor-pointer relative"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded-full flex items-center justify-center shadow-md animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown (Mobile version inside header) */}
            {notifOpen && (
              <div className="absolute right-0 mt-3 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-fade-in text-xs">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <h4 className="font-bold text-white">Notifications</h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] text-indigo-400 font-bold hover:text-white cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-slate-500 text-[10px] italic text-center py-4">No notifications logged.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleMarkOneRead(n.id)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          n.read
                            ? "bg-slate-950/20 border-slate-850 opacity-60"
                            : "bg-indigo-950/20 border-indigo-500/20 hover:border-indigo-500/40"
                        }`}
                      >
                        <h5 className="font-bold text-white text-[11px]">{n.title}</h5>
                        <p className="text-slate-400 text-[10px] mt-0.5 leading-relaxed">{n.message}</p>
                        <span className="block text-[8px] text-slate-500 mt-1 font-mono">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-slate-300 hover:text-white p-1 outline-none"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Sidebar - Desktop Layout and Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 transform ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:sticky md:flex flex-col w-64 bg-slate-900/60 backdrop-blur-xl border-r border-slate-900/80 p-6 z-20 transition-transform duration-300 ease-in-out shrink-0 h-screen justify-between`}
      >
        <div className="space-y-8 overflow-y-auto max-h-[80vh] pr-1">
          {/* Logo */}
          <div className="hidden md:flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-indigo-500/20">
              I
            </div>
            <div>
              <span className="font-extrabold text-white text-md tracking-tight block leading-none">Intellitots</span>
              <span className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mt-1.5 block">FirstCry Preschool</span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest pl-3 mb-2">Navigation</p>
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 py-2.5 px-3.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-500/20 to-purple-600/10 text-white border-l-4 border-indigo-500"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  <span className={`${isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"}`}>
                    {link.icon}
                  </span>
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="pt-4 border-t border-slate-800/60 space-y-4">
          {/* Desktop Notification Bell and User Info */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-indigo-400 shadow-inner shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <h4 className="text-white text-xs font-bold truncate leading-none">{user.name}</h4>
                <span className={`inline-block text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mt-1.5 ${getRoleColor(user.role)}`}>
                  {user.role}
                </span>
              </div>
            </div>

            {/* Notification Bell Icon (Desktop) */}
            <div className="relative hidden md:block" ref={dropdownRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="text-slate-450 hover:text-white p-2 rounded-xl hover:bg-slate-800/60 border border-slate-850 transition-all cursor-pointer relative"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-tr from-purple-500 to-indigo-650 text-white font-extrabold text-[8px] w-4 h-4 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown (Desktop version) */}
              {notifOpen && (
                <div className="absolute right-0 bottom-12 mb-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-fade-in text-xs">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                    <h4 className="font-bold text-white">Notifications</h4>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] text-indigo-450 font-bold hover:text-white cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-slate-500 text-[10px] italic text-center py-4">No notifications logged.</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleMarkOneRead(n.id)}
                          className={`p-2 rounded-xl border transition-all text-left cursor-pointer ${
                            n.read
                              ? "bg-slate-950/20 border-slate-855 opacity-60"
                              : "bg-indigo-950/25 border-indigo-500/25 hover:border-indigo-500/40"
                          }`}
                        >
                          <h5 className="font-bold text-white text-[10px]">{n.title}</h5>
                          <p className="text-slate-400 text-[9px] mt-0.5 leading-relaxed">{n.message}</p>
                          <span className="block text-[8px] text-slate-550 mt-1 font-mono">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-950/40 border border-slate-800 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 text-slate-400 transition-all transform active:scale-[0.98] cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 min-h-0 bg-slate-950 p-4 md:p-8 overflow-y-auto z-10">
        <div className="max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
