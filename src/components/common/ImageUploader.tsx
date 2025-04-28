import React, { useState, useCallback } from 'react';
import { Upload, X, AlertCircle, Loader2 } from 'lucide-react';
import { uploadImage } from '../../services/imageService';
import { supabase } from '../../services/supabaseClient';

interface ImageUploaderProps {
  onUpload: (file: File) => void;
  uploadedImage: string | null;
  floorTypeLabel: string;
  onFloorTypeChange: (floorType: string) => void;
  onImageUploaded?: (imageUrl: string) => void;
  onUploadOnly?: boolean; // Whether to only upload to local storage, not Cloudinary
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onUpload,
  uploadedImage,
  floorTypeLabel,
  onFloorTypeChange,
  onImageUploaded,
  onUploadOnly = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Maximum file size in bytes (10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

  const validateFile = (file: File): boolean => {
    setUploadError(null);
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`File size exceeds the maximum allowed size of 10MB`);
      return false;
    }
    
    // Check file format
    if (!ALLOWED_FORMATS.includes(file.type)) {
      setUploadError('Only JPEG, PNG, and WebP images are allowed');
      return false;
    }
    
    return true;
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('image/')) {
          if (validateFile(file)) {
            handleFileUpload(file);
          }
        } else {
          setUploadError('The dropped file is not an image');
        }
      }
    },
    [onUpload]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        if (validateFile(file)) {
          handleFileUpload(file);
        }
      }
    },
    [onUpload]
  );

  const handleFileUpload = async (file: File) => {
    try {
      // First handle the local UI update
      onUpload(file);
      
      // If we're only handling local upload, we're done here
      if (onUploadOnly) {
        return;
      }
      
      // Otherwise, proceed with Cloudinary upload if we have a user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('User not authenticated, skipping Cloudinary upload');
        return;
      }
  
      setIsUploading(true);
      setUploadProgress(0);
  
      // Simulate progress updates until we get back a response
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 5;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return newProgress;
        });
      }, 300);
  
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          
          // Upload to Cloudinary
          const result = await uploadImage(base64Data, user.id, {
            style: floorTypeLabel || 'floor',
            type: 'image'
          });
  
          clearInterval(progressInterval);
          
          if (result) {
            setUploadProgress(100);
            // Notify parent component of the Cloudinary URL if needed
            if (onImageUploaded) {
              onImageUploaded(result.url);
            }
          } else {
            setUploadError('Failed to upload image to cloud storage');
            setUploadProgress(0);
          }
        } catch (error) {
          console.error('Error uploading to Cloudinary:', error);
          setUploadError('Error uploading image to cloud storage');
        } finally {
          setIsUploading(false);
        }
      };
      
      reader.onerror = () => {
        clearInterval(progressInterval);
        setUploadError('Error reading file');
        setIsUploading(false);
        setUploadProgress(0);
      };
    } catch (error) {
      console.error('Error in handleFileUpload:', error);
      setUploadError('An unexpected error occurred');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClearImage = useCallback(() => {
    onUpload(null as unknown as File);
    setUploadError(null);
    setUploadProgress(0);
  }, [onUpload]);

  return (
    <div className="space-y-4">
      {uploadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 mb-4">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}
      
      <div
        className={`relative h-64 mb-3 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-white bg-gray-800'
            : 'border-gray-400 hover:border-gray-200'
        } ${uploadedImage ? 'bg-transparent' : 'bg-gray-800 bg-opacity-50'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {isUploading && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-70 z-10 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-white animate-spin mb-2" />
            <p className="text-white">Uploading image... {uploadProgress}%</p>
            <div className="w-64 bg-gray-700 h-2 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-white h-2 transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      
        {uploadedImage ? (
          <>
            <img
              src={uploadedImage}
              alt="Uploaded floor"
              className="h-full w-full object-contain rounded-lg"
            />
            <button
              onClick={handleClearImage}
              className="absolute top-2 right-2 bg-gray-900 bg-opacity-70 text-white p-1 rounded-full hover:bg-opacity-100 transition-opacity"
              disabled={isUploading}
            >
              <X className="h-5 w-5" />
            </button>
          </>
        ) : (
          <>
            <Upload className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-gray-300 mb-2 text-center px-4">
              Drag & drop your floor image here, or click to select
            </p>
            <p className="text-gray-400 text-sm text-center px-4">
              Supported formats: JPEG, PNG, WebP (Max 10MB)
            </p>
          </>
        )}
        
        {!isUploading && (
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
            accept="image/jpeg, image/png, image/webp"
            disabled={isUploading}
          />
        )}
      </div>
      
      {uploadedImage && (
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Floor Type Description
          </label>
          <input
            type="text"
            value={floorTypeLabel}
            onChange={(e) => onFloorTypeChange(e.target.value)}
            placeholder="Describe your floor (e.g., hardwood, marble, concrete)"
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-white"
            disabled={isUploading}
          />
        </div>
      )}
    </div>
  );
};

export default ImageUploader;