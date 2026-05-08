 import { useState } from "react";
import { buildWebhookUrl } from "../config/globals";
import { hojeLocal } from "../utils/dataLocal";

export default function TributosApuracao() {
  const empresa_id =
    localStorage.getItem("empresa_id") ||
    localStorage.getItem("id_empresa");

  const [dataIni, setDataIni] = useState(hojeLocal().slice(0, 7) + "-01");
  const [dataFim, setDataFim] = useState(hojeLocal());
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(false);
 
 const btnPadrao = "w-60 h-12 flex items-center justify-center text-white font-semibold rounded-lg text-base";
const [tipoRelatorio, setTipoRelatorio] = useState("ANALITICO"); 
// ANALITICO | SINTETICO

 const [status, setStatus] = useState(null); 
// null | APURADO | OBRIGACAO_GERADA

 
 

   // 👉 FORMATA DATA DA TABELA (remove horário)
  const formatarData = (d) => {
    if (!d) return "";
    const dt = d.split("T")[0]; // só AAAA-MM-DD
    const [ano, mes, dia] = dt.split("-");
    return `${dia}/${mes}/${ano}`;
  };


  async function apurar() {
    setLoading(true);
    try {
      const response = await fetch(
        buildWebhookUrl("apurar_tributos_periodo"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            empresa_id,
            data_ini: dataIni,
            data_fim: dataFim,
          }),
        }
      );

      const dados = await response.json();

      // 👉 AQUI OS DADOS CHEGAM
      setLista(Array.isArray(dados) ? dados : []);
    } catch (e) {
      console.error("Erro ao apurar tributos:", e);
      setLista([]);
    } finally {
      setLoading(false);
    }
  }
 
 async function pesquisar() {
  setLoading(true);

  try {
    // 🔑 ESCOLHA DO WEBHOOK
    const webhook =
      tipoRelatorio === "SINTETICO"
        ? "apuracao_sintetico"
        : "apuracao_analitico";

    const response = await fetch(
      buildWebhookUrl(webhook),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresa_id,
          data_ini: dataIni,
          data_fim: dataFim,
          status // null = todos
        }),
      }
    );

    const dados = await response.json();

    setLista(Array.isArray(dados) ? dados : []);

  } catch (e) {
    console.error("Erro ao buscar relatório:", e);
    setLista([]);
  } finally {
    setLoading(false);
  }
}


  async function gerarObrigacao(apuracao_id) {

 

  try {
    const resp = await fetch(
      buildWebhookUrl("gerarobrigacao"),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
           empresa_id,
        }),
      }
    );

    const text = await resp.text();
    let json = null;

    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      throw new Error("Resposta inválida do servidor.");
    }

    if (!resp.ok || json?.ok === false) {
      throw new Error(json?.message || "Erro ao gerar obrigação.");
    }

    return json; // { ok: true, obrigacao_id: X }

  } catch (e) {
    console.error("Erro gerarObrigacao:", e);
    alert(e.message || "Erro de comunicação.");
    return null;
  }
}

  return (
    <div className="p-2">
     

      {/* FILTROS */}
      <div className="bg-white rounded-xl shadow p-2 border-[8px] border-[#061f4aff] mb-4 flex gap-4 items-end">

          <div className="grid grid-cols-1 gap-4"> 
                
              
              <h2 className="text-2xl font-bold text-[#061f4aff] mb-4">
              📊 Apuração de Tributos
            </h2>
           <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
 
                <div>
                  <label className="font-bold text-[#061f4aff]">Data Inicial</label>
                  <input
                    type="date"
                    className="input-premium"
                    value={dataIni}
                    onChange={(e) => setDataIni(e.target.value)}
                  />
                </div>

                  <div>
                    <label className="font-bold text-[#061f4aff]">Data Final</label>
                    <input
                      type="date"
                      className="input-premium"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                    />
                  </div>

                <button
                  onClick={apurar} 
                    className={ `${btnPadrao} bg-blue-600  hover:blue-600`}
                  disabled={loading}
                >
                  {loading ? "Apurando..." : "Apurar Tributos"}
                </button>


                
                <button
                  onClick={gerarObrigacao}
                      className={ `${btnPadrao} bg-red-800  hover:blue-400`}
                  disabled={loading}
                >
                  {loading ? "Gerando Obrigações..." : "Gerar Obrigação"}
                </button>
                
                <div className="flex gap-6 items-center mb-4">
                  <label className="flex items-center gap-2 font-bold text-[#061f4aff]">
                    <input
                      type="radio"
                      name="tipoRelatorio"
                      checked={tipoRelatorio === "ANALITICO"}
                      onChange={() => setTipoRelatorio("ANALITICO")}
                    />
                    Relatório Analítico
                  </label>

                <label className="flex items-center gap-2 font-bold text-[#061f4aff]">
                  <input
                    type="radio"
                    name="tipoRelatorio"
                    checked={tipoRelatorio === "SINTETICO"}
                    onChange={() => setTipoRelatorio("SINTETICO")}
                  />
                  Relatório Sintético
                </label>
              </div> 
                <select
                  value={status ?? ""}
                  onChange={(e) =>
                    setStatus(e.target.value === "" ? null : e.target.value)
                  }
                  className="input-premium w-30"
                >
                  <option value="">Todos</option>
                  <option value="APURADO">Apurado</option>
                  <option value="OBRIGACAO_GERADA">Obrigação Gerada</option>
                </select>

              <button
                onClick={pesquisar}
                  className={ `${btnPadrao} bg-blue-800  hover:blue-400`}
                disabled={loading}
              >
                {loading ? "Pesquisar..." : "Pesquisar"}
              </button>
            </div>

      </div>
       </div>

      {/* TABELA */}
      <div className="bg-gray-100 rounded-xl p-4 shadow border-[2px] border-gray-500">
        <table className="w-full border-separate border-spacing-y-2">
          <thead className="bg-blue-900 text-white text-sm">
  <tr>
    <th className="px-3 py-2 text-left font-semibold">Tributo</th>
      <th className="px-3 py-2 text-left font-semibold">Nome</th>
    <th className="px-3 py-2 text-right font-semibold">Alíquota</th>
    <th className="px-3 py-2 text-right font-semibold">Base</th>
    <th className="px-3 py-2 text-right font-semibold">Valor</th>
    <th className="px-3 py-2 text-center font-semibold">Período</th>
    <th className="px-3 py-2 text-center font-semibold">Status</th>
  </tr>
</thead>

<tbody className="text-sm">
  {lista.length === 0 && (
    <tr>
      <td colSpan="6" className="text-center py-4 font-semibold">
        Nenhum dado encontrado
      </td>
    </tr>
  )}

  {lista.map((l, i) => (
    <tr
      key={i}
      className={i % 2 ? "bg-[#f2f2f2]" : "bg-[#e6e6e6]"}
    >
      {/* DESCRIÇÃO */}
      <td className="px-3 py-2 text-left font-bold">
        {l.tributo}
      </td>

       {/* DESCRIÇÃO */}
      <td className="px-3 py-2 text-left font-bold">
        {l.codigo}
      </td>

      {/* ALÍQUOTA */}
      <td className="px-3 py-2 text-right font-bold">
        {Number(l. aliquota_apurada ).toLocaleString("pt-BR")}%
      </td>

      {/* BASE */}
      <td className="px-3 py-2 text-right font-bold">
        {Number(l.base_calculo).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}
      </td>

      {/* VALOR */}
      <td className="px-3 py-2 text-right font-bold">
        {Number(l.valor_apurado).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}
      </td>

      {/* PERÍODO */}
      <td className="px-3 py-2 text-center font-bold">
        {formatarData(l.data_final)} a {formatarData(dataFim)}
      </td>

      {/* STATUS */}
      <td className="px-3 py-2 text-center font-bold">
        {l.situacao}
      </td>
    </tr>
  ))}
</tbody>

        </table>
      </div>
    </div>
  );
}
