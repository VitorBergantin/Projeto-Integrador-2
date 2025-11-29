// src/js/livrosDisponiveis.js
import { db } from "../lib/firebase.js";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

/**
 * Exibe todos os livros onde disponivel == 1
 */
function carregarLivrosDisponiveis() {
  const container = document.getElementById("livros-container");

  if (!container) return;
  container.innerHTML = "<p>Carregando livros disponíveis...</p>";

  // Query: traz apenas livros disponíveis
  const q = query(
    collection(db, "livros"),
    where("disponivel", "==", 1)
  );

  onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      container.innerHTML = "<p>Nenhum livro disponível no momento.</p>";
      return;
    }

    const lista = document.createElement("div");
    lista.className = "livros-grid";

    snapshot.forEach((doc) => {
      const data = doc.data();

      const card = document.createElement("article");
      card.className = "livro-card";

      card.innerHTML = `
        <div class="livro-cover">imagem não disponível</div>
        <h3>${data.nome || "Sem título"}</h3>
        <p><strong>Autor:</strong> ${data.autor || "—"}</p>
        <p><strong>Editora:</strong> ${data.editora || "—"}</p>
        <p><strong>Código:</strong> ${data.codigo || "—"}</p>
      `;

      lista.appendChild(card);
    });

    container.innerHTML = "";
    container.appendChild(lista);
  });
}

document.addEventListener("DOMContentLoaded", carregarLivrosDisponiveis);
