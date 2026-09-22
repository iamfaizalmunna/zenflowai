import { createHash } from 'node:crypto';
import path from 'node:path';

const DEFAULT_MAX_MB = 10;

export function maxUploadBytes(): number {
  const raw = Number(process.env.MAX_FILE_SIZE_MB ?? DEFAULT_MAX_MB);
  const mb = Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_MAX_MB;
  return Math.round(mb * 1024 * 1024);
}

export function safeUploadFilename(name: string): string {
  const unified = name.replace(/\\/g, '/');
  const base = path.basename(unified).replace(/[^\w.\- ()]/g, '_').trim();
  const cleaned = base.replace(/^\.+/, '') || 'file';
  return cleaned.slice(0, 120);
}

export function resolveUploadDir(): string {
  const dir = process.env.UPLOAD_DIR?.trim() || path.join(process.cwd(), 'uploads');
  return path.resolve(dir);
}

export function attachmentStoragePath(ticketId: number, filename: string): string {
  const safe = safeUploadFilename(filename);
  const stamp = createHash('sha256').update(`${ticketId}:${safe}:${Date.now()}`).digest('hex').slice(0, 12);
  return path.join(String(ticketId), `${stamp}-${safe}`);
}

export function assertInsideUploadDir(fullPath: string): void {
  const root = resolveUploadDir();
  const resolved = path.resolve(fullPath);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    throw new Error('Invalid upload path');
  }
}

export function decodeBase64File(contentBase64: string): Buffer {
  const trimmed = contentBase64.replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '');
  return Buffer.from(trimmed, 'base64');
}
