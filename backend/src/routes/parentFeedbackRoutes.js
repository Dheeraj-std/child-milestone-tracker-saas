const express = require("express");
const prisma = require("../lib/prisma");
const { authenticateToken, verifyStudentAccess } = require("../middleware/authMiddleware");

const router = express.Router();

// Apply authentication to all feedback routes
router.use(authenticateToken);

// GET all feedbacks (Teacher/Admin only)
router.get("/", async (req, res, next) => {
  if (req.user.role !== "TEACHER" && req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Teachers and Admins only.",
    });
  }
  try {
    const feedbacks = await prisma.parentFeedback.findMany({
      include: {
        student: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.json({
      success: true,
      feedbacks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Submit Parent Feedback - PARENT must own the studentId
router.post("/", verifyStudentAccess, async (req, res) => {
  try {
    if (req.user.role !== "PARENT" && req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only parents can submit parent feedback.",
      });
    }

    const { studentId, feedback } = req.body;

    if (!studentId || !feedback) {
      return res.status(400).json({
        success: false,
        message: "Please provide studentId and feedback.",
      });
    }

    const newFeedback = await prisma.parentFeedback.create({
      data: {
        studentId,
        feedback,
      },
    });

    res.json({
      success: true,
      feedback: newFeedback,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Fetch Feedback by Student ID - PARENT must own the studentId
router.get("/:studentId", verifyStudentAccess, async (req, res) => {
  try {
    const feedbacks = await prisma.parentFeedback.findMany({
      where: {
        studentId: req.params.studentId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      feedbacks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;