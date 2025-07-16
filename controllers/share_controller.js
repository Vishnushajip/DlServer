import Property from "../models/property.model.js";
import mongoose from "mongoose";

export const getPropertyById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid Property ID" });
  }

  try {
    const property = await Property.findById(id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    res.status(200).json(property);
  } catch (error) {
    console.error("Error fetching property:", error);
    res.status(500).json({ message: "Server error" });
  }
};
