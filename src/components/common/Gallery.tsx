import React, { useState } from 'react';
import { Download, Trash2, Play, Image as ImageIcon } from 'lucide-react';
import { ImageType } from '../../modules/ImageGeneration/types';
import { VideoType } from '../../modules/VideoCreation/types';

interface GalleryProps {
  items: (ImageType | VideoType)[];
  type: 'image' | 'video';
}

const Gallery: React.FC<GalleryProps> = ({ items, type }) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="relative bg-gray-800 rounded-lg overflow-hidden group"
          onMouseEnter={() => setHoveredItem(item.id)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          {type === 'image' ? (
            <img
              src={(item as ImageType).url}
              alt="Generated image"
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="relative">
              <img
                src={(item as VideoType).thumbnail}
                alt="Video thumbnail"
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Play className="h-12 w-12 text-white opacity-70" />
              </div>
            </div>
          )}
          
          <div className={`absolute inset-0 bg-gray-900 transition-opacity duration-200 ${
            hoveredItem === item.id ? 'bg-opacity-50' : 'bg-opacity-0'
          }`}></div>
          
          <div className={`absolute inset-0 flex items-center justify-center gap-3 transition-opacity duration-200 ${
            hoveredItem === item.id ? 'opacity-100' : 'opacity-0'
          }`}>
            <button className="bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Download className="h-5 w-5" />
            </button>
            <button className="bg-gray-700 text-white p-2 rounded-full hover:bg-gray-600 transition-colors">
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-3">
            <div className="flex items-center gap-2">
              {type === 'image' ? (
                <ImageIcon className="h-4 w-4 text-gray-400" />
              ) : (
                <Play className="h-4 w-4 text-gray-400" />
              )}
              <p className="text-white text-sm truncate">
                {type === 'image'
                  ? `${(item as ImageType).style} style`
                  : (item as VideoType).name}
              </p>
            </div>
            <p className="text-gray-400 text-xs mt-1">
              {new Date(item.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Gallery;