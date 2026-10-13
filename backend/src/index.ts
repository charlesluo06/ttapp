import express from "express";
import { healthRouter } from "./common/health.ts";

const app = express();
app.use(express.json());

// Each feature folder in src/features/ exports a router that gets mounted here.
app.use("/api/health", healthRouter);

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
