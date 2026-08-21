// Empty in dev (relative fetches go through the /api and /uploads proxy in
// vite.config.ts, same-origin). Set to "https://api.360fos.com" for prod
// builds via the VITE_API_URL env var, since apps/app and apps/api are
// deployed to separate origins.
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";
