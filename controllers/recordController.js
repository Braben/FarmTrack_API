const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Create a new record
 */
exports.createRecord = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Unauthorized, Please Login!" });
  }

  const farmId = req.params.farmId;
  if (!farmId) {
    return res.status(400).json({ error: "Farm ID is required" });
  }
  try {
    const {
      feedUsedKg,
      eggsCollected,
      birdsDied,
      birdsSold,
      expenses,
      mortialityCause,
      photos,
      notes,
      weatherInfo,
    } = req.body;

    // Ensure farm exists and belongs to user
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
    });

    if (!farm) {
      return res.status(404).json({ error: "Farm not found" });
    }

    // (Optional) Ensure only owner can add records
    if (farm.ownerId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "You are not authorized to add records for this farm" });
    }

    const newRecord = await prisma.record.create({
      data: {
        farmId,
        feedUsedKg,
        eggsCollected,
        birdsDied,
        birdsSold,
        expenses,
        mortialityCause,
        photos: photos || [],
        notes,
        weatherInfo,
      },
    });

    return res.status(201).json({
      message: "Record created successfully",
      data: newRecord,
    });
  } catch (error) {
    console.error("Error creating record:", error);
    res.status(500).json({ error: "Failed to create record" });
  }
};

/**
 * Get all records for a farm
 */
exports.getFarmRecords = async (req, res) => {
  const { farmId } = req.params;

  try {
    const records = await prisma.record.findMany({
      where: { farmId },
      orderBy: { date: "desc" },
    });

    if (records === null || records.length === 0) {
      return res
        .status(404)
        .json({ Message: "No records found for this farm" });
    }

    res.status(200).json({
      status: "success",
      results: records.length,
      data: records,
    });
  } catch (error) {
    console.error("Error retrieving records:", error);
    res.status(500).json({ error: "Failed to fetch records" });
  }
};

/**
 * Get a single record by ID
 */
exports.getRecord = async (req, res) => {
  const { id } = req.params;

  try {
    const record = await prisma.record.findUnique({
      where: { id },
    });

    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.status(200).json({ data: record });
  } catch (error) {
    console.error("Error retrieving record:", error);
    res.status(500).json({ error: "Failed to fetch record" });
  }
};

/**
 * Update a record
 */
exports.updateRecord = async (req, res) => {
  const { id } = req.params;

  try {
    const record = await prisma.record.findUnique({ where: { id } });
    if (!record) {
      return res
        .status(404)
        .json({
          error: "Record not found: You cannot update an unknown record",
        });
    }

    const updatedRecord = await prisma.record.update({
      where: { id },
      data: req.body,
    });

    res.status(200).json({
      message: "Record updated successfully",
      data: updatedRecord,
    });
  } catch (error) {
    console.error("Error updating record:", error);
    res.status(500).json({ error: "Failed to update record" });
  }
};

/**
 * Delete a record
 */
exports.deleteRecord = async (req, res) => {
  const { id } = req.params;

  try {
    const record = await prisma.record.findUnique({ where: { id } });
    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    await prisma.record.delete({ where: { id } });

    console.log("Record deleted successfully!", "id:", id);

    res.status(200).json({ message: "Record deleted successfully!", id });
  } catch (error) {
    console.error("Error deleting record:", error);
    res.status(500).json({ error: "Failed to delete record" });
  }
};
