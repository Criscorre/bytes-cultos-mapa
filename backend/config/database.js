const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to SQLite database at', dbPath);
    initializeDatabase();
  }
});

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function initializeDatabase() {
  try {
    // Enable foreign keys
    await runQuery('PRAGMA foreign_keys = ON;');

    // 1. Municipalities Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS municipalities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        province TEXT NOT NULL,
        logo_url TEXT,
        center_lat REAL NOT NULL,
        center_lng REAL NOT NULL,
        zoom_level INTEGER NOT NULL,
        boundary_geojson TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Users Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT CHECK(role IN ('superadmin', 'admin', 'institution', 'public')) NOT NULL,
        municipality_id INTEGER,
        approved INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (municipality_id) REFERENCES municipalities(id) ON DELETE SET NULL
      )
    `);

    // 3. Institutions Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS institutions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE,
        municipality_id INTEGER NOT NULL,
        denomination TEXT NOT NULL,
        congregation TEXT NOT NULL,
        start_date TEXT,
        type TEXT CHECK(type IN ('Sede', 'Filial', 'Anexo')) NOT NULL,
        address TEXT NOT NULL,
        postal_address TEXT,
        rnc_number TEXT,
        legal_person_number TEXT,
        public_welfare_number TEXT,
        edifice_state TEXT CHECK(edifice_state IN ('Precario', 'Bueno', 'Excelente')) NOT NULL,
        property_type TEXT CHECK(property_type IN ('Propio', 'Alquilado', 'Casa de familia')) NOT NULL,
        covered_area REAL,
        avg_attendees INTEGER,
        meeting_days TEXT,
        meeting_hours TEXT,
        other_activities TEXT,
        status TEXT CHECK(status IN ('pending', 'approved', 'rejected', 'correction')) DEFAULT 'pending',
        status_note TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        neighborhood TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (municipality_id) REFERENCES municipalities(id) ON DELETE CASCADE
      )
    `);

    // 4. Responsibles Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS responsibles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        institution_id INTEGER UNIQUE NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        dni TEXT NOT NULL,
        role TEXT NOT NULL,
        birth_date TEXT,
        civil_activity TEXT,
        education TEXT,
        theological_studies TEXT,
        formation_institution TEXT,
        study_years INTEGER,
        home_address TEXT,
        personal_phone TEXT,
        personal_email TEXT,
        FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
      )
    `);

    // 5. Social Actions Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS social_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        institution_id INTEGER UNIQUE NOT NULL,
        has_comedor INTEGER DEFAULT 0,
        has_roperia INTEGER DEFAULT 0,
        has_health_center INTEGER DEFAULT 0,
        has_food_distribution INTEGER DEFAULT 0,
        has_medicine_distribution INTEGER DEFAULT 0,
        has_other INTEGER DEFAULT 0,
        description TEXT,
        FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
      )
    `);

    // 6. Social Networks Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS social_networks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        institution_id INTEGER UNIQUE NOT NULL,
        website TEXT,
        facebook TEXT,
        instagram TEXT,
        youtube TEXT,
        tiktok TEXT,
        institutional_whatsapp TEXT,
        FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
      )
    `);

    // 7. Photos Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        institution_id INTEGER NOT NULL,
        type TEXT CHECK(type IN ('fachada', 'interior', 'actividades', 'eventos', 'accion_social', 'logo')) NOT NULL,
        url TEXT NOT NULL,
        public_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
      )
    `);

    // 8. Contact Histories Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS contact_histories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        institution_id INTEGER NOT NULL,
        admin_user_id INTEGER NOT NULL,
        contact_date TEXT NOT NULL,
        summary TEXT NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
        FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('All database tables initialized successfully.');
    await seedData();

  } catch (err) {
    console.error('Error initializing database tables', err);
  }
}

async function seedData() {
  try {
    // Check if municipality already seeded
    const mCount = await getQuery('SELECT COUNT(*) as count FROM municipalities');
    if (mCount.count > 0) {
      console.log('Database already seeded. Skipping seed process.');
      return;
    }

    console.log('Seeding initial database data...');

    // 1. Seed Municipality (José C. Paz)
    // Approximate coordinate box for José C. Paz bounds
    const jcPazBoundary = JSON.stringify({
      type: "Polygon",
      coordinates: [[
        [-58.810, -34.545],
        [-58.730, -34.545],
        [-58.730, -34.480],
        [-58.810, -34.480],
        [-58.810, -34.545]
      ]]
    });

    await runQuery(`
      INSERT INTO municipalities (name, province, logo_url, center_lat, center_lng, zoom_level, boundary_geojson)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      'José C. Paz',
      'Buenos Aires',
      '/assets/logo-jc-paz.png',
      -34.515,
      -58.768,
      13,
      jcPazBoundary
    ]);

    const jcPazId = 1;

    // 2. Seed Users
    const salt = await bcrypt.genSalt(10);
    const superadminPass = await bcrypt.hash('superadmin123', salt);
    const adminPass = await bcrypt.hash('cultojcpaz', salt);
    const churchPass1 = await bcrypt.hash('iglesia123', salt);
    const churchPass2 = await bcrypt.hash('iglesia456', salt);

    await runQuery(`
      INSERT INTO users (email, password_hash, role, municipality_id, approved)
      VALUES (?, ?, 'superadmin', NULL, 1)
    `, ['superadmin@bytescreativos.com.ar', superadminPass]);

    await runQuery(`
      INSERT INTO users (email, password_hash, role, municipality_id, approved)
      VALUES (?, ?, 'admin', ?, 1)
    `, ['culto@josecpaz.gob.ar', adminPass, jcPazId]);

    // Church User 1
    await runQuery(`
      INSERT INTO users (email, password_hash, role, municipality_id, approved)
      VALUES (?, ?, 'institution', ?, 1)
    `, ['pastor.sarmiento@gmail.com', churchPass1, jcPazId]);

    // Church User 2
    await runQuery(`
      INSERT INTO users (email, password_hash, role, municipality_id, approved)
      VALUES (?, ?, 'institution', ?, 1)
    `, ['capilla.alberdi@gmail.com', churchPass2, jcPazId]);

    // 3. Seed Institutions
    // Institution 1 (Pentecostal in Sarmiento - Approved)
    await runQuery(`
      INSERT INTO institutions (
        user_id, municipality_id, denomination, congregation, start_date, type, address, postal_address,
        rnc_number, legal_person_number, public_welfare_number, edifice_state, property_type, covered_area,
        avg_attendees, meeting_days, meeting_hours, other_activities, status, latitude, longitude, neighborhood
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      3, jcPazId, 'Pentecostal (Asambleas de Dios)', 'Templo Evangélico Filadelfia', '2010-05-15', 'Sede',
      'Av. Presidente Hipólito Yrigoyen 2850', '1665', 'RNC-4521', 'PJ-9872/12', 'EBP-344', 'Excelente', 'Propio',
      250, 120, 'Martes, Jueves, Domingo', '19:00, 19:30, 18:00', 'Apoyo escolar para niños del barrio', 'approved',
      -34.5123, -58.7654, 'Sarmiento'
    ]);

    // Institution 2 (Catholic in Alberdi - Approved)
    await runQuery(`
      INSERT INTO institutions (
        user_id, municipality_id, denomination, congregation, start_date, type, address, postal_address,
        rnc_number, legal_person_number, public_welfare_number, edifice_state, property_type, covered_area,
        avg_attendees, meeting_days, meeting_hours, other_activities, status, latitude, longitude, neighborhood
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      4, jcPazId, 'Católica Apostólica Romana', 'Parroquia San José Obrero', '1995-03-19', 'Sede',
      'Roque Sáenz Peña 1450', '1665', 'RNC-0012', 'PJ-0015/65', 'EBP-010', 'Bueno', 'Propio',
      450, 300, 'Sábado, Domingo', '19:00, 10:00, 19:00', 'Cursos de oficios rápidos y carpintería', 'approved',
      -34.5201, -58.7720, 'Alberdi'
    ]);

    // Institution 3 (Pentecostal in Sol y Verde - Pending, no user associated directly yet or signed up recently)
    await runQuery(`
      INSERT INTO institutions (
        user_id, municipality_id, denomination, congregation, start_date, type, address, postal_address,
        rnc_number, legal_person_number, public_welfare_number, edifice_state, property_type, covered_area,
        avg_attendees, meeting_days, meeting_hours, other_activities, status, latitude, longitude, neighborhood
      ) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      jcPazId, 'Pentecostal (Movimiento Cristiano y Misionero)', 'Iglesia de Dios Altísimo', '2018-09-01', 'Filial',
      'Dinamarca 4100', '1665', 'RNC-8933', 'PJ-4532/19', 'EBP-501', 'Precario', 'Alquilado',
      80, 45, 'Miércoles, Sábado', '18:00, 19:30', 'Ninguna', 'pending',
      -34.5025, -58.7891, 'Sol y Verde'
    ]);

    // Institution 4 (Bautista in Sol y Verde - Approved)
    await runQuery(`
      INSERT INTO institutions (
        user_id, municipality_id, denomination, congregation, start_date, type, address, postal_address,
        rnc_number, legal_person_number, public_welfare_number, edifice_state, property_type, covered_area,
        avg_attendees, meeting_days, meeting_hours, other_activities, status, latitude, longitude, neighborhood
      ) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      jcPazId, 'Bautista', 'Iglesia Evangélica Bautista del Camino', '2005-11-20', 'Sede',
      'Finlay 3500', '1665', 'RNC-1234', 'PJ-1200/06', 'EBP-120', 'Bueno', 'Propio',
      150, 75, 'Domingo', '10:30', 'Distribución de ropa', 'approved',
      -34.5050, -58.7820, 'Sol y Verde'
    ]);

    // Institution 5 (Adventista in Barrio Frino - Approved)
    await runQuery(`
      INSERT INTO institutions (
        user_id, municipality_id, denomination, congregation, start_date, type, address, postal_address,
        rnc_number, legal_person_number, public_welfare_number, edifice_state, property_type, covered_area,
        avg_attendees, meeting_days, meeting_hours, other_activities, status, latitude, longitude, neighborhood
      ) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      jcPazId, 'Adventista del Séptimo Día', 'Templo Adventista Frino', '2015-06-12', 'Anexo',
      'Zuviría 5200', '1665', 'RNC-3042', 'PJ-9883/16', 'EBP-812', 'Bueno', 'Casa de familia',
      60, 30, 'Sábado', '09:00, 11:00', 'Club de Conquistadores (boy scouts cristianos)', 'approved',
      -34.5260, -58.7510, 'Barrio Frino'
    ]);

    // 4. Seed Responsibles
    await runQuery(`
      INSERT INTO responsibles (
        institution_id, first_name, last_name, dni, role, birth_date, civil_activity, education,
        theological_studies, formation_institution, study_years, home_address, personal_phone, personal_email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      1, 'Carlos', 'Giménez', '25.394.019', 'Pastor Principal', '1976-08-14', 'Carpintero', 'Secundario Completo',
      'Bachillerato en Teología', 'Seminario Bíblico de las Asambleas de Dios', 3, 'Muñoz 2341, José C. Paz',
      '11-5829-1029', 'carlos.gimenez@filadelfia.org'
    ]);

    await runQuery(`
      INSERT INTO responsibles (
        institution_id, first_name, last_name, dni, role, birth_date, civil_activity, education,
        theological_studies, formation_institution, study_years, home_address, personal_phone, personal_email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      2, 'Padre Eduardo', 'Sánchez', '18.490.122', 'Párroco', '1965-11-22', 'Sacerdote', 'Universitario Completo',
      'Licenciatura en Teología y Filosofía', 'Seminario Metropolitano de Buenos Aires', 8, 'Roque Sáenz Peña 1450, José C. Paz',
      '11-4560-9821', 'eduardo.sanchez@obispadosanmiguel.org.ar'
    ]);

    await runQuery(`
      INSERT INTO responsibles (
        institution_id, first_name, last_name, dni, role, birth_date, civil_activity, education,
        theological_studies, formation_institution, study_years, home_address, personal_phone, personal_email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      3, 'Esteban', 'Paredes', '30.129.493', 'Encargado de Filial', '1982-01-05', 'Electricista', 'Secundario Completo',
      'Curso Ministerial Básico', 'Instituto Misionero Evangélico', 1, 'Dinamarca 4120, José C. Paz',
      '11-3094-1184', 'esteban.paredes@outlook.com'
    ]);

    await runQuery(`
      INSERT INTO responsibles (
        institution_id, first_name, last_name, dni, role, birth_date, civil_activity, education,
        theological_studies, formation_institution, study_years, home_address, personal_phone, personal_email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      4, 'Roberto', 'Martínez', '22.842.112', 'Pastor', '1970-04-10', 'Administrativo', 'Universitario Incompleto',
      'Estudios Bíblicos Libres', 'Seminario Bautista Nacional', 2, 'Finlay 3512, José C. Paz',
      '11-9238-1122', 'roberto.m@gmail.com'
    ]);

    await runQuery(`
      INSERT INTO responsibles (
        institution_id, first_name, last_name, dni, role, birth_date, civil_activity, education,
        theological_studies, formation_institution, study_years, home_address, personal_phone, personal_email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      5, 'Daniela', 'Ríos', '28.193.042', 'Directora de Anexo', '1980-09-24', 'Enfermera', 'Terciario Completo',
      'Diploma en Teología Práctica', 'Universidad Adventista del Plata', 4, 'Zuviría 5202, José C. Paz',
      '11-2039-4921', 'daniela.rios@adventistas.org.ar'
    ]);

    // 5. Seed Social Actions
    await runQuery(`
      INSERT INTO social_actions (
        institution_id, has_comedor, has_roperia, has_health_center, has_food_distribution,
        has_medicine_distribution, has_other, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      1, 1, 1, 0, 1, 0, 1,
      'Ofrecemos Comedor Comunitario los sábados al mediodía para 80 niños. Ropería abierta los miércoles. Distribución de bolsones de comida mensuales.'
    ]);

    await runQuery(`
      INSERT INTO social_actions (
        institution_id, has_comedor, has_roperia, has_health_center, has_food_distribution,
        has_medicine_distribution, has_other, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      2, 1, 1, 1, 1, 1, 0,
      'Cáritas Parroquial funciona en el predio. Comedor los martes y jueves. Dispensario de medicamentos donados con médico voluntario los viernes. Distribución de alimentos.'
    ]);

    await runQuery(`
      INSERT INTO social_actions (
        institution_id, has_comedor, has_roperia, has_health_center, has_food_distribution,
        has_medicine_distribution, has_other, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      3, 1, 0, 0, 0, 0, 0,
      'Copa de leche los días lunes y viernes por la tarde en el barrio Sol y Verde.'
    ]);

    await runQuery(`
      INSERT INTO social_actions (
        institution_id, has_comedor, has_roperia, has_health_center, has_food_distribution,
        has_medicine_distribution, has_other, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      4, 0, 1, 0, 1, 0, 0,
      'Ropería comunitaria y distribución periódica de alimentos no perecederos.'
    ]);

    await runQuery(`
      INSERT INTO social_actions (
        institution_id, has_comedor, has_roperia, has_health_center, has_food_distribution,
        has_medicine_distribution, has_other, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      5, 0, 0, 1, 0, 1, 1,
      'Charlas gratuitas de prevención de salud, distribución de medicamentos básicos y cursos de alimentación saludable.'
    ]);

    // 6. Seed Social Networks
    await runQuery(`
      INSERT INTO social_networks (institution_id, website, facebook, instagram, youtube, tiktok, institutional_whatsapp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      1, 'https://www.filadelfiajc.org', 'https://facebook.com/filadelfiajcpaz',
      'https://instagram.com/filadelfiajcpaz', 'https://youtube.com/c/filadelfiatv',
      null, '11-5829-1029'
    ]);

    await runQuery(`
      INSERT INTO social_networks (institution_id, website, facebook, instagram, youtube, tiktok, institutional_whatsapp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      2, 'https://sanjoseobrerajcpaz.org', 'https://facebook.com/sanjoseobreromunicipio',
      'https://instagram.com/sanjoseobrerojcp', null, null, '11-4560-9821'
    ]);

    await runQuery(`
      INSERT INTO social_networks (institution_id, website, facebook, instagram, youtube, tiktok, institutional_whatsapp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      3, null, 'https://facebook.com/iglesiadediosaltisimosolyverde', null, null, null, null
    ]);

    await runQuery(`
      INSERT INTO social_networks (institution_id, website, facebook, instagram, youtube, tiktok, institutional_whatsapp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      4, null, 'https://facebook.com/bautistadelcamino', 'https://instagram.com/bautistadelcamino', null, null, '11-9238-1122'
    ]);

    await runQuery(`
      INSERT INTO social_networks (institution_id, website, facebook, instagram, youtube, tiktok, institutional_whatsapp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      5, 'https://adventistasfrino.org.ar', 'https://facebook.com/adventistasfrino', null, null, null, '11-2039-4921'
    ]);

    // 7. Seed Photos (Use placeholder URLs that look high-end or standard placeholder images)
    // We will use standard mock image URLs from Unsplash representing clean church facades and interiors
    await runQuery(`
      INSERT INTO photos (institution_id, type, url) VALUES
      (1, 'fachada', 'https://images.unsplash.com/photo-1548625361-155deee223d0?w=800&auto=format&fit=crop&q=60'),
      (1, 'interior', 'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=800&auto=format&fit=crop&q=60'),
      (2, 'fachada', 'https://images.unsplash.com/photo-1545232979-8bf34eb9757b?w=800&auto=format&fit=crop&q=60'),
      (2, 'interior', 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=800&auto=format&fit=crop&q=60'),
      (3, 'fachada', 'https://images.unsplash.com/photo-1510627802741-ae93b530a727?w=800&auto=format&fit=crop&q=60'),
      (3, 'interior', 'https://images.unsplash.com/photo-1601132359864-c974e79890ac?w=800&auto=format&fit=crop&q=60'),
      (4, 'fachada', 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=800&auto=format&fit=crop&q=60'),
      (4, 'interior', 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=60'),
      (5, 'fachada', 'https://images.unsplash.com/photo-1478147427282-58a87a120781?w=800&auto=format&fit=crop&q=60'),
      (5, 'interior', 'https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?w=800&auto=format&fit=crop&q=60')
    `);

    // 8. Seed Contact Histories
    await runQuery(`
      INSERT INTO contact_histories (institution_id, admin_user_id, contact_date, summary, notes)
      VALUES (?, ?, ?, ?, ?)
    `, [
      1, 2, '2025-10-12 11:30:00', 'Relevamiento inicial de Cultos',
      'Se visitó la iglesia Filadelfia en Sarmiento. Se constató la fachada en excelente estado. El pastor Carlos Giménez facilitó la documentación y se registraron sus datos privados. Quedan muy conformes con el mapa.'
    ]);

    await runQuery(`
      INSERT INTO contact_histories (institution_id, admin_user_id, contact_date, summary, notes)
      VALUES (?, ?, ?, ?, ?)
    `, [
      2, 2, '2025-11-05 14:00:00', 'Entrega de folletos de prevención',
      'Reunión presencial con el Padre Eduardo en la Parroquia San José Obrero. Conversación sobre la articulación de la bolsa de medicamentos de Cáritas con el centro de salud municipal.'
    ]);

    console.log('Database seeded successfully.');

  } catch (err) {
    console.error('Error seeding database', err);
  }
}

module.exports = {
  db,
  runQuery,
  getQuery,
  allQuery
};
