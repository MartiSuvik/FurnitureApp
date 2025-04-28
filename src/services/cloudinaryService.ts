import { supabase } from './supabaseClient';

// Allowed file formats
const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Cloudinary configuration
const cloudinaryConfig = {
  cloud_name: 'effichat',
  api_key: '656837556891128',
  secure: true
};

// Validation error types
export enum ValidationErrorType {
  FILE_SIZE_EXCEEDED = 'FILE_SIZE_EXCEEDED',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_INPUT = 'INVALID_INPUT'
}

// Upload error types
export enum UploadErrorType {
  NETWORK_FAILURE = 'NETWORK_FAILURE',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Retrieval error types
export enum RetrievalErrorType {
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  AUTHENTICATION_FAILURE = 'AUTHENTICATION_FAILURE',
  API_TIMEOUT = 'API_TIMEOUT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Error response interface
export interface ErrorResponse {
  type: ValidationErrorType | UploadErrorType | RetrievalErrorType;
  message: string;
  details?: any;
  timestamp: string;
  stack?: string;
  userContext?: any;
}

// Upload response interface
export interface UploadResponse {
  success: boolean;
  data?: any;
  error?: ErrorResponse;
}

// Interface for Cloudinary image data
export interface CloudinaryImage {
  cloudinary_id: string;
  public_id: string;
  url: string;
  secure_url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  resource_type: string;
  tags: string[];
  created_at: string;
  type?: string;
  prompt?: string;
  style?: string;
}

/**
 * Validates file before upload
 * @param file - Base64 or URL of the file to validate
 * @param fileSize - Size of the file in bytes
 * @param fileFormat - Format of the file
 * @returns {boolean | ErrorResponse} - true if valid, error response if invalid
 */
const validateFile = (
  file: string,
  fileSize?: number,
  fileFormat?: string
): boolean | ErrorResponse => {
  // Check if input is base64 or URL
  const isBase64 = file.startsWith('data:');
  const isUrl = file.startsWith('http');

  if (!isBase64 && !isUrl) {
    return {
      type: ValidationErrorType.INVALID_INPUT,
      message: 'Input must be a base64 encoded image or a valid URL',
      timestamp: new Date().toISOString()
    };
  }

  // Check file size for base64
  if (isBase64 && fileSize && fileSize > MAX_FILE_SIZE) {
    return {
      type: ValidationErrorType.FILE_SIZE_EXCEEDED,
      message: `File size exceeds the maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      details: { size: fileSize, maxSize: MAX_FILE_SIZE },
      timestamp: new Date().toISOString()
    };
  }

  // Check file format - only if explicitly provided for validation
  if (fileFormat && !ALLOWED_FORMATS.includes(fileFormat.toLowerCase())) {
    return {
      type: ValidationErrorType.INVALID_FORMAT,
      message: `Invalid file format. Allowed formats are: ${ALLOWED_FORMATS.join(', ')}`,
      details: { format: fileFormat, allowedFormats: ALLOWED_FORMATS },
      timestamp: new Date().toISOString()
    };
  }

  // For base64 images, also check the mime type in the data URL
  if (isBase64) {
    const mimeMatch = file.match(/data:image\/([a-zA-Z0-9]+);base64/);
    if (!mimeMatch) {
      return {
        type: ValidationErrorType.INVALID_FORMAT,
        message: 'Invalid base64 image format. Cannot determine MIME type.',
        timestamp: new Date().toISOString()
      };
    }
    
    const mimeFormat = mimeMatch[1].toLowerCase();
    if (!ALLOWED_FORMATS.includes(mimeFormat)) {
      return {
        type: ValidationErrorType.INVALID_FORMAT,
        message: `Invalid image format: ${mimeFormat}. Allowed formats are: ${ALLOWED_FORMATS.join(', ')}`,
        details: { format: mimeFormat, allowedFormats: ALLOWED_FORMATS },
        timestamp: new Date().toISOString()
      };
    }
  }

  return true;
};

/**
 * Logs an error
 * @param error - The error to log
 * @param userContext - User context information
 */
const logError = (error: any, userContext?: any): void => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: error.message || 'Unknown error',
    type: error.type || 'UNKNOWN_ERROR',
    stack: error.stack,
    details: error.details,
    userContext
  };

  console.error('Cloudinary Error:', errorLog);
  
  // In a production environment, you might want to send this to a logging service
  // or store it in your database for later analysis
};

/**
 * Uploads an image to Cloudinary using the browser-friendly upload endpoint
 * @param file - Base64 or URL of the image to upload
 * @param userId - ID of the user uploading the image
 * @param metadata - Additional metadata for the image
 * @returns {Promise<UploadResponse>} - Upload response
 */
export const uploadImage = async (
  file: string,
  userId: string,
  metadata: {
    prompt?: string;
    style?: string;
    type?: string;
  } = {}
): Promise<UploadResponse> => {
  const timestamp = Date.now();
  const uniqueIdentifier = `${userId}_${timestamp}`;
  const userContext = { userId, timestamp };

  try {
    // Extract file information for validation
    let fileSize: number | undefined;
    let fileFormat: string | undefined;

    if (file.startsWith('data:')) {
      // For base64, calculate size and extract format
      const base64Data = file.split(',')[1];
      fileSize = Math.ceil((base64Data.length * 3) / 4);
      const mimeMatch = file.match(/data:image\/([a-zA-Z0-9]+);base64/);
      fileFormat = mimeMatch ? mimeMatch[1] : undefined;
    }

    // Validate file
    const validationResult = validateFile(file, fileSize, fileFormat);
    if (validationResult !== true) {
      logError(validationResult, userContext);
      return {
        success: false,
        error: validationResult as ErrorResponse
      };
    }

    // Use the Fetch API to upload to Cloudinary's direct upload endpoint
    const formData = new FormData();
    
    // If file is base64, convert to blob
    let fileToUpload;
    if (file.startsWith('data:')) {
      // Convert base64 to Blob
      const base64Response = await fetch(file);
      fileToUpload = await base64Response.blob();
    } else {
      // For URL, we'll need a server-side proxy, but for now we'll handle as error
      throw {
        type: ValidationErrorType.INVALID_INPUT,
        message: 'URL uploads require server-side processing and are not supported in the browser'
      };
    }
    
    // Add upload parameters
    formData.append('file', fileToUpload);
    formData.append('upload_preset', 'Image_Gen'); // Create an unsigned upload preset in Cloudinary dashboard
    formData.append('cloud_name', cloudinaryConfig.cloud_name);
    formData.append('public_id', uniqueIdentifier);
    formData.append('folder', `/generated_interiors/${userId}/`);
    formData.append('tags', `user_${userId},interior_design,generated`);
    
    // Perform upload with retry mechanism
    let retryAttempts = 0;
    const maxRetries = 3;
    const retryDelay = 1000;

    const performUpload = async (): Promise<any> => {
      try {
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}/image/upload`,
          {
            method: 'POST',
            body: formData
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw {
            type: UploadErrorType.UNKNOWN_ERROR,
            message: errorData.error?.message || 'Upload failed',
            details: errorData
          };
        }
        
        return await response.json();
      } catch (error: any) {
        if (retryAttempts < maxRetries) {
          retryAttempts++;
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return performUpload();
        }
        throw error;
      }
    };

    const uploadResult = await performUpload();

    // Store metadata in Supabase
    const { data: imageData, error: dbError } = await supabase
      .from('images')
      .insert({
        user_id: userId,
        cloudinary_id: uploadResult.asset_id,
        public_id: uploadResult.public_id,
        url: uploadResult.url,
        secure_url: uploadResult.secure_url,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
        bytes: uploadResult.bytes,
        resource_type: uploadResult.resource_type,
        tags: uploadResult.tags,
        created_at: new Date().toISOString(),
        type: metadata.type || 'image',
        prompt: metadata.prompt,
        style: metadata.style
      })
      .select()
      .single();

    if (dbError) {
      throw {
        type: UploadErrorType.UNKNOWN_ERROR,
        message: 'Failed to store image metadata in database',
        details: dbError
      };
    }

    return {
      success: true,
      data: imageData
    };
  } catch (error: any) {
    // Map Cloudinary errors to our error types
    let errorType = UploadErrorType.UNKNOWN_ERROR;
    let errorMessage = 'An unknown error occurred during upload';

    if (error.status === 401) {
      errorType = UploadErrorType.INVALID_CREDENTIALS;
      errorMessage = 'Invalid Cloudinary credentials';
    } else if (error.status === 429) {
      errorType = UploadErrorType.RATE_LIMIT_EXCEEDED;
      errorMessage = 'Rate limit exceeded';
    } else if (error.message && error.message.includes('network')) {
      errorType = UploadErrorType.NETWORK_FAILURE;
      errorMessage = 'Network failure during upload';
    } else if (error.message && error.message.includes('quota')) {
      errorType = UploadErrorType.STORAGE_QUOTA_EXCEEDED;
      errorMessage = 'Storage quota exceeded';
    }

    const errorResponse: ErrorResponse = {
      type: errorType,
      message: errorMessage,
      details: error,
      timestamp: new Date().toISOString(),
      stack: error.stack,
      userContext
    };

    logError(errorResponse, userContext);

    return {
      success: false,
      error: errorResponse
    };
  }
};

/**
 * Retrieves images for a user from Cloudinary via Supabase
 * @param userId - ID of the user
 * @param page - Page number for pagination
 * @param pageSize - Number of images per page
 * @returns {Promise<any>} - Retrieved images
 */
export const getImages = async (
  userId: string,
  page: number = 1,
  pageSize: number = 12
): Promise<any> => {
  const userContext = { userId, page, pageSize };

  try {
    // Calculate offset for pagination
    const offset = (page - 1) * pageSize;

    // Query images from Supabase
    const { data: images, error, count } = await supabase
      .from('images')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw {
        type: RetrievalErrorType.UNKNOWN_ERROR,
        message: 'Failed to retrieve images from database',
        details: error
      };
    }

return {
      success: true,
      data: {
        images,
        pagination: {
          currentPage: page,
          pageSize,
          totalImages: count,
          totalPages: Math.ceil(count! / pageSize)
}
      }
    };
  } catch (error: any) {
    // Map errors to our error types
    let errorType = RetrievalErrorType.UNKNOWN_ERROR;
    let errorMessage = 'An unknown error occurred during retrieval';

    if (error.code === 'PGRST116') {
      errorType = RetrievalErrorType.INVALID_PARAMETERS;
      errorMessage = 'Invalid parameters provided for retrieval';
    } else if (error.code === '42P01') {
      errorType = RetrievalErrorType.RESOURCE_NOT_FOUND;
      errorMessage = 'Resource not found';
    } else if (error.code === '28P01') {
      errorType = RetrievalErrorType.AUTHENTICATION_FAILURE;
      errorMessage = 'Authentication failure';
    } else if (error.code === '57014') {
      errorType = RetrievalErrorType.API_TIMEOUT;
      errorMessage = 'API timeout';
    }

    const errorResponse: ErrorResponse = {
      type: errorType,
      message: errorMessage,
      details: error,
      timestamp: new Date().toISOString(),
      stack: error.stack,
      userContext
    };

    logError(errorResponse, userContext);

    return {
      success: false,
      error: errorResponse
    };
  }
};

/**
 * Deletes an image from Cloudinary and Supabase
 * @param imageId - ID of the image in Supabase
 * @param userId - ID of the user
 * @returns {Promise<any>} - Delete response
 */
export const deleteImage = async (
  imageId: string,
  userId: string
): Promise<any> => {
  const userContext = { userId, imageId };

  try {
    // First check if the image exists in Supabase
    const { error: existsError, count } = await supabase
      .from('images')
      .select('*', { count: 'exact', head: true })
      .eq('id', imageId)
      .eq('user_id', userId);

    // If the image doesn't exist or there was an error checking
    if (existsError || count === 0) {
      return {
        success: true,
        data: { 
          id: imageId, 
          note: "Image not found in database. No action needed." 
        }
      };
    }

    // If the image exists, get the public_id for Cloudinary deletion
    const { data: image, error: fetchError } = await supabase
      .from('images')
      .select('public_id')
      .eq('id', imageId)
      .eq('user_id', userId)
      .maybeSingle();  // Use maybeSingle instead of single to avoid error when no rows found

    if (fetchError) {
      console.warn("Could not fetch image details:", fetchError);
    }

    // Only proceed with deletion if we found the image
    if (image) {
      // For Cloudinary deletion, we need to use a server endpoint or function
      // This would require a server-side component, so for now just delete from Supabase
      // In a production app, you would implement a secure server endpoint for this

      // Delete from Supabase
      const { error: deleteError } = await supabase
        .from('images')
        .delete()
        .eq('id', imageId)
        .eq('user_id', userId);

      if (deleteError) {
        throw {
          type: UploadErrorType.UNKNOWN_ERROR,
          message: 'Failed to delete image metadata from database',
          details: deleteError
        };
      }

      return {
        success: true,
        data: { id: imageId, note: "Image deleted from database. For Cloudinary deletion, a server-side endpoint is required." }
      };
    } else {
      // Image not found in the second query, but existed in the first count query
      // This is an edge case that should rarely happen
      return {
        success: true,
        data: { id: imageId, note: "Image may have been deleted already or is inaccessible." }
      };
    }
  } catch (error: any) {
    const errorResponse: ErrorResponse = {
      type: RetrievalErrorType.UNKNOWN_ERROR,
      message: 'An unknown error occurred during deletion',
      details: error,
      timestamp: new Date().toISOString(),
      stack: error.stack,
      userContext
    };

    logError(errorResponse, userContext);

    return {
      success: false,
      error: errorResponse
    };
  }
};

/**
 * Generates a Cloudinary transformation URL
 * @param imageUrl - Original Cloudinary URL
 * @param width - Desired width
 * @param format - Desired format
 * @param quality - Desired quality
 * @returns {string} - Transformed URL
 */
export const getTransformedImageUrl = (
  imageUrl: string,
  width: number = 800,
  format: string = 'auto',
  quality: string = 'auto'
): string => {
  // Check if it's already a Cloudinary URL
  if (!imageUrl.includes('cloudinary.com')) {
    return imageUrl;
  }

  // Extract base URL and public ID from the Cloudinary URL
  const [baseUrl, publicIdPath] = imageUrl.split('/image/upload/');
  
  if (!baseUrl || !publicIdPath) {
    return imageUrl;
  }

  // Construct transformation string
  const transformation = `w_${width},f_${format},q_${quality}`;
  
  // Return transformed URL
  return `${baseUrl}/image/upload/${transformation}/${publicIdPath}`;
};

export default {
  uploadImage,
  getImages,
  deleteImage,
  getTransformedImageUrl
};