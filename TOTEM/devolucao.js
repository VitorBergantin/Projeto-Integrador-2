// TOTEM/devolucao.js
// Script para registrar devoluções de livros no Firestore

import { db } from "../src/lib/firebase.js";
import { 
    collection, query, where, getDocs, doc, updateDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

// --- TOAST CSS ---
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

// --- FORM DE DEVOLUÇÃO ---
const devolucaoForm = document.querySelector('.formulario');

devolucaoForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const ra = devolucaoForm.ra.value.trim();
    const codigoLivro = devolucaoForm.codigo_livro.value.trim();

    if (!ra || !codigoLivro) {
        showToast('Preencha RA do aluno e código do livro.', 'error');
        return;
    }

    try {
        // 1. Verificar aluno
        const alunosRef = collection(db, "alunos");
        const alunoQuery = query(alunosRef, where("ra", "==", ra));
        const alunoSnapshot = await getDocs(alunoQuery);

        if (alunoSnapshot.empty) {
            showToast("Aluno não encontrado.", "error");
            return;
        }

        // 2. Verificar livro
        const livrosRef = collection(db, "livros");
        const livroQuery = query(livrosRef, where("codigo", "==", codigoLivro));
        const livroSnapshot = await getDocs(livroQuery);

        if (livroSnapshot.empty) {
            showToast("Livro não encontrado.", "error");
            return;
        }

        const livroDoc = livroSnapshot.docs[0];
        const livroData = livroDoc.data();

        // 3. Verificar se existe empréstimo ativo
        const emprestimoRef = collection(db, "emprestimo");
        const emprestimoQuery = query(
            emprestimoRef,
            where("ra", "==", ra),
            where("codigoLivro", "==", codigoLivro),
            where("status", "==", "ativo")
        );

        const emprestimoSnapshot = await getDocs(emprestimoQuery);

        if (emprestimoSnapshot.empty) {
            showToast("Nenhum empréstimo ativo encontrado para este aluno e livro.", "error");
            return;
        }

        const emprestimoDoc = emprestimoSnapshot.docs[0];
        const emprestimoDocRef = doc(db, "emprestimo", emprestimoDoc.id);

        // 4. Atualizar empréstimo → devolvido
        await updateDoc(emprestimoDocRef, {
            status: "devolvido",
            dataDevolucao: serverTimestamp()
        });

        // 5. Atualizar livro → disponível
        const livroDocRef = doc(db, "livros", livroDoc.id);

        await updateDoc(livroDocRef, {
            disponivel: 1
        });

        showToast(
            `✓ Devolução registrada! Livro "${livroData.nome}" agora está disponível.`,
            'success'
        );

        devolucaoForm.reset();

    } catch (error) {
        console.error("Erro na devolução:", error);
        showToast("Erro ao registrar devolução: " + error.message, "error");
    }
});
