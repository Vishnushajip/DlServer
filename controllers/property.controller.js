import Property from "../models/property.model.js";

export const uploadProperty = async (req, res) => {
  try {
    const { listedOn, images, ...otherFields } = req.body;

    if (!images || !Array.isArray(images)) {
      return res
        .status(400)
        .json({ error: "Images must be an array of URLs." });
    }

    const propertyData = {
      ...otherFields,
      images,
      listedOn: new Date(listedOn),
    };

    const newProperty = new Property(propertyData);
    const saved = await newProperty.save();

    console.log("Received property data:", propertyData);

    res.status(201).json(saved);
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};
export const updateRemarks = async (req, res) => {
  try {
    const { propertyId, remarks } = req.body;

    if (!propertyId || !remarks) {
      return res
        .status(400)
        .json({ error: "propertyId and remarks are required." });
    }

    const updated = await Property.findByIdAndUpdate(
      propertyId,
      { $set: { remarks } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Property not found." });
    }

    res
      .status(200)
      .json({ message: "Remarks updated successfully", property: updated });
  } catch (error) {
    console.error("Update remarks error:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

export const getProperties = async (req, res) => {
  try {
    const { limit } = req.query;

    const query = Property.find().sort({ createdAt: -1 });

    if (limit) {
      query.limit(Number(limit));
      query.where("premium").equals("pin");
      query.or([
        { verified: "Verified by Admin" },
        { verified: { $exists: false } },
      ]);
    }

    const properties = await query.exec();

    res.status(200).json(properties);
  } catch (error) {
    console.error("Failed to fetch properties:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const getpaginatedproperties = async (req, res) => {
  try {
    const { limit, offset } = req.query;

    const query = Property.find().sort({ createdAt: -1 });

    if (limit) {
      query.limit(Number(limit));
    }

    if (offset) {
      query.skip(Number(offset));
    }

    const properties = await query.exec();

    res.status(200).json(properties);
  } catch (error) {
    console.error("Failed to fetch properties:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const filterPropertiesByBody = async (req, res) => {
  try {
    const { location, subtype, bhk, minPrice, maxPrice, minSqft, maxSqft } =
      req.body;

    const query = {};

    if (location && location.trim() !== "") {
      query.location = { $regex: new RegExp(location.trim(), "i") };
    }

    if (subtype && subtype.trim() !== "") {
      query.subtype = { $regex: new RegExp(`^${subtype.trim()}$`, "i") };
    }

    if (bhk && !isNaN(bhk)) {
      query.bhk = Number(bhk);
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined && !isNaN(minPrice)) {
        query.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined && !isNaN(maxPrice)) {
        query.price.$lte = Number(maxPrice);
      }
    }

    const areaConditions = [];
    if (minSqft !== undefined && !isNaN(minSqft)) {
      areaConditions.push({ $gte: [{ $toInt: "$sqft" }, Number(minSqft)] });
    }
    if (maxSqft !== undefined && !isNaN(maxSqft)) {
      areaConditions.push({ $lte: [{ $toInt: "$sqft" }, Number(maxSqft)] });
    }
    if (areaConditions.length > 0) {
      query.$expr = { $and: areaConditions };
    }

    if (Object.keys(query).length === 0) {
      return res
        .status(400)
        .json({ error: "At least one filter parameter is required" });
    }

    const properties = await Property.find(query)
      .sort({ listedOn: -1 })
      .limit(100);

    res.status(200).json(properties);
  } catch (error) {
    console.error("Filter error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

export const deleteDoc = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedDoc = await Property.findByIdAndDelete(id);

    if (!deletedDoc) {
      return res.status(404).json({ message: "Document not found" });
    }

    res
      .status(200)
      .json({ message: "Document deleted successfully", deletedDoc });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const getPropertyPosition = async (req, res) => {
  try {
    const { id } = req.params;

    const totalCount = await Property.countDocuments();

    const position =
      (await Property.countDocuments({
        createdAt: { $gt: (await Property.findById(id)).createdAt },
      })) + 1;

    res.status(200).json({
      _id: id,
      position,
      total: totalCount,
    });
  } catch (error) {
    console.error("Failed to fetch property position:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getVerifiedDocuments = async (req, res) => {
  try {
    const status = req.query.status || "Verified";
    const verifiedDocuments = await Property.find({
      verified: status,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: verifiedDocuments.length,
      data: {
        documents: verifiedDocuments,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

export const updateVerificationStatus = async (req, res) => {
  try {
    const { propertyId, status } = req.body;

    let verifiedStatus = "";
    if (status === "Verified by Admin") {
      verifiedStatus = "Verified by Admin";
    } else if (status === "Rejected by Admin") {
      verifiedStatus = "Rejected by Admin";
    } else {
      return res.status(400).json({
        status: "fail",
        message: "Invalid status provided",
      });
    }

    const document = await Property.findOneAndUpdate(
      { propertyId },
      {
        verified: verifiedStatus,
      },
      { new: true }
    );

    if (!document) {
      return res
        .status(404)
        .json({ status: "fail", message: "Document not found" });
    }

    res.status(200).json({
      status: "success",
      data: {
        document,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

export const getPropertyCount = async (req, res) => {
  try {
    const count = await Property.countDocuments({});
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error fetching property count:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getPropertiesByIds = async (req, res) => {
  try {
    const { propertyIds } = req.body;

    if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
      return res
        .status(400)
        .json({ error: "propertyIds must be a non-empty array" });
    }

    const properties = await Property.find({
      propertyId: { $in: propertyIds },
    });

    res.status(200).json(properties);
  } catch (error) {
    console.error("Error fetching properties by IDs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
