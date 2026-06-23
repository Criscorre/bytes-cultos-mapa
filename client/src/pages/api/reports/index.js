import jwt from 'jsonwebtoken';
import { runQuery, allQuery } from '@/lib/database';

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
  const user = verifyToken(req);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  if (req.method === 'GET') {
    try {
      let reports;
      if (user.role === 'admin' || user.role === 'superadmin') {
        reports = await allQuery(`
          SELECT r.*, i.congregation
          FROM reports r
          LEFT JOIN institutions i ON r.institution_id = i.id
          ORDER BY r.created_at DESC
        `);
      } else {
        reports = await allQuery(`
          SELECT r.*, i.congregation
          FROM reports r
          LEFT JOIN institutions i ON r.institution_id = i.id
          WHERE i.user_id = ?
          ORDER BY r.created_at DESC
        `, [user.id]);
      }

      res.status(200).json(reports);
    } catch (err) {
      console.error('Error fetching reports:', err);
      res.status(500).json({ message: 'Error fetching reports.', error: err.message });
    }
  } else if (req.method === 'POST') {
    try {
      const { institution_id, report_type, data } = req.body;

      if (!institution_id || !report_type) {
        return res.status(400).json({ message: 'Missing required fields.' });
      }

      const result = await runQuery(
        `INSERT INTO reports (institution_id, report_type, data) VALUES (?, ?, ?)`,
        [institution_id, report_type, JSON.stringify(data)]
      );

      res.status(201).json({ message: 'Report created successfully.', id: result.lastID });
    } catch (err) {
      console.error('Error creating report:', err);
      res.status(500).json({ message: 'Error creating report.', error: err.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed.' });
  }
}
