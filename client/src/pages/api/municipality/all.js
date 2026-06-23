import { allQuery } from '@/lib/database';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const municipalities = await allQuery('SELECT id, name, province, center_lat, center_lng FROM municipalities ORDER BY name');
      res.status(200).json(municipalities);
    } catch (err) {
      console.error('Error fetching municipalities:', err);
      res.status(500).json({ message: 'Error fetching municipalities.', error: err.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed.' });
  }
}
