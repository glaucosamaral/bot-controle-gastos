import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { verificarToken } from "../auth/jwt.js";

export type UsuarioAutenticado = {
  telegramId: string;
  nome: string;
};

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const cabecalho = req.headers.authorization;
  const token = cabecalho?.startsWith("Bearer ") ? cabecalho.slice(7) : undefined;
  const segredo = process.env.JWT_SECRET ?? "";
  const payload = token ? verificarToken(segredo, token) : null;
  if (!payload) {
    res.status(401).json({
      error: { code: "NAO_AUTORIZADO", message: "Autenticação necessária." },
    });
    return;
  }
  res.locals.usuario = { telegramId: payload.sub, nome: payload.nome } satisfies UsuarioAutenticado;
  next();
}

export function requireWebhookSecret(req: Request, res: Response, next: NextFunction): void {
  const esperado = process.env.N8N_WEBHOOK_SECRET ?? "";
  if (!esperado) {
    res.status(500).json({
      error: { code: "ERRO_CONFIG", message: "Segredo do webhook não configurado." },
    });
    return;
  }
  const recebido = String(req.headers["x-webhook-secret"] ?? "");
  let valido = false;
  try {
    valido = timingSafeEqual(Buffer.from(esperado), Buffer.from(recebido));
  } catch {
    // tamanhos diferentes: permanece inválido
  }
  if (!valido) {
    res.status(401).json({
      error: { code: "NAO_AUTORIZADO", message: "Segredo do webhook inválido." },
    });
    return;
  }
  next();
}