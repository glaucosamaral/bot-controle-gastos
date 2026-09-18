import { Pool } from "pg";

// Pool unico reutilizado em todo o backend.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
