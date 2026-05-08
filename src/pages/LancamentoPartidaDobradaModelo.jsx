 import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildWebhookUrl } from "../config/globals";
import { hojeLocal, dataLocal } from "../utils/dataLocal";

export default function LancamentoPartidaDobradaModelo() {
  const navigate = useNavigate();
  const empresa_id = localStorage.getItem("empresa_id") ||  localStorage.getItem("id_empresa") ;

  
 

  const [form, setForm] = useState({
    data_mov: new Date().toISOString().split("T")[0],
    modelo_codigo: "",
    historico: "",
    valor_total: "0,00",
    tipo_lancamento: "NORMAL", // 🔥 NOVO
     data_lanc: hojeLocal(), 
  });

  const [modelos, setModelos] = useState([]);
  const [modeloSelecionado, setModeloSelecionado] = useState(null);
  const [linhas, setLinhas] = useState([]);

  /* ================= MODELOS ================= */
  async function carregarModelos() {
    const url = buildWebhookUrl("modelos", { empresa_id });
    const r = await fetch(url);
    const j = await r.json();
    setModelos(j);
  }

  async function selecionarModelo(token) {
    setForm((f) => ({ ...f, modelo_codigo: token }));

    const m = modelos.find((x) => x.codigo === token);
    setModeloSelecionado(m);
    if (!m) return;

    const url = buildWebhookUrl("modelos_linhas", {
      empresa_id,
      modelo_id: m.id,
    });

    const r = await fetch(url);
    const dados = await r.json();
    setLinhas(dados);
  }

  /* ================= MASK ================= */
  function maskValor(v) {
    v = v.replace(/\D/g, "");
    v = (v / 100).toFixed(2).replace(".", ",");
    return v;
  }
async function salvar() {
 
  // 1) validações básicas
  if (!modeloSelecionado || !Array.isArray(linhas) || linhas.length === 0) {
    alert("Selecione um modelo válido (com linhas D e C).");
    return;
  }

  if (!form.historico?.trim()) {
    alert("Histórico é obrigatório.");
    return;
  }

  if (!form.data_mov) {
    alert("Data é obrigatória.");
    return;
  }

  const valor = Number(form.valor_total.replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(valor) || valor <= 0) {
    alert("Valor inválido.");
    return;
  }

 
  // 2) resolve débito/crédito AQUI (antes de validar)
  let debito_id, credito_id;
  try {
    const r = resolverDebitoCredito(linhas, form.tipo_lancamento);
    debito_id = Number(r.debito_id);
    credito_id = Number(r.credito_id);
  } catch (err) {
    alert(err?.message || "Modelo inválido (não achou D/C).");
    return;
  }
  
   
  // 3) consistências agora que existem
  if (!debito_id || !credito_id) {
    alert("Conta débito e crédito são obrigatórias.");
    return;
  }

  if (debito_id === credito_id) {
    alert("Débito e crédito não podem ser a mesma conta.");
    return;
  }
  

  try {
     
    const resp = await fetch(buildWebhookUrl("lancto_modelo"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
            empresa_id,
             data_lancto: form.data_mov,     // ou data_mov, conforme seu webhook
            debito_id,
            credito_id,
            valor,                        // ✅ aqui é o valor
            historico: form.historico 
        }),
    });
        

 

    const text = await resp.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // se seu webhook retorna texto simples
    }

    if (!resp.ok || json?.erro) {
      alert(json?.erro || text || "Erro ao gravar lançamento.");
      return;
    }

    alert("Partida dobrada registrada com sucesso!");
    navigate(-1);
  } catch (e) {
    alert("Erro de comunicação.");
  } finally {
    setSalvando(false);
  }
}



  useEffect(() => {
    carregarModelos();
  }, []);

  function resolverDebitoCredito(linhas, tipoLancamento) {
  let debito_id = null;
  let credito_id = null;

  for (const l of linhas) {
    if (l.dc === "D") debito_id = l.conta_id;
    if (l.dc === "C") credito_id = l.conta_id;
  }

  if (!debito_id || !credito_id) {
    throw new Error("Modelo inválido: débito ou crédito não encontrado.");
  }

  // 🔄 ESTORNO → INVERTE
  if (tipoLancamento === "ESTORNO") {
    return {
      debito_id: credito_id,
      credito_id: debito_id,
    };
  }

  // ✅ NORMAL
  return {
    debito_id,
    credito_id,
  };
}


  /* ================= UI ================= */
return (
  <div className="min-h-screen py-6 px-4 bg-bgSoft">
    <div className="w-full max-w-3xl mx-auto rounded-3xl p-2 shadow-xl bg-[#061f4aff]">

      <h1 className="text-2xl font-bold mb-6 text-center text-white">
        ✏️ Lançamento Contábil – Modelo Token
      </h1>

      <div className="bg-white p-6 rounded-xl space-y-6">

        {/* MODELO */}
        <div className="space-y-2">
          


             <label className="font-bold text-[#1e40af] flex items-center gap-2">
                  Token do Modelo*
                <span className="relative group cursor-pointer">
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-600 text-white text-xs">
                    ?
                  </span>
                  <div className="absolute left-6 top-0 z-50 hidden group-hover:block 
                                  bg-gray-900 text-white text-xs rounded-lg p-3 w-80 shadow-lg">
                    <strong>O que é este campo?</strong>

                    <p className="mt-2">
                      Define o <b>modelo contábil</b> que será usado no lançamento.
                    </p>

                    <p className="mt-2">
                      Ao escolher um modelo, o sistema já sabe quais contas serão usadas
                      para <b>débito e crédito</b>.
                    </p>

                    <p className="mt-2 text-yellow-300">
                      ⚠ Você não precisa selecionar as contas manualmente.
                      O modelo funciona como um <b>template pronto de lançamento</b>.
                    </p>
                  </div> 
                </span>
              </label>

          <input
            list="listaTokens"
            value={form.modelo_codigo}
            className="input-premium"
            onChange={(e) => selecionarModelo(e.target.value)}
          />
          <datalist id="listaTokens">
            {modelos.map((m) => (
              <option key={m.id} value={m.codigo} />
            ))}
          </datalist>
        </div>

        {/* BLOCO MODELO */}
        {modeloSelecionado && (
          <div className="space-y-3">
            <div className="bg-gray-300 text-[#003ba2] p-3 rounded font-bold">
              Nome: {modeloSelecionado.nome}
            </div>

            <table className="tabela tabela-mapeamento w-full border-collapse">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th>ID</th>
                  <th>Conta</th>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Natureza</th>
                  <th>D/C</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-gray-100" : "bg-gray-200"}>
                    <td>{l.conta_id}</td>
                    <td>{l.codigo}</td>
                    <td>{l.nome}</td>
                    <td>{l.tipo}</td>
                    <td>{l.natureza}</td>
                    <td>{l.dc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TIPO */}
        <div className="space-y-2">



          
        
            <label className="font-bold text-[#1e40af] flex items-center gap-2">
                  Tipo do Lançamento *
                <span className="relative group cursor-pointer">
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-600 text-white text-xs">
                    ?
                  </span>

                  <div className="absolute left-6 top-0 z-50 hidden group-hover:block 
                            bg-gray-900 text-white text-xs rounded-lg p-3 w-80 shadow-lg">
                        <strong>O que é este campo?</strong>

                        <p className="mt-2">
                          Define se o lançamento seguirá o <b>modelo original</b> ou se será um
                          <b> estorno do modelo</b>.
                        </p>

                        <p className="mt-2">
                          • <b>Normal</b>: aplica o débito e crédito exatamente como definidos no modelo.<br/>
                          • <b>Estorno</b>: inverte as contas do modelo.
                        </p>

                        <p className="mt-2 text-yellow-300">
                          ⚠ No estorno, o débito vira crédito e o crédito vira débito.
                        </p>
                      </div>

                </span>
              </label>


          <select
            className="input-premium"
            value={form.tipo_lancamento}
            onChange={(e) =>
              setForm((f) => ({ ...f, tipo_lancamento: e.target.value }))
            }
          >
            <option value="NORMAL">Normal</option>
            <option value="ESTORNO">Estorno</option>
          </select>
        </div>

        {/* HISTÓRICO */}
        <div className="space-y-2">
          <label className="label label-required font-bold text-[#1e40af]">
            Histórico
          </label>
          <input
            className="input-premium"
            value={form.historico}
            onChange={(e) =>
              setForm((f) => ({ ...f, historico: e.target.value }))
            }
          />
        </div>

        {/* VALOR */}
        <div className="space-y-2">
          <label className="label label-required font-bold text-[#1e40af]">
            Valor
          </label>
          <input
              className="input-premium"
              type="text"
              placeholder="0,00"
              value={form.valor_total || ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  valor_total: maskValor(e.target.value),
                }))
              }
            />

        </div>

        {/* DATA */}
        <div className="space-y-2">
          <label className="label label-required font-bold text-[#1e40af]">
            Data Lançamento
          </label>
          <input
            type="date"
            className="input-premium"
            value={form.data_lanc}
            onChange={(e) =>
              setForm((f) => ({ ...f, data_lanc: e.target.value }))
            }
          />
        </div>

        {/* BOTÕES */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={salvar}
            className="flex-1 bg-[#061f4aff] text-white px-4 py-3 rounded font-bold"
          >
            Salvar
          </button>

          <button
            onClick={() => navigate(-1)}
            className="flex-1 bg-gray-500 text-white px-4 py-3 rounded font-bold"
          >
            Cancelar
          </button>
        </div>

      </div>
    </div>
  </div>
);

}
