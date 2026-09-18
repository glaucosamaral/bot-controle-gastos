// Cliente HTTP minimo para a API do backend.
const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api/v1";

export async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) throw new Error("Falha ao buscar dados.");
  return response.json() as Promise<T>;
}
