import * as Sentry from '@sentry/vue'

// Browser error tracking. No DSN = disabled (dev default).
export default defineNuxtPlugin((nuxtApp) => {
  const dsn = useRuntimeConfig().public.sentryDsn
  if (!dsn) return

  Sentry.init({
    app: nuxtApp.vueApp,
    dsn,
    environment: import.meta.dev ? 'development' : 'production',
    tracesSampleRate: 0,
    sendDefaultPii: false,
  })
})
