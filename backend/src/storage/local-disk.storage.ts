import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { Injectable, Logger } from '@nestjs/common'
import { ObjectStorage } from './object-storage'

export const UPLOADS_URL_PREFIX = '/uploads/'

export function uploadsRootDir(): string {
  return resolve(process.env.UPLOADS_DIR ?? 'uploads')
}

// Keys are generated internally (never from user input), but delete() takes a
// key derived from a DB url — reject anything that could escape the root.
function assertSafeKey(key: string) {
  if (!/^[\w\-./]+$/.test(key) || key.includes('..') || key.startsWith('/')) {
    throw new Error(`Unsafe storage key: ${key}`)
  }
}

@Injectable()
export class LocalDiskStorage extends ObjectStorage {
  private readonly logger = new Logger(LocalDiskStorage.name)
  private readonly root = uploadsRootDir()

  async put(key: string, data: Buffer): Promise<void> {
    assertSafeKey(key)
    const path = join(this.root, key)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, data)
  }

  async delete(key: string): Promise<void> {
    assertSafeKey(key)
    try {
      await rm(join(this.root, key), { force: true })
    } catch (e) {
      this.logger.warn(`Failed to delete ${key}: ${e}`)
    }
  }

  publicUrl(key: string): string {
    // Relative URL: browser hits the Nuxt BFF, which proxies /uploads/** here.
    return `${UPLOADS_URL_PREFIX}${key}`
  }

  keyFromUrl(url: string): string | null {
    if (!url.startsWith(UPLOADS_URL_PREFIX)) return null
    const key = url.slice(UPLOADS_URL_PREFIX.length)
    return /^[\w\-./]+$/.test(key) && !key.includes('..') ? key : null
  }
}
