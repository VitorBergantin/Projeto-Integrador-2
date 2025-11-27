# Sistema de Biblioteca

Este é um sistema de biblioteca com cadastro de alunos, livros e gestão de empréstimos, usando Firebase (Firestore) como banco de dados.

## 🌐 Acesso Online

O sistema está disponível online através do GitHub Pages:
https://vitorbergantin.github.io/Projeto-Integrador-2/

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

## 🚀 Desenvolvimento Local

1. Clone o repositório:
```bash
git clone https://github.com/VitorBergantin/Projeto-Integrador-2.git
cd Projeto-Integrador-2
```

2. Inicie um servidor local (necessário para módulos ES):
```bash
python -m http.server 8000
```

3. Abra no navegador:
- http://localhost:8000

## 🔒 Configuração do Firebase

O arquivo `src/lib/firebase.js` contém a configuração do Firebase. Para desenvolvimento:

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative o Firestore
3. Configure as regras do Firestore apropriadamente

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

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📊 Rankeamento (FireStore)

O módulo de rankeamento agora busca dados diretamente do Firestore (quando existirem) e cai para dados mock quando não houver coleções esperadas.

Coleções / campos que o sistema tenta usar (ordem de *detecção*):
- Leitores: `leituras`, `leituras_log`, `emprestimos`, `retiradas`, `historicoLeituras` — campos que identificam usuário: `userName`, `user`, `ra`, `nome`, `aluno`.
- Livros: `leituras`, `emprestimos`, `retiradas`, `historicoLeituras`, `livros_lidos` — campos que identificam título: `bookTitle`, `title`, `livro`, `book`, `codigo`.

Exemplo de documento para contagem simples de evento (Firestore):
```json
{ "user": "João Silva", "bookTitle": "O Senhor dos Anéis", "timestamp": "2025-01-10T13:00:00Z" }
```

Caso os nomes de coleção ou campos sejam diferentes no seu projeto, atualize `src/js/rank.js` para adaptar os nomes (funções `fetchTopReaders`, `fetchTopBooks`).

## 🎯 Retiradas / Devoluções
As páginas do Totem agora gravam eventos no Firestore quando um usuário faz retirada ou devolução de um livro:

- `emprestimos` — gravado pela página `TOTEM/retirada.html` com campos: `ra`, `livroId`, `dataRetirada`, `createdAt`, `source`.
- `devolucoes` — gravado pela página `TOTEM/devolucao.html` com campos: `ra`, `livroId`, `createdAt`, `source`.

Além disso o sistema tenta, quando possível, atualizar o status do documento do livro na coleção `livros`:
- marca `status: "emprestado"` e `emprestadoPor: <RA>` ao registrar uma retirada, se o livro for encontrado por doc id ou pelo campo `codigo`.
- marca `status: "disponivel"` e limpa `emprestadoPor` ao registrar uma devolução.

Esses eventos são usados pelo módulo de Rankeamento para calcular Top Leitores / Top Livros.

## 🧪 Importar seed de exemplo (opcional)
Incluí um JSON de exemplo em `seeds/firestore_seed_sample.json` e um script Node.js auxiliar `seeds/import_seed.js` para facilitar testes locais em um projeto Firebase.

Passos rápidos:
1. Crie um service account no Firebase Console e baixe a chave JSON.
2. Instale dependências: `npm install firebase-admin`.
3. Exporte a variável de ambiente `GOOGLE_APPLICATION_CREDENTIALS` apontando pra essa chave.
4. Execute `node seeds/import_seed.js` (isso criará documentos nas coleções listadas no seed).

Se preferir, você também pode inserir os documentos manualmente no Firebase Console.

### Novas coleções de eventos (retirada/devolução)
O sistema agora registra eventos de retirada e devolução a partir do módulo Totem. As coleções são:
- `emprestimos` — gravado quando um usuário retira um livro (usado pelo ranking em `fetchTopReaders` / `fetchTopBooks`).
- `devolucoes` — gravado quando o usuário devolve um livro.

Você encontrará um arquivo de exemplo de seed em `seeds/firestore_seed_sample.json` com documentos de `livros`, `emprestimos` e `devolucoes` para testes locais.

Importando o seed (opções):
- Console Firebase (manual): abra a coleção desejada e use a interface para adicionar os documentos do `seeds/firestore_seed_sample.json`.
- Firebase Admin Script (automático): se preferir automatizar, use um script Node.js com `firebase-admin` e uma chave de serviço — eu posso gerar um exemplo se quiser.
