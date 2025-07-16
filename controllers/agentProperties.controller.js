import Property from "../models/property.model.js";

export const getAgentProperties = async (req, res) => {
  try {
    const agentId = req.params.agentId.trim();

    if (!agentId) {
      return res.status(400).json({ error: "Agent ID required" });
    }

    const query = {
      $or: [
        { agent: agentId },
        { agent: parseInt(agentId) || null },
      ],
    };

    const properties = await Property.find(query);

    if (properties.length === 0) {
      return res.status(404).json({
        message: "No properties found",
        yourQuery: query,       
        receivedId: agentId,
      });
    }

    res.status(200).json(properties);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      error: "Server error",
      details: error.message,
    });
  }
};
