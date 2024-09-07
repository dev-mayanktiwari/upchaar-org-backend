import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });
const app = express();
const PORT = process.env.PORT;
console.log(PORT);

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Server is healthy");
});

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
