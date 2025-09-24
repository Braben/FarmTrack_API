const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/** Create a new sales management record
 */
exports.createSalesRecord = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Unauthorized, Please Login!" });
  }

  const farmId = req.params.farmId;
  if (!farmId) {
    return res.status(400).json({ error: "Farm ID is required" });
  }

  try {
    const { product, quantity, unitPrice, buyerName, date, notes } = req.body;

    // Ensure farm exists and belongs to user
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
    });

    if (!farm) {
      return res.status(404).json({ error: "Farm not found" });
    }

    if (farm.ownerId !== req.user.id) {
      return res.status(403).json({
        error: "You are not authorized to add sales records for this farm",
      });
    }

    // Calculate revenue (backend handles it)
    const calculatedRevenue = quantity * unitPrice;

    // Create sales record
    const newSalesRecord = await prisma.Sale.create({
      data: {
        farmId, // associate with farm
        product,
        quantity,
        unitPrice,
        buyerName,
        date: date ? new Date(date) : new Date(), // fallback if no date
        revenue: calculatedRevenue,
        notes,
      },
    });

    return res.status(201).json({
      status: "success",
      data: {
        salesRecord: newSalesRecord,
      },
    });
  } catch (error) {
    console.error("Error creating sales record:", error.message);
    res.status(500).json({ error: "Failed to create sales record" });
  }
};

// Additional sales management functions (get, update, delete) can be added here
exports.getSalesRecords = async (req, res) => {
  const { farmId } = req.params;
  try {
    // Logic to get sales records for the farm
    const salesRecords = await prisma.Sale.findMany({
      where: { farmId },
      orderBy: { date: "desc" },
    });
    if (salesRecords.length === 0 || salesRecords === null) {
      return res
        .status(404)
        .json({ error: "No sales records found for this farm, Add records" });
    }

    return res.status(200).json({
      status: "Success",
      results: salesRecords.length,
      data: salesRecords,
    });
  } catch (error) {
    console.error("Error fetching sales records:", error);
    res.status(500).json({ error: "Failed to fetch sales records" });
  }
};

/**
 * Get a single sales record by ID
 */

exports.getSalesRecord = async (req, res) => {
  const { id } = req.params;
  try {
    const salesRecord = await prisma.Sale.findUnique({
      where: { id },
    });
    if (!salesRecord) {
      return res.status(404).json({ error: "Sales record not found" });
    }
    return res.status(200).json({ data: salesRecord });
  } catch (error) {
    console.error("Error fetching sales record:", error);
    res.status(500).json({ error: "Failed to fetch sales record" });
  }
};

/**
 * Update a sales record by ID
 */
exports.updateSalesRecord = async (req, res) => {
  const { id } = req.params;
  try {
    const { product, quantity, unitPrice, buyerName, date, notes } = req.body;
    // Recalculate revenue if quantity or unitPrice changed
    const updatedData = {
      product,
      quantity,
      unitPrice,
      buyerName,
      date: date ? new Date(date) : undefined,
      notes,
    };
    if (quantity !== undefined && unitPrice !== undefined) {
      updatedData.revenue = quantity * unitPrice;
    }
    const updatedSalesRecord = await prisma.Sale.update({
      where: { id },
      data: updatedData,
    });
    return res.status(200).json({ data: updatedSalesRecord });
  } catch (error) {
    console.error("Error updating sales record:", error);
    res.status(500).json({ error: "Failed to update sales record" });
  }
};

/**
 * Delete a sales record by ID
 */
exports.deleteSalesRecord = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedSalesRecord = await prisma.Sale.findUnique({ where: { id } });
    if (!deletedSalesRecord) {
      return res.status(404).json({ error: "Sales record not found" });
    }
    await prisma.Sale.delete({ where: { id } });
    return res.status(200).json({
      message: "Sales record deleted successfully",
      id,
    });
  } catch (error) {
    console.error("Error deleting record:", error);
    res.status(500).json({ error: "Failed to delete record" });
  }
};
