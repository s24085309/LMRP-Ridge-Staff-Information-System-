import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

// Section 17 — no executables, reasonable size limit. Extend this list
// deliberately; never widen it just to unblock a specific upload.
const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/gif": ".gif",
};

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15MB

export interface UploadValidationError {
  error: string;
}

export interface StoredUpload {
  storageKey: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export function validateUpload(file: File): UploadValidationError | null {
  if (file.size === 0) return { error: "The selected file is empty." };
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: `File is too large — the limit is ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB.` };
  }
  if (!ALLOWED_TYPES[file.type]) {
    return { error: "That file type isn't allowed. Allowed: PDF, Word, Excel, PowerPoint, PNG, JPG, GIF." };
  }
  return null;
}

const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");

export async function storeUpload(file: File): Promise<StoredUpload> {
  await mkdir(UPLOAD_DIR, { recursive: true });

  const extension = ALLOWED_TYPES[file.type] ?? "";
  const storageKey = `${crypto.randomUUID()}${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, storageKey), buffer);

  return {
    storageKey,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
  };
}
