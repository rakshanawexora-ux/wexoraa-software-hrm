# Wexoraa Infotech HRMS

React and Vite frontend with an Express API and MongoDB. Admins manage employees, attendance, tasks, reports, and analytics. Employees track their work time, update assigned tasks, and submit daily reports.

## Run locally

Use Node.js 22.12+ or 24 LTS and a running MongoDB instance.

1. Copy `server/.env.example` to `server/.env`. Set `MONGO_URI` and a fresh `JWT_SECRET` of at least 32 characters. Generate a random value with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
2. In `server`, run `npm ci` and `npm run dev`. The API defaults to port 5000.
3. For a new database, temporarily set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `server/.env`, then run `npm run create-admin` from `server`. Use a password of at least 12 characters and at most 72 bytes. Remove the three bootstrap values afterward. An existing administrator can sign in with their original account password.
4. Copy `client/.env.example` to `client/.env`. In `client`, run `npm ci` and `npm run dev`. Open `http://localhost:5173`.

## Use an existing database

- Rotate the database password exposed in the original archive and set the new URI in the API environment. Set a fresh signing secret for the new deployment. Users will need to sign in again.
- Test the release against a backup or staging copy first. The server creates unique indexes on employee and date for attendance and daily reports. If existing records contain duplicate employee/date pairs, reconcile those records before starting the updated server.
- Attendance and report dates default to Asia/Kolkata. Configure `WORK_TIME_ZONE` and `VITE_WORK_TIME_ZONE` together if the company uses another timezone. Existing dates stay as stored.
- Active work timer drafts live in the employee's browser and are scoped to one account and work date. Finish any active sessions in the old version before upgrading. The server validates timer totals when the employee saves the session.
- For hosted environments, set `CLIENT_ORIGIN` to the frontend origin and `VITE_API_URL` to the deployed API URL including `/api`. Vite embeds its settings at build time.

## Build

In `client`, run `npm run lint` and `npm run build`. The build is written to `client/dist`. The web host should serve `index.html` for client-side routes.
