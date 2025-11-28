// TOTEM/relatorio.js
// Script para buscar e exibir os livros atualmente emprestados

import { db } from "../src/lib/firebase.js";
import { collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    const corpoTabela = document.getElementById('relatorio-corpo');

    try {
        // 1. Criar a consulta para buscar empréstimos com status "ativo"
        const emprestimosRef = collection(db, "emprestimos");
        const q = query(
            emprestimosRef, 
            where("status", "==", "ativo"),
            orderBy("dataRetirada", "desc") // Ordena pelos mais recentes primeiro
        );

        // 2. Executar a consulta
        const querySnapshot = await getDocs(q);

        // Limpa o corpo da tabela (caso haja algum conteúdo placeholder)
        corpoTabela.innerHTML = '';

        // 3. Verificar se há resultados
        if (querySnapshot.empty) {
            const linha = corpoTabela.insertRow();
            const celula = linha.insertCell();
            celula.colSpan = 3;
            celula.textContent = "Nenhum livro emprestado no momento.";
            celula.classList.add('no-results');
            return;
        }

        // 4. Iterar sobre os documentos e preencher a tabela
        querySnapshot.forEach(doc => {
            const emprestimo = doc.data();
            const linha = corpoTabela.insertRow();

            // Formatar a data para um formato legível
            let dataFormatada = 'Data indisponível';
            if (emprestimo.dataRetirada && emprestimo.dataRetirada.toDate) {
                const data = emprestimo.dataRetirada.toDate();
                dataFormatada = data.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            }

            // Inserir células na linha
            linha.insertCell().textContent = emprestimo.nomeLivro || 'Sem título';
            linha.insertCell().textContent = emprestimo.ra;
            linha.insertCell().textContent = dataFormatada;
        });

    } catch (error) {
        console.error("Erro ao gerar relatório:", error);
        corpoTabela.innerHTML = ''; // Limpa a tabela em caso de erro
        const linha = corpoTabela.insertRow();
        const celula = linha.insertCell();
        celula.colSpan = 3;
        celula.textContent = "Ocorreu um erro ao carregar o relatório. Tente novamente mais tarde.";
        celula.classList.add('no-results');
        celula.style.color = 'red';
    }
});