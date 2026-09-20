import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

export const categoriesRouter = Router();

// GET /api/v1/categories — lista para o frontend (autenticado via JWT).
categoriesRouter.get("/", requireAuth, async (_req, res) => {
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
