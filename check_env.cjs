
const { spawn } = require('child_process');
const path = require('path');

console.log('Vérification de la variable INTERNAL_API_TOKEN...');

// Créons un petit script temporaire pour afficher la variable
const testScript = `
require('dotenv').config({ path: '${path.join(__dirname, 'server', '.env').replace(/\\/g, '\\\\')}' });
console.log('INTERNAL_API_TOKEN:', process.env.INTERNAL_API_TOKEN || 'Non définie, utilisation de la valeur par défaut');
`;

const fs = require('fs');
fs.writeFileSync(path.join(__dirname, 'temp_check_env.cjs'), testScript);

// Exécutons-le
const child = spawn('node', ['temp_check_env.cjs'], { cwd: __dirname });

child.stdout.on('data', (data) => {
  console.log(data.toString());
});

child.stderr.on('data', (data) => {
  console.error(data.toString());
});

child.on('close', () => {
  fs.unlinkSync(path.join(__dirname, 'temp_check_env.cjs'));
});
