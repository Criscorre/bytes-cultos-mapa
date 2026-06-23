const admin = require('../firebaseAdmin');

const firebaseAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided, authorization denied.' });
  }

  const idToken = authHeader.split(' ')[1];

  try {
    if (!admin || !admin.auth) {
      return res.status(500).json({ message: 'Firebase Admin not initialized.' });
    }
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (err) {
    console.error('Firebase token verification failed:', err);
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = firebaseAuth;
