export interface ImageType {
  id: string;
  url: string;
  prompt?: string;
  style: string;
  createdAt: Date;
}

export interface PresetTemplate {
  id: string;
  name: string;
  description: string;
  promptTemplate: string;
}