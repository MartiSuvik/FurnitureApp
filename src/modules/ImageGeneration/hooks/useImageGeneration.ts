import { useState, useCallback } from 'react';
import { ImageType, PresetTemplate } from '../types';
import { generateImages } from '../../../services/apiService';
import { supabase } from '../../../services/supabaseClient';

// Preset templates
export const presetTemplates: PresetTemplate[] = [
  {
    id: 'living-room',
    name: 'Living Room',
    description: 'Modern living room interior with the specified flooring',
    promptTemplate: "Generate a modern living room interior where the {floorType} flooring is the focal point. Ensure the floor dominates the composition while maintaining a balanced, realistic interior design. The floor should cover 40% of the image area. Include minimal, contemporary furniture that complements the flooring. Use natural lighting to highlight the floor's texture and color. Photorealistic style, 8k quality."
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    description: 'Contemporary kitchen with the specified flooring',
    promptTemplate: "Create a contemporary kitchen design featuring {floorType} flooring as the primary design element. The floor should be prominently displayed, covering 35% of the composition. Include sleek countertops, cabinets, and appliances that harmonize with the flooring. Natural lighting, wide-angle perspective, photorealistic rendering, 8k resolution."
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    description: 'Serene bedroom with the specified flooring',
    promptTemplate: "Design a serene bedroom space showcasing {floorType} flooring as the main visual element. The floor should occupy 40% of the frame. Include essential bedroom furniture in neutral tones that complement the flooring. Soft, natural lighting to emphasize floor texture. Photorealistic style, 8k quality."
  },
  {
    id: 'office',
    name: 'Office',
    description: 'Professional office space with the specified flooring',
    promptTemplate: "Generate a professional office space with {floorType} flooring as the key design feature. Floor should cover 35% of the image. Include minimal office furniture and decor that enhances the flooring's impact. Natural lighting, wide-angle view, photorealistic rendering, 8k resolution."
  }
];

export const useImageGeneration = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [floorType, setFloorType] = useState<string>('hardwood');
  const [images, setImages] = useState<ImageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState('living-room');
  const [customPrompt, setCustomPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Handle file upload
  const handleUpload = useCallback((file: File | null) => {
    if (!file) {
      setUploadedImage(null);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle image generation
  const handleGenerate = useCallback(async (prompt: string) => {
    if (!prompt) {
      setError("Please provide a prompt for image generation");
      return [];
    }
    
    setError(null);
    setIsLoading(true);
    setProgress(0);

    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('User not authenticated');
        throw new Error('User not authenticated');
      }

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 5;
          if (newProgress >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return newProgress;
        });
      }, 500);

      // If a reference image is uploaded, use it with OpenAI's /images/edits endpoint
      let generatedImages: ImageType[] = [];
      if (uploadedImage) {
        const { generateImageEditWithReference } = await import('../../../services/apiService');
        generatedImages = await generateImageEditWithReference({
          prompt,
          imageBase64: uploadedImage
        });
      } else {
        generatedImages = await generateImages({
          prompt,
          n: 1,
          size: '1024x1536',
          quality: 'medium'
        });
      }

      // Finalize progress
      clearInterval(progressInterval);
      setProgress(100);

      // Check if we have any valid images
      if (!generatedImages || generatedImages.length === 0) {
        setError("No valid images were generated. Please try again with a different prompt.");
        return [];
      }

      // Create image objects - but don't upload to Cloudinary yet
      // This will happen when user clicks the approve button
      const newImages = generatedImages.map(image => {
        if (!image.url) {
          console.warn("Generated image is missing URL, skipping");
          return null;
        }
        
        const style = selectedPreset === 'custom' ? 'custom' : selectedPreset;
        
        return {
          ...image,
          style,
          prompt
        };
      }).filter(Boolean) as ImageType[]; // Filter out null values and cast to ImageType[]
      
      // Only add valid images to the collection
      if (newImages.length > 0) {
        setImages(prev => [...newImages, ...prev]);
      } else {
        setError("No valid images were generated. Please try again with a different prompt.");
        return [];
      }
      
      return newImages;
    } catch (error: any) {
      console.error('Error generating images:', error);
      setError(error.message || 'Error generating images');
      return [];
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 500);
    }
  }, [selectedPreset, uploadedImage]);

  // Handle regenerating a specific image
  const handleRegenerateImage = useCallback(async (index: number) => {
    const imageToRegenerate = images[index];
    if (!imageToRegenerate) return;
    
    const prompt = imageToRegenerate.prompt || '';
    if (!prompt) {
      setError('Cannot regenerate image without the original prompt');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Use the same generation function to create a new image
      const newImages = await handleGenerate(prompt);
      
      if (newImages && newImages.length > 0) {
        // Replace the image at the specified index
        const updatedImages = [...images];
        updatedImages[index] = newImages[0];
        setImages(updatedImages);
      }
    } catch (error) {
      console.error('Error regenerating image:', error);
      setError('Failed to regenerate image');
    } finally {
      setIsLoading(false);
    }
  }, [images, handleGenerate]);

  return {
    uploadedImage,
    floorType,
    setFloorType,
    images,
    isLoading,
    progress,
    error,
    selectedPreset,
    setSelectedPreset,
    customPrompt,
    setCustomPrompt,
    presetTemplates,
    handleUpload,
    handleGenerate,
    handleRegenerateImage,
    setError
  };
};