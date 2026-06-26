import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getStudents, uploadMedia, getGallery, deleteMedia } from "../services/studentService";
import { toast } from "react-hot-toast";

const Gallery = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [galleryItems, setGalleryItems] = useState([]);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    studentId: "",
    url: "",
    caption: "",
    category: "Activity",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const galleryRes = await getGallery();
      if (galleryRes.success) {
        setGalleryItems(galleryRes.gallery || []);
      }

      if (user.role === "TEACHER" || user.role === "ADMIN") {
        const studentRes = await getStudents();
        setStudents(studentRes.students || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load media memory gallery.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!formData.url.trim() || !formData.category) {
      toast.error("URL and Category are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await uploadMedia(formData);
      if (res.success) {
        toast.success("Memory successfully shared in student gallery!");
        setFormData({
          studentId: "",
          url: "",
          caption: "",
          category: "Activity",
        });
        // Reload gallery
        const galleryRes = await getGallery();
        if (galleryRes.success) {
          setGalleryItems(galleryRes.gallery || []);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload memory.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this memory?")) return;
    try {
      const res = await deleteMedia(id);
      if (res.success) {
        toast.success("Memory deleted.");
        setGalleryItems((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete memory.");
    }
  };

  const filteredItems = galleryItems.filter((item) => {
    if (activeFilter === "ALL") return true;
    return item.category.toUpperCase() === activeFilter;
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin"></div>
        <p className="mt-4 text-slate-400 font-medium">Opening classroom memory vault...</p>
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
            Child Memories
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-2">
            Activity Gallery
          </h1>
          <p className="text-slate-300 text-xs mt-1.5 leading-relaxed max-w-xl">
            {user.role === "PARENT"
              ? "Browse through childhood memories, classroom highlights, and learning activities shared by teachers."
              : "Share event highlights, child art projects, or classroom activity snapshots directly with parents."}
          </p>
        </div>
      </div>

      {(user.role === "TEACHER" || user.role === "ADMIN") && (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl max-w-xl">
          <h2 className="text-base font-bold text-white mb-4">Share New Classroom Memory</h2>
          
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                  Link Student (Optional)
                </label>
                <select
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-indigo-500 transition-all text-xs cursor-pointer"
                >
                  <option value="">Classroom General (All Parents)</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                  Activity Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-indigo-500 transition-all text-xs cursor-pointer"
                >
                  <option value="Activity">Classroom Activity</option>
                  <option value="Artwork">Child Artwork</option>
                  <option value="Event">School Event</option>
                  <option value="Learning">Learning Lesson</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                Photo URL (Unsplash or Cloud link)
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="e.g. https://images.unsplash.com/photo-1516627145497-ae6968895b74"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-indigo-500 transition-all text-xs placeholder:text-slate-650"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                Caption / Description
              </label>
              <textarea
                value={formData.caption}
                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                placeholder="e.g. Aarav building a tall wooden castle during block time!"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-indigo-500 transition-all text-xs placeholder:text-slate-650 resize-none"
                rows="2"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold rounded-xl py-2.5 px-6 text-xs transition-all transform active:scale-[0.98] shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {submitting ? "Uploading..." : "🚀 Share Memory"}
            </button>
          </form>
        </div>
      )}

      {/* Gallery Filter controls */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-850 pb-3">
        {["ALL", "ACTIVITY", "ARTWORK", "EVENT", "LEARNING"].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeFilter === filter
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                : "bg-slate-900/40 text-slate-400 border border-slate-800/80 hover:text-white hover:border-slate-750"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Cards list */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/20 border border-slate-850 rounded-3xl">
          <span className="text-3xl block">🖼️</span>
          <p className="text-slate-500 text-xs mt-3 italic">No matching memory items in the gallery.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/40 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl hover:border-slate-700/50 transition-all flex flex-col justify-between group"
            >
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={item.url}
                  alt={item.caption || "Activity"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=500&q=80"; // fallback
                  }}
                />
                <span className="absolute top-3 left-3 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded bg-slate-950/80 backdrop-blur text-orange-400 border border-slate-800">
                  {item.category}
                </span>
                
                {/* Delete button (Teacher/Admin only) */}
                {(user.role === "TEACHER" || user.role === "ADMIN") && (
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-rose-950/80 text-rose-400 border border-rose-900/40 hover:bg-rose-900 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Delete memory"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <p className="text-slate-300 text-xs leading-relaxed italic">
                  "{item.caption || "A happy preschool learning snapshot."}"
                </p>
                <div className="flex justify-between items-center border-t border-slate-850/60 pt-3 text-[10px]">
                  <span className="text-slate-500 font-bold">
                    {item.student ? `🧒 ${item.student.name}` : "👥 Classroom General"}
                  </span>
                  <span className="text-slate-600">
                    {new Date(item.uploadedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Gallery;
