# Production Release Checklist

## Required Environment

- `NODE_ENV=production`
- `DATABASE_URL`
- `SESSION_SECRET` with at least 32 characters
- `UPLOAD_PROVIDER=local` or `UPLOAD_PROVIDER=object-storage`
- `OBJECT_STORAGE_BUCKET` and `OBJECT_STORAGE_REGION` when object storage is enabled
- `LOG_LEVEL=info`
- `MONITORING_DSN` when an external monitor is connected
- `BACKUP_SCHEDULE` when scheduled backups are configured

## Release Commands

```bash
npm ci
npm run release:check
npm run db:audit
npm run db:migrate
npm run db:seed
npm start
```

## Monitoring

The server emits structured JSON logs through `server/logger.ts`. Route logs include method, path, status code, duration, and response metadata. Connect the process stdout/stderr stream to the hosting platform log collector.

## Backups

For PostgreSQL deployments, schedule database backups before migrations and at least daily in production. Store backups outside the application host and test restore procedures before the first production launch.

## Uploads

Local uploads are suitable for development and single-host demos. Production deployments should add an adapter for S3, R2, or GCS behind `server/services/upload-service.ts` before enabling `UPLOAD_PROVIDER=object-storage`.
