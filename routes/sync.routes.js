import express from "express";
import { syncPropertiesToFirestore } from "../cronJobs/syncPropertiesJob.js"; 

const router = express.Router();

router.post("/trigger", async (req, res) => {
  try {
    const result = await syncPropertiesToFirestore();
    res.status(200).json({
      message: "Firestore sync triggered successfully",
      ...result,
    });
  } catch (error) {
    console.error("❌ Error in manual sync trigger:", error);
    res.status(500).json({ error: "Sync failed", details: error.message });
  }
});

export default router;
