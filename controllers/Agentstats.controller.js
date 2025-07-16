import Property from "../models/property.model.js";

export const getAgentStats = async (req, res) => {
  const { agent } = req.query;

  if (!agent) return res.status(400).json({ message: "Agent is required" });

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  try {
    const matchAgent = { agent };

    const [
      totalUploaded,
      totalSold,
      dailyUploaded,
      monthlyUploaded,
      monthlySold,
      lastMonthUploaded,
      lastMonthSold,
      monthlyTotalValue,
    ] = await Promise.all([
      Property.countDocuments(matchAgent),
      Property.countDocuments({ ...matchAgent, status: "Sold" }),
      Property.countDocuments({
        ...matchAgent,
        createdAt: { $gte: startOfToday },
      }),
      Property.countDocuments({
        ...matchAgent,
        createdAt: { $gte: startOfMonth },
      }),
      Property.countDocuments({
        ...matchAgent,
        status: "Sold",
        createdAt: { $gte: startOfMonth },
      }),
      Property.countDocuments({
        ...matchAgent,
        createdAt: {
          $gte: startOfLastMonth,
          $lte: endOfLastMonth,
        },
      }),
      Property.countDocuments({
        ...matchAgent,
        status: "Sold",
        createdAt: {
          $gte: startOfLastMonth,
          $lte: endOfLastMonth,
        },
      }),
      Property.aggregate([
        {
          $match: {
            ...matchAgent,
            createdAt: { $gte: startOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            totalPrice: { $sum: "$price" },
          },
        },
      ]),
    ]);

    const response = {
      totalUploaded,
      totalSold,
      dailyUploaded,
      monthlyUploaded,
      monthlySold,
      lastMonthUploaded,
      lastMonthSold,
      monthlyTotalValue:
        monthlyTotalValue.length > 0 ? monthlyTotalValue[0].totalPrice : 0,
    };

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

export const getTopAgentsThisMonth = async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  try {
    const topAgents = await Property.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: "$agent",
          totalValue: { $sum: "$price" },
          count: { $sum: 1 },
          properties: {
            $push: {
              _id: "$_id",
              name: "$name",
              price: "$price",
              propertyId: "$propertyId",
              createdAt: "$createdAt",
              status: "$status",
            },
          },
        },
      },
      {
        $sort: { totalValue: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    res.status(200).json(topAgents);
  } catch (error) {
    console.error("Error fetching top agents:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const getAgentWeeklyDocuments = async (req, res) => {
  try {
    const {
      agentId,
      startDate = "2025-05-01",
      endDate = "2025-05-31",
    } = req.query;

    if (!agentId) {
      return res.status(400).json({ error: "Agent ID is required" });
    }

    const dateFilter = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };

    const pipeline = [
      {
        $match: {
          agent: agentId,
          createdAt: dateFilter,
        },
      },
      { 
        $group: {
          _id: { day: { $dayOfWeek: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.day": 1 } },
    ];

    const rawResults = await Property.aggregate(pipeline);

    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const result = Array.from({ length: 7 }, (_, i) => ({
      day: dayNames[i],
      count: 0,
    }));

    for (const entry of rawResults) {
      const dayIndex = entry._id.day - 1; 
      result[dayIndex].count = entry.count;
    }

    res.status(200).json({ agentId, startDate, endDate, data: result });
  } catch (error) {
    console.error("Error in getAgentWeeklyDocuments:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};
