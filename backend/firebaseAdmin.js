const admin = require('firebase-admin');

function initFirebaseAdmin() {
  if (admin.apps && admin.apps.length) return admin.app();

  let serviceAccount = null;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (err) {
      console.error('FIREBASE_SERVICE_ACCOUNT is set but JSON parsing failed:', err.message);
      throw err;
    }
  } else {
    try {
      // try local file (useful for local dev)
      serviceAccount = require('./serviceAccountKey.json');
    } catch (err) {
      console.warn('No service account provided via env or serviceAccountKey.json. Firebase Admin will not initialize until credentials are provided.');
    }
  }

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID
    });
    console.log('Firebase Admin initialized.');
  }

  return admin;
}

module.exports = initFirebaseAdmin();
