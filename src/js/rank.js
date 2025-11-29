// rank.js — versão final unificada
import { db } from "../lib/firebase.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

/* ---------------------------------------------------------
   FUNÇÕES AUXILIARES
----------------------------------------------------------*/

// Data mínima — últimos 6 meses
function getDateLastSemester() {
  const d = new Date();
  d.setMonth(d.getMonth() - 6);
  return d;
}

// Classificação de leitores
function getLeitorRank(qtd) {
  if (qtd <= 5) return "Leitor Iniciante";
  if (qtd <= 10) return "Leitor Regular";
  if (qtd <= 20) return "Leitor Ativo";
  return "Leitor Extremo";
}

// Busca nome do aluno na coleção "alunos" pelo RA
async function fetchStudentName(ra) {
  try {
    const snap = await getDocs(query(collection(db, "alunos"), where("ra", "==", ra)));
    if (!snap.empty) {
      return snap.docs[0].data().nome || "Aluno sem nome";
    }
  } catch (e) {
    console.warn("Erro ao buscar nome:", e);
  }
  return "Nome não encontrado";
}

/* ---------------------------------------------------------
   OBTENDO OS DADOS DO FIRESTORE
----------------------------------------------------------*/

export async function fetchTopReaders() {
  const seisMesesAtras = getDateLastSemester();
  let contador = new Map();

  try {
    const emprestimosSnap = await getDocs(collection(db, "emprestimos"));

    emprestimosSnap.forEach(doc => {
      const data = doc.data();
      if (!data.ra || !data.dataRetirada) return;

      const dt = data.dataRetirada.toDate ? data.dataRetirada.toDate() : new Date(data.dataRetirada);

      if (dt >= seisMesesAtras) {
        contador.set(data.ra, (contador.get(data.ra) || 0) + 1);
      }
    });

    // Map → Array
    let lista = [];
    for (const [ra, total] of contador.entries()) {
      lista.push({ ra, total });
    }

    // Ordena do maior para o menor
    lista.sort((a, b) => b.total - a.total);

    // Adiciona nome e rank
    for (const item of lista) {
      item.nome = await fetchStudentName(item.ra);
      item.rank = getLeitorRank(item.total);
    }

    return lista;

  } catch (err) {
    console.error("Erro ao buscar leitores:", err);
    return [];
  }
}

/* ---------------------------------------------------------
   RENDERIZAÇÃO EM LISTA <ul>
----------------------------------------------------------*/

export function renderTopReadersList(container, list) {
  container.innerHTML = "";

  if (!list.length) {
    container.innerHTML = "<li class='empty'>Nenhum dado encontrado</li>";
    return;
  }

  list.forEach((item, index) => {
    const li = document.createElement("li");
    li.classList.add("reader-row");

    li.innerHTML = `
      <span class="posicao">${index + 1}º</span>
      <span class="ra">RA: ${item.ra}</span>
      <span class="nome">${item.nome}</span>
      <span class="total">${item.total} livros</span>
      <span class="rank-label">${item.rank}</span>
    `;
    container.appendChild(li);
  });
}

/* ---------------------------------------------------------
   RENDERIZAÇÃO EM TABELA <table>
----------------------------------------------------------*/

export function renderTopReadersTable(tbody, list) {
  tbody.innerHTML = "";

  if (!list.length) {
    tbody.innerHTML = "<tr><td colspan='4'>Nenhum dado encontrado</td></tr>";
    return;
  }

  list.forEach(item => {
    const linha = `
      <tr>
        <td>${item.nome}</td>
        <td>${item.ra}</td>
        <td>${item.total}</td>
        <td>${item.rank}</td>
      </tr>
    `;
    tbody.insertAdjacentHTML("beforeend", linha);
  });
}

/* ---------------------------------------------------------
   INICIALIZAÇÃO AUTOMÁTICA
   (funciona com UL e com TABELA ao mesmo tempo)
----------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", async () => {
  const listaContainer = document.getElementById("top-readers-list");
  const tabela = document.getElementById("tabela-ranking");
  const corpoTabela = tabela ? tabela.querySelector("tbody") : null;

  // Carregando…
  if (listaContainer) {
    listaContainer.innerHTML = "<li class='loading'>Carregando…</li>";
  }
  if (corpoTabela) {
    corpoTabela.innerHTML = "<tr><td colspan='4'>Carregando…</td></tr>";
  }

  // Buscar dados
  const lista = await fetchTopReaders();

  // Renderizar lista
  if (listaContainer) {
    renderTopReadersList(listaContainer, lista);
  }

  // Renderizar tabela
  if (corpoTabela) {
    renderTopReadersTable(corpoTabela, lista);
  }
});

