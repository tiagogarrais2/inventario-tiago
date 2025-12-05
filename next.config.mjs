/** @type {import('next').NextConfig} */
const nextConfig = {
  // Otimizações para produção
  productionBrowserSourceMaps: false, // Desabilita source maps em produção

  // Configuração Turbopack
  turbopack: {},

  // Headers de segurança
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },

  // Configurações do Webpack para source maps
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.devtool = false; // Remove source maps em produção
    }
    return config;
  },
};

export default nextConfig;
