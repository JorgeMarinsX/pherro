// Per-tenant throttle check (60/min). Run: docker compose exec -e SMOKE_TENANT_ID=<a> -e SMOKE_TENANT_ID_2=<b> backend bun run scripts/smoke-throttle.ts
const BASE = 'http://localhost:3001'
const DEV = process.env.SMOKE_TENANT_ID!
const LOJA2 = process.env.SMOKE_TENANT_ID_2!

let last = 0
for (let i = 0; i < 70; i++) {
  const r = await fetch(`${BASE}/vehicles`, { headers: { 'x-tenant-id': DEV } })
  last = r.status
}
console.log(`dev tenant after 70 reqs: ${last} (expect 429)`)

const other = await fetch(`${BASE}/vehicles`, { headers: { 'x-tenant-id': LOJA2 } })
console.log(`loja2 same IP right after: ${other.status} (expect 200 — separate bucket)`)
process.exit(last === 429 && other.status === 200 ? 0 : 1)
