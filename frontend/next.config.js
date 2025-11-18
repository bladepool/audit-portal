/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['analytixaudit-bucket.s3.eu-north-1.amazonaws.com', 'audit.cfg.ninja'],
  },
}

module.exports = nextConfig
