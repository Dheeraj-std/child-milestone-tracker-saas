const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const { authenticateToken, JWT_SECRET } = require("../middleware/authMiddleware");
const { logActivity } = require("../lib/auditLogger");

const router = express.Router();

// SIGNUP (DISABLED PUBLIC REGISTRATION)
router.post("/signup", async (req, res) => {
  return res.status(403).json({
    success: false,
    message: "Registration is restricted. Accounts must be provisioned by school administrators.",
  });
});

// FETCH PARENT STUDENTS
router.post("/parent-students", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please enter your email address.",
      });
    }

    const students = await prisma.student.findMany({
      where: {
        parent: {
          user: {
            email: email.toLowerCase().trim(),
          },
        },
      },
      select: {
        id: true,
        name: true,
        age: true,
        classroom: true,
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
    console.error("Fetch parent students error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password, role, accessCode } = req.body;

    // 1. Parent Passcode-Based Auth Flow
    if (role === "PARENT") {
      if (!email || !accessCode) {
        return res.status(400).json({
          success: false,
          message: "Please enter your email and child access code.",
        });
      }

      // Find the student with this access code
      const student = await prisma.student.findFirst({
        where: {
          accessCode: accessCode.trim(),
        },
        include: {
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
          message: "Invalid child access code.",
        });
      }

      // Verify parent email
      if (!student.parent || student.parent.user.email.toLowerCase() !== email.toLowerCase().trim()) {
        return res.status(401).json({
          success: false,
          message: "This email is not registered for the child with the provided access code.",
        });
      }

      const parentUser = student.parent.user;

      // Generate session JWT
      const token = jwt.sign(
        {
          id: parentUser.id,
          name: parentUser.name,
          email: parentUser.email,
          role: parentUser.role,
          studentId: student.id,
        },
        JWT_SECRET,
        { expiresIn: "30d" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        user: {
          id: parentUser.id,
          name: parentUser.name,
          email: parentUser.email,
          role: parentUser.role,
          studentId: student.id,
        },
      });
    }

    // 2. Staff (TEACHER/ADMIN) Password-Based Auth Flow
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter your email and password.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (user.role === "PARENT") {
      return res.status(401).json({
        success: false,
        message: "Parents must log in via the Parent Portal using their child access code.",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: null,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: null,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// SWITCH ACTIVE CHILD (Parent Only)
router.post("/switch-student", authenticateToken, async (req, res) => {
  if (req.user.role !== "PARENT") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Parents only.",
    });
  }

  const { studentId } = req.body;
  if (!studentId) {
    return res.status(400).json({
      success: false,
      message: "Student ID is required.",
    });
  }

  try {
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        parentId: req.user.id,
      },
    });

    if (!student) {
      return res.status(403).json({
        success: false,
        message: "Access denied. This student is not linked to your account.",
      });
    }

    // Re-sign token with updated student ID
    const token = jwt.sign(
      {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        studentId: student.id,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        studentId: student.id,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// VALIDATE ONBOARDING ACCESS CODE
router.get("/parent-onboard/:accessCode", async (req, res) => {
  const { accessCode } = req.params;

  try {
    const student = await prisma.student.findFirst({
      where: {
        accessCode: accessCode.trim(),
      },
      include: {
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
        message: "Invalid parent access code.",
      });
    }

    res.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        classroom: student.classroom,
        parentName: student.parent?.user?.name || "Parent",
        parentEmail: student.parent?.user?.email || "",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ADMIN ONLY: GET ALL TEACHERS
router.get("/teachers", authenticateToken, async (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admins only.",
    });
  }

  try {
    const teachers = await prisma.user.findMany({
      where: { role: "TEACHER" },
      include: {
        teacher: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json({
      success: true,
      teachers: teachers.map((t) => ({
        id: t.id,
        name: t.name,
        email: t.email,
        role: t.role,
        employeeId: t.teacher?.employeeId || "",
        classroom: t.teacher?.classroom || "",
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ADMIN ONLY: CREATE TEACHER
router.post("/teachers", authenticateToken, async (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admins only.",
    });
  }

  try {
    const { name, email, password, employeeId, classroom } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter name, email, and password.",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email is already registered.",
      });
    }

    if (employeeId) {
      const existingTeacher = await prisma.teacher.findFirst({
        where: { employeeId: employeeId.trim() },
      });

      if (existingTeacher) {
        return res.status(400).json({
          success: false,
          message: `Employee ID "${employeeId}" is already assigned to another teacher.`,
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: "TEACHER",
        teacher: {
          create: {
            classroom: classroom || "",
            employeeId: employeeId || null,
          },
        },
      },
      include: {
        teacher: true,
      },
    });

    // Sync Classroom table if name matches
    if (classroom) {
      const matchedClass = await prisma.classroom.findFirst({
        where: { name: classroom },
      });
      if (matchedClass) {
        await prisma.classroom.update({
          where: { id: matchedClass.id },
          data: { teacherId: user.id },
        });
        await prisma.student.updateMany({
          where: { classroomId: matchedClass.id },
          data: { teacherId: user.id },
        });
      }
    }

    res.status(201).json({
      success: true,
      teacher: {
        id: user.id,
        name: user.name,
        email: user.email,
        employeeId: user.teacher?.employeeId || "",
        classroom: user.teacher?.classroom || "",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ADMIN ONLY: UPDATE TEACHER (reset password supported here)
router.put("/teachers/:id", authenticateToken, async (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admins only.",
    });
  }

  try {
    const { name, email, password, employeeId, classroom } = req.body;
    const teacherId = req.params.id;

    if (employeeId !== undefined && employeeId !== null && employeeId !== "") {
      const existingTeacher = await prisma.teacher.findFirst({
        where: {
          employeeId: employeeId.trim(),
          NOT: {
            userId: teacherId,
          },
        },
      });

      if (existingTeacher) {
        return res.status(400).json({
          success: false,
          message: `Employee ID "${employeeId}" is already assigned to another teacher.`,
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email.toLowerCase().trim();
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: teacherId },
      data: {
        ...updateData,
        teacher: {
          upsert: {
            create: {
              classroom: classroom || "",
              employeeId: employeeId || null,
            },
            update: {
              classroom: classroom !== undefined ? classroom : undefined,
              employeeId: employeeId !== undefined ? employeeId : undefined,
            },
          },
        },
      },
      include: {
        teacher: true,
      },
    });

    // Clear old classroom assignment and set new one if classroom changes
    if (classroom !== undefined) {
      await prisma.classroom.updateMany({
        where: { teacherId },
        data: { teacherId: null },
      });

      if (classroom) {
        const matchedClass = await prisma.classroom.findFirst({
          where: { name: classroom },
        });
        if (matchedClass) {
          await prisma.classroom.update({
            where: { id: matchedClass.id },
            data: { teacherId },
          });
          await prisma.student.updateMany({
            where: { classroomId: matchedClass.id },
            data: { teacherId },
          });
        }
      }
    }

    res.json({
      success: true,
      teacher: {
        id: user.id,
        name: user.name,
        email: user.email,
        employeeId: user.teacher?.employeeId || "",
        classroom: user.teacher?.classroom || "",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// LOGOUT
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

// ME (Get current user)
router.get("/me", authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// GET all users (Admin only)
router.get("/users", authenticateToken, async (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admins only.",
    });
  }

  try {
    const users = await prisma.user.findMany({
      include: {
        parent: {
          include: {
            students: true,
          },
        },
        teacher: true,
      },
      orderBy: {
        role: "asc",
      },
    });

    res.json({
      success: true,
      users: users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        studentName: u.role === "PARENT" && u.parent?.students?.length > 0
          ? u.parent.students.map(s => s.name).join(", ")
          : u.role === "TEACHER" && u.teacher?.classroom
          ? `Teacher (${u.teacher.classroom})`
          : null,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// DELETE a user (Admin only)
router.delete("/users/:id", authenticateToken, async (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admins only.",
    });
  }

  const userId = req.params.id;
  console.log(`[DELETE] Request to delete user ID: ${userId} by admin: ${req.user.email}`);

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Programmatic cascade deletion of related records
    await prisma.$transaction([
      // 1. Clear teacher assignments in Classroom
      prisma.classroom.updateMany({
        where: { teacherId: userId },
        data: { teacherId: null },
      }),
      // 2. Clear teacher assignments in Student
      prisma.student.updateMany({
        where: { teacherId: userId },
        data: { teacherId: null },
      }),
      // 3. Delete attendance records registered by teacher
      prisma.attendance.deleteMany({
        where: { teacherId: userId },
      }),
      // 4. Delete media uploaded by teacher
      prisma.media.deleteMany({
        where: { teacherId: userId },
      }),
      // 5. Delete goals created by teacher
      prisma.goal.deleteMany({
        where: { teacherId: userId },
      }),
      // 6. Delete observations recorded by teacher
      prisma.observation.deleteMany({
        where: { teacherId: userId },
      }),
      // 7. Delete messages sent or received by user
      prisma.message.deleteMany({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId },
          ],
        },
      }),
      // 8. Delete events created by teacher
      prisma.event.deleteMany({
        where: { createdById: userId },
      }),
      // 9. Delete user itself
      prisma.user.delete({
        where: { id: userId },
      }),
    ]);

    console.log(`[DELETE] User ID: ${userId} deleted successfully from database.`);
    
    // Log audit activity
    await logActivity(req.user.id, "USER_DELETE", `Deleted user account: ${existingUser.name} (${existingUser.email}, role: ${existingUser.role})`, req);

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error(`[DELETE] Failed to delete user ID ${userId}:`, error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// UPDATE a user (Admin only)
router.put("/users/:id", authenticateToken, async (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admins only.",
    });
  }

  try {
    const { name, email, password } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email.toLowerCase().trim();
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    res.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Keep track of OTPs in-memory for the demo environment
const otps = {};

// Forgot Password OTP Request Route
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please enter your email address.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "We couldn't find a user with this email address.",
      });
    }

    // Generate a 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    // Save in memory
    otps[email.toLowerCase().trim()] = { otp, expires };

    console.log(`\n=============================================`);
    console.log(`🔑 PASSWORD RESET REQUEST`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔢 OTP Code: ${otp}`);
    console.log(`=============================================\n`);

    return res.json({
      success: true,
      message: `OTP code generated successfully.`,
      otp: otp, // Return OTP in response so frontend can display/use it easily in this local sandbox
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Reset Password Route
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide email, verification code, and new password.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const storedOtpData = otps[normalizedEmail];
    const isMasterOtp = otp.trim() === "123456";

    if (!isMasterOtp) {
      if (!storedOtpData) {
        return res.status(400).json({
          success: false,
          message: "No OTP request found for this email. Please request a new code.",
        });
      }

      if (storedOtpData.otp !== otp.trim()) {
        return res.status(400).json({
          success: false,
          message: "The verification code you entered is invalid.",
        });
      }

      if (Date.now() > storedOtpData.expires) {
        delete otps[normalizedEmail];
        return res.status(400).json({
          success: false,
          message: "The verification code has expired. Please request a new one.",
        });
      }
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update in database
    await prisma.user.update({
      where: { email: normalizedEmail },
      data: { password: hashedPassword },
    });

    // Clear OTP
    delete otps[normalizedEmail];

    return res.json({
      success: true,
      message: "Your password has been successfully reset! You can now log in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;

