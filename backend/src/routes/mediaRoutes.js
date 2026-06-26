const express = require("express");
const prisma = require("../lib/prisma");
const { authenticateToken, verifyStudentAccess } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const { logActivity } = require("../lib/auditLogger");
const { createNotification } = require("../lib/notificationHelper");

const router = express.Router();

router.use(authenticateToken);

// Upload/Post Media Link (Teacher/Admin only)
router.post("/", allowRoles("TEACHER", "ADMIN"), async (req, res) => {
  try {
    const { url, caption, category, studentId } = req.body;
    if (!url || !category) {
      return res.status(400).json({ success: false, message: "Url and category are required." });
    }

    const media = await prisma.media.create({
      data: {
        url,
        caption,
        category,
        studentId: studentId || null,
        teacherId: req.user.id,
      },
    });

    // Notify parents if linked to a student
    if (studentId) {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { parentUsers: true },
      });

      if (student) {
        for (const parentUser of student.parentUsers) {
          await createNotification(
            parentUser.id,
            "New Media Memory Uploaded",
            `A new photo was shared in ${student.name}'s gallery.`,
            "OBSERVATION"
          );
        }
      }
    }

    await logActivity(req.user.id, "MEDIA_UPLOAD", `Uploaded media memory of category ${category}`, req);
    res.status(201).json({ success: true, media });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET all media memories (Teacher/Admin can see all, Parents see for their child only)
router.get("/gallery", async (req, res) => {
  try {
    const whereClause = {};
    if (req.user.role === "PARENT") {
      whereClause.studentId = req.user.studentId;
    } else if (req.user.role === "TEACHER") {
      whereClause.teacherId = req.user.id;
    }

    const gallery = await prisma.media.findMany({
      where: whereClause,
      include: {
        student: true,
      },
      orderBy: { uploadedAt: "desc" },
    });

    res.json({ success: true, gallery });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET media memories for a specific student (verified parent/staff)
router.get("/student/:studentId", verifyStudentAccess, async (req, res) => {
  try {
    const { studentId } = req.params;
    const media = await prisma.media.findMany({
      where: { studentId },
      orderBy: { uploadedAt: "desc" },
    });
    res.json({ success: true, media });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE media (Teacher/Admin only)
router.delete("/:id", allowRoles("TEACHER", "ADMIN"), async (req, res) => {
  try {
    const media = await prisma.media.findUnique({
      where: { id: req.params.id },
    });

    if (!media) {
      return res.status(404).json({ success: false, message: "Media not found." });
    }

    if (req.user.role === "TEACHER" && media.teacherId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Access denied. You did not upload this media." });
    }

    await prisma.media.delete({
      where: { id: req.params.id },
    });

    await logActivity(req.user.id, "MEDIA_DELETE", "Deleted media log", req);
    res.json({ success: true, message: "Media deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
