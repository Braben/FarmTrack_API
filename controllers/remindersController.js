const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Helpers
function buildDueDate(dateStr, timeStr) {
  // If both provided, combine into ISO; fallbacks handle date-only or now
  if (dateStr && timeStr) {
    // Keep local time semantics by not forcing Z; let DB store as local timezone
    return new Date(`${dateStr}T${timeStr}`);
  }
  if (dateStr) return new Date(dateStr);
  return new Date();
}

// Create a new reminder
exports.createReminder = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Unauthorized, Please Login!" });
  }

  const { farmId } = req.params;
  const { title, type, date, time, isCompleted } = req.body;

  try {
    if (!farmId) return res.status(400).json({ error: "Farm ID is required" });
    if (!title) return res.status(400).json({ error: "Title is required" });

    // Ensure farm exists and belongs to user
    const farm = await prisma.farm.findUnique({ where: { id: farmId } });
    if (!farm) return res.status(404).json({ error: "Farm not found" });
    if (farm.ownerId !== req.user.id)
      return res.status(403).json({ error: "Not authorized for this farm" });

    const dueDate = buildDueDate(date, time);

    const newReminder = await prisma.reminder.create({
      data: {
        title,
        type: type || "General",
        dueDate,
        isCompleted: Boolean(isCompleted) || false,
        farmId,
      },
    });

    return res.status(201).json({ status: "success", data: newReminder });
  } catch (error) {
    console.error("Error creating reminder:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get all reminders for a farm
exports.getReminders = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Unauthorized, Please Login!" });
  }

  const { farmId } = req.params;

  try {
    if (!farmId) return res.status(400).json({ error: "Farm ID is required" });

    const farm = await prisma.farm.findUnique({ where: { id: farmId } });
    if (!farm) return res.status(404).json({ error: "Farm not found" });
    if (farm.ownerId !== req.user.id)
      return res.status(403).json({ error: "Not authorized for this farm" });

    const reminders = await prisma.reminder.findMany({
      where: { farmId },
      orderBy: [{ dueDate: "asc" }],
    });

    return res.status(200).json({ status: "success", data: reminders });
  } catch (error) {
    console.error("Error fetching reminders:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Update a reminder
exports.updateReminder = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Unauthorized, Please Login!" });
  }

  const { farmId, reminderId } = req.params;
  const { title, type, date, time, isCompleted } = req.body;

  try {
    if (!farmId || !reminderId)
      return res.status(400).json({ error: "Farm ID and Reminder ID are required" });

    const farm = await prisma.farm.findUnique({ where: { id: farmId } });
    if (!farm) return res.status(404).json({ error: "Farm not found" });
    if (farm.ownerId !== req.user.id)
      return res.status(403).json({ error: "Not authorized for this farm" });

    const existing = await prisma.reminder.findUnique({ where: { id: reminderId } });
    if (!existing || existing.farmId !== farmId) {
      return res.status(404).json({ error: "Reminder not found for this farm" });
    }

    const updateData = {
      title: title ?? existing.title,
      type: type ?? existing.type,
      isCompleted: typeof isCompleted === "boolean" ? isCompleted : existing.isCompleted,
    };

    if (date || time) {
      const currentDate = existing.dueDate;
      const datePart = date ? date : currentDate.toISOString().slice(0, 10);
      const timePart = time ? time : currentDate.toISOString().slice(11, 16);
      updateData.dueDate = buildDueDate(datePart, timePart);
    }

    const updated = await prisma.reminder.update({
      where: { id: reminderId },
      data: updateData,
    });

    return res.status(200).json({ status: "success", data: updated });
  } catch (error) {
    console.error("Error updating reminder:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a reminder
exports.deleteReminder = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Unauthorized, Please Login!" });
  }

  const { farmId, reminderId } = req.params;

  try {
    if (!farmId || !reminderId)
      return res.status(400).json({ error: "Farm ID and Reminder ID are required" });

    const farm = await prisma.farm.findUnique({ where: { id: farmId } });
    if (!farm) return res.status(404).json({ error: "Farm not found" });
    if (farm.ownerId !== req.user.id)
      return res.status(403).json({ error: "Not authorized for this farm" });

    const existing = await prisma.reminder.findUnique({ where: { id: reminderId } });
    if (!existing || existing.farmId !== farmId) {
      return res.status(404).json({ error: "Reminder not found for this farm" });
    }

    await prisma.reminder.delete({ where: { id: reminderId } });
    return res.status(200).json({ message: "Reminder deleted successfully" });
  } catch (error) {
    console.error("Error deleting reminder:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
