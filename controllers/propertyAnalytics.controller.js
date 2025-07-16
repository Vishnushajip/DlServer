import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import isoWeek from "dayjs/plugin/isoWeek.js";
import utc from "dayjs/plugin/utc.js";
import weekday from "dayjs/plugin/weekday.js";
import mongoose from "mongoose";

dayjs.extend(utc);
dayjs.extend(isoWeek);
dayjs.extend(weekday);
dayjs.extend(customParseFormat);

export const getPropertyAnalytics = async (req, res) => {
  try {
    const properties = mongoose.connection.collection("properties");
    const { groupBy = "day", date, year, month } = req.query;
    const now = dayjs.utc();

    let matchDateStart, matchDateEnd, rangeLabel;

    if (groupBy === "day") {
      const targetDate = date ? dayjs.utc(date, "YYYY-MM-DD") : now;
      if (!targetDate.isValid()) {
        return res
          .status(400)
          .json({ message: "Invalid date format. Use YYYY-MM-DD." });
      }
      matchDateStart = targetDate.startOf("day").toDate();
      matchDateEnd = targetDate.endOf("day").toDate();
      rangeLabel = targetDate.format("YYYY-MM-DD");
    } else if (groupBy === "week") {
      const targetDate = date ? dayjs.utc(date, "YYYY-MM-DD") : now;
      if (!targetDate.isValid()) {
        return res
          .status(400)
          .json({ message: "Invalid date format. Use YYYY-MM-DD." });
      }
      matchDateStart = targetDate.startOf("isoWeek").toDate();
      matchDateEnd = targetDate.endOf("isoWeek").toDate();
      rangeLabel = `${targetDate
        .startOf("isoWeek")
        .format("D MMM")} - ${targetDate.endOf("isoWeek").format("D MMM")}`;
    } else if (groupBy === "month") {
      if (
        !year ||
        !month ||
        isNaN(year) ||
        isNaN(month) ||
        month < 1 ||
        month > 12
      ) {
        return res.status(400).json({
          message: "Valid year and month (1-12) are required for month view.",
        });
      }
      const monthStart = dayjs.utc(
        `${year}-${month.padStart(2, "0")}-01`,
        "YYYY-MM-DD"
      );
      if (!monthStart.isValid()) {
        return res.status(400).json({ message: "Invalid year or month." });
      }
      matchDateStart = monthStart.startOf("month").toDate();
      matchDateEnd = monthStart.endOf("month").toDate();
      rangeLabel = monthStart.format("MMMM YYYY");
    } else {
      return res.status(400).json({
        message: "Invalid groupBy value. Use 'day', 'week', or 'month'.",
      });
    }
    const matchStage = {
      $match: {
        $expr: {
          $and: [
            {
              $gte: [
                {
                  $cond: {
                    if: { $ifNull: ["$listedOn", false] },
                    then: {
                      $dateFromString: {
                        dateString: "$listedOn",
                        format: "%Y-%m-%d",
                        onError: "$createdAt",
                      },
                    },
                    else: "$createdAt",
                  },
                },
                matchDateStart,
              ],
            },
            {
              $lte: [
                {
                  $cond: {
                    if: { $ifNull: ["$listedOn", false] },
                    then: {
                      $dateFromString: {
                        dateString: "$listedOn",
                        format: "%Y-%m-%d",
                        onError: "$createdAt",
                      },
                    },
                    else: "$createdAt",
                  },
                },
                matchDateEnd,
              ],
            },
          ],
        },
      },
    };

    const totalCount = await properties.countDocuments(matchStage.$match);

    const pipeline = [matchStage];

    if (groupBy === "day") {
      pipeline.push(
        {
          $project: {
            date: {
              $cond: {
                if: { $ifNull: ["$listedOn", false] },
                then: {
                  $dateFromString: {
                    dateString: "$listedOn",
                    format: "%Y-%m-%d",
                    onError: "$createdAt",
                  },
                },
                else: "$createdAt",
              },
            },
          },
        },
        {
          $addFields: {
            dayOfWeek: { $isoDayOfWeek: "$date" },
          },
        },
        {
          $group: {
            _id: "$dayOfWeek",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            day: {
              $arrayElemAt: [
                [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ],
                { $subtract: ["$_id", 1] },
              ],
            },
            count: 1,
          },
        },
        { $sort: { day: 1 } }
      );

      const data = await properties.aggregate(pipeline).toArray();

      return res.status(200).json({
        groupBy,
        date: rangeLabel,
        totalCount,
        data,
      });
    }

    if (groupBy === "week") {
      pipeline.push(
        {
          $project: {
            date: {
              $cond: {
                if: { $ifNull: ["$listedOn", false] },
                then: {
                  $dateFromString: {
                    dateString: "$listedOn",
                    format: "%Y-%m-%d",
                    onError: "$createdAt",
                  },
                },
                else: "$createdAt",
              },
            },
          },
        },
        {
          $addFields: {
            dayOfWeek: { $isoDayOfWeek: "$date" },
          },
        },
        {
          $group: {
            _id: "$dayOfWeek",
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } }
      );

      const rawData = await properties.aggregate(pipeline).toArray();

      const fullWeek = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];
      const data = fullWeek.map((day, index) => {
        const found = rawData.find((item) => item._id === index + 1);
        return { day, count: found ? found.count : 0 };
      });

      return res.status(200).json({
        groupBy,
        date: date || undefined,
        weekRange: rangeLabel,
        totalCount,
        data,
      });
    }

    if (groupBy === "month") {
      const monthStart = dayjs.utc(`${year}-${month.padStart(2, "0")}-01`);
      const monthEnd = monthStart.endOf("month");
      const daysInMonth = monthEnd.date();
      const weekSegments = [];

      for (let i = 1; i <= daysInMonth; i += 7) {
        const start = monthStart.date(i);
        const end = start.add(6, "day").isAfter(monthEnd)
          ? monthEnd
          : start.add(6, "day");
        weekSegments.push({
          start: start.toDate(),
          end: end.toDate(),
          label: `${start.format("D MMM")} - ${end.format("D MMM")}`,
        });
      }

      pipeline.push(
        {
          $project: {
            date: {
              $cond: {
                if: { $ifNull: ["$listedOn", false] },
                then: {
                  $dateFromString: {
                    dateString: "$listedOn",
                    format: "%Y-%m-%d",
                    onError: "$createdAt",
                  },
                },
                else: "$createdAt",
              },
            },
          },
        },
        {
          $group: {
            _id: {
              weekStart: {
                $dateTrunc: {
                  date: "$date",
                  unit: "week",
                  startOfWeek: "monday",
                },
              },
            },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            weekStart: "$_id.weekStart",
            count: 1,
          },
        },
        { $sort: { weekStart: 1 } }
      );

      const rawData = await properties.aggregate(pipeline).toArray();

      const data = weekSegments.map((segment) => {
        const weekStart = dayjs.utc(segment.start).startOf("isoWeek").toDate();
        const found = rawData.find(
          (r) => r.weekStart.getTime() === weekStart.getTime()
        );
        return {
          weekRange: segment.label,
          count: found ? found.count : 0,
        };
      });

      return res.status(200).json({
        groupBy,
        year: parseInt(year),
        month: parseInt(month),
        totalCount,
        data,
      });
    }
  } catch (error) {
    console.error("Analytics Error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
