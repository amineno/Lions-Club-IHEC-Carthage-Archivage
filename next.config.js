/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "loremflickr.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "55mb",
    },
    outputFileTracingIncludes: {
      "/*": ["./prisma/dev.db"],
      "/**/*": ["./prisma/dev.db"],
      "/api/**/*": ["./prisma/dev.db"],
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
