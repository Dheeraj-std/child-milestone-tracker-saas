const express = require("express");
const { authenticateToken, verifyStudentAccess } = require("../middleware/authMiddleware");
const openai = require("../lib/openai");
const prisma = require("../lib/prisma");

const router = express.Router();

router.post("/suggestions", authenticateToken, verifyStudentAccess, async (req, res) => {
  try {
    const { student } = req.body;

    if (!student || !student.name || !student.id) {
      return res.status(400).json({
        success: false,
        message: "Student details are required to generate suggestions.",
      });
    }

    // 1. Fetch parent feedbacks from database
    const feedbacks = await prisma.parentFeedback.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const milestones = student.milestones || [];
    let suggestion = "";

    const milestonesText = milestones.length > 0
      ? milestones.map((m) => `- Category: ${m.category}, Score: ${m.score}/10, Notes: ${m.notes || "None"}`).join("\n")
      : "No developmental milestones logged yet.";

    const feedbackText = feedbacks.length > 0
      ? feedbacks.map((f) => `- "${f.feedback}"`).join("\n")
      : "No parent feedback comments logged yet.";

    const prompt = `
Analyze the child's milestones, feedback, and growth data. Generate actionable recommendations for parents and teachers.

Child Name: ${student.name}
Age: ${student.age}
Classroom: ${student.classroom}
Growth Score: ${student.growth || 0}/10

Milestones logged:
${milestonesText}

Parent feedback comments:
${feedbackText}

Format your response as a concise, friendly, and actionable paragraph (under 120 words total) outlining clear advice for both school and home activities.
`;

    // 2. Attempt real Gemini call if GEMINI_API_KEY or GOOGLE_API_KEY is configured
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (geminiKey && geminiKey !== "your_gemini_api_key_here") {
      try {
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        if (responseText) {
          suggestion = responseText.trim();
        }
      } catch (geminiError) {
        console.error("Gemini request failed, trying OpenAI next:", geminiError.message);
      }
    }

    // 3. Attempt OpenAI call if API Key is configured and Gemini was not used or failed
    if (!suggestion && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "your_openai_api_key_here") {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are an expert child development psychologist and early education consultant. Your goal is to analyze child milestones, parent feedback, and growth metrics to provide actionable development insights."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 200,
          temperature: 0.7,
        });

        if (response.choices && response.choices[0]?.message?.content) {
          suggestion = response.choices[0].message.content.trim();
        }
      } catch (openAiError) {
        console.error("OpenAI request failed, falling back to local generator:", openAiError.message);
      }
    }

    // 3. Fallback generator if OpenAI is unavailable or fails
    if (!suggestion) {
      if (milestones.length === 0) {
        suggestion = `${student.name} is just beginning their developmental tracker. Encourage creative drawing activities, structured reading sessions, and collaborative group play.`;
      } else {
        const avgScore = milestones.reduce((sum, m) => sum + m.score, 0) / milestones.length;
        const lowMilestone = milestones.find((m) => m.score < 6);

        suggestion = `${student.name} is progressing well with an overall growth score of ${student.growth || 0}/10. `;
        if (lowMilestone) {
          suggestion += `To support progress in '${lowMilestone.category}', try focused daily tasks (e.g. matching exercises or collaborative games). `;
        } else {
          suggestion += `Excellent development is shown across all categories. We recommend introducing advanced creative play and peer-focused group activities. `;
        }

        if (feedbacks.length > 0) {
          suggestion += `Based on parent comments about home progress, continue aligning classroom activities with parent observations.`;
        }
      }
    }

    res.json({
      success: true,
      suggestion,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Generate professional observation notes for a milestone category and score
router.post("/generate-notes", authenticateToken, async (req, res) => {
  try {
    const { category, score, studentId } = req.body;

    if (!category || score === undefined) {
      return res.status(400).json({
        success: false,
        message: "Category and score are required.",
      });
    }

    let studentName = "the student";
    if (studentId) {
      const student = await prisma.student.findUnique({
        where: { id: studentId }
      });
      if (student) {
        if (req.user.role === "TEACHER" && student.teacherId !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: "Access denied. Target student is managed by another teacher."
          });
        }
        studentName = student.name.split(" ")[0]; // Use first name for a natural tone
      }
    }

    const prompt = `
Generate a professional, encouraging, and detailed classroom observation note (exactly 1-2 sentences) for a preschool child developmental milestone report.

Child's Name: ${studentName}
Skill Category: ${category}
Performance Score: ${score}/10

The note should describe typical behaviors observed in a classroom setting corresponding to a score of ${score}/10 in the domain of ${category}. Do not mention the numeric score inside the note. Make it look like a teacher's real note.
`;

    let notesText = "";

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
          notesText = responseText.trim().replace(/^["']|["']$/g, '');
        }
      } catch (geminiError) {
        console.error("Gemini failed for generate-notes:", geminiError.message);
      }
    }

    // OpenAI fallback
    if (!notesText && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "your_openai_api_key_here") {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are an early education teacher helper. Generate professional, descriptive observation notes." },
            { role: "user", content: prompt }
          ],
          max_tokens: 100,
          temperature: 0.7,
        });
        if (response.choices && response.choices[0]?.message?.content) {
          notesText = response.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
        }
      } catch (openAiError) {
        console.error("OpenAI failed for generate-notes:", openAiError.message);
      }
    }

    // Local fallback
    if (!notesText) {
      const templates = {
        Speech: [
          `${studentName} expresses ideas clearly using full sentences and actively participates in classroom discussions.`,
          `${studentName} uses age-appropriate vocabulary and communicates well with peers, though sometimes needs prompting to speak louder.`,
          `${studentName} communicates needs effectively but is working on pronouncing multi-syllable words clearly during circle time.`
        ],
        "Motor Skills": [
          `${studentName} demonstrates excellent coordination during physical play, easily balancing and hopping on one foot.`,
          `${studentName} shows good fine motor control when using scissors and writing utensils, building complex block structures.`,
          `${studentName} participates enthusiastically in gross motor activities, showing steady progress in catching and throwing balls.`
        ],
        "Social Skills": [
          `${studentName} works wonderfully in group activities, sharing materials generously and showing empathy towards peers.`,
          `${studentName} initiates cooperative play and resolves minor conflicts independently with classroom friends.`,
          `${studentName} is making great progress in taking turns and waiting patiently during structured group games.`
        ],
        Creativity: [
          `${studentName} shows high engagement in art activities, displaying a vivid imagination and unique color choices.`,
          `${studentName} enjoys storytelling and role-playing games, inventing creative scenarios during free play.`,
          `${studentName} displays creative problem-solving skills when constructing puzzles or designing clay models.`
        ],
        "Attention Span": [
          `${studentName} stays focused on independent tasks for extended periods and transitions smoothly between activities.`,
          `${studentName} shows good attention during storytime, listening quietly and answering questions about the plot.`,
          `${studentName} is learning to filter out classroom distractions to complete worksheets with encouraging focus.`
        ],
        Reading: [
          `${studentName} displays strong print awareness, identifying letters and predicting story outcomes based on pictures.`,
          `${studentName} is highly interested in books, pointing out familiar words and sounding out letters eagerly.`,
          `${studentName} shows great progress in phonics, naming letter sounds and matching them to pictures.`
        ],
        "Classroom Participation": [
          `${studentName} is an active participant in all class activities, eagerly raising their hand to answer questions.`,
          `${studentName} contributes constructively to group discussions and displays positive attitude during cleanup.`,
          `${studentName} participates well in group tasks, though occasionally benefits from direct prompts to join structured circles.`
        ]
      };

      const categoryTemplates = templates[category] || templates["Speech"];
      const index = Math.min(Math.floor((10 - Number(score)) / 3.4), categoryTemplates.length - 1);
      notesText = categoryTemplates[Math.max(0, index)];
    }

    res.json({
      success: true,
      notes: notesText
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Generate professional daily journal logs
router.post("/generate-journal-notes", authenticateToken, async (req, res) => {
  try {
    const { category, behavior, emotional, studentId } = req.body;

    if (!category || !behavior || !emotional) {
      return res.status(400).json({
        success: false,
        message: "Category, behavior, and emotional state are required.",
      });
    }

    let studentName = "the student";
    if (studentId) {
      const student = await prisma.student.findUnique({
        where: { id: studentId }
      });
      if (student) {
        studentName = student.name.split(" ")[0];
      }
    }

    const prompt = `
Generate a professional, encouraging, and detailed daily classroom journal observation note (exactly 1-2 sentences) for a preschool child report.

Child's Name: ${studentName}
Development Category: ${category}
Observed Behavior State: ${behavior}
Observed Emotional State: ${emotional}

The note should describe typical behaviors observed in a classroom setting corresponding to a child who was ${behavior.toLowerCase()} and feeling ${emotional.toLowerCase()} during a ${category.toLowerCase()} activity. Do not use overly negative language; describe RESTLESS or DISTRACTED behavior constructively (e.g. needing direction or transitions). Make it sound like a teacher's real daily log entry.
`;

    let notesText = "";

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
          notesText = responseText.trim().replace(/^["']|["']$/g, '');
        }
      } catch (geminiError) {
        console.error("Gemini failed for generate-journal-notes:", geminiError.message);
      }
    }

    // OpenAI fallback
    if (!notesText && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "your_openai_api_key_here") {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are an early education teacher helper. Generate daily journal notes." },
            { role: "user", content: prompt }
          ],
          max_tokens: 100,
          temperature: 0.7,
        });
        if (response.choices && response.choices[0]?.message?.content) {
          notesText = response.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
        }
      } catch (openAiError) {
        console.error("OpenAI failed for generate-journal-notes:", openAiError.message);
      }
    }

    // Local fallback templates
    if (!notesText) {
      const templates = {
        COGNITIVE: {
          COOPERATIVE: `${studentName} was highly cooperative and focused during the math game, enthusiastically grouping shapes and demonstrating excellent problem-solving.`,
          QUIET: `${studentName} worked quietly and thoughtfully on puzzle matching, showing deep concentration and good analytical skills.`,
          RESTLESS: `${studentName} showed curiosity in cognitive tasks but became slightly restless, benefiting from active redirection to keep focus.`,
          DISTRACTED: `${studentName} is working on matching concepts, though was occasionally distracted today during independent group tasks.`,
        },
        MOTOR: {
          COOPERATIVE: `${studentName} worked wonderfully with peers during fine motor activities, building complex structures with colorful playdough.`,
          QUIET: `${studentName} worked quietly and with great precision during drawing and cutting tasks, demonstrating steady fine-motor progress.`,
          RESTLESS: `${studentName} showed high energy during gross-motor playground play, working on balancing with enthusiasm.`,
          DISTRACTED: `${studentName} participated in hand-eye coordination games, though benefit from simple prompts to stay on task.`,
        },
        SPEECH: {
          COOPERATIVE: `${studentName} was very talkative and cooperative during circle time, speaking in full sentences to describe their drawing.`,
          QUIET: `${studentName} listened quietly to the story, showing great vocabulary understanding, though preferred to answer questions in a soft tone.`,
          RESTLESS: `${studentName} spoke eagerly but was restless during sitting times, excited to share stories with friends.`,
          DISTRACTED: `${studentName} showed developing speech patterns but was distracted during pronunciation practice by classroom play.`,
        },
        SOCIAL: {
          COOPERATIVE: `${studentName} displayed outstanding sharing and cooperation during sandbox games, helping peers construct a fortress.`,
          QUIET: `${studentName} engaged in quiet parallel play, nicely sharing space and toys with class partners.`,
          RESTLESS: `${studentName} was energetic and excited during peer play, working on waiting for their turn during board games.`,
          DISTRACTED: `${studentName} is working on cooperative play routines, though benefited from educator guidance to avoid distractions.`,
        },
        EMOTIONAL: {
          COOPERATIVE: `${studentName} appeared happy and calm today, comfortably transition between classroom activities and helping others.`,
          QUIET: `${studentName} sat quietly and calmly during meditation minutes, showing stable self-regulation skills.`,
          RESTLESS: `${studentName} was excited and active today, showing high energy and needing light redirection during relaxation periods.`,
          DISTRACTED: `${studentName} is working on emotional regulation, showing a positive mood but easily distracted by neighboring circles.`,
        }
      };

      const catTemplates = templates[category] || templates["COGNITIVE"];
      notesText = catTemplates[behavior] || `${studentName} participated in ${category.toLowerCase()} activities, showing a ${emotional.toLowerCase()} mood.`;
    }

    res.json({
      success: true,
      notes: notesText
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;