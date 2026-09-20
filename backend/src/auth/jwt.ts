import { createHmac, timingSafeEqual } from "node:crypto";

// JWT HS256 mínimo, sem dependência externa.

type DadosToken = {
  sub: string;
  nome: string;
};

function base64url(valor: string): string {
  return Buffer.from(valor).toString("base64url");
}

export function assinarToken(secret: string, dados: DadosToken, validadeSegundos: number): string {
  const agora = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const corpo = base64url(JSON.stringify({ ...dados, iat: agora, exp: agora + validadeSegundos }));
  const assinatura = createHmac("sha256", secret).update(`${header}.${corpo}`).digest("base64url");
  return `${header}.${corpo}.${assinatura}`;
}

export function verificarToken(secret: string, token: string): DadosToken | null {
  const partes = token.split(".");
  if (partes.length !== 3) return null;
  const [header, corpo, assinatura] = partes;
  const esperada = createHmac("sha256", secret).update(`${header}.${corpo}`).digest("base64url");
  try {
    if (!timingSafeEqual(Buffer.from(esperada), Buffer.from(assinatura))) return null;
  } catch {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(corpo, "base64url").toString("utf8")) as Record<string, unknown>;
    const exp = Number(payload.exp);
    if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return null;
    if (typeof payload.sub !== "string" || typeof payload.nome !== "string") return null;
    return { sub: payload.sub, nome: payload.nome };
  } catch {
    return null;
  }
}