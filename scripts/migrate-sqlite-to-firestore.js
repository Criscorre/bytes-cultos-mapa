/*
  Script de migración: exporta datos desde backend/database.sqlite a Firestore.
  Uso local: configurar FIREBASE_SERVICE_ACCOUNT (JSON) en env o colocar backend/serviceAccountKey.json
  Ejecutar: node backend/scripts/migrate-sqlite-to-firestore.js
*/
const admin = require('../server/firebaseAdmin');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function run() {
  if (!admin || !admin.firestore) {
    console.error('Firebase Admin no inicializado. Configura FIREBASE_SERVICE_ACCOUNT o server/serviceAccountKey.json');
    process.exit(1);
  }

  const dbPath = path.join(__dirname, '..', 'server', 'database.sqlite');
  const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error('No se pudo abrir database.sqlite:', err.message);
      process.exit(1);
    }
  });

  const firestore = admin.firestore();

  const queryAll = (sql) => new Promise((resolve, reject) => db.all(sql, [], (err, rows) => err ? reject(err) : resolve(rows)));

  try {
    console.log('Exportando municipalities...');
    const municipalities = await queryAll('SELECT * FROM municipalities');
    for (const m of municipalities) {
      await firestore.collection('municipalities').doc(String(m.id)).set(m);
    }

    console.log('Exportando users...');
    const users = await queryAll('SELECT * FROM users');
    for (const u of users) {
      // If password hash exists, create Firebase Auth user with random password and store original id mapping
      let uid = `sql_${u.id}`;
      try {
        const userRec = await admin.auth().getUserByEmail(u.email).catch(() => null);
        if (userRec) uid = userRec.uid;
        else {
          const created = await admin.auth().createUser({ email: u.email, password: Math.random().toString(36).slice(-12) });
          uid = created.uid;
        }
      } catch (err) {
        console.warn('Error creando/obteniendo usuario:', u.email, err.message);
      }

      const doc = Object.assign({}, u);
      delete doc.password_hash;
      await firestore.collection('users').doc(uid).set(doc);
    }

    console.log('Exportando institutions...');
    const institutions = await queryAll('SELECT * FROM institutions');
    for (const inst of institutions) {
      // map user_id to uid if possible
      let userUid = inst.user_id ? `sql_${inst.user_id}` : null;
      const payload = Object.assign({}, inst, { user_uid: userUid });
      delete payload.user_id;
      await firestore.collection('institutions').add(payload);
    }

    console.log('Exportando responsibles, social_actions, social_networks, photos, contact_histories...');
    const responsibles = await queryAll('SELECT * FROM responsibles');
    for (const r of responsibles) await firestore.collection('responsibles').add(r);
    const socialActions = await queryAll('SELECT * FROM social_actions');
    for (const s of socialActions) await firestore.collection('social_actions').add(s);
    const socialNetworks = await queryAll('SELECT * FROM social_networks');
    for (const sn of socialNetworks) await firestore.collection('social_networks').add(sn);
    const photos = await queryAll('SELECT * FROM photos');
    for (const p of photos) await firestore.collection('photos').add(p);
    const contacts = await queryAll('SELECT * FROM contact_histories');
    for (const c of contacts) await firestore.collection('contact_histories').add(c);

    console.log('Migración completada.');
    db.close();
    process.exit(0);
  } catch (err) {
    console.error('Error durante migración:', err);
    db.close();
    process.exit(1);
  }
}

run();
