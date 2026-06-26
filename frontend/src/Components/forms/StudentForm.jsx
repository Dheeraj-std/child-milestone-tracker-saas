import { useState, useEffect } from "react";
import { createStudent, updateStudent } from "../../services/studentService";
import { toast } from "react-hot-toast";

function StudentForm({ onStudentAdded, editingStudent, setEditingStudent }) {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    classroom: "",
    parentName: "",
    parentEmail: "",
    accessCode: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingStudent) {
      setFormData({
        name: editingStudent.name,
        age: editingStudent.age,
        classroom: editingStudent.classroom,
        parentName: editingStudent.parentName,
        parentEmail: editingStudent.parentEmail || "",
        accessCode: editingStudent.accessCode || "",
      });
    }
  }, [editingStudent]);

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
      if (editingStudent) {
        await updateStudent(editingStudent.id, formData);
        toast.success("Student details updated successfully!");
        setEditingStudent(null);
      } else {
        await createStudent(formData);
        toast.success(`${formData.name} has been registered!`);
      }

      setFormData({
        name: "",
        age: "",
        classroom: "",
        parentName: "",
        parentEmail: "",
        accessCode: "",
      });

      onStudentAdded();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Operation failed. Please check details.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingStudent(null);
    setFormData({
      name: "",
      age: "",
      classroom: "",
      parentName: "",
      parentEmail: "",
      accessCode: "",
    });
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl mb-8 max-w-2xl">
      <h2 className="text-lg font-bold text-white mb-4">
        {editingStudent ? "Edit Student Details" : "Register New Student"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              Child's Full Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Liam Johnson"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-indigo-500 transition-all text-xs placeholder:text-slate-600"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              Age (Years)
            </label>
            <input
              type="number"
              name="age"
              placeholder="e.g. 4"
              min="1"
              max="12"
              value={formData.age}
              onChange={handleChange}
              className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-indigo-500 transition-all text-xs placeholder:text-slate-600"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              Classroom Assignment
            </label>
            <input
              type="text"
              name="classroom"
              placeholder="e.g. Sunflower (Pre-K)"
              value={formData.classroom}
              onChange={handleChange}
              className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-indigo-500 transition-all text-xs placeholder:text-slate-600"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              Primary Parent Name
            </label>
            <input
              type="text"
              name="parentName"
              placeholder="e.g. David Johnson"
              value={formData.parentName}
              onChange={handleChange}
              className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-indigo-500 transition-all text-xs placeholder:text-slate-600"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              Primary Parent Email
            </label>
            <input
              type="email"
              name="parentEmail"
              placeholder="e.g. parent@example.com"
              value={formData.parentEmail}
              onChange={handleChange}
              className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-indigo-500 transition-all text-xs placeholder:text-slate-600"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              Parent Access Code
            </label>
            <input
              type="text"
              name="accessCode"
              placeholder="Leave empty to auto-generate (e.g. AAP-7821)"
              value={formData.accessCode}
              onChange={handleChange}
              className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-indigo-500 transition-all text-xs placeholder:text-slate-650"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl py-2.5 px-6 text-xs transition-all transform active:scale-[0.98] shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {loading ? "Saving..." : editingStudent ? "Update Details" : "Register Student"}
          </button>

          {editingStudent && (
            <button
              type="button"
              onClick={handleCancel}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl py-2.5 px-5 text-xs transition-all transform active:scale-[0.98]"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default StudentForm;