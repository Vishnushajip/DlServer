import Property from "../models/property.model.js";

export const getLatestPropertyByAgent = async (req, res) => {
  try {
    const { agent } = req.query;

    if (!agent) {
      return res.status(400).json({ error: "Agent ID is required" });
    }

    const [latestProperty, propertyCount] = await Promise.all([
      Property.findOne({ agent })
        .sort({ createdAt: -1 })
        .limit(1),
      Property.countDocuments({ agent })
    ]);

    res.status(200).json({
      latestProperty: latestProperty || null,
      totalProperties: propertyCount
    });

  } catch (err) {
    res.status(500).json({ 
      error: "Server error: " + err.message 
    });
  }
};