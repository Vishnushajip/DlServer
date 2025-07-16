import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema({
  listedOn: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Analytics = mongoose.models.Analytics || mongoose.model("Analytics", analyticsSchema);
