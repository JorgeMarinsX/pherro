import { Prisma } from '@prisma/client'
import { TenantContext } from '../tenant/tenant-context'

// Tenant table has no tenantId / no RLS.
const UNSCOPED = new Set(['Tenant'])

// where accepts arbitrary filters → safe to add tenantId.
const FILTERABLE = new Set([
  'findFirst', 'findFirstOrThrow', 'findMany', 'count', 'aggregate', 'groupBy',
  'updateMany', 'deleteMany',
])
// where must be a unique input → cannot add tenantId; RLS GUC backstops these.
const CREATES = new Set(['create', 'createMany'])

function injectWhere(args: any, tenantId: string) {
  args.where = { ...(args.where ?? {}), tenantId }
}

function injectData(data: any, tenantId: string) {
  if (Array.isArray(data)) data.forEach((row) => (row.tenantId ??= tenantId))
  else if (data) data.tenantId ??= tenantId
}

export const tenantExtension = Prisma.defineExtension((client) =>
  client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (model && UNSCOPED.has(model)) return query(args)
          if (TenantContext.isPlatformAdmin()) return query(args)

          const tenantId = TenantContext.tenantId()
          if (!tenantId) return query(args)

          const a: any = args ?? {}
          if (FILTERABLE.has(operation)) injectWhere(a, tenantId)
          if (CREATES.has(operation)) injectData(a.data, tenantId)
          if (operation === 'upsert') {
            injectData(a.create, tenantId)
            injectData(a.update, tenantId)
          }

          // Inside runInTenantTx the GUC is already bound by the outer tx —
          // wrapping again would nest-throw. Just run the (injected) query.
          if (TenantContext.inTenantTx()) return query(a)

          // RLS backstop: bind app.current_tenant to this query's transaction.
          // Covers findUnique/update/delete/upsert where tenantId can't go in `where`.
          const [, result] = (await (client as any).$transaction([
            (client as any).$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`,
            query(a),
          ])) as [unknown, unknown]
          return result
        },
      },
    },
  }),
)
