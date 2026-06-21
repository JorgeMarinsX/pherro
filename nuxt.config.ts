// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-01',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  future: { compatibilityVersion: 4 },
  runtimeConfig: {
    backendUrl: process.env.BACKEND_URL,
    tenantSlug: process.env.TENANT_SLUG,
    adminToken: process.env.BACKEND_ADMIN_TOKEN,
    sessionSecret: process.env.SESSION_SECRET,
    public: {
      backendUrl: process.env.NUXT_PUBLIC_BACKEND_URL,
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'pt-BR' },
      title: 'Pherro',
    },
  },
  vite: {
    server: {
      hmr: {
        protocol: 'ws',
        host: '0.0.0.0',
        port: 3000,
        clientPort: 3000,
      },
      watch: {
        usePolling: true,
      },
    },
  },
})
