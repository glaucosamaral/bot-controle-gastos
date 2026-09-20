import { useCallback, useEffect, useState } from "react";
import { TelegramLogin } from "../components/TelegramLogin";
import {
  fetchJson,
  loginTelegram,
  obterToken,
  salvarToken,
  type TelegramUser,
} from "../services/api";

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
  const [usuario, setUsuario] = useState<{ nome: string } | null>(null);

  const carregarRelatorio = useCallback(async () => {
    const mes = new Date().toISOString().slice(0, 7);
    const dados = await fetchJson<{ itens: ReportItem[] }>(`/reports/monthly?mes=${mes}`);
    setItens(dados.itens);
    setErro("");
  }, []);

  useEffect(() => {
    if (!obterToken()) return;
    carregarRelatorio().catch(() => {
      salvarToken(null);
      setErro("Sessão expirada. Faça login novamente.");
    });
  }, [carregarRelatorio]);

  const handleLogin = async (dadosTelegram: TelegramUser) => {
    try {
      const sessao = await loginTelegram(dadosTelegram);
      setUsuario(sessao.usuario);
      await carregarRelatorio();
    } catch {
      setErro("Não foi possível fazer login.");
    }
  };

  const handleLogout = () => {
    salvarToken(null);
    setUsuario(null);
    setItens([]);
    setErro("");
  };

  if (!usuario && !obterToken()) {
    return (
      <section>
        {erro && <p>{erro}</p>}
        <p>Entre com o Telegram para ver o resumo do mês.</p>
        <TelegramLogin onLogin={handleLogin} />
      </section>
    );
  }

  return (
    <section>
      <p>
        Olá, {usuario?.nome ?? "você"}!{" "}
        <button type="button" onClick={handleLogout}>
          Sair
        </button>
      </p>
      {erro && <p>{erro}</p>}
      <ul>
        {itens.map((item) => (
          <li key={item.categoria}>
            {item.categoria}: {formatarMoeda(Number(item.total_centavos))}
          </li>
        ))}
      </ul>
    </section>
  );
}