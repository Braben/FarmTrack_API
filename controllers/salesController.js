const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/** Create a new sales management record
 */
exports.createSale = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Unauthorized, Please Login!" });
  }

  const { farmId } = req.params;
  // Basic validation
  if (!farmId) {
    return res.status(400).json({ error: "Farm ID is required" });
  }
  const { product, quantity, unitPrice, buyerName, date, notes } = req.body;

  try {
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
    const newSales = await prisma.sale.create({
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
      results: data.length,
      data: {
        sales: newSales,
      },
    });
  } catch (error) {
    console.error("Error creating sales record:", error.message);
    res.status(500).json({ error: "Failed to create sales record" });
  }
};

// Additional sales management functions (get, update, delete) can be added here
exports.getSales = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Unauthorized, Please Login!" });
  }
  const { farmId } = req.params;
  try {
    // Logic to get sales records for the farm
    const sales = await prisma.sale.findMany({
      where: { farmId },
      orderBy: { date: "desc" },
    });
    if (sales.length === 0 || sales === null) {
      return res
        .status(404)
        .json({ error: "No sales records found for this farm, Add records" });
    }

    return res.status(200).json({
      status: "Success",
      results: sales.length,
      data: sales,
    });
  } catch (error) {
    console.error("Error fetching sales records:", error);
    res.status(500).json({ error: "Failed to fetch sales records" });
  }
};

/**
 * Get a single sales record by ID
 */

exports.getSaleById = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Unauthorized, Please Login!" });
  }

  const { farmId, saleId } = req.params;
  try {
    const sales = await prisma.sale.findUnique({
      where: { id: saleId, farmId },
    });
    if (!sales) {
      return res.status(404).json({ error: "Sales record not found" });
    }
    return res.status(200).json({ data: sales });
  } catch (error) {
    console.error("Error fetching sales record:", error);
    res.status(500).json({ error: "Failed to fetch sales record" });
  }
};

/**
 * Update a sales record by ID
 */
exports.updateSale = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Unauthorized, Please Login!" });
  }
  const { farmId, saleId } = req.params;
  const { product, quantity, unitPrice, buyerName, date, notes } = req.body;
  try {
    const sale = await prisma.sale.findFirst({
      where: { id: saleId, farmId },
      include: { farm: true },
    });
    if (!sale) {
      return res.status(404).json({ error: "Sales record not found" });
    }

    if (sale.farm.ownerId !== req.user.id) {
      return res.status(403).json({
        error: "You are not authorized to update sales records for this farm",
      });
    }

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

    const updatedSale = await prisma.sale.update({
      where: { id: saleId },
      data: updatedData,
    });
    return res.status(200).json({ data: updatedSale });
  } catch (error) {
    console.error("Error updating sales record:", error.message);
    res.status(500).json({ error: "Failed to update sales record" });
  }
};

/**
 * Delete a sales record by ID
 */
exports.deleteSale = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Unauthorized, Please Login!" });
  }

  const { farmId, saleId } = req.params;

  try {
    const sale = await prisma.sale.findFirst({
      where: { id: saleId, farmId },
      include: { farm: true },
    });

    if (!sale) return res.status(404).json({ error: "Sale not found" });

    if (sale.farm.ownerId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this sale" });
    }

    await prisma.sale.delete({ where: { id: saleId } });

    return res.status(200).json({ message: "Sale deleted successfully" });
  } catch (error) {
    console.error("Error deleting sale:", error.message);
    return res
      .status(500)
      .json({ error: "Failed to delete sale, ID: ", saleId });
  }
};
