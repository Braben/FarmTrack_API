const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Helper: ensure farm exists and belongs to user
async function assertFarm(req, farmId) {
  if (!req.user || !req.user.id) {
    return { error: { status: 401, message: "Unauthorized, Please Login!" } };
  }
  if (!farmId) {
    return { error: { status: 400, message: "Farm ID is required" } };
  }
  const farm = await prisma.farm.findUnique({ where: { id: farmId } });
  if (!farm) return { error: { status: 404, message: "Farm not found" } };
  if (farm.ownerId !== req.user.id)
    return { error: { status: 403, message: "Not authorized for this farm" } };
  return { farm };
}

exports.listInventory = async (req, res) => {
  const { farmId } = req.params;
  try {
    const { error } = await assertFarm(req, farmId);
    if (error) return res.status(error.status).json({ error: error.message });

    const items = await prisma.inventoryItem.findMany({
      where: { farmId },
      orderBy: [{ itemType: "asc" }, { itemName: "asc" }],
    });
    return res
      .status(200)
      .json({ status: "success", results: items.length, data: items });
  } catch (err) {
    console.error("Error listing inventory:", err);
    return res.status(500).json({ error: "Failed to fetch inventory" });
  }
};

exports.createInventoryItem = async (req, res) => {
  const { farmId } = req.params;
  const {
    itemType,
    itemName,
    currentQuantity,
    unit,
    unitCost,
    supplier,
    purchaseDate,
    expiryDate,
    minimumThreshold,
  } = req.body;
  try {
    const { error } = await assertFarm(req, farmId);
    if (error) return res.status(error.status).json({ error: error.message });

    if (!itemType || !itemName || unit == null || currentQuantity == null) {
      return res
        .status(400)
        .json({
          error: "itemType, itemName, unit and currentQuantity are required",
        });
    }

    const item = await prisma.inventoryItem.create({
      data: {
        farmId,
        itemType,
        itemName,
        currentQuantity: parseFloat(currentQuantity),
        unit,
        unitCost: unitCost != null ? parseFloat(unitCost) : null,
        supplier: supplier || null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        minimumThreshold:
          minimumThreshold != null ? parseFloat(minimumThreshold) : null,
      },
    });
    return res.status(201).json({ status: "success", data: item });
  } catch (err) {
    console.error("Error creating inventory item:", err);
    return res.status(500).json({ error: "Failed to create inventory item" });
  }
};

exports.updateInventoryItem = async (req, res) => {
  const { farmId, itemId } = req.params;
  const data = req.body;
  try {
    const { error } = await assertFarm(req, farmId);
    if (error) return res.status(error.status).json({ error: error.message });

    const existing = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
    });
    if (!existing || existing.farmId !== farmId) {
      return res
        .status(404)
        .json({ error: "Inventory item not found for this farm" });
    }

    const updated = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        itemType: data.itemType ?? existing.itemType,
        itemName: data.itemName ?? existing.itemName,
        currentQuantity:
          data.currentQuantity != null
            ? parseFloat(data.currentQuantity)
            : existing.currentQuantity,
        unit: data.unit ?? existing.unit,
        unitCost:
          data.unitCost != null ? parseFloat(data.unitCost) : existing.unitCost,
        supplier: data.supplier ?? existing.supplier,
        purchaseDate: data.purchaseDate
          ? new Date(data.purchaseDate)
          : existing.purchaseDate,
        expiryDate: data.expiryDate
          ? new Date(data.expiryDate)
          : existing.expiryDate,
        minimumThreshold:
          data.minimumThreshold != null
            ? parseFloat(data.minimumThreshold)
            : existing.minimumThreshold,
      },
    });
    return res.status(200).json({ status: "success", data: updated });
  } catch (err) {
    console.error("Error updating inventory item:", err);
    return res.status(500).json({ error: "Failed to update inventory item" });
  }
};

exports.deleteInventoryItem = async (req, res) => {
  const { farmId, itemId } = req.params;
  try {
    const { error } = await assertFarm(req, farmId);
    if (error) return res.status(error.status).json({ error: error.message });

    const existing = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
    });
    if (!existing || existing.farmId !== farmId) {
      return res
        .status(404)
        .json({ error: "Inventory item not found for this farm" });
    }

    await prisma.inventoryItem.delete({ where: { id: itemId } });
    return res
      .status(200)
      .json({ message: "Inventory item deleted successfully" });
  } catch (err) {
    console.error("Error deleting inventory item:", err);
    return res.status(500).json({ error: "Failed to delete inventory item" });
  }
};

exports.restockInventoryItem = async (req, res) => {
  const { itemId } = req.params;
  const { addQuantity, unitCost } = req.body;
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized, Please Login!" });
    }

    const existing = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
    });
    if (!existing)
      return res.status(404).json({ error: "Inventory item not found" });

    // owner check via item.farm
    const farm = await prisma.farm.findUnique({
      where: { id: existing.farmId },
    });
    if (!farm || farm.ownerId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized for this farm" });
    }

    const updated = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        currentQuantity:
          existing.currentQuantity + parseFloat(addQuantity || 0),
        unitCost: unitCost != null ? parseFloat(unitCost) : existing.unitCost,
      },
    });

    return res.status(200).json({ status: "success", data: updated });
  } catch (err) {
    console.error("Error restocking inventory item:", err);
    return res.status(500).json({ error: "Failed to restock inventory item" });
  }
};
