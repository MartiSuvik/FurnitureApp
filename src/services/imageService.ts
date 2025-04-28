import { supabase } from './supabaseClient';
import cloudinaryService, { CloudinaryImage } from './cloudinaryService';

// Image type for the application
export interface ImageType {
  id: string;
  url: string;
  prompt?: string;
  style: string;
  createdAt: Date;
}

// Convert Cloudinary image to application ImageType
const mapCloudinaryToImageType = (image: CloudinaryImage): ImageType => {
  return {
    id: image.cloudinary_id,
    url: cloudinaryService.getTransformedImageUrl(image.secure_url),
    prompt: image.prompt,
    style: image.style || 'default',
    createdAt: new Date(image.created_at)
  };
};

/**
 * Uploads an image to Cloudinary and stores metadata in Supabase
 * @param imageData - Base64 or URL of the image
 * @param userId - ID of the user uploading the image
 * @param metadata - Additional metadata for the image
 * @returns {Promise<ImageType | null>} - Uploaded image data or null if failed
 */
export const uploadImage = async (
  imageData: string,
  userId: string,
  metadata: {
    prompt?: string;
    style?: string;
    type?: string;
  } = {}
): Promise<ImageType | null> => {
  try {
    // For base64 data URIs, validation is already done in the cloudinaryService
    // So we'll simply pass it through to the upload service
    const result = await cloudinaryService.uploadImage(imageData, userId, metadata);
    
    if (!result.success || !result.data) {
      console.error('Error uploading image:', result.error);
      return null;
    }
    
    return mapCloudinaryToImageType(result.data);
  } catch (error) {
    console.error('Error in uploadImage:', error);
    return null;
  }
};

/**
 * Gets images for a user from Supabase with Cloudinary data
 * @param userId - ID of the user
 * @param page - Page number for pagination
 * @param pageSize - Number of images per page
 * @returns {Promise<{ images: ImageType[], pagination: any } | null>} - Images and pagination data or null if failed
 */
export const getImages = async (
  userId: string,
  page: number = 1,
  pageSize: number = 12
): Promise<{ images: ImageType[], pagination: any } | null> => {
  try {
    const result = await cloudinaryService.getImages(userId, page, pageSize);
    
    if (!result.success || !result.data) {
      console.error('Error getting images:', result.error);
      return null;
    }
    
    const images = result.data.images.map(mapCloudinaryToImageType);
    
    return {
      images,
      pagination: result.data.pagination
    };
  } catch (error) {
    console.error('Error in getImages:', error);
    return null;
  }
};

/**
 * Deletes an image from Cloudinary and Supabase
 * @param imageId - ID of the image
 * @param userId - ID of the user
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export const deleteImage = async (
  imageId: string,
  userId: string
): Promise<boolean> => {
  try {
    const result = await cloudinaryService.deleteImage(imageId, userId);
    return result.success;
  } catch (error) {
    console.error('Error in deleteImage:', error);
    return false;
  }
};

/**
 * Retrieves latest user images
 * @param userId - ID of the user
 * @param limit - Maximum number of images to retrieve
 * @returns {Promise<ImageType[]>} - Latest user images
 */
export const getLatestUserImages = async (
  userId: string,
  limit: number = 6
): Promise<ImageType[]> => {
  try {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'image')  // Only get images, not videos
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) {
      throw error;
    }
    
    return data.map(mapCloudinaryToImageType);
  } catch (error) {
    console.error('Error in getLatestUserImages:', error);
    return [];
  }
};

export default {
  uploadImage,
  getImages,
  deleteImage,
  getLatestUserImages
};