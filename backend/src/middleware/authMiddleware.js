const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "child-milestone-tracker-super-secret-key";

const prisma = require("../lib/prisma");

const authenticateToken = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

const verifyStudentAccess = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized.",
    });
  }

  if (req.user.role === "ADMIN") {
    return next();
  }

  const requestedStudentId = req.params.id || req.params.studentId || req.body.studentId || req.query.studentId || req.body.student?.id;

  if (!requestedStudentId) {
    return res.status(400).json({
      success: false,
      message: "Student ID is required.",
    });
  }

  try {
    const student = await prisma.student.findUnique({
      where: { id: requestedStudentId },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    if (req.user.role === "TEACHER") {
      if (student.teacherId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Access denied. This student is managed by another teacher.",
        });
      }
      return next();
    }

    if (req.user.role === "PARENT") {
      if (student.parentId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only access data for your own child.",
        });
      }
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Access denied.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  authenticateToken,
  verifyStudentAccess,
  JWT_SECRET,
};
