// src/js/livrosDisponiveis.js
import { db, auth } from "../lib/firebase.js";
import { collection, query, orderBy, onSnapshot, getDocs, limit } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";

function escapeHtml(s){
  return String(s).replace(/[&<>"'`]/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;",'`':'&#96;'
  })[c]);
}

/**
 * Renderiza apenas livros ordenados por createdAt, sem categorias.
 * Mostra o campo "disponivel" obtido do Firestore.
 */
export function showLivros(container){
  if (!container) throw new Error('Elemento container é obrigatório para showLivros');
  container.innerHTML = '<p>Carregando livros...</p>';

  const q = query(collection(db, "livros"), orderBy("createdAt", "desc"));
  let initialized = false;

  // Painel de debug
  let debugBox = null;
  const enableDebug = container.dataset?.debug === "true";

  if (enableDebug) {
    debugBox = document.createElement("pre");
    debugBox.id = "livros-debug";
    debugBox.style.background = "#fff7e6";
    debugBox.style.border = "1px solid #ffd966";
    debugBox.style.padding = "10px";
    debugBox.style.borderRadius = "6px";
    debugBox.style.color = "#333";
    debugBox.style.fontSize = "0.9rem";
    debugBox.style.maxHeight = "180px";
    debugBox.style.overflow = "auto";
    debugBox.style.whiteSpace = "pre-wrap";
    debugBox.textContent = "Debug console:\n";
    container.prepend(debugBox);
  }

  function pushDebug(type, message){
    if (!debugBox) return;
    const time = new Date().toLocaleTimeString();
    debugBox.textContent += `\n[${time}] ${type}: ${message}`;
    debugBox.scrollTop = debugBox.scrollHeight;
  }

  // Listener realtime
  (async () => {
    try {
      await signInAnonymously(auth);
    } catch {}

    // Testar permissão
    try {
      const testQ = query(collection(db, "livros"), limit(1));
      await getDocs(testQ);
    } catch (err) {
      container.innerHTML = `<p>Erro ao acessar Firestore: ${escapeHtml(err.message)}</p>`;
      return;
    }

    const unsubscribe = onSnapshot(q, snap => {
      try {
        if (snap.empty) {
          container.innerHTML = "<p>Nenhum livro encontrado.</p>";
          return;
        }

        const grid = document.createElement("div");
        grid.className = "livros-grid";

        snap.forEach(doc => {
          const data = doc.data();

          const card = document.createElement("article");
          card.className = "livro-card";

          const cover = document.createElement("div");
          cover.className = "livro-cover";
          cover.textContent = "imagem não disponível";

          const title = document.createElement("h3");
          title.textContent = data.nome || "Sem título";

          const autor = document.createElement("p");
          autor.innerHTML = `<strong>Autor:</strong> ${escapeHtml(data.autor || "—")}`;

          const editora = document.createElement("p");
          editora.innerHTML = `<strong>Editora:</strong> ${escapeHtml(data.editora || "—")}`;

          const codigo = document.createElement("p");
          codigo.innerHTML = `<strong>Código:</strong> ${escapeHtml(data.codigo || "—")}`;

          const disponivel = document.createElement("p");
          disponivel.innerHTML = `<strong>Disponível:</strong> ${escapeHtml(String(data.disponivel ?? "—"))}`;

          card.appendChild(cover);
          card.appendChild(title);
          card.appendChild(autor);
          card.appendChild(editora);
          card.appendChild(codigo);
          card.appendChild(disponivel);

          grid.appendChild(card);
        });

        container.innerHTML = "";
        container.appendChild(grid);
      } catch (err) {
        container.innerHTML = `<p>Erro ao carregar livros: ${escapeHtml(err.message)}</p>`;
      }
    });

    window.addEventListener("beforeunload", () => unsubscribe());
  })();
}


// Executar automaticamente
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("livros-container");
  if (container) showLivros(container);
});
