/** @type {import('next').NextConfig} */
// BASE_PATH 定义见 docs/delivery/design.md，与 apps/api 的全局前缀保持一致
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig = {
  reactStrictMode: true,
  basePath: BASE_PATH,
  poweredByHeader: false,
  env: {
    API_BASE_URL: process.env.API_BASE_URL ?? 'http://localhost:3001',
  },
};

export default nextConfig;
