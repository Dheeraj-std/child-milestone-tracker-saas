const express = require("express");
const prisma = require("../lib/prisma");
const { authenticateToken } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const { logActivity } = require("../lib/auditLogger");

const router = express.Router();

router.use(authenticateToken);

// SEND Message
router.post("/", async (req, res) => {
  try {
    const { receiverId, content, attachmentUrl } = req.body;
    if (!receiverId || !content) {
      return res.status(400).json({ success: false, message: "receiverId and content are required." });
    }

    const message = await prisma.message.create({
      data: {
        senderId: req.user.id,
        receiverId,
        content,
        attachmentUrl: attachmentUrl || null,
      },
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET conversation thread between current user and another user
router.get("/thread/:otherUserId", async (req, res) => {
  try {
    const { otherUserId } = req.params;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.user.id, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: req.user.id },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    // Mark messages sent by the other user as read
    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: req.user.id,
        read: false,
      },
      data: { read: true },
    });

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET list of conversation contacts for the current user
// Parents see their child's teacher
// Teachers see all parents linked to their students
router.get("/contacts", async (req, res) => {
  try {
    let contacts = [];

    if (req.user.role === "PARENT") {
      // Find parent student
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { student: true },
      });

      if (user?.student?.teacherId) {
        const teacher = await prisma.user.findUnique({
          where: { id: user.student.teacherId },
          select: { id: true, name: true, email: true, role: true },
        });
        if (teacher) contacts.push(teacher);
      }
    } else if (req.user.role === "TEACHER") {
      // Find all students managed by this teacher
      const students = await prisma.student.findMany({
        where: { teacherId: req.user.id },
        include: { parentUsers: true },
      });

      // Extract unique parent contacts
      const parentMap = new Map();
      students.forEach((s) => {
        s.parentUsers.forEach((p) => {
          parentMap.set(p.id, {
            id: p.id,
            name: `${p.name} (Parent of ${s.name})`,
            email: p.email,
            role: p.role,
          });
        });
      });
      contacts = Array.from(parentMap.values());
    } else if (req.user.role === "ADMIN") {
      // Admins can message any user
      contacts = await prisma.user.findMany({
        where: { id: { not: req.user.id } },
        select: { id: true, name: true, email: true, role: true },
      });
    }

    res.json({ success: true, contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// MONITOR all communications (Admin only)
router.get("/monitor", allowRoles("ADMIN"), async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      include: {
        sender: { select: { name: true, email: true, role: true } },
        receiver: { select: { name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
