import React from 'react';
import { Play } from 'lucide-react';
import { VideoOptions as VideoOptionsType } from '../types';

interface VideoOptionsProps {
  options: VideoOptionsType;
  onOptionChange: (option: string, value: string | number) => void;
  onGenerate: () => void;
  isDisabled: boolean;
  isLoading: boolean;
}

const VideoOptions: React.FC<VideoOptionsProps> = ({
  options,
  onOptionChange,
  onGenerate,
  isDisabled,
  isLoading,
}) => {
  return (
    <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 space-y-4">
      <div>
        <label className="block text-white text-sm font-medium mb-2">
          Video Duration (seconds)
        </label>
        <div className="flex items-center gap-3">
          <select
            value={options.duration}
            onChange={(e) => onOptionChange('duration', parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-white"
            disabled={isLoading}
          >
            <option value={5}>5s</option>
            <option value={10}>10s</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-white text-sm font-medium mb-2">
          Resolution
        </label>
        <div className="grid grid-cols-2 gap-2">
          {['1280:720', '720:1280'].map((res) => (
            <button
              key={res}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${
                options.resolution === res
                  ? 'bg-white text-gray-900 font-medium'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => onOptionChange('resolution', res)}
              disabled={isLoading}
            >
              {res}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-white text-sm font-medium mb-2">
          Video Prompt
        </label>
        <textarea
          value={options.prompt || ''}
          onChange={(e) => onOptionChange('prompt', e.target.value)}
          placeholder="A documentary about the room as the camera slowly pans across the room. Camera stays in the same place."
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-white min-h-[60px]"
          disabled={isLoading}
        />
      </div>

      <div className="pt-2">
        <button
          onClick={onGenerate}
          disabled={isDisabled || isLoading}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium transition-colors ${
            isDisabled || isLoading
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Play className="h-5 w-5" />
          <span>{isLoading ? 'Processing...' : 'Generate Video'}</span>
        </button>
      </div>
    </div>
  );
};

export default VideoOptions;