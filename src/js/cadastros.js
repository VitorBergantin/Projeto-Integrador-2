// src/js/cadastros.js
// Lógica compartilhada para cadastros de alunos e livros.
import { db } from "../lib/firebase.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

function showError(msg) {
    console.error(msg);
}

async function cadastrarAluno(form) {
    const ra = form.querySelector('#RA')?.value.trim() || '';
    const nome = form.querySelector('#nome')?.value.trim() || '';
    const situacaoEl = document.getElementById('situacao');

    if (!ra || !nome) {
        if (situacaoEl) situacaoEl.textContent = 'Preencha RA e Nome.';
        return;
    }

    if (situacaoEl) situacaoEl.textContent = 'Enviando...';

    try {
        await addDoc(collection(db, 'alunos'), { ra, nome, createdAt: serverTimestamp() });
        if (situacaoEl) situacaoEl.textContent = 'Cadastro realizado com sucesso!';
        form.reset();
    } catch (err) {
        showError('Erro ao cadastrar aluno: ' + err);
        if (situacaoEl) situacaoEl.textContent = 'Erro ao cadastrar. Veja o console.';
    }
}

async function cadastrarLivro(form) {
    const codigo = form.querySelector('#codigo')?.value.trim() || '';
    const nome = form.querySelector('#nome')?.value.trim() || '';
    const autor = form.querySelector('#autor')?.value.trim() || '';
    const editora = form.querySelector('#editora')?.value.trim() || '';

    if (!codigo || !nome || !autor || !editora) {
        alert('Preencha todos os campos.');
        return;
    }

    try {
        await addDoc(collection(db, 'livros'), { codigo, nome, autor, editora, createdAt: serverTimestamp() });
        alert('Livro cadastrado com sucesso!');
        form.reset();
    } catch (err) {
        showError('Erro ao cadastrar livro: ' + err);
        alert('Erro ao cadastrar livro. Veja o console para mais detalhes.');
    }
}

// Inicializa listeners automaticamente quando o módulo é importado em uma página com formulário
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    if (!form) return;

    // Detecta campos para escolher o tipo de cadastro
    if (form.querySelector('#RA')) {
        form.addEventListener('submit', (e) => { e.preventDefault(); cadastrarAluno(form); });
    } else if (form.querySelector('#codigo')) {
        form.addEventListener('submit', (e) => { e.preventDefault(); cadastrarLivro(form); });
    }
});

export { cadastrarAluno, cadastrarLivro };
