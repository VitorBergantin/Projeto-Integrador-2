// src/js/cadastros.js
import { db } from './lib/firebase.js';
import { collection, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js';

/**
 * Adiciona um listener ao formulário de cadastro de livros para
 * processar o cadastro, evitando duplicatas.
 */
function setupCadastroLivros() {
  const form = document.querySelector('form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const codigoInput = document.getElementById('codigo');
    const nomeInput = document.getElementById('nome');
    const autorInput = document.getElementById('autor');
    const editoraInput = document.getElementById('editora');

    const codigo = codigoInput.value.trim();
    const nome = nomeInput.value.trim();
    const autor = autorInput.value.trim();
    const editora = editoraInput.value.trim();

    if (!codigo || !nome || !autor || !editora) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    try {
      const livroRef = doc(db, 'livros', codigo);
      const docSnap = await getDoc(livroRef);

      if (docSnap.exists()) {
        alert('Erro: Já existe um livro cadastrado com este código.');
        return;
      }

      await setDoc(livroRef, { title: nome, autor, editora, codigo, disponivel: True});
      alert('Livro cadastrado com sucesso!');
      form.reset();
    } catch (error) {
      console.error('Erro ao cadastrar livro:', error);
      alert('Ocorreu um erro inesperado ao cadastrar o livro. Tente novamente.');
    }
  });
}

document.addEventListener('DOMContentLoaded', setupCadastroLivros);