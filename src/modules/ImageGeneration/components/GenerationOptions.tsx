import React, { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { PresetTemplate } from '../types';

interface GenerationOptionsProps {
  onGenerate: (prompt: string) => void;
  selectedPreset: string;
  setSelectedPreset: (presetId: string) => void;
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
  presetTemplates: PresetTemplate[];
  isDisabled: boolean;
  isLoading: boolean;
  floorType: string;
}

const GenerationOptions: React.FC<GenerationOptionsProps> = ({
  onGenerate,
  selectedPreset,
  setSelectedPreset,
  customPrompt,
  setCustomPrompt,
  presetTemplates,
  isDisabled,
  isLoading,
  floorType,
}) => {
  const handleGenerateClick = () => {
    let finalPrompt = '';
    
    if (selectedPreset === 'custom') {
      finalPrompt = customPrompt;
    } else {
      const template = presetTemplates.find(t => t.id === selectedPreset);
      if (template) {
        finalPrompt = template.promptTemplate.replace('{floorType}', floorType || 'wooden');
      }
    }
    
    if (finalPrompt) {
      onGenerate(finalPrompt);
    }
  };

  return (
    <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 space-y-4">
      <div>
        <label className="block text-white text-sm font-medium mb-2">
          Room Type
        </label>
        <div className="grid grid-cols-2 md:grid-cols-2 gap-2 mb-4">
          {presetTemplates.map((preset) => (
            <button
              key={preset.id}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${
                selectedPreset === preset.id
                  ? 'bg-white text-gray-900 font-medium'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setSelectedPreset(preset.id)}
            >
              {preset.name}
            </button>
          ))}
          <button
            className={`px-4 py-2 rounded-md text-sm transition-colors ${
              selectedPreset === 'custom'
                ? 'bg-white text-gray-900 font-medium'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => setSelectedPreset('custom')}
          >
            Custom
          </button>
        </div>
      </div>

      {selectedPreset === 'custom' && (
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Custom Prompt
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Describe your desired interior space with specific details about style, lighting, and focal points"
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-white min-h-[100px]"
          />
        </div>
      )}

      {selectedPreset !== 'custom' && (
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Prompt Preview
          </label>
          <div className="bg-gray-700 rounded-md p-3 text-gray-300 text-sm max-h-[120px] overflow-y-auto">
            {presetTemplates.find(t => t.id === selectedPreset)?.promptTemplate.replace('{floorType}', floorType || 'wooden')}
          </div>
        </div>
      )}

      <div className="pt-2">
        <button
          onClick={handleGenerateClick}
          disabled={isDisabled || isLoading}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium transition-colors ${
            isDisabled || isLoading
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Wand2 className="h-5 w-5" />
          <span>{isLoading ? 'Generating...' : 'Generate Image'}</span>
        </button>
      </div>
    </div>
  );
};

export default GenerationOptions;