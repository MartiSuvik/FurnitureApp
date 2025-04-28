import React, { useState } from 'react';
import { useTabs } from '../../contexts/TabsContext';
import VideoOptions from './components/VideoOptions';
import SourceSelection from './components/SourceSelection';
import VideoPreview from './components/VideoPreview';
import ProgressIndicator from '../../components/common/ProgressIndicator';
import CloudinaryGallery from '../../components/common/CloudinaryGallery';
import { useVideoCreation } from './hooks/useVideoCreation';
import { Play } from 'lucide-react';

const VideoCreation = ({ selectedImageForVideo, onImageUsed }: { selectedImageForVideo: any, onImageUsed: () => void }) => {
  const { activeTab } = useTabs();
  const [galleryRefreshTrigger, setGalleryRefreshTrigger] = useState(0);
  
  const {
    sourceImages,
    setSourceImages,
    selectedSourceImages,
    setSelectedSourceImages,
    generatedVideos,
    isLoading,
    progress,
    handleSourceSelection,
    handleGenerate,
    handleOptionChange,
    options,
  } = useVideoCreation();

  // Add selected image to source images and select it if provided
  React.useEffect(() => {
    if (selectedImageForVideo && !sourceImages.some(img => img.id === selectedImageForVideo.id)) {
      setSourceImages((prev: any) => [selectedImageForVideo, ...prev]);
      setSelectedSourceImages((prev: any) => [selectedImageForVideo.id, ...prev]);
      onImageUsed();
    }
  }, [selectedImageForVideo]);

  const handleSuccessfulGeneration = () => {
    // Refresh the gallery when a new video is successfully generated
    setGalleryRefreshTrigger(prev => prev + 1);
  };

  if (activeTab !== 'video') return null;

  return (
    <div className="animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card mb-8">
          <h2 className="heading-lg section-title flex items-center mb-4">
            <span className="section-icon"><Play className="h-6 w-6" /></span>
            Source Images
          </h2>
          <SourceSelection
            sourceImages={sourceImages}
            selectedSourceImages={selectedSourceImages}
            onSourceSelect={handleSourceSelection}
          />
          <VideoOptions
            options={options}
            onOptionChange={handleOptionChange}
            onGenerate={() => {
              handleGenerate().then(() => {
                handleSuccessfulGeneration();
              });
            }}
            isDisabled={selectedSourceImages.length === 0}
            isLoading={isLoading}
          />
        </div>
        <div className="card mb-8">
          <h2 className="heading-lg section-title flex items-center mb-4">
            <span className="section-icon"><Play className="h-6 w-6" /></span>
            Video Preview
          </h2>
          {isLoading ? (
            <ProgressIndicator progress={progress} />
          ) : (
            <VideoPreview video={generatedVideos[0]} />
          )}
        </div>
      </div>
      
      <div className="card mb-8">
        <h2 className="heading-lg section-title flex items-center mb-4">
          <span className="section-icon"><Play className="h-6 w-6" /></span>
          Video Gallery
        </h2>
        <CloudinaryGallery type="video" refreshTrigger={galleryRefreshTrigger} />
      </div>
    </div>
  );
};

export default VideoCreation;