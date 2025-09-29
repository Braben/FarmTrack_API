const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Create a new reminder
const createReminder = async (req, res) => {
  const { farmId } = req.params;
  const { title, description, date, time } = req.body;
  const userId = req.user.id; // Authenticated user's ID
  try {
    // Check if the farm belongs to the authenticated user
    const farm = await prisma.farm.findUnique({
      where: { id: parseInt(farmId), userId: userId },
    });
    if (!farm) {
      return res.status(404).json({ error: "Farm not found or access denied" });
    }
    const newReminder = await prisma.reminder.create({
      data: {
        title,
        description,
        date: new Date(date),
        time,
        farmId: parseInt(farmId),
        userId: userId, // Associate reminder with the authenticated user
      },
    });

    // Simulate sending notification (e.g., email or SMS)
    console.log(
      `Reminder set for ${newReminder.date.toDateString()} at ${
        newReminder.time
      }: ${newReminder.title} - ${newReminder.description}`
    );

    // In a real application, integrate with an email/SMS service here
    //emailService.sendReminderNotification(user.email, newReminder);

    res.status(201).json(newReminder);
  } catch (error) {
    console.error("Error creating reminder:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
