// Mirrors backend TenantResolverService.isPlatformHost — keep in sync.
export function isPlatformHost(host: string, base: string): boolean {
  const h = host.toLowerCase().split(':')[0] ?? ''
  return h === base || h.startsWith('app.') || h.startsWith('www.')
}

// demo.* serves the live demo: ephemeral tenant per browser session.
// Mirrors the backend resolver's demo-host exclusion — keep in sync.
export function isDemoHost(host: string): boolean {
  const h = host.toLowerCase().split(':')[0] ?? ''
  return h.startsWith('demo.')
}
