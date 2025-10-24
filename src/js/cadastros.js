// src/js/cadastros.js
// Lógica compartilhada para cadastros de alunos e livros.
import { db } from "../lib/firebase.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

// Estilo CSS para o toast
const style = document.createElement('style');
style.textContent = `
.toast {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #333;
    color: white;
    padding: 12px 24px;
    border-radius: 4px;
    display: none;
    z-index: 1000;
    animation: slideIn 0.3s ease-in-out;
}

.toast.success { background: #4CAF50; }
.toast.error { background: #f44336; }

@keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
}
`;
document.head.appendChild(style);

// Função para mostrar toast
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Mostrar o toast
    toast.style.display = 'block';
    
    // Remover após 3 segundos
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);

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
        showToast('Aluno cadastrado com sucesso!', 'success');
        if (situacaoEl) situacaoEl.textContent = 'Cadastro realizado com sucesso!';
        form.reset();
    } catch (err) {
        console.error('Erro ao cadastrar aluno:', err);
        showToast('Erro ao cadastrar aluno. Tente novamente.', 'error');
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
        showToast('Livro cadastrado com sucesso!', 'success');
        form.reset();
    } catch (err) {
        console.error('Erro ao cadastrar livro:', err);
        showToast('Erro ao cadastrar livro. Tente novamente.', 'error');
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
