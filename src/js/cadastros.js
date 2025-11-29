// src/js/cadastros.js
// Lógica compartilhada para cadastros de alunos e livros.
// Este arquivo contém as funções usadas pelos formulários para:
// - cadastrar alunos (coleção 'alunos')
// - cadastrar livros (coleção 'livros')
// As funções usam o Firestore (instância importada de ../lib/firebase.js)
// e as operações do SDK modular (collection, addDoc, serverTimestamp).
// CORREÇÃO: Alterado o caminho da importação para usar o mesmo config do Totem.
// CORREÇÃO FINAL: Unificando para usar o arquivo de configuração principal em src/lib/
import { db, storage, auth } from "../lib/firebase.js";

import { collection, addDoc, serverTimestamp, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-storage.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";

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

// Função para mostrar toast (notificação visual rápida)
// message: texto a ser exibido
// type: 'success' (verde) ou 'error' (vermelho)
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

}

function showError(msg) {
    // Loga o erro no console. Aqui poderíamos também enviar o erro
    // para um serviço externo de monitoramento se necessário.
    console.error(msg);
}

// Função para verificar se um código de livro já existe no Firestore
async function codigoExiste(codigo) {
    try {
        const q = query(collection(db, 'livros'), where('codigo', '==', codigo.trim()));
        const snap = await getDocs(q);
        return !snap.empty; // retorna true se existe, false caso contrário
    } catch (err) {
        console.error('Erro ao verificar código duplicado:', err);
        return false; // em caso de erro, permite prosseguir (validação falhou)
    }
}

async function cadastrarAluno(form) {
    // Função responsável por coletar os valores do formulário de aluno,
    // validar campos obrigatórios e gravar um documento na coleção
    // 'alunos' no Firestore. Também atualiza mensagens de status na
    // página e mostra toasts de sucesso/erro.
    const ra = form.querySelector('#RA')?.value.trim() || '';
    const nome = form.querySelector('#nome')?.value.trim() || '';
    const situacaoEl = document.getElementById('situacao');

    if (!ra || !nome) { 
        showToast('Preencha os campos RA e Nome.', 'error');
        return;
    }

    if (situacaoEl) situacaoEl.textContent = 'Enviando...';

    // verifica se já existe o mesmo RA (bloqueia qualquer cadastro com RA duplicado)
    try {
        const q = query(collection(db, 'alunos'), where('ra','==', ra));
        const snap = await getDocs(q);
        if (!snap.empty) {
            // já existe pelo menos um aluno com este RA
            showToast('Já existe um aluno com este RA.', 'error');
            if (situacaoEl) situacaoEl.textContent = 'RA já cadastrado.';
            return;
        }
    } catch(checkErr) {
        // falha na verificação não impede o cadastro — apenas logamos
        console.warn('Falha ao verificar duplicidade de aluno:', checkErr && checkErr.message ? checkErr.message : checkErr);
    }

    try {
        // Monta o objeto que será gravado no Firestore
        const payload = {
            ra,
            nome,
            createdAt: serverTimestamp() // usa horário do servidor
        };

        // desabilitar botão de submit para evitar múltiplos submits enquanto grava
        const submitBtn = form.querySelector('[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        // Insere documento na coleção 'alunos'
        await addDoc(collection(db, 'alunos'), payload);

        // Notifica sucesso ao usuário e limpa o formulário
        showToast('Aluno cadastrado com sucesso!', 'success');
        if (situacaoEl) situacaoEl.textContent = 'Cadastro realizado com sucesso!';
        form.reset();
        if (submitBtn) submitBtn.disabled = false;
    } catch (err) {
        // Em caso de erro, loga e informa o usuário
        console.error('Erro ao cadastrar aluno:', err);
        showToast('Erro ao cadastrar aluno. Tente novamente.', 'error');
        if (situacaoEl) situacaoEl.textContent = 'Erro ao cadastrar. Veja o console.';
        // re-habilita botão caso tenha falhado
        const submitBtn2 = form.querySelector('[type="submit"]');
        if (submitBtn2) submitBtn2.disabled = false;
        showError(err);
    }
}

async function cadastrarLivro(form) {
    // Função responsável por coletar os valores do formulário de livro,
    // validar campos obrigatórios e gravar um documento na coleção
    // 'livros' no Firestore. Em caso de sucesso exibe um toast e reseta o
    // formulário; em caso de erro, registra no console e notifica o usuário.
    const codigo = form.querySelector('#codigo')?.value.trim() || '';
    const nome = form.querySelector('#nome')?.value.trim() || '';
    const autor = form.querySelector('#autor')?.value.trim() || '';
    const editora = form.querySelector('#editora')?.value.trim() || '';

    if (!codigo || !nome || !autor || !editora) {
        showToast('Preencha todos os campos do livro.', 'error');
        return;
    }

    // Verificar se o código já existe
    const existe = await codigoExiste(codigo);
    if (existe) {
        showToast(`Erro: já existe um livro com o código "${codigo}".`, 'error');
        return;
    }

    try {
        console.log('[cadastros] cadastrarLivro: iniciando cadastro do livro', { codigo, nome });
        // desabilitar botão de submit para evitar múltiplos uploads
        const submitBtn = form.querySelector('[type="submit"]');
        const statusEl = document.getElementById('upload-status');
        if (statusEl) statusEl.textContent = 'Preparando envio...';
        if (submitBtn) submitBtn.disabled = true;

        // Monta o objeto do livro e grava no Firestore
        const payload = {
            codigo,
            nome,
            autor,
            editora,
            createdAt: serverTimestamp(),
            disponivel: 1
        };

        // se houver um arquivo selecionado, faça upload para Storage
        const fileInput = form.querySelector('#coverInput');
        const file = fileInput?.files?.[0];
        if (file) {
            console.log('[cadastros] arquivo selecionado para upload:', file.name, 'tamanho=', file.size);
            // validações básicas: tipo e tamanho
            if (!file.type.startsWith('image/')) {
                showToast('Capa deve ser um arquivo de imagem.', 'error');
                if (submitBtn) submitBtn.disabled = false;
                return;
            }
            const maxBytes = 3 * 1024 * 1024; // 3 MB
            if (file.size > maxBytes) {
                showToast('A imagem excede o limite de 3MB.', 'error');
                if (submitBtn) submitBtn.disabled = false;
                return;
            }

            // gerar caminho único
            const safeName = (file.name || 'cover').replace(/[^a-z0-9.\-_]/gi, '_');
            const path = `livros/covers/${codigo}-${Date.now()}-${safeName}`;
            const sRef = storageRef(storage, path);

            // garantir autenticação anônima (muitos projetos obrigam auth para escrita)
            try { await signInAnonymously(auth); } catch (err) { /* ignora, pode já estar autenticado */ }

            // upload com progresso mínimo e feedback ao usuário
            await new Promise((resolve, reject) => {
                const task = uploadBytesResumable(sRef, file);
                task.on('state_changed', (snap) => {
                    const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
                    console.log('[cadastros] upload progresso %', pct);
                    if (statusEl) statusEl.textContent = `Upload: ${pct}%`;
                }, (err) => {
                    console.error('[cadastros] upload falhou', err);
                    if (statusEl) statusEl.textContent = `Erro no upload: ${err && err.message ? err.message : err}`;
                    showToast(err && err.message ? `Upload falhou: ${err.message}` : 'Erro no upload', 'error');
                    if (submitBtn) submitBtn.disabled = false;
                    reject(err);
                }, async () => {
                    try {
                        const url = await getDownloadURL(task.snapshot.ref);
                        console.log('[cadastros] upload concluído, url=', url);
                        payload.coverUrl = url;
                        if (statusEl) statusEl.textContent = 'Upload concluído';
                        resolve(url);
                    } catch (e) {
                        console.error('[cadastros] erro getDownloadURL', e);
                        if (statusEl) statusEl.textContent = `Erro obtendo URL: ${e && e.message ? e.message : e}`;
                        showToast(e && e.message ? `Erro ao obter URL: ${e.message}` : 'Erro ao obter URL', 'error');
                        if (submitBtn) submitBtn.disabled = false;
                        reject(e);
                    }
                });
            });
        }

        console.log('[cadastros] Gravando documento do livro no Firestore...', payload);
        if (statusEl) statusEl.textContent = 'Gravando livro no banco...';
        await addDoc(collection(db, 'livros'), payload);
        console.log('[cadastros] Livro cadastrado com sucesso no Firestore');

        // Feedback ao usuário e limpeza do formulário
        showToast('Livro cadastrado com sucesso!', 'success');
        form.reset();
        if (statusEl) statusEl.textContent = 'Pronto.';
        if (submitBtn) submitBtn.disabled = false;
    } catch (err) {
        // Log e notificação de erro
        console.error('Erro ao cadastrar livro:', err);
        const message = err && err.message ? err.message : String(err);
        showToast(`Erro ao cadastrar: ${message}`, 'error');
        if (statusEl) statusEl.textContent = `Erro: ${message}`;
        showError(err);
        // re-habilitar botão para nova tentativa
        if (submitBtn) submitBtn.disabled = false;
    }
}

// Inicializa listeners automaticamente quando o módulo é importado em uma página com formulário
document.addEventListener('DOMContentLoaded', () => {
    // Procura especificamente pelo formulário de cadastro de aluno
    const formAluno = document.querySelector('form#form-aluno');
    if (formAluno) {
        formAluno.addEventListener('submit', (e) => {
            e.preventDefault();
            cadastrarAluno(formAluno);
        });
    }

    // Procura especificamente pelo formulário de cadastro de livro
    const formLivro = document.querySelector('form#form-livro');
    if (formLivro) {
        // preview de capa quando o usuário selecionar um arquivo
        const fileInput = formLivro.querySelector('#coverInput');
        const preview = document.getElementById('cover-preview');
        if (fileInput && preview) {
            fileInput.addEventListener('change', () => {
                const f = fileInput.files?.[0];
                preview.innerHTML = '';
                if (!f) return;
                if (!f.type.startsWith('image/')) {
                    preview.textContent = 'Arquivo selecionado não é uma imagem.';
                    return;
                }
                const img = document.createElement('img');
                img.style.maxWidth = '180px';
                img.style.maxHeight = '220px';
                img.style.objectFit = 'cover';
                img.src = URL.createObjectURL(f);
                preview.appendChild(img);
            });
        }
        formLivro.addEventListener('submit', (e) => {
            e.preventDefault();
            cadastrarLivro(formLivro);
        });
    }
});

export { cadastrarAluno, cadastrarLivro };
