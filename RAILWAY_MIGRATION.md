# Mission Distinction — Railway migration

This repository is prepared for two Railway services from the same repository:

1. **API** — uses `nixpacks.toml`, builds `@workspace/api-server`, and listens on Railway's `PORT`.
2. **Frontend** — uses `railway.frontend.toml`, builds `@workspace/mission-distinction`, and serves the static Vite output.

## Railway service setup

Create a PostgreSQL database in the Railway project, then create two services from this repository:

- API service: repository root, use `nixpacks.toml`
- Frontend service: repository root, configure the service to use `railway.frontend.toml`

Set `BASE_PATH=/` for the frontend service. Set `VITE_API_URL` to the public API service URL.

## API environment variables

Required:

- `PORT` — supplied by Railway
- `DATABASE_URL` — reference the Railway PostgreSQL service
- `JWT_SECRET` — generate a new strong value
- `ALLOWED_ORIGINS` — frontend public URL, including `https://`
- `APP_URL` — frontend public URL, including `https://`

For existing features, configure the providers that are actually used:

- `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `GCS_PROJECT_ID`, `GCS_SERVICE_ACCOUNT_JSON`, `DEFAULT_OBJECT_STORAGE_BUCKET_ID`
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- Any `OPENAI_*`, `GEMINI_*`, Firebase, or Sentry values used by enabled features

## Data migration safety

Do not delete the old deployment until all of the following are verified:

- PostgreSQL dump restored into Railway PostgreSQL
- GCS/Cloudinary files and database URLs still resolve
- Admin and student login works
- PDF, book, note, and video uploads work
- Socket.io community/game/call features work
- Email verification and password reset links use the Railway frontend URL

The source code does not contain database credentials. Copy secret values into Railway's variable UI; never commit them to this repository.