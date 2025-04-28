import React from 'react';
import { Download, PlayCircle } from 'lucide-react';
import { VideoType } from '../types';

interface VideoPreviewProps {
  video: VideoType | undefined;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ video }) => {
  if (!video) {
    return (
      <div className="h-64 bg-gray-800 bg-opacity-50 rounded-lg flex items-center justify-center">
        <p className="text-gray-400">
          Generated videos will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <video
          src={video.url}
          controls
          poster={video.thumbnail}
          className="w-full h-64 object-contain"
        >
          Your browser does not support the video tag.
        </video>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div>
          <p className="text-white font-medium">{video.name}</p>
          <p className="text-gray-400 text-sm">
            {video.duration}s • {video.format.toUpperCase()}
          </p>
        </div>
        <button className="bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors">
          <Download className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default VideoPreview;