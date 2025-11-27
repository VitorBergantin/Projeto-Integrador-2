import { db, auth } from '../lib/firebase.js';
import { addDoc, collection, serverTimestamp, doc, getDoc, updateDoc, query, where, limit, getDocs } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js';
import { signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js';

async function ensureAuth(){
  try{
    if (auth) await signInAnonymously(auth);
  }catch(e){ console.warn('Autenticação anônima falhou (não-fatal):', e && e.message ? e.message : e); }
}

function toast(container, msg, success = true){
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.padding = '10px 12px';
  el.style.borderRadius = '8px';
  el.style.marginTop = '8px';
  el.style.background = success ? '#ecfdf5' : '#fff1f2';
  el.style.color = success ? '#065f46' : '#991b1b';
  container.appendChild(el);
  setTimeout(()=> el.remove(), 6000);
}

document.addEventListener('DOMContentLoaded', ()=>{
  // Retirada form
  const retiradaForm = document.querySelector('form.formulario[action*="Retirada" i], form.formulario');
  // We will try to match by pathname too
  const path = window.location.pathname.toLowerCase();

  if (path.endsWith('/totem/retirada.html') || path.endsWith('/retirada.html')){
    const form = document.querySelector('form.formulario');
    if (!form) return;
    form.addEventListener('submit', async (ev)=>{
      ev.preventDefault();
      const ra = (form.elements['ra'] && form.elements['ra'].value || '').trim();
      const id_livro = (form.elements['id_livro'] && form.elements['id_livro'].value || '').trim();
      const data_retirada = (form.elements['data_retirada'] && form.elements['data_retirada'].value) || null;
      if (!ra || !id_livro) return toast(form, 'Digite RA e ID do livro', false);

      try{
        await ensureAuth();
        const docRef = await addDoc(collection(db, 'emprestimos'), {
          ra, livroId: id_livro, dataRetirada: data_retirada || null, createdAt: serverTimestamp(), source: 'totem'
        });

        // tenta marcar o livro como emprestado (por doc id ou campo 'codigo')
        try{
          // primeiro tentativa: interpretar id_livro como document id
          const potentialDoc = doc(db, 'livros', id_livro);
          const snap = await getDoc(potentialDoc);
          if (snap && snap.exists()){
            await updateDoc(potentialDoc, { status: 'emprestado', emprestadoPor: ra, updatedAt: serverTimestamp() });
          } else {
            // busca por campo codigo
            const q = query(collection(db, 'livros'), where('codigo','==', id_livro), limit(1));
            const res = await getDocs(q);
            if (!res.empty) {
              const found = res.docs[0];
              await updateDoc(doc(db,'livros', found.id), { status: 'emprestado', emprestadoPor: ra, updatedAt: serverTimestamp() });
            }
          }
        }catch(upErr){ console.warn('Não foi possível atualizar o livro como emprestado:', upErr && upErr.message ? upErr.message : upErr); }

        toast(form, `Retirada registrada (id: ${docRef.id})`);
        form.reset();
      }catch(err){
        console.error('Erro ao gravar retirada:', err);
        toast(form, 'Falha ao salvar retirada. Ver console.', false);
      }
    });
  }

  if (path.endsWith('/totem/devolucao.html') || path.endsWith('/devolucao.html')){
    const form = document.querySelector('form.formulario');
    if (!form) return;
    form.addEventListener('submit', async (ev)=>{
      ev.preventDefault();
      const ra = (form.elements['ra'] && form.elements['ra'].value || '').trim();
      const id_livro = (form.elements['id_livro'] && form.elements['id_livro'].value || '').trim();
      if (!ra || !id_livro) return toast(form, 'Digite RA e código do livro', false);

      try{
        await ensureAuth();
        const docRef = await addDoc(collection(db, 'devolucoes'), {
          ra, livroId: id_livro, createdAt: serverTimestamp(), source: 'totem'
        });

        // tenta marcar livro como disponível novamente
        try{
          const potentialDoc = doc(db, 'livros', id_livro);
          const snap = await getDoc(potentialDoc);
          if (snap && snap.exists()){
            await updateDoc(potentialDoc, { status: 'disponivel', emprestadoPor: null, updatedAt: serverTimestamp() });
          } else {
            const q = query(collection(db, 'livros'), where('codigo','==', id_livro), limit(1));
            const res = await getDocs(q);
            if (!res.empty) {
              const found = res.docs[0];
              await updateDoc(doc(db,'livros', found.id), { status: 'disponivel', emprestadoPor: null, updatedAt: serverTimestamp() });
            }
          }
        }catch(upErr){ console.warn('Não foi possível atualizar o livro durante devolução:', upErr && upErr.message ? upErr.message : upErr); }

        toast(form, `Devolução registrada (id: ${docRef.id})`);
        form.reset();
      }catch(err){
        console.error('Erro ao gravar devolução:', err);
        toast(form, 'Falha ao salvar devolução. Ver console.', false);
      }
    });
  }
});

export default {};
