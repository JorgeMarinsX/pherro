import { Global, Module } from '@nestjs/common'
import { LocalDiskStorage } from './local-disk.storage'
import { ObjectStorage } from './object-storage'

// Global: photos are written by uploads and cleaned up by vehicles.
// S3 later: add an S3 driver and pick by STORAGE_DRIVER env here.
@Global()
@Module({
  providers: [{ provide: ObjectStorage, useClass: LocalDiskStorage }],
  exports: [ObjectStorage],
})
export class StorageModule {}
