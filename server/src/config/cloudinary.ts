import { randomBytes } from 'crypto';
import { v2 as cloudinary, type UploadApiOptions, type UploadApiResponse } from 'cloudinary';
import { CLOUDINARY_UPLOAD_FOLDER } from '../../../shared/src/constants.js';
import { appConfig } from './env.js';

export interface CloudinaryImage {
  url: string;
  publicId: string;
  thumbnailUrl?: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    appConfig.cloudinary.cloudName &&
      appConfig.cloudinary.apiKey &&
      appConfig.cloudinary.apiSecret
  );
}

export function configureCloudinary(): void {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary credentials are not configured');
  }
  cloudinary.config({
    cloud_name: appConfig.cloudinary.cloudName,
    api_key: appConfig.cloudinary.apiKey,
    api_secret: appConfig.cloudinary.apiSecret,
    secure: true,
  });
}

const PUBLIC_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9/_.-]*$/;

export function isManagedPublicId(publicId: string): boolean {
  if (!publicId || publicId.length > 300) return false;
  if (publicId.includes('..') || publicId.startsWith('/')) return false;
  if (!PUBLIC_ID_PATTERN.test(publicId)) return false;
  return publicId.startsWith(`${CLOUDINARY_UPLOAD_FOLDER}/`);
}

function buildThumbnailUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    width: 600,
    height: 600,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    fetch_format: 'auto',
    secure: true,
  });
}

export async function uploadImageToCloudinary(
  buffer: Buffer,
  folder = CLOUDINARY_UPLOAD_FOLDER
): Promise<CloudinaryImage> {
  const uniqueName = `${Date.now().toString(36)}-${randomBytes(12).toString('hex')}`;
  const opts: UploadApiOptions = {
    folder,
    public_id: uniqueName,
    resource_type: 'image',
    transformation: [{ quality: 'auto', fetch_format: 'auto', width: 1600, crop: 'limit' }],
    overwrite: false,
    use_filename: false,
    unique_filename: false,
  };

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(opts, (err, res) => {
        if (err || !res) {
          reject(err ?? new Error('Cloudinary upload returned no result'));
          return;
        }
        resolve(res);
      })
      .end(buffer);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    thumbnailUrl: buildThumbnailUrl(result.public_id),
    format: result.format,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
  };
}

export async function deleteImageFromCloudinary(
  publicId: string
): Promise<{ result: string }> {
  if (!isManagedPublicId(publicId)) {
    throw new Error('Refusing to delete an unmanaged Cloudinary asset');
  }
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: 'image',
    invalidate: true,
  });
  return { result: result.result };
}
