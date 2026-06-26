const express = require("express");
const prisma = require("../lib/prisma");
const { authenticateToken } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const { logActivity } = require("../lib/auditLogger");

const router = express.Router();

router.use(authenticateToken);

// GET all events
router.get("/", async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        rsvps: {
          include: {
            parent: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { date: "asc" },
    });
    res.json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// CREATE Event (Teacher/Admin only)
router.post("/", allowRoles("TEACHER", "ADMIN"), async (req, res) => {
  try {
    const { title, description, date, location, imageUrl } = req.body;
    if (!title || !date) {
      return res.status(400).json({ success: false, message: "Title and date are required." });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        location,
        imageUrl,
        createdById: req.user.id,
      },
    });

    await logActivity(req.user.id, "EVENT_CREATE", `Created event: ${title}`, req);
    res.status(201).json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// SUBMIT/UPDATE Event RSVP (Parent only)
router.post("/:eventId/rsvp", allowRoles("PARENT"), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status } = req.body; // YES, NO, MAYBE

    if (!status || !["YES", "NO", "MAYBE"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid RSVP status. Must be YES, NO, or MAYBE." });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found." });
    }

    const rsvp = await prisma.eventRSVP.upsert({
      where: {
        eventId_parentId: { eventId, parentId: req.user.id },
      },
      update: { status },
      create: {
        eventId,
        parentId: req.user.id,
        status,
      },
    });

    await logActivity(req.user.id, "EVENT_RSVP", `Submitted RSVP status ${status} for event ${eventId}`, req);
    res.json({ success: true, rsvp });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE Event (Teacher/Admin only)
router.delete("/:id", allowRoles("TEACHER", "ADMIN"), async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
    });

    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found." });
    }

    if (req.user.role === "TEACHER" && event.createdById !== req.user.id) {
      return res.status(403).json({ success: false, message: "Access denied. You did not create this event." });
    }

    await prisma.event.delete({
      where: { id: req.params.id },
    });

    await logActivity(req.user.id, "EVENT_DELETE", `Deleted event ${event.title}`, req);
    res.json({ success: true, message: "Event deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
