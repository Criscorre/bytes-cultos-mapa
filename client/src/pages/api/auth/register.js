import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { runQuery, getQuery } from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'cultosig_secret_key_2026';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, password, denomination, congregation, address, neighborhood, type, edifice_state, property_type, latitude, longitude, municipality_id } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const userResult = await runQuery(
        'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
        [email, hashedPassword, 'user']
      );

      const userId = userResult.lastID;

      // Create institution if provided
      if (denomination && congregation && address && neighborhood && municipality_id) {
        await runQuery(
          `INSERT INTO institutions 
           (user_id, denomination, congregation, address, neighborhood, municipality_id, type, edifice_state, property_type, latitude, longitude) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, denomination, congregation, address, neighborhood, municipality_id, type, edifice_state, property_type, latitude, longitude]
        );
      }

      // Generate token
      const token = jwt.sign({ id: userId, email, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });

      res.status(201).json({ message: 'User registered successfully.', token, userId });
    } catch (err) {
      console.error('Registration error:', err);
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ message: 'Email already registered.' });
      }
      res.status(500).json({ message: 'Error during registration.', error: err.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed.' });
  }
}
