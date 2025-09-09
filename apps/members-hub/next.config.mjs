/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: process.cwd(),
  },
}

export default nextConfig
