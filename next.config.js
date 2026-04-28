/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/earthspell-34aed.firebasestorage.app/**",
      },
    ],
    formats: ["image/webp"],
  },
};

module.exports = nextConfig;
