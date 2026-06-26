const express = require("express");
const prisma = require("../lib/prisma");
const { authenticateToken, verifyStudentAccess } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const { logActivity } = require("../lib/auditLogger");
const { createNotification } = require("../lib/notificationHelper");

const router = express.Router();

router.use(authenticateToken);

// CREATE Goal (Teacher/Admin only)
router.post("/", allowRoles("TEACHER", "ADMIN"), async (req, res) => {
  try {
    const { title, targetDate, studentId } = req.body;
    if (!title || !studentId) {
      return res.status(400).json({ success: false, message: "Title and studentId are required." });
    }

    const goal = await prisma.goal.create({
      data: {
        title,
        status: "PENDING",
        progress: 0,
        targetDate: targetDate ? new Date(targetDate) : null,
        studentId,
        teacherId: req.user.id,
      },
    });

    // Notify parents
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { parentUsers: true },
    });

    if (student) {
      for (const parentUser of student.parentUsers) {
        await createNotification(
          parentUser.id,
          "New Child Goal Set",
          `A new learning goal was set for ${student.name}: "${title}".`,
          "MILESTONE"
        );
      }
    }

    await logActivity(req.user.id, "GOAL_CREATE", `Created goal: ${title}`, req);
    res.status(201).json({ success: true, goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET goals for a specific student (Parent/Teacher/Admin)
router.get("/student/:studentId", verifyStudentAccess, async (req, res) => {
  try {
    const { studentId } = req.params;
    const goals = await prisma.goal.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, goals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE Goal Progress/Status (Teacher/Admin only)
router.put("/:id", allowRoles("TEACHER", "ADMIN"), async (req, res) => {
  try {
    const { title, status, progress, targetDate } = req.body;

    const existingGoal = await prisma.goal.findUnique({
      where: { id: req.params.id },
      include: { student: { include: { parentUsers: true } } },
    });

    if (!existingGoal) {
      return res.status(404).json({ success: false, message: "Goal not found." });
    }

    if (req.user.role === "TEACHER" && existingGoal.teacherId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Access denied. You did not create this goal." });
    }

    const updatedData = {
      title,
      status,
      progress: progress !== undefined ? Number(progress) : undefined,
      targetDate: targetDate ? new Date(targetDate) : undefined,
    };

    if (status === "COMPLETED") {
      updatedData.completedAt = new Date();
      updatedData.progress = 100;
    } else if (status === "PENDING" || status === "IN_PROGRESS") {
      updatedData.completedAt = null;
    }

    const goal = await prisma.goal.update({
      where: { id: req.params.id },
      data: updatedData,
    });

    // Notify parents on status update/completion
    if (status === "COMPLETED" && existingGoal.status !== "COMPLETED") {
      for (const parentUser of existingGoal.student.parentUsers) {
        await createNotification(
          parentUser.id,
          "Goal Completed! 🎉",
          `${existingGoal.student.name} successfully achieved the goal: "${goal.title}"!`,
          "MILESTONE"
        );
      }
    }

    await logActivity(req.user.id, "GOAL_UPDATE", `Updated goal ${goal.title}`, req);
    res.json({ success: true, goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE Goal (Teacher/Admin only)
router.delete("/:id", allowRoles("TEACHER", "ADMIN"), async (req, res) => {
  try {
    const goal = await prisma.goal.findUnique({
      where: { id: req.params.id },
    });

    if (!goal) {
      return res.status(404).json({ success: false, message: "Goal not found." });
    }

    if (req.user.role === "TEACHER" && goal.teacherId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Access denied. You did not create this goal." });
    }

    await prisma.goal.delete({
      where: { id: req.params.id },
    });

    await logActivity(req.user.id, "GOAL_DELETE", `Deleted goal ${goal.title}`, req);
    res.json({ success: true, message: "Goal deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
