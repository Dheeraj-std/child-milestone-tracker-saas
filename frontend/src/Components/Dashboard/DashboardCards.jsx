function DashboardCards({ students }) {
  const totalStudents = students.length;

  const scaledStudents = students.map((student) => {
    let growth = student.growth || 0;
    if (growth > 10) {
      growth = growth / 10;
    }
    return { ...student, growth };
  });

  const averageGrowth =
    scaledStudents.length > 0
      ? (
          scaledStudents.reduce(
            (sum, student) => sum + student.growth,
            0
          ) / scaledStudents.length
        ).toFixed(1)
      : 0;

  const topPerformer =
    scaledStudents.length > 0
      ? scaledStudents.reduce((top, student) =>
          student.growth > top.growth
            ? student
            : top
        )
      : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-blue-500 text-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold">
          Total Students
        </h2>
        <p className="text-3xl font-bold">
          {totalStudents}
        </p>
      </div>

      <div className="bg-green-500 text-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold">
          Average Growth
        </h2>
        <p className="text-3xl font-bold">
          {averageGrowth}/10
        </p>
      </div>

      <div className="bg-purple-500 text-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold">
          Top Performer
        </h2>
        <p className="text-2xl font-bold">
          {topPerformer
            ? topPerformer.name
            : "N/A"}
        </p>
      </div>
    </div>
  );
}

export default DashboardCards;