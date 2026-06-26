import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getClassrooms,
  getMyClassroom,
  createClassroom,
  updateClassroom,
  deleteClassroom,
  getUsers,
  getStudents,
  updateStudent,
} from "../services/studentService";
import { toast } from "react-hot-toast";

const ClassroomsPage = () => {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [myClassroom, setMyClassroom] = useState(null);
  const [loading, setLoading] = useState(true);

  // Enrollment modal states
  const [allStudents, setAllStudents] = useState([]);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [activeClassroomForEnroll, setActiveClassroomForEnroll] = useState(null);
  const [loadingEnroll, setLoadingEnroll] = useState(false);
  const [enrollSearch, setEnrollSearch] = useState("");

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    section: "",
    ageGroup: "",
    teacherId: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      if (user.role === "ADMIN") {
        const classRes = await getClassrooms();
        if (classRes.success) {
          setClassrooms(classRes.classrooms || []);
        }
        // Load teachers list for dropdown selection
        const usersRes = await getUsers();
        if (usersRes.success) {
          const teacherList = usersRes.users.filter((u) => u.role === "TEACHER");
          setTeachers(teacherList);
        }
      } else if (user.role === "TEACHER") {
        const myRes = await getMyClassroom();
        if (myRes.success) {
          setMyClassroom(myRes.classroom);
        }
      }

      // Load all students for the enrollment selector
      if (user.role === "ADMIN" || user.role === "TEACHER") {
        const studentsRes = await getStudents(true);
        if (studentsRes.success) {
          setAllStudents(studentsRes.students || []);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load classroom records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        section: formData.section,
        ageGroup: formData.ageGroup,
        teacherId: formData.teacherId || null,
      };

      if (editingId) {
        const res = await updateClassroom(editingId, payload);
        if (res.success) {
          toast.success("Classroom updated successfully!");
          loadData();
          setIsModalOpen(false);
          resetForm();
        } else {
          toast.error(res.message || "Failed to update classroom.");
        }
      } else {
        const res = await createClassroom(payload);
        if (res.success) {
          toast.success("Classroom created successfully!");
          loadData();
          setIsModalOpen(false);
          resetForm();
        } else {
          toast.error(res.message || "Failed to create classroom.");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred. Please try again.");
    }
  };

  const handleEdit = (room) => {
    setEditingId(room.id);
    setFormData({
      name: room.name,
      section: room.section,
      ageGroup: room.ageGroup,
      teacherId: room.teacherId || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this classroom?")) return;

    try {
      const res = await deleteClassroom(id);
      if (res.success) {
        toast.success("Classroom deleted successfully!");
        loadData();
      } else {
        toast.error(res.message || "Failed to delete classroom.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while deleting.");
    }
  };

  const handleEnrollStudent = async (student) => {
    if (!activeClassroomForEnroll) return;
    setLoadingEnroll(true);
    try {
      const payload = {
        ...student,
        classroom: activeClassroomForEnroll.name,
      };
      const res = await updateStudent(student.id, payload);
      if (res.success) {
        toast.success(`${student.name} enrolled in ${activeClassroomForEnroll.name}!`);
        // Refresh local data
        await loadData();
        
        // Refresh activeClassroomForEnroll so the modal lists reflect changes
        if (user.role === "TEACHER") {
          const myRes = await getMyClassroom();
          if (myRes.success && myRes.classroom) {
            setMyClassroom(myRes.classroom);
            setActiveClassroomForEnroll(myRes.classroom);
          }
        } else {
          const classRes = await getClassrooms();
          if (classRes.success) {
            setClassrooms(classRes.classrooms || []);
            const updated = classRes.classrooms.find(c => c.id === activeClassroomForEnroll.id);
            if (updated) {
              setActiveClassroomForEnroll(updated);
            }
          }
        }
      } else {
        toast.error("Failed to enroll student.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during enrollment.");
    } finally {
      setLoadingEnroll(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: "",
      section: "",
      ageGroup: "",
      teacherId: "",
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin"></div>
        <p className="mt-4 text-slate-400 font-medium">Opening classrooms record book...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl">
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-teal-950/40 to-indigo-950/30 border border-teal-500/20 rounded-3xl p-6 md:p-8">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-md">
              Classroom & Sections
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mt-2">
              Classrooms Directory
            </h1>
            <p className="text-slate-300 text-xs mt-1.5 leading-relaxed max-w-xl">
              {user.role === "ADMIN"
                ? "Organize curriculum groups, assign teachers, and monitor student numbers per section."
                : "Manage and view your assigned classroom section roster and student development details."}
            </p>
          </div>

          {user.role === "ADMIN" && (
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold rounded-xl py-2.5 px-5 text-xs transition-all shadow-lg shadow-teal-500/20 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              ➕ Create Classroom
            </button>
          )}
        </div>
      </div>

      {user.role === "ADMIN" && (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl">
          <h2 className="text-base font-bold text-white mb-4">All Active Classrooms</h2>

          {classrooms.length === 0 ? (
            <p className="text-slate-500 text-xs italic py-6 text-center">No classrooms created yet. Click "Create Classroom" to start.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classrooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-slate-950/40 border border-slate-855 hover:border-teal-500/40 rounded-2xl p-5 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-white font-extrabold text-base leading-tight">
                          {room.name}
                        </h3>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-1">
                          Section: {room.section}
                        </span>
                      </div>
                      <span className="text-[10px] text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full font-bold uppercase">
                        {room.ageGroup}
                      </span>
                    </div>

                    <div className="space-y-2 mt-4 pt-4 border-t border-slate-850/60">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Assigned Teacher:</span>
                        <span className="text-white font-semibold">
                          {room.teacher ? room.teacher.name : <span className="text-rose-400 text-[10px] italic">Not Assigned</span>}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Total Enrolled:</span>
                        <span className="text-white font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md">
                          {room.students ? room.students.length : 0} Students
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6 pt-4 border-t border-slate-850/60">
                    <button
                      onClick={() => {
                        setActiveClassroomForEnroll(room);
                        setIsEnrollModalOpen(true);
                      }}
                      className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-1.5 text-[11px] font-bold transition-all cursor-pointer text-center"
                    >
                      ➕ Enroll
                    </button>
                    <button
                      onClick={() => handleEdit(room)}
                      className="flex-1 bg-slate-900 border border-slate-800 text-slate-350 hover:text-white rounded-xl py-1.5 text-[11px] font-bold transition-all cursor-pointer text-center"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(room.id)}
                      className="flex-1 bg-red-950/10 border border-red-950/50 hover:bg-red-500/10 hover:border-red-500/30 text-red-400 rounded-xl py-1.5 text-[11px] font-bold transition-all cursor-pointer text-center"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {user.role === "TEACHER" && (
        <div className="space-y-6">
          {myClassroom ? (
            <>
              {/* Roster Summary Header Card */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl grid grid-cols-1 sm:grid-cols-4 gap-6">
                <div className="sm:border-r border-slate-850/60 pr-6">
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">Classroom Name</span>
                  <h3 className="text-white text-lg font-black mt-1">{myClassroom.name}</h3>
                </div>
                <div className="sm:border-r border-slate-850/60 px-0 sm:px-6">
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">Section Identifier</span>
                  <h3 className="text-white text-lg font-black mt-1">{myClassroom.section}</h3>
                </div>
                <div className="sm:border-r border-slate-850/60 px-0 sm:px-6">
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">Age Group</span>
                  <h3 className="text-white text-lg font-black mt-1">{myClassroom.ageGroup}</h3>
                </div>
                <div className="pl-0 sm:pl-6">
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">Enrolled Count</span>
                  <h3 className="text-teal-400 text-lg font-black mt-1">
                    {myClassroom.students ? myClassroom.students.length : 0} Children
                  </h3>
                </div>
              </div>

              {/* Student Roster Table */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-white">Class Roster Register</h2>
                  <button
                    onClick={() => {
                      setActiveClassroomForEnroll(myClassroom);
                      setIsEnrollModalOpen(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl py-1.5 px-3.5 text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1 shrink-0"
                  >
                    ➕ Enroll Child
                  </button>
                </div>

                {(!myClassroom.students || myClassroom.students.length === 0) ? (
                  <p className="text-slate-500 text-xs italic py-4">No students enrolled in your classroom yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-850 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="py-3 pr-4">Student Name</th>
                          <th className="py-3 px-4">Age</th>
                          <th className="py-3 px-4">Parent Name</th>
                          <th className="py-3 px-4">Parent Email</th>
                          <th className="py-3 pl-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myClassroom.students.map((student) => (
                          <tr key={student.id} className="border-b border-slate-850 hover:bg-slate-950/20 transition-all">
                            <td className="py-4 pr-4 font-bold text-white leading-tight">
                              {student.name}
                            </td>
                            <td className="py-4 px-4 text-slate-300">
                              {student.age} Years
                            </td>
                            <td className="py-4 px-4 text-slate-300">
                              {student.parentName}
                            </td>
                            <td className="py-4 px-4 text-slate-500 font-mono">
                              {student.parentEmail || "N/A"}
                            </td>
                            <td className="py-4 pl-4 text-right">
                              <a
                                href={`/teacher/student/${student.id}`}
                                className="inline-block bg-slate-900 hover:bg-slate-800 border border-slate-850 text-teal-400 hover:text-white rounded-xl py-1.5 px-3 font-bold transition-all text-[10px]"
                              >
                                📂 View Portfolio
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 text-center text-slate-450">
              <span className="text-xl">🏫</span>
              <h3 className="text-white font-bold mt-2">No Classroom Assigned</h3>
              <p className="text-xs text-slate-500 mt-1">Contact your system administrator to assign you to a classroom section.</p>
            </div>
          )}
        </div>
      )}

      {/* Admin Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-scale-up">
            <h3 className="text-base font-extrabold text-white mb-4">
              {editingId ? "✏️ Edit Classroom Details" : "🏫 Create New Classroom"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Classroom Name (e.g. Nursery, Toddlers) *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Toddlers Playgroup"
                  required
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2 outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Section Identifier *
                  </label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    placeholder="e.g. Sec-A, morning"
                    required
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2 outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Age Group *
                  </label>
                  <input
                    type="text"
                    value={formData.ageGroup}
                    onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                    placeholder="e.g. 2-3 Years"
                    required
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2 outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Assign Lead Teacher (Optional)
                </label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-teal-500"
                >
                  <option value="">-- No Teacher Assigned --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-850/60 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-xl py-2 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-xl py-2 text-xs font-bold transition-all cursor-pointer shadow-lg shadow-teal-500/20"
                >
                  {editingId ? "Save Changes" : "Create Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Enrollment Modal */}
      {isEnrollModalOpen && activeClassroomForEnroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative flex flex-col max-h-[85vh]">
            <h3 className="text-base font-extrabold text-white mb-1">
              ➕ Enroll Students into {activeClassroomForEnroll.name}
            </h3>
            <p className="text-slate-450 text-[11px] mb-4">
              Select registered students to assign them to this classroom.
            </p>

            <input
              type="text"
              placeholder="🔍 Search registered children..."
              value={enrollSearch}
              onChange={(e) => setEnrollSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-indigo-500 transition-all text-xs placeholder:text-slate-650 mb-4"
            />

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[200px]">
              {allStudents
                .filter((student) =>
                  student.name.toLowerCase().includes(enrollSearch.toLowerCase())
                )
                .map((student) => {
                  const isCurrentClass = student.classroomId === activeClassroomForEnroll.id;
                  return (
                    <div
                      key={student.id}
                      className="bg-slate-950/40 border border-slate-850 p-3 rounded-2xl text-xs flex justify-between items-center gap-4 hover:border-slate-800 transition-all"
                    >
                      <div className="text-left">
                        <h4 className="text-white font-bold">{student.name}</h4>
                        <div className="flex gap-2 text-[10px] text-slate-500 mt-1">
                          <span>Age: {student.age}</span>
                          <span>•</span>
                          <span>Parent: {student.parentName}</span>
                          <span>•</span>
                          <span className={student.classroom ? "text-indigo-400 font-semibold" : "text-amber-400 font-semibold"}>
                            Class: {student.classroom || "Unassigned"}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleEnrollStudent(student)}
                        disabled={isCurrentClass || loadingEnroll}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                          isCurrentClass
                            ? "bg-slate-900 border border-slate-850 text-slate-500 cursor-not-allowed"
                            : student.classroomId
                            ? "bg-indigo-950/40 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600 hover:text-white"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow shadow-emerald-500/10"
                        }`}
                      >
                        {isCurrentClass ? "Enrolled" : student.classroomId ? "Transfer" : "➕ Enroll"}
                      </button>
                    </div>
                  );
                })}

              {allStudents.filter((student) =>
                student.name.toLowerCase().includes(enrollSearch.toLowerCase())
              ).length === 0 && (
                <p className="text-slate-500 text-xs italic text-center py-6">No matching students found.</p>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-855 mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsEnrollModalOpen(false);
                  setEnrollSearch("");
                }}
                className="w-full bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-xl py-2 text-xs font-bold transition-all cursor-pointer"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomsPage;
