import { useEffect, useState } from "react";
import { fetchJson } from "../services/api";

type ReportItem = { categoria: string; total_centavos: string };

// Converte centavos para moeda BR.
function formatarMoeda(valorCentavos: number): string {
  return (valorCentavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function Dashboard() {
  const [itens, setItens] = useState<ReportItem[]>([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const mes = new Date().toISOString().slice(0, 7);
    fetchJson<{ itens: ReportItem[] }>(`/reports/monthly?telegramId=demo&mes=${mes}`)
      .then((data) => setItens(data.itens))
      .catch(() => setErro("Não foi possível carregar o relatório."));
  }, []);

  if (erro) return <p>{erro}</p>;
  return (
    <ul>
      {itens.map((item) => (
        <li key={item.categoria}>
          {item.categoria}: {formatarMoeda(Number(item.total_centavos))}
        </li>
      ))}
    </ul>
  );
}
