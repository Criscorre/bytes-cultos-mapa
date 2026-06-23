import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getQuery } from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'cultosig_secret_key_2026';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
      const user = await getQuery('SELECT id, email, password, role FROM users WHERE email = ?', [email]);

      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

      res.status(200).json({ message: 'Login successful.', token, userId: user.id, role: user.role });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ message: 'Error during login.', error: err.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed.' });
  }
}
