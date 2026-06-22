const { runQuery, getQuery, allQuery } = require('../config/database');

// Public List (Approved only, public fields only)
exports.getPublicList = async (req, res) => {
  try {
    const query = `
      SELECT i.*, 
             sa.has_comedor, sa.has_roperia, sa.has_health_center, sa.has_food_distribution, 
             sa.has_medicine_distribution, sa.has_other, sa.description as social_description,
             sn.website, sn.facebook, sn.instagram, sn.youtube, sn.tiktok, sn.institutional_whatsapp,
             r.first_name as resp_first_name, r.last_name as resp_last_name, r.role as resp_role
      FROM institutions i
      LEFT JOIN social_actions sa ON i.id = sa.institution_id
      LEFT JOIN social_networks sn ON i.id = sn.institution_id
      LEFT JOIN responsibles r ON i.id = r.institution_id
      WHERE i.status = 'approved' AND i.municipality_id = 1
    `;
    const institutions = await allQuery(query);

    // Fetch photos for each institution
    for (let inst of institutions) {
      inst.photos = await allQuery('SELECT id, type, url FROM photos WHERE institution_id = ?', [inst.id]);
    }

    return res.json(institutions);
  } catch (err) {
    console.error('Error fetching public list:', err);
    return res.status(500).json({ message: 'Error al obtener el listado público.' });
  }
};

// Public Detail
exports.getPublicDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT i.*, 
             sa.has_comedor, sa.has_roperia, sa.has_health_center, sa.has_food_distribution, 
             sa.has_medicine_distribution, sa.has_other, sa.description as social_description,
             sn.website, sn.facebook, sn.instagram, sn.youtube, sn.tiktok, sn.institutional_whatsapp,
             r.first_name as resp_first_name, r.last_name as resp_last_name, r.role as resp_role
      FROM institutions i
      LEFT JOIN social_actions sa ON i.id = sa.institution_id
      LEFT JOIN social_networks sn ON i.id = sn.institution_id
      LEFT JOIN responsibles r ON i.id = r.institution_id
      WHERE i.id = ? AND i.status = 'approved'
    `;
    const inst = await getQuery(query, [id]);
    if (!inst) {
      return res.status(404).json({ message: 'Institución no encontrada o no aprobada.' });
    }

    inst.photos = await allQuery('SELECT id, type, url FROM photos WHERE institution_id = ?', [inst.id]);

    return res.json(inst);
  } catch (err) {
    console.error('Error fetching public detail:', err);
    return res.status(500).json({ message: 'Error al obtener detalle de la institución.' });
  }
};

// Admin List (All status, includes private details)
exports.getAdminList = async (req, res) => {
  try {
    const query = `
      SELECT i.*, 
             sa.has_comedor, sa.has_roperia, sa.has_health_center, sa.has_food_distribution, 
             sa.has_medicine_distribution, sa.has_other, sa.description as social_description,
             sn.website, sn.facebook, sn.instagram, sn.youtube, sn.tiktok, sn.institutional_whatsapp,
             r.first_name as resp_first_name, r.last_name as resp_last_name, r.role as resp_role,
             r.dni as resp_dni, r.personal_phone as resp_personal_phone, r.personal_email as resp_personal_email,
             r.home_address as resp_home_address, r.birth_date as resp_birth_date,
             r.civil_activity as resp_civil_activity, r.education as resp_education,
             r.theological_studies as resp_theological_studies, r.formation_institution as resp_formation_institution,
             r.study_years as resp_study_years
      FROM institutions i
      LEFT JOIN social_actions sa ON i.id = sa.institution_id
      LEFT JOIN social_networks sn ON i.id = sn.institution_id
      LEFT JOIN responsibles r ON i.id = r.institution_id
      WHERE i.municipality_id = 1
    `;
    const institutions = await allQuery(query);

    for (let inst of institutions) {
      inst.photos = await allQuery('SELECT id, type, url FROM photos WHERE institution_id = ?', [inst.id]);
      inst.contactHistories = await allQuery('SELECT * FROM contact_histories WHERE institution_id = ? ORDER BY contact_date DESC', [inst.id]);
    }

    return res.json(institutions);
  } catch (err) {
    console.error('Error fetching admin list:', err);
    return res.status(500).json({ message: 'Error al obtener el listado administrativo.' });
  }
};

// Admin Detail
exports.getAdminDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT i.*, 
             sa.has_comedor, sa.has_roperia, sa.has_health_center, sa.has_food_distribution, 
             sa.has_medicine_distribution, sa.has_other, sa.description as social_description,
             sn.website, sn.facebook, sn.instagram, sn.youtube, sn.tiktok, sn.institutional_whatsapp,
             r.first_name as resp_first_name, r.last_name as resp_last_name, r.role as resp_role,
             r.dni as resp_dni, r.personal_phone as resp_personal_phone, r.personal_email as resp_personal_email,
             r.home_address as resp_home_address, r.birth_date as resp_birth_date,
             r.civil_activity as resp_civil_activity, r.education as resp_education,
             r.theological_studies as resp_theological_studies, r.formation_institution as resp_formation_institution,
             r.study_years as resp_study_years
      FROM institutions i
      LEFT JOIN social_actions sa ON i.id = sa.institution_id
      LEFT JOIN social_networks sn ON i.id = sn.institution_id
      LEFT JOIN responsibles r ON i.id = r.institution_id
      WHERE i.id = ?
    `;
    const inst = await getQuery(query, [id]);
    if (!inst) {
      return res.status(404).json({ message: 'Institución no encontrada.' });
    }

    inst.photos = await allQuery('SELECT id, type, url FROM photos WHERE institution_id = ?', [inst.id]);
    inst.contactHistories = await allQuery('SELECT * FROM contact_histories WHERE institution_id = ? ORDER BY contact_date DESC', [inst.id]);

    return res.json(inst);
  } catch (err) {
    console.error('Error fetching admin detail:', err);
    return res.status(500).json({ message: 'Error al obtener detalle administrativo.' });
  }
};

// Update Institution (For institution user updating their own profile, or admin updating it)
exports.update = async (req, res) => {
  const { id } = req.params;
  const {
    denomination, congregation, start_date, type, address, postal_address,
    rnc_number, legal_person_number, public_welfare_number, edifice_state,
    property_type, covered_area, avg_attendees, meeting_days, meeting_hours,
    other_activities, latitude, longitude, neighborhood,
    // Responsible
    resp_first_name, resp_last_name, resp_dni, resp_role, resp_birth_date,
    resp_civil_activity, resp_education, resp_theological_studies,
    resp_formation_institution, resp_study_years, resp_home_address,
    resp_personal_phone, resp_personal_email,
    // Social actions
    has_comedor, has_roperia, has_health_center, has_food_distribution,
    has_medicine_distribution, has_other, social_description,
    // Networks
    website, facebook, instagram, youtube, tiktok, institutional_whatsapp,
    // Photos to delete/add
    photos
  } = req.body;

  try {
    // Permission check: if institution user, check they own this institution
    if (req.user.role === 'institution') {
      const owned = await getQuery('SELECT id FROM institutions WHERE id = ? AND user_id = ?', [id, req.user.id]);
      if (!owned) {
        return res.status(403).json({ message: 'No tienes permiso para actualizar esta institución.' });
      }
    }

    // 1. Update main institutions table
    await runQuery(`
      UPDATE institutions
      SET denomination = ?, congregation = ?, start_date = ?, type = ?, address = ?, postal_address = ?,
          rnc_number = ?, legal_person_number = ?, public_welfare_number = ?, edifice_state = ?,
          property_type = ?, covered_area = ?, avg_attendees = ?, meeting_days = ?, meeting_hours = ?,
          other_activities = ?, latitude = ?, longitude = ?, neighborhood = ?,
          status = CASE WHEN ? = 'admin' THEN status ELSE 'pending' END -- Reset to pending on institution update
      WHERE id = ?
    `, [
      denomination, congregation, start_date, type, address, postal_address,
      rnc_number, legal_person_number, public_welfare_number, edifice_state,
      property_type, covered_area, avg_attendees, meeting_days, meeting_hours,
      other_activities, latitude, longitude, neighborhood,
      req.user.role,
      id
    ]);

    // 2. Update responsibles table
    await runQuery(`
      UPDATE responsibles
      SET first_name = ?, last_name = ?, dni = ?, role = ?, birth_date = ?, civil_activity = ?,
          education = ?, theological_studies = ?, formation_institution = ?, study_years = ?,
          home_address = ?, personal_phone = ?, personal_email = ?
      WHERE institution_id = ?
    `, [
      resp_first_name, resp_last_name, resp_dni, resp_role, resp_birth_date,
      resp_civil_activity, resp_education, resp_theological_studies,
      resp_formation_institution, resp_study_years, resp_home_address,
      resp_personal_phone, resp_personal_email,
      id
    ]);

    // 3. Update social_actions table
    await runQuery(`
      UPDATE social_actions
      SET has_comedor = ?, has_roperia = ?, has_health_center = ?, has_food_distribution = ?,
          has_medicine_distribution = ?, has_other = ?, description = ?
      WHERE institution_id = ?
    `, [
      has_comedor ? 1 : 0, has_roperia ? 1 : 0, has_health_center ? 1 : 0, has_food_distribution ? 1 : 0,
      has_medicine_distribution ? 1 : 0, has_other ? 1 : 0, social_description,
      id
    ]);

    // 4. Update social_networks table
    await runQuery(`
      UPDATE social_networks
      SET website = ?, facebook = ?, instagram = ?, youtube = ?, tiktok = ?, institutional_whatsapp = ?
      WHERE institution_id = ?
    `, [
      website, facebook, instagram, youtube, tiktok, institutional_whatsapp,
      id
    ]);

    // 5. Handle Photos if supplied
    if (photos && Array.isArray(photos)) {
      // Clear existing photos for simple sync or add
      // In MVP, we can overwrite or append. Let's do a sync: delete photos and re-insert
      await runQuery('DELETE FROM photos WHERE institution_id = ?', [id]);
      for (let photo of photos) {
        if (photo.url) {
          await runQuery('INSERT INTO photos (institution_id, type, url) VALUES (?, ?, ?)', [id, photo.type, photo.url]);
        }
      }
    }

    return res.json({ message: 'Información institucional actualizada correctamente.' });
  } catch (err) {
    console.error('Error updating institution:', err);
    return res.status(500).json({ message: 'Error al actualizar la información.' });
  }
};

// Admin approves/rejects/requests correction
exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status, status_note } = req.body;

  if (!['approved', 'rejected', 'correction', 'pending'].includes(status)) {
    return res.status(400).json({ message: 'Estado inválido.' });
  }

  try {
    await runQuery('UPDATE institutions SET status = ?, status_note = ? WHERE id = ?', [status, status_note, id]);

    // If status is approved, make sure user approved field is updated too
    const inst = await getQuery('SELECT user_id FROM institutions WHERE id = ?', [id]);
    if (inst && inst.user_id) {
      await runQuery('UPDATE users SET approved = ? WHERE id = ?', [status === 'approved' ? 1 : 0, inst.user_id]);
    }

    // Add automatic contact history log
    const statusText = status === 'approved' ? 'Aprobado' : status === 'rejected' ? 'Rechazado' : 'Solicitud de Corrección';
    await runQuery(`
      INSERT INTO contact_histories (institution_id, admin_user_id, contact_date, summary, notes)
      VALUES (?, ?, datetime('now', 'localtime'), ?, ?)
    `, [id, req.user.id, `Cambio de Estado: ${statusText}`, status_note || `El administrador cambió el estado a ${statusText}`]);

    return res.json({ message: `Estado actualizado a ${statusText} exitosamente.` });
  } catch (err) {
    console.error('Error updating status:', err);
    return res.status(500).json({ message: 'Error al actualizar el estado de aprobación.' });
  }
};

// Add Admin Contact Note
exports.addContactHistory = async (req, res) => {
  const { id } = req.params;
  const { summary, notes } = req.body;

  if (!summary) {
    return res.status(400).json({ message: 'El resumen de contacto es obligatorio.' });
  }

  try {
    await runQuery(`
      INSERT INTO contact_histories (institution_id, admin_user_id, contact_date, summary, notes)
      VALUES (?, ?, datetime('now', 'localtime'), ?, ?)
    `, [id, req.user.id, summary, notes]);

    return res.status(201).json({ message: 'Historial de contacto registrado correctamente.' });
  } catch (err) {
    console.error('Error adding contact history:', err);
    return res.status(500).json({ message: 'Error al registrar el historial de contacto.' });
  }
};

// Delete Institution
exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    const inst = await getQuery('SELECT user_id FROM institutions WHERE id = ?', [id]);
    if (!inst) {
      return res.status(404).json({ message: 'Institución no encontrada.' });
    }

    // Delete user (will cascade delete institution, responsibles, etc. because of foreign key triggers)
    if (inst.user_id) {
      await runQuery('DELETE FROM users WHERE id = ?', [inst.user_id]);
    } else {
      // If no user associated (seeded data), delete institution directly
      await runQuery('DELETE FROM institutions WHERE id = ?', [id]);
    }

    return res.json({ message: 'Institución y registros asociados eliminados con éxito.' });
  } catch (err) {
    console.error('Error deleting institution:', err);
    return res.status(500).json({ message: 'Error al eliminar la institución.' });
  }
};
