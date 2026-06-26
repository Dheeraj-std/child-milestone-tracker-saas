const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // 1. Clean the database in correct order
  await prisma.activityLog.deleteMany({});
  await prisma.eventRSVP.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.observation.deleteMany({});
  await prisma.goal.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.media.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.classroom.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.parentFeedback.deleteMany({});
  await prisma.milestone.deleteMany({});
  await prisma.parent.deleteMany({});
  await prisma.teacher.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Database cleared.");

  // 2. Hash passwords
  const hashedTeacherPassword = await bcrypt.hash("password123", 10);
  const hashedAdminPassword = await bcrypt.hash("Admin@123", 10);
  const hashedParentPassword1 = await bcrypt.hash("aarav123", 10);
  const hashedParentPassword2 = await bcrypt.hash("ananya123", 10);
  const hashedParentPassword3 = await bcrypt.hash("diya123", 10);

  // 3. Create teacher user & Teacher profile
  const teacherUser = await prisma.user.create({
    data: {
      name: "Sarah Jenkins",
      email: "teacher@tracker.com",
      password: hashedTeacherPassword,
      role: "TEACHER",
      teacher: {
        create: {
          classroom: "Sunflowers",
          employeeId: "EMP-001",
        }
      }
    }
  });

  // 4. Create admin user
  const adminUser = await prisma.user.create({
    data: {
      name: "System Administrator",
      email: "admin@intellitots.com",
      password: hashedAdminPassword,
      role: "ADMIN",
    }
  });

  // 5. Create parents
  const parentUser1 = await prisma.user.create({
    data: {
      name: "Rohan Patel",
      email: "parent@tracker.com",
      password: hashedParentPassword1,
      role: "PARENT",
      parent: {
        create: {}
      }
    }
  });

  const parentUser2 = await prisma.user.create({
    data: {
      name: "Meera Sharma",
      email: "meera@tracker.com",
      password: hashedParentPassword2,
      role: "PARENT",
      parent: {
        create: {}
      }
    }
  });

  const parentUser3 = await prisma.user.create({
    data: {
      name: "Vikram Rao",
      email: "vikram@tracker.com",
      password: hashedParentPassword3,
      role: "PARENT",
      parent: {
        create: {}
      }
    }
  });

  console.log("Teacher, Admin, and Parent users seeded.");

  // 6. Create Classrooms (referencing teacher User ID)
  const sunflowerClass = await prisma.classroom.create({
    data: {
      name: "Sunflowers",
      section: "Pre-K A",
      ageGroup: "4-5 years",
      teacherId: teacherUser.id,
    }
  });

  const butterflyClass = await prisma.classroom.create({
    data: {
      name: "Butterflies",
      section: "Toddlers B",
      ageGroup: "2-3 years",
    }
  });

  console.log("Classrooms seeded.");

  // 7. Create demo students linked to Classrooms, Teacher, and Parents
  const student1 = await prisma.student.create({
    data: {
      name: "Aarav Patel",
      age: 4,
      classroom: "Sunflowers",
      classroomId: sunflowerClass.id,
      parentId: parentUser1.id,
      teacherId: teacherUser.id,
      growth: 8.5,
      accessCode: "AAP-7821",
      milestones: {
        create: [
          { category: "Speech", score: 8, notes: "Can tell complete short stories and name objects clearly." },
          { category: "Social Skills", score: 9, notes: "Enjoys playing with other kids and shares toys well." },
          { category: "Creativity", score: 8, notes: "Identifies primary colors and shapes accurately." },
          { category: "Motor Skills", score: 9, notes: "Can hop on one foot and catch a bounced ball." }
        ]
      },
      parentFeedbacks: {
        create: [
          { feedback: "Aarav is speaking in much longer sentences at home! Very happy with his progress." },
          { feedback: "He is sleeping better and talks about his classroom friends every day." }
        ]
      }
    }
  });

  const student2 = await prisma.student.create({
    data: {
      name: "Ananya Sharma",
      age: 3,
      classroom: "Butterflies",
      classroomId: butterflyClass.id,
      parentId: parentUser2.id,
      teacherId: teacherUser.id,
      growth: 7.3,
      accessCode: "ASS-4591",
      milestones: {
        create: [
          { category: "Speech", score: 7, notes: "Speaks simple 3-4 word phrases." },
          { category: "Social Skills", score: 6, notes: "Sometimes shy around new kids, but warms up quickly." },
          { category: "Creativity", score: 8, notes: "Great at solving simple puzzles and sorting blocks." },
          { category: "Motor Skills", score: 8, notes: "Can run easily and kick a ball forward." }
        ]
      },
      parentFeedbacks: {
        create: [
          { feedback: "Ananya is starting to share her toys more at home." }
        ]
      }
    }
  });

  const student3 = await prisma.student.create({
    data: {
      name: "Diya Rao",
      age: 5,
      classroom: "Sunflowers",
      classroomId: sunflowerClass.id,
      parentId: parentUser3.id,
      teacherId: teacherUser.id,
      growth: 9.3,
      accessCode: "DRV-6184",
      milestones: {
        create: [
          { category: "Speech", score: 10, notes: "Excellent vocabulary. Speaks fluently and asks complex questions." },
          { category: "Social Skills", score: 9, notes: "Highly cooperative. Frequently helps younger peers." },
          { category: "Creativity", score: 9, notes: "Can count up to 30 and write basic letters." },
          { category: "Motor Skills", score: 9, notes: "Exceptional drawing skills, holds pencil correctly." }
        ]
      }
    }
  });

  console.log("Students, milestones, and feedback seeded.");

  // 8. Create Attendance logs (Past 5 days)
  const statuses = ["PRESENT", "PRESENT", "PRESENT", "LATE", "PRESENT"];
  const dates = ["2026-06-12", "2026-06-15", "2026-06-16", "2026-06-17", "2026-06-18"];
  
  for (let i = 0; i < dates.length; i++) {
    await prisma.attendance.create({
      data: {
        studentId: student1.id,
        teacherId: teacherUser.id,
        date: dates[i],
        status: statuses[i],
        remarks: statuses[i] === "LATE" ? "Arrived 15 minutes late due to traffic." : "On time.",
      }
    });

    await prisma.attendance.create({
      data: {
        studentId: student2.id,
        teacherId: teacherUser.id,
        date: dates[i],
        status: i === 2 ? "ABSENT" : "PRESENT",
        remarks: i === 2 ? "Fever at home." : "Active participation.",
      }
    });
  }

  console.log("Attendance records seeded.");

  // 9. Create Media files (memories)
  await prisma.media.createMany({
    data: [
      {
        studentId: student1.id,
        teacherId: teacherUser.id,
        url: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=500&q=80",
        caption: "Aarav building a tall wooden castle during block time!",
        category: "Learning",
      },
      {
        studentId: student1.id,
        teacherId: teacherUser.id,
        url: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=500&q=80",
        caption: "Painting a beautiful sunflower in the art workshop.",
        category: "Artwork",
      },
      {
        studentId: student2.id,
        teacherId: teacherUser.id,
        url: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500&q=80",
        caption: "Ananya solving the wooden animals puzzle successfully.",
        category: "Activity",
      }
    ]
  });

  console.log("Media records seeded.");

  // 10. Create Goals
  await prisma.goal.createMany({
    data: [
      {
        studentId: student1.id,
        teacherId: teacherUser.id,
        title: "Speak in complete sentences of 6+ words",
        status: "IN_PROGRESS",
        progress: 60,
        targetDate: new Date("2026-07-15"),
      },
      {
        studentId: student1.id,
        teacherId: teacherUser.id,
        title: "Tie shoe laces independently",
        status: "PENDING",
        progress: 10,
        targetDate: new Date("2026-08-01"),
      },
      {
        studentId: student2.id,
        teacherId: teacherUser.id,
        title: "Share sharing blocks during team play",
        status: "COMPLETED",
        progress: 100,
        targetDate: new Date("2026-06-15"),
        completedAt: new Date("2026-06-14"),
      }
    ]
  });

  console.log("Goals seeded.");

  // 11. Create Observations
  await prisma.observation.createMany({
    data: [
      {
        studentId: student1.id,
        teacherId: teacherUser.id,
        notes: "Aarav cooperated very well with Aarush during Lego play today. He shared blocks cheerfully.",
        behavior: "Cooperative",
        emotional: "Happy",
        learning: "Lego Construction",
      },
      {
        studentId: student1.id,
        teacherId: teacherUser.id,
        notes: "Listened attentively to the 'Little Red Riding Hood' story and was the first to answer comprehension questions.",
        behavior: "Attentive",
        emotional: "Excited",
        learning: "Reading Comprehension",
      }
    ]
  });

  console.log("Observations seeded.");

  // 12. Create Messages (using User IDs)
  await prisma.message.createMany({
    data: [
      {
        senderId: parentUser1.id,
        receiverId: teacherUser.id,
        content: "Hello Ms. Sarah, how has Aarav been doing with his sharing goals this week?",
        createdAt: new Date("2026-06-16T14:30:00Z"),
      },
      {
        senderId: teacherUser.id,
        receiverId: parentUser1.id,
        content: "Hi Rohan! Aarav did beautifully today. He actively shared his building blocks with Aarush and was extremely cooperative.",
        read: true,
        createdAt: new Date("2026-06-16T16:15:00Z"),
      }
    ]
  });

  console.log("Messages seeded.");

  // 13. Create Events & RSVPs (using User IDs)
  const event1 = await prisma.event.create({
    data: {
      title: "Preschool Summer Art Festival",
      description: "Come witness the amazing paintings, clay crafts, and creative work designed by our little creators!",
      date: new Date("2026-06-25T10:00:00Z"),
      location: "Intellitots School Hall",
      imageUrl: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&q=80",
      createdById: adminUser.id,
    }
  });

  await prisma.eventRSVP.create({
    data: {
      eventId: event1.id,
      parentId: parentUser1.id,
      status: "YES",
    }
  });

  console.log("Events & RSVPs seeded.");

  // 14. Log initial seed action in ActivityLog
  await prisma.activityLog.create({
    data: {
      userId: adminUser.id,
      action: "DATABASE_SEED",
      details: "Completed database seeding with IntelliTots school configurations.",
      ipAddress: "127.0.0.1",
    }
  });

  console.log("Activity log written.");
  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
