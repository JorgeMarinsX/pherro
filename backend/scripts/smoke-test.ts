// Core smoke suite. Run: docker compose exec -e SMOKE_TENANT_ID=<id> backend bun run scripts/smoke-test.ts
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

// 1. Unknown host in dev: TENANT_SLUG fallback resolves the seeded tenant (prod is strict).
{
  const r = await j('/vehicles', { headers: { 'x-forwarded-host': 'unknown.example.com' } })
  ok('dev fallback unknown host', r.status === 200 && r.body?.total === 6, `status=${r.status} total=${r.body?.total}`)
}

// 2. Bogus x-tenant-id → empty
{
  const r = await j('/vehicles', { headers: { 'x-tenant-id': 'bogus123' } })
  ok('bogus x-tenant-id empty', r.status === 200 && r.body?.total === 0, `status=${r.status} total=${r.body?.total}`)
}

// 3. Valid tenant via x-tenant-id → 6
{
  const r = await j('/vehicles', { headers: { 'x-tenant-id': TENANT_ID } })
  ok('valid tenant sees 6', r.body?.total === 6, `total=${r.body?.total}`)
}

// 4. Tenant login → JWT carries tenantId
let accessToken = ''
{
  const r = await j('/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-tenant-id': TENANT_ID },
    body: JSON.stringify({ email: process.env.TENANT_ADMIN_EMAIL, password: process.env.TENANT_ADMIN_PASSWORD }),
  })
  accessToken = r.body?.accessToken ?? ''
  const claims = accessToken ? JSON.parse(atob(accessToken.split('.')[1])) : {}
  ok('tenant login', r.status === 200 && claims.tenantId === TENANT_ID, `status=${r.status} jwt.tenantId=${claims.tenantId}`)
}

// 5. Tenant login WITHOUT tenant context → 401
{
  const r = await j('/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-host': 'app.pherro.app' },
    body: JSON.stringify({ email: process.env.TENANT_ADMIN_EMAIL, password: process.env.TENANT_ADMIN_PASSWORD }),
  })
  ok('tenant creds on platform host rejected', r.status === 401, `status=${r.status}`)
}

// 6. Platform login on platform host → 200, null tenantId
{
  const r = await j('/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-host': 'app.pherro.app' },
    body: JSON.stringify({ email: process.env.PLATFORM_ADMIN_EMAIL, password: process.env.PLATFORM_ADMIN_PASSWORD }),
  })
  const claims = r.body?.accessToken ? JSON.parse(atob(r.body.accessToken.split('.')[1])) : {}
  ok('platform login', r.status === 200 && claims.tenantId === null && claims.role === 'PLATFORM_ADMIN', `status=${r.status} role=${claims.role} tenantId=${String(claims.tenantId)}`)
}

// 7. JWT replay across tenants: tenant token used with wrong tenant host → 401
{
  const r = await j('/auth/me', {
    headers: { authorization: `Bearer ${accessToken}`, 'x-forwarded-host': 'app.pherro.app' },
  })
  ok('token replay cross-host rejected', r.status === 401, `status=${r.status}`)
}

const auth = { authorization: `Bearer ${accessToken}`, 'x-tenant-id': TENANT_ID, 'content-type': 'application/json' }

// 8. Vehicle create with nested photos+attributes (nested-create fix)
let createdId = ''
{
  const r = await j('/vehicles', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      make: 'Smoke', model: 'Test', year: 2020, price: 10000, mileage: 1000,
      color: 'Azul', transmission: 'MANUAL', fuelType: 'FLEX',
      photos: [{ url: 'https://example.com/p.jpg', position: 0 }],
    }),
  })
  createdId = r.body?.id ?? ''
  ok('vehicle create nested photos', r.status === 201 && !!createdId, `status=${r.status}`)
}

// 9. Vehicle PATCH (interactive tx — runInTenantTx / no nested-tx throw)
{
  const r = await j(`/vehicles/${createdId}`, {
    method: 'PATCH',
    headers: auth,
    body: JSON.stringify({ price: 11000, photos: [{ url: 'https://example.com/p2.jpg', position: 0 }] }),
  })
  ok('vehicle patch nested tx', r.status === 200 && r.body?.price === 11000, `status=${r.status} price=${r.body?.price}`)
}

// 10. Lead create with vehicleInterests (nested-create fix)
{
  const r = await j('/leads', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ name: 'Smoke Lead', phone: '+5511988887777', source: 'FORM', vehicleInterests: [{ vehicleId: createdId }] }),
  })
  ok('lead create nested interests', r.status === 201, `status=${r.status}`)
}

// 11. Cleanup created vehicle (no content-type: Fastify 400s empty JSON bodies)
{
  const { 'content-type': _, ...noBody } = auth
  const r = await j(`/vehicles/${createdId}`, { method: 'DELETE', headers: noBody })
  ok('vehicle delete', r.status === 200 || r.status === 204, `status=${r.status}`)
}

console.log(results.join('\n'))
if (results.some((r) => r.startsWith('FAIL'))) process.exit(1)
