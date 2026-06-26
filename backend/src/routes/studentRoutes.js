const express = require("express");
const prisma = require("../lib/prisma");
const { authenticateToken, verifyStudentAccess } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// GET public list of students (for registration dropdown) - UNPROTECTED
router.get("/public", async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json({
      success: true,
      students,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

const bcrypt = require("bcryptjs");

const generateAccessCode = (studentName, parentName) => {
  const studentParts = studentName.trim().split(/\s+/);
  const studentInitials = studentParts.map(n => n[0]).slice(0, 2).join("").toUpperCase();
  const parentParts = parentName.trim().split(/\s+/);
  const parentInitials = parentParts[0] ? parentParts[0][0].toUpperCase() : "P";
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `${studentInitials}${parentInitials}-${randomDigits}`;
};

const mapStudentParent = (s, req) => {
  if (!s) return null;
  const accessCode = s.accessCode;
  const inviteLink = `http://${req?.headers?.host || "localhost:5173"}/parent-access/${accessCode}`;
  return {
    ...s,
    parentName: s.parent?.user?.name || "N/A",
    parentEmail: s.parent?.user?.email || "N/A",
    inviteLink,
  };
};

// GET all students - TEACHER & ADMIN only
router.get("/", authenticateToken, allowRoles("TEACHER", "ADMIN"), async (req, res) => {
  try {
    const { all } = req.query;
    const whereClause = {};
    if (req.user.role === "TEACHER") {
      if (all === "true") {
        whereClause.OR = [
          { teacherId: req.user.id },
          { teacherId: null },
        ];
      } else {
        whereClause.teacherId = req.user.id;
      }
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        milestones: true,
        parent: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      students: students.map(s => mapStudentParent(s, req)),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// CREATE student - TEACHER & ADMIN only
router.post("/", authenticateToken, allowRoles("TEACHER", "ADMIN"), async (req, res) => {
  try {
    const { name, age, classroom, parentName, parentEmail, accessCode } = req.body;

    if (!name || !age || !classroom || !parentName || !parentEmail) {
      return res.status(400).json({
        success: false,
        message: "Please provide student name, age, classroom, parent name, and parent email.",
      });
    }

    // Resolve classroom by name match
    const classroomMatch = await prisma.classroom.findFirst({
      where: { name: classroom },
    });

    const classroomId = classroomMatch ? classroomMatch.id : null;
    const resolvedTeacherId = classroomMatch?.teacherId 
      ? classroomMatch.teacherId 
      : (req.user.role === "TEACHER" ? req.user.id : (req.body.teacherId || null));

    // Find or create parent user and Parent record
    let parentUser = await prisma.user.findUnique({
      where: { email: parentEmail.toLowerCase().trim() },
    });

    if (!parentUser) {
      const defaultPassword = await bcrypt.hash("Parent@123", 10);
      parentUser = await prisma.user.create({
        data: {
          name: parentName,
          email: parentEmail.toLowerCase().trim(),
          password: defaultPassword,
          role: "PARENT",
          parent: {
            create: {},
          },
        },
      });
    } else {
      if (parentUser.role !== "PARENT") {
        return res.status(400).json({
          success: false,
          message: "This email is registered with a different user role.",
        });
      }
      // Ensure Parent record exists
      const parentRecord = await prisma.parent.findUnique({
        where: { userId: parentUser.id },
      });
      if (!parentRecord) {
        await prisma.parent.create({
          data: { userId: parentUser.id },
        });
      }
    }

    const finalAccessCode = accessCode ? accessCode.trim() : generateAccessCode(name, parentName);

    const student = await prisma.student.create({
      data: {
        name,
        age: Number(age),
        classroom,
        classroomId,
        parentId: parentUser.id,
        accessCode: finalAccessCode,
        growth: 0,
        teacherId: resolvedTeacherId,
      },
      include: {
        milestones: true,
        parent: {
          include: {
            user: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      student: mapStudentParent(student, req),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET student by ID - TEACHER, ADMIN, or the linked PARENT
router.get("/:id", authenticateToken, verifyStudentAccess, async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        milestones: true,
        parent: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      student: mapStudentParent(student, req),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// UPDATE student - TEACHER & ADMIN only
router.put("/:id", authenticateToken, allowRoles("TEACHER", "ADMIN"), verifyStudentAccess, async (req, res) => {
  try {
    const { name, age, classroom, parentName, parentEmail, accessCode, growth } = req.body;

    const existingStudent = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: { parent: true },
    });

    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (age !== undefined) updateData.age = Number(age);
    if (classroom !== undefined) {
      updateData.classroom = classroom;
      const classroomMatch = await prisma.classroom.findFirst({
        where: { name: classroom },
      });
      updateData.classroomId = classroomMatch ? classroomMatch.id : null;
      if (classroomMatch?.teacherId) {
        updateData.teacherId = classroomMatch.teacherId;
      }
    }
    if (accessCode !== undefined) updateData.accessCode = accessCode ? accessCode.trim() : undefined;
    if (growth !== undefined) updateData.growth = Number(growth);

    // Update parent User record if parentName or parentEmail is updated
    if (existingStudent.parentId && (parentName !== undefined || parentEmail !== undefined)) {
      const parentUpdate = {};
      if (parentName !== undefined) parentUpdate.name = parentName;
      if (parentEmail !== undefined) parentUpdate.email = parentEmail.toLowerCase().trim();

      await prisma.user.update({
        where: { id: existingStudent.parentId },
        data: parentUpdate,
      });
    }

    const student = await prisma.student.update({
      where: {
        id: req.params.id,
      },
      data: updateData,
      include: {
        milestones: true,
        parent: {
          include: {
            user: true,
          },
        },
      },
    });

    res.json({
      success: true,
      student: mapStudentParent(student, req),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// DELETE student - TEACHER & ADMIN only
router.delete("/:id", authenticateToken, allowRoles("TEACHER", "ADMIN"), verifyStudentAccess, async (req, res) => {
  try {
    await prisma.student.delete({
      where: {
        id: req.params.id,
      },
    });

    res.json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;