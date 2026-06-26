const prisma = require("./prisma");

const logActivity = async (userId, action, details, req = null) => {
  try {
    let ipAddress = null;
    if (req) {
      ipAddress = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    }
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        details,
        ipAddress,
      }
    });
  } catch (error) {
    console.error("Failed to write activity log:", error);
  }
};

module.exports = { logActivity };
