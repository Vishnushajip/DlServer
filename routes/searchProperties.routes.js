import express from "express";
import {
  searchAgentProperties,
  searchproperty,
  locationPropertiesRoutes,
  updateProperty,
  updatePropertyImages
} from "../controllers/searchProperties.controller.js";

const router = express.Router();

router.get("/search", searchAgentProperties);
router.get("/searchproperty", searchproperty);
router.get("/location", locationPropertiesRoutes);
router.put("/property/:id", updateProperty);
router.put("/updatePropertyImages/:id", updatePropertyImages);

export default router;
