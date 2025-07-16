import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { https } from "firebase-functions";
import connectToDB from "./models/db.js";
import agentPropertiesRoutes from "./routes/agentProperties.routes.js";
import getAgentStatssRoutes from "./routes/Agentstats.routes.js";
import getAgentSubtypeStats from "./routes/agentStatsRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import getLatestPropertyByAgent from "./routes/documentRoutes.js";
import propertyRouter from "./routes/Favorite.routes.js";
import {
  default as docRoutes,
  default as filterPropertiesByBody,
  default as propertyRoutes,
} from "./routes/property.routes.js";
import propertyAnalyticsRouter from "./routes/propertyAnalytics.routes.js";
import {
  default as locationPropertiesRoutes,
  default as searchPropertiesRoutes,
} from "./routes/searchProperties.routes.js";
import share_routes from "./routes/share_routes.js";
import syncRoutes from "./routes/sync.routes.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

connectToDB();
app.use("/", getLatestPropertyByAgent);
app.use("/", propertyRoutes);
app.use("/", filterPropertiesByBody);
app.use("/", agentPropertiesRoutes);
app.use("/", searchPropertiesRoutes);
app.use("/", locationPropertiesRoutes);
app.use("/", share_routes);
app.use("/deleteproperty", docRoutes);
app.use("/api", getAgentStatssRoutes);
app.use("/api/properties", propertyRouter);
app.use("/api/analytics", propertyAnalyticsRouter);
app.use("/", getAgentSubtypeStats);
app.use("/api", syncRoutes);
app.use("/api", chatRoutes);

const PORT = process.env.APP_PORT;
if (!process.env.FUNCTIONS_EMULATOR) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export const api = https.onRequest(app);
export default app;
