const express = require("express");
const prisma = require("../lib/prisma");
const { authenticateToken, verifyStudentAccess } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const { logActivity } = require("../lib/auditLogger");
const openai = require("../lib/openai");

const router = express.Router();

router.use(authenticateToken);

// RECORD observation (Teacher/Admin only)
router.post("/", allowRoles("TEACHER", "ADMIN"), async (req, res) => {
  try {
    const { studentId, notes, behavior, emotional, learning } = req.body;
    if (!studentId || !notes) {
      return res.status(400).json({ success: false, message: "studentId and notes are required." });
    }

    const observation = await prisma.observation.create({
      data: {
        studentId,
        teacherId: req.user.id,
        notes,
        behavior,
        emotional,
        learning,
      },
    });

    await logActivity(req.user.id, "OBSERVATION_CREATE", `Recorded observation for student ${studentId}`, req);
    res.status(201).json({ success: true, observation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET observations for a specific student (Parent/Teacher/Admin)
router.get("/student/:studentId", verifyStudentAccess, async (req, res) => {
  try {
    const { studentId } = req.params;
    const observations = await prisma.observation.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, observations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// AI Weekly Summary of Teacher observations (Teacher/Admin only)
router.post("/ai-weekly-summary", allowRoles("TEACHER", "ADMIN"), async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).json({ success: false, message: "studentId is required." });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    // Fetch observations for this student over the past 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const observations = await prisma.observation.findMany({
      where: {
        studentId,
        createdAt: { gte: oneWeekAgo },
      },
    });

    if (observations.length === 0) {
      return res.json({
        success: true,
        summary: `No observation logs recorded for ${student.name} during the past week. Please record daily logs first to summarize.`,
      });
    }

    const obsText = observations.map((o) => `- [Behavior: ${o.behavior || "N/A"}, Emotion: ${o.emotional || "N/A"}, Learning: ${o.learning || "N/A"}]: "${o.notes}"`).join("\n");

    const prompt = `
You are an expert early childhood development consultant.
Below is a list of classroom observation notes recorded by a teacher for ${student.name} over the past week.
Summarize these notes into a warm, professional, and actionable weekly developmental progress summary (1-2 paragraphs) for the child's parents. Focus on highlights, social behavior, and learning progression.

Child's Name: ${student.name}
Observations logged:
${obsText}
`;

    let summaryText = "";

    // 1. Try Gemini
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (geminiKey && geminiKey !== "your_gemini_api_key_here") {
      try {
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        if (responseText) {
          summaryText = responseText.trim();
        }
      } catch (err) {
        console.error("Gemini failed for ai-weekly-summary:", err.message);
      }
    }

    // 2. Try OpenAI
    if (!summaryText && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "your_openai_api_key_here") {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are an expert preschool director helper. Summarize teacher logs." },
            { role: "user", content: prompt }
          ],
          max_tokens: 250,
          temperature: 0.7,
        });
        if (response.choices && response.choices[0]?.message?.content) {
          summaryText = response.choices[0].message.content.trim();
        }
      } catch (err) {
        console.error("OpenAI failed for ai-weekly-summary:", err.message);
      }
    }

    // 3. Local Fallback Generator
    if (!summaryText) {
      const behaviors = [...new Set(observations.map((o) => o.behavior).filter(Boolean))];
      const emotions = [...new Set(observations.map((o) => o.emotional).filter(Boolean))];
      
      summaryText = `This week, ${student.name} displayed high engagement in learning activities. `;
      if (behaviors.length > 0) {
        summaryText += `In class, the child behaved in a very ${behaviors.join(", ").toLowerCase()} manner. `;
      }
      if (emotions.length > 0) {
        summaryText += `Overall, their emotional state was mostly ${emotions.join(", ").toLowerCase()}. `;
      }
      summaryText += `Specific highlights include progress in: ${observations.map((o) => o.learning).filter(Boolean).slice(0, 3).join(", ") || "daily routines"}. We are delighted with their milestones progression!`;
    }

    res.json({ success: true, summary: summaryText });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE observation (Teacher/Admin only)
router.delete("/:id", allowRoles("TEACHER", "ADMIN"), async (req, res) => {
  try {
    const obs = await prisma.observation.findUnique({
      where: { id: req.params.id },
    });

    if (!obs) {
      return res.status(404).json({ success: false, message: "Observation not found." });
    }

    if (req.user.role === "TEACHER" && obs.teacherId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    await prisma.observation.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true, message: "Observation deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
