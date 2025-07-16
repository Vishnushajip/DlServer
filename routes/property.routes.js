import express from "express";
import {
  uploadProperty,
  updateRemarks,
  getProperties,
  getVerifiedDocuments,
  updateVerificationStatus,
  getPropertyPosition,
  filterPropertiesByBody,
  deleteDoc,
  getpaginatedproperties,
  getPropertyCount} from "../controllers/property.controller.js";

const router = express.Router();

router.post("/upload", uploadProperty);
router.patch("/updateRemarks", updateRemarks);
router.get("/getProperties", getProperties);
router.get("/getPropertyCount", getPropertyCount);
router.get("/getpaginatedproperties", getpaginatedproperties);
router.get("/getPropertyPosition/:id", getPropertyPosition);
router.get("/getVerifiedDocuments", getVerifiedDocuments);
router.patch("/updateVerificationStatus", updateVerificationStatus);
router.post("/filterPropertiesByBody", filterPropertiesByBody);
router.delete("/:id", deleteDoc);

export default router;
