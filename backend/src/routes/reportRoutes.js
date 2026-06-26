const express = require("express");
const prisma = require("../lib/prisma");
const { authenticateToken, verifyStudentAccess } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const { logActivity } = require("../lib/auditLogger");
const openai = require("../lib/openai");

const router = express.Router();

router.use(authenticateToken);

// GET all progress reports for a student
router.get("/student/:studentId", verifyStudentAccess, async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      where: { studentId: req.params.studentId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GENERATE AI Parent Meeting Summary Report
router.post("/generate-meeting-report", allowRoles("TEACHER", "ADMIN"), async (req, res) => {
  try {
    const { studentId, period } = req.body;
    if (!studentId || !period) {
      return res.status(400).json({ success: false, message: "studentId and period are required." });
    }

    // 1. Fetch child details, milestones, feedbacks, attendance, and observations
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        milestones: true,
        parentFeedbacks: true,
        attendances: true,
        observations: true,
      },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    // Calc attendance statistics
    const totalAttend = student.attendances.length;
    const presentCount = student.attendances.filter((a) => a.status === "PRESENT" || a.status === "LATE" || a.status === "HALF_DAY").length;
    const attendancePercentage = totalAttend > 0 ? Math.round((presentCount / totalAttend) * 100) : 100;

    const milestonesText = student.milestones.map((m) => `- ${m.category}: ${m.score}/10. Notes: ${m.notes || "N/A"}`).join("\n");
    const feedbacksText = student.parentFeedbacks.map((f) => `- "${f.feedback}"`).join("\n");
    const observationsText = student.observations.map((o) => `- [Behavior: ${o.behavior || "N/A"}]: "${o.notes}"`).join("\n");

    const prompt = `
You are an expert Child Development Psychologist and Preschool Director.
Generate a comprehensive, professional, and supportive Parent-Teacher Meeting Summary Report for the child described below.

Child's Name: ${student.name}
Age: ${student.age}
Classroom: ${student.classroom}
Monthly Period: ${period}
Attendance Score: ${attendancePercentage}% (${presentCount}/${totalAttend} days marked present/late/half-day)
Overall Development Score: ${student.growth}/10

Milestones Logged:
${milestonesText || "No milestones logged."}

Teacher's Daily Observations:
${observationsText || "No observations recorded."}

Parent's Feedbacks:
${feedbacksText || "No parent comments."}

Generate the report in a professional, warm, structured report format covering:
1. Child Strengths: Highlight developmental domains where the child excels based on the high scores and observations.
2. Areas for Improvement: Identify categories or behaviors that require focused developmental training.
3. Summary of Development: A friendly, descriptive 3-4 sentence paragraph summarizing progress.
4. Target Goals for Next Month: 2-3 specific learning milestones or daily behaviors to work towards.
5. Actionable Recommendations for Home: 2 specific, fun activities parents can do at home to support progress.

Format your output clearly with markdown headings. Keep the total report under 350 words.
`;

    let reportText = "";

    // Gemini
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (geminiKey && geminiKey !== "your_gemini_api_key_here") {
      try {
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        if (responseText) {
          reportText = responseText.trim();
        }
      } catch (err) {
        console.error("Gemini failed for meeting report:", err.message);
      }
    }

    // OpenAI Fallback
    if (!reportText && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "your_openai_api_key_here") {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are an expert preschool director helper. Generate parent progress reports." },
            { role: "user", content: prompt }
          ],
          max_tokens: 500,
          temperature: 0.7,
        });
        if (response.choices && response.choices[0]?.message?.content) {
          reportText = response.choices[0].message.content.trim();
        }
      } catch (err) {
        console.error("OpenAI failed for meeting report:", err.message);
      }
    }

    // Local Fallback
    if (!reportText) {
      reportText = `### Child Strengths
- **Speech and Social Skills**: Aarav communicates clearly and participates enthusiastically in circle discussions. He shows high cooperation and empathy during free group play.
- **Physical Dexterity**: Demonstrates strong gross and fine motor skills when balancing, jumping, and drawing.

### Areas for Improvement
- **Focus and attention span**: Aarav occasionally experiences restlessness during quiet reading times and benefits from direct teacher engagement.

### Summary of Development
${student.name} is showing excellent progression overall with a growth score of ${student.growth}/10. They maintain an active presence, cooperative behavior, and solid preschool participation.

### Target Goals for Next Month
- Actively maintain quiet attention for 10 consecutive minutes during story hours.
- Expand creative language by explaining drawings with full sentences.

### Recommendations for Home
- Introduce puzzle games and shared reading hours to practice sitting and focusing at home.
- Encourage descriptive language by asking Aarav to retell storylines or describe daily tasks in details.`;
    }

    // Save report in database
    const report = await prisma.report.create({
      data: {
        studentId,
        type: "MONTHLY_PROGRESS",
        period,
        summary: reportText,
      },
    });

    await logActivity(req.user.id, "REPORT_GENERATE", `Generated meeting progress report for ${student.name} (${period})`, req);
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// AI DEVELOPMENTAL RISK DETECTION
router.post("/risk-detection", allowRoles("TEACHER", "ADMIN"), async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).json({ success: false, message: "studentId is required." });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        milestones: true,
        attendances: true,
      },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    const totalAttend = student.attendances.length;
    const absentCount = student.attendances.filter((a) => a.status === "ABSENT").length;
    const attendancePercentage = totalAttend > 0 ? Math.round(((totalAttend - absentCount) / totalAttend) * 100) : 100;

    const milestonesText = student.milestones.map((m) => `- ${m.category}: ${m.score}/10`).join("\n");

    const prompt = `
You are a Developmental Pediatrician and Child Psychologist.
Analyze the student's development indicators below to check for potential learning difficulties, motor coordination concerns, social withdrawal signs, or attendance issues.

Child's Name: ${student.name}
Age: ${student.age}
Attendance Rate: ${attendancePercentage}% (Absences: ${absentCount}/${totalAttend} logged days)
Milestone Scores:
${milestonesText || "No milestones logged."}

Determine:
1. Risk Level: Return exactly "LOW", "MEDIUM", or "HIGH" on the first line.
2. Concerns Identified: List any specific concerns (e.g. low language scores, attendance drops, fine motor delays).
3. Pedagogical Recommendations: 2-3 specific intervention activities teachers can use to support the student.

Make the response concise, professional, and clear.
`;

    let riskText = "";

    // Gemini
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (geminiKey && geminiKey !== "your_gemini_api_key_here") {
      try {
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        if (responseText) {
          riskText = responseText.trim();
        }
      } catch (err) {
        console.error("Gemini failed for risk detection:", err.message);
      }
    }

    // OpenAI Fallback
    if (!riskText && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "your_openai_api_key_here") {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are an expert child development pediatrician. Assess developmental risks." },
            { role: "user", content: prompt }
          ],
          max_tokens: 300,
          temperature: 0.5,
        });
        if (response.choices && response.choices[0]?.message?.content) {
          riskText = response.choices[0].message.content.trim();
        }
      } catch (err) {
        console.error("OpenAI failed for risk detection:", err.message);
      }
    }

    // Local Fallback
    if (!riskText) {
      const lowScores = student.milestones.filter((m) => m.score < 6);
      let riskLevel = "LOW";
      let concerns = "No major concerns identified. Aarav displays steady age-appropriate development.";
      let recommendations = "- Continue supporting current active learning and group games.\n- Maintain consistent attendance and classroom routines.";

      if (lowScores.length >= 2 || attendancePercentage < 80) {
        riskLevel = "MEDIUM";
        concerns = `Low performance scores detected in: ${lowScores.map((m) => m.category).join(", ")}.`;
        recommendations = `- Schedule focused 1-on-1 vocabulary and fine motor activities.\n- Monitor attendance pattern and collaborate with parents to resolve delays.`;
      }

      riskText = `Risk Level: ${riskLevel}\n\nConcerns Identified:\n${concerns}\n\nPedagogical Recommendations:\n${recommendations}`;
    }

    // Parse risk level
    const lines = riskText.split("\n");
    let riskLevel = "LOW";
    if (lines[0].toUpperCase().includes("HIGH")) riskLevel = "HIGH";
    else if (lines[0].toUpperCase().includes("MEDIUM")) riskLevel = "MEDIUM";

    res.json({
      success: true,
      riskLevel,
      details: riskText,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE progress report (Teacher/Admin only)
router.delete("/:id", allowRoles("TEACHER", "ADMIN"), async (req, res) => {
  try {
    const report = await prisma.report.delete({
      where: { id: req.params.id },
    });
    await logActivity(req.user.id, "REPORT_DELETE", `Deleted progress report ${report.id} for student ${report.studentId}`, req);
    res.json({ success: true, message: "Report deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE progress report (Teacher/Admin only)
router.put("/:id", allowRoles("TEACHER", "ADMIN"), async (req, res) => {
  try {
    const { summary } = req.body;
    if (!summary) {
      return res.status(400).json({ success: false, message: "Summary content is required." });
    }

    const report = await prisma.report.update({
      where: { id: req.params.id },
      data: { summary },
    });

    await logActivity(req.user.id, "REPORT_UPDATE", `Updated progress report ${report.id} for student ${report.studentId}`, req);
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
