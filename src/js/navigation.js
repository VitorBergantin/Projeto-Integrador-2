// Floating navigation button (hamburger) injected into pages
(function(){
  // Detect repository base path (useful for GitHub Pages project sites)
  const repoName = 'Projeto-Integrador-2';
  const pathname = window.location.pathname;
  const repoBase = pathname.includes(`/${repoName}`)
    ? pathname.slice(0, pathname.indexOf(`/${repoName}`)) + `/${repoName}`
    : '';

  const base = repoBase || '';

  const links = [
    { label: 'Rankeamento - Início', href: `${base}/RANKEAMENTO/rank.html` },
    { label: 'Top Leitores', href: `${base}/RANKEAMENTO/top-readers.html` },
    { label: 'Top Livros', href: `${base}/RANKEAMENTO/top-books.html` },
    // Top Fornecedores link removed
    { label: 'Início', href: `${base}/index.html` },
    { label: 'Alunos - Início', href: `${base}/ALUNOS/index.html` },
    { label: 'Alunos - Cadastro', href: `${base}/ALUNOS/cadastro.html` },
    { label: 'Bibliotecário - Início', href: `${base}/BIBLIOTECARIO/index.html` },
    { label: 'Bibliotecário - Cadastro', href: `${base}/BIBLIOTECARIO/cadastro.html` },
    { label: 'Totem - Início', href: `${base}/TOTEM/index.html` },
    { label: 'Retirada', href: `${base}/TOTEM/retirada.html` },
    { label: 'Devolução', href: `${base}/TOTEM/devolucao.html` }
  ];

  // Create styles
  const style = document.createElement('style');
  style.textContent = `
  .float-nav { position: fixed; right: 16px; bottom: 16px; z-index: 9999; }
  .float-nav .fab { width:56px; height:56px; border-radius:50%; background:#2c3e50; color:white; border:none; box-shadow:0 6px 18px rgba(0,0,0,.2); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:22px; }
  .float-nav .fab:focus { outline:2px solid rgba(255,255,255,.2); }
  .float-nav .menu { display:none; position: absolute; right:0; bottom:72px; background: rgba(255,255,255,0.98); border-radius:8px; box-shadow:0 6px 18px rgba(0,0,0,.15); padding:8px; min-width:200px; }
  .float-nav.open .menu { display:block; }
  .float-nav .menu a { display:block; color:#222; padding:8px 12px; text-decoration:none; border-radius:4px; }
  .float-nav .menu a:hover { background:#f0f0f0; }
  .float-nav .menu .label { font-weight:600; padding:6px 12px; color:#555; }
  @media (max-width:420px){ .float-nav .menu { right: -8px; left:8px; min-width: auto; width: calc(100vw - 32px); } }
  `;
  document.head.appendChild(style);

  // Create container
  const container = document.createElement('div');
  container.className = 'float-nav';

  const btn = document.createElement('button');
  btn.className = 'fab';
  btn.setAttribute('aria-label','Abrir navegação');
  btn.innerHTML = '&#9776;'; // hamburger

  const menu = document.createElement('div');
  menu.className = 'menu';

  const label = document.createElement('div');
  label.className = 'label';
  label.textContent = 'Navegação';
  menu.appendChild(label);

  links.forEach(l => {
    const a = document.createElement('a');
    a.textContent = l.label;
    a.href = l.href;
    a.onclick = () => { container.classList.remove('open'); };
    menu.appendChild(a);
  });

  btn.addEventListener('click', (e)=>{
    e.stopPropagation();
    container.classList.toggle('open');
  });

  // Close on outside click
  document.addEventListener('click', (e)=>{
    if (!container.contains(e.target)) container.classList.remove('open');
  });

  // Close on ESC
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape') container.classList.remove('open');
  });

  container.appendChild(btn);
  container.appendChild(menu);
  document.body.appendChild(container);
})();
