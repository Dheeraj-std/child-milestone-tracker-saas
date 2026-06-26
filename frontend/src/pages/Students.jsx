import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  getStudents,
  deleteStudent,
} from "../services/studentService";

import StudentForm from "../Components/forms/StudentForm";
import DashboardCards from "../Components/Dashboard/DashboardCards";
import GrowthChart from "../Components/charts/GrowthChart";
import MilestoneForm from "../Components/forms/MilestoneForm";
import AIInsights from "../Components/Dashboard/AIinsights";
import { Link } from "react-router-dom";
function Students() {
  const [students, setStudents] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);
  const [search, setSearch] = useState("");

  const fetchStudents = async () => {
    try {
      const data = await getStudents();
      setStudents(data.students);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteStudent(id);
      fetchStudents();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">
        Child Milestone Tracker
      </h1>

      <StudentForm
        onStudentAdded={fetchStudents}
        editingStudent={editingStudent}
        setEditingStudent={setEditingStudent}
      />
      <DashboardCards students={students} />

      <GrowthChart students={students} />

      <AIInsights students={students} />

      <MilestoneForm
  students={students}
  onMilestoneAdded={fetchStudents}
/>

      <input
  type="text"
  placeholder="🔍 Search students..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="w-full border p-2 rounded mb-4"
/>

      <div className="grid gap-4 mt-6">
        {students
  .filter((student) =>
    student.name
      .toLowerCase()
      .includes(search.toLowerCase())
  )
  .map((student) => ( 
          <div
            key={student.id}
            className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow transition-all hover:border-slate-700/50 hover:translate-y-[-2px] flex flex-col justify-between"
          >
            <div>
              <h2 className="font-extrabold text-white text-base mb-2">
                {student.name}
              </h2>
              <div className="space-y-1.5 mb-4 text-xs text-slate-400">
                <p><strong className="text-slate-300">Age:</strong> {student.age} years</p>
                <p><strong className="text-slate-300">Classroom:</strong> {student.classroom}</p>
                <p><strong className="text-slate-300">Parent:</strong> {student.parentName} ({student.parentEmail})</p>
                <p><strong className="text-emerald-400">Access Code:</strong> <code className="bg-emerald-950/40 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">{student.accessCode}</code></p>
                <div className="flex items-center gap-1.5">
                  <strong className="text-slate-300">Invite Link:</strong> 
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(student.inviteLink);
                      toast.success("Invite link copied!");
                    }}
                    className="text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer flex items-center gap-1 font-semibold"
                  >
                    Copy Link 📋
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-800">
              <Link
                to={`/teacher/student/${student.id}`}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold inline-block transition-colors"
              >
                View Profile
              </Link>

              <button
                onClick={() => handleEdit(student)}
                className="bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              >
                Edit
              </button>

              <button
                onClick={() => handleDelete(student.id)}
                className="bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ml-auto"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Students;