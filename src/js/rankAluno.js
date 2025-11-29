// consultar_leitor.js
import { db } from "../lib/firebase.js";
import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

// ------------------------------
// Data dos últimos 6 meses
// ------------------------------
function getLastSemesterDate() {
    const date = new Date();
    date.setMonth(date.getMonth() - 6);
    return date;
}

// ------------------------------
// Rank do aluno conforme quantidade
// ------------------------------
function getRank(qtd) {
    if (qtd <= 5) return "Leitor Iniciante";
    if (qtd <= 10) return "Leitor Regular";
    if (qtd <= 20) return "Leitor Ativo";
    return "Leitor Extremo";
}

// ------------------------------
// Busca nome do aluno na coleção alunos
// ------------------------------
async function fetchStudent(ra) {
    const snap = await getDocs(query(collection(db, "alunos"), where("ra", "==", ra)));

    if (snap.empty) return null;

    return snap.docs[0].data();
}

// ------------------------------
// Conta os empréstimos do semestre
// ------------------------------
async function countLoansThisSemester(ra) {
    const limite = getLastSemesterDate();
    let total = 0;

    const emprestimosSnap = await getDocs(
        query(collection(db, "emprestimos"), where("ra", "==", ra))
    );

    emprestimosSnap.forEach(doc => {
        const emp = doc.data();

        if (!emp.dataRetirada) return;

        const dt = emp.dataRetirada.toDate
            ? emp.dataRetirada.toDate()
            : new Date(emp.dataRetirada);

        if (dt >= limite) {
            total++;
        }
    });

    return total;
}

// ------------------------------
// Evento do botão "Buscar"
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
    const inputRA = document.getElementById("ra-input");
    const btnBuscar = document.getElementById("buscar-btn");
    const resultado = document.getElementById("resultado");

    btnBuscar.addEventListener("click", async () => {
        const ra = inputRA.value.trim();

        if (!ra) {
            alert("Digite um RA válido.");
            return;
        }

        resultado.innerHTML = "<p>Carregando...</p>";

        // 1 — Buscar aluno
        const aluno = await fetchStudent(ra);

        if (!aluno) {
            resultado.innerHTML = "<p>RA não encontrado.</p>";
            return;
        }

        // 2 — Contar livros do semestre
        const total = await countLoansThisSemester(ra);

        // 3 — Calcular rank
        const rank = getRank(total);

        // 4 — Exibir resultado
        resultado.innerHTML = `
            <div class="card">
                <p><strong>Nome:</strong> ${aluno.nome}</p>
                <p><strong>RA:</strong> ${ra}</p>
                <p><strong>Livros lidos nos últimos 6 meses:</strong> ${total}</p>
                <p><strong>Rank:</strong> ${rank}</p>
            </div>
        `;
    });
});
