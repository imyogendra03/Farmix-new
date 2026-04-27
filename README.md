# FARMIX Deployment Guide

This repository contains:

- `client`: React frontend, optimized for Vercel deployment
- `server`: Express/MongoDB backend, ready for Render deployment

## Recommended stack

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas
- Node.js: `20`

## Project structure

```text
farmix-main/
  client/
  server/
  docs/
```

## Local production checks

Frontend:

```bash
cd client
npm install
npm run build:prod
```

Backend:

```bash
cd server
npm install
npm test
npm run start:prod
```

## Frontend deployment to Vercel

1. Import the `client` directory as a Vercel project.
2. Framework preset: `Other` or detect CRA automatically.
3. Build command: `npm run build:prod`
4. Output directory: `build`
5. Add environment variables:
   - `REACT_APP_API_URL=https://your-backend-domain/api`
   - `REACT_APP_SITE_URL=https://your-frontend-domain`
   - `REACT_APP_GOOGLE_MAPS_API_KEY=your_key`
6. Deploy.

Notes:

- SPA routing fallback is configured in [C:\Users\HP\OneDrive\Desktop\farmix-main\client\vercel.json](C:\Users\HP\OneDrive\Desktop\farmix-main\client\vercel.json)
- Update `REACT_APP_SITE_URL` before production so sitemap/canonical tags are correct

## Backend deployment to Render

1. Create a new Web Service from the repo.
2. Root directory: `server`
3. Build command: `npm install`
4. Start command: `npm run start:prod`
5. Health check path: `/api/health`
6. Use [C:\Users\HP\OneDrive\Desktop\farmix-main\server\render.yaml](C:\Users\HP\OneDrive\Desktop\farmix-main\server\render.yaml) or configure the same values manually.

Required environment variables:

- `NODE_ENV=production`
- `PORT=10000` on Render, or platform-provided port
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `CLIENT_URL`
- `CLIENT_URLS`
- `ALLOWED_ORIGINS`
- `SERVER_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `EMAIL_FROM`
- `EMAIL_FROM_NAME`

Optional environment variables:

- `REDIS_URL`
- `GEMINI_API_KEY`
- `OPENWEATHER_API_KEY`
- `ENAM_API_BASE_URL`
- `ENAM_API_KEY`
- MongoDB retry/pool tuning vars from `server/.env.example`

## MongoDB Atlas

1. Create a cluster in MongoDB Atlas.
2. Create a database user with a strong password.
3. Allow access from your backend host IPs or use temporary `0.0.0.0/0` only during setup.
4. Copy the connection string into `MONGO_URI`.
5. Confirm the backend logs show a successful connection.

## Production env templates

Frontend template:

See [C:\Users\HP\OneDrive\Desktop\farmix-main\client\.env.example](C:\Users\HP\OneDrive\Desktop\farmix-main\client\.env.example)

Backend template:

See [C:\Users\HP\OneDrive\Desktop\farmix-main\server\.env.example](C:\Users\HP\OneDrive\Desktop\farmix-main\server\.env.example)

## Release checklist

- Rotate any real credentials currently stored in local `.env` files
- Set production frontend/backend URLs
- Set strict CORS origins
- Verify `/api/health`
- Run frontend build
- Run backend tests
- Import [C:\Users\HP\OneDrive\Desktop\farmix-main\docs\postman\Farmix.postman_collection.json](C:\Users\HP\OneDrive\Desktop\farmix-main\docs\postman\Farmix.postman_collection.json) and smoke test live endpoints
- Confirm email delivery settings

## Current deployment outputs added in this step

- [C:\Users\HP\OneDrive\Desktop\farmix-main\.nvmrc](C:\Users\HP\OneDrive\Desktop\farmix-main\.nvmrc)
- [C:\Users\HP\OneDrive\Desktop\farmix-main\client\vercel.json](C:\Users\HP\OneDrive\Desktop\farmix-main\client\vercel.json)
- [C:\Users\HP\OneDrive\Desktop\farmix-main\server\render.yaml](C:\Users\HP\OneDrive\Desktop\farmix-main\server\render.yaml)
