/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://cnxsjxgscgyqrbcyveoh.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNueHNqeGdzY2d5cXJiY3l2ZW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzU2MDgsImV4cCI6MjA2ODYxMTYwOH0.FByjJPqMB7vGkz7fWzX2kO4mGMz7XzGIVXqciVrr1os",
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
