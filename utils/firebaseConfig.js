const admin = require('firebase-admin');
const serviceAccount = require('../2.json'); // Your service account key file

// Initialize Firebase Admin with explicit project ID
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'ifeel-in-colors', // Make sure this matches your Firebase project ID
});

module.exports = admin; 