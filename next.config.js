/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      '/api/providers/apply': ['./public/fonts/**/*', './public/branding/**/*'],
      // v2.7.24 — provider profile PDF needs the same fonts + logo
      '/api/providers/[id]/profile-pdf': ['./public/fonts/**/*', './public/branding/**/*'],
      // v2.7.25 — combined (multi-select) profile PDF, same assets
      '/api/providers/profile-pdf': ['./public/fonts/**/*', './public/branding/**/*'],
      // v2.7.28 — client face sheets + case summary, same assets
      '/api/clients/[id]/facesheet-pdf': ['./public/fonts/**/*', './public/branding/**/*'],
      '/api/clients/facesheet-pdf': ['./public/fonts/**/*', './public/branding/**/*'],
      '/api/cases/[id]/summary-pdf': ['./public/fonts/**/*', './public/branding/**/*'],
    },
  },
  async headers() {
    return [
      {
        source: '/api/providers/apply',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
      {
        source: '/api/clients/apply',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
      {
        source: '/api/clients/inquire',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
