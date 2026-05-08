 
import { useState } from "react";
//import { useParams, useNavigate } from "react-router-dom";
import { buildWebhookUrl } from "../config/globals";
import { useParams, useNavigate, useLocation } from "react-router-dom";

export default function AlterarSaldo() {
  const { id } = useParams(); // conta_id
  const navigate = useNavigate();
   const empresa_id = Number(localStorage.getItem("empresa_id") || Number(localStorage.getItem("id_empresa") ));

  const [tipo, setTipo] = useState("entrada"); // entrada | saida
  const [valor, setValor] = useState("");
  const [historico, setHistorico] = useState("");
  const [loading, setLoading] = useState(false);

 
const { state } = useLocation();     // dados visuais
const contaCodigo = state?.conta_codigo || "";
const contaNome   = state?.conta_nome || "";
async function salvar() {
  if (!valor || Number(valor) <= 0) {
    alert("Informe um valor válido.");
    return;
  }

  if (!historico.trim()) {
    alert("Informe o histórico.");
    return;
  }

  // 🔹 lógica no FRONT (correto)
  const valor_debito  = tipo === "entrada" ? Number(valor) : 0;
  const valor_credito = tipo === "saida"   ? Number(valor) : 0;

  setLoading(true);

  try {
    const url = buildWebhookUrl("lancamento_contabil_manual");

    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        empresa_id,
        conta_id: Number(id),
        valor_debito,
        valor_credito,
        historico
      })
    });

    alert("Lançamento gerado com sucesso!");
    navigate("/lancamentos-contabeis");

  } catch (e) {
    alert("Erro ao salvar lançamento.");
  } finally {
    setLoading(false);
  }
}


  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-xl font-bold text-blue-800 mb-4">
        Alterar Saldo (Lançamento Manual)
      </h2>

      <div className="bg-white rounded-xl shadow p-6 border-4 border-blue-900 space-y-4">

        {/* Conta */}
        <div>
          <label className="font-bold text-blue-800">Conta Contábil</label>
           
           <input
                disabled
                value={`${contaCodigo} - ${contaNome}`}
                className="w-full border px-3 py-2 rounded bg-gray-100"
                />

 
          
        </div>

        {/* Tipo */}
        <div>
          <label className="font-bold text-blue-800">Tipo</label>
          <select
            value={tipo}
            onChange={e => setTipo(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="entrada">Entrada (crédito/débito conforme natureza)</option>
            <option value="saida">Saída (inverso da entrada)</option>
          </select>
        </div>

        {/* Valor */}
        <div>
          <label className="font-bold text-blue-800">Valor</label>
          <input
            type="number"
            step="0.01"
            value={valor}
            onChange={e => setValor(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        {/* Histórico */}
        <div>
          <label className="font-bold text-blue-800">Histórico</label>
          <input
            value={historico}
            onChange={e => setHistorico(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            placeholder="Ex: Ajuste manual de saldo"
          />
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={salvar}
            disabled={loading}
            className="bg-blue-700 text-white px-6 py-2 rounded font-bold hover:bg-blue-800"
          >
            Salvar
          </button>

          <button
            onClick={() => navigate(-1)}
            className="bg-gray-400 text-white px-6 py-2 rounded font-bold"
          >
            Cancelar
          </button>
        </div>

      </div>
    </div>
  );
}
