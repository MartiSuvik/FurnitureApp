import { Image, Video } from 'lucide-react';
import { useTabs } from '../contexts/TabsContext';

const TabNavigation = () => {
  const { activeTab, setActiveTab } = useTabs();

  return (
    <div className="flex border-b border-gray-300 bg-cream rounded-card p-2 mb-6">
      <button
        className={`tab-${activeTab === 'image' ? 'active' : 'inactive'} flex items-center gap-2 px-6 py-3 font-medium text-lg transition-colors`}
        onClick={() => setActiveTab('image')}
      >
        <Image className="h-5 w-5 section-icon" />
        <span>Image Generation</span>
      </button>
      <button
        className={`tab-${activeTab === 'video' ? 'active' : 'inactive'} flex items-center gap-2 px-6 py-3 font-medium text-lg transition-colors`}
        onClick={() => setActiveTab('video')}
      >
        <Video className="h-5 w-5 section-icon" />
        <span>Video Creation</span>
      </button>
    </div>
  );
};

export default TabNavigation;