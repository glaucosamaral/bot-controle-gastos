import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAuth, type UsuarioAutenticado } from "../middleware/auth.js";

export const reportsRouter = Router();

// GET /api/v1/reports/monthly?mes=2026-09 — total por categoria (autenticado via JWT).
reportsRouter.get("/monthly", requireAuth, async (req, res) => {
  const { telegramId } = res.locals.usuario as UsuarioAutenticado;
  const mes = String(req.query.mes ?? "");
  if (!/^\d{4}-\d{2}$/.test(mes)) {
    res.status(422).json({
      error: { code: "DADOS_INVALIDOS", message: "Informe o mês (AAAA-MM)." },
    });
    return;
  }
  try {
    const { rows } = await pool.query(
      `SELECT COALESCE(c.nome, 'sem_categoria') AS categoria, SUM(g.valor_centavos) AS total_centavos
       FROM gastos g LEFT JOIN categorias c ON c.id = g.categoria_id
       JOIN usuarios u ON u.id = g.usuario_id
       WHERE u.telegram_id = $1 AND to_char(g.data_gasto, 'YYYY-MM') = $2
       GROUP BY categoria ORDER BY total_centavos DESC`,
      [telegramId, mes],
    );
    res.json({ mes, itens: rows });
  } catch {
    res.status(500).json({
      error: { code: "ERRO_INTERNO", message: "Não foi possível gerar o relatório." },
    });
  }
});
