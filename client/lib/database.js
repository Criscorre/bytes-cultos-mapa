const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const os = require('os');

// Use system temp directory or current directory for database
const dbPath = path.join(os.tmpdir(), 'cultosig.sqlite');

let db = null;

function getDatabase() {
  if (!db) {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database', err);
      } else {
        console.log('Connected to SQLite database at', dbPath);
        initializeDatabase();
      }
    });
  }
  return db;
}

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDatabase().run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDatabase().get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDatabase().all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function initializeDatabase() {
  try {
    await runQuery('PRAGMA foreign_keys = ON;');

    // Municipalities Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS municipalities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        province TEXT NOT NULL,
        center_lat REAL DEFAULT -34.515,
        center_lng REAL DEFAULT -58.768
      )
    `);

    // Users Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'superadmin')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Institutions Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS institutions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        denomination TEXT NOT NULL,
        congregation TEXT NOT NULL,
        address TEXT NOT NULL,
        neighborhood TEXT NOT NULL,
        municipality_id INTEGER NOT NULL,
        type TEXT DEFAULT 'Sede' CHECK (type IN ('Sede', 'Filial', 'Anexo')),
        edifice_state TEXT DEFAULT 'Bueno',
        property_type TEXT DEFAULT 'Alquilado',
        latitude REAL,
        longitude REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (municipality_id) REFERENCES municipalities(id)
      )
    `);

    // Reports Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        institution_id INTEGER NOT NULL,
        report_type TEXT NOT NULL,
        data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (institution_id) REFERENCES institutions(id)
      )
    `);

    console.log('All database tables initialized successfully.');
    await seedDatabase();
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

async function seedDatabase() {
  try {
    const count = await getQuery('SELECT COUNT(*) as count FROM municipalities');
    if (count.count === 0) {
      console.log('Seeding database with municipalities...');
      const municipalities = [
        { name: 'José C. Paz', province: 'Buenos Aires' },
        { name: 'Malvinas Argentinas', province: 'Buenos Aires' },
        { name: 'San Miguel', province: 'Buenos Aires' }
      ];

      for (const muni of municipalities) {
        await runQuery('INSERT INTO municipalities (name, province) VALUES (?, ?)', [muni.name, muni.province]);
      }
      console.log('Database seeded successfully.');
    } else {
      console.log('Database already seeded. Skipping seed process.');
    }
  } catch (err) {
    console.error('Error seeding database:', err);
  }
}

module.exports = { getDatabase, runQuery, getQuery, allQuery };
