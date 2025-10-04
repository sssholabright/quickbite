import { v2 as cloudinary, UploadApiOptions, UploadApiResponse } from 'cloudinary';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Configure Cloudinary
cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
    public_id: string;
    secure_url: string;
    width: number;
    height: number;
    format: string;
    resource_type: string;
    bytes: number;
}

export interface CloudinaryUploadOptions {
    folder?: string;
    transformation?: any;
    resource_type?: 'image' | 'video' | 'raw' | 'auto';
    format?: string;
    quality?: string | number;
    width?: number;
    height?: number;
    crop?: string;
    gravity?: string;
}

export class CloudinaryService {
    /**
     * Upload image to Cloudinary
     */
    static async uploadImage(
        file: Buffer | string,
        options: CloudinaryUploadOptions = {}
    ): Promise<CloudinaryUploadResult> {
        try {
            // 🚀 FIX: Simplified upload options to avoid transformation issues
            const uploadOptions = {
                folder: options.folder || 'quickbite',
                resource_type: 'image',
                quality: 'auto',
                // Remove all transformations for now to isolate the issue
                ...options
            };

            let result;
            if (Buffer.isBuffer(file)) {
                result = await cloudinary.uploader.upload(
                    `data:image/jpeg;base64,${file.toString('base64')}`,
                    uploadOptions as UploadApiOptions
                );
            } else {
                result = await cloudinary.uploader.upload(file, uploadOptions as UploadApiOptions);
            }

            logger.info(`Image uploaded to Cloudinary: ${result.public_id}`);

            return {
                public_id: result.public_id,
                secure_url: result.secure_url,
                width: result.width,
                height: result.height,
                format: result.format,
                resource_type: result.resource_type,
                bytes: result.bytes
            };
        } catch (error) {
            logger.error({ error }, 'Failed to upload image to Cloudinary');
            throw new Error('Failed to upload image');
        }
    }

    /**
     * Upload image with specific folder and transformations
     */
    static async uploadImageWithTransformations(
        file: Buffer | string,
        folder: string,
        transformations: any = {}
    ): Promise<CloudinaryUploadResult> {
        // 🚀 FIX: Simplified to avoid transformation issues
        const options: CloudinaryUploadOptions = {
            folder: `quickbite/${folder}`,
            quality: 'auto'
        };

        return this.uploadImage(file, options);
    }

    /**
     * Upload user avatar
     */
    static async uploadAvatar(file: Buffer | string, userId: string): Promise<CloudinaryUploadResult> {
        return this.uploadImageWithTransformations(file, 'avatars', {
            width: 300,
            height: 300,
            crop: 'fill',
            gravity: 'face',
            additional: [
                { radius: 'max' }, // Make it circular
                { border: '2px_solid_rgb:ffffff' }
            ]
        });
    }

    /**
     * Upload vendor logo
     */
    static async uploadVendorLogo(buffer: Buffer, vendorId: string): Promise<UploadApiResponse> {
        return new Promise((resolve, reject) => {
            const uploadOptions: UploadApiOptions = {
                resource_type: 'image',
                public_id: `vendors/logos/${vendorId}`,
                transformation: [
                    { width: 400, height: 400, crop: 'fill' },
                    { quality: 'auto' },
                    { format: 'webp' }
                ],
                folder: 'quickbite/vendors'
            };

            cloudinary.uploader.upload_stream(
                uploadOptions,
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else if (result) {
                        resolve(result);
                    } else {
                        reject(new Error('Upload failed'));
                    }
                }
            ).end(buffer);
        });
    }

    /**
     * Upload vendor cover image
     */
    static async uploadVendorCover(file: Buffer | string, vendorId: string): Promise<CloudinaryUploadResult> {
        return this.uploadImageWithTransformations(file, 'vendor-covers', {
            width: 1200,
            height: 400,
            crop: 'fill',
            gravity: 'center'
        });
    }

    /**
     * Upload menu item image
     */
    static async uploadMenuItemImage(file: Buffer | string, menuItemId: string): Promise<CloudinaryUploadResult> {
        return this.uploadImageWithTransformations(file, 'menu-items', {
            width: 600,
            height: 400,
            crop: 'fill',
            gravity: 'center',
            additional: [
                { radius: 8 }, // Rounded corners
            ]
        });
    }

    /**
     * Upload category image
     */
    static async uploadCategoryImage(file: Buffer | string, categoryId: string): Promise<CloudinaryUploadResult> {
        return this.uploadImageWithTransformations(file, 'categories', {
            width: 400,
            height: 300,
            crop: 'fill',
            gravity: 'center',
            additional: [
                { radius: 8 }, // Rounded corners
            ]
        });
    }

    /**
     * Delete image from Cloudinary
     */
    static async deleteImage(publicId: string): Promise<boolean> {
        try {
            const result = await cloudinary.uploader.destroy(publicId);
            
            if (result.result === 'ok') {
                logger.info(`Image deleted from Cloudinary: ${publicId}`);
                return true;
            } else {
                logger.warn(`Failed to delete image from Cloudinary: ${publicId}, result: ${result.result}`);
                return false;
            }
        } catch (error) {
            logger.error({ error, publicId }, 'Failed to delete image from Cloudinary');
            return false;
        }
    }

    /**
     * Delete multiple images from Cloudinary
     */
    static async deleteImages(publicIds: string[]): Promise<{ deleted: string[], failed: string[] }> {
        try {
            const result = await cloudinary.api.delete_resources(publicIds);
            
            const deleted = result.deleted ? Object.keys(result.deleted) : [];
            const failed = result.not_found || [];

            logger.info(`Bulk delete completed: ${deleted.length} deleted, ${failed.length} not found`);

            return { deleted, failed };
        } catch (error) {
            logger.error({ error, publicIds }, 'Failed to delete images from Cloudinary');
            return { deleted: [], failed: publicIds };
        }
    }

    /**
     * Extract public ID from Cloudinary URL
     */
    static extractPublicId(url: string): string | null {
        try {
            const match = url.match(/\/v\d+\/(.+)\.(jpg|jpeg|png|gif|webp)$/);
            return match?.[1] ?? null;
        } catch (error) {
            logger.error({ error, url }, 'Failed to extract public ID from URL');
            return null;
        }
    }

    /**
     * Get optimized image URL with transformations
     */
    static getOptimizedUrl(publicId: string, transformations: any = {}): string {
        return cloudinary.url(publicId, {
            transformation: [
                { width: transformations.width || 800, height: transformations.height || 600, crop: 'limit' },
                { quality: 'auto' }
                // 🚀 FIX: Removed fetch_format: 'auto' as it's invalid
            ]
        });
    }

    /**
     * Get thumbnail URL
     */
    static getThumbnailUrl(publicId: string, size: number = 150): string {
        return cloudinary.url(publicId, {
            transformation: [
                { width: size, height: size, crop: 'fill', gravity: 'center' },
                { quality: 'auto' }
                // 🚀 FIX: Removed fetch_format: 'auto' as it's invalid
            ]
        });
    }
}

export default CloudinaryService;