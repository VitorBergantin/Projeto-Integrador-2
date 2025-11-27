// TOTEM/retirada.js
// Script para registrar empréstimos de livros no Firestore
// Conecta à coleção "emprestimo" com RA do aluno, código do livro e timestamp

import { db } from "../src/lib/firebase.js";
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

// Estilo CSS para toast
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

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

const retiradaForm = document.querySelector('.formulario');

retiradaForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const ra = retiradaForm.ra.value.trim();
  const codigoLivro = retiradaForm.codigo_livro.value.trim();

  if (!ra || !codigoLivro) {
    showToast('Preencha RA do aluno e código do livro.', 'error');
    return;
  }

  try {
    // 1. Verificar se o aluno existe (busca na coleção 'alunos')
    const alunosRef = collection(db, "alunos");
    const alunoQuery = query(alunosRef, where("ra", "==", ra));
    const alunoSnapshot = await getDocs(alunoQuery);

    if (alunoSnapshot.empty) {
      showToast('Aluno com RA ' + ra + ' não encontrado.', 'error');
      return;
    }

    // 2. Verificar se o livro existe e está disponível
    const livrosRef = collection(db, "livros");
    const livroQuery = query(livrosRef, where("codigo", "==", codigoLivro));
    const livroSnapshot = await getDocs(livroQuery);

    if (livroSnapshot.empty) {
      showToast('Livro com código ' + codigoLivro + ' não encontrado.', 'error');
      return;
    }

    const livroDoc = livroSnapshot.docs[0];
    const livroData = livroDoc.data();

    if (livroData.situacao !== 'disponível') {
      showToast('Este livro não está disponível para retirada.', 'error');
      return;
    }

    // 3. Registrar o empréstimo na coleção "emprestimo" com data/hora
    const emprestimoPayload = {
      ra: ra,
      codigoLivro: codigoLivro,
      nomeLivro: livroData.nome || 'Sem título',
      dataRetirada: serverTimestamp(), // data e hora automática do servidor
      status: "ativo"
    };

    await addDoc(collection(db, 'emprestimo'), emprestimoPayload);

    // 4. Atualizar a situação do livro para "indisponível"
    const livroDocRef = doc(db, "livros", livroDoc.id);
    await updateDoc(livroDocRef, { situacao: "indisponível" });

    showToast(`✓ Empréstimo registrado! Livro "${livroData.nome}" retirado com sucesso.`, 'success');
    retiradaForm.reset();

  } catch (error) {
    console.error("Erro ao processar retirada:", error);
    showToast('Erro: ' + (error.message || 'Falha ao registrar empréstimo'), 'error');
  }
});