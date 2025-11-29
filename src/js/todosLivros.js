// src/js/livrosDisponiveis.js
import { db, auth } from "../lib/firebase.js";
import { collection, query, orderBy, onSnapshot, getDocs, limit, updateDoc, doc as docRef } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";
import { uploadFileToStorage } from "./cadastros.js";

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

        snap.forEach(docSnap => {
          const data = docSnap.data();
          const docId = docSnap.id;

          const card = document.createElement("article");
          card.className = "livro-card";

          const cover = document.createElement("div");
          cover.className = "livro-cover";
          if (data.coverUrl) {
            const img = document.createElement('img');
            img.src = data.coverUrl;
            img.alt = data.nome || 'Capa do livro';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            cover.appendChild(img);
          } else {
            cover.textContent = "imagem não disponível";
          }

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

          // botão de edição (somente para bibliotecário nesta página)
          const editBtn = document.createElement('button');
          editBtn.type = 'button';
          editBtn.textContent = 'Editar';
          editBtn.style.marginLeft = '8px';
          editBtn.addEventListener('click', () => {
            // substituir conteúdo do card por um formulário de edição simples
            renderEditForm(card, docId, data);
          });

          card.appendChild(cover);
          card.appendChild(title);
          card.appendChild(autor);
          card.appendChild(editora);
          card.appendChild(codigo);
          card.appendChild(disponivel);
          // adiciona o botão de edição ao final do card
          card.appendChild(editBtn);

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

// Renderiza o formulário de edição inline dentro do card
function renderEditForm(cardEl, docId, current) {
  // guardar estado original para poder cancelar
  const original = cardEl.innerHTML;

  cardEl.innerHTML = '';
  const form = document.createElement('form');
  form.className = 'edit-livro-form';

  const nomeInput = document.createElement('input');
  nomeInput.type = 'text'; nomeInput.value = current.nome || '';
  nomeInput.placeholder = 'Nome do livro'; nomeInput.required = true;

  const autorInput = document.createElement('input');
  autorInput.type = 'text'; autorInput.value = current.autor || '';
  autorInput.placeholder = 'Autor'; autorInput.required = true;

  const editoraInput = document.createElement('input');
  editoraInput.type = 'text'; editoraInput.value = current.editora || '';
  editoraInput.placeholder = 'Editora'; editoraInput.required = true;

  const codigoInput = document.createElement('input');
  codigoInput.type = 'text'; codigoInput.value = current.codigo || '';
  codigoInput.placeholder = 'Código'; codigoInput.required = true;

  const disponivelLabel = document.createElement('label');
  disponivelLabel.style.display = 'block';
  const disponivelCheckbox = document.createElement('input');
  disponivelCheckbox.type = 'checkbox';
  disponivelCheckbox.checked = Number(current.disponivel) === 1;
  disponivelLabel.appendChild(disponivelCheckbox);
  disponivelLabel.appendChild(document.createTextNode(' Disponível'));

  const saveBtn = document.createElement('button');
    // campo para trocar a capa
    const coverInput = document.createElement('input');
    coverInput.type = 'file';
    coverInput.accept = 'image/*';
    coverInput.style.display = 'block';
    coverInput.style.margin = '8px 0';

    const coverPreview = document.createElement('div');
    coverPreview.className = 'cover-preview';
    if (current.coverUrl) {
      const img = document.createElement('img');
      img.src = current.coverUrl;
      img.alt = current.nome || 'Capa';
      img.style.maxWidth = '150px';
      img.style.display = 'block';
      coverPreview.appendChild(img);
    }

    const statusEl = document.createElement('div');
    statusEl.className = 'upload-status';
    statusEl.style.marginTop = '6px';

    // preview local quando usuário escolhe nova capa
    coverInput.addEventListener('change', () => {
      const f = coverInput.files?.[0];
      coverPreview.innerHTML = '';
      if (!f) return;
      if (!f.type.startsWith('image/')) {
        coverPreview.textContent = 'Arquivo selecionado não é imagem.';
        return;
      }
      const img = document.createElement('img');
      img.src = URL.createObjectURL(f);
      img.style.maxWidth = '150px';
      coverPreview.appendChild(img);
    });
  saveBtn.type = 'button'; saveBtn.textContent = 'Salvar';
  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button'; cancelBtn.textContent = 'Cancelar';
  saveBtn.style.marginRight = '8px';

  saveBtn.addEventListener('click', async () => {
    saveBtn.disabled = true; cancelBtn.disabled = true;
    try {
      // preparar payload
      const payload = {
        nome: nomeInput.value.trim(),
        autor: autorInput.value.trim(),
        editora: editoraInput.value.trim(),
        codigo: codigoInput.value.trim(),
        disponivel: disponivelCheckbox.checked ? 1 : 0
      };

      // garantir auth anônimo antes de tentar gravar
      try { await signInAnonymously(auth); } catch (e) { /* ignore */ }

      // se tem nova capa selecionada, faz upload primeiro
      const newFile = coverInput.files?.[0];
      if (newFile) {
        try {
          // validações básicas antes do upload
          if (!newFile.type.startsWith('image/')) throw new Error('Arquivo não é uma imagem');
          const maxBytes = 3 * 1024 * 1024;
          if (newFile.size > maxBytes) throw new Error('Imagem maior que 3MB');

          const safeName = (newFile.name || 'cover').replace(/[^a-z0-9.\-\_\.]/gi, '_');
          const path = `livros/covers/${codigoInput.value.trim() || docId}-${Date.now()}-${safeName}`;
          const url = await uploadFileToStorage(newFile, path, statusEl);
          payload.coverUrl = url;
        } catch (upErr) {
          console.error('Erro no upload da nova capa', upErr);
          alert('Erro no upload da capa: ' + (upErr && upErr.message ? upErr.message : upErr));
          saveBtn.disabled = false; cancelBtn.disabled = false;
          return;
        }
      }

      await updateDoc(docRef(db, 'livros', docId), payload);
      alert('Livro atualizado com sucesso.');
      // opcional: restaurar (snapshot do onSnapshot vai atualizar automaticamente)
    } catch (err) {
      console.error('Erro atualizando livro', err);
      alert('Erro ao atualizar o livro. Veja console.');
      saveBtn.disabled = false; cancelBtn.disabled = false;
      return;
    }
  });

  cancelBtn.addEventListener('click', () => {
    cardEl.innerHTML = original;
  });

  form.appendChild(nomeInput);
  form.appendChild(document.createElement('br'));
  form.appendChild(autorInput);
  form.appendChild(document.createElement('br'));
  form.appendChild(editoraInput);
  form.appendChild(document.createElement('br'));
  form.appendChild(codigoInput);
  form.appendChild(document.createElement('br'));
  form.appendChild(disponivelLabel);
  form.appendChild(document.createElement('br'));
  form.appendChild(coverInput);
  form.appendChild(coverPreview);
  form.appendChild(statusEl);
  form.appendChild(document.createElement('br'));
  form.appendChild(saveBtn);
  form.appendChild(cancelBtn);

  cardEl.appendChild(form);
}
