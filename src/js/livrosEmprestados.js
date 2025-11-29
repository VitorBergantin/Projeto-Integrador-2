// src/js/livrosEmprestados.js
import { db } from "../lib/firebase.js";
import { 
  collection, 
  query, 
  where, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";


//Exibe todos os livros onde disponivel == 0 (emprestados)
function carregarLivrosEmprestados() {
  const container = document.getElementById("livros-container");
  if (!container) return;

  container.innerHTML = "<p>Carregando livros emprestados...</p>";

  console.log("[DEBUG] Buscando livros onde disponivel == 0");

  const q = query(
    collection(db, "livros"),
    where("disponivel", "==", 0)
  );

  onSnapshot(q, (snapshot) => {
    console.log("[DEBUG] Snapshot recebido:", snapshot.size);

    if (snapshot.empty) {
      container.innerHTML = "<p>Nenhum livro emprestado no momento.</p>";
      return;
    }

    const lista = document.createElement("div");
    lista.className = "livros-grid";

    snapshot.forEach((doc) => {
      const data = doc.data();

      console.log("[DEBUG] Livro:", data);

      const card = document.createElement("article");
      card.className = "livro-card";

      const coverInner = data.coverUrl
        ? `<img src="${data.coverUrl}" alt="${data.nome || 'Capa'}" style="width:100%;height:100%;object-fit:cover;" />`
        : 'imagem não disponível';

      card.innerHTML = `
        <div class="livro-cover">${coverInner}</div>
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

document.addEventListener("DOMContentLoaded", carregarLivrosEmprestados);