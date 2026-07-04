// Mirrors backend TenantResolverService.isPlatformHost — keep in sync.
export function isPlatformHost(host: string, base: string): boolean {
  const h = host.toLowerCase().split(':')[0]
  return h === base || h.startsWith('app.') || h.startsWith('www.')
}
