import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import client from "./utils/redisClient.js";
import patientRoutes from "./routes/patient-routes.js";
import hospitalRoutes from "./routes/hospital-routes.js";

dotenv.config({ path: "../.env" });
const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(cors());

app.get("/health", (req, res) => {
  res.send("Server is healthy");
});

app.use("/api/v1/patient", patientRoutes);
app.use("/api/v1/hospital", hospitalRoutes);

let redisClient;

app.listen(PORT, async () => {
  try {
    
    await client.connect();

    console.log("Redis connected successfully");
    console.log(`Server is running on ${PORT}`);
  } catch (error) {
    console.error("Error connecting to Redis:", error);
    process.exit(1); // Exit process if Redis connection fails
  }
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  if (redisClient) {
    await redisClient.quit();
  }
  process.exit(0);
});

process.on("SIGINT", async () => {
  if (redisClient) {
    await redisClient.quit();
  }
  process.exit(0);
});
