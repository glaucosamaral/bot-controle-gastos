import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAuth, requireWebhookSecret, type UsuarioAutenticado } from "../middleware/auth.js";
import { expenseSchema } from "../validation/expenseSchema.js";

export const expensesRouter = Router();

// POST /api/v1/expenses — usado pelo workflow do n8n (autenticado por X-Webhook-Secret).
expensesRouter.post("/", requireWebhookSecret, async (req, res) => {
  const parsed = expenseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({
      error: { code: "DADOS_INVALIDOS", message: "Dados do gasto inválidos." },
    });
    return;
  }
  const { telegramId, descricao, valorCentavos, categoria, dataGasto } = parsed.data;

  try {
    // Garante usuario + categoria e salva o gasto em uma transacao.
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const userResult = await client.query(
        "INSERT INTO usuarios (telegram_id, nome) VALUES ($1, $1) ON CONFLICT (telegram_id) DO UPDATE SET atualizado_em = now() RETURNING id",
        [telegramId],
      );
      const usuarioId = userResult.rows[0].id as string;

      let categoriaId: string | null = null;
      if (categoria) {
        const catResult = await client.query(
          "INSERT INTO categorias (nome) VALUES ($1) ON CONFLICT (nome) DO UPDATE SET atualizado_em = now() RETURNING id",
          [categoria.toLowerCase()],
        );
        categoriaId = catResult.rows[0].id as string;
      }

      const expenseResult = await client.query(
        "INSERT INTO gastos (usuario_id, categoria_id, descricao, valor_centavos, data_gasto) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [usuarioId, categoriaId, descricao, valorCentavos, dataGasto ?? new Date().toISOString().slice(0, 10)],
      );
      await client.query("COMMIT");
      res.status(201).json({ id: expenseResult.rows[0].id });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch {
    // Detalhe tecnico fica so no log do servidor.
    res.status(500).json({
      error: { code: "ERRO_INTERNO", message: "Não foi possível salvar o gasto." },
    });
  }
});

// GET /api/v1/expenses?pagina=1&limite=20 — autenticado via Bearer JWT.
expensesRouter.get("/", requireAuth, async (req, res) => {
  const { telegramId } = res.locals.usuario as UsuarioAutenticado;
  const limite = Math.min(Number(req.query.limite ?? 20), 100);
  const pagina = Math.max(Number(req.query.pagina ?? 1), 1);
  try {
    const { rows } = await pool.query(
      `SELECT g.id, g.descricao, g.valor_centavos, g.data_gasto, c.nome AS categoria
       FROM gastos g LEFT JOIN categorias c ON c.id = g.categoria_id
       JOIN usuarios u ON u.id = g.usuario_id
       WHERE u.telegram_id = $1
       ORDER BY g.data_gasto DESC LIMIT $2 OFFSET $3`,
      [telegramId, limite, (pagina - 1) * limite],
    );
    res.json({ itens: rows, pagina });
  } catch {
    res.status(500).json({
      error: { code: "ERRO_INTERNO", message: "Não foi possível listar os gastos." },
    });
  }
});
