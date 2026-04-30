/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow large PDF uploads (up to 20MB)
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};

module.exports = nextConfig;
