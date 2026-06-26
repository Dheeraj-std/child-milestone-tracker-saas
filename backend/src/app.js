const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const milestoneRoutes = require("./routes/milestoneRoutes");
const parentFeedbackRoutes = require("./routes/parentFeedbackRoutes");
const aiRoutes = require("./routes/aiRoutes");
const classroomRoutes = require("./routes/classroomRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const mediaRoutes = require("./routes/mediaRoutes");
const goalRoutes = require("./routes/goalRoutes");
const observationRoutes = require("./routes/observationRoutes");
const messageRoutes = require("./routes/messageRoutes");
const eventRoutes = require("./routes/eventRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();

// Middleware FIRST
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// Routes AFTER middleware
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/milestones", milestoneRoutes);
app.use("/api/parent-feedback", parentFeedbackRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/classrooms", classroomRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/observations", observationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);

// AI summary endpoint for Teacher Dashboard widget
app.post("/api/ai-summary", async (req, res) => {
  try {
    const { speech, attention, participation } = req.body;
    let summary = "";

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "your_openai_api_key_here") {
      try {
        const OpenAI = require("openai");
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are an expert child development consultant." },
            {
              role: "user",
              content: `Generate a brief developmental progress summary for a child based on these evaluations:\n- Speech & Language: ${speech}/100\n- Attention Span: ${attention}/100\n- Classroom Participation: ${participation}/100\n\nFormat your response as a friendly, encouraging 2-sentence summary with one quick tip.`
            }
          ],
          max_tokens: 120,
          temperature: 0.7,
        });
        summary = response.choices[0]?.message?.content?.trim();
      } catch (err) {
        console.error("OpenAI failed for /api/ai-summary:", err.message);
      }
    }

    if (!summary) {
      summary = `The child shows active classroom participation (${participation}%). To support vocabulary and verbal skills (${speech}%) and focused attention (${attention}%), encourage structured reading sessions and interactive vocabulary matching activities.`;
    }

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Audit logs endpoint (Admin only)
const { authenticateToken } = require("./middleware/authMiddleware");
const allowRoles = require("./middleware/roleMiddleware");
const prisma = require("./lib/prisma");

// Auto-align students with their classrooms based on name matching
(async () => {
  try {
    const students = await prisma.student.findMany();
    for (const student of students) {
      if (student.classroom) {
        const match = await prisma.classroom.findFirst({
          where: { name: student.classroom },
        });
        if (match && student.classroomId !== match.id) {
          await prisma.student.update({
            where: { id: student.id },
            data: {
              classroomId: match.id,
              teacherId: student.teacherId || match.teacherId || null,
            },
          });
          console.log(`[AUTO-ALIGN] Linked student ${student.name} to classroom ${match.name}`);
        }
      }
    }
  } catch (error) {
    console.error("[AUTO-ALIGN] Failed to align students with classrooms:", error);
  }
})();

app.get("/api/audit-logs", authenticateToken, allowRoles("ADMIN"), async (req, res) => {
  try {
    const logs = await prisma.activityLog.findMany({
      include: {
        user: { select: { name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin Dashboard statistics endpoint (Admin & Teacher allowed)
app.get("/api/admin/statistics", authenticateToken, allowRoles("ADMIN", "TEACHER"), async (req, res) => {
  try {
    const totalStudents = await prisma.student.count();
    const totalTeachers = await prisma.user.count({ where: { role: "TEACHER" } });
    const totalParents = await prisma.user.count({ where: { role: "PARENT" } });
    const totalMeetings = await prisma.report.count();
    const totalMilestones = await prisma.milestone.count();
    const totalAttendance = await prisma.attendance.count();

    res.json({
      success: true,
      statistics: {
        totalStudents,
        totalTeachers,
        totalParents,
        totalMeetings,
        totalMilestones,
        totalAttendance,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = app;