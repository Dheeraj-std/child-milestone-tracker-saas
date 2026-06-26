const prisma = require("./prisma");

const createNotification = async (userId, title, message, type) => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
      }
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
};

module.exports = { createNotification };
