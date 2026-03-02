# Sistema de Biblioteca

Este é um sistema de biblioteca com cadastro de alunos, livros e gestão de empréstimos, usando Firebase (Firestore) como banco de dados.

## Estrutura do Projeto

```
Projeto-Integrador-2/
├── ALUNOS/           # Área do aluno
├── BIBLIOTECARIO/    # Área do bibliotecário
├── TOTEM/           # Sistema de autoatendimento
└── src/
    ├── lib/         # Configuração do Firebase
    └── js/          # Scripts compartilhados
```

## Configuração do Firebase

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
 **Importante**: Não use essas regras em produção! Implemente autenticação e regras adequadas antes de publicar.

## Notas de Segurança

- A configuração do Firebase no código é pública (normal em apps web)
- Em produção, proteja os dados usando:
  - Firebase Authentication
  - Regras do Firestore baseadas em autenticação
  - Validação no backend (Cloud Functions) para operações críticas

### Novas coleções de eventos (retirada/devolução)
O sistema agora registra eventos de retirada e devolução a partir do módulo Totem. As coleções são:
- `emprestimos` — gravado quando um usuário retira um livro.
- `devolucoes` — gravado quando o usuário devolve um livro.
