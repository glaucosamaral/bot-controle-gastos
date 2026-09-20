import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// Valida o hash do Telegram Login Widget (secret = SHA256 do token do bot).

export type TelegramLoginPayload = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

export function verificarLoginTelegram(payload: TelegramLoginPayload, botToken: string): boolean {
  const campos = Object.entries(payload)
    .filter(([chave, valor]) => chave !== "hash" && valor !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([chave, valor]) => `${chave}=${valor}`)
    .join("\n");
  const segredo = createHash("sha256").update(botToken).digest();
  const esperado = createHmac("sha256", segredo).update(campos).digest();
  try {
    return timingSafeEqual(esperado, Buffer.from(payload.hash, "hex"));
  } catch {
    return false;
  }
}