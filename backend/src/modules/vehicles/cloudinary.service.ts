import cloudinary from '../../config/cloudinary.config';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import streamifier from 'streamifier';

interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
}

export class CloudinaryService {
  async uploadImage(
    fileBuffer: Buffer,
    folder: string,
    fileName?: string
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: fileName,
          transformation: [
            { width: 1920, height: 1080, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' },
          ],
          resource_type: 'image',
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            return reject(new Error(`Upload failed: ${error.message}`));
          }
          
          if (!result) {
            return reject(new Error('Upload failed: No result'));
          }

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
          });
        }
      );

      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
  }

  async uploadMultiple(files: Express.Multer.File[], folder: string): Promise<UploadResult[]> {
    const uploadPromises = files.map((file, index) => {
      const fileName = `${Date.now()}_${index}`;
      return this.uploadImage(file.buffer, folder, fileName);
    });

    return Promise.all(uploadPromises);
  }

  async deleteImage(publicId: string): Promise<void> {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result !== 'ok') {
      throw new Error(`Failed to delete image: ${result.result}`);
    }
  }

  async deleteMultiple(publicIds: string[]): Promise<void> {
    const deletePromises = publicIds.map(id => this.deleteImage(id));
    await Promise.all(deletePromises);
  }
}