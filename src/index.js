import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import patientRoutes from "./routes/patient-routes.js";

dotenv.config({ path: "../.env" });
const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(cors());

app.get("/health", (req, res) => {
  res.send("Server is healthy");
});

app.use("/api/v1/patient", patientRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
