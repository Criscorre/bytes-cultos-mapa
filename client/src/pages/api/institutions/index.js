import jwt from 'jsonwebtoken';
import { runQuery, allQuery, getQuery } from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'cultosig_secret_key_2026';

function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const user = verifyToken(req);
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized.' });
      }

      // Admin/SuperAdmin can see all institutions, others only their own
      let institutions;
      if (user.role === 'admin' || user.role === 'superadmin') {
        institutions = await allQuery(`
          SELECT i.*, m.name as municipality_name
          FROM institutions i
          LEFT JOIN municipalities m ON i.municipality_id = m.id
          ORDER BY i.created_at DESC
        `);
      } else {
        institutions = await allQuery(`
          SELECT i.*, m.name as municipality_name
          FROM institutions i
          LEFT JOIN municipalities m ON i.municipality_id = m.id
          WHERE i.user_id = ?
          ORDER BY i.created_at DESC
        `, [user.id]);
      }

      res.status(200).json(institutions);
    } catch (err) {
      console.error('Error fetching institutions:', err);
      res.status(500).json({ message: 'Error fetching institutions.', error: err.message });
    }
  } else if (req.method === 'POST') {
    try {
      const user = verifyToken(req);
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized.' });
      }

      const { denomination, congregation, address, neighborhood, municipality_id, type, edifice_state, property_type, latitude, longitude } = req.body;

      if (!denomination || !congregation || !address || !neighborhood || !municipality_id) {
        return res.status(400).json({ message: 'Missing required fields.' });
      }

      const result = await runQuery(
        `INSERT INTO institutions 
         (user_id, denomination, congregation, address, neighborhood, municipality_id, type, edifice_state, property_type, latitude, longitude) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.id, denomination, congregation, address, neighborhood, municipality_id, type || 'Sede', edifice_state || 'Bueno', property_type || 'Alquilado', latitude, longitude]
      );

      res.status(201).json({ message: 'Institution created successfully.', id: result.lastID });
    } catch (err) {
      console.error('Error creating institution:', err);
      res.status(500).json({ message: 'Error creating institution.', error: err.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed.' });
  }
}
