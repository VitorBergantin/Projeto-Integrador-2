// src/js/livrosDisponiveis.js
import { db, auth } from "../lib/firebase.js";
import { collection, query, orderBy, onSnapshot, getDocs, limit } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";

function escapeHtml(s){ return String(s).replace(/[&<>"'`]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;",'`':'&#96;'})[c]); }

/**
 * Inicia o listener em tempo real e renderiza os livros dentro do elemento fornecido.
 * Retorna a função `unsubscribe` que remove o listener quando chamada.
 * @param {HTMLElement} container Elemento onde os livros serão renderizados
 * @returns {Function} unsubscribe
 */
export function showLivros(container){
  if (!container) throw new Error('Elemento container é obrigatório para showLivros');
  container.innerHTML = '<p>Carregando livros...</p>';

  const q = query(collection(db, 'livros'), orderBy('createdAt','desc'));
  let initialized = false;

  // Inserir badge de status do Firebase (opcional) para ajudar depuração
  try{
    const info = window.firebaseApp && window.firebaseApp.options ? window.firebaseApp.options : null;
    const badge = document.createElement('div');
    badge.style.fontSize = '0.9rem';
    badge.style.color = '#666';
    badge.style.marginBottom = '8px';
    badge.textContent = info && info.projectId ? `Firebase project: ${info.projectId}` : 'Firebase: indisponível (ver console)';
    container.prepend(badge);
  }catch(e){}

  // Painel de debug para capturar e exibir erros do console e exceções
  // Só ativa o painel se o container tiver data-debug="true"
  let debugBox = null;
  const enableDebug = container && container.dataset && container.dataset.debug === 'true';
  if (enableDebug) {
    debugBox = document.createElement('pre');
    debugBox.id = 'livros-debug';
    debugBox.style.background = '#fff7e6';
    debugBox.style.border = '1px solid #ffd966';
    debugBox.style.padding = '10px';
    debugBox.style.borderRadius = '6px';
    debugBox.style.color = '#333';
    debugBox.style.fontSize = '0.9rem';
    debugBox.style.maxHeight = '180px';
    debugBox.style.overflow = 'auto';
    debugBox.style.whiteSpace = 'pre-wrap';
    debugBox.style.marginBottom = '8px';
    debugBox.textContent = 'Debug console:\n';
    container.prepend(debugBox);
  }
  debugBox.id = 'livros-debug';
  debugBox.style.background = '#fff7e6';
  debugBox.style.border = '1px solid #ffd966';
  debugBox.style.padding = '10px';
  debugBox.style.borderRadius = '6px';
  debugBox.style.color = '#333';
  debugBox.style.fontSize = '0.9rem';
  debugBox.style.maxHeight = '180px';
  debugBox.style.overflow = 'auto';
  debugBox.style.whiteSpace = 'pre-wrap';
  debugBox.style.marginBottom = '8px';
  debugBox.textContent = 'Debug console:\n';
  container.prepend(debugBox);

  function pushDebug(type, message){
    try{
      const time = new Date().toLocaleTimeString();
      debugBox.textContent += `\n[${time}] ${type}: ${message}`;
      // manter scroll no fim
      debugBox.scrollTop = debugBox.scrollHeight;
    }catch(e){ /* ignore */ }
  }

  // Interceptar console.error / warn para replicar no painel
  try{
    const origError = console.error.bind(console);
    const origWarn = console.warn.bind(console);
    console.error = function(...args){
      try{ pushDebug('ERROR', args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')); }catch(e){}
      origError(...args);
    };
    console.warn = function(...args){
      try{ pushDebug('WARN', args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')); }catch(e){}
      origWarn(...args);
    };
  }catch(e){}

  // Global error and promise rejection handlers
  const winErrorHandler = (event) => {
    try{ pushDebug('UNCAUGHT_ERROR', event && event.error && event.error.message ? event.error.message : (event.message || String(event))); }catch(e){}
  };
  const unhandledRejectionHandler = (ev) => {
    try{ pushDebug('UNHANDLED_REJECTION', ev && ev.reason ? (ev.reason.message || String(ev.reason)) : String(ev)); }catch(e){}
  };
  if (enableDebug) {
    window.addEventListener('error', winErrorHandler);
    window.addEventListener('unhandledrejection', unhandledRejectionHandler);
  }

  // Teste rápido: tentar ler 1 documento para validar permissões/regras
  (async ()=>{
    // Tentar autenticação anônima se possível (ajuda quando regras exigem auth)
    try{
      if (auth) {
        try{
          await signInAnonymously(auth);
          console.debug('Autenticação anônima realizada.');
        }catch(authErr){
          console.warn('Falha na autenticação anônima (não-fatal):', authErr && authErr.message ? authErr.message : authErr);
        }
      }
    }catch(e){ console.warn('Erro ao tentar sign-in anônimo:', e); }
    try{
      const testQ = query(collection(db, 'livros'), limit(1));
      await getDocs(testQ);
    }catch(testErr){
      console.error('Teste inicial de leitura falhou:', testErr);
      const msg = testErr && testErr.message ? testErr.message : String(testErr);
      container.innerHTML = `<p>Erro ao conectar ao Firestore: ${escapeHtml(msg)}</p>`;
      // também exibir no painel de debug
      try{ pushDebug('FIRESTORE_TEST_ERROR', msg); }catch(e){}
      return; // não continuar com onSnapshot se não temos permissão básica
    }

    const unsubscribe = onSnapshot(q, (snap) => {
    try{
      console.debug('livrosDisponiveis: snapshot recebido, docs:', snap.size);
      if (!snap || snap.empty) {
        container.innerHTML = '<p>Nenhum livro disponível.</p>';
        initialized = true;
        return;
      }

      const grupos = new Map();
      snap.forEach(doc => {
        const data = doc.data();
        const categoria = (data.categoria || data.genero || 'Geral').trim() || 'Geral';
        if (!grupos.has(categoria)) grupos.set(categoria, []);
        grupos.get(categoria).push({ id: doc.id, data });
      });

      container.innerHTML = '';

      grupos.forEach((items, cat) => {
        const section = document.createElement('section');
        section.className = 'categoria-section';

        const header = document.createElement('div');
        header.className = 'categoria-header';
        const h2 = document.createElement('h2');
        h2.textContent = cat;
        const verMais = document.createElement('a');
        verMais.className = 'ver-mais';
        verMais.textContent = 'VER MAIS';
        verMais.href = '#';
        header.appendChild(h2);
        header.appendChild(verMais);

        const grid = document.createElement('div');
        grid.className = 'livros-grid';

        items.slice(0,12).forEach(item => {
          const data = item.data;
          const card = document.createElement('article');
          card.className = 'livro-card';

          const cover = document.createElement('div');
          cover.className = 'livro-cover';
          cover.textContent = 'imagem não disponível';

          const title = document.createElement('h3');
          title.textContent = data.nome || 'Sem título';

          const autor = document.createElement('p');
          autor.innerHTML = `<strong>Autor:</strong> ${escapeHtml(data.autor || '—')}`;
          const editora = document.createElement('p');
          editora.innerHTML = `<strong>Editora:</strong> ${escapeHtml(data.editora || '—')}`;
          const codigo = document.createElement('p');
          codigo.innerHTML = `<strong>Código:</strong> ${escapeHtml(data.codigo || '—')}`;

          card.appendChild(cover);
          card.appendChild(title);
          card.appendChild(autor);
          card.appendChild(editora);
          card.appendChild(codigo);

          grid.appendChild(card);
        });

        section.appendChild(header);
        section.appendChild(grid);
        container.appendChild(section);
      });

      initialized = true;
    }catch(renderErr){
      console.error('Erro ao renderizar livros:', renderErr);
      // mostrar mensagem de erro mais detalhada na UI para facilitar depuração
      const msg = renderErr && renderErr.message ? renderErr.message : String(renderErr);
      container.innerHTML = `<p>Erro ao carregar livros: ${escapeHtml(msg)}</p>`;
      if (!initialized) initialized = true;
    }
    }, (err) => {
    console.error('Erro no listener de livros:', err);
    const msg = err && err.message ? err.message : String(err);
    if (!initialized) container.innerHTML = `<p>Erro ao carregar livros: ${escapeHtml(msg)}</p>`;
  });

  // limpar listener ao sair da página
  const onUnload = () => { try{ unsubscribe(); } catch(e){} };
  window.addEventListener('beforeunload', onUnload);

  // retornar função de limpeza que também remove o evento de unload
    return () => { try{ unsubscribe(); window.removeEventListener('beforeunload', onUnload); } catch(e){} };
  })();
}

/**
 * Renderiza todos os livros em uma lista simples (modo bibliotecário).
 * Retorna unsubscribe para limpar listener.
 */
export function showAllLivros(container){
  if (!container) throw new Error('Elemento container é obrigatório para showAllLivros');
  container.innerHTML = '<p>Carregando livros...</p>';

  const q = query(collection(db, 'livros'), orderBy('createdAt','desc'));
  let initialized = false;

  // badge e painel de debug (reusar mesma aparência)
  try{
    const info = window.firebaseApp && window.firebaseApp.options ? window.firebaseApp.options : null;
    const badge = document.createElement('div');
    badge.style.fontSize = '0.9rem';
    badge.style.color = '#666';
    badge.style.marginBottom = '8px';
    badge.textContent = info && info.projectId ? `Firebase project: ${info.projectId}` : 'Firebase: indisponível (ver console)';
    container.prepend(badge);
  }catch(e){}

  let debugBox = null;
  const enableDebugAll = container && container.dataset && container.dataset.debug === 'true';
  if (enableDebugAll) {
    debugBox = document.createElement('pre');
    debugBox.id = 'livros-debug';
    debugBox.style.background = '#fff7e6';
    debugBox.style.border = '1px solid #ffd966';
    debugBox.style.padding = '10px';
    debugBox.style.borderRadius = '6px';
    debugBox.style.color = '#333';
    debugBox.style.fontSize = '0.9rem';
    debugBox.style.maxHeight = '180px';
    debugBox.style.overflow = 'auto';
    debugBox.style.whiteSpace = 'pre-wrap';
    debugBox.style.marginBottom = '8px';
    debugBox.textContent = 'Debug console:\n';
    container.prepend(debugBox);
  }

  function pushDebug(type, message){
    try{
      const time = new Date().toLocaleTimeString();
      debugBox.textContent += `\n[${time}] ${type}: ${message}`;
      debugBox.scrollTop = debugBox.scrollHeight;
    }catch(e){}
  }

  try{
    const origError = console.error.bind(console);
    const origWarn = console.warn.bind(console);
    console.error = function(...args){ try{ pushDebug('ERROR', args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')); }catch(e){}; origError(...args); };
    console.warn = function(...args){ try{ pushDebug('WARN', args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')); }catch(e){}; origWarn(...args); };
  }catch(e){}

  const winErrorHandler = (event) => { try{ pushDebug('UNCAUGHT_ERROR', event && event.error && event.error.message ? event.error.message : (event.message || String(event))); }catch(e){} };
  const unhandledRejectionHandler = (ev) => { try{ pushDebug('UNHANDLED_REJECTION', ev && ev.reason ? (ev.reason.message || String(ev.reason)) : String(ev)); }catch(e){} };
  if (enableDebugAll) {
    window.addEventListener('error', winErrorHandler);
    window.addEventListener('unhandledrejection', unhandledRejectionHandler);
  }

  (async ()=>{
    try{ if (auth) { try{ await signInAnonymously(auth); console.debug('Autenticação anônima realizada.'); }catch(authErr){ console.warn('Falha na autenticação anônima (não-fatal):', authErr && authErr.message ? authErr.message : authErr); } } }catch(e){ console.warn('Erro ao tentar sign-in anônimo:', e); }
    try{
      const testQ = query(collection(db, 'livros'), limit(1));
      await getDocs(testQ);
    }catch(testErr){
      console.error('Teste inicial de leitura falhou:', testErr);
      const msg = testErr && testErr.message ? testErr.message : String(testErr);
      container.innerHTML = `<p>Erro ao conectar ao Firestore: ${escapeHtml(msg)}</p>`;
      try{ pushDebug('FIRESTORE_TEST_ERROR', msg); }catch(e){}
      return;
    }

    const unsubscribe = onSnapshot(q, (snap) => {
      try{
        console.debug('showAllLivros: snapshot recebido, docs:', snap.size);
        if (!snap || snap.empty) { container.innerHTML = '<p>Nenhum livro disponível.</p>'; initialized = true; return; }

        const grid = document.createElement('div');
        grid.className = 'livros-grid';

        snap.forEach(doc => {
          const data = doc.data();
          const card = document.createElement('article');
          card.className = 'livro-card';

          const cover = document.createElement('div');
          cover.className = 'livro-cover';
          cover.textContent = 'imagem não disponível';

          const title = document.createElement('h3'); title.textContent = data.nome || 'Sem título';
          const autor = document.createElement('p'); autor.innerHTML = `<strong>Autor:</strong> ${escapeHtml(data.autor || '—')}`;
          const editora = document.createElement('p'); editora.innerHTML = `<strong>Editora:</strong> ${escapeHtml(data.editora || '—')}`;
          const codigo = document.createElement('p'); codigo.innerHTML = `<strong>Código:</strong> ${escapeHtml(data.codigo || '—')}`;
          const categoria = document.createElement('p'); categoria.innerHTML = `<strong>Categoria:</strong> ${escapeHtml(data.categoria || data.genero || '—')}`;

          card.appendChild(cover);
          card.appendChild(title);
          card.appendChild(autor);
          card.appendChild(editora);
          card.appendChild(codigo);
          card.appendChild(categoria);

          grid.appendChild(card);
        });

        container.innerHTML = '';
        container.appendChild(grid);
        initialized = true;
      }catch(renderErr){
        console.error('Erro ao renderizar todos os livros:', renderErr);
        const msg = renderErr && renderErr.message ? renderErr.message : String(renderErr);
        container.innerHTML = `<p>Erro ao carregar livros: ${escapeHtml(msg)}</p>`;
        if (!initialized) initialized = true;
      }
    }, (err) => { console.error('Erro no listener showAllLivros:', err); const msg = err && err.message ? err.message : String(err); if (!initialized) container.innerHTML = `<p>Erro ao carregar livros: ${escapeHtml(msg)}</p>`; });

    const onUnload = () => { try{ unsubscribe(); } catch(e){} };
    window.addEventListener('beforeunload', onUnload);
    return () => { try{ unsubscribe(); window.removeEventListener('beforeunload', onUnload); } catch(e){} };
  })();
}

// Inicialização automática para compatibilidade com a página atual
document.addEventListener('DOMContentLoaded', ()=>{
  const container = document.getElementById('livros-container');
  if (!container) return;
  try{
    if (window.__LIBRARIAN_PAGE) {
      showAllLivros(container);
    } else {
      showLivros(container);
    }
  }catch(err){ console.error('Falha ao iniciar livros display:', err); }
});
