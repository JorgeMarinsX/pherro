// Storage abstraction. Local disk today; an S3/CDN driver later only has to
// implement this contract — DB rows store the final public URL, so swapping
// drivers never touches the frontend or the vehicle API.
export abstract class ObjectStorage {
  abstract put(key: string, data: Buffer, contentType: string): Promise<void>
  abstract delete(key: string): Promise<void>
  /** Public URL persisted in DB and rendered by the storefront. */
  abstract publicUrl(key: string): string
  /** Inverse of publicUrl. Null = URL not owned by this storage (external/seed). */
  abstract keyFromUrl(url: string): string | null
  /** Total stored bytes under a key prefix (e.g. `vehicle-photos/<tenantId>`). */
  abstract usedBytes(prefix: string): Promise<number>
}
