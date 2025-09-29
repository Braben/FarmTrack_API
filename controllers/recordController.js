const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Create a new record
 */
exports.createRecord = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Unauthorized, Please Login!" });
  }

  const { farmId } = req.params;

  if (!farmId) {
    return res.status(400).json({ error: "Farm ID is required" });
  }
  const {
    date,
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
  try {
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
        date: date ? new Date(date) : new Date(), // default to now if not provided
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
exports.getAllRecords = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Unauthorized, Please Login!" });
  }
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
    console.error("Error retrieving records:", error.message);
    res.status(500).json({ error: "Failed to fetch records" });
  }
};

/**
 * Get a single record by ID
 */
exports.getRecordById = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Unauthorized, Please Login!" });
  }
  const { farmId, recordId } = req.params;

  try {
    const record = await prisma.record.findUnique({
      where: { id: recordId, farmId },
    });

    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    res
      .status(200)
      .json({ massage: "record retrieved successfully", data: record });
  } catch (error) {
    console.error("Error retrieving record:", error.message);
    res.status(500).json({ error: "Failed to fetch record" });
  }
};

/**
 * Update a record
 */
exports.updateRecord = async (req, res) => {
  // Ensure user is authenticated
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Unauthorized, Please Login!" });
  }

  const { farmId, recordId } = req.params;
  if (!farmId || !recordId) {
    return res
      .status(400)
      .json({ error: "Both Farm ID and Record ID are required" });
  }

  const {
    date,
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

  try {
    // Ensure farm exists and belongs to user
    const farm = await prisma.farm.findUnique({ where: { id: farmId } });
    if (!farm) {
      return res.status(404).json({ error: "Farm not found" });
    }

    if (farm.ownerId !== req.user.id) {
      return res.status(403).json({
        error: "You are not authorized to update records for this farm",
      });
    }

    // Ensure record exists and belongs to the farm
    const existingRecord = await prisma.record.findUnique({
      where: { id: recordId },
    });
    if (!existingRecord || existingRecord.farmId !== farmId) {
      return res.status(404).json({ error: "Record not found for this farm" });
    }

    // Update record
    const updatedRecord = await prisma.record.update({
      where: { id: recordId },
      data: {
        date: date ? new Date(date) : existingRecord.date,
        feedUsedKg: feedUsedKg ?? existingRecord.feedUsedKg,
        eggsCollected: eggsCollected ?? existingRecord.eggsCollected,
        birdsDied: birdsDied ?? existingRecord.birdsDied,
        birdsSold: birdsSold ?? existingRecord.birdsSold,
        expenses: expenses ?? existingRecord.expenses,
        mortialityCause: mortialityCause ?? existingRecord.mortialityCause,
        photos: photos ?? existingRecord.photos,
        notes: notes ?? existingRecord.notes,
        weatherInfo: weatherInfo ?? existingRecord.weatherInfo,
      },
    });

    return res.status(200).json({
      message: "Record updated successfully",
      data: updatedRecord,
    });
  } catch (error) {
    console.error("Error updating record:", error);
    return res.status(500).json({ error: "Failed to update record" });
  }
};

/**
 * Delete a record
 */
exports.deleteRecord = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Unauthorized, Please Login!" });
  }

  const { farmId, recordId } = req.params;

  if (!farmId || !recordId) {
    return res
      .status(400)
      .json({ error: "Both Farm ID and Record ID are required" });
  }

  try {
    // Ensure farm exists and belongs to user
    const farm = await prisma.farm.findUnique({ where: { id: farmId } });
    if (!farm) {
      return res.status(404).json({ error: "Farm not found" });
    }

    if (farm.ownerId !== req.user.id) {
      return res.status(403).json({
        error: "You are not authorized to delete records for this farm",
      });
    }

    // Ensure record exists and belongs to the farm
    const record = await prisma.record.findUnique({ where: { id: recordId } });
    if (!record || record.farmId !== farmId) {
      return res.status(404).json({ error: "Record not found for this farm" });
    }

    // Delete record
    await prisma.record.delete({ where: { id: recordId } });

    return res.status(200).json({
      message: "Record deleted successfully",
      deletedRecordId: recordId,
    });
  } catch (error) {
    console.error("Error deleting record:", error);
    return res.status(500).json({ error: "Failed to delete record" });
  }
};
