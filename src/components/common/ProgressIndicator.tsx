import React, { useState, useEffect } from 'react';
import { getRandomTip } from '../../services/apiService';

interface ProgressIndicatorProps {
  progress: number;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ progress }) => {
  const [tip, setTip] = useState<string>(getRandomTip());

  // Update tip every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTip(getRandomTip());
    }, 8000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-64 bg-gray-800 bg-opacity-50 rounded-lg flex flex-col items-center justify-center p-6">
      <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
        <div
          className="bg-white h-4 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="flex items-center gap-3">
        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
        <p className="text-white font-medium">Processing... {progress}%</p>
      </div>
      <p className="text-gray-400 text-sm mt-2 text-center">
        This may take a few moments depending on the complexity of your request.
      </p>
      <div className="mt-6 bg-gray-700 bg-opacity-50 p-3 rounded-md w-full">
        <p className="text-gray-300 text-sm italic">{tip}</p>
      </div>
    </div>
  );
};

export default ProgressIndicator;