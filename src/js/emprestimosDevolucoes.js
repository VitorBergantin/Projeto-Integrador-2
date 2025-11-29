// movimentacoes.js
import { db } from "../lib/firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
    const corpo = document.getElementById("tabela-movimentacoes");

    try {
        const snap = await getDocs(collection(db, "emprestimos"));

        if (snap.empty) {
            corpo.innerHTML = "<tr><td colspan='4' class='no-results'>Nenhuma movimentação encontrada.</td></tr>";
            return;
        }

        let lista = [];

        snap.forEach(doc => {
            const d = doc.data();

            lista.push({
                ra: d.ra || "—",
                codigo: d.codigoLivro || "—",
                tipo: d.status == "ativo" ? "EMPRÉSTIMO" : "DEVOLUÇÃO",
                data: d.dataRetirada?.toDate?.() ?? new Date(d.dataRetirada)
            });
        });

        // ordenar por data (mais recente primeiro)
        lista.sort((a, b) => b.data - a.data);

        corpo.innerHTML = "";

        lista.forEach(item => {
            const linha = `
                <tr>
                    <td>${item.ra}</td>
                    <td>${item.codigo}</td>
                    <td>${item.tipo}</td>
                    <td>${item.data.toLocaleDateString("pt-BR")} ${item.data.toLocaleTimeString("pt-BR")}</td>
                </tr>
            `;
            corpo.insertAdjacentHTML("beforeend", linha);
        });

    } catch (error) {
        console.error(error);
        corpo.innerHTML = "<tr><td colspan='4' class='no-results'>Erro ao carregar movimentações.</td></tr>";
    }
});