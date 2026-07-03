// Provisioning smoke suite. Run: docker compose exec -e SMOKE_TENANT_ID=<id> backend bun run scripts/smoke-platform.ts
const BASE = 'http://localhost:3001'
const TENANT_ID = process.env.SMOKE_TENANT_ID!
const results: string[] = []
const ok = (name: string, pass: boolean, detail = '') =>
  results.push(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`)

async function j(path: string, init: RequestInit = {}) {
  const res = await fetch(BASE + path, init)
  let body: any = null
  try { body = await res.json() } catch {}
  return { status: res.status, body }
}

const platformHost = { 'x-forwarded-host': 'app.pherro.app' }

// Platform login
const login = await j('/auth/login', {
  method: 'POST',
  headers: { 'content-type': 'application/json', ...platformHost },
  body: JSON.stringify({ email: process.env.PLATFORM_ADMIN_EMAIL, password: process.env.PLATFORM_ADMIN_PASSWORD }),
})
const pat = login.body?.accessToken ?? ''
ok('platform login', login.status === 200 && !!pat, `status=${login.status}`)
const pAuth = { authorization: `Bearer ${pat}`, 'content-type': 'application/json', ...platformHost }

// 1. Tenant admin token cannot reach platform API
{
  const tl = await j('/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-tenant-id': TENANT_ID },
    body: JSON.stringify({ email: process.env.TENANT_ADMIN_EMAIL, password: process.env.TENANT_ADMIN_PASSWORD }),
  })
  const r = await j('/platform/tenants', {
    headers: { authorization: `Bearer ${tl.body?.accessToken}`, 'x-tenant-id': TENANT_ID },
  })
  ok('tenant admin blocked from platform API', r.status === 403, `status=${r.status}`)
}

// 2. S2S service token cannot reach platform API
{
  const r = await j('/platform/tenants', {
    headers: { 'x-admin-token': process.env.BACKEND_ADMIN_TOKEN!, 'x-tenant-id': TENANT_ID },
  })
  ok('service token blocked from platform API', r.status === 401 || r.status === 403, `status=${r.status}`)
}

// 3. Reserved slug rejected
{
  const r = await j('/platform/tenants', {
    method: 'POST',
    headers: pAuth,
    body: JSON.stringify({ slug: 'www', name: 'Bad', adminEmail: 'a@b.com', adminPassword: 'password123' }),
  })
  ok('reserved slug rejected', r.status === 409, `status=${r.status}`)
}

// 4. Provision new tenant
let loja2 = ''
{
  const r = await j('/platform/tenants', {
    method: 'POST',
    headers: pAuth,
    body: JSON.stringify({ slug: 'loja2', name: 'Loja Dois', adminEmail: 'dono@loja2.com', adminPassword: 'senhaforte123' }),
  })
  loja2 = r.body?.id ?? ''
  ok('provision tenant', r.status === 201 && !!loja2, `status=${r.status} id=${loja2}`)
}

// 5. Duplicate slug → 409
{
  const r = await j('/platform/tenants', {
    method: 'POST',
    headers: pAuth,
    body: JSON.stringify({ slug: 'loja2', name: 'Dup', adminEmail: 'x@y.com', adminPassword: 'password123' }),
  })
  ok('duplicate slug 409', r.status === 409, `status=${r.status}`)
}

// 6. New tenant's storefront isolated: 0 vehicles, own shop config seeded
{
  const r = await j('/vehicles', { headers: { 'x-forwarded-host': 'loja2.pherro.app' } })
  ok('loja2 storefront empty', r.status === 200 && r.body?.total === 0, `total=${r.body?.total}`)
  const sc = await j('/shop-config', { headers: { 'x-forwarded-host': 'loja2.pherro.app' } })
  ok('loja2 shop config seeded', sc.status === 200 && sc.body?.shopName === 'Loja Dois', `shopName=${sc.body?.shopName}`)
}

// 7. Seeded admin logs into loja2 by host; token scoped to loja2
let loja2Token = ''
{
  const r = await j('/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-host': 'loja2.pherro.app' },
    body: JSON.stringify({ email: 'dono@loja2.com', password: 'senhaforte123' }),
  })
  loja2Token = r.body?.accessToken ?? ''
  const claims = loja2Token ? JSON.parse(atob(loja2Token.split('.')[1])) : {}
  ok('loja2 admin login by host', r.status === 200 && claims.tenantId === loja2, `status=${r.status}`)
}

// 8. loja2 attributes seeded (6 defaults)
{
  const r = await j('/attributes', {
    headers: { authorization: `Bearer ${loja2Token}`, 'x-forwarded-host': 'loja2.pherro.app' },
  })
  const n = Array.isArray(r.body) ? r.body.length : r.body?.length
  ok('loja2 default attributes', r.status === 200 && n === 6, `status=${r.status} count=${n}`)
}

// 9. loja2 token useless on dev tenant host (cross-tenant replay)
{
  const r = await j('/users', {
    headers: { authorization: `Bearer ${loja2Token}`, 'x-tenant-id': TENANT_ID },
  })
  ok('loja2 token rejected on dev tenant', r.status === 401, `status=${r.status}`)
}

// 10. Suspend loja2 → host stops resolving (storefront fail-closed), login dies
{
  const r = await j(`/platform/tenants/${loja2}`, {
    method: 'PATCH',
    headers: pAuth,
    body: JSON.stringify({ status: 'SUSPENDED' }),
  })
  ok('suspend tenant', r.status === 200 && r.body?.status === 'SUSPENDED', `status=${r.status}`)
  const v = await j('/vehicles', { headers: { 'x-tenant-id': loja2 } })
  ok('suspended tenant fail-closed', v.status === 200 && v.body?.total === 0, `total=${v.body?.total}`)
  const l = await j('/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-host': 'loja2.pherro.app' },
    body: JSON.stringify({ email: 'dono@loja2.com', password: 'senhaforte123' }),
  })
  ok('suspended tenant login rejected', l.status === 401, `status=${l.status}`)
}

// 11. Reactivate + cleanup check
{
  const r = await j(`/platform/tenants/${loja2}`, {
    method: 'PATCH',
    headers: pAuth,
    body: JSON.stringify({ status: 'ACTIVE' }),
  })
  const v = await j('/vehicles', { headers: { 'x-forwarded-host': 'loja2.pherro.app' } })
  ok('reactivate tenant', r.status === 200 && v.body?.total === 0 && v.status === 200, `status=${r.status}`)
}

// 12. Dev tenant untouched
{
  const r = await j('/vehicles', { headers: { 'x-tenant-id': TENANT_ID } })
  ok('dev tenant still sees 6', r.body?.total === 6, `total=${r.body?.total}`)
}

console.log(results.join('\n'))
if (results.some((r) => r.startsWith('FAIL'))) process.exit(1)
