const { getQuery, allQuery } = require('../config/database');

exports.getMetadata = async (req, res) => {
  try {
    const mun = await getQuery('SELECT * FROM municipalities WHERE id = 1');
    if (!mun) {
      return res.status(404).json({ message: 'Municipio no configurado.' });
    }
    return res.json(mun);
  } catch (err) {
    console.error('Error fetching municipality metadata:', err);
    return res.status(500).json({ message: 'Error al consultar metadatos del municipio.' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const municipalityId = (req.user.role === 'superadmin' && req.query.municipality_id)
      ? parseInt(req.query.municipality_id)
      : (req.user.municipality_id || 1);

    // 1. General Metrics
    const totalCount = await getQuery('SELECT COUNT(*) as count FROM institutions WHERE status = "approved" AND municipality_id = ?', [municipalityId]);
    
    // Temples/Capillas/Organizaciones counts
    const temples = await getQuery('SELECT COUNT(*) as count FROM institutions WHERE status = "approved" AND municipality_id = ? AND (denomination LIKE "%Evangélica%" OR denomination LIKE "%Pentecostal%" OR denomination LIKE "%Bautista%")', [municipalityId]);
    const chapels = await getQuery('SELECT COUNT(*) as count FROM institutions WHERE status = "approved" AND municipality_id = ? AND (denomination LIKE "%Católica%")', [municipalityId]);
    const others = await getQuery('SELECT COUNT(*) as count FROM institutions WHERE status = "approved" AND municipality_id = ? AND (denomination NOT LIKE "%Católica%" AND denomination NOT LIKE "%Evangélica%" AND denomination NOT LIKE "%Pentecostal%" AND denomination NOT LIKE "%Bautista%")', [municipalityId]);

    // Pending institutions count
    const pendingCount = await getQuery('SELECT COUNT(*) as count FROM institutions WHERE status = "pending" AND municipality_id = ?', [municipalityId]);

    // 2. Institutions by Neighborhood
    const byNeighborhood = await allQuery(`
      SELECT neighborhood as name, COUNT(*) as value 
      FROM institutions 
      WHERE status = "approved" AND municipality_id = ?
      GROUP BY neighborhood
      ORDER BY value DESC
    `, [municipalityId]);

    // 3. Institutions by Denomination
    const byDenomination = await allQuery(`
      SELECT denomination as name, COUNT(*) as value 
      FROM institutions 
      WHERE status = "approved" AND municipality_id = ?
      GROUP BY denomination
      ORDER BY value DESC
    `, [municipalityId]);

    // 4. Monthly Signups (Evolución histórica)
    const monthlySignups = await allQuery(`
      SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
      FROM institutions
      WHERE status = "approved" AND municipality_id = ?
      GROUP BY month
      ORDER BY month ASC
    `, [municipalityId]);

    // 5. Heatmap data (approved institutions coordinates and attendee weight)
    const heatmapPoints = await allQuery(`
      SELECT latitude, longitude, avg_attendees as weight 
      FROM institutions 
      WHERE status = "approved" AND municipality_id = ?
    `, [municipalityId]);

    // Map weights to avoid empty/null weights
    const parsedHeatmap = heatmapPoints.map(p => ({
      lat: p.latitude,
      lng: p.longitude,
      weight: p.weight || 20 // Default weight
    }));

    return res.json({
      metrics: {
        total: totalCount.count,
        temples: temples.count,
        chapels: chapels.count,
        organizations: others.count,
        pending: pendingCount.count
      },
      byNeighborhood,
      byDenomination,
      monthlySignups,
      heatmap: parsedHeatmap
    });

  } catch (err) {
    console.error('Error calculating statistics:', err);
    return res.status(500).json({ message: 'Error al generar estadísticas del panel.' });
  }
};

exports.create = async (req, res) => {
  const { name, province, center_lat, center_lng, zoom_level } = req.body;

  if (!name || !province || !center_lat || !center_lng || !zoom_level) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  try {
    const boundaryGeojson = JSON.stringify({
      type: "Polygon",
      coordinates: [[
        [center_lng - 0.08, center_lat - 0.03],
        [center_lng + 0.08, center_lat - 0.03],
        [center_lng + 0.08, center_lat + 0.035],
        [center_lng - 0.08, center_lat + 0.035],
        [center_lng - 0.08, center_lat - 0.03]
      ]]
    });

    const result = await runQuery(`
      INSERT INTO municipalities (name, province, logo_url, center_lat, center_lng, zoom_level, boundary_geojson)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      name, 
      province, 
      '/assets/logo-generic.png', 
      parseFloat(center_lat), 
      parseFloat(center_lng), 
      parseInt(zoom_level), 
      boundaryGeojson
    ]);

    return res.status(201).json({ message: 'Municipio registrado exitosamente.', id: result.lastID });
  } catch (err) {
    console.error('Error creating municipality:', err);
    return res.status(500).json({ message: 'Error interno al registrar municipio.' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const municipalities = await allQuery('SELECT * FROM municipalities ORDER BY name ASC');
    return res.json(municipalities);
  } catch (err) {
    console.error('Error fetching municipalities:', err);
    return res.status(500).json({ message: 'Error al obtener municipios.' });
  }
};
