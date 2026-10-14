import type { NextFunction, Request, Response } from 'express';
import { deleteUploadedImage, storeImages } from '../services/upload.service.js';
import { success } from '../utils/response.js';

export async function uploadImagesController(req: Request, res: Response, next: NextFunction) {
  try {
    const files = req.uploadedFiles ?? [];
    const images = await storeImages(String(req.user!._id), files);
    success(res, { images }, 'Images uploaded', 201);
  } catch (error) {
    next(error);
  }
}

export async function deleteImageController(req: Request, res: Response, next: NextFunction) {
  try {
    const publicId = req.params[0] ?? req.params.publicId ?? '';
    await deleteUploadedImage(req.user!, publicId);
    success(res, null, 'Image deleted');
  } catch (error) {
    next(error);
  }
}
