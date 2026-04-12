// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   experimental: {
//     serverActions: { allowedOrigins: ['localhost:3000'] }
//   },
//   images: { domains: ['lh3.googleusercontent.com'] }
// }

// export default nextConfig




/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] }
  },
  images: { 
    domains: ['lh3.googleusercontent.com'] 
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PATCH, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}

export default nextConfig