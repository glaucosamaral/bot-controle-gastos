// Cliente HTTP minimo para a API do backend.
const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api/v1";
const chaveToken = "gastos.token";

export type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

export function obterToken(): string | null {
  return localStorage.getItem(chaveToken);
}

export function salvarToken(token: string | null): void {
  if (token) {
    localStorage.setItem(chaveToken, token);
  } else {
    localStorage.removeItem(chaveToken);
  }
}

export async function fetchJson<T>(path: string): Promise<T> {
  const token = obterToken();
  const response = await fetch(`${baseUrl}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error("Falha ao buscar dados.");
  return response.json() as Promise<T>;
}

export async function loginTelegram(
  usuario: TelegramUser,
): Promise<{ token: string; usuario: { telegramId: string; nome: string } }> {
  const response = await fetch(`${baseUrl}/auth/telegram`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(usuario),
  });
  if (!response.ok) throw new Error("Falha ao autenticar com o Telegram.");
  const dados = await response.json();
  salvarToken(dados.token);
  return dados;
}