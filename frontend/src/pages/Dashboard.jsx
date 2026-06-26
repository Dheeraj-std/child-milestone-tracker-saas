import { useEffect, useState } from "react";
import { getStudents } from "../services/studentService";
import GrowthChart from "../components/charts/GrowthChart";

function Dashboard() {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const data = await getStudents();
    setStudents(data.students);
  };

  const totalStudents = students.length;

  const averageGrowth =
    students.length > 0
      ? (
          students.reduce((sum, s) => sum + s.growth, 0) /
          students.length
        ).toFixed(1)
      : 0;

  const topPerformer =
    students.length > 0
      ? students.reduce((prev, curr) =>
          prev.growth > curr.growth ? prev : curr
        ).name
      : "N/A";

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border p-4 rounded shadow">
          <h2 className="font-bold">Total Students</h2>
          <p className="text-2xl">{totalStudents}</p>
        </div>

        <div className="border p-4 rounded shadow">
          <h2 className="font-bold">Average Growth</h2>
          <p className="text-2xl">{averageGrowth}</p>
        </div>

        <div className="border p-4 rounded shadow">
          <h2 className="font-bold">Top Performer</h2>
          <p className="text-xl">{topPerformer}</p>
        </div>
      </div>
      <GrowthChart students={students} />
    </div>
    
  );
}

export default Dashboard;