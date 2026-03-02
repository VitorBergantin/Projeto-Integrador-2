# Sistema de Biblioteca

Este é um sistema de biblioteca com cadastro de alunos, livros e gestão de empréstimos, usando Firebase (Firestore) como banco de dados.

## 📁 Estrutura do Projeto

```
Projeto-Integrador-2/
├── ALUNOS/           # Área do aluno
├── BIBLIOTECARIO/    # Área do bibliotecário
├── TOTEM/           # Sistema de autoatendimento
└── src/
    ├── lib/         # Configuração do Firebase
    └── js/          # Scripts compartilhados
```

## 🔒 Configuração do Firebase

O arquivo `src/lib/firebase.js` contém a configuração do Firebase.

### Regras do Firestore (desenvolvimento)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // APENAS PARA DESENVOLVIMENTO
    }
  }
}
```

⚠️ **Importante**: Não use essas regras em produção! Implemente autenticação e regras adequadas antes de publicar.

## 📝 Notas de Segurança

- A configuração do Firebase no código é pública (normal em apps web)
- Em produção, proteja os dados usando:
  - Firebase Authentication
  - Regras do Firestore baseadas em autenticação
  - Validação no backend (Cloud Functions) para operações críticas

## 🎯 Retiradas / Devoluções
As páginas do Totem agora gravam eventos no Firestore quando um usuário faz retirada ou devolução de um livro:

- `emprestimos` — gravado pela página `TOTEM/retirada.html` com campos: `ra`, `livroId`, `dataRetirada`, `createdAt`, `source`.
- `devolucoes` — gravado pela página `TOTEM/devolucao.html` com campos: `ra`, `livroId`, `createdAt`, `source`.

Além disso o sistema tenta, quando possível, atualizar o status do documento do livro na coleção `livros`:
- marca `status: "emprestado"` e `emprestadoPor: <RA>` ao registrar uma retirada, se o livro for encontrado por doc id ou pelo campo `codigo`.
- marca `status: "disponivel"` e limpa `emprestadoPor` ao registrar uma devolução.

Esses eventos são usados pelo módulo de Rankeamento para calcular Top Leitores / Top Livros.

### Novas coleções de eventos (retirada/devolução)
O sistema agora registra eventos de retirada e devolução a partir do módulo Totem. As coleções são:
- `emprestimos` — gravado quando um usuário retira um livro (usado pelo ranking em `fetchTopReaders` / `fetchTopBooks`).
- `devolucoes` — gravado quando o usuário devolve um livro.

Importando o seed (opções):
- Console Firebase (manual): abra a coleção desejada e use a interface para adicionar os documentos do `seeds/firestore_seed_sample.json`.
- Firebase Admin Script (automático): se preferir automatizar, use um script Node.js com `firebase-admin` e uma chave de serviço — eu posso gerar um exemplo se quiser.
