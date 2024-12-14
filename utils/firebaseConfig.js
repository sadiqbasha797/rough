const admin = require('firebase-admin');
const serviceAccount = require('../ifeelincolor-d1d48668e823.json'); // Update the path to your JSON file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin; 