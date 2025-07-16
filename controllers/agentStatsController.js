import mongoose from "mongoose";

export const getPropertyAgentAnalytics = async (req, res) => {
  try {
    // 1. First check if we're connected
    if (!mongoose.connection?.readyState) {
      await mongoose.connect(process.env.MONGO_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
      });
    }

    // 2. Verify connection is established before proceeding
    if (!mongoose.connection?.db) {
      throw new Error("MongoDB connection failed");
    }

    const { groupBy, date, month, year } = req.query;
    
    // 3. Get collection safely
    const collection = mongoose.connection.db.collection("properties");

    if (!groupBy) {
      return res.status(400).json({ 
        message: "Missing required 'groupBy' parameter" 
      });
    }

    // Date range calculation
    let start, end;

    if (groupBy === "day") {
      if (!date) {
        return res.status(400).json({ 
          message: "Date parameter required for day grouping" 
        });
      }
      const inputDate = new Date(date);
      start = new Date(inputDate.setHours(0, 0, 0, 0));
      end = new Date(inputDate.setHours(23, 59, 59, 999));
    } else if (groupBy === "week") {
      if (!date) {
        return res.status(400).json({ 
          message: "Date parameter required for week grouping" 
        });
      }
      const inputDate = new Date(date);
      const dayOfWeek = inputDate.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

      start = new Date(inputDate);
      start.setDate(start.getDate() + diffToMonday);
      start.setHours(0, 0, 0, 0);

      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (groupBy === "month") {
      if (!year || !month) {
        return res.status(400).json({ 
          message: "Year and month parameters required for month grouping" 
        });
      }
      start = new Date(year, month - 1, 1);
      end = new Date(year, month, 0, 23, 59, 59, 999);
    } else {
      return res.status(400).json({ 
        message: "Invalid 'groupBy' value. Use 'day', 'week', or 'month'" 
      });
    }

    const pipeline = [
      { 
        $match: {
          createdAt: { $gte: start, $lte: end },
          agent: { $exists: true },  // Changed from agentId to agent
          subtype: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: {
            agent: "$agent",
            subtype: "$subtype",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.agent",
          subtypes: {
            $push: {
              subtype: { $ifNull: ["$_id.subtype", "Unknown"] },
              count: "$count",
            },
          },
          total: { $sum: "$count" },
        },
      },
      {
        $project: {
          _id: 0,
          agent: { $ifNull: ["$_id", "Unknown"] },
          total: 1,
          subtypes: 1,
        },
      },
      { $sort: { total: -1 } },
    ];

    const result = await collection.aggregate(pipeline).toArray();
    const totalCount = result.reduce((sum, item) => sum + item.total, 0);

    const response = {
      groupBy,
      ...(groupBy === "day" && { date }),
      ...(groupBy === "week" && {
        date,
        weekRange: `${start.toLocaleDateString("en-GB")} - ${end.toLocaleDateString("en-GB")}`,
      }),
      ...(groupBy === "month" && {
        year: parseInt(year),
        month: parseInt(month),
      }),
      totalCount,
      data: result,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("[getPropertyAgentAnalytics]", error);
    res.status(500).json({ 
      message: "Something went wrong", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};