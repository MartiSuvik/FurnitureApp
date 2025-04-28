/*
  # Create images table for storing Cloudinary image metadata

  1. New Tables
    - `images`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `cloudinary_id` (text, unique)
      - `public_id` (text)
      - `url` (text)
      - `secure_url` (text)
      - `format` (text)
      - `width` (integer)
      - `height` (integer)
      - `bytes` (integer)
      - `resource_type` (text)
      - `tags` (text[])
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `type` (text)
      - `prompt` (text)
      - `style` (text)

  2. Security
    - Enable RLS on `images` table
    - Add policy for authenticated users to insert their own images
    - Add policy for authenticated users to read their own images
    - Add policy for authenticated users to update their own images
    - Add policy for authenticated users to delete their own images
*/

CREATE TABLE IF NOT EXISTS images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  cloudinary_id text UNIQUE NOT NULL,
  public_id text NOT NULL,
  url text NOT NULL,
  secure_url text NOT NULL,
  format text,
  width integer,
  height integer,
  bytes integer,
  resource_type text,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  type text, -- 'image' or 'video'
  prompt text, -- The prompt used to generate the image
  style text -- The style of the generated image
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS images_user_id_idx ON images (user_id);
CREATE INDEX IF NOT EXISTS images_created_at_idx ON images (created_at DESC);

-- Enable Row Level Security
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert their own images"
  ON images
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own images"
  ON images
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own images"
  ON images
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own images"
  ON images
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);