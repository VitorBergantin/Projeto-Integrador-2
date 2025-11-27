import { db } from "../src/lib/firebase.js";
import { collection, query, where, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Preenche a data atual no campo de devolução
document.addEventListener('DOMContentLoaded', () => {
  const dataDevolucaoInput = document.querySelector('input[name="data_devolucao"]');
  if (dataDevolucaoInput) {
    dataDevolucaoInput.value = new Date().toISOString().split('T')[0];
  }
});

const devolucaoForm = document.querySelector('.formulario');

devolucaoForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const ra = devolucaoForm.ra.value;
  const idLivro = devolucaoForm.codigo_livro.value;

  if (!ra || !idLivro) {
    alert('Por favor, preencha todos os campos.');
    return;
  }

  const livrosRef = collection(db, "livros");
  const q = query(livrosRef, where("codigo", "==", idLivro));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    alert('Livro não encontrado com o código informado.');
    return;
  }

  const livroDoc = querySnapshot.docs[0];

  try {
    const livroDocRef = doc(db, "livros", livroDoc.id);
    await updateDoc(livroDocRef, { situacao: "disponível" });

    alert(`Livro "${livroDoc.data().nome}" devolvido com sucesso!`);
    devolucaoForm.reset();
  } catch (error) {
    console.error("Erro ao atualizar a situação do livro: ", error);
    alert('Ocorreu um erro ao processar a devolução.');
  }
});