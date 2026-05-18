const admin = require("firebase-admin");

const serviceAccount = require("./firebase-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),

  storageBucket:
    "mozartify-msa.firebasestorage.app",
});

const bucket =
  admin.storage().bucket();

module.exports = bucket;