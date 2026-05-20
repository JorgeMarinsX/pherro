export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/admin/login') return

  const { data } = await useFetch<{ authenticated: boolean }>('/api/auth/me', {
    key: 'auth:me',
  })

  if (!data.value?.authenticated) {
    return navigateTo(`/admin/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
