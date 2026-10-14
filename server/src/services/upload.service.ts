import { randomBytes } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { Role } from '../../../shared/src/enums.js';
import type { ImageDTO } from '../../../shared/src/types.js';
import { appConfig } from '../config/env.js';
import {
  deleteImageFromCloudinary,
  isCloudinaryConfigured,
  isManagedPublicId,
  uploadImageToCloudinary,
} from '../config/cloudinary.js';
import { Upload, type UploadStorage } from '../models/index.js';
import type { ParsedFile } from '../types/express.js';
import { badGateway, badRequest, forbidden, notFound, serviceUnavailable } from '../utils/errors.js';
import { sanitizeFilename } from '../utils/files.js';
import { logger } from '../utils/logger.js';

interface AuthedUser {
  _id: any;
  role: Role;
}

function usesCloudinary(): boolean {
  return appConfig.imageStorage === 'cloudinary';
}

async function storeLocal(buffer: Buffer, filename: string): Promise<ImageDTO> {
  const dir = path.resolve(process.cwd(), appConfig.localUploadDir);
  await fs.mkdir(dir, { recursive: true });
  const ext = path.extname(filename).toLowerCase();
  const base = sanitizeFilename(path.basename(filename, ext)) || 'image';
  const savedName = `${base}-${randomBytes(8).toString('hex')}${ext}`;
  await fs.writeFile(path.join(dir, savedName), buffer);
  return {
    url: `/uploads/${savedName}`,
    publicId: savedName,
    format: ext.slice(1),
    bytes: buffer.length,
  };
}

async function persistOwnership(
  userId: string,
  image: ImageDTO,
  storage: UploadStorage
): Promise<void> {
  await Upload.create({
    user: userId,
    publicId: image.publicId,
    url: image.url,
    thumbnailUrl: image.thumbnailUrl,
    format: image.format,
    width: image.width,
    height: image.height,
    bytes: image.bytes,
    storage,
  });
}

export async function storeImages(userId: string, files: ParsedFile[]): Promise<ImageDTO[]> {
  const results: ImageDTO[] = [];

  for (const file of files) {
    const safeName = sanitizeFilename(file.filename) || 'image';

    if (usesCloudinary()) {
      if (!isCloudinaryConfigured()) {
        throw serviceUnavailable('Image storage is not configured.');
      }

      let uploaded;
      try {
        uploaded = await uploadImageToCloudinary(file.buffer);
      } catch (error) {
        logger.error(
          { message: error instanceof Error ? error.message : 'unknown error' },
          'Cloudinary image upload failed'
        );
        throw badGateway('Image upload failed. Please try again.');
      }

      const image: ImageDTO = {
        url: uploaded.url,
        publicId: uploaded.publicId,
        thumbnailUrl: uploaded.thumbnailUrl,
        format: uploaded.format,
        width: uploaded.width,
        height: uploaded.height,
        bytes: uploaded.bytes,
      };
      await persistOwnership(userId, image, 'cloudinary');
      results.push(image);
      continue;
    }

    const image = await storeLocal(file.buffer, safeName);
    await persistOwnership(userId, image, 'local');
    results.push(image);
  }

  return results;
}

async function removeLocalFile(publicId: string): Promise<void> {
  const safeName = path.basename(publicId);
  if (!safeName || safeName !== publicId || safeName.includes('..')) {
    throw forbidden('This image cannot be deleted.');
  }
  const dir = path.resolve(process.cwd(), appConfig.localUploadDir);
  const target = path.resolve(dir, safeName);
  if (path.dirname(target) !== dir) {
    throw forbidden('This image cannot be deleted.');
  }
  try {
    await fs.unlink(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

export async function deleteUploadedImage(user: AuthedUser, rawPublicId: string): Promise<void> {
  let publicId = rawPublicId;
  try {
    publicId = decodeURIComponent(rawPublicId);
  } catch {
    throw badRequest('Invalid image identifier');
  }

  if (!publicId || publicId.length > 300 || publicId.includes('..')) {
    throw badRequest('Invalid image identifier');
  }

  const record = await Upload.findOne({ publicId });
  if (!record) throw notFound('Image not found');

  const isOwner = String(record.user) === String(user._id);
  if (!isOwner && user.role !== Role.ADMIN) {
    throw forbidden('You can only delete your own images.');
  }

  if (record.storage === 'cloudinary') {
    if (!isManagedPublicId(record.publicId)) {
      throw forbidden('This image cannot be deleted.');
    }
    try {
      await deleteImageFromCloudinary(record.publicId);
    } catch (error) {
      logger.error(
        { message: error instanceof Error ? error.message : 'unknown error' },
        'Cloudinary image deletion failed'
      );
      throw badGateway('Could not delete image. Please try again.');
    }
  } else {
    try {
      await removeLocalFile(record.publicId);
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) throw error;
      logger.error(
        { message: error instanceof Error ? error.message : 'unknown error' },
        'Local image deletion failed'
      );
      throw badGateway('Could not delete image. Please try again.');
    }
  }

  await record.deleteOne();
}
