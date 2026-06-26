const express = require("express");
const prisma = require("../lib/prisma");
const { authenticateToken } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const { logActivity } = require("../lib/auditLogger");

const router = express.Router();

router.use(authenticateToken);

// GET all classrooms (Admin only)
router.get("/", allowRoles("ADMIN"), async (req, res) => {
  try {
    const classrooms = await prisma.classroom.findMany({
      include: {
        teacher: true,
        students: true,
      },
    });
    res.json({ success: true, classrooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET classroom assigned to teacher
router.get("/my-classroom", allowRoles("TEACHER"), async (req, res) => {
  try {
    const classroom = await prisma.classroom.findUnique({
      where: { teacherId: req.user.id },
      include: {
        students: true,
      },
    });
    res.json({ success: true, classroom });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// CREATE classroom (Admin only)
router.post("/", allowRoles("ADMIN"), async (req, res) => {
  try {
    const { name, section, ageGroup, teacherId } = req.body;
    if (!name || !section || !ageGroup) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const classroom = await prisma.classroom.create({
      data: {
        name,
        section,
        ageGroup,
        teacherId: teacherId || null,
      },
    });

    await logActivity(req.user.id, "CLASSROOM_CREATE", `Created classroom ${name} - ${section}`, req);
    res.status(201).json({ success: true, classroom });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE classroom (Admin only)
router.put("/:id", allowRoles("ADMIN"), async (req, res) => {
  try {
    const { name, section, ageGroup, teacherId } = req.body;

    const classroom = await prisma.classroom.update({
      where: { id: req.params.id },
      data: {
        name,
        section,
        ageGroup,
        teacherId: teacherId !== undefined ? (teacherId || null) : undefined,
      },
    });

    // If teacherId is updated, update teacher's students list association (optional, based on classroom relation)
    if (teacherId) {
      // Find all students in this classroom
      const students = await prisma.student.findMany({
        where: { classroomId: req.params.id }
      });
      // Link them to the teacher
      for (const s of students) {
        await prisma.student.update({
          where: { id: s.id },
          data: { teacherId }
        });
      }
    }

    await logActivity(req.user.id, "CLASSROOM_UPDATE", `Updated classroom ${classroom.name}`, req);
    res.json({ success: true, classroom });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE classroom (Admin only)
router.delete("/:id", allowRoles("ADMIN"), async (req, res) => {
  try {
    const classroom = await prisma.classroom.delete({
      where: { id: req.params.id },
    });

    await logActivity(req.user.id, "CLASSROOM_DELETE", `Deleted classroom ${classroom.name}`, req);
    res.json({ success: true, message: "Classroom deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
