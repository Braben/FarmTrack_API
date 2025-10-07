const express = require("express");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// create a farm
exports.createFarm = async (req, res) => {
  /// Ensure user is authenticated
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Unauthorized, Please Login" });
  }

  try {
    const { farmName, location, size, farmType, description } = req.body;

    // Build dynamic where clause — only include fields that exist
    const whereClause = {
      farmName,
      location,
      ownerId: req.user.id,
      isActive: true,
    };

    if (description) {
      whereClause.description = description;
    }

    // Check if the farmer already has a farm with the same name and location
    const existingFarm = await prisma.farm.findFirst({
      where: whereClause,
    });

    if (existingFarm) {
      // If a duplicate farm is found, return a conflict error
      return res.status(409).json({
        error: `You already have a farm named "${farmName}" at location "${location}".`,
      });
    }

    //If no duplicate, create new farm
    const newFarm = await prisma.farm.create({
      data: {
        farmName,
        location,
        size: parseFloat(size),
        farmType,
        description,
        // Set the ownerId to the authenticated user's ID
        ownerId: req.user.id,
      },
    });

    return res.status(201).json({
      message: "Farm created successfully",
      farm: newFarm,
    });
  } catch (error) {
    console.error("Error creating farm:", error.message);
    return res.status(500).json({ error: "Failed to create farm" });
  }
};

// get all farms
exports.getAllFarms = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Unauthorized, please login" });
  }
  try {
    const farms = await prisma.farm.findMany({
      where: {
        ownerId: req.user.id,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!farms.length) {
      return res.status(404).json({ message: "No farms found" });
    }

    return res.status(200).json({
      count: farms.length,
      message: "Farms fetched successfully",
      farms,
    });
  } catch (error) {
    console.error("Error fetching farms:", error.message);
    return res.status(500).json({ error: "Failed to fetch farms" });
  }
};

// get farm by id
exports.getFarmById = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Unauthorized, Please Login" });
  }
  const { id } = req.params;
  try {
    const farm = await prisma.farm.findUnique({
      where: { id },
      include: {
        owner: true,
        records: true,
        sales: true,
        reminders: true,
      },
    });
    if (!farm || farm.ownerId !== req.user.id) {
      return res.status(404).json({ error: "Farm not found" });
    }
    return res.status(200).json({
      message: "Farm fetched successfully",
      farm,
    });
  } catch (error) {
    console.error("Error fetching farm:", error.message);
    return res.status(500).json({ error: "Failed to fetch farm" });
  }
};

// update farm
exports.updateFarm = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Unauthorized, Please Login" });
  }
  try {
    const { id } = req.params;
    const { farmName, location, size, farmType, description } = req.body;
    const farm = await prisma.farm.findUnique({
      where: { id },
    });
    if (!farm) {
      return res.status(404).json({ error: "Farm not found" });
    }
    if (farm.ownerId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Forbidden: You can only update your own farms" });
    }

    if (farm.isActive === false) {
      return res.status(400).json({ error: "Cannot update a deleted farm" });
    }
    const updatedFarm = await prisma.farm.update({
      where: { id },
      data: {
        farmName,
        location,
        size: size ? parseFloat(size) : farm.size,
        farmType,
        description,
      },
    });
    return res.status(200).json({
      message: "Farm updated successfully",
      farm: updatedFarm,
    });
  } catch (error) {
    console.error("Error updating farm:", error.message);
    return res.status(500).json({ error: "Failed to update farm" });
  }
};
// soft delete farm
exports.deleteFarm = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Unauthorized, Please Login" });
  }
  const { id } = req.params;
  try {
    const farm = await prisma.farm.findUnique({
      where: { id },
    });
    if (!farm) {
      return res.status(404).json({ error: "Farm not found" });
    }
    if (farm.ownerId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Forbidden: You can only delete your own farms" });
    }
    const deletedFarm = await prisma.farm.update({
      where: { id },
      data: { isActive: false },
    });
    return res.status(200).json({
      message: "Farm deactivated successfully",
      farm: deletedFarm,
    });
  } catch (error) {
    console.error("Error deleting farm:", error.message);
    return res.status(500).json({ error: "Failed to delete farm" });
  }
};

// hard delete farm
// exports.deleteFarm = async (req, res) => {
//   if (!req.user || !req.user.id) {
//     return res.status(401).json({ error: "Unauthorized, Please Login" });
//   }
//   try {
//     const { id } = req.params;
//     const farm = await prisma.farm.findUnique({
//       where: { id },
//     });
//     if (!farm) {
//       return res.status(404).json({ error: "Farm not found" });
//     }
//     if (farm.ownerId !== req.user.id) {
//       return res
//         .status(403)
//         .json({ error: "Forbidden: You can only delete your own farms" });
//     }
//     await prisma.farm.delete({
//       where: { id },
//     });
//     return res.status(200).json({
//       message: "Farm deleted successfully",
//     });
//   } catch (error) {
//     console.error("Error deleting farm:", error.message);
//     return res.status(500).json({ error: "Failed to delete farm" });
//   }
// };
