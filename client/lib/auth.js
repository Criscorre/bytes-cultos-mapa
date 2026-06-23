const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cultosig_secret_key_2026';

// Helper para middleware en API routes
export function withAuth(handler) {
  return (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided, authorization denied.' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return handler(req, res);
    } catch (err) {
      return res.status(401).json({ message: 'Token is invalid or expired.' });
    }
  };
}

// Helper para middleware de roles
export function withRole(roles = []) {
  return (handler) => (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided, authorization denied.' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (!roles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Insufficient permissions.' });
      }
      req.user = decoded;
      return handler(req, res);
    } catch (err) {
      return res.status(401).json({ message: 'Token is invalid or expired.' });
    }
  };
}

export { JWT_SECRET };
