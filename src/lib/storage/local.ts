import { randomUUID } from "node:crypto";
import { writeFile, mkdir, unlink, stat } from "node:fs/promises";
import path from "node:path";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/constants";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

async function ensureUploadDir(): Promise<void> {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch {}
}

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export function getUploadUrl(key: string): string {
  return `/uploads/${key}`;
}

export function getUploadKey(filename: string): string {
  const date = new Date();
  const extension = path.extname(filename).toLowerCase().replace(".", "") || "jpg";
  const uuid = randomUUID();
  return `products/${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${uuid}.${extension}`;
}

export function isManagedKey(key: string): boolean {
  return /^products\/\d{4}\/\d{2}\/[a-z0-9-]+\.(jpg|jpeg|png|webp|avif)$/i.test(key);
}

export async function uploadLocalFile(
  file: File,
  ownerId: string
): Promise<{ key: string; url: string }> {
  await ensureUploadDir();

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Unsupported image type. Use JPG, PNG, WebP or AVIF.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image exceeds the 8 MB limit.");
  }

  const extension = EXTENSIONS[file.type];
  if (!extension) throw new Error("Unsupported image type.");

  const date = new Date();
  const key = `products/${ownerId}/${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.${extension}`;
  const filePath = path.join(UPLOAD_DIR, key);

  await mkdir(path.dirname(filePath), { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return { key, url: getUploadUrl(key) };
}

export async function verifyLocalFile(key: string): Promise<{
  exists: boolean;
  size?: number;
}> {
  if (!isManagedKey(key)) {
    throw new Error("Invalid storage key.");
  }
  const filePath = path.join(UPLOAD_DIR, key);
  try {
    const stats = await stat(filePath);
    return { exists: true, size: stats.size };
  } catch {
    return { exists: false };
  }
}

export async function deleteLocalFile(key: string): Promise<void> {
  if (!isManagedKey(key)) throw new Error("Invalid storage key.");
  const filePath = path.join(UPLOAD_DIR, key);
  try {
    await unlink(filePath);
  } catch {
    // File might not exist, that's ok
  }
}

export async function deleteOrphanedImages(productImageKeys: string[]): Promise<void> {
  await ensureUploadDir();
  
  const dir = path.join(UPLOAD_DIR, "products");
  try {
    const files = await listAllFiles(dir);
    const usedKeys = new Set(productImageKeys);
    
    for (const file of files) {
      const relativeKey = file.replace(UPLOAD_DIR + "/", "");
      if (!usedKeys.has(relativeKey) && isManagedKey(relativeKey)) {
        await unlink(file);
      }
    }
  } catch {
    // Directory might not exist
  }
}

async function listAllFiles(dir: string): Promise<string[]> {
  const { readdir } = await import("node:fs/promises");
  const result: string[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        result.push(...await listAllFiles(fullPath));
      } else {
        result.push(fullPath);
      }
    }
  } catch {
    // Ignore errors
  }
  return result;
}