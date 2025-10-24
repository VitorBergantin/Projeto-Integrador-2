# Projeto-Integrador-2 — Instruções de teste com Firebase

Resumo curto
- Este projeto é um site estático (HTML/CSS/JS) integrado ao Firebase (Firestore). Os formulários de cadastro gravam nas coleções `alunos` e `livros`.

Como rodar localmente
1. Abra um PowerShell na raiz deste repositório (onde está este README).
2. Inicie um servidor HTTP simples para permitir imports ES Modules (recomendado):

```powershell
python -m http.server 8000
```

3. Abra no navegador:
- http://localhost:8000/ALUNOS/cadastro.html
- http://localhost:8000/BIBLIOTECARIO/cadastro.html

Testes e verificação
- Preencha os formulários e envie. Mensagens de sucesso/erro serão exibidas.
- Abra o console do navegador (F12) para ver logs ou erros de import/import map/CORS.
- No Firebase Console → Firestore, verifique se aparecem documentos nas coleções `alunos` e `livros`.

Pontos de atenção (segurança)
- O arquivo `src/lib/firebase.js` contém a configuração pública do Firebase (apiKey, etc.). Isso é normal para apps web.
- Garanta que as Regras do Firestore não estejam abertas em produção. Para testes locais temporários, você pode ajustar as regras, mas não deixe `allow read, write: if true` em produção.

Melhorias sugeridas (próximos passos)
- Implementar Firebase Authentication e regras baseadas em UID.
- Validar campos no frontend com mensagens mais específicas.
- Adicionar feedback visual (loading, toasts) e captura de erros mais detalhada.

Commit local (faça push quando pronto)
- Eu posso criar o commit local para você se desejar (não vou fazer o push remoto). Se já quiser, eu posso commitar os arquivos que acabei de alterar.
