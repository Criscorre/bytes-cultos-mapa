# OFICINA DE CULTOS — Preparación para despliegue

Resumen rápido: el repo está preparado para usar Firebase Auth + Firestore. Incluye un script de migración y un workflow de GitHub Actions para ejecutar la migración cuando añadas el secret `FIREBASE_SERVICE_ACCOUNT`.

Qué falta (acciones que debes ejecutar localmente o añadir en GitHub):

- Añadir secret `FIREBASE_SERVICE_ACCOUNT` (JSON) en GitHub: Settings → Secrets and variables → Actions → New repository secret. Nombre: `FIREBASE_SERVICE_ACCOUNT`.
- Añadir `FIREBASE_PROJECT_ID` como secret o variable si lo necesitas.
- Crear el repositorio en GitHub y empujar el código (puedes usar `gh` o un Personal Access Token).

Comandos sugeridos (PowerShell):

1) Usando `gh` (recomendado si lo tenés instalado y autenticado):

```powershell
gh repo create bytescreativoss-debug/Bytes-cultos --public --source . --remote origin --push
```

2) Usando `git` con remote existente:

```powershell
git remote add origin https://github.com/bytescreativoss-debug/Bytes-cultos.git
git branch -M main
git add .
git commit -m "Prep: Docker + Firebase integration, initializers and middleware"
git push -u origin main
```

Si el push falla por permisos, crea un Personal Access Token (PAT) en GitHub con scope `repo` y usa `git push` con ese token (configurar credential helper o usar `https://<TOKEN>@github.com/...`).

Ejecución de la migración localmente:

1) Coloca el JSON del service account en `backend/serviceAccountKey.json` O exportalo a la variable de entorno `FIREBASE_SERVICE_ACCOUNT`.
2) Desde la raíz del proyecto:

```powershell
node backend/scripts/migrate-sqlite-to-firestore.js
```

Ejecución de la migración via GitHub Actions:

1) Subí el secret `FIREBASE_SERVICE_ACCOUNT` al repo.
2) En la pestaña Actions → Migrate SQLite to Firestore → Run workflow (workflow_dispatch).

Despliegue (opciones recomendadas):
- Vercel para frontend (Next.js). Añadir `NEXT_PUBLIC_FIREBASE_*` vars en el panel de Vercel.
- Render o Heroku para backend; configurar variables `FIREBASE_SERVICE_ACCOUNT` y `FIREBASE_PROJECT_ID` en su panel.

Si querés, yo preparo workflows adicionales para desplegar automáticamente a Vercel/Render cuando hagas push — decime cuál preferís y yo lo agrego.

Contacto: pedime que genere el workflow de despliegue (Vercel/Render) o que te guíe para crear el repo y añadir secrets.
