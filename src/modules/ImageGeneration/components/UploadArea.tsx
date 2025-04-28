import React, { useCallback, useState } from 'react';
import { Upload, X } from 'lucide-react';

interface UploadAreaProps {
  onUpload: (file: File) => void;
  uploadedImage: string | null;
  floorTypeLabel: string;
  onFloorTypeChange: (floorType: string) => void;
}

const UploadArea: React.FC<UploadAreaProps> = ({ 
  onUpload, 
  uploadedImage, 
  floorTypeLabel, 
  onFloorTypeChange 
}) => {
  const [isDragging, setIsDragging] = useState(false);

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
          onUpload(file);
        }
      }
    },
    [onUpload]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onUpload(e.target.files[0]);
      }
    },
    [onUpload]
  );

  const handleClearImage = useCallback(() => {
    onUpload(null as unknown as File);
  }, [onUpload]);

  return (
    <div className="space-y-4">
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
            >
              <X className="h-5 w-5" />
            </button>
          </>
        ) : (
          <>
            <Upload className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-gray-300 mb-2">
              Drag & drop your floor image here, or click to select
            </p>
            <p className="text-gray-400 text-sm">
              Supported formats: JPEG, PNG, WebP
            </p>
          </>
        )}
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileChange}
          accept="image/*"
        />
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
          />
        </div>
      )}
    </div>
  );
};

export default UploadArea;