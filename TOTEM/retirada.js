// CORREÇÃO: Unificando para usar o arquivo de configuração principal em src/lib/
import { db } from "../src/lib/firebase.js";
import { collection, query, where, getDocs, doc, updateDoc, writeBatch } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const retiradaForm = document.querySelector('.formulario');

retiradaForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const ra = retiradaForm.ra.value;
  const idLivro = retiradaForm.codigo_livro.value; // CORREÇÃO: Usando o nome correto do campo do HTML

  if (!ra || !idLivro) {
    alert('Por favor, preencha todos os campos.');
    return;
  }

  // 1. Encontrar o livro pelo ID
  const livrosRef = collection(db, "livros");
  // CORREÇÃO: O campo no banco de dados se chama "codigo", e não "id_livro".
  // A consulta foi ajustada para buscar pelo campo "codigo".
  const q = query(livrosRef, where("codigo", "==", idLivro));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    alert('Livro não encontrado com o ID informado.');
    return;
  }

  const livroDoc = querySnapshot.docs[0]; // Pega o primeiro livro encontrado
  const livroData = livroDoc.data();

  // 2. Verificar a situação do livro
  if (livroData.situacao !== 'disponível') {
    alert('Este livro não está disponível para retirada.');
    return;
  }

  try {
    // 3. Atualizar a situação do livro para "indisponível"
    const livroDocRef = doc(db, "livros", livroDoc.id);
    await updateDoc(livroDocRef, { situacao: "indisponível" });

    // CORREÇÃO: O campo no banco de dados se chama "nome", e não "titulo".
    alert(`Livro "${livroData.nome}" retirado com sucesso!`);
    retiradaForm.reset(); // Limpa o formulário
  } catch (error) {
    console.error("Erro ao atualizar a situação do livro: ", error);
    alert('Ocorreu um erro ao processar a retirada.');
  }
});