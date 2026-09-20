import { Router } from "express";
import { assinarToken } from "../auth/jwt.js";
import { verificarLoginTelegram } from "../auth/telegram.js";
import { pool } from "../db/pool.js";

export const authRouter = Router();

// POST /api/v1/auth/telegram — valida o payload do Telegram Login Widget.
authRouter.post("/telegram", async (req, res) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN ?? "";
  if (!botToken) {
    res.status(500).json({
      error: { code: "ERRO_CONFIG", message: "Token do bot não configurado." },
    });
    return;
  }
  const corpo = req.body ?? {};
  const authDate = Number(corpo.auth_date);
  const ehRecente = Number.isFinite(authDate) && Math.abs(Date.now() / 1000 - authDate) <= 86400;
  const loginValido =
    typeof corpo.id === "number" &&
    typeof corpo.first_name === "string" &&
    typeof corpo.hash === "string" &&
    ehRecente &&
    verificarLoginTelegram(corpo as Parameters<typeof verificarLoginTelegram>[0], botToken);

  if (!loginValido) {
    res.status(401).json({
      error: { code: "NAO_AUTORIZADO", message: "Falha ao validar o login do Telegram." },
    });
    return;
  }

  const telegramId = String(corpo.id);
  const nome = [corpo.first_name, corpo.last_name]
    .filter((parte) => typeof parte === "string" && parte.length > 0)
    .join(" ");

  const jwtSecret = process.env.JWT_SECRET ?? "";
  if (!jwtSecret) {
    res.status(500).json({
      error: { code: "ERRO_CONFIG", message: "Segredo JWT não configurado." },
    });
    return;
  }

  try {
    await pool.query(
      `INSERT INTO usuarios (telegram_id, nome) VALUES ($1, $2)
       ON CONFLICT (telegram_id) DO UPDATE SET nome = EXCLUDED.nome, atualizado_em = now()`,
      [telegramId, nome],
    );
    const validadeSegundos = Number(process.env.JWT_EXPIRES_IN ?? 604800);
    const token = assinarToken(jwtSecret, { sub: telegramId, nome }, validadeSegundos);
    res.json({ token, usuario: { telegramId, nome } });
  } catch {
    res.status(500).json({
      error: { code: "ERRO_INTERNO", message: "Não foi possível autenticar." },
    });
  }
});