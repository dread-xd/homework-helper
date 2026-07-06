const crypto = require('crypto');
const fs = require('fs');

const pemKey = fs.readFileSync('C:\\Users\\PC\\Desktop\\github\\homework-helper\\key.pem', 'utf8');
const key = crypto.createPrivateKey(pemKey);
const pubKey = crypto.createPublicKey(key);
const pubDer = pubKey.export({ type: 'spki', format: 'der' });
const hash = crypto.createHash('sha256').update(pubDer).digest();
const raw = hash.subarray(0, 16);
let id = '';
for (let i = 0; i < raw.length; i++) {
  id += String.fromCharCode(raw[i]);
}
id = btoa(id)
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');
console.log(id);
