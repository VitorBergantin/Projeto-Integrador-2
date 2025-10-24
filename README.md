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
