import { useState } from 'react';
import { useTabs } from '../../contexts/TabsContext';
import ImageUploader from '../../components/common/ImageUploader';
import GenerationOptions from './components/GenerationOptions';
import PreviewWindow from './components/PreviewWindow';
import ProgressIndicator from '../../components/common/ProgressIndicator';
import CloudinaryGallery from '../../components/common/CloudinaryGallery';
import { useImageGeneration } from './hooks/useImageGeneration';
import { AlertCircle, Image } from 'lucide-react';

const ImageGeneration = ({ onUseInVideo }: { onUseInVideo: (image: any) => void }) => {
  const { activeTab, setActiveTab } = useTabs();
  const [galleryRefreshTrigger, setGalleryRefreshTrigger] = useState(0);
  
  const {
    images,
    uploadedImage,
    floorType,
    setFloorType,
    isLoading,
    progress,
    error,
    handleUpload,
    handleGenerate,
    handleRegenerateImage,
    selectedPreset,
    setSelectedPreset,
    customPrompt,
    setCustomPrompt,
    presetTemplates,
  } = useImageGeneration();

  const handleImageApproved = () => {
    // Refresh the gallery when a new image is successfully approved and uploaded to Cloudinary
    setGalleryRefreshTrigger(prev => prev + 1);
  };

  if (activeTab !== 'image') return null;

  return (
    <div className="animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card mb-8">
          <h2 className="heading-lg section-title flex items-center mb-4">
            <span className="section-icon"><Image className="h-6 w-6" /></span>
            Floor Image
          </h2>
          <ImageUploader 
            onUpload={handleUpload} 
            uploadedImage={uploadedImage} 
            floorTypeLabel={floorType}
            onFloorTypeChange={setFloorType}
            onUploadOnly={true} // Set to true to prevent uploading reference images to Cloudinary
          />
          
          {error && (
            <div className="mt-4 bg-panel border border-red-200 text-red-700 px-4 py-3 rounded-card flex items-start gap-2">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="mt-6">
            <GenerationOptions
              onGenerate={handleGenerate}
              selectedPreset={selectedPreset}
              setSelectedPreset={setSelectedPreset}
              customPrompt={customPrompt}
              setCustomPrompt={setCustomPrompt}
              presetTemplates={presetTemplates}
              isDisabled={!uploadedImage}
              isLoading={isLoading}
              floorType={floorType}
            />
          </div>
        </div>
        <div className="card mb-8">
          <h2 className="heading-lg section-title flex items-center mb-4">
            <span className="section-icon"><Image className="h-6 w-6" /></span>
            Generated Interior
          </h2>
          {isLoading ? (
            <ProgressIndicator progress={progress} />
          ) : (
            <PreviewWindow 
              images={images} 
              onRegenerateImage={handleRegenerateImage}
              onImageApproved={handleImageApproved}
            />
          )}
        </div>
      </div>
      
      <div className="card mb-8">
        <h2 className="heading-lg section-title flex items-center mb-4">
          <span className="section-icon"><Image className="h-6 w-6" /></span>
          Image Gallery
        </h2>
        <CloudinaryGallery
          type="image"
          refreshTrigger={galleryRefreshTrigger}
          onUseInVideo={(image) => {
            setActiveTab('video');
            onUseInVideo(image);
          }}
        />
      </div>
    </div>
  );
};

export default ImageGeneration;