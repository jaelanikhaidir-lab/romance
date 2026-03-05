# Database & External Services Setup

## Supabase Setup

1. **Create a project** at [supabase.com](https://supabase.com)
2. Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
3. Open the **SQL Editor** in the Supabase dashboard
4. Paste and run `supabase/schema.sql` to create tables + RLS policies
5. Paste and run `supabase/seed.sql` to insert default settings + sample data

## Cloudinary Setup

1. **Create an account** at [cloudinary.com](https://cloudinary.com)
2. Go to **Dashboard** and copy:
   - `Cloud Name` → `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - `API Key` → `CLOUDINARY_API_KEY`
   - `API Secret` → `CLOUDINARY_API_SECRET`
3. (Optional) In **Settings → Upload**, you can create an upload preset for the folder `romantic-gallery`

## Environment Variables

Copy `.env.example` to `.env.local` and fill all values:

```bash
cp .env.example .env.local
```

All required variables:

| Variable | Where to find | Used for |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | Public Supabase client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | Public read queries |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | Server-side write operations |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary Dashboard | Upload widget, image URLs |
| `CLOUDINARY_API_KEY` | Cloudinary Dashboard | Signed uploads |
| `CLOUDINARY_API_SECRET` | Cloudinary Dashboard | Signature generation |
| `CLOUDINARY_UPLOAD_FOLDER` | Your choice (default: `romantic-gallery`) | Organize uploads |
| `ADMIN_USERNAME` | Your choice | Admin login |
| `ADMIN_PASSWORD` | Your choice | Admin login |
| `JWT_SECRET` | Generate: `openssl rand -base64 32` | Session tokens |
