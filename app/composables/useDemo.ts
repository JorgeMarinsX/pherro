import { isDemoHost } from '~~/shared/host'

// Live-demo helpers: detect the demo host and build cross-host URLs.
// demo.pherro.app → pherro.app/cadastro (prod) | demo.localhost:3000 → localhost:3000/cadastro (dev).
export function useDemo() {
  const url = useRequestURL()

  const isDemo = computed(() => isDemoHost(url.hostname))

  const port = url.port ? `:${url.port}` : ''
  const apexHost = url.hostname.replace(/^(demo|www)\./, '')

  const signupUrl = computed(() => `${url.protocol}//${apexHost}${port}/cadastro`)
  const demoUrl = computed(() => `${url.protocol}//demo.${apexHost}${port}/`)

  return { isDemo, signupUrl, demoUrl }
}
