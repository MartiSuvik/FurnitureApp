export interface VideoType {
  id: string;
  name: string;
  url: string;
  thumbnail: string;
  duration: number;
  format: string;
  createdAt: Date;
}

export interface VideoOptions {
  duration?: number;
  transition?: string;
  format?: string;
  resolution?: string;
  prompt?: string;
}