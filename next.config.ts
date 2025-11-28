import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer, webpack }) => {
    // Handle missing optional dependencies from wallet adapters
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Ignore optional wallet adapter dependencies that may have missing files
    // This prevents build failures from Keystone wallet adapter's qrcode.react dependency
    try {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^qrcode\.react$/,
        })
      );
    } catch (e) {
      // Ignore if plugin already exists
    }

    return config;
  },
};

export default nextConfig;
