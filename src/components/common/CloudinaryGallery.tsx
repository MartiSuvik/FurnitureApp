import React, { useState, useEffect } from 'react';
import { Download, Trash2, Play, Image as ImageIcon, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { ImageType } from '../../modules/ImageGeneration/types';
import { VideoType } from '../../modules/VideoCreation/types';
import { getImages, deleteImage } from '../../services/imageService';
import { supabase } from '../../services/supabaseClient';

interface GalleryProps {
  type: 'image' | 'video';
  refreshTrigger?: number; // Optional prop to trigger refresh
  onUseInVideo?: (image: ImageType) => void; // New optional callback
}

const CloudinaryGallery: React.FC<GalleryProps> = ({ type, refreshTrigger, onUseInVideo }) => {
  const [items, setItems] = useState<(ImageType | VideoType)[]>([]);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const pageSize = 12;

  useEffect(() => {
    loadGalleryItems();
  }, [page, refreshTrigger, type]);

  const validateUrl = async (url: string) => {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      return res.ok;
    } catch {
      return false;
    }
  };

  const loadGalleryItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }
      const result = await getImages(user.id, page, pageSize);
      if (result) {
        const filteredItems = type 
          ? result.images.filter(item => {
              const itemType = (item as any).type || ((item as any).thumbnail ? 'video' : 'image');
              return itemType === type;
            })
          : result.images;
        // Validate URLs in parallel (max 5 at a time)
        const concurrency = 5;
        let validItems: typeof filteredItems = [];
        for (let i = 0; i < filteredItems.length; i += concurrency) {
          const chunk = filteredItems.slice(i, i + concurrency);
          const results = await Promise.all(chunk.map(item => validateUrl(type === 'video' ? (item as any).url : (item as any).url)));
          validItems = validItems.concat(chunk.filter((_, idx) => results[idx]));
        }
        setItems(validItems);
        setTotalPages(result.pagination.totalPages || 1);
      } else {
        setError('Failed to load gallery items');
      }
    } catch (error) {
      console.error('Error loading gallery items:', error);
      setError('An error occurred while loading gallery items');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    setIsDeleting(id);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('User not authenticated');
        setIsDeleting(null);
        return;
      }
      
      const success = await deleteImage(id, user.id);
      
      if (success) {
        // Remove the deleted item from the local state
        setItems(prev => prev.filter(item => item.id !== id));
      } else {
        setError('Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      setError('An error occurred while deleting the item');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDownload = (url: string, fileName: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(prev => prev - 1);
    }
  };


  return (
    <div className="card rounded-card shadow-md mb-8">
      <div className="flex items-center mb-6">
        <span className="section-icon">
          {type === 'image' ? <ImageIcon className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        </span>
        <h2 className="heading-lg">
          {type === 'image' ? 'Your Creations' : 'Your Videos'}
        </h2>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 mb-6">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {loading && items.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-8 w-8 text-olive-600 animate-spin mb-4" />
          <p className="text-gray-500 body">Loading gallery...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8">
          <img src="/illustration-empty.svg" alt="No creations" className="empty-illustration" />
          <p className="text-gray-500 body text-center">
            {type === 'image' 
              ? 'No approved images found. Generate images and click the check icon to save them here.' 
              : 'No videos found. Create some videos to see them here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="relative bg-[#FAF9F6] rounded-card overflow-hidden group shadow-sm border border-[#ECE9E2]"
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {isDeleting === item.id && (
                <div className="absolute inset-0 bg-gray-900 bg-opacity-80 z-20 flex items-center justify-center rounded-card">
                  <Loader2 className="h-8 w-8 text-olive-600 animate-spin" />
                </div>
              )}
              {type === 'image' ? (
                <img
                  src={(item as ImageType).url}
                  alt="Generated image"
                  className="w-full h-48 object-cover rounded-t-card"
                />
              ) : (
                <div className="relative">
                  <img
                    src={(item as VideoType).thumbnail}
                    alt="Video thumbnail"
                    className="w-full h-48 object-cover rounded-t-card"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="h-12 w-12 text-olive-600 opacity-70" />
                  </div>
                </div>
              )}
              <div className={`absolute inset-0 bg-olive-200 transition-opacity duration-200 ${
                hoveredItem === item.id ? 'bg-opacity-20' : 'bg-opacity-0'
              } rounded-card`}></div>
              <div className={`absolute inset-0 flex items-center justify-center gap-3 transition-opacity duration-200 ${
                hoveredItem === item.id ? 'opacity-100' : 'opacity-0'
              }`}>
                <button 
                  className="button rounded-btn shadow-sm"
                  onClick={() => handleDownload(
                    type === 'image' ? (item as ImageType).url : (item as VideoType).url,
                    `${type}-${item.id}`
                  )}
                  disabled={isDeleting !== null}
                >
                  <Download className="h-5 w-5" />
                </button>
                {type === 'image' && onUseInVideo && (
                  <button
                    className="button rounded-btn bg-olive-600 text-white hover:bg-olive-700"
                    onClick={() => onUseInVideo(item as ImageType)}
                    disabled={isDeleting !== null}
                    title="Use this image in video creation"
                  >
                    <Play className="h-5 w-5" />
                  </button>
                )}
                <button 
                  className="button rounded-btn bg-[#ECE9E2] text-soft-charcoal hover:bg-[#E0DCCF]"
                  onClick={() => handleDeleteItem(item.id)}
                  disabled={isDeleting !== null}
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2">
                  {type === 'image' ? (
                    <ImageIcon className="h-4 w-4 text-olive-600" />
                  ) : (
                    <Play className="h-4 w-4 text-olive-600" />
                  )}
                  <p className="text-soft-charcoal text-sm truncate">
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
      )}
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center mt-8 gap-2">
          <button
            onClick={handlePrevPage}
            disabled={page === 1 || loading}
            className={`p-2 rounded-md ${
              page === 1 || loading
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <p className="text-white mx-4">
            Page {page} of {totalPages}
          </p>
          
          <button
            onClick={handleNextPage}
            disabled={page === totalPages || loading}
            className={`p-2 rounded-md ${
              page === totalPages || loading
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
      
      {/* Loading indicator for pagination */}
      {loading && items.length > 0 && (
        <div className="flex justify-center mt-4">
          <Loader2 className="h-6 w-6 text-white animate-spin" />
        </div>
      )}
    </div>
  );
};

export default CloudinaryGallery;