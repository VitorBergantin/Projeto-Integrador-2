// src/js/relatorio.js
import { db } from "../lib/firebase.js";
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

/**
 * Heurística para decidir se um documento de empréstimo representa
 * um empréstimo ATIVO (livro emprestado).
 *
 * Regras cobertas:
 * - se existir campo 'disponivel' === 0 -> emprestado
 * - se existir campo 'status' e for 'ativo'|'emprestado' -> emprestado
 * - se existir campo 'status' e for 'devolvido' -> NÃO é emprestado
 * - se existir campo 'dataDevolucao' -> já devolvido (NÃO é emprestado)
 * - fallback: se documento contém codigoLivro/ra/dataRetirada assume como empréstimo
 */
function isEmprestado(empData) {
  try {
    if (empData === null || typeof empData !== "object") return false;

    // disponivel no próprio empréstimo (alguns esquemas usam isso)
    if (Object.prototype.hasOwnProperty.call(empData, "disponivel")) {
      const v = empData.disponivel;
      if (v === 0 || v === "0" || v === false) return true;
      if (v === 1 || v === "1" || v === true) return false;
    }

    // status textual
    if (empData.status) {
      const s = String(empData.status).toLowerCase();
      if (s === "devolvido" || s === "retornado") return false;
      if (s === "ativo" || s === "emprestado" || s === "borrowed") return true;
    }

    // se tem dataDevolucao, então não está mais emprestado
    if (empData.dataDevolucao || empData.data_devolucao || empData.dataDevolucaoAt) {
      return false;
    }

    // se tem dataRetirada e codigoLivro e RA, supõe que é empréstimo ativo (fallback)
    if ((empData.codigoLivro || empData.codigo) && (empData.ra || empData.aluno)) {
      return true;
    }

    return false;
  } catch (e) {
    console.warn("isEmprestado error:", e);
    return false;
  }
}

function formatTimestampToPTBR(t) {
  if (!t) return "—";
  try {
    // Firestore Timestamp has toDate()
    if (typeof t.toDate === "function") {
      return t.toDate().toLocaleString("pt-BR");
    }
    // If it's a JS Date
    if (t instanceof Date) {
      return t.toLocaleString("pt-BR");
    }
    // If it's an ISO string
    const parsed = new Date(t);
    if (!isNaN(parsed)) return parsed.toLocaleString("pt-BR");
    return String(t);
  } catch (e) {
    return String(t);
  }
}

async function findExistingCollectionName(possibleNames) {
  // tenta ler 1 doc de cada nome e retorna o primeiro que existir (ou vazio)
  for (const name of possibleNames) {
    try {
      const colRef = collection(db, name);
      const snap = await getDocs(query(colRef, where("__name__", "!=", "__none__"))); // pega docs se existirem
      // se conseguir chegar aqui sem erro, retorna o nome (não garante docs existirem)
      return name;
    } catch (e) {
      // ignora e tenta próximo
      console.debug("Coleção não encontrada ou inacessível:", name, e && e.message ? e.message : e);
    }
  }
  // se não achou, retorna o primeiro nome como fallback
  return possibleNames[0];
}

export default async function gerarRelatorio() {
  const corpoTabela = document.getElementById("relatorio-corpo");
  if (!corpoTabela) {
    console.error("Elemento #relatorio-corpo não encontrado no DOM.");
    return;
  }

  corpoTabela.innerHTML = `<tr><td colspan="3">Carregando...</td></tr>`;

  try {
    // 1) descobrir nome da coleção de empréstimos (singular/plural)
    const emprestimoCandidates = ["emprestimos", "emprestimo"];
    const emprestimosCollectionName = await findExistingCollectionName(emprestimoCandidates);
    console.debug("Usando coleção de empréstimos:", emprestimosCollectionName);

    // 2) buscar todos os empréstimos (limit não aplicado para relatório completo)
    const emprestimosSnap = await getDocs(collection(db, emprestimosCollectionName));
    console.debug("Total documentos na coleção de empréstimos:", emprestimosSnap.size);

    if (emprestimosSnap.empty) {
      corpoTabela.innerHTML = `<tr><td colspan="3" class="no-results">Nenhum empréstimo registrado.</td></tr>`;
      return;
    }

    // 3) filtrar apenas os que parecem estar emprestados
    const emprestimosDocs = emprestimosSnap.docs.map(d => ({ id: d.id, data: d.data() }));
    const emprestimosAtivos = emprestimosDocs.filter(e => isEmprestado(e.data));

    console.debug("Empréstimos detectados como ATIVOS:", emprestimosAtivos.length);

    if (emprestimosAtivos.length === 0) {
      corpoTabela.innerHTML = `<tr><td colspan="3" class="no-results">Nenhum livro emprestado no momento.</td></tr>`;
      console.debug("Lista completa de empréstimos (para debug):", emprestimosDocs);
      return;
    }

    // 4) construir mapa de livros (por codigo) para lookup rápido
    const livrosSnap = await getDocs(collection(db, "livros"));
    const livrosMap = new Map();
    livrosSnap.forEach(d => {
      const data = d.data();
      const codigo = data.codigo || data.codigoLivro || data.id || d.id;
      if (codigo !== undefined && codigo !== null) {
        livrosMap.set(String(codigo), { id: d.id, data });
      } else {
        // fallback: talvez usar nome como chave — omitido aqui
      }
    });
    console.debug("Total livros no banco:", livrosMap.size);

    // 5) preenche a tabela
    corpoTabela.innerHTML = ""; // limpa
    for (const emp of emprestimosAtivos) {
      const e = emp.data;

      // tenta localizar nome do livro no próprio empréstimo, senão no mapa de livros
      let nomeLivro = e.nomeLivro || e.nome || "—";
      const codigoLivro = e.codigoLivro || e.codigo || e.bookCode || null;

      if ((!nomeLivro || nomeLivro === "—") && codigoLivro) {
        const found = livrosMap.get(String(codigoLivro));
        if (found) nomeLivro = found.data.nome || found.data.title || "Sem título";
      }

      // RA
      const ra = e.ra || e.aluno || e.student || "—";

      // data retirada (padrões possíveis)
      const dataRetirada = e.dataRetirada || e.data_retirada || e.dataRetiradaAt || e.createdAt || e.timestamp || null;
      const dataForm = formatTimestampToPTBR(dataRetirada);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(nomeLivro)}</td>
        <td>${escapeHtml(String(ra))}</td>
        <td>${escapeHtml(dataForm)}</td>
      `;
      corpoTabela.appendChild(tr);
    }

  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    corpoTabela.innerHTML = `<tr><td colspan="3" class="no-results">Erro ao carregar relatório.</td></tr>`;
  }
}

// Utilitário de escape simples (evita XSS mínimo)
function escapeHtml(s){
  return String(s || "").replace(/[&<>"'`]/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;",'`':'&#96;'
  })[c]);
}

// rodar quando a página carregar
document.addEventListener("DOMContentLoaded", () => {
  gerarRelatorio().catch(e => console.error("gerarRelatorio falhou:", e));
});
