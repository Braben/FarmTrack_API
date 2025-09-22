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
    const newSalesRecord = await prisma.salesRecord.create({
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
