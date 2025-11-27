// src/js/rank.js
// Estrutura para buscar e renderizar dados do módulo de rankeamento.
// Neste momento usamos dados mock; quando a integração com o Firestore
// estiver pronta basta trocar as funções fetchTopReaders/fetchTopBooks
// por chamadas reais ao backend / Firestore.

// Simula atraso (utilitário)
function wait(ms = 300) { return new Promise(r => setTimeout(r, ms)); }

// Tentativa de integração com Firestore — se a coleção de eventos existir
// iremos agregá-los por usuário / livro. Caso haja erro (coleção não
// encontrada ou regras de segurança), retornamos os mocks anteriores.
import { db } from '../lib/firebase.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js';

const MOCK_READERS = [ { user: 'UsuárioX', reads: 10 }, { user: 'UsuárioY', reads: 8 }, { user: 'UsuárioZ', reads: 7 } ];
const MOCK_BOOKS = [ { title: 'Livro A', reads: 42 }, { title: 'Livro B', reads: 33 }, { title: 'Livro C', reads: 21 } ];
// (fornecedores removed — ranking de fornecedores retirado por solicitação)

async function tryAggregateFromCollection(collectionName, keySelector) {
  try {
    const snap = await getDocs(collection(db, collectionName));
    if (snap.empty) return null; // não encontrou docs nessa coleção

    const map = new Map();
    snap.forEach(doc => {
      const data = doc.data();
      const key = keySelector(data);
      if (!key) return; // pula
      const prev = map.get(key) || 0;
      map.set(key, prev + 1);
    });

    // transforma em array ordenado desc
    const arr = Array.from(map.entries()).map(([k,v]) => ({ key:k, count:v }));
    arr.sort((a,b) => b.count - a.count);
    return arr;
  } catch (err) {
    // Falha ao ler coleção (p.ex. regras de segurança) -> retorna null para fallback
    console.warn('Firestore aggregate failed for', collectionName, err && err.message ? err.message : err);
    return null;
  }
}

// Fetch functions return an object { source: 'firestore'|'mock', items: [...] }
export async function fetchTopReaders() {
  // coleções possíveis onde eventos de leitura/retirada podem ser armazenadas
  const candidates = ['leituras', 'leituras_log', 'emprestimos', 'retiradas', 'historicoLeituras'];

  for (const c of candidates) {
    const arr = await tryAggregateFromCollection(c, (data) => {
      // tenta vários campos possíveis para identificar usuário
      return data.userName || data.user || data.userId || data.ra || data.nome || data.aluno || null;
    });
    if (arr && arr.length) {
      return { source: 'firestore', items: arr.map((x) => ({ user: x.key, reads: x.count })) };
    }
  }

  // fallback para mocks
  await wait(200);
  return { source: 'mock', items: MOCK_READERS };
}

export async function fetchTopBooks() {
  const candidates = ['leituras', 'emprestimos', 'retiradas', 'historicoLeituras', 'livros_lidos'];

  for (const c of candidates) {
    const arr = await tryAggregateFromCollection(c, (data) => {
      return data.bookTitle || data.title || data.livro || data.book || data.codigo || null;
    });
    if (arr && arr.length) {
      return { source: 'firestore', items: arr.map((x) => ({ title: x.key, reads: x.count })) };
    }
  }

  // fallback mock
  await wait(200);
  return { source: 'mock', items: MOCK_BOOKS };
}

// Fornecedores/suppliers ranking was removed — no-op

// Renderiza lista de top leitores em um container (elemento DOM)
export function renderTopReaders(container, list) {
  container.innerHTML = '';
  // Se o container é uma lista simples ou um UL/OL podemos renderizar itens mais ricos
  const isLeaderboard = container.id === 'top-readers-list' || container.classList.contains('leader') || container.closest('.leaderboard');
  if (isLeaderboard) {
    // cria itens com badge, avatar e contagem (visualmente mais ricos)
    list.forEach((item, idx) => {
      const li = document.createElement('li');
      li.style.display = 'flex'; li.style.alignItems = 'center'; li.style.gap = '12px'; li.style.padding = '10px 6px';

      const badge = document.createElement('div'); badge.className = 'rank-badge'; badge.textContent = (idx+1).toString();
      const avatar = document.createElement('div'); avatar.className = 'avatar'; avatar.textContent = (item.user || item.userName || 'U').charAt(0).toUpperCase();
      const name = document.createElement('div'); name.className = 'name'; name.textContent = item.user;
      const meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = `Posição ${idx+1}`;
      const count = document.createElement('div'); count.className = 'count'; count.textContent = `${item.reads}`;

      li.appendChild(badge);
      li.appendChild(avatar);
      li.appendChild(name);
      li.appendChild(meta);
      li.appendChild(count);
      container.appendChild(li);
    });
    return;
  }

  // Fallback: render lista simples
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
  const isLeaderboard = container.id === 'top-books-list' || container.classList.contains('leader') || container.closest('.leaderboard');
  if (isLeaderboard) {
    list.forEach((item, idx) => {
      const li = document.createElement('li');
      li.style.display = 'flex'; li.style.alignItems = 'center'; li.style.gap = '12px'; li.style.padding = '10px 6px';

      const badge = document.createElement('div'); badge.className = 'rank-badge'; badge.textContent = (idx+1).toString();
      const avatar = document.createElement('div'); avatar.className = 'avatar'; avatar.textContent = (item.title || '').charAt(0).toUpperCase();
      const name = document.createElement('div'); name.className = 'name'; name.textContent = item.title;
      const meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = `Categoria`;
      const count = document.createElement('div'); count.className = 'count'; count.textContent = `${item.reads}`;

      li.appendChild(badge);
      li.appendChild(avatar);
      li.appendChild(name);
      li.appendChild(meta);
      li.appendChild(count);
      container.appendChild(li);
    });
    return;
  }

  const ol = document.createElement('ol');
  list.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = `${item.title} — ${item.reads} leituras`;
    ol.appendChild(li);
  });
  container.appendChild(ol);
}

// renderTopSuppliers removed

// Inicia a página de rank automaticamente se o módulo for importado via <script type="module">
export async function initRankPages() {
  const path = window.location.pathname.toLowerCase();
  // Busca containers nas versões placeholders ou nas novas lists com ids
  const listContainer = document.querySelector('.placeholder-list');
  const topReadersList = document.getElementById('top-readers-list');
  const topBooksList = document.getElementById('top-books-list');
  // topSuppliersList removed (fornecedores/support removed)

  // Página Top Leitores
  if (path.endsWith('/rankeamento/top-readers.html') || path.endsWith('/top-readers.html')) {
    const container = listContainer || document.getElementById('top-readers-list');
    if (!container) return;
    const header = document.querySelector('h1');
    // fetchTopReaders returns { source, items }
    // mostrar estado de carregamento
    if (listContainer) listContainer.innerHTML = '<li class="loading">Carregando…</li>';
    const result = await fetchTopReaders();
    if (!result || !Array.isArray(result.items) || result.items.length === 0) {
      if (listContainer) listContainer.innerHTML = '<li class="empty">Nenhum leitor encontrado</li>';
      if (header) header.textContent = 'Top Leitores — (sem dados)';
      return;
    }
    if (header) header.textContent = result.source === 'firestore' ? 'Top Leitores' : 'Top Leitores — (mock)';
    renderTopReaders(listContainer, result.items);
    return;
  }

  // Página Top Livros
  if (path.endsWith('/rankeamento/top-books.html') || path.endsWith('/top-books.html')) {
    const container = listContainer || document.getElementById('top-books-list');
    if (!container) return;
    const header = document.querySelector('h1');
    if (container) container.innerHTML = '<li class="loading">Carregando…</li>';
    const result = await fetchTopBooks();
    if (!result || !Array.isArray(result.items) || result.items.length === 0) {
      if (container) container.innerHTML = '<li class="empty">Nenhum livro encontrado</li>';
      if (header) header.textContent = 'Top Livros — (sem dados)';
      return;
    }
    if (header) header.textContent = result.source === 'firestore' ? 'Top Livros' : 'Top Livros — (mock)';
    renderTopBooks(container, result.items);
    return;
  }

  // Página Top Fornecedores: removida

  // Página principal do módulo (rank.html) — podemos mostrar visão resumida
  if (path.endsWith('/rankeamento/rank.html') || path.endsWith('/rank.html')) {
    // Se existir um elemento .cards na página, preenchemos os cards com resumo
    const cards = document.querySelectorAll('.card');
    if (cards && cards.length >= 2) {
      const readersRes = await fetchTopReaders();
      const booksRes = await fetchTopBooks();
      // se vazio, podemos colocar mensagens nos containers
      if (topReadersList && (!readersRes || !Array.isArray(readersRes.items) || readersRes.items.length === 0)) topReadersList.innerHTML = '<li class="empty">Nenhum leitor</li>';
      if (topBooksList && (!booksRes || !Array.isArray(booksRes.items) || booksRes.items.length === 0)) topBooksList.innerHTML = '<li class="empty">Nenhum livro</li>';

      // preenche os ULs da nova página (se existirem)
      if (topReadersList) renderTopReaders(topReadersList, readersRes.items.slice(0,10));
      if (topBooksList) renderTopBooks(topBooksList, booksRes.items.slice(0,10));

      // manter compatibilidade com cards (resumo)
      const readersCard = cards[0].querySelector('p');
      if (readersCard) readersCard.textContent = readersRes.items.map(r => `${r.user} (${r.reads})`).join(' • ');

      const booksCard = cards[1].querySelector('p');
      if (booksCard) booksCard.textContent = booksRes.items.map(b => `${b.title} (${b.reads})`).join(' • ');

      // Fornecedores removidos — nada a carregar aqui
    }
  }
}

// Auto-init quando importado diretamente
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initRankPages().catch(err => console.error('Erro initRankPages:', err));
  });
}
