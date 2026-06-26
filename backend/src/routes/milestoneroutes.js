const express = require("express");
const prisma = require("../lib/prisma");
const { authenticateToken, verifyStudentAccess } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Apply auth middlewares to all routes here
router.use(authenticateToken);
router.use(allowRoles("TEACHER", "ADMIN"));

// GET all milestones
router.get("/", async (req, res) => {
  try {
    const whereClause = {};
    if (req.user.role === "TEACHER") {
      whereClause.student = {
        teacherId: req.user.id,
      };
    }

    const milestones = await prisma.milestone.findMany({
      where: whereClause,
      include: {
        student: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      milestones,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// CREATE milestone
router.post("/", verifyStudentAccess, async (req, res) => {
  try {
    const { category, score, notes, studentId } = req.body;

    if (!category || score === undefined || !studentId) {
      return res.status(400).json({
        success: false,
        message: "Please provide category, score, and studentId.",
      });
    }

    const milestone = await prisma.milestone.create({
      data: {
        category,
        score: Number(score),
        notes,
        studentId,
      },
    });

    // Update student growth score dynamically
    // Let's compute average score of all milestones for this student
    const studentMilestones = await prisma.milestone.findMany({
      where: { studentId },
    });

    const averageScore = studentMilestones.length > 0
      ? studentMilestones.reduce((sum, m) => sum + m.score, 0) / studentMilestones.length
      : 0;

    await prisma.student.update({
      where: { id: studentId },
      data: { growth: Math.round(averageScore * 10) / 10 }, // round to 1 decimal place
    });

    res.status(201).json({
      success: true,
      milestone,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET milestone by ID
router.get("/:id", async (req, res) => {
  try {
    const milestone = await prisma.milestone.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        student: true,
      },
    });

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: "Milestone not found",
      });
    }

    if (req.user.role === "TEACHER" && milestone.student?.teacherId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Target student is managed by another teacher.",
      });
    }

    res.json({
      success: true,
      milestone,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// UPDATE milestone
router.put("/:id", async (req, res) => {
  try {
    const { category, score, notes } = req.body;

    const existingMilestone = await prisma.milestone.findUnique({
      where: { id: req.params.id },
      include: { student: true },
    });

    if (!existingMilestone) {
      return res.status(404).json({
        success: false,
        message: "Milestone not found",
      });
    }

    if (req.user.role === "TEACHER" && existingMilestone.student?.teacherId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Target student is managed by another teacher.",
      });
    }

    const milestone = await prisma.milestone.update({
      where: {
        id: req.params.id,
      },
      data: {
        category,
        score: score !== undefined ? Number(score) : undefined,
        notes,
      },
    });

    // Recompute parent student growth score
    const studentId = milestone.studentId;
    const studentMilestones = await prisma.milestone.findMany({
      where: { studentId },
    });

    const averageScore = studentMilestones.length > 0
      ? studentMilestones.reduce((sum, m) => sum + m.score, 0) / studentMilestones.length
      : 0;

    await prisma.student.update({
      where: { id: studentId },
      data: { growth: Math.round(averageScore * 10) / 10 },
    });

    res.json({
      success: true,
      milestone,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// DELETE milestone
router.delete("/:id", async (req, res) => {
  try {
    // Get studentId before deleting
    const milestone = await prisma.milestone.findUnique({
      where: { id: req.params.id },
      include: { student: true },
    });

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: "Milestone not found",
      });
    }

    if (req.user.role === "TEACHER" && milestone.student?.teacherId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Target student is managed by another teacher.",
      });
    }

    const studentId = milestone.studentId;

    await prisma.milestone.delete({
      where: {
        id: req.params.id,
      },
    });

    // Recompute parent student growth score
    const studentMilestones = await prisma.milestone.findMany({
      where: { studentId },
    });

    const averageScore = studentMilestones.length > 0
      ? studentMilestones.reduce((sum, m) => sum + m.score, 0) / studentMilestones.length
      : 0;

    await prisma.student.update({
      where: { id: studentId },
      data: { growth: Math.round(averageScore * 10) / 10 },
    });

    res.json({
      success: true,
      message: "Milestone deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;