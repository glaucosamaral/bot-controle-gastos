import { Router } from "express";
import { pool } from "../db/pool.js";

export const categoriesRouter = Router();

// GET /api/v1/categories — lista para o frontend e o bot.
categoriesRouter.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, nome FROM categorias ORDER BY nome",
    );
    res.json({ itens: rows });
  } catch {
    res.status(500).json({
      error: { code: "ERRO_INTERNO", message: "Não foi possível listar categorias." },
    });
  }
});
