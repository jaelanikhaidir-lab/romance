/**
 * Global test setup — runs before every test file.
 * Sets environment variables needed by auth and other modules.
 */

process.env.JWT_SECRET = "test-secret-key-for-vitest-at-least-32-chars-long";
process.env.ADMIN_USERNAME = "admin";
process.env.ADMIN_PASSWORD = "secret123";
process.env.NODE_ENV = "test";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fake.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-service-role-key";
process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "fake-cloud";
process.env.CLOUDINARY_API_KEY = "fake-api-key";
process.env.CLOUDINARY_API_SECRET = "fake-api-secret";
