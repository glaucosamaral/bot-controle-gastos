import { Dashboard } from "./pages/Dashboard";

export function App() {
  return (
    <main>
      <h1>Controle de Gastos</h1>
      <p>Envie os gastos pelo Telegram; o resumo aparece aqui.</p>
      <Dashboard />
    </main>
  );
}
