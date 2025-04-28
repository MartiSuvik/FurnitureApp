import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export interface ImageGenerationParams {
  prompt: string;
  n?: number;
  size?: '1024x1536';
  quality?: 'medium';
}

export async function generateImages(params: ImageGenerationParams) {
  try {
    // NOTE: gpt-image-1 only returns base64 JSON by default,
    // so we remove any response_format flag.
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: params.prompt,
      n: params.n || 1,
      size: params.size || "1024x1536",
      quality: params.quality || "medium",
      output_format: "png" // Use output_format for gpt-image-1
    });

    // Basic sanity checks
    if (!response?.data?.length) {
      console.error("Invalid response from OpenAI API:", response);
      return [];
    }

    // Filter out any entries missing b64_json
    const validImages = response.data.filter(
      (item) => item?.b64_json && typeof item.b64_json === "string"
    );

    if (!validImages.length) {
      console.warn("No valid images were generated (missing b64_json).");
      return [];
    }

    // Map each base64 blob into a data-URI
    return validImages.map((item, index) => ({
      id: `image-${Date.now()}-${index}`,
      url: `data:image/png;base64,${item.b64_json}`,
      prompt: params.prompt,
      style: "default",
      createdAt: new Date(),
    }));
  } catch (error) {
    console.error("Error generating images:", error);
    return [];
  }
}

// New: Generate image edit with reference image using OpenAI's /images/edits endpoint
export async function generateImageEditWithReference({ prompt, imageBase64 }: { prompt: string; imageBase64: string; }) {
  try {
    // Convert base64 to Blob
    const base64Data = imageBase64.split(',')[1];
    const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const imageBlob = new Blob([byteArray], { type: mimeType });

    // Prepare form data
    const formData = new FormData();
    formData.append('model', 'gpt-image-1');
    formData.append('prompt', prompt);
    formData.append('image', imageBlob, 'reference.png');
    formData.append('n', '1');
    formData.append('size', '1024x1536');
    formData.append('quality', 'medium');

    // Call OpenAI API directly
    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openai.apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'OpenAI image edit failed');
    }
    const data = await response.json();
    if (!data?.data?.length) return [];
    return data.data.filter((item: any) => item?.b64_json).map((item: any, index: number) => ({
      id: `image-edit-${Date.now()}-${index}`,
      url: `data:image/png;base64,${item.b64_json}`,
      prompt,
      style: 'default',
      createdAt: new Date(),
    }));
  } catch (error) {
    console.error('Error generating image edit with reference:', error);
    return [];
  }
}

// Loading screen tips
export const loadingTips = [
  "Tip: Add specific lighting details to your prompts for more realistic results",
  "Tip: Mention architectural elements for better spatial composition",
  "Tip: Include color temperature preferences for more accurate atmosphere",
  "Tip: Specify camera angles for better perspective control",
  "Tip: Mention materials and textures for enhanced realism"
];

// Get a random tip
export function getRandomTip() {
  return loadingTips[Math.floor(Math.random() * loadingTips.length)];
}