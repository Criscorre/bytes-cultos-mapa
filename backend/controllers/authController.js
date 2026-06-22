const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { runQuery, getQuery, allQuery } = require('../config/database');
const admin = require('../firebaseAdmin');

const JWT_SECRET = process.env.JWT_SECRET || 'cultosig_secret_key_2026';

exports.register = async (req, res) => {
  const { email, password, denomination, congregation, address, neighborhood, type, edifice_state, property_type, municipality_id } = req.body;

  if (!email || !password || !denomination || !congregation || !address || !neighborhood) {
    return res.status(400).json({ message: 'Todos los campos obligatorios deben ser completados.' });
  }

  try {
    if (!admin || !admin.auth) {
      return res.status(500).json({ message: 'Firebase Admin no está inicializado.' });
    }

    // Use selected municipality or fallback to Jose C. Paz (1)
    const municipalityId = municipality_id ? parseInt(municipality_id) : 1;

    // Check if user already exists in Firestore
    const firestore = admin.firestore();
    const usersRef = firestore.collection('users');
    const existing = await usersRef.where('email', '==', email).limit(1).get();
    if (!existing.empty) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
    }

    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({ email, password });
    const uid = userRecord.uid;

    // Save user document in Firestore
    await usersRef.doc(uid).set({
      email,
      role: 'institution',
      municipality_id: municipalityId,
      approved: 0,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create institution document
    const institutionsRef = firestore.collection('institutions');
    const instDoc = await institutionsRef.add({
      user_uid: uid,
      municipality_id: municipalityId,
      denomination,
      congregation,
      start_date: null,
      type: type || 'Sede',
      address,
      postal_address: null,
      rnc_number: null,
      legal_person_number: null,
      public_welfare_number: null,
      edifice_state: edifice_state || 'Bueno',
      property_type: property_type || 'Alquilado',
      covered_area: null,
      avg_attendees: null,
      meeting_days: null,
      meeting_hours: null,
      other_activities: null,
      status: 'pending',
      latitude: -34.515,
      longitude: -58.768,
      neighborhood,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create related blank documents
    await firestore.collection('responsibles').add({ institution_id: instDoc.id, first_name: 'Por completar', last_name: 'Por completar', dni: '0', role: 'Pastor' });
    await firestore.collection('social_actions').add({ institution_id: instDoc.id });
    await firestore.collection('social_networks').add({ institution_id: instDoc.id });

    // Create a custom token to let frontend sign in if desired
    // Set custom claims for role and municipality
    await admin.auth().setCustomUserClaims(uid, { role: 'institution', municipality_id: municipalityId });
    const customToken = await admin.auth().createCustomToken(uid, { role: 'institution', municipality_id: municipalityId });

    return res.status(201).json({ message: 'Institución registrada con éxito. Pendiente de aprobación.', uid, customToken });

  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Error interno del servidor al registrar.' });
  }
};

exports.login = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: 'idToken es requerido.' });
  }

  try {
    if (!admin || !admin.auth) {
      return res.status(500).json({ message: 'Firebase Admin no está inicializado.' });
    }

    const decoded = await admin.auth().verifyIdToken(idToken);

    // Fetch user document from Firestore
    const firestore = admin.firestore();
    const userDoc = await firestore.collection('users').doc(decoded.uid).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    let institution = null;
    if (userData && userData.role === 'institution') {
      const instSnap = await firestore.collection('institutions').where('user_uid', '==', decoded.uid).limit(1).get();
      if (!instSnap.empty) {
        const inst = instSnap.docs[0];
        institution = { id: inst.id, ...inst.data() };
      }
    }

    return res.json({
      user: Object.assign({ uid: decoded.uid, email: decoded.email }, userData),
      institution
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Error interno del servidor al verificar token.' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await getQuery('SELECT id, email, role, municipality_id, approved, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    let institution = null;
    if (user.role === 'institution') {
      institution = await getQuery('SELECT * FROM institutions WHERE user_id = ?', [user.id]);
      if (institution) {
        // Fetch sub-details
        const resp = await getQuery('SELECT * FROM responsibles WHERE institution_id = ?', [institution.id]);
        const sa = await getQuery('SELECT * FROM social_actions WHERE institution_id = ?', [institution.id]);
        const sn = await getQuery('SELECT * FROM social_networks WHERE institution_id = ?', [institution.id]);
        const photos = await getQuery('SELECT * FROM photos WHERE institution_id = ?', [institution.id]);

        institution.responsible = resp;
        institution.socialActions = sa;
        institution.socialNetworks = sn;
        institution.photos = photos;
      }
    }

    return res.json({
      user,
      institution
    });

  } catch (err) {
    console.error('GetMe error:', err);
    return res.status(500).json({ message: 'Error al consultar datos de sesión.' });
  }
};

exports.registerAdmin = async (req, res) => {
  try {
    const { email, password, municipality_id } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y password son requeridos.' });
    }

    if (!admin || !admin.auth || !admin.firestore) {
      return res.status(500).json({ message: 'Firebase Admin no está inicializado.' });
    }

    // Create Firebase Auth user for admin
    const userRecord = await admin.auth().createUser({ email, password });
    const uid = userRecord.uid;

    // Set custom claims
    await admin.auth().setCustomUserClaims(uid, { role: 'admin', municipality_id: municipality_id || null });

    // Create Firestore user document
    const firestore = admin.firestore();
    await firestore.collection('users').doc(uid).set({
      email,
      role: 'admin',
      municipality_id: municipality_id || null,
      approved: 1,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(201).json({ message: 'Administrador creado correctamente.', uid });
  } catch (err) {
    console.error('Register admin error:', err);
    return res.status(500).json({ message: 'Error interno al registrar el administrador.' });
  }
};

exports.getAdmins = async (req, res) => {
  try {
    // If Firebase available, fetch admins from Firestore
    if (admin && admin.firestore) {
      const firestore = admin.firestore();
      const adminsSnap = await firestore.collection('users').where('role', '==', 'admin').get();
      const admins = adminsSnap.docs.map(d => ({ uid: d.id, ...d.data() }));
      return res.json(admins);
    }

    const admins = await allQuery(`
      SELECT u.id, u.email, u.created_at, m.name as municipality_name
      FROM users u
      INNER JOIN municipalities m ON u.municipality_id = m.id
      WHERE u.role = 'admin'
    `);
    return res.json(admins);
  } catch (err) {
    console.error('Error fetching admins:', err);
    return res.status(500).json({ message: 'Error al consultar administradores.' });
  }
};
