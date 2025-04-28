import React, { useState } from 'react';
import { Download, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { ImageType } from '../types';
import { uploadImage } from '../../../services/imageService';
import { supabase } from '../../../services/supabaseClient';

interface PreviewWindowProps {
  images: ImageType[];
  onRegenerateImage: (index: number) => Promise<void>;
  onImageApproved: (imageUrl: string) => void;
}

const PreviewWindow: React.FC<PreviewWindowProps> = ({ 
  images, 
  onRegenerateImage,
  onImageApproved 
}) => {
  const [approvingIndex, setApprovingIndex] = useState<number | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApproveImage = async (image: ImageType, index: number) => {
    setError(null);
    setApprovingIndex(index);
    
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('You must be signed in to approve images');
        return;
      }
      
      // Upload the image to Cloudinary
      // No need to validate image format - this will be handled by the upload service
      // The image.url is already either a base64 string or a regular URL
      const uploadedImage = await uploadImage(image.url, user.id, {
        prompt: image.prompt,
        style: image.style,
        type: 'image'
      });
      
      if (uploadedImage) {
        // Notify parent component about the successful upload
        onImageApproved(uploadedImage.url);
      } else {
        setError('Failed to upload image to cloud storage');
      }
    } catch (err) {
      console.error('Error approving image:', err);
      setError('An error occurred while approving the image');
    } finally {
      setApprovingIndex(null);
    }
  };

  const handleRegenerateImage = async (index: number) => {
    setError(null);
    setRegeneratingIndex(index);
    
    try {
      await onRegenerateImage(index);
    } catch (err) {
      console.error('Error regenerating image:', err);
      setError('Failed to regenerate the image');
    } finally {
      setRegeneratingIndex(null);
    }
  };

  if (images.length === 0) {
    return (
      <div className="h-64 bg-gray-800 bg-opacity-50 rounded-lg flex items-center justify-center">
        <p className="text-gray-400">
          Generated images will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        {images.map((image, index) => (
          <div key={index} className="relative group bg-gray-800 rounded-lg overflow-hidden">
            <img
              src={image.url}
              alt={`Generated image ${index + 1}`}
              className="w-full h-48 object-cover rounded-lg"
            />
            
            {(approvingIndex === index || regeneratingIndex === index) && (
              <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex flex-col items-center justify-center z-10">
                <Loader2 className="h-8 w-8 text-white animate-spin mb-2" />
                <p className="text-white text-sm">
                  {approvingIndex === index ? 'Saving to cloud...' : 'Regenerating...'}
                </p>
              </div>
            )}
            
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-200 rounded-lg flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-3">
                <button 
                  className="bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors"
                  onClick={() => window.open(image.url, '_blank')}
                >
                  <Download className="h-5 w-5" />
                </button>
                <button 
                  className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                  onClick={() => handleRegenerateImage(index)}
                  disabled={regeneratingIndex !== null || approvingIndex !== null}
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
                <button 
                  className="bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition-colors"
                  onClick={() => handleApproveImage(image, index)}
                  disabled={regeneratingIndex !== null || approvingIndex !== null}
                >
                  <CheckCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-3">
              <p className="text-white text-sm truncate">
                {image.style} style
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PreviewWindow;