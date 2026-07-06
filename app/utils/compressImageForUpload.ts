// Downscale + re-encode to WebP in the browser (phone JPEGs are 3–8 MB; this
// sends ~10x less). Any failure (e.g. undecodable format) falls back to the
// original file — the server validates for real.
export async function compressImageForUpload(
  file: File,
  maxEdge = 2000,
  quality = 0.85,
): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/webp', quality),
    )
    return blob && blob.size < file.size ? blob : file
  } catch {
    return file
  }
}
