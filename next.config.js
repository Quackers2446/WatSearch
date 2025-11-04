/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer, webpack }) => {
    // Fix for undici private fields issue - exclude from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };

      // Ignore undici in client-side bundle
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^undici$/,
        })
      );
    }

    return config;
  },
  // Experimental feature to handle server-only packages
  experimental: {
    serverComponentsExternalPackages: ["undici", "cheerio"],
  },
  // Increase API route timeout for long-running requests (like fetching multiple courses)
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

module.exports = nextConfig;
