import { api } from './api';

/** The BE rejects anything over this, so uploads are re-encoded (and if need be recompressed) below it. */
const MAX_BYTES = 512 * 1024;
const QUALITIES = [0.82, 0.65, 0.5];

export const AVATAR_SIDE = 256;
export const COVER_SIDE = 1280;

/** Public URL of a stored image key (R2 behind the images domain). */
export const imageUrl = (key: string) => `${import.meta.env.VITE_IMAGES_URL ?? ''}/${key}`;

const encode = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));

/**
 * Re-encodes a picked photo as JPEG with its longest side at most `maxSide`; `square` centre-crops it first.
 * Done in the browser so the API never has to process images. JPEG because it is the one format every phone's
 * canvas can encode (Safari can't do WebP), and the photo picker already hands over iPhone HEIC as JPEG.
 */
export async function resizeToWebp(file: File, maxSide: number, square: boolean): Promise<Blob> {
  // Phone photos are stored sideways with an EXIF rotation; this makes the bitmap upright.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const src = square
      ? { x: (bitmap.width - side) / 2, y: (bitmap.height - side) / 2, w: side, h: side }
      : { x: 0, y: 0, w: bitmap.width, h: bitmap.height };
    const scale = Math.min(1, maxSide / Math.max(src.w, src.h));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(src.w * scale);
    canvas.height = Math.round(src.h * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not available');
    // JPEG has no transparency, so a transparent PNG would turn black.
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, src.x, src.y, src.w, src.h, 0, 0, canvas.width, canvas.height);

    for (const quality of QUALITIES) {
      const blob = await encode(canvas, quality);
      if (!blob || blob.type !== 'image/jpeg') throw new Error('This browser cannot encode JPEG images');
      if (blob.size <= MAX_BYTES) return blob;
    }
    throw new Error('Image is too large');
  } finally {
    bitmap.close();
  }
}

/** Gets a presigned URL for `path` (`<path>/upload-url`), PUTs the image to storage, then confirms it with the API. */
export async function uploadImage(blob: Blob, path: string): Promise<void> {
  const { uploadUrl, key } = await api.post<{ uploadUrl: string; key: string }>(`${path}/upload-url`, {});
  const res = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: blob });
  if (!res.ok) throw new Error(`Image upload failed: ${res.status}`);
  await api.put(path, { key });
}
