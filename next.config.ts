import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias['pdfjs-dist/build/pdf.worker.entry'] =
      'pdfjs-dist/build/pdf.worker.min.mjs'
    return config
  },
}

export default nextConfig
