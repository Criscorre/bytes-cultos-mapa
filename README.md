# OFICINA DE CULTOS — Estructura monorepo para frontend y backend

Este repositorio está organizado como monorepo con la siguiente estructura:

- `/client` — frontend Next.js
- `/server` — backend Express/Node + Firebase Admin
- `/scripts` — scripts de migración y utilidades que no forman parte del cliente

## 1. Estructura propuesta

```
/ (raíz)
  /client
    package.json
    next.config.mjs
    src/
    public/
    .env.local
  /server
    package.json
    server.js
    firebaseAdmin.js
    config/
    controllers/
    middlewares/
    routes/
    database.sqlite
    .env
  /scripts
    migrate-sqlite-to-firestore.js
  .gitignore
  docker-compose.yml
  Procfile
  package.json
  README.md
```

## 2. Archivos que mover

### Mover a `/client`
- Todo lo que estaba en `frontend/`
- `frontend/package.json` → `client/package.json`
- `frontend/next.config.mjs` → `client/next.config.mjs`
- `frontend/src/` → `client/src/`
- `frontend/public/` → `client/public/`
- `frontend/.env.local` → `client/.env.local`
- `frontend/Dockerfile` → `client/Dockerfile`
- `frontend/jsconfig.json` → `client/jsconfig.json`
- `frontend/postcss.config.mjs` → `client/postcss.config.mjs`
- `frontend/tailwind.config.js` → `client/tailwind.config.js`
- `frontend/.eslintrc.json` → `client/.eslintrc.json`

### Mover a `/server`
- Todo lo que estaba en `backend/`, excepto el script de migración
- `backend/package.json` → `server/package.json`
- `backend/server.js` → `server/server.js`
- `backend/firebaseAdmin.js` → `server/firebaseAdmin.js`
- `backend/.env` → `server/.env`
- `backend/database.sqlite` → `server/database.sqlite`
- `backend/Dockerfile` → `server/Dockerfile`
- `backend/config/` → `server/config/`
- `backend/controllers/` → `server/controllers/`
- `backend/middlewares/` → `server/middlewares/`
- `backend/routes/` → `server/routes/`

### Mover a `/scripts`
- `backend/scripts/migrate-sqlite-to-firestore.js` → `scripts/migrate-sqlite-to-firestore.js`

## 3. Archivos `package.json` necesarios

### `package.json` raíz

```json
{
  "name": "bytes-cultos-mapa",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "client",
    "server"
  ],
  "scripts": {
    "dev:client": "cd client && npm run dev",
    "dev:server": "cd server && npm run dev",
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "build:client": "cd client && npm run build",
    "start:server": "cd server && npm run start",
    "migrate": "node scripts/migrate-sqlite-to-firestore.js"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

### `client/package.json`

Mantener el archivo actual de `frontend/package.json` sin cambios, pero renombrado a `client/package.json`.

### `server/package.json`

Mantener el archivo actual de `backend/package.json` sin cambios, pero renombrado a `server/package.json`.

## 4. Ajustes de compatibilidad

### `scripts/migrate-sqlite-to-firestore.js`

Actualiza las rutas internas al nuevo layout:

```js
const admin = require('../server/firebaseAdmin');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'server', 'database.sqlite');
```

### `.gitignore`

Incluye estos paths nuevos:

```
node_modules/
**/node_modules/
client/.next/
server/database.sqlite
server/serviceAccountKey.json
client/.env.local
server/.env
.env
.DS_Store
cultosig-project.zip
*.log
npm-debug.log*
package-lock.json
yarn.lock
```

### `docker-compose.yml`

Ajusta los contextos de construcción:

```yaml
services:
  server:
    build:
      context: ./server
    ports:
      - "5000:5000"
    volumes:
      - ./server/database.sqlite:/usr/src/app/database.sqlite
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}

  client:
    build:
      context: ./client
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://localhost:5000/api
    depends_on:
      - server
```

### `Procfile`

Para Heroku o similares:

```text
web: node server/server.js
```

### GitHub Actions migration workflow

Actualiza los paths a `server` y `scripts`:

```yaml
working-directory: ./server
run: npm install --production

run: |
  echo "$FIREBASE_SERVICE_ACCOUNT" > server/serviceAccountKey.json

run: node scripts/migrate-sqlite-to-firestore.js
```

## 5. Comandos para mover los archivos

Si querés hacerlo desde PowerShell:

```powershell
cd C:\Users\crist\Desktop\OFICINA DE CULTOS
Rename-Item frontend client
Rename-Item backend server
Move-Item server\scripts\migrate-sqlite-to-firestore.js scripts\migrate-sqlite-to-firestore.js
Remove-Item -Recurse -Force server\scripts
```

Luego crea el `package.json` raíz y actualiza los archivos de configuración.

## 6. Despliegue en Vercel

En Vercel, configura el proyecto con:

- Root Directory: `client`
- Build Command: `npm run build`
- Output Directory: `.next`

Y en el backend, usá Render/Heroku/Railway para dejar activo el servidor y apuntar `NEXT_PUBLIC_API_URL` a esa URL.

---

Si querés, aplico estos cambios exactamente en tu repo ahora y te paso el commit final listo para push. ¿Lo hago?