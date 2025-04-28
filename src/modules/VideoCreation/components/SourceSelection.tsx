import React from 'react';
import { CheckCircle } from 'lucide-react';
import { ImageType } from '../../ImageGeneration/types';

interface SourceSelectionProps {
  sourceImages: ImageType[];
  selectedSourceImages: string[];
  onSourceSelect: (id: string) => void;
}

const SourceSelection: React.FC<SourceSelectionProps> = ({
  sourceImages,
  selectedSourceImages,
  onSourceSelect,
}) => {
  if (sourceImages.length === 0) {
    return (
      <div className="h-40 bg-gray-800 bg-opacity-50 rounded-lg flex items-center justify-center mb-6">
        <p className="text-gray-400 text-center px-4">
          Generate images in the Image Generation tab first to use them as video sources
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {sourceImages.map((image) => (
        <div
          key={image.id}
          className={`relative cursor-pointer rounded-lg overflow-hidden group ${
            selectedSourceImages.includes(image.id)
              ? 'ring-2 ring-white'
              : ''
          }`}
          onClick={() => onSourceSelect(image.id)}
        >
          <img
            src={image.url}
            alt="Source image"
            className="w-full h-24 object-cover"
          />
          
          {selectedSourceImages.includes(image.id) && (
            <div className="absolute top-2 right-2">
              <CheckCircle className="h-5 w-5 text-white fill-white" />
            </div>
          )}
          
          <div className={`absolute inset-0 bg-gray-900 ${
            selectedSourceImages.includes(image.id)
              ? 'bg-opacity-30'
              : 'bg-opacity-0 group-hover:bg-opacity-50'
          } transition-opacity`}></div>
        </div>
      ))}
    </div>
  );
};

export default SourceSelection;