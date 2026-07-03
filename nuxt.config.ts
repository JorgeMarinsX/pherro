// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-01',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  future: { compatibilityVersion: 4 },
  // Tenant is resolved per request from Host — never a static env. The browser
  // only talks to the BFF (/api/**); no public backend URL exists.
  runtimeConfig: {
    backendUrl: process.env.BACKEND_URL,
    adminToken: process.env.BACKEND_ADMIN_TOKEN,
    sessionSecret: process.env.SESSION_SECRET,
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
