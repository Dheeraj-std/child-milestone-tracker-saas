import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getEvents, createEvent, submitRSVP, deleteEvent } from "../services/studentService";
import { toast } from "react-hot-toast";

const EventsPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    imageUrl: "",
  });

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await getEvents();
      if (res.success) {
        setEvents(res.events || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load school events calendar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [user]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date) {
      toast.error("Title and Date are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await createEvent(formData);
      if (res.success) {
        toast.success("School event successfully scheduled!");
        setFormData({
          title: "",
          description: "",
          date: "",
          location: "",
          imageUrl: "",
        });
        loadEvents();
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to create event.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRSVP = async (eventId, status) => {
    try {
      const res = await submitRSVP(eventId, status);
      if (res.success) {
        toast.success(`RSVP status updated to ${status}!`);
        // Refresh events to show updated RSVP list/status
        loadEvents();
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit RSVP.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      const res = await deleteEvent(id);
      if (res.success) {
        toast.success("Event deleted.");
        setEvents((prev) => prev.filter((e) => e.id !== id));
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete event.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin"></div>
        <p className="mt-4 text-slate-400 font-medium">Opening event calendar...</p>
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
            Events & Activities
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-2">
            School Calendar
          </h1>
          <p className="text-slate-300 text-xs mt-1.5 leading-relaxed max-w-xl">
            {user.role === "PARENT"
              ? "View upcoming school activities, check details, and RSVP directly."
              : "Create school calendars, schedule student activities, and track parental RSVPs."}
          </p>
        </div>
      </div>

      {(user.role === "TEACHER" || user.role === "ADMIN") && (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl max-w-xl">
          <h2 className="text-base font-bold text-white mb-4">Create New Activity / Event</h2>
          
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                  Event Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Summer Art Festival"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-indigo-500 transition-all text-xs placeholder:text-slate-650"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                  Event Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-indigo-500 transition-all text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Intellitots Hall A"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-indigo-500 transition-all text-xs placeholder:text-slate-650"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                  Banner Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="e.g. https://images.unsplash.com/... (art)"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-indigo-500 transition-all text-xs placeholder:text-slate-650"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                Event Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the activity, art guidelines, or schedule details..."
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-indigo-500 transition-all text-xs placeholder:text-slate-650 resize-none"
                rows="3"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold rounded-xl py-2.5 px-6 text-xs transition-all transform active:scale-[0.98] shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {submitting ? "Scheduling..." : "📅 Schedule Event"}
            </button>
          </form>
        </div>
      )}

      {/* Events Listing Cards */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-white">Upcoming Activities Calendar</h2>
        
        {events.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/20 border border-slate-850 rounded-3xl">
            <span className="text-3xl block">📆</span>
            <p className="text-slate-500 text-xs mt-3 italic">No activities currently scheduled.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((e) => {
              // Find parent's own RSVP if role is PARENT
              const parentRsvp = e.rsvps?.find((r) => r.parentId === user.id);
              const yesCount = e.rsvps?.filter((r) => r.status === "YES").length || 0;
              const maybeCount = e.rsvps?.filter((r) => r.status === "MAYBE").length || 0;
              const noCount = e.rsvps?.filter((r) => r.status === "NO").length || 0;

              return (
                <div
                  key={e.id}
                  className="bg-slate-900/40 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl hover:border-slate-750 transition-all flex flex-col justify-between group"
                >
                  <div className="relative aspect-video">
                    <img
                      src={e.imageUrl || "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=500&q=80"}
                      alt={e.title}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Delete button for Admin/Author */}
                    {(user.role === "ADMIN" || (user.role === "TEACHER" && e.createdById === user.id)) && (
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="absolute top-3 right-3 p-1.5 rounded-lg bg-rose-950/80 text-rose-400 border border-rose-900/40 hover:bg-rose-900 transition-colors cursor-pointer"
                        title="Delete event"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-extrabold text-white text-base leading-snug">{e.title}</h3>
                        <span className="text-[10px] text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-md font-bold">
                          {new Date(e.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      
                      <div className="flex flex-col gap-1 text-[10px] text-slate-500 mt-2">
                        <span className="flex items-center gap-1">📍 {e.location || "Preschool Campus"}</span>
                        <span className="flex items-center gap-1">⏰ {new Date(e.date).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>

                      {e.description && (
                        <p className="text-slate-400 text-xs leading-relaxed mt-3 border-t border-slate-850/60 pt-3">
                          {e.description}
                        </p>
                      )}
                    </div>

                    <div className="border-t border-slate-850/60 pt-4 flex flex-col gap-3">
                      {/* Stats view for Teacher/Admin */}
                      {(user.role === "TEACHER" || user.role === "ADMIN") && (
                        <div className="flex gap-4 text-[10px]">
                          <span className="text-emerald-400 font-bold">✓ Attending: {yesCount}</span>
                          <span className="text-amber-400 font-bold">? Maybe: {maybeCount}</span>
                          <span className="text-rose-400 font-bold">✗ No: {noCount}</span>
                        </div>
                      )}

                      {/* RSVP controls for Parent */}
                      {user.role === "PARENT" && (
                        <div className="space-y-2">
                          <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Will you attend?</span>
                          <div className="grid grid-cols-3 gap-2">
                            {["YES", "MAYBE", "NO"].map((status) => {
                              const isSelected = parentRsvp?.status === status;
                              const btnColors = {
                                YES: "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30",
                                MAYBE: "bg-amber-600/20 text-amber-400 border border-amber-500/30",
                                NO: "bg-rose-600/20 text-rose-400 border border-rose-500/30",
                              };
                              return (
                                <button
                                  key={status}
                                  onClick={() => handleRSVP(e.id, status)}
                                  className={`py-1.5 text-[10px] font-bold rounded-xl border transition-all cursor-pointer ${
                                    isSelected
                                      ? btnColors[status]
                                      : "border-slate-850 bg-slate-950/40 hover:border-slate-800 text-slate-400 hover:text-white"
                                  }`}
                                >
                                  {status.replace("YES", "Attending").replace("MAYBE", "Maybe").replace("NO", "Declined")}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
