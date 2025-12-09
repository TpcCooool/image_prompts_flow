/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 配置远程图片域名
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
    ],
  },
}

module.exports = nextConfig
