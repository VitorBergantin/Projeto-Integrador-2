// src/js/gerenciarDuplicados.js
import { db } from "../lib/firebase.js";
import { collection, getDocs, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

async function carregarDuplicados() {
    const container = document.getElementById('duplicados-list');
    container.innerHTML = '<p class="loading">Carregando...</p>';

    try {
        const q = query(collection(db, 'livros'), orderBy('codigo', 'asc'));
        const snap = await getDocs(q);

        if (snap.empty) {
            container.innerHTML = '<p class="sucesso">Nenhum livro encontrado.</p>';
            return;
        }

        // Agrupar por código para identificar duplicados
        const grupos = new Map();
        snap.forEach(doc => {
            const data = doc.data();
            const codigo = data.codigo || '';
            if (!grupos.has(codigo)) grupos.set(codigo, []);
            grupos.get(codigo).push({ id: doc.id, data, documentId: doc.id });
        });

        // Filtrar apenas códigos que têm mais de um livro
        const duplicados = Array.from(grupos.entries()).filter(([codigo, livros]) => livros.length > 1);

        if (duplicados.length === 0) {
            container.innerHTML = '<p class="sucesso">✓ Nenhum código duplicado encontrado!</p>';
            return;
        }

        container.innerHTML = '';

        duplicados.forEach(([codigo, livros]) => {
            const grupo = document.createElement('div');
            grupo.className = 'duplicado-grupo';

            const h3 = document.createElement('h3');
            h3.textContent = `Código: ${codigo} (${livros.length} cópias)`;
            grupo.appendChild(h3);

            livros.forEach((item, index) => {
                const livroDiv = document.createElement('div');
                livroDiv.className = 'livro-item';

                const info = document.createElement('div');
                info.className = 'livro-info';
                info.innerHTML = `
                    <p><strong>Nome:</strong> ${item.data.nome || '—'}</p>
                    <p><strong>Autor:</strong> ${item.data.autor || '—'}</p>
                    <p><strong>Editora:</strong> ${item.data.editora || '—'}</p>
                    <p style="font-size: 0.85rem; color: #7f8c8d;">ID: ${item.documentId}</p>
                `;
                livroDiv.appendChild(info);

                // Botão de deletar (só se não for o primeiro — sugestão de manter um)
                if (index > 0) {
                    const btnDeletar = document.createElement('button');
                    btnDeletar.className = 'btn-deletar';
                    btnDeletar.textContent = 'Deletar';
                    btnDeletar.onclick = () => deletarLivro(item.documentId, btnDeletar, livroDiv);
                    livroDiv.appendChild(btnDeletar);
                } else {
                    const aviso = document.createElement('span');
                    aviso.style.color = '#27ae60';
                    aviso.style.fontSize = '0.9rem';
                    aviso.textContent = '✓ Manter (primeira cópia)';
                    livroDiv.appendChild(aviso);
                }

                grupo.appendChild(livroDiv);
            });

            container.appendChild(grupo);
        });

    } catch (err) {
        console.error('Erro ao carregar duplicados:', err);
        container.innerHTML = `<p class="erro">Erro ao carregar: ${err.message}</p>`;
    }
}

async function deletarLivro(documentId, btn, element) {
    if (!confirm('Tem certeza que deseja deletar este livro?')) return;

    btn.disabled = true;
    btn.textContent = 'Deletando...';

    try {
        await deleteDoc(doc(db, 'livros', documentId));
        console.log('Livro deletado:', documentId);
        
        // Remover do DOM
        element.style.opacity = '0.5';
        element.style.textDecoration = 'line-through';
        btn.textContent = '✓ Deletado';
        btn.style.background = '#27ae60';

        // Esperar 2s e recarregar a lista
        setTimeout(carregarDuplicados, 2000);
    } catch (err) {
        console.error('Erro ao deletar livro:', err);
        alert('Erro ao deletar livro: ' + (err.message || err));
        btn.disabled = false;
        btn.textContent = 'Deletar';
    }
}

document.addEventListener('DOMContentLoaded', carregarDuplicados);
