/* the basis of the program was created by following the tutorial: 
* https://www.youtube.com/watch?v=-MTSQjw5DrM&ab_channel=Fireship 
* ChatGPT also helped with the project as I would prompt it with the 
* requirements provided when stuck
*/

const express = require('express');
const forge = require('node-forge');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 8080;

app.use(express.json())

const keys = [];

//asked ChatGPT
function generateRSAKeyPair() {
  const { publicKey, privateKey } = forge.pki.rsa.generateKeyPair(2048);
  const keyId = forge.util.bytesToHex(forge.random.getBytes(16));
  const keyInfo = {
    kid: keyId,
    publicKey: forge.pki.publicKeyToPem(publicKey),
    privateKey: forge.pki.privateKeyToPem(privateKey),
    expiry: Date.now() + expirySeconds * 2
  };
  keys.push(keyInfo);
  return keyInfo;
}

//asked ChatGPT
function getJWKS() {
  return {
    keys: keys
      .filter(key => key.expiry > Date.now())
      .map(key => {
        const forgeKey = forge.pki.publicKeyFromPem(key.publicKey);
        return {
          kty: 'RSA',
          kid: key.kid,
          n: forge.util.encode64(forgeKey.n.toString(16)),
          e: forge.util.encode64(forgeKey.e.toString(16)),
          alg: "RS256",
          use: "sig"
        };
      })
  };
}

app.get('/.well-known/jwks.json', (req, res) => {
    res.json(getJWKS());
  });

//asked ChatGPT
app.all('/auth', (req, res, next) => {
    if (req.method !== 'POST') {
      return res.status(405).end();
    }
    next();
  });

app.post('/auth', (req, res) => {
  let keyToUse = keys.find(key => key.expiry > Date.now());
  if (req.query.expired) {
    keyToUse = keys.find(key => key.expiry <= Date.now());
  }

  if (!keyToUse) {
    return res.status(400).json({ error: 'Suitable key not found' });
  }

  //asked ChatGPT
  const token = jwt.sign({ user: 'demo' }, keyToUse.privateKey, { algorithm: 'RS256', expiresIn: '1h', keyid: keyToUse.kid });
  res.json({ token });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
