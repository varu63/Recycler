import { api, unwrap } from '@/lib/api';
import type { ApiResponse, ImageDTO } from '@/types';

export const uploadService = {
  async uploadImages(
    files: File[],
    onProgress?: (percent: number) => void
  ): Promise<ImageDTO[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const res = await api.post<ApiResponse<{ images: ImageDTO[] }>>('/uploads/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return;
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      },
    });
    return unwrap(res).images;
  },

  async uploadImage(file: File, onProgress?: (percent: number) => void): Promise<ImageDTO> {
    const [image] = await uploadService.uploadImages([file], onProgress);
    if (!image) throw new Error('Image upload failed. Please try again.');
    return image;
  },

  async deleteImage(publicId: string): Promise<void> {
    if (!publicId) return;
    await api.delete(`/uploads/image/${encodeURIComponent(publicId)}`);
  },
};
