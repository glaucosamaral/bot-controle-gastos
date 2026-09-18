import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { categoriesRouter } from "./routes/categories.js";
import { expensesRouter } from "./routes/expenses.js";
import { reportsRouter } from "./routes/reports.js";

dotenv.config();

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/v1/expenses", expensesRouter);
  app.use("/api/v1/categories", categoriesRouter);
  app.use("/api/v1/reports", reportsRouter);
  return app;
}
