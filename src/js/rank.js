// src/js/rank.js
// Estrutura para buscar e renderizar dados do módulo de rankeamento.
// Neste momento usamos dados mock; quando a integração com o Firestore
// estiver pronta basta trocar as funções fetchTopReaders/fetchTopBooks
// por chamadas reais ao backend / Firestore.

// Simula um atraso de rede e retorna dados de exemplo
function wait(ms = 300) {
  return new Promise(r => setTimeout(r, ms));
}

// Mock: usuários que mais leram
export async function fetchTopReaders() {
  await wait(200);
  return [
    { user: 'UsuárioX', reads: 10 },
    { user: 'UsuárioY', reads: 8 },
    { user: 'UsuárioZ', reads: 7 },
  ];
}

// Mock: livros mais lidos
export async function fetchTopBooks() {
  await wait(200);
  return [
    { title: 'Livro A', reads: 42 },
    { title: 'Livro B', reads: 33 },
    { title: 'Livro C', reads: 21 },
  ];
}

// Renderiza lista de top leitores em um container (elemento DOM)
export function renderTopReaders(container, list) {
  container.innerHTML = '';
  const ol = document.createElement('ol');
  list.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = `${item.user} — ${item.reads} livro(es)`;
    ol.appendChild(li);
  });
  container.appendChild(ol);
}

// Renderiza lista de top livros em um container
export function renderTopBooks(container, list) {
  container.innerHTML = '';
  const ol = document.createElement('ol');
  list.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = `${item.title} — ${item.reads} leituras`;
    ol.appendChild(li);
  });
  container.appendChild(ol);
}

// Inicia a página de rank automaticamente se o módulo for importado via <script type="module">
export async function initRankPages() {
  const path = window.location.pathname.toLowerCase();
  // Busca containers nas versões placeholders
  const listContainer = document.querySelector('.placeholder-list');

  // Página Top Leitores
  if (path.endsWith('/rankeamento/top-readers.html') || path.endsWith('/top-readers.html')) {
    if (!listContainer) return;
    const header = document.querySelector('h1');
    if (header) header.textContent = 'Top Leitores — (Dados mock)';
    const data = await fetchTopReaders();
    renderTopReaders(listContainer, data);
    return;
  }

  // Página Top Livros
  if (path.endsWith('/rankeamento/top-books.html') || path.endsWith('/top-books.html')) {
    if (!listContainer) return;
    const header = document.querySelector('h1');
    if (header) header.textContent = 'Top Livros — (Dados mock)';
    const data = await fetchTopBooks();
    renderTopBooks(listContainer, data);
    return;
  }

  // Página principal do módulo (rank.html) — podemos mostrar visão resumida
  if (path.endsWith('/rankeamento/rank.html') || path.endsWith('/rank.html')) {
    // Se existir um elemento .cards na página, preenchemos os cards com resumo
    const cards = document.querySelectorAll('.card');
    if (cards && cards.length >= 2) {
      const readers = await fetchTopReaders();
      const books = await fetchTopBooks();

      // primeiro card -> top 3 leitores
      const readersCard = cards[0].querySelector('p');
      if (readersCard) readersCard.textContent = readers.map(r => `${r.user} (${r.reads})`).join(' • ');

      // segundo card -> top 3 livros
      const booksCard = cards[1].querySelector('p');
      if (booksCard) booksCard.textContent = books.map(b => `${b.title} (${b.reads})`).join(' • ');
    }
  }
}

// Auto-init quando importado diretamente
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initRankPages().catch(err => console.error('Erro initRankPages:', err));
  });
}
