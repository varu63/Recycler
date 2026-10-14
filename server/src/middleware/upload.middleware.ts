import busboy from 'busboy';
import { NextFunction, Request, Response } from 'express';
import {
  UPLOAD_ALLOWED_EXTENSIONS,
  UPLOAD_ALLOWED_MIME_TYPES,
  UPLOAD_MAX_FILE_SIZE_BYTES,
  UPLOAD_MAX_FILES,
} from '../../../shared/src/constants.js';
import type { ParsedFile } from '../types/express.js';
import { badRequest } from '../utils/errors.js';
import { isValidImageExt } from '../utils/files.js';

function sniffImageType(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

function isUnsafeFilename(name: string): boolean {
  if (!name || name.length > 255) return true;
  if (name.includes('\0')) return true;
  if (name.includes('/') || name.includes('\\')) return true;
  if (name.split(/[\\/]/).some((part) => part === '..')) return true;
  if (name.startsWith('.')) return true;
  return false;
}

export function parseImages(req: Request, _res: Response, next: NextFunction): void {
  const contentType = String(req.headers['content-type'] || '');
  if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
    next(badRequest('Content type must be multipart/form-data'));
    return;
  }

  let bb: ReturnType<typeof busboy>;
  try {
    bb = busboy({
      headers: req.headers,
      limits: {
        files: UPLOAD_MAX_FILES,
        fileSize: UPLOAD_MAX_FILE_SIZE_BYTES,
        fields: 20,
        fieldSize: 10 * 1024,
      },
    });
  } catch {
    next(badRequest('Invalid multipart/form-data payload'));
    return;
  }

  const files: ParsedFile[] = [];
  let tooManyFiles = false;
  let oversized = false;
  let settled = false;

  const fail = (error: unknown): void => {
    if (settled) return;
    settled = true;
    req.unpipe(bb);
    next(error);
  };

  bb.on('filesLimit', () => {
    tooManyFiles = true;
  });

  bb.on('file', (_name, stream, info) => {
    const chunks: Buffer[] = [];
    let truncated = false;

    stream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    stream.on('limit', () => {
      truncated = true;
    });
    stream.on('error', (err) => fail(err));
    stream.on('close', () => {
      if (truncated) oversized = true;
      const buffer = Buffer.concat(chunks);
      files.push({
        filename: info.filename ?? '',
        mimeType: (info.mimeType ?? '').toLowerCase(),
        buffer,
        size: buffer.length,
      });
    });
  });

  bb.on('error', (err) => fail(err));

  bb.on('close', () => {
    if (settled) return;
    settled = true;
    try {
      if (tooManyFiles) {
        throw badRequest(`A maximum of ${UPLOAD_MAX_FILES} files is allowed`);
      }
      if (oversized) {
        throw badRequest(`Each file must be ${Math.floor(UPLOAD_MAX_FILE_SIZE_BYTES / (1024 * 1024))}MB or less`);
      }
      if (files.length === 0) {
        throw badRequest('At least one file is required');
      }
      if (files.length > UPLOAD_MAX_FILES) {
        throw badRequest(`A maximum of ${UPLOAD_MAX_FILES} files is allowed`);
      }

      for (const file of files) {
        if (isUnsafeFilename(file.filename)) {
          throw badRequest(`Invalid file name: ${file.filename}`);
        }
        const ext = file.filename.includes('.')
          ? file.filename.slice(file.filename.lastIndexOf('.')).toLowerCase()
          : '';
        if (!ext || !UPLOAD_ALLOWED_EXTENSIONS.includes(ext as any) || !isValidImageExt(ext)) {
          throw badRequest(`File type not allowed: ${file.filename}`);
        }
        if (!UPLOAD_ALLOWED_MIME_TYPES.includes(file.mimeType as any)) {
          throw badRequest(`File type not allowed: ${file.mimeType || 'unknown'}`);
        }
        if (file.size === 0) {
          throw badRequest(`File is empty: ${file.filename}`);
        }
        const sniffed = sniffImageType(file.buffer);
        if (!sniffed || sniffed !== file.mimeType) {
          throw badRequest(`File content does not match its declared type: ${file.filename}`);
        }
      }

      req.uploadedFiles = files;
      next();
    } catch (error) {
      next(error);
    }
  });

  req.pipe(bb);
}
