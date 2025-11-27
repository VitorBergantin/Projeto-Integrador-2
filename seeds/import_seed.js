// seeds/import_seed.js
// Script Node.js para importar o JSON de exemplo do diretório seeds/firestore_seed_sample.json
// Uso:
// 1. Instale dependências: npm install firebase-admin
// 2. Exporte variável de ambiente com a chave do serviço do Firebase: setx GOOGLE_APPLICATION_CREDENTIALS "C:\path\to\serviceAccountKey.json"
// 3. Execute: node import_seed.js

const fs = require('fs');
const admin = require('firebase-admin');

const seedPath = __dirname + '/firestore_seed_sample.json';
if (!fs.existsSync(seedPath)) { console.error('Arquivo seed não encontrado:', seedPath); process.exit(1); }

const raw = fs.readFileSync(seedPath, 'utf8');
const seed = JSON.parse(raw);

function convertValue(v){
  if (v && typeof v === 'object' && v._type === 'serverTimestamp') return admin.firestore.FieldValue.serverTimestamp();
  return v;
}

function convertObj(obj){
  const out = {};
  for (const k of Object.keys(obj)) out[k] = convertValue(obj[k]);
  return out;
}

async function main(){
  admin.initializeApp();
  const db = admin.firestore();

  for (const collName of Object.keys(seed)){
    const items = seed[collName];
    console.log(`Importando ${items.length} docs para a coleção '${collName}'`);
    for (const item of items){
      const data = convertObj(item);
      await db.collection(collName).add(data);
    }
  }
  console.log('Importação finalizada.');
  process.exit(0);
}

main().catch(err => { console.error('Erro ao importar seed:', err); process.exit(2); });
