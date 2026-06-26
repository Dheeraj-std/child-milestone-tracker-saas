import { useState, useEffect } from "react";
import { createTeacher, updateTeacher } from "../../services/authService";
import { getClassrooms } from "../../services/studentService";
import { toast } from "react-hot-toast";

function TeacherForm({ onTeacherAdded, editingTeacher, setEditingTeacher }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    employeeId: "",
    classroom: "",
  });
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load classrooms list
  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const res = await getClassrooms();
        if (res.success) {
          setClassrooms(res.classrooms || []);
        }
      } catch (err) {
        console.error("Failed to load classrooms:", err);
      }
    };
    fetchClassrooms();
  }, []);

  useEffect(() => {
    if (editingTeacher) {
      setFormData({
        name: editingTeacher.name || "",
        email: editingTeacher.email || "",
        password: "", // Empty unless updating password
        employeeId: editingTeacher.employeeId || "",
        classroom: editingTeacher.classroom || "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        employeeId: "",
        classroom: "",
      });
    }
  }, [editingTeacher]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingTeacher) {
        // Prepare update payload
        const payload = {
          name: formData.name,
          email: formData.email,
          employeeId: formData.employeeId || null,
          classroom: formData.classroom || "",
        };
        if (formData.password) {
          payload.password = formData.password;
        }
        await updateTeacher(editingTeacher.id, payload);
        toast.success(`Teacher "${formData.name}" updated successfully!`);
        setEditingTeacher(null);
      } else {
        if (!formData.password) {
          toast.error("Password is required to register a new teacher.");
          setLoading(false);
          return;
        }
        // Register new teacher
        await createTeacher({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          employeeId: formData.employeeId || null,
          classroom: formData.classroom || "",
        });
        toast.success(`Teacher "${formData.name}" has been registered!`);
      }

      setFormData({
        name: "",
        email: "",
        password: "",
        employeeId: "",
        classroom: "",
      });

      onTeacherAdded();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Operation failed. Please verify fields.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingTeacher(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      employeeId: "",
      classroom: "",
    });
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl mb-8 max-w-3xl">
      <h2 className="text-sm font-black text-white mb-4 uppercase tracking-wider text-rose-400">
        {editingTeacher ? `✏️ Edit Teacher: ${editingTeacher.name}` : "➕ Register New Teacher"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Sarah Jenkins"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-rose-500 transition-all text-xs placeholder:text-slate-600"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              placeholder="e.g. teacher@intellitots.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-rose-500 transition-all text-xs placeholder:text-slate-600"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              Employee ID
            </label>
            <input
              type="text"
              name="employeeId"
              placeholder="e.g. EMP-1092"
              value={formData.employeeId}
              onChange={handleChange}
              className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-rose-500 transition-all text-xs placeholder:text-slate-600"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              Assign Classroom
            </label>
            <select
              name="classroom"
              value={formData.classroom}
              onChange={handleChange}
              className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-rose-500 transition-all text-xs cursor-pointer"
            >
              <option value="">No Classroom Assigned</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} ({c.section})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              Password {editingTeacher && <span className="text-slate-500 font-normal lowercase">(fill only to reset)</span>}
            </label>
            <input
              type="password"
              name="password"
              placeholder={editingTeacher ? "Leave empty to keep current" : "Enter temporary password"}
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-rose-500 transition-all text-xs placeholder:text-slate-600"
              required={!editingTeacher}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-rose-500 to-indigo-650 hover:from-rose-650 hover:to-indigo-750 text-white font-bold rounded-xl py-2.5 px-6 text-xs transition-all transform active:scale-[0.98] shadow-lg shadow-rose-500/20 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {loading ? "Processing..." : editingTeacher ? "Save Teacher Changes" : "Register Educator"}
          </button>

          {editingTeacher && (
            <button
              type="button"
              onClick={handleCancel}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl py-2.5 px-5 text-xs transition-all transform active:scale-[0.98] cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default TeacherForm;
