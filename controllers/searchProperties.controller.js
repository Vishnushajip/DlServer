import Property from "../models/property.model.js";

export const searchAgentProperties = async (req, res) => {
  try {
    const { agent, searchQuery } = req.query;

    if (!agent) {
      return res.status(400).json({ error: "Agent ID is required" });
    }

    const properties = await Property.find({
      agent,
      $or: [
        { name: { $regex: searchQuery, $options: "i" } },
        { propertyId: { $regex: searchQuery, $options: "i" } },
      ],
    }).sort({ createdAt: -1 });

    if (!properties || properties.length === 0) {
      return res.status(404).json({ message: "No matching properties found" });
    }

    res.status(200).json(properties);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

export const searchproperty = async (req, res) => {
  try {
    const { searchQuery, skip = 0, limit = 20 } = req.query;

    if (!searchQuery) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const regex = new RegExp(searchQuery, "i");

    const properties = await Property.find({
      $or: [
        { name: { $regex: regex } },
        { propertyId: { $regex: regex } },
        { location: { $regex: regex } },
      ],
    })
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const totalCount = await Property.countDocuments({
      $or: [
        { name: { $regex: regex } },
        { propertyId: { $regex: regex } },
        { location: { $regex: regex } },
      ],
    });

    res.status(200).json({
      data: properties,
      total: totalCount,
      count: properties.length,
      skip: parseInt(skip),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

export const locationPropertiesRoutes = async (req, res) => {
  try {
    const { location } = req.query;

    if (!location || location.trim() === "") {
      return res.status(400).json({ error: "Location is required" });
    }

    const regex = new RegExp(location, "i");

    const properties = await Property.find({
      location: { $regex: regex },
    }).sort({ createdAt: -1 });

    if (!properties.length) {
      return res
        .status(404)
        .json({ message: "No properties found for the location" });
    }

    res.status(200).json(properties);
  } catch (error) {
    console.error("Location search error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

export const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      location,
      name,
      type,
      subtype,
      bhk,
      sqft,
      price,
      plotArea,
      unit,
      listedOn,
      status,
      agent,
      Pricingoptions,
      propertyDescription,
      ownerName,
      phoneNumber,
      whatsappNumber,
      propertyId
    } = req.body;

    const updatedData = {
      ...(location && { location }),
      ...(name && { name }),
      ...(type && { type }),
      ...(subtype && { subtype }),
      ...(bhk !== undefined && { bhk }),
      ...(sqft && { sqft }),
      ...(price !== undefined && { price }),
      ...(plotArea && { plotArea }),
      ...(unit && { unit }),
      ...(listedOn && { listedOn }),
      ...(status && { status }),
      ...(agent && { agent }),
      ...(Pricingoptions && { Pricingoptions }),
      ...(propertyDescription && { propertyDescription }),
      ...(ownerName && { ownerName }),
      ...(phoneNumber && { phoneNumber }),
      ...(whatsappNumber && { whatsappNumber }),
      ...(propertyId && { propertyId }),
      updatedAt: new Date()
    };

    const updatedProperty = await Property.findByIdAndUpdate(
      id,
      { $set: updatedData },
      { new: true }
    );

    if (!updatedProperty) {
      return res.status(404).json({ message: "Property not found" });
    }

    res.status(200).json(updatedProperty);
  } catch (error) {
    console.error("Update Property Error:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};
export const updatePropertyImages = async (req, res) => {
  try {
    const { id } = req.params; 
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: "Updates array is required" });
    }

    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const imageArray = [...property.images];

    for (const update of updates) {
      const { index, images } = update;

      if (index === undefined || typeof images !== "string") {
        return res.status(400).json({ message: "Each update must contain index and imageUrl" });
      }

      if (index < 0 || index >= imageArray.length) {
        return res.status(400).json({
          message: `Index ${index} out of bounds. Total images: ${imageArray.length}`
        });
      }

      imageArray[index] = images; 
    }

    property.images = imageArray;
    property.updatedAt = new Date();
    await property.save();

    res.status(200).json({ message: "Images updated successfully", property });
  } catch (error) {
    console.error("Error updating property images:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

