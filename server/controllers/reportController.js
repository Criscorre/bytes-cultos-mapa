const { allQuery } = require('../config/database');

exports.exportInstitutions = async (req, res) => {
  const { format } = req.query; // 'csv' or 'excel'

  try {
    const query = `
      SELECT i.denomination, i.congregation, i.type, i.neighborhood, i.address, 
             i.rnc_number, i.legal_person_number, i.public_welfare_number, 
             i.edifice_state, i.property_type, i.avg_attendees, i.status,
             r.first_name || ' ' || r.last_name as responsible_name, r.dni as responsible_dni,
             r.personal_phone as responsible_phone, r.personal_email as responsible_email,
             sa.has_comedor, sa.has_roperia, sa.has_health_center, sa.has_food_distribution,
             sn.website, sn.instagram
      FROM institutions i
      LEFT JOIN responsibles r ON i.id = r.institution_id
      LEFT JOIN social_actions sa ON i.id = sa.institution_id
      LEFT JOIN social_networks sn ON i.id = sn.institution_id
      WHERE i.municipality_id = 1
    `;

    const rows = await allQuery(query);

    let filename = `reporte_instituciones_${Date.now()}`;
    let delimiter = ',';
    let contentType = 'text/csv';

    if (format === 'excel') {
      delimiter = '\t';
      filename += '.xls';
      contentType = 'application/vnd.ms-excel';
    } else {
      filename += '.csv';
    }

    // Header row
    const headers = [
      'Denominación', 'Congregación', 'Tipo', 'Barrio', 'Dirección',
      'Matrícula RNC', 'Personería Jurídica', 'Entidad Bien Público',
      'Estado Edilicio', 'Inmueble', 'Asistentes Promedio', 'Estado de Aprobación',
      'Responsable', 'DNI Responsable', 'Teléfono Contacto', 'Email Contacto',
      'Comedor', 'Ropería', 'Centro de Salud', 'Entrega Alimentos',
      'Sitio Web', 'Instagram'
    ];

    let fileContent = '';
    
    // Add UTF-8 BOM so Excel reads Spanish accents properly
    if (format === 'excel' || format === 'csv') {
      fileContent += '\ufeff'; 
    }

    fileContent += headers.join(delimiter) + '\n';

    rows.forEach(row => {
      const line = [
        row.denomination || '',
        row.congregation || '',
        row.type || '',
        row.neighborhood || '',
        row.address || '',
        row.rnc_number || '',
        row.legal_person_number || '',
        row.public_welfare_number || '',
        row.edifice_state || '',
        row.property_type || '',
        row.avg_attendees || 0,
        row.status || '',
        row.responsible_name || '',
        row.responsible_dni || '',
        row.responsible_phone || '',
        row.responsible_email || '',
        row.has_comedor ? 'SÍ' : 'NO',
        row.has_roperia ? 'SÍ' : 'NO',
        row.has_health_center ? 'SÍ' : 'NO',
        row.has_food_distribution ? 'SÍ' : 'NO',
        row.website || '',
        row.instagram || ''
      ];

      // Sanitize fields (remove inner quotes, escape commas/tabs)
      const sanitizedLine = line.map(field => {
        let str = String(field).replace(/"/g, '""');
        if (str.includes(delimiter) || str.includes('\n') || str.includes('"')) {
          str = `"${str}"`;
        }
        return str;
      });

      fileContent += sanitizedLine.join(delimiter) + '\n';
    });

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(fileContent);

  } catch (err) {
    console.error('Error generating CSV/Excel export:', err);
    return res.status(500).json({ message: 'Error al exportar reporte.' });
  }
};

exports.exportSocialActions = async (req, res) => {
  try {
    const query = `
      SELECT i.denomination, i.congregation, i.neighborhood, i.address,
             sa.has_comedor, sa.has_roperia, sa.has_health_center, 
             sa.has_food_distribution, sa.has_medicine_distribution, sa.has_other,
             sa.description as social_description,
             r.first_name || ' ' || r.last_name as responsible, r.personal_phone as phone
      FROM institutions i
      INNER JOIN social_actions sa ON i.id = sa.institution_id
      LEFT JOIN responsibles r ON i.id = r.institution_id
      WHERE i.status = 'approved' AND (sa.has_comedor = 1 OR sa.has_roperia = 1 OR sa.has_health_center = 1 OR sa.has_food_distribution = 1 OR sa.has_medicine_distribution = 1 OR sa.has_other = 1)
    `;

    const rows = await allQuery(query);
    
    let fileContent = '\ufeff'; 
    const headers = ['Denominación', 'Congregación', 'Barrio', 'Dirección', 'Comedor', 'Ropería', 'Centro Salud', 'Alimentos', 'Medicamentos', 'Otro', 'Descripción Acción Social', 'Responsable', 'Teléfono'];
    fileContent += headers.join(',') + '\n';

    rows.forEach(row => {
      const line = [
        row.denomination,
        row.congregation,
        row.neighborhood,
        row.address,
        row.has_comedor ? 'SÍ' : 'NO',
        row.has_roperia ? 'SÍ' : 'NO',
        row.has_health_center ? 'SÍ' : 'NO',
        row.has_food_distribution ? 'SÍ' : 'NO',
        row.has_medicine_distribution ? 'SÍ' : 'NO',
        row.has_other ? 'SÍ' : 'NO',
        row.social_description || '',
        row.responsible || '',
        row.phone || ''
      ];

      const sanitizedLine = line.map(field => {
        let str = String(field).replace(/"/g, '""');
        if (str.includes(',') || str.includes('\n') || str.includes('"')) {
          str = `"${str}"`;
        }
        return str;
      });

      fileContent += sanitizedLine.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_accion_social_${Date.now()}.csv"`);
    return res.send(fileContent);

  } catch (err) {
    console.error('Error generating social action report:', err);
    return res.status(500).json({ message: 'Error al generar reporte de acción social.' });
  }
};
