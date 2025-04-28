import { useState, useCallback, useEffect } from 'react';
import { VideoType, VideoOptions } from '../types';
import { ImageType } from '../../ImageGeneration/types';
import { getLatestUserImages } from '../../../services/imageService';
import axios from 'axios';

const RUNWAY_API_URL = 'http://localhost:4000/api';

export const useVideoCreation = () => {
  const [sourceImages, setSourceImages] = useState<ImageType[]>([]);
  const [selectedSourceImages, setSelectedSourceImages] = useState<string[]>([]);
  const [generatedVideos, setGeneratedVideos] = useState<VideoType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [options, setOptions] = useState<VideoOptions>({});
  const [error, setError] = useState<string | null>(null);

  // Fetch real images from backend
  useEffect(() => {
    const validateUrl = async (url: string) => {
      try {
        const res = await fetch(url, { method: 'HEAD' });
        return res.ok;
      } catch {
        return false;
      }
    };
    const fetchImages = async () => {
      setIsLoading(true);
      try {
        const { supabase } = await import('../../../services/supabaseClient');
        const { data } = await supabase.auth.getUser();
        const userId = data.user?.id;
        if (!userId) return;
        const images = await getLatestUserImages(userId, 12);
        // Only include images that exist on Cloudinary
        const validImages: ImageType[] = [];
        for (const img of images) {
          if (await validateUrl(img.url)) {
            validImages.push(img);
          }
        }
        setSourceImages(validImages);
      } finally {
        setIsLoading(false);
      }
    };
    fetchImages();
  }, []);

  const handleSourceSelection = useCallback((id: string) => {
    setSelectedSourceImages((prev) => {
      if (prev.includes(id)) {
        return prev.filter((imageId) => imageId !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  const handleOptionChange = useCallback((option: string, value: string | number) => {
    setOptions((prev) => ({
      ...prev,
      [option]: value,
    }));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (selectedSourceImages.length === 0) return;
    setIsLoading(true);
    setProgress(0);
    setError(null);
    try {
      const image = sourceImages.find(img => img.id === selectedSourceImages[0]);
      if (!image) throw new Error('No image selected');
      const prompt = (options.prompt && options.prompt.trim().length > 0)
        ? options.prompt
        : 'A documentary about the room as the camera slowly pans across the room. Camera stays in the same place.';
      const image_url = image.url;
      // 1. Submit the job to backend (fal.ai)
      const response = await axios.post(
        `${RUNWAY_API_URL}/image-to-video`,
        { prompt, image_url }
      );
      const { requestId } = response.data as { requestId: string };
      let status = 'PENDING';
      let videoUrl = '';
      setProgress(10);
      // 2. Poll for status and result
      while (status !== 'COMPLETED' && status !== 'FAILED') {
        await new Promise(res => setTimeout(res, 2000));
        const poll = await axios.get(
          `${RUNWAY_API_URL}/task/${requestId}`
        );
        const pollData = poll.data as {
          status: string;
          video?: { url: string };
          error?: string;
        };
        status = pollData.status;
        setProgress(p => Math.min(p + 10, 95));
        if (status === 'COMPLETED') {
          videoUrl = pollData.video?.url || '';
          break;
        }
        if (status === 'FAILED') {
          setError(pollData.error || 'Video generation failed.');
          break;
        }
      }
      setProgress(100);
      if (videoUrl) {
        setGeneratedVideos([{ id: requestId, name: 'FAL Video', url: videoUrl, thumbnail: image.url, duration: options.duration ?? 0, format: 'mp4', createdAt: new Date() }, ...generatedVideos]);
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  }, [selectedSourceImages, options, sourceImages, generatedVideos]);

  return {
    sourceImages,
    setSourceImages,
    generatedVideos,
    selectedSourceImages,
    setSelectedSourceImages,
    isLoading,
    progress,
    options,
    error,
    handleSourceSelection,
    handleOptionChange,
    handleGenerate,
  };
};