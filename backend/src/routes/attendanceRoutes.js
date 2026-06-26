const express = require("express");
const prisma = require("../lib/prisma");
const { authenticateToken, verifyStudentAccess } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const { logActivity } = require("../lib/auditLogger");
const { createNotification } = require("../lib/notificationHelper");

const router = express.Router();

router.use(authenticateToken);

// Mark/Update Daily Attendance (Teacher/Admin only)
router.post("/", allowRoles("TEACHER", "ADMIN"), async (req, res) => {
  try {
    const { studentId, date, status, remarks } = req.body;
    if (!studentId || !date || !status) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    // Upsert attendance
    const attendance = await prisma.attendance.upsert({
      where: {
        studentId_date: { studentId, date },
      },
      update: {
        status,
        remarks,
        teacherId: req.user.id,
      },
      create: {
        studentId,
        teacherId: req.user.id,
        date,
        status,
        remarks,
      },
    });

    // Notify parents linked to the student
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { parentUsers: true },
    });

    if (student) {
      for (const parentUser of student.parentUsers) {
        await createNotification(
          parentUser.id,
          "Daily Attendance Update",
          `${student.name} was marked ${status.replace("_", " ")} on ${date}.`,
          "ATTENDANCE"
        );
      }
    }

    await logActivity(req.user.id, "ATTENDANCE_LOG", `Logged attendance for student ${studentId} on ${date}: ${status}`, req);
    res.json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET Daily Attendance Summary for Class/Students managed by teacher
router.get("/summary", allowRoles("TEACHER", "ADMIN"), async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: "Date parameter is required." });
    }

    const whereClause = { date };
    if (req.user.role === "TEACHER") {
      whereClause.student = { teacherId: req.user.id };
    }

    const logs = await prisma.attendance.findMany({
      where: whereClause,
      include: { student: true },
    });

    const summary = {
      present: logs.filter((l) => l.status === "PRESENT").length,
      absent: logs.filter((l) => l.status === "ABSENT").length,
      late: logs.filter((l) => l.status === "LATE").length,
      halfDay: logs.filter((l) => l.status === "HALF_DAY").length,
    };

    res.json({ success: true, logs, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET Attendance details & stats for a student (Parent/Teacher/Admin)
router.get("/student/:studentId", verifyStudentAccess, async (req, res) => {
  try {
    const { studentId } = req.params;

    const attendances = await prisma.attendance.findMany({
      where: { studentId },
      orderBy: { date: "desc" },
    });

    // Compute stats
    const total = attendances.length;
    const presentCount = attendances.filter((a) => a.status === "PRESENT" || a.status === "LATE" || a.status === "HALF_DAY").length;
    const exactPresent = attendances.filter((a) => a.status === "PRESENT").length;
    const absent = attendances.filter((a) => a.status === "ABSENT").length;
    const late = attendances.filter((a) => a.status === "LATE").length;
    const halfDay = attendances.filter((a) => a.status === "HALF_DAY").length;

    // Weight: PRESENT = 1.0, LATE = 1.0, HALF_DAY = 0.5, ABSENT = 0.0
    const weightedPresent = exactPresent + late + (halfDay * 0.5);
    const percentage = total > 0 ? Math.round((weightedPresent / total) * 100) : 100;

    res.json({
      success: true,
      attendances,
      stats: {
        total,
        present: presentCount,
        absent,
        late,
        halfDay,
        percentage,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
